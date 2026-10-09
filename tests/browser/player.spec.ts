import { test, expect } from '@playwright/test';
import { startRuntime } from '../../src/runtime.js';
import { readConfig } from '../../src/config.js';
import type { TraceEvent } from '../../src/domain/trace.js';
import { traceToFlow } from '../../src/analysis/contract.js';
import { RecordingService } from '../../src/services/recording-service.js';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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

test('desktop layout resizes, focuses and remembers preferences without moving playback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await page.locator('#timeline').fill('70');
  await expect(page.locator('.inspector')).toBeHidden();
  await expect(page.locator('#console-panel')).not.toHaveAttribute('open', '');
  const divider = page.getByRole('separator', {
    name: 'Resize execution timeline',
  });
  await divider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(divider).toHaveAttribute('aria-valuenow', '240');
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  const bounds = (await divider.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 60);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 84, bounds.y + 60);
  await page.mouse.up();
  const width = Number(await divider.getAttribute('aria-valuenow'));
  expect(width).toBeGreaterThan(300);
  await page.locator('#toggle-inspector').click();
  await expect(page.locator('.inspector')).toBeVisible();
  await page.locator('#maximize-source').click();
  await expect(page.locator('.inspector')).toBeHidden();
  await expect(page.locator('.trace-panel')).toBeHidden();
  expect(
    (await page.locator('.center-column').boundingBox())!.width,
  ).toBeGreaterThan(1200);
  await page.locator('#maximize-source').click();
  await expect(page.locator('.trace-panel')).toBeVisible();
  await expect(page.locator('.inspector')).toBeVisible();
  await page.locator('#console-panel summary').click();
  await expect(page.locator('#console-output')).toBeVisible();
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await expect(page.locator('.inspector')).toBeVisible();
  await expect(page.locator('#console-output')).toBeVisible();
  await expect(divider).toHaveAttribute('aria-valuenow', String(width));
});

test('tablet layout keeps timeline resizable and source focus available', async ({
  page,
}) => {
  await page.setViewportSize({ width: 690, height: 950 });
  await page.goto(url);
  await page.locator('#timeline').fill('70');
  const divider = page.getByRole('separator', {
    name: 'Resize execution timeline',
  });
  await expect(divider).toBeVisible();
  await divider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(divider).toHaveAttribute('aria-valuenow', '240');
  await page.locator('#toggle-inspector').click();
  await expect(page.locator('.inspector')).toBeVisible();
  await page.locator('#maximize-source').click();
  await expect(page.locator('.trace-panel')).toBeHidden();
  await expect(page.locator('.inspector')).toBeHidden();
  await expect(page.locator('.source-panel')).toBeVisible();
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  await page.locator('#maximize-source').click();
  await expect(page.locator('.trace-panel')).toBeVisible();
  await expect(page.locator('.inspector')).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(690);
});

test('actual Python recording replays across chunks with exact output and reversible source state', async ({
  page,
}) => {
  const recorder = new RecordingService(
    runtime.store,
    runtime.baseUrl,
    realpath,
  );
  try {
    const started = await recorder.run({
      action: 'start',
      language: 'python',
      projectRoot: fileURLToPath(
        new URL('../fixtures/runtime/', import.meta.url),
      ),
      entry: 'main.py',
    });
    let status = started;
    await expect
      .poll(async () => {
        status = await recorder.run({ action: 'status', jobId: started.jobId });
        return status.status;
      })
      .toBe('ready');
    expect(status.complete).toBe(true);
    expect(status.chunks).toBeGreaterThan(1);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(status.url!);
    await expect(page.locator('#evidence-mode')).toHaveText(
      'Recorded execution',
    );
    let maximum = Number(await page.locator('#timeline').getAttribute('max'));
    while (maximum < status.eventCount) {
      await page.locator('#timeline').fill(String(maximum));
      await page.locator('#next').click();
      await expect
        .poll(async () =>
          Number(await page.locator('#timeline').getAttribute('max')),
        )
        .toBeGreaterThan(maximum);
      maximum = Number(await page.locator('#timeline').getAttribute('max'));
    }
    await page.locator('#timeline').fill(String(maximum));
    await expect(page.locator('#console-output')).toHaveText('83845\n');
    await expect(page.locator('#status')).toHaveText('Replay complete');
    // Last event is module return, preceded by newline and text console writes.
    await page.locator('#timeline').fill(String(maximum - 3));
    await expect(page.locator('#console-output')).toHaveText('');
    await expect(page.locator('#source')).toHaveText('main.py');
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '6',
    );
    await expect(page.locator('#local-tree')).toContainText('83845');
    await page.locator('#toggle-inspector').click();
    await page.locator('#tab-state').click();
    await expect(page.locator('#certainty')).toContainText(
      'before this source line',
    );
    await page.locator('#previous').click();
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '4',
    );
    const events: TraceEvent[] = [];
    let chunk = await runtime.store.get(status.sessionId!);
    while (chunk) {
      events.push(...chunk.flow.trace!.events);
      chunk = await runtime.store.next(chunk.id);
    }
    const totalFor = (event: TraceEvent | undefined, callId?: string) => {
      const locals = callId ? event?.locals?.[callId] : undefined;
      return locals &&
        typeof locals === 'object' &&
        'total' in locals &&
        typeof locals.total === 'number'
        ? locals.total
        : undefined;
    };
    const mutation = events.findIndex((event, index) => {
      const callId = event.stack.at(-1);
      const before = totalFor(events[index - 1], callId);
      const after = totalFor(event, callId);
      return (
        typeof before === 'number' &&
        typeof after === 'number' &&
        before !== after
      );
    });
    expect(mutation).toBeGreaterThan(0);
    const frame = events[mutation]!.stack.at(-1);
    const before = totalFor(events[mutation - 1], frame);
    const after = totalFor(events[mutation], frame);
    await page.locator('#timeline').fill(String(mutation + 1));
    await expect(page.locator('#local-tree .field.changed')).toContainText(
      `total: ${before} → ${after}`,
    );
    await page.locator('#previous').click();
    await expect(page.locator('#local-tree')).toContainText(String(before));
    expect(errors).toEqual([]);
  } finally {
    recorder.close();
  }
});

test('recorded interleaved asyncio tasks preserve per-invocation mutations in browser replay', async ({
  page,
}) => {
  const recorder = new RecordingService(
    runtime.store,
    runtime.baseUrl,
    realpath,
  );
  try {
    const started = await recorder.run({
      action: 'start',
      language: 'python',
      projectRoot: fileURLToPath(
        new URL('../fixtures/runtime/', import.meta.url),
      ),
      entry: 'async.py',
    });
    let status = started;
    await expect
      .poll(async () => {
        status = await recorder.run({ action: 'status', jobId: started.jobId });
        return status.status;
      })
      .toBe('ready');
    expect(status.complete).toBe(true);
    const events = (await runtime.store.get(status.sessionId!))!.flow.trace!
      .events;
    const workerB = events.find(
      (event) => event.kind === 'enter' && event.inputs?.name === 'B',
    );
    expect(workerB).toBeDefined();
    const stateValue = (event: TraceEvent) => {
      const own = event.locals?.[workerB!.callId];
      if (!own || typeof own !== 'object' || !('state' in own)) return;
      const state = own.state;
      if (!state || typeof state !== 'object' || !('value' in state)) return;
      return state.value;
    };
    const prior = events.findIndex(
      (event) => event.callId === workerB!.callId && stateValue(event) === 0,
    );
    const resume = events.findIndex(
      (event) =>
        event.callId === workerB!.callId &&
        event.kind === 'resume' &&
        stateValue(event) === 1,
    );
    expect(prior).toBeGreaterThanOrEqual(0);
    expect(resume).toBeGreaterThan(prior + 1);
    expect(events[resume]!.values.task).toEqual(workerB!.values.task);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(status.url!);
    await page.locator('#timeline').fill(String(resume + 1));
    await expect(page.locator('#source')).toHaveText('async.py');
    await expect(page.locator('#local-tree .field.changed')).toContainText(
      'state.value: 0 → 1',
    );
    await page.locator('#timeline').fill(String(prior + 1));
    await expect(page.locator('#local-tree')).toContainText('state.value: 0');
    await page.locator('#timeline').fill(String(events.length));
    await expect(page.locator('#console-output')).toHaveText('A 1\nB 2\n');
    expect(errors).toEqual([]);
  } finally {
    recorder.close();
  }
});

test('keyboard disclosure preserves playback and uses only prepared data', async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await page.locator('#timeline').fill('70');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
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
