import { test, expect } from '@playwright/test';
import { startRuntime } from '../../src/runtime.js';
import { readConfig } from '../../src/config.js';
import { randomUUID } from 'node:crypto';

test('20,000 prepared events support responsive seeking, filtering, and nested detail navigation', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const runtime = await startRuntime({ ...readConfig({}), port: 0 });
  try {
    const size = 20_000;
    const events = Array.from({ length: size }, (_, i) => ({
      id: `event-${i + 1}`,
      kind: i === 0 ? 'enter' : i % 200 === 0 ? 'console' : 'assign',
      callId: 'call-main',
      symbolId: 'main',
      label: `Iteration ${i}`,
      stack: ['call-main'],
      locals: { 'call-main': { iteration: i, sum: i * 2 } },
      source: {
        file: 'large.ts',
        line: (i % 1200) + 1,
        endLine: (i % 1200) + 1,
      },
      values: {},
      certainty: 'mock',
      ...(i % 200 === 0 && i > 0 ? { output: `output ${i}` } : {}),
    }));
    const flow = {
      endpoint: 'main',
      trace: {
        events,
        sourceFiles: {
          'large.ts': Array.from(
            { length: 1200 },
            (_, i) => `const value${i} = ${i};`,
          ).join('\n'),
        },
        diagnostics: [],
        truncated: false,
      },
      steps: events.map((event) => ({
        from: 'main',
        to: 'main',
        dtoName: event.label,
        dtoFields: {},
      })),
    };
    const id = randomUUID();
    await page.route(`**/api/flow/${id}`, (route) =>
      route.fulfill({ json: flow }),
    );
    await page.goto(`${runtime.baseUrl}/flow/${id}`);
    await expect(page.locator('#progress')).toHaveText('0 / 20000', {
      timeout: 30_000,
    });

    const timings = await page.evaluate(() => {
      const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
      const samples: number[] = [];
      for (let n = 0; n < 35; n++) {
        timeline.value = String(10_000 + n);
        const start = performance.now();
        timeline.dispatchEvent(new Event('input', { bubbles: true }));
        samples.push(performance.now() - start);
      }
      return samples.sort((a, b) => a - b);
    });
    console.log(
      `large trace seek p50=${timings[17]!.toFixed(1)}ms p95=${timings[33]!.toFixed(1)}ms`,
    );
    await expect(page.locator('#progress')).toHaveText('10034 / 20000');
    await expect(page.locator('#source-line')).toHaveText('L434');
    await expect(page.locator('#local-tree')).toContainText('20066');

    // Adjacent playback must retain the source window and its gutter controls.
    // Checking node identity catches full-window rebuilds without a flaky clock gate.
    const activeRow = await page.locator('.executing-line').elementHandle();
    await page.locator('#next').click();
    expect(await activeRow!.evaluate((row) => row.isConnected)).toBe(true);
    await expect(page.locator('#source-line')).toHaveText('L435');
    const gutter = page.locator('[data-line="435"] .code-gutter');
    await gutter.click();
    await expect(gutter).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#previous').click();
    await expect(gutter).toHaveAttribute('aria-pressed', 'true');
    await gutter.click();
    await expect(gutter).toHaveAttribute('aria-pressed', 'false');

    await page.locator('#restart').click();
    const disclosure = page.locator('[data-call-id="call-main"]');
    await disclosure.click();
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.event-row')).toHaveCount(150);
    await page.locator('#search').fill('Iteration 19000');
    await expect(page.locator('.event-row')).toHaveCount(1);
    await page.locator('.event-row').click();
    await expect(page.locator('#progress')).toHaveText('19001 / 20000');
    await page.locator('#previous').click();
    await expect(page.locator('#progress')).toHaveText('19000 / 20000');
    await page.locator('#search').fill('');
    await expect(page.locator('.event-row.current')).toHaveCount(1);
    await expect(page.locator('.event-row.current')).toHaveAttribute(
      'data-index',
      '19000',
    );
  } finally {
    await runtime.close();
  }
});
