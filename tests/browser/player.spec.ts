import { test, expect } from '@playwright/test';
import { startRuntime } from '../../src/runtime.js';
import { readConfig } from '../../src/config.js';
import type { TraceEvent } from '../../src/domain/trace.js';
import { traceToFlow } from '../../src/analysis/contract.js';

let runtime: Awaited<ReturnType<typeof startRuntime>>;
let url: string;
test.beforeAll(async () => {
  runtime = await startRuntime({ ...readConfig({}), port: 0 });
  const events: TraceEvent[] = Array.from({ length: 100 }, (_, i) => ({
    id: `event-${i + 1}`,
    kind: i === 0 ? 'enter' : 'console',
    callId: 'call-1',
    symbolId: 'run',
    label: `Line ${i + 1}`,
    source: { file: 'example.ts', line: i + 1, endLine: i + 1 },
    values: {},
    locals: { 'call-1': { i } },
    stack: ['call-1'],
    certainty: 'mock',
    ...(i ? { output: `output ${i}` } : {}),
  }));
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'fixture',
        target: 'run',
        scenario: {},
        events,
        diagnostics: ['Simulated browser fixture'],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {
          'example.ts': Array.from(
            { length: 100 },
            (_, i) => `console.log("line ${i}: ${'long value '.repeat(18)}");`,
          ).join('\n'),
        },
      },
      'run',
    ),
  );
  url = `${runtime.baseUrl}/flow/${session.id}`;
});
test.afterAll(async () => {
  await runtime?.close();
});

test('keyboard disclosure preserves playback and uses only prepared data', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await page.locator('#timeline').fill('70');
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  const disclosure = page.locator('.call-disclosure').first();
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(disclosure).toBeFocused();
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  await expect(page.locator('#console-output')).toContainText('output 69');
  await page.keyboard.press('Space');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  await expect(page.locator('#play')).toHaveAttribute('data-playing', 'false');
  expect(requests).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 820, height: 1180 },
  { width: 390, height: 844 },
]) {
  test(`workspace is usable at ${viewport.width} by ${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await expect(page.locator('#progress')).toHaveText('0 / 100');
    await page.locator('#next').click();
    await expect(page.locator('#progress')).toHaveText('1 / 100');
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
    const play = await page.locator('#play').boundingBox();
    expect(play!.y + play!.height).toBeLessThanOrEqual(viewport.height);
    if (viewport.width < 650) {
      for (const [view, panel] of [
        ['trace', '.trace-panel'],
        ['state', '.inspector'],
        ['console', '.console-panel'],
        ['code', '.source-panel'],
      ] as const) {
        await page.locator(`button[data-mobile-view="${view}"]`).click();
        await expect(page.locator(panel)).toBeVisible();
        await expect(page.locator('#progress')).toHaveText('1 / 100');
        const bounds = await page.locator(panel).boundingBox();
        expect(bounds!.height).toBeGreaterThan(300);
        const dock = await page.locator('.playback-dock').boundingBox();
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(dock!.y + 1);
      }
    }
    expect(errors).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath('workspace.png'),
      fullPage: true,
    });
  });
}

test('mobile state, search, console and keyboard shortcuts preserve the selected event', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await page.locator('#timeline').fill('70');
  await page.locator('button[data-mobile-view="state"]').click();
  await expect(page.locator('#panel-state')).toBeVisible();
  await expect(page.locator('#local-tree')).toContainText('69');
  await page.locator('button[data-mobile-view="console"]').click();
  const output = page.locator('#console-output');
  await expect(output).toContainText('output 69');
  expect((await output.boundingBox())!.height).toBeGreaterThan(250);
  await output.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await output.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0,
  );
  await page.locator('button[data-mobile-view="code"]').click();
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press('/');
  await expect(page.locator('#search')).toBeVisible();
  await expect(page.locator('#search')).toBeFocused();
  await page.locator('#help').click();
  await expect(page.locator('#help-panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-panel')).toBeHidden();
  await expect(page.locator('#progress')).toHaveText('70 / 100');
});
