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

test('recorded nested calls retain independent disclosure during playback and return exact values', async ({
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
      entry: 'nested.py',
    });
    let status = started;
    await expect
      .poll(async () => {
        status = await recorder.run({ action: 'status', jobId: started.jobId });
        return status.status;
      })
      .toBe('ready');
    expect(status.complete).toBe(true);
    const session = await runtime.store.get(status.sessionId!);
    const events = session!.flow.trace!.events;
    const inner = events.find(
      (event) =>
        event.kind === 'enter' &&
        event.source?.file === 'helper.py' &&
        event.stack.length >= 4,
    )!;
    expect(inner).toBeTruthy();
    expect(inner.stack.length).toBeGreaterThanOrEqual(4);
    const parents = inner.stack.slice(0, -1);
    const detailIndex = events.findIndex(
      (event) => event.callId === inner.callId && event.kind === 'statement',
    );
    expect(detailIndex).toBeGreaterThan(0);
    const innerReturn = events.findIndex(
      (event) => event.callId === inner.callId && event.kind === 'return',
    );
    expect(events[innerReturn]!.result).toBe(30);
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
    await page.goto(status.url!);
    await expect(page.locator('#progress')).toHaveText(`0 / ${events.length}`);
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    for (const id of [...parents, inner.callId]) {
      await page.locator(`[data-call-id="${id}"]`).click();
    }
    const detail = page.locator(`.event-row[data-index="${detailIndex + 1}"]`);
    await expect(detail).toBeVisible();
    await page.locator('#play').click();
    await page.clock.runFor(1);
    const position = await page.locator('#progress').textContent();
    const parent = page.locator(`[data-call-id="${parents.at(-1)}"]`);
    await parent.click();
    await expect(detail).toHaveCount(0);
    await expect(page.locator('#play')).toHaveAttribute('data-playing', 'true');
    await expect(page.locator('#progress')).toHaveText(position!);
    await parent.click();
    await expect(detail).toBeVisible();
    await expect(
      page.locator(`[data-call-id="${inner.callId}"]`),
    ).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#play').click();
    await page.locator('#timeline').fill(String(innerReturn + 1));
    await expect(page.locator('.packet')).toContainText('Return: 30');
    await expect(page.locator('#source')).toHaveText('helper.py');
    await page.locator('#next').click();
    await expect(page.locator('#source')).toHaveText('nested.py');
    await page.locator('#timeline').fill(String(events.length));
    await expect(page.locator('#console-output')).toHaveText('30\n');
    await page.locator('#timeline').fill(String(innerReturn + 1));
    await expect(page.locator('#console-output')).toHaveText('');
    const outer = events.find(
      (event) => event.kind === 'enter' && event.callId === parents.at(-2),
    )!;
    await page.locator('#view-mode').selectOption('map');
    await page
      .getByRole('button', {
        name: 'Inspect method ' + outer.symbolId,
        exact: true,
      })
      .click();
    const detailsPanel = page.locator('#method-details');
    await expect(detailsPanel).toBeVisible();
    const childDetails = detailsPanel.locator(
      `details[data-invocation="${inner.callId}"]`,
    );
    await expect(childDetails).toHaveAttribute('open', '');
    await expect(childDetails).toContainText('Return: 30');
    const middleDetails = detailsPanel.locator(
      `details[data-invocation="${parents.at(-1)}"]`,
    );
    await middleDetails.locator(':scope > summary').click();
    await expect(childDetails).toBeHidden();
    await expect(page.locator('#progress')).toHaveText(
      `${innerReturn + 1} / ${events.length}`,
    );
    await middleDetails.locator(':scope > summary').click();
    await expect(childDetails).toBeVisible();
    await expect(childDetails).toHaveAttribute('open', '');
    await detailsPanel
      .locator(`[data-event-index="${detailIndex + 1}"]`)
      .click();
    await expect(page.locator('#source')).toHaveText('helper.py');
    await expect(detailsPanel.locator('[aria-current="step"]')).toHaveAttribute(
      'data-event-index',
      String(detailIndex + 1),
    );
    expect(requests).toEqual([]);
  } finally {
    await recorder.close();
  }
});

test('repeated method invocations can be inspected independently without moving playback', async ({
  page,
}) => {
  const events: TraceEvent[] = [
    {
      id: 'event-1',
      kind: 'enter',
      callId: 'main-call',
      symbolId: 'main',
      label: 'main',
      stack: ['main-call'],
      values: {},
      locals: {},
      certainty: 'mock',
    },
    ...[10, 20].flatMap((result, index): TraceEvent[] => {
      const callId = `worker-${index + 1}`;
      return [
        {
          id: `event-${index * 2 + 2}`,
          kind: 'enter',
          callId,
          parentCallId: 'main-call',
          symbolId: 'worker',
          label: `worker call ${index + 1}`,
          source: { file: 'worker.ts', line: 1, endLine: 1 },
          stack: ['main-call', callId],
          values: {},
          inputs: { input: result },
          locals: {},
          certainty: 'mock',
        },
        {
          id: `event-${index * 2 + 3}`,
          kind: 'return',
          callId,
          symbolId: 'worker',
          label: `return ${result}`,
          source: { file: 'worker.ts', line: 2, endLine: 2 },
          stack: ['main-call', callId],
          values: {},
          result,
          locals: {},
          certainty: 'mock',
        },
      ];
    }),
  ];
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'repeated',
        target: 'main',
        scenario: {},
        events,
        diagnostics: ['Simulated browser fixture'],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {
          'worker.ts': 'function worker(input) {\n  return input;\n}',
        },
      },
      'main',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#view-mode').selectOption('map');
  await page.locator('#timeline').fill('2');
  await page.getByRole('button', { name: 'Inspect method worker' }).click();
  const panel = page.locator('#method-details');
  const selector = page.getByRole('combobox', {
    name: 'Select invocation of worker',
  });
  await expect(selector.locator('option')).toHaveCount(2);
  await expect(selector).toHaveValue('worker-1');
  await expect(
    panel.locator('details[data-invocation="worker-1"]'),
  ).toContainText('Return: 10');
  await selector.focus();
  await selector.selectOption('worker-2');
  await expect(selector).toBeFocused();
  await expect(
    panel.locator('details[data-invocation="worker-2"]'),
  ).toContainText('Return: 20');
  await expect(
    panel.locator('details[data-invocation="worker-1"]'),
  ).toHaveCount(0);
  await expect(page.locator('#progress')).toHaveText('2 / 5');
  await page.locator('#next').click();
  await expect(selector).toHaveValue('worker-2');
  await selector.selectOption('worker-1');
  await expect(
    panel.locator('details[data-invocation="worker-1"]'),
  ).toContainText('Return: 10');
  await expect(page.locator('#progress')).toHaveText('3 / 5');
});

test('method inspector paginates prepared steps without losing keyboard focus or replay state', async ({
  page,
}) => {
  await page.goto(url);
  await page.locator('#view-mode').selectOption('map');
  await page.locator('#timeline').fill('70');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const node = page.getByRole('button', { name: 'Inspect method run' });
  await node.focus();
  await page.keyboard.press('Enter');
  const panel = page.locator('#method-details');
  await expect(panel.locator('.method-event')).toHaveCount(50);
  const more = panel.getByRole('button', { name: 'More prepared steps' });
  await more.focus();
  await page.keyboard.press('Enter');
  await expect(panel.locator('.method-event')).toHaveCount(100);
  await expect(more).toHaveCount(0);
  await expect(panel.locator('.method-event').last()).toBeFocused();
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  await expect(page.locator('#console-output')).toContainText('output 69');
  expect(requests).toEqual([]);
});

test('diagram disclosure supports recursion deeper than 30 nested invocations', async ({
  page,
}) => {
  const depth = 45;
  const ids = Array.from({ length: depth }, (_, i) => `recursive-${i}`);
  const events: TraceEvent[] = [];
  for (let i = 0; i < depth; i++) {
    events.push({
      id: `event-${events.length + 1}`,
      kind: 'enter',
      callId: ids[i]!,
      ...(i ? { parentCallId: ids[i - 1]! } : {}),
      symbolId: 'recurse',
      label: `enter depth ${i + 1}`,
      source: { file: 'recursive.ts', line: 2, endLine: 2 },
      stack: ids.slice(0, i + 1),
      values: {},
      locals: {},
      certainty: 'mock',
    });
  }
  for (let i = depth - 1; i >= 0; i--) {
    events.push({
      id: `event-${events.length + 1}`,
      kind: 'return',
      callId: ids[i]!,
      symbolId: 'recurse',
      label: `return depth ${i + 1}`,
      source: { file: 'recursive.ts', line: 3, endLine: 3 },
      stack: ids.slice(0, i + 1),
      values: {},
      locals: {},
      certainty: 'mock',
      result: depth - i,
    });
  }
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'recursive',
        target: 'recurse',
        scenario: {},
        events,
        diagnostics: ['Simulated recursion fixture'],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {
          'recursive.ts':
            'function recurse(n) {\n  return n ? recurse(n - 1) : 0;\n}',
        },
      },
      'recurse',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#view-mode').selectOption('map');
  await page.locator('#timeline').fill('1');
  await page.getByRole('button', { name: 'Inspect method recurse' }).click();
  const panel = page.locator('#method-details');
  for (let i = 1; i < depth; i++) {
    const child = panel.locator(`details[data-invocation="${ids[i]}"]`);
    await child.locator(':scope > summary').click();
    await expect(child).toHaveAttribute('open', '');
  }
  await expect(
    panel.locator(`details[data-invocation="${ids[depth - 1]}"]`),
  ).toContainText(`return depth ${depth}`);
  await expect(page.locator('#progress')).toHaveText(`1 / ${events.length}`);
  await panel
    .locator(`details[data-invocation="${ids[10]}"] > summary`)
    .click();
  await expect(
    panel.locator(`details[data-invocation="${ids[depth - 1]}"]`),
  ).toBeHidden();
  await panel
    .locator(`details[data-invocation="${ids[10]}"] > summary`)
    .click();
  const closed = await panel
    .locator('details')
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => !(node as HTMLDetailsElement).open)
        .map((node) => node.getAttribute('data-invocation')),
    );
  expect(closed).toEqual([]);
  await expect(
    panel.locator(`details[data-invocation="${ids[depth - 1]}"]`),
  ).toBeVisible();
  await expect(page.locator('#progress')).toHaveText(`1 / ${events.length}`);
});

test('inspection changes preserve the current packet without replaying its animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(url);
  await page.locator('#next').click();
  const packet = await page.locator('.packet').elementHandle();
  const animation = await packet!.evaluateHandle(
    (node) => node.getAnimations()[0],
  );
  expect(await animation.evaluate((value) => Boolean(value))).toBe(true);
  await page.locator('#toggle-inspector').click();
  await page.locator('#bookmark').click();
  await page.locator('#breakpoint').click();
  expect(await packet!.evaluate((node) => node.isConnected)).toBe(true);
  // Finished animations may be removed by the browser; no replacement may start.
  expect(
    await packet!.evaluate(
      (node, previous) =>
        node.getAnimations().every((item) => item === previous),
      animation,
    ),
  ).toBe(true);
  await expect(page.locator('#progress')).toHaveText('1 / 100');
  await page.locator('#next').click();
  expect(await packet!.evaluate((node) => node.isConnected)).toBe(false);
  await expect(page.locator('.packet')).toContainText('Line 2');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#next').click();
  expect(
    await page
      .locator('.packet')
      .evaluate((node) => node.getAnimations().length),
  ).toBe(0);
});

test('Python source colors comments and floor division without changing literal text', async ({
  page,
}) => {
  const source = [
    'def calculate(value):',
    '    return value // 2 # integer division',
    'text = "# <img src=x onerror=alert(1)>"',
  ];
  await page.route('**/api/flow/*', async (route) => {
    const response = await route.fetch();
    const flow = await response.json();
    flow.trace.sourceFiles = { 'example.py': source.join('\n') };
    flow.trace.events.forEach((event: TraceEvent) => {
      event.source = { file: 'example.py', line: 2, endLine: 2 };
    });
    await route.fulfill({ json: flow });
  });
  await page.goto(url);
  await page.locator('#next').click();
  await expect(page.locator('.code-text')).toHaveText(source);
  await expect(page.locator('.token-comment')).toHaveText([
    '# integer division',
  ]);
  await expect(page.locator('.token-keyword')).toHaveText(['def', 'return']);
  await expect(page.locator('.token-string')).toHaveText(
    '"# <img src=x onerror=alert(1)>"',
  );
  await expect(page.locator('#snippet img')).toHaveCount(0);
  await expect(page.locator('.executing-line')).toHaveAttribute(
    'data-line',
    '2',
  );
});

test('multiline source syntax survives virtualized windows and playback', async ({
  page,
}) => {
  const source = Array.from({ length: 710 }, (_, index) => 'line ' + index);
  source[1] = 'description = """start';
  source[674] = 'def fake(): # literal <svg onload=alert(1)>';
  source[680] = 'end""" # actual comment';
  source[684] = 'return 7 # outside';
  await page.route('**/api/flow/*', async (route) => {
    const response = await route.fetch();
    const flow = await response.json();
    flow.trace.sourceFiles = { 'large.py': source.join('\n') };
    flow.trace.events.forEach((event: TraceEvent, index: number) => {
      const line = index === 0 ? 675 : 685;
      event.source = { file: 'large.py', line, endLine: line };
    });
    await route.fulfill({ json: flow });
  });
  await page.goto(url);
  await page.locator('#next').click();
  const literal = page.locator('.code-row[data-line="675"]');
  await expect(literal.locator('.code-text')).toHaveText(source[674]!);
  await expect(literal.locator('.token-string')).toHaveText(source[674]!);
  await expect(literal.locator('.token-comment')).toHaveCount(0);
  const after = page.locator('.code-row[data-line="685"]');
  await expect(after.locator('.token-keyword')).toHaveText('return');
  await expect(after.locator('.token-comment')).toHaveText('# outside');
  await expect(page.locator('#snippet svg')).toHaveCount(0);
  const row = await literal.elementHandle();
  await page.locator('#next').click();
  expect(await row!.evaluate((element) => element.isConnected)).toBe(true);
  await expect(page.locator('.executing-line')).toHaveAttribute(
    'data-line',
    '685',
  );
});

test('desktop layout resizes, focuses and remembers preferences without moving playback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await page.locator('#timeline').fill('70');
  const activeRowIsVisible = await page.evaluate(() => {
    const row = document.querySelector('.event-row.current');
    const list = document.getElementById('event-list');
    if (!row || !list) return false;
    const selected = row.getBoundingClientRect();
    const viewport = list.getBoundingClientRect();
    return selected.top >= viewport.top && selected.bottom <= viewport.bottom;
  });
  expect(activeRowIsVisible).toBe(true);
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
  const savedConsole = await page.evaluate(
    () => JSON.parse(localStorage.getItem('code-anime-layout') ?? '{}').console,
  );
  expect(savedConsole).toBe(true);
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await expect(page.locator('.inspector')).toBeVisible();
  await expect(page.locator('#console-panel')).toHaveAttribute('open', '');
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

test('desktop source and flow share the workspace and retain split preferences', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await page.locator('#timeline').fill('70');
  const source = page.locator('.source-panel');
  const flow = page.locator('#flow-panel');
  await expect(flow).toBeVisible();
  const a = (await source.boundingBox())!;
  const b = (await flow.boundingBox())!;
  expect(Math.abs(a.y - b.y)).toBeLessThan(2);
  expect(a.x + a.width).toBeLessThan(b.x);
  expect(a.height).toBeGreaterThan(450);
  expect(b.height).toBeGreaterThan(450);
  const split = page.getByRole('separator', {
    name: 'Resize source and execution flow',
  });
  await split.focus();
  await page.keyboard.press('ArrowRight');
  await expect(split).toHaveAttribute('aria-valuenow', '60');
  expect((await source.boundingBox())!.width).toBeGreaterThan(a.width);
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  await page.locator('#maximize-flow').click();
  await expect(source).toBeHidden();
  await expect(split).toBeHidden();
  expect((await flow.boundingBox())!.width).toBeGreaterThan(1200);
  await page.locator('#maximize-flow').click();
  await expect(source).toBeVisible();
  await page.locator('#maximize-source').click();
  await expect(flow).toBeHidden();
  expect((await source.boundingBox())!.width).toBeGreaterThan(1200);
  await page.locator('#maximize-source').click();
  await expect(flow).toBeVisible();
  await page.locator('#toggle-flow').click();
  await page.reload();
  await expect(flow).toBeHidden();
  await page.locator('#toggle-flow').click();
  await expect(split).toHaveAttribute('aria-valuenow', '60');
  await expect(page.locator('#progress')).toHaveText('0 / 100');
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
    const firstChunk = await runtime.store.get(status.sessionId!);
    const firstInvocation = firstChunk!.flow.trace!.events.find(
      (event) => event.kind === 'enter',
    )!;
    await page.locator('#view-mode').selectOption('map');
    await page
      .getByRole('button', {
        name: 'Inspect method ' + firstInvocation.symbolId,
      })
      .click();
    const selectedDetails = page.locator(
      `#method-details details[data-invocation="${firstInvocation.callId}"]`,
    );
    await expect(selectedDetails).toBeVisible();
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
    await expect(selectedDetails).toBeVisible();
    await expect(page.locator('#method-details')).toContainText(
      firstInvocation.symbolId,
    );
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
    const awaiting = events.findIndex(
      (event) => event.callId === workerB!.callId && event.kind === 'await',
    );
    const returned = events.findIndex(
      (event) => event.callId === workerB!.callId && event.kind === 'return',
    );
    expect(prior).toBeGreaterThanOrEqual(0);
    expect(awaiting).toBeGreaterThan(prior);
    expect(resume).toBeGreaterThan(prior + 1);
    expect(returned).toBeGreaterThan(resume);
    expect(events[resume]!.values.task).toEqual(workerB!.values.task);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(status.url!);
    await page.locator('#timeline').fill(String(resume + 1));
    await expect(page.locator('#source')).toHaveText('async.py');
    await expect(page.locator('#local-tree .field.changed')).toContainText(
      'state.value: 0 → 1',
    );
    await page.locator('#timeline').fill(String(awaiting + 1));
    await page.locator('#step-over').click();
    await expect(page.locator('#progress')).toHaveText(
      `${resume + 1} / ${events.length}`,
    );
    await page.locator('#timeline').fill(String(awaiting + 1));
    await page.locator('#step-out').click();
    await expect(page.locator('#progress')).toHaveText(
      `${returned + 1} / ${events.length}`,
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
        ['flow', '#flow-panel'],
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

test('mobile flow remains available with a hidden desktop diagram and preserves replay state', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    localStorage.setItem(
      'code-anime-layout',
      JSON.stringify({ diagram: false }),
    ),
  );
  await page.goto(url);
  await page.locator('#timeline').fill('70');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.getByRole('button', { name: 'Flow', exact: true }).click();
  await expect(page.locator('#flow-panel')).toBeVisible();
  await expect(page.locator('.source-panel')).toBeHidden();
  await expect(page.locator('.trace-panel')).toBeHidden();
  await expect(page.locator('.packet')).toContainText('Line 70');
  const canvas = (await page.locator('#canvas').boundingBox())!;
  const packet = (await page.locator('.packet').boundingBox())!;
  expect(packet.x).toBeGreaterThanOrEqual(canvas.x);
  expect(packet.x + packet.width).toBeLessThanOrEqual(canvas.x + canvas.width);
  await page.locator('#next').click();
  await expect(page.locator('.packet')).toContainText('Line 71');
  await page.screenshot({ path: testInfo.outputPath('mobile-flow.png') });
  await page.getByRole('button', { name: 'Code', exact: true }).click();
  await expect(page.locator('#source-line')).toHaveText('L71');
  await page.getByRole('button', { name: 'Flow', exact: true }).click();
  await expect(page.locator('#progress')).toHaveText('71 / 100');
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
