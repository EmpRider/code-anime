import { test, expect } from '@playwright/test';
import { startRuntime } from '../../src/runtime.js';
import { readConfig } from '../../src/config.js';
import { randomUUID } from 'node:crypto';
import { traceToFlow } from '../../src/analysis/contract.js';

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
    const disclosure = page.locator(
      '.call-disclosure[data-call-id="call-main"]',
    );
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

test('stored branching trace supports paged method disclosure and seeks without reanalysis', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const runtime = await startRuntime({ ...readConfig({}), port: 0 });
  try {
    const events: Array<Record<string, unknown>> = [];
    const add = (event: Record<string, unknown>) => {
      events.push({
        id: `event-${events.length + 1}`,
        certainty: 'mock',
        values: {},
        ...event,
      });
    };
    const entry = {
      kind: 'enter',
      callId: 'call-main',
      symbolId: 'main',
      label: 'main()',
      stack: ['call-main'],
      locals: { 'call-main': { result: 0 } },
      source: { file: 'branches.ts', line: 1, endLine: 1 },
    };
    add(entry);
    // One persisted session has a 2,000-event limit; larger traces use linked
    // continuations. Keep this fixture within one session to isolate branching.
    for (let i = 0; i < 300; i++) {
      const callId = `call-${i}`;
      const common = {
        callId,
        parentCallId: 'call-main',
        symbolId: `worker_${i % 120}`,
        stack: ['call-main', callId],
        source: {
          file: 'branches.ts',
          line: (i % 700) + 2,
          endLine: (i % 700) + 2,
        },
        locals: { [callId]: { input: i, result: i * 2 } },
      };
      add({
        ...common,
        kind: 'enter',
        label: `worker(${i})`,
        inputs: { input: i },
      });
      for (let j = 0; j < 3; j++)
        add({
          ...common,
          kind: 'assign',
          label: `compute ${i}:${j}`,
          after: { result: i * 2 + j },
        });
      add({
        ...common,
        kind: 'return',
        label: `return ${i * 2}`,
        result: i * 2,
      });
    }
    add({ ...entry, kind: 'return', label: 'main returns', result: 2_398 });
    const session = await runtime.store.create(
      traceToFlow(
        {
          version: 2,
          provider: 'browser-branching-fixture',
          projectRoot: 'fixture',
          sourceHash: 'branching-fixture',
          target: 'main',
          scenario: {},
          events: events as never[],
          diagnostics: ['Synthetic branching performance fixture'],
          truncated: false,
          filesAnalyzed: 1,
          cacheHits: 0,
          sourceFiles: {
            'branches.ts': Array.from({ length: 750 }, (_, i) =>
              i === 0 ? 'function main() {' : `  const value${i} = ${i};`,
            ).join('\n'),
          },
        },
        'main',
      ),
    );
    let flowRequests = 0;
    await page.route('**/api/flow/*', async (route) => {
      flowRequests++;
      await route.continue();
    });
    await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
    await expect(page.locator('#progress')).toHaveText('0 / 1502', {
      timeout: 30_000,
    });
    const initialRequests = flowRequests;

    const seekTimes = await page.evaluate(() => {
      const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
      return Array.from({ length: 25 }, (_, i) => {
        timeline.value = String(1_000 + i);
        const start = performance.now();
        timeline.dispatchEvent(new Event('input', { bubbles: true }));
        return performance.now() - start;
      }).sort((a, b) => a - b);
    });
    console.log(`branching trace seek p95=${seekTimes[23]!.toFixed(1)}ms`);
    expect(seekTimes[23]).toBeLessThan(350);
    await expect(page.locator('#progress')).toHaveText('1024 / 1502');

    await page.locator('#view-mode').selectOption('map');
    await page.getByRole('button', { name: 'Inspect method main' }).click();
    const methodRoot = page.locator(
      '#method-details details[data-invocation="call-main"]',
    );
    await expect(methodRoot).toHaveAttribute('open', '');
    await expect(methodRoot.locator('.more-method-events')).toHaveCount(1);
    const child = methodRoot.locator('details[data-invocation="call-0"]');
    await expect(child).toHaveCount(1);
    await child.locator('summary').click();
    await expect(child.locator('.method-event')).toHaveCount(5);
    await methodRoot.locator('.more-method-events').first().click();
    await expect(
      methodRoot.locator('details[data-invocation="call-50"]'),
    ).toHaveCount(1);
    await methodRoot.locator('summary').first().click();
    await expect(methodRoot).not.toHaveAttribute('open', '');
    await methodRoot.locator('summary').first().click();
    await expect(methodRoot).toHaveAttribute('open', '');
    await expect(page.locator('#progress')).toHaveText('1024 / 1502');
    expect(flowRequests).toBe(initialRequests);
  } finally {
    await runtime.close();
  }
});

test('five persisted continuations preserve 1,500 invocations and reversible navigation', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const runtime = await startRuntime({ ...readConfig({}), port: 0 });
  try {
    const sourceText = Array.from(
      { length: 950 },
      (_, i) => `const value${i} = ${i};`,
    ).join('\n');
    let previousSessionId: string | undefined;
    let firstSessionId: string | undefined;
    for (let chunkIndex = 0; chunkIndex < 5; chunkIndex++) {
      const events: Array<Record<string, unknown>> = [];
      const append = (event: Record<string, unknown>) =>
        events.push({
          id: `event-${chunkIndex * 1500 + events.length + (chunkIndex ? 2 : 1)}`,
          certainty: 'mock',
          values: {},
          ...event,
        });
      if (chunkIndex === 0)
        append({
          kind: 'enter',
          callId: 'call-main',
          symbolId: 'main',
          label: 'main()',
          stack: ['call-main'],
          source: { file: 'branches.ts', line: 1, endLine: 1 },
          locals: { 'call-main': { completed: 0 } },
        });
      for (let offset = 0; offset < 300; offset++) {
        const index = chunkIndex * 300 + offset;
        const callId = `call-${index}`;
        const common = {
          callId,
          parentCallId: 'call-main',
          symbolId: `worker_${index}`,
          stack: ['call-main', callId],
          source: {
            file: 'branches.ts',
            line: (index % 900) + 2,
            endLine: (index % 900) + 2,
          },
          locals: { [callId]: { input: index, result: index * 2 } },
        };
        append({ ...common, kind: 'enter', label: `worker(${index})` });
        for (let step = 0; step < 3; step++)
          append({
            ...common,
            kind: 'assign',
            label: `compute ${index}:${step}`,
            after: { result: index * 2 + step },
          });
        append({
          ...common,
          kind: 'return',
          label: `return ${index * 2}`,
          result: index * 2,
        });
      }
      if (chunkIndex === 4) {
        append({
          kind: 'console',
          callId: 'call-main',
          symbolId: 'main',
          label: 'print complete',
          stack: ['call-main'],
          output: 'completed 1500 calls\n',
          source: { file: 'branches.ts', line: 1, endLine: 1 },
        });
        append({
          kind: 'return',
          callId: 'call-main',
          symbolId: 'main',
          label: 'main returns',
          stack: ['call-main'],
          result: 1500,
          source: { file: 'branches.ts', line: 1, endLine: 1 },
        });
      }
      // The initial main entry adds one event; IDs stay continuous thereafter.
      const session = await runtime.store.create(
        traceToFlow(
          {
            version: 2,
            provider: 'persisted-continuation-fixture',
            projectRoot: 'fixture',
            sourceHash: 'multi-chunk-fixture',
            target: 'main',
            scenario: {},
            events: events as never[],
            diagnostics: ['Synthetic continuation performance fixture'],
            truncated: chunkIndex < 4,
            filesAnalyzed: 1,
            cacheHits: 0,
            sourceFiles: { 'branches.ts': sourceText },
            simulation: {
              mode: 'ai-mock',
              complete: chunkIndex === 4,
              coverage: 'Synthetic prepared continuation chain',
              evidenceIds: [],
              ...(previousSessionId ? { previousSessionId } : {}),
            },
          },
          'main',
        ),
      );
      firstSessionId ??= session.id;
      previousSessionId = session.id;
    }
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/flow/*', async (route) => {
      requests.push(route.request().url());
      await route.continue();
    });
    await page.goto(`${runtime.baseUrl}/flow/${firstSessionId}`);
    await expect(page.locator('#progress')).toHaveText('0 / 1501');
    let loaded = 1501;
    for (let i = 1; i < 5; i++) {
      await page.locator('#timeline').fill(String(loaded));
      await page.locator('#next').click();
      await expect
        .poll(async () =>
          Number(await page.locator('#timeline').getAttribute('max')),
        )
        .toBeGreaterThan(loaded);
      loaded += i === 4 ? 1502 : 1500;
      await expect(page.locator('#timeline')).toHaveAttribute(
        'max',
        String(loaded),
      );
    }
    expect(loaded).toBe(7503);
    expect(requests).toHaveLength(5);
    const timings = await page.evaluate(() => {
      const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
      return Array.from({ length: 20 }, (_, i) => {
        timeline.value = String(5000 + i);
        const start = performance.now();
        timeline.dispatchEvent(new Event('input', { bubbles: true }));
        return performance.now() - start;
      }).sort((a, b) => a - b);
    });
    console.log(`persisted continuation seek p95=${timings[18]!.toFixed(1)}ms`);
    expect(timings[18]).toBeLessThan(700);
    await page.locator('#view-mode').selectOption('map');
    await page
      .getByRole('button', { name: 'Inspect method worker_1499' })
      .click();
    const finalInvocation = page.locator(
      '#method-details details[data-invocation="call-1499"]',
    );
    await expect(finalInvocation).toHaveAttribute('open', '');
    await expect(finalInvocation.locator('.method-event')).toHaveCount(5);
    await finalInvocation.locator('.method-event').first().click();
    await expect(page.locator('#progress')).toHaveText('7497 / 7503');
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '601',
    );
    await expect(page.locator('#local-tree')).toContainText('1499');
    await finalInvocation.locator('summary').click();
    await expect(page.locator('#progress')).toHaveText('7497 / 7503');
    await page.locator('#timeline').fill('7502');
    await expect(page.locator('#console-output')).toHaveText(
      'completed 1500 calls\n',
    );
    await page.locator('#timeline').fill('1501');
    await expect(page.locator('#console-output')).toHaveText('');
    await expect(page.locator('#progress')).toHaveText('1501 / 7503');
    await page.locator('#timeline').fill('7503');
    await expect(page.locator('#status')).toHaveText('Replay complete');
    expect(requests).toHaveLength(5);
    expect(errors).toEqual([]);
  } finally {
    await runtime.close();
  }
});
