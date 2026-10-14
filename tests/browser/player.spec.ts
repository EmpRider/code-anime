import { test, expect } from '@playwright/test';
import { startRuntime } from '../../src/runtime.js';
import { readConfig } from '../../src/config.js';
import type { TraceEvent } from '../../src/domain/trace.js';
import { traceToFlow } from '../../src/analysis/contract.js';
import { plainTerminalText } from '../../public/terminal-text.js';
import { RecordingService } from '../../src/services/recording-service.js';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

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

test('structural flows give desktop and tablet space to the diagram while retaining source inspection', async ({
  page,
}, testInfo) => {
  const session = await runtime.store.create({
    endpoint: 'structural run',
    steps: [
      { from: 'A.m', to: 'B.m2', dtoName: 'Invoke B.m2', dtoFields: {} },
      { from: 'B.m2', to: 'A.m', dtoName: 'Return result', dtoFields: {} },
    ],
  });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/flow/')) requests.push(request.url());
  });
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
    await expect(page.locator('.center-column')).toHaveClass(
      /source-unavailable/,
    );
    await expect(page.locator('#flow-panel')).toBeVisible();
    await expect(page.locator('.source-panel')).toBeHidden();
    await expect(page.locator('#source-flow-divider')).toBeHidden();
    await expect(page.locator('#inspect-source')).toBeVisible();
    await expect(page.locator('.overview-sparse .overview-entry')).toHaveCount(
      2,
    );
    await expect(page.locator('.overview-route').first()).toHaveText(
      'A.m→B.m2',
    );
    await expect(page.locator('.overview-operation').first()).toHaveText(
      'Invoke B.m2',
    );
    await expect(page.locator('.overview-evidence').first()).toHaveText(
      'unverified',
    );
    const flow = (await page.locator('#flow-panel').boundingBox())!;
    const center = (await page.locator('.center-column').boundingBox())!;
    expect(flow.width).toBeGreaterThan(center.width * 0.95);
    expect(flow.height).toBeGreaterThan(center.height * 0.75);
    const route = (await page
      .locator('.overview-entry')
      .first()
      .boundingBox())!;
    expect(route.width).toBeGreaterThan(Math.min(400, flow.width * 0.6));
    expect(
      Math.abs(route.x + route.width / 2 - (flow.x + flow.width / 2)),
    ).toBeLessThan(20);
    expect(route.y).toBeGreaterThan(flow.y + flow.height * 0.18);
    await page.screenshot({
      path: testInfo.outputPath(`structural-${viewport.width}.png`),
    });
    await page.locator('#next').click();
    await expect(page.locator('#progress')).toHaveText('1 / 2');
    await expect(page.locator('.overview-step.current')).toHaveCount(1);
    await expect(page.locator('.overview-step.current')).toContainText('B.m2');
    await page.locator('#inspect-source').click();
    await expect(page.locator('.source-panel')).toBeVisible();
    await expect(page.locator('#flow-panel')).toBeHidden();
    await page.locator('#maximize-source').click();
    await expect(page.locator('#flow-panel')).toBeVisible();
    await expect(page.locator('#progress')).toHaveText('1 / 2');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow).toBe(false);
    const dock = (await page.locator('#play').boundingBox())!;
    expect(dock.y + dock.height).toBeLessThanOrEqual(viewport.height);
  }
  // Two page loads above; the layout and focus controls should request no analysis.
  expect(requests).toHaveLength(2);
});

test('a source-less mobile flow opens on Flow but keeps Code and playback accessible', async ({
  page,
}, testInfo) => {
  const session = await runtime.store.create({
    endpoint: 'structural mobile',
    steps: [{ from: 'A.m', to: 'B.m', dtoName: 'Call B', dtoFields: {} }],
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await expect(page.locator('main')).toHaveAttribute(
    'data-mobile-view',
    'flow',
  );
  await expect(page.locator('button[data-mobile-view="flow"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('#flow-panel')).toBeVisible();
  await expect(page.locator('.overview-sparse .overview-route')).toHaveCount(1);
  await expect(page.locator('.overview-route')).toHaveText('A.m→B.m');
  await page.screenshot({ path: testInfo.outputPath('structural-mobile.png') });
  await page.locator('#next').click();
  await page.locator('button[data-mobile-view="code"]').click();
  await expect(page.locator('.source-panel')).toBeVisible();
  await expect(page.locator('#progress')).toHaveText('1 / 1');
  await page.locator('button[data-mobile-view="flow"]').click();
  await expect(page.locator('#flow-panel')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test('long structural paths retain compact rows without a misleading runtime diagram', async ({
  page,
}) => {
  const session = await runtime.store.create({
    endpoint: 'structural chain',
    steps: Array.from({ length: 8 }, (_, i) => ({
      from: `Service${i}.run`,
      to: `Service${i + 1}.run`,
      dtoName: `Transition ${i + 1}`,
      dtoFields: {},
    })),
  });
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await expect(page.locator('.flow-overview')).toBeVisible();
  await expect(page.locator('.overview-sparse')).toHaveCount(0);
  const nextPage = page.locator(
    '.overview-pages button[data-overview-page="next"]',
  );
  if (await nextPage.isVisible()) await nextPage.click();
  await expect(page.locator('.overview-step').last()).toContainText(
    'Transition 8',
  );
  await page.locator('.overview-step').last().click();
  await expect(page.locator('#progress')).toHaveText('8 / 8');
  await expect(page.locator('.overview-step.current')).toContainText(
    'Transition 8',
  );
});

test('source excerpts retain the editor and the mobile Code default', async ({
  page,
}) => {
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'excerpt-fixture',
        projectRoot: 'fixture',
        sourceHash: 'excerpt',
        target: 'run',
        scenario: {},
        events: [
          {
            id: 'event-1',
            kind: 'enter',
            callId: 'call-1',
            symbolId: 'run',
            label: 'Inspect excerpt',
            source: { file: 'run.js', line: 1, endLine: 1 },
            snippet: 'function run() { return 1; }',
            values: {},
            stack: ['call-1'],
            certainty: 'mock',
          },
        ],
        diagnostics: [],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {},
      },
      'run',
    ),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await expect(page.locator('.center-column')).not.toHaveClass(
    /source-unavailable/,
  );
  await expect(page.locator('.source-panel')).toBeVisible();
  await expect(page.locator('#source-flow-divider')).toBeVisible();
  await page.locator('#next').click();
  await expect(page.locator('#snippet')).toContainText('return 1');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute(
    'data-mobile-view',
    'code',
  );
  await expect(page.locator('.source-panel')).toBeVisible();
});

test('prepared continuation can reveal original source and restore the split without resetting replay', async ({
  page,
}) => {
  const event = (id: number): TraceEvent => ({
    id: `event-${id}`,
    kind: id === 1 ? 'enter' : 'return',
    callId: 'call-1',
    symbolId: 'run',
    label: `Step ${id}`,
    source: { file: 'run.js', line: id, endLine: id },
    values: {},
    stack: ['call-1'],
    certainty: 'mock',
  });
  const createChunk = (id: number, previousSessionId?: string) =>
    traceToFlow(
      {
        version: 2,
        provider: 'continuation-source-fixture',
        projectRoot: 'fixture',
        sourceHash: 'continuation-source',
        target: 'run',
        scenario: {},
        events: [event(id)],
        diagnostics: [],
        truncated: id === 1,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles:
          id === 1 ? {} : { 'run.js': 'function run() {\n  return 1;\n}' },
        simulation: {
          mode: 'ai-mock',
          complete: id === 2,
          coverage: 'Prepared source arrival fixture',
          evidenceIds: [],
          ...(previousSessionId ? { previousSessionId } : {}),
        },
      },
      'run',
    );
  const first = await runtime.store.create(createChunk(1));
  await runtime.store.create(createChunk(2, first.id));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${runtime.baseUrl}/flow/${first.id}`);
  await expect(page.locator('.source-panel')).toBeHidden();
  await page.locator('#next').click();
  await expect(page.locator('#progress')).toHaveText('1 / 1');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('#next').click();
  await expect(page.locator('#progress')).toHaveText('2 / 2');
  await expect(page.locator('.center-column')).not.toHaveClass(
    /source-unavailable/,
  );
  await expect(page.locator('.source-panel')).toBeVisible();
  await expect(page.locator('#source-flow-divider')).toBeVisible();
  await expect(page.locator('#snippet')).toContainText('return 1');
  expect(requests).toHaveLength(1);
  await page.locator('#previous').click();
  await expect(page.locator('#progress')).toHaveText('1 / 2');
  await expect(page.locator('.source-panel')).toBeVisible();
  expect(requests).toHaveLength(1);
});

test('scenario switching adapts source space without losing split preferences or selected steps', async ({
  page,
}) => {
  const makeTrace = (withSource: boolean) => ({
    version: 2 as const,
    provider: 'scenario-layout-fixture',
    projectRoot: 'fixture',
    sourceHash: 'scenario-layout',
    target: 'run',
    scenario: {},
    events: [
      {
        id: 'event-1',
        kind: 'enter' as const,
        callId: 'call-1',
        symbolId: 'run',
        label: 'Entered run',
        source: { file: 'run.js', line: 1, endLine: 1 },
        values: {},
        stack: ['call-1'],
        certainty: 'mock' as const,
      },
    ],
    diagnostics: [],
    truncated: false,
    filesAnalyzed: 1,
    cacheHits: 0,
    sourceFiles: withSource ? { 'run.js': 'function run() {}' } : {},
  });
  const original = traceToFlow(makeTrace(false), 'run');
  original.baselineTrace = makeTrace(true);
  const session = await runtime.store.create(original);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/flow/')) requests.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await expect(page.locator('.source-panel')).toBeHidden();
  await page.locator('#toggle-inspector').click();
  await page.locator('#tab-context').click();
  await page.locator('#next').click();
  await page.locator('#variant').selectOption('baseline');
  await expect(page.locator('.source-panel')).toBeVisible();
  await expect(page.locator('#source-flow-divider')).toBeVisible();
  await page.locator('#source-flow-divider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#source-flow-divider')).toHaveAttribute(
    'aria-valuenow',
    '60',
  );
  await page.locator('#variant').selectOption('proposed');
  await expect(page.locator('.source-panel')).toBeHidden();
  await expect(page.locator('#progress')).toHaveText('1 / 1');
  await page.locator('#variant').selectOption('baseline');
  await expect(page.locator('.source-panel')).toBeVisible();
  await expect(page.locator('#source-flow-divider')).toHaveAttribute(
    'aria-valuenow',
    '60',
  );
  expect(requests).toHaveLength(1);
});

test('source-line navigation refreshes loaded visits without replacing original source', async ({
  page,
}) => {
  const source = 'function run() {\n  let total = 0;\n  return total;\n}';
  const recorded = (
    id: number,
    kind: TraceEvent['kind'],
    line: number,
  ): TraceEvent => ({
    id: `event-${id}`,
    kind,
    callId: 'call-main',
    symbolId: 'run',
    label: `step ${id}`,
    source: { file: 'run.js', line, endLine: line },
    values: {},
    locals: { 'call-main': { total: id } },
    stack: ['call-main'],
    certainty: 'mock',
  });
  const chunks = [
    [recorded(1, 'enter', 1), recorded(2, 'assign', 2)],
    [recorded(3, 'assign', 2), recorded(4, 'return', 3)],
  ];
  let previousSessionId: string | undefined;
  let firstSessionId = '';
  for (const [index, events] of chunks.entries()) {
    const session = await runtime.store.create(
      traceToFlow(
        {
          version: 2,
          provider: 'source-navigation-fixture',
          projectRoot: 'fixture',
          sourceHash: 'source-navigation',
          target: 'run',
          scenario: {},
          events,
          diagnostics: ['Synthetic continuation fixture'],
          truncated: index === 0,
          filesAnalyzed: 1,
          cacheHits: 0,
          sourceFiles: { 'run.js': source },
          simulation: {
            mode: 'ai-mock',
            complete: index === 1,
            coverage: 'Prepared source visit test',
            evidenceIds: [],
            ...(previousSessionId ? { previousSessionId } : {}),
          },
        },
        'run',
      ),
    );
    firstSessionId ||= session.id;
    previousSessionId = session.id;
  }
  await page.goto(`${runtime.baseUrl}/flow/${firstSessionId}`);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.url().includes('/api/flow/')) requests.push(request.url());
  });
  const row = page.locator('#snippet .code-row[data-line="2"]');
  const jump = row.locator('.code-jump');
  await expect(jump).toHaveAccessibleName(
    'Next recorded execution of line 2 (1 loaded visit)',
  );
  await expect(row.locator('.code-text')).toHaveText('  let total = 0;');
  await row.evaluate((node) => (node.dataset.preserved = 'yes'));
  await jump.press('Enter');
  await expect(page.locator('#progress')).toHaveText('2 / 2');
  await page.locator('#next').click();
  await expect(page.locator('#timeline')).toHaveAttribute('max', '4');
  await expect(page.locator('#progress')).toHaveText('3 / 4');
  await expect(row).toHaveAttribute('data-preserved', 'yes');
  await expect(jump).toHaveAccessibleName(
    'Next recorded execution of line 2 (2 loaded visits)',
  );
  await expect(row.locator('.code-text')).toHaveText('  let total = 0;');
  await jump.press('Enter');
  await expect(page.locator('#progress')).toHaveText('2 / 4');
  await jump.press('Enter');
  await expect(page.locator('#progress')).toHaveText('3 / 4');
  await expect(jump).toBeFocused();
  await jump.press('Shift+Enter');
  await expect(page.locator('#progress')).toHaveText('2 / 4');
  await jump.press('Shift+Space');
  await expect(page.locator('#progress')).toHaveText('3 / 4');
  await jump.click({ modifiers: ['Shift'] });
  await expect(page.locator('#progress')).toHaveText('2 / 4');
  await expect(jump).toHaveAttribute(
    'aria-description',
    /previous recorded visit/,
  );
  expect(requests).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('legacy handoffs show an unverified overview before playback on desktop and mobile', async ({
  page,
}) => {
  const session = await runtime.store.create({
    endpoint: 'Legacy prepared handoffs',
    steps: [
      { from: 'Controller', to: 'Service', dtoName: 'Request', dtoFields: {} },
      { from: 'Service', to: 'Repository', dtoName: 'Lookup', dtoFields: {} },
      { from: 'Repository', to: 'Service', dtoName: 'Result', dtoFields: {} },
    ],
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await expect(page.locator('#progress')).toHaveText('0 / 3');
  await expect(page.locator('#view-mode')).toHaveValue('path');
  await expect(page.locator('.flow-overview')).toContainText(
    'Structural path · unverified',
  );
  await expect(page.locator('.flow-overview')).toContainText(
    'no runtime observations',
  );
  await expect(page.locator('.overview-step')).toHaveCount(3);
  await expect(
    page.locator('.overview-step').first().locator('.overview-route'),
  ).toHaveText('Controller→Service');
  await expect(
    page.locator('.overview-step').first().locator('.overview-operation'),
  ).toHaveText('Request');
  await expect(page.locator('.overview-step').first()).toContainText(
    'unverified',
  );
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('.overview-step[data-event-index="2"]').click();
  await expect(page.locator('#progress')).toHaveText('2 / 3');
  await expect(page.locator('.overview-step.current')).toHaveAttribute(
    'data-event-index',
    '2',
  );
  await expect(page.locator('#evidence-mode')).toHaveText(
    'Static / unverified evidence',
  );
  await page.locator('#restart').click();
  await expect(page.locator('.overview-step.current')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('button[data-mobile-view="flow"]').click();
  await expect(page.locator('.flow-overview')).toBeVisible();
  await expect(page.locator('.overview-step')).toHaveCount(3);
  expect(requests).toEqual([]);
});

test('mobile console history navigates every saved page without changing playback', async ({
  page,
}) => {
  const events: TraceEvent[] = Array.from({ length: 655 }, (_, i) => ({
    id: `event-${i + 1}`,
    kind: 'console',
    symbolId: 'process:output',
    callId: 'process-output',
    label: 'process stdout',
    stack: [],
    values: { task: 'process-output', attribution: 'unresolved' },
    output: `event-${i + 1}\n`,
    certainty: 'observed',
  }));
  events[299]!.output = 'before\x1b[3';
  events[300]!.output = '2mafter\x1b[0m\n';
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'console-history',
        target: 'run',
        scenario: {},
        events,
        diagnostics: [],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {},
      },
      'run',
    ),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('button[data-mobile-view="console"]').click();
  await page.locator('#timeline').fill('655');
  await expect(page.locator('#console-history')).toBeVisible();
  await expect(page.locator('#console-range')).toHaveText(
    '356–655 of 655 events',
  );
  await expect(page.locator('#console-count')).toHaveText('655 events');
  const output = page.locator('#console-output');
  await expect(output).toContainText('event-655');
  expect(
    await output.evaluate((element) =>
      element.textContent?.startsWith('event-356\n'),
    ),
  ).toBe(true);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('#console-older').click();
  await expect(page.locator('#console-range')).toHaveText(
    '56–355 of 655 events',
  );
  expect(
    await output.evaluate((element) =>
      element.textContent?.includes('before\nafter'),
    ),
  ).toBe(true);
  expect(await output.textContent()).not.toContain('\x1b[');
  await page.locator('#console-older').click();
  await expect(page.locator('#console-range')).toHaveText('1–55 of 655 events');
  await expect(page.locator('#console-older')).toBeDisabled();
  await expect(page.locator('#console-newer')).toBeFocused();
  expect(
    await output.evaluate((element) =>
      element.textContent?.startsWith('event-1\n'),
    ),
  ).toBe(true);
  expect((await output.boundingBox())!.height).toBeGreaterThan(200);
  await page.locator('#console-newer').click();
  await expect(page.locator('#console-range')).toHaveText(
    '56–355 of 655 events',
  );
  await page.locator('#console-newer').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#console-range')).toHaveText(
    '356–655 of 655 events',
  );
  await expect(page.locator('#console-older')).toBeFocused();
  await expect(page.locator('#progress')).toHaveText('655 / 655');
  // Seeking can remove history paging altogether. Keep keyboard focus in the
  // still-visible console rather than leaving it in the hidden navigation.
  await page.evaluate(() => {
    const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
    timeline.value = '100';
    timeline.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#console-history')).toBeHidden();
  await expect(page.locator('#console-panel > summary')).toBeFocused();
  await expect(page.locator('#progress')).toHaveText('100 / 655');
  await page.locator('#timeline').fill('400');
  await expect(page.locator('#console-range')).toHaveText(
    '101–400 of 400 events',
  );
  await expect(page.locator('#console-output')).toContainText('event-400');
  expect(requests).toEqual([]);
});

test('separate console source lines remain seekable in the default execution path', async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator('#view-mode')).toHaveValue('path');
  await expect(page.locator('.overview-step')).toHaveCount(6);
  await expect(
    page.locator('.overview-step[data-event-index="2"]'),
  ).toContainText('output 1');
  await expect(
    page.locator('.overview-step[data-event-index="3"]'),
  ).toContainText('output 2');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('.overview-step[data-event-index="3"]').click();
  await expect(page.locator('#progress')).toHaveText('3 / 100');
  await expect(page.locator('#source-line')).toHaveText('L3');
  await page.locator('#timeline').fill('70');
  await expect(page.locator('.overview-step.current')).toHaveAttribute(
    'data-event-index',
    '70',
  );
  await page.locator('#timeline').fill('0');
  await expect(
    page.locator('.overview-step[data-event-index="1"]'),
  ).toBeVisible();
  await expect(page.locator('.overview-step.current')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('tall desktop flow uses available height and keeps paging accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  const entries = page.locator('.overview-step');
  const count = await entries.count();
  expect(count).toBeGreaterThan(6);
  expect(count).toBeLessThanOrEqual(24);
  const pageLabel = page.locator('.overview-pages span');
  await expect(pageLabel).toContainText('1 /');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const later = page.getByRole('button', { name: 'Later →' });
  await later.focus();
  await page.keyboard.press('Enter');
  await expect(later).toBeFocused();
  await expect(pageLabel).toContainText('2 /');
  await expect(entries.first()).not.toHaveAttribute('data-event-index', '1');
  await page.getByRole('button', { name: '← Earlier' }).focus();
  await page.keyboard.press('Enter');
  await expect(later).toBeFocused();
  await expect(pageLabel).toContainText('1 /');
  await page.setViewportSize({ width: 1440, height: 740 });
  await expect(entries).toHaveCount(6);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  expect(requests).toEqual([]);
});

test('source announces the current line and accessible breakpoint state across seeks', async ({
  page,
}) => {
  await page.goto(url);
  await page.locator('#timeline').fill('12');
  await expect(page.locator('#source-line')).toHaveText('L12');
  await expect(page.locator('.code-row[aria-current="location"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('.code-row[aria-current="location"]'),
  ).toHaveAttribute('data-line', '12');
  const breakpoint = page
    .locator('.code-row[data-line="12"]')
    .locator('.code-gutter');
  await expect(breakpoint).toHaveAccessibleName('Set breakpoint at line 12');
  await breakpoint.focus();
  await page.keyboard.press('Enter');
  await expect(breakpoint).toHaveAttribute('aria-pressed', 'true');
  await expect(breakpoint).toHaveAccessibleName('Remove breakpoint at line 12');
  await page.locator('#timeline').fill('13');
  await expect(page.locator('.code-row[aria-current="location"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('.code-row[aria-current="location"]'),
  ).toHaveAttribute('data-line', '13');
  await expect(breakpoint).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#timeline').fill('12');
  await expect(page.locator('.code-row[aria-current="location"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('.code-row[aria-current="location"]'),
  ).toHaveAttribute('data-line', '12');
});

test('source gutter clears an existing step breakpoint on the same source line', async ({
  page,
}) => {
  await page.goto(url);
  await page.locator('#toggle-inspector').click();
  await page.locator('#timeline').fill('12');
  const gutter = page.locator('.code-row[data-line="12"] .code-gutter');
  await page.locator('#breakpoint').click();
  await expect(gutter).toHaveAttribute('aria-pressed', 'true');
  await expect(gutter).toHaveAccessibleName('Remove breakpoint at line 12');

  await gutter.click();
  await expect(gutter).toHaveAttribute('aria-pressed', 'false');
  await expect(gutter).toHaveAccessibleName('Set breakpoint at line 12');
  await expect(page.locator('#breakpoint')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('playback breakpoint control reflects and clears a source-line breakpoint', async ({
  page,
}) => {
  await page.goto(url);
  await page.locator('#toggle-inspector').click();
  await page.locator('#timeline').fill('12');
  const gutter = page.locator('.code-row[data-line="12"] .code-gutter');
  const button = page.locator('#breakpoint');

  await gutter.click();
  await expect(gutter).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAttribute('aria-pressed', 'true');

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(gutter).toHaveAttribute('aria-pressed', 'false');
});

test('source gutter clears individual breakpoints from repeated loop iterations', async ({
  page,
}) => {
  const events: TraceEvent[] = Array.from({ length: 4 }, (_, i) => ({
    id: `event-${i + 1}`,
    kind: i === 0 ? 'enter' : 'statement',
    callId: 'loop-call',
    symbolId: 'loop',
    label: `Iteration ${i + 1}`,
    source: { file: 'loop.ts', line: 2, endLine: 2 },
    values: {},
    stack: ['loop-call'],
    certainty: 'mock',
  }));
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'loop-breakpoints',
        target: 'loop',
        scenario: {},
        events,
        diagnostics: ['Simulated repeated execution fixture'],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: { 'loop.ts': 'function loop() {\n  return 1;\n}' },
      },
      'loop',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#toggle-inspector').click();
  for (const step of [2, 4]) {
    await page.locator('#timeline').fill(String(step));
    await page.locator('#breakpoint').click();
  }
  const gutter = page.locator('.code-row[data-line="2"] .code-gutter');
  await expect(gutter).toHaveAttribute('aria-pressed', 'true');
  await gutter.click();
  await expect(gutter).toHaveAttribute('aria-pressed', 'false');
  for (const step of [2, 4]) {
    await page.locator('#timeline').fill(String(step));
    await expect(page.locator('#breakpoint')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  }
  // A line breakpoint covers every recorded iteration. The playback control
  // at any iteration must reflect and be able to clear that shared stop.
  await gutter.click();
  for (const step of [2, 4]) {
    await page.locator('#timeline').fill(String(step));
    await expect(page.locator('#breakpoint')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  await page.locator('#breakpoint').click();
  await expect(gutter).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#timeline').fill('2');
  await expect(page.locator('#breakpoint')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('manually inspecting another source file starts with its own viewport', async ({
  page,
}) => {
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'manual-source-viewport',
        target: 'A.m',
        scenario: {},
        events: [
          {
            id: 'a-enter',
            kind: 'enter',
            callId: 'a',
            symbolId: 'A.m',
            label: 'A.m',
            source: { file: 'A.ts', line: 1, endLine: 1 },
            values: {},
            stack: ['a'],
            certainty: 'mock',
          },
          {
            id: 'b-enter',
            kind: 'enter',
            callId: 'b',
            parentCallId: 'a',
            symbolId: 'B.m2',
            label: 'B.m2',
            source: { file: 'B.ts', line: 190, endLine: 190 },
            values: {},
            stack: ['a', 'b'],
            certainty: 'mock',
          },
        ],
        diagnostics: ['Simulated source inspection fixture'],
        truncated: false,
        filesAnalyzed: 2,
        cacheHits: 0,
        sourceFiles: Object.fromEntries(
          ['A.ts', 'B.ts'].map((file) => [
            file,
            Array.from(
              { length: 240 },
              (_, i) => `// ${file} line ${i + 1}`,
            ).join('\n'),
          ]),
        ),
      },
      'A.m',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#timeline').fill('2');
  await expect(page.locator('#source')).toHaveText('B.ts');
  await page.locator('#snippet').evaluate((editor) => {
    editor.scrollTop = 1700;
  });
  expect(
    await page.locator('#snippet').evaluate((editor) => editor.scrollTop),
  ).toBeGreaterThan(400);

  await page.locator('#follow').uncheck();
  await page.locator('#source-stack .stack-link').first().click();
  await expect(page.locator('#source')).toHaveText('A.ts');
  await expect(page.locator('#snippet')).toContainText('A.ts line 1');
  expect(
    await page.locator('#snippet').evaluate((editor) => editor.scrollTop),
  ).toBe(0);
  await expect(page.locator('#progress')).toHaveText('2 / 2');
});

test('switching prepared scenarios refreshes original source at the same file path', async ({
  page,
}) => {
  const makeTrace = (value: string, id: string) =>
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: id,
        target: 'run',
        scenario: {},
        events: [
          {
            id: `event-${id}`,
            kind: 'statement',
            callId: 'run',
            symbolId: 'run',
            label: `console.log(${value})`,
            source: { file: 'shared.ts', line: 2, endLine: 2 },
            values: {},
            stack: ['run'],
            certainty: 'mock',
          },
        ],
        diagnostics: ['Prepared comparison fixture'],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {
          'shared.ts': `function run() {\n  console.log(${value});\n}`,
        },
      },
      'run',
    );
  const modified = makeTrace('42', 'modified');
  const baseline = makeTrace('10', 'baseline');
  const session = await runtime.store.create({
    ...modified,
    baselineTrace: baseline.trace,
  });
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#toggle-inspector').click();
  await page.locator('#tab-context').click();
  const editor = page.locator('#snippet');
  await expect(page.locator('#variant')).toBeVisible();
  await expect(editor).toContainText('console.log(42)');
  await page.locator('#timeline').fill('1');
  await expect(editor.locator('.executing-line')).toContainText(
    'console.log(42)',
  );
  await page.locator('#variant').selectOption('baseline');
  await expect(editor.locator('.executing-line')).toHaveCount(0);
  await expect(editor).toContainText('console.log(10)');
  await page.locator('#timeline').fill('1');
  await expect(editor.locator('.executing-line')).toContainText(
    'console.log(10)',
  );
  await page.locator('#variant').selectOption('proposed');
  await expect(editor).toContainText('console.log(42)');
  await expect(editor).not.toContainText('console.log(10)');
});

test('manual inspection resets the viewport when changing virtual windows in one file', async ({
  page,
}) => {
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'manual-virtual-window',
        target: 'A.m',
        scenario: {},
        events: [
          {
            id: 'outer',
            kind: 'enter',
            callId: 'outer',
            symbolId: 'A.m',
            label: 'A.m',
            source: { file: 'shared.ts', line: 12, endLine: 12 },
            values: {},
            stack: ['outer'],
            certainty: 'mock',
          },
          {
            id: 'inner',
            kind: 'enter',
            callId: 'inner',
            parentCallId: 'outer',
            symbolId: 'B.m',
            label: 'B.m',
            source: { file: 'shared.ts', line: 800, endLine: 800 },
            values: {},
            stack: ['outer', 'inner'],
            certainty: 'mock',
          },
        ],
        diagnostics: ['Simulated virtual source inspection fixture'],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {
          'shared.ts': Array.from(
            { length: 950 },
            (_, i) => `// shared.ts line ${i + 1}`,
          ).join('\n'),
        },
      },
      'A.m',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#timeline').fill('2');
  await expect(page.locator('#source')).toHaveText('shared.ts');
  await expect(page.locator('#snippet .code-row').first()).toHaveAttribute(
    'data-line',
    '650',
  );
  await page.locator('#snippet').evaluate((editor) => {
    editor.scrollTop = 1700;
  });
  await page.locator('#follow').uncheck();
  await page.locator('#source-stack .stack-link').first().click();
  await expect(page.locator('#snippet .code-row').first()).toHaveAttribute(
    'data-line',
    '1',
  );
  expect(
    await page.locator('#snippet').evaluate((editor) => editor.scrollTop),
  ).toBe(0);
  await page.locator('#source-stack .stack-link').last().click();
  await expect(page.locator('#snippet .code-row').first()).toHaveAttribute(
    'data-line',
    '650',
  );
  const selectedLineVisible = await page
    .locator('#snippet')
    .evaluate((editor) => {
      const selected = editor.querySelector('[data-line="800"]');
      if (!selected) return false;
      const lineBounds = selected.getBoundingClientRect();
      const editorBounds = editor.getBoundingClientRect();
      return (
        lineBounds.top >= editorBounds.top &&
        lineBounds.bottom <= editorBounds.bottom
      );
    });
  expect(selectedLineVisible).toBe(true);
  await expect(page.locator('#progress')).toHaveText('2 / 2');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.getByRole('button', { name: 'Earlier source lines' }).click();
  await expect(page.locator('#source-range')).toHaveText('349–649 of 950');
  await expect(page.locator('#snippet')).toContainText('shared.ts line 400');
  await expect(page.locator('.executing-line')).toHaveCount(0);
  await expect(page.locator('#progress')).toHaveText('2 / 2');
  // Inspection remains stable through unrelated rendering and reverse seeking.
  await page.locator('#toggle-inspector').click();
  await page.locator('#timeline').fill('1');
  await expect(page.locator('#source-range')).toHaveText('349–649 of 950');
  await page.getByRole('button', { name: 'Earlier source lines' }).click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#source-range')).toHaveText('1–301 of 950');
  await expect(page.locator('#source-resume')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#follow')).toBeChecked();
  await expect(page.locator('.executing-line')).toHaveAttribute(
    'data-line',
    '12',
  );
  await page.locator('#timeline').fill('2');
  await expect(page.locator('.executing-line')).toHaveAttribute(
    'data-line',
    '800',
  );
  await expect(page.locator('#snippet .code-row')).toHaveCount(301);
  await expect(page.locator('#source-later')).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#source-pages')).toBeVisible();
  await page.getByRole('button', { name: 'Earlier source lines' }).click();
  await expect(page.locator('#source-range')).toHaveText('349–649 of 950');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: test.info().outputPath('source-paging-mobile.png'),
  });
  expect(requests).toEqual([]);
});

test('replay retains stack controls and scrolls only the source editor when following', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await page.locator('#timeline').fill('12');
  const stackLink = page.locator('#source-stack .stack-link').first();
  await expect(stackLink).toHaveText('run');
  await stackLink.focus();
  await page.evaluate(() => {
    document
      .querySelector('#source-stack .stack-link')
      ?.setAttribute('data-reused', 'true');
    document
      .querySelector('#frame-list .frame-item')
      ?.setAttribute('data-reused', 'true');
    document.getElementById('next')?.click();
  });
  await expect(page.locator('#progress')).toHaveText('13 / 100');
  await expect(stackLink).toBeFocused();
  await expect(stackLink).toHaveAttribute('data-reused', 'true');
  await expect(page.locator('#frame-list .frame-item').first()).toHaveAttribute(
    'data-reused',
    'true',
  );
  const before = await page.evaluate(() => ({
    page: window.scrollY,
    source: document.getElementById('snippet')!.scrollTop,
  }));
  await page.locator('#timeline').fill('14');
  const adjacent = await page.evaluate(() => ({
    page: window.scrollY,
    source: document.getElementById('snippet')!.scrollTop,
  }));
  expect(adjacent).toEqual(before);
  await page.locator('#timeline').fill('70');
  await expect(page.locator('.executing-line')).toHaveAttribute(
    'data-line',
    '70',
  );
  const after = await page.evaluate(() => ({
    page: window.scrollY,
    source: document.getElementById('snippet')!.scrollTop,
  }));
  expect(after.page).toBe(before.page);
  expect(after.source).toBeGreaterThan(before.source);
  await page.locator('#timeline').fill('0');
  await expect(page.locator('#source-stack .stack-link')).toHaveCount(0);
  await expect(page.locator('#frame-list .frame-item')).toHaveCount(0);
});

test('class/method map pages many caller-only invocations and preserves keyboard navigation', async ({
  page,
}) => {
  const events: TraceEvent[] = [
    {
      id: 'root',
      kind: 'enter',
      symbolId: 'App.run',
      callId: 'root',
      stack: ['root'],
      source: { file: 'app.ts', line: 2, endLine: 2 },
      label: 'enter App.run',
      certainty: 'mock',
      values: {},
      locals: {},
    },
  ];
  for (let index = 0; index < 21; index++) {
    events.push({
      id: `child-${index}`,
      kind: 'enter',
      symbolId: 'Widget.process',
      callId: `child-${index}`,
      // This recorder reports callers only; the parent is still App.run.
      stack: ['root'],
      source: { file: 'widget.ts', line: 2, endLine: 2 },
      label: 'enter Widget.process',
      certainty: 'mock',
      values: {},
      locals: {},
    });
    if (index === 0) {
      events.push({
        id: 'child-0-await',
        kind: 'await',
        symbolId: 'Widget.process',
        callId: 'child-0',
        stack: ['root'],
        source: { file: 'widget.ts', line: 2, endLine: 2 },
        label: 'await child-0',
        certainty: 'mock',
        values: {},
        locals: {},
      });
      continue;
    }
    events.push({
      id: `return-${index}`,
      kind: 'return',
      symbolId: 'Widget.process',
      callId: `child-${index}`,
      stack: ['root'],
      source: { file: 'widget.ts', line: 3, endLine: 3 },
      label: 'return Widget.process',
      certainty: 'mock',
      result: index,
      values: {},
      locals: {},
    });
  }
  events.push(
    {
      id: 'child-0-resume',
      kind: 'resume',
      symbolId: 'Widget.process',
      callId: 'child-0',
      stack: ['root'],
      source: { file: 'widget.ts', line: 2, endLine: 2 },
      label: 'resume child-0',
      certainty: 'mock',
      values: {},
      locals: {},
    },
    {
      id: 'child-0-return',
      kind: 'return',
      symbolId: 'Widget.process',
      callId: 'child-0',
      stack: ['root'],
      source: { file: 'widget.ts', line: 3, endLine: 3 },
      label: 'return child-0',
      certainty: 'mock',
      values: {},
      locals: {},
    },
  );
  events.push({
    id: 'root-return',
    kind: 'return',
    symbolId: 'App.run',
    callId: 'root',
    stack: [],
    source: { file: 'app.ts', line: 3, endLine: 3 },
    label: 'return App.run',
    certainty: 'mock',
    values: {},
    locals: {},
  });
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-method-pages',
        projectRoot: 'fixture',
        sourceHash: 'method-pages',
        target: 'App.run',
        scenario: {},
        events,
        diagnostics: [],
        truncated: false,
        filesAnalyzed: 2,
        cacheHits: 0,
        sourceFiles: {
          'app.ts': 'class App {\n  run() {\n    return 20;\n  }\n}',
          'widget.ts': 'class Widget {\n  process() {\n    return 20;\n  }\n}',
        },
      },
      'App.run',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await expect(page.locator('.overview-method-map')).toContainText(
    '2 groups · 22 calls',
  );
  await expect(page.locator('.method-map-call')).toHaveCount(10);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/flow/')) requests.push(request.url());
  });
  const next = page.locator('[data-method-map-action="next"]');
  await next.click();
  await expect(page.locator('.method-map-pages')).toContainText('2 / 3');
  await expect(page.locator('.method-map-call')).toHaveCount(10);
  await next.click();
  await expect(page.locator('.method-map-pages')).toContainText('3 / 3');
  await expect(page.locator('.method-map-call')).toHaveCount(2);
  await expect(
    page.locator('[data-method-map-action="previous"]'),
  ).toBeFocused();
  await page.locator('.method-map-call[data-call-id="child-20"]').click();
  await expect(page.locator('#progress')).toHaveText('42 / 46');
  await expect(page.locator('#method-details')).toContainText('Widget.process');
  await expect(
    page.locator('.method-map-call[data-call-id="child-20"]'),
  ).toHaveAttribute('aria-current', 'step');
  // child-0 resumes after all the later invocations were entered. Follow must
  // return to its earlier method-map page and highlight its exact identity.
  await page.locator('#timeline').fill('44');
  await expect(page.locator('.method-map-pages')).toContainText('1 / 3');
  await expect(
    page.locator('.method-map-call[data-call-id="child-0"]'),
  ).toHaveAttribute('aria-current', 'step');
  await page.locator('#timeline').fill('1');
  await page.locator('.method-map-call[data-call-id="root"]').click();
  await expect(page.locator('#method-details')).toContainText('Widget.process');
  expect(requests).toHaveLength(0);
});

test('execution path stays synchronized across paging, seeking and view changes', async ({
  page,
}) => {
  const sequence = [
    ['enter', 'A.m', 'a', ['a'], 'A.ts', 2, {}],
    ['call', 'A.m', 'a', ['a'], 'A.ts', 3, { inputs: { x: 10, y: 20 } }],
    [
      'enter',
      'B.m2',
      'b',
      ['a', 'b'],
      'B.ts',
      2,
      { parentCallId: 'a', inputs: { x: 10, y: 20 } },
    ],
    [
      'return',
      'B.m2',
      'b',
      ['a'],
      'B.ts',
      3,
      { parentCallId: 'a', result: 30 },
    ],
    ['assign', 'A.m', 'a', ['a'], 'A.ts', 4, { after: { ret: 30 } }],
    ['console', 'A.m', 'a', ['a'], 'A.ts', 5, { output: '30\n' }],
    ['call', 'A.m', 'a', ['a'], 'A.ts', 3, { inputs: { x: 20, y: 20 } }],
    [
      'enter',
      'B.m2',
      'b2',
      ['a', 'b2'],
      'B.ts',
      2,
      { parentCallId: 'a', inputs: { x: 20, y: 20 } },
    ],
    [
      'return',
      'B.m2',
      'b2',
      ['a'],
      'B.ts',
      3,
      { parentCallId: 'a', result: 40 },
    ],
    ['console', 'A.m', 'a', ['a'], 'A.ts', 5, { output: '40\n' }],
    ['return', 'A.m', 'a', [], 'A.ts', 6, { result: 40 }],
  ] as const;
  const events: TraceEvent[] = sequence.map(
    ([kind, symbolId, callId, stack, file, line, values], index) => ({
      id: `path-${index + 1}`,
      kind,
      symbolId,
      callId,
      stack: [...stack],
      source: { file, line, endLine: line },
      values: {},
      locals: {},
      certainty: 'mock',
      label: `${kind} ${symbolId}`,
      ...values,
    }),
  );
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-path-test',
        projectRoot: 'fixture',
        sourceHash: 'path-fixture',
        target: 'A.m',
        scenario: {},
        events,
        diagnostics: [],
        truncated: false,
        filesAnalyzed: 2,
        cacheHits: 0,
        sourceFiles: {
          'A.ts':
            'class A {\n  m() {\n    B.m2(10, 20);\n    const ret = 30;\n    console.log(ret);\n  }\n}',
          'B.ts': 'class B {\n  m2(x, y) {\n    return x + y;\n  }\n}',
        },
      },
      'A.m',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await expect(page.locator('#progress')).toHaveText('0 / 11');
  await expect(page.locator('#view-mode')).toHaveValue('path');
  await expect(page.locator('.flow-overview')).toBeVisible();
  await expect(page.locator('.overview-step')).toHaveCount(6);
  await expect(page.locator('.overview-method-map')).toContainText(
    '2 groups · 3 calls',
  );
  await expect(page.locator('.method-map-group')).toHaveCount(2);
  await expect(page.locator('.method-map-call')).toHaveCount(3);
  await expect(
    page.locator('.method-map-call[data-call-id="b"]'),
  ).toContainText('← A.m');
  const mapRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/flow/')) mapRequests.push(request.url());
  });
  await page.locator('.method-map-call[data-call-id="b2"]').click();
  await expect(page.locator('#progress')).toHaveText('8 / 11');
  await expect(page.locator('#method-details')).toContainText('B.m2');
  await expect(
    page.locator('.overview-disclosure[data-call-id="b2"]'),
  ).toHaveAttribute('aria-expanded', 'true');
  // The map changed the inspected invocation without rebuilding the list.
  // Its disclosure must still close the selected method on the first click.
  await page.locator('.overview-disclosure[data-call-id="b2"]').click();
  await expect(
    page.locator('.overview-disclosure[data-call-id="b2"]'),
  ).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.overview-disclosure[data-call-id="b2"]').click();
  await expect(
    page.locator('.overview-disclosure[data-call-id="b2"]'),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.overview-method-toggle')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.locator('.overview-method-toggle').click();
  await expect(page.locator('.overview-method-content')).toBeHidden();
  await page.locator('.overview-method-toggle').click();
  await expect(page.locator('.method-map-call')).toHaveCount(3);
  await expect(
    page.locator('.method-map-call[data-call-id="b2"]'),
  ).toHaveAttribute('aria-current', 'step');
  await page.locator('#timeline').fill('0');
  await expect(page.locator('.overview-method-toggle')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(page.locator('.method-map-call')).toHaveCount(3);
  const geometry = await page.evaluate(() => {
    const list = document.querySelector<HTMLElement>('.overview-list')!;
    const map = document.querySelector<HTMLElement>('.overview-method-map')!;
    return {
      listHeight: list.getBoundingClientRect().height,
      separate:
        map.getBoundingClientRect().bottom <= list.getBoundingClientRect().top,
    };
  });
  expect(geometry.separate).toBe(true);
  expect(geometry.listHeight).toBeGreaterThan(45);
  await page.locator('.overview-method-toggle').click();
  await expect(page.locator('.overview-method-content')).toBeHidden();
  expect(mapRequests).toHaveLength(0);
  const firstDisclosure = page.locator(
    '.overview-disclosure[data-call-id="a"]',
  );
  await expect(firstDisclosure).toHaveAttribute('aria-expanded', 'false');
  await firstDisclosure.click();
  await expect(firstDisclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#method-details')).toBeVisible();
  await expect(page.locator('#method-details')).toContainText('A.m');
  await expect(page.locator('#progress')).toHaveText('0 / 11');
  await firstDisclosure.click();
  await expect(page.locator('#method-details')).toBeHidden();
  await expect(page.locator('#progress')).toHaveText('0 / 11');
  await expect(
    page.locator('.overview-step[data-event-index="3"]'),
  ).toContainText('A.m → B.m2');
  // Paired call/entry events use one row, but the caller's call-site event
  // still activates that row before playback enters B.m2.
  await page.locator('#timeline').fill('2');
  await expect(page.locator('.overview-step.current')).toHaveAttribute(
    'data-event-index',
    '3',
  );
  await expect(page.locator('#source')).toHaveText('A.ts');

  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('.overview-step[data-event-index="3"]').click();
  await expect(page.locator('#progress')).toHaveText('3 / 11');
  await expect(page.locator('#source')).toHaveText('B.ts');
  await expect(page.locator('.executing-line')).toHaveAttribute(
    'data-line',
    '2',
  );
  // A followed cross-file call replaces source rows. Preserve keyboard access
  // to the executing line's gutter instead of dropping focus to the document.
  await page.locator('.executing-line .code-gutter').focus();
  await page.evaluate(() => {
    const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
    timeline.value = '5';
    timeline.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#source')).toHaveText('A.ts');
  await expect(page.locator('.executing-line .code-gutter')).toBeFocused();
  await page.locator('#timeline').fill('3');
  await expect(page.locator('.overview-step.current')).toHaveAttribute(
    'data-event-index',
    '3',
  );
  const nestedDisclosure = page.locator(
    '.overview-disclosure[data-call-id="b"]',
  );
  await nestedDisclosure.click();
  await expect(nestedDisclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#method-details')).toContainText('return x + y;');
  await expect(page.locator('#progress')).toHaveText('3 / 11');
  await expect(nestedDisclosure).toBeFocused();

  await page.getByRole('button', { name: 'Later →' }).click();
  await expect(
    page.locator('.overview-step[data-event-index="10"]'),
  ).toBeVisible();
  await page.locator('.overview-step[data-event-index="10"]').click();
  await expect(page.locator('#progress')).toHaveText('10 / 11');
  await expect(page.locator('#console-output')).toHaveText('30\n40\n');
  await expect(page.locator('.overview-step.current')).toHaveAttribute(
    'data-event-index',
    '10',
  );

  // Following a seek across overview pages replaces the focused row. Keep
  // keyboard focus on the new page's active transition, including when the
  // focused control was an invocation disclosure.
  const seekWithOverviewFocus = (position: number) =>
    page.evaluate((step) => {
      const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
      timeline.value = String(step);
      timeline.dispatchEvent(new Event('input', { bubbles: true }));
    }, position);
  await seekWithOverviewFocus(3);
  await page.locator('.overview-step[data-event-index="3"]').focus();
  await seekWithOverviewFocus(10);
  await expect(page.locator('.overview-step.current')).toBeFocused();
  await seekWithOverviewFocus(3);
  await page.locator('.overview-disclosure[data-call-id="b"]').focus();
  await seekWithOverviewFocus(10);
  await expect(page.locator('.overview-step.current')).toBeFocused();

  await page.locator('#follow').uncheck();
  await page.locator('#timeline').fill('3');
  await expect(
    page.locator('.overview-step[data-event-index="3"]'),
  ).toHaveCount(0);
  await page.locator('#follow').check();
  await expect(page.locator('.overview-step.current')).toHaveAttribute(
    'data-event-index',
    '3',
  );
  await page.locator('#view-mode').selectOption('map');
  await expect(page.locator('.flow-overview')).toHaveCount(0);
  await page.locator('#view-mode').selectOption('path');
  await expect(page.locator('.overview-step.current')).toHaveAttribute(
    'data-event-index',
    '3',
  );
  // Replacing one nested invocation with a sibling must invalidate the stack
  // controls even when both stack snapshots have the same depth.
  await page.locator('#timeline').fill('3');
  await expect(page.locator('#source-stack .stack-link')).toHaveCount(2);
  await expect(page.locator('#frame-list .frame-item')).toHaveCount(2);
  await page.evaluate(() => {
    document
      .querySelector('#source-stack .stack-link:last-child')
      ?.setAttribute('data-old-frame', 'b');
    document
      .querySelector('#frame-list .frame-item:last-child')
      ?.setAttribute('data-old-frame', 'b');
  });
  await page.locator('#timeline').fill('8');
  await expect(page.locator('#source')).toHaveText('B.ts');
  await expect(page.locator('#source-stack .stack-link')).toHaveCount(2);
  await expect(page.locator('#frame-list .frame-item')).toHaveCount(2);
  await expect(
    page.locator('#source-stack .stack-link:last-child'),
  ).not.toHaveAttribute('data-old-frame', 'b');
  await expect(
    page.locator('#frame-list .frame-item:last-child'),
  ).not.toHaveAttribute('data-old-frame', 'b');
  // Changing the active invocation rebuilds stack links. Keep focus on its
  // surviving ancestor when the focused invocation has already returned.
  const seekWithStackFocus = (position: number) =>
    page.evaluate((step) => {
      const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
      timeline.value = String(step);
      timeline.dispatchEvent(new Event('input', { bubbles: true }));
    }, position);
  await page.locator('#source-stack .stack-link:last-child').focus();
  await seekWithStackFocus(3);
  await expect(
    page.locator('#source-stack .stack-link:first-child'),
  ).toBeFocused();
  await seekWithStackFocus(8);
  await expect(
    page.locator('#source-stack .stack-link:first-child'),
  ).toBeFocused();
  await page.locator('#toggle-inspector').click();
  await page.locator('#tab-state').click();
  await expect(page.locator('#frame-list')).toBeVisible();
  await page.locator('#frame-list .frame-item:last-child .stack-link').focus();
  await seekWithStackFocus(5);
  await expect(
    page.locator('#frame-list .frame-item:first-child .stack-link'),
  ).toBeFocused();
  await page.locator('#source-stack .stack-link:first-child').focus();
  await seekWithStackFocus(11);
  await expect(page.locator('#play')).toBeFocused();
  await expect(page.locator('#source-stack')).toBeEmpty();
  await expect(page.locator('#frame-list')).toBeEmpty();
  await page.locator('#timeline').fill('5');
  await expect(page.locator('#source-stack .stack-link')).toHaveCount(1);
  await expect(page.locator('#frame-list .frame-item')).toHaveCount(1);
  await page.locator('#source-stack .stack-link').focus();
  await seekWithStackFocus(0);
  await expect(page.locator('#play')).toBeFocused();
  await expect(page.locator('#source-stack')).toBeEmpty();
  await expect(page.locator('#frame-list')).toBeEmpty();
  expect(requests).toEqual([]);
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
    await expect(page.locator('#view-mode')).toHaveValue('path');
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    const innerEnter = events.findIndex(
      (event) => event.callId === inner.callId && event.kind === 'enter',
    );
    await page.locator('#timeline').fill(String(innerEnter + 1));
    await expect(page.locator('.overview-step.current')).toContainText(
      inner.symbolId,
    );
    await expect(page.locator('.overview-step.current')).toContainText(
      'observed',
    );
    await expect(page.locator('#source')).toHaveText('helper.py');
    await page.locator('#timeline').fill(String(innerReturn + 1));
    await expect(page.locator('.overview-step.current')).toContainText('→ 30');
    await page.locator('#timeline').fill('0');
    for (const id of [...parents, inner.callId]) {
      await page.locator(`.call-disclosure[data-call-id="${id}"]`).click();
    }
    const detail = page.locator(`.event-row[data-index="${detailIndex + 1}"]`);
    await expect(detail).toBeVisible();
    await page.locator('#play').click();
    await page.clock.runFor(1);
    const position = await page.locator('#progress').textContent();
    const parent = page.locator(
      `.call-disclosure[data-call-id="${parents.at(-1)}"]`,
    );
    await parent.click();
    await expect(detail).toHaveCount(0);
    await expect(page.locator('#play')).toHaveAttribute('data-playing', 'true');
    await expect(page.locator('#progress')).toHaveText(position!);
    await parent.click();
    await expect(detail).toBeVisible();
    await expect(
      page.locator(`.call-disclosure[data-call-id="${inner.callId}"]`),
    ).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#play').click();
    // The default path is the compact overview; packet assertions exercise
    // the retained detailed Focus view.
    await page.locator('#view-mode').selectOption('focus');
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
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 667 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.locator('button[data-mobile-view="flow"]').click();
      await expect(detailsPanel).toBeVisible();
      await expect(childDetails).toBeVisible();
      const compactDetails = (await detailsPanel.boundingBox())!;
      expect(compactDetails.height).toBeGreaterThanOrEqual(110);
      const compactCanvas = (await page.locator('#canvas').boundingBox())!;
      expect(compactCanvas.height).toBeGreaterThanOrEqual(100);
      await middleDetails.locator(':scope > summary').focus();
      await page.keyboard.press('Enter');
      await expect(childDetails).toBeHidden();
      await page.keyboard.press('Enter');
      await expect(childDetails).toBeVisible();
      await expect(page.locator('#progress')).toHaveText(
        `${detailIndex + 1} / ${events.length}`,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);
      const dock = (await page.locator('.playback-dock').boundingBox())!;
      expect(dock.y + dock.height).toBeLessThanOrEqual(viewport.height);
      const flowPanel = (await page.locator('#flow-panel').boundingBox())!;
      expect(flowPanel.y + flowPanel.height).toBeLessThanOrEqual(dock.y);
    }
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

test('nested-method pagination keeps keyboard focus when the final item is a branch', async ({
  page,
}) => {
  const events: TraceEvent[] = [
    {
      id: 'event-1',
      kind: 'enter',
      callId: 'parent',
      symbolId: 'parent',
      label: 'enter parent',
      source: { file: 'example.ts', line: 1, endLine: 1 },
      stack: ['parent'],
      values: {},
      locals: {},
      certainty: 'mock',
    },
    ...Array.from({ length: 58 }, (_, index): TraceEvent => ({
      id: `event-${index + 2}`,
      kind: 'enter',
      callId: `child-${index}`,
      parentCallId: 'parent',
      symbolId: 'child',
      label: `enter child ${index}`,
      source: { file: 'example.ts', line: 2, endLine: 2 },
      stack: ['parent', `child-${index}`],
      values: {},
      locals: {},
      certainty: 'mock',
    })),
  ];
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'nested-pagination',
        target: 'parent',
        scenario: {},
        events,
        diagnostics: [],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {
          'example.ts': 'function parent() {}\nfunction child() {}',
        },
      },
      'parent',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#view-mode').selectOption('map');
  await page.locator('#timeline').fill('12');
  await page.getByRole('button', { name: 'Inspect method parent' }).click();
  const panel = page.locator('#method-details');
  const more = panel.getByRole('button', { name: 'More prepared steps' });
  await expect(more).toBeVisible();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await more.focus();
  await page.keyboard.press('Enter');
  await expect(more).toHaveCount(0);
  const last = panel.locator('details[data-invocation="child-57"] > summary');
  await expect(last).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    panel.locator('details[data-invocation="child-57"]'),
  ).toHaveAttribute('open', '');
  await expect(page.locator('#progress')).toHaveText('12 / 59');
  expect(requests).toEqual([]);
});

test('manual stepping announces source and evidence without repeating status on layout changes', async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  // Observe status content updates separately from the step announcement.
  await page.evaluate(() => {
    const status = document.getElementById('status')!;
    (window as any).statusUpdates = 0;
    new MutationObserver(() => (window as any).statusUpdates++).observe(
      status,
      {
        childList: true,
        characterData: true,
        subtree: true,
      },
    );
  });
  await page.locator('#next').click();
  await expect(page.locator('#navigation-announcement')).toHaveText(
    'Step 1 of 100: Line 1. example.ts line 1. mock evidence.',
  );
  await page.locator('#next').click();
  await expect(page.locator('#navigation-announcement')).toHaveText(
    'Step 2 of 100: Line 2. example.ts line 2. mock evidence.',
  );
  await page.locator('#toggle-inspector').click();
  await page.locator('#previous').click();
  await expect(page.locator('#navigation-announcement')).toHaveText(
    'Step 1 of 100: Line 1. example.ts line 1. mock evidence.',
  );
  expect(await page.evaluate(() => (window as any).statusUpdates)).toBe(0);
  await page.locator('#restart').click();
  await expect(page.locator('#navigation-announcement')).toHaveText(
    'Restarted. Step 0 of 100.',
  );
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

  // Deep disclosure must remain operable from the narrow, single-panel Flow
  // workspace. Keyboard toggles should preserve both focus and replay position.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Flow', exact: true }).click();
  await expect(panel).toBeVisible();
  const deepCall = panel.locator(
    `details[data-invocation="${ids[depth - 1]}"]`,
  );
  await expect(deepCall).toBeVisible();
  const summary = panel.locator(
    `details[data-invocation="${ids[20]}"] > summary`,
  );
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(deepCall).toBeHidden();
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(deepCall).toBeVisible();
  await expect(summary).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(page.locator('#progress')).toHaveText(`1 / ${events.length}`);
});

test('flow connections retain their DOM across inspection and resize, then invalidate for new routes', async ({
  page,
}) => {
  const events: TraceEvent[] = [
    {
      id: 'route-1',
      kind: 'enter',
      symbolId: 'A.m',
      callId: 'a',
      stack: ['a'],
      values: { from: 'A.m', to: 'A.m' },
      label: 'A.m',
      certainty: 'mock',
    },
    {
      id: 'route-2',
      kind: 'enter',
      symbolId: 'B.m',
      callId: 'b',
      parentCallId: 'a',
      stack: ['a', 'b'],
      values: { from: 'A.m', to: 'B.m' },
      label: 'B.m',
      certainty: 'mock',
    },
    {
      id: 'route-3',
      kind: 'return',
      symbolId: 'B.m',
      callId: 'b',
      stack: ['a'],
      values: { from: 'B.m', to: 'A.m' },
      label: 'return to A.m',
      certainty: 'mock',
    },
  ];
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-connection-test',
        projectRoot: 'fixture',
        sourceHash: 'route-fixture',
        target: 'A.m',
        scenario: {},
        events,
        diagnostics: [],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {},
      },
      'A.m',
    ),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#view-mode').selectOption('map');
  await page.locator('#next').click();
  const firstConnection = await page.locator('.connections').elementHandle();
  const firstPath = await page.locator('.connection-path').elementHandle();
  const originalPath = await page.locator('.connection-path').getAttribute('d');
  const initialWidth = await page
    .locator('.connections')
    .evaluate((node) => node.style.width);

  await page.locator('#toggle-inspector').click();
  await page.locator('#bookmark').click();
  await page.locator('#follow').uncheck();
  expect(await firstConnection!.evaluate((node) => node.isConnected)).toBe(
    true,
  );
  expect(await firstPath!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(page.locator('.connection-path')).toHaveAttribute(
    'd',
    originalPath!,
  );
  await page.setViewportSize({ width: 1250, height: 900 });
  expect(await firstConnection!.evaluate((node) => node.isConnected)).toBe(
    true,
  );
  await expect(page.locator('.connections')).not.toHaveCSS(
    'width',
    initialWidth,
  );
  await page.locator('#view-mode').selectOption('focus');
  expect(await firstConnection!.evaluate((node) => node.isConnected)).toBe(
    true,
  );

  await page.locator('#next').click();
  expect(await firstConnection!.evaluate((node) => node.isConnected)).toBe(
    false,
  );
  await expect(page.locator('.connections')).toHaveCount(1);
  const secondPath = await page.locator('.connection-path').getAttribute('d');
  expect(secondPath).not.toBe(originalPath);
  await page.locator('#view-mode').selectOption('path');
  await expect(page.locator('.connections')).toHaveCount(0);
  await page.locator('#view-mode').selectOption('map');
  await expect(page.locator('.connections')).toHaveCount(1);
  await page.locator('#restart').click();
  await expect(page.locator('.connections')).toHaveCount(0);
});

test('inspection changes preserve the current packet without replaying its animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(url);
  await page.locator('#view-mode').selectOption('focus');
  await page.locator('#next').click();
  const packet = await page.locator('.packet').elementHandle();
  const connection = await page.locator('.connections').elementHandle();
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
  // This fixture has the same route for consecutive steps; only the packet
  // changes, so the connection itself should remain mounted.
  expect(await connection!.evaluate((node) => node.isConnected)).toBe(true);
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

test('multiline Python strings and nested Kotlin comments retain lexical context without altering source', async ({
  page,
}) => {
  const python = [
    'def example():',
    '    description = """',
    '    return # appears inside string',
    '    <img src=x onerror=alert(1)>',
    '    """',
    '    return 30 # actual comment',
  ];
  const kotlin = [
    'fun main() {',
    '  /* outer block',
    '    /* nested return */',
    '    public class // still inside comment',
    '  */',
    '  val message = """',
    '  class // inside raw string',
    '  """',
    '  return',
    '}',
  ];
  for (const [file, lines, activeLine] of [
    ['example.py', python, 6],
    ['example.kt', kotlin, 9],
  ] as const) {
    await page.route('**/api/flow/*', async (route) => {
      const response = await route.fetch();
      const flow = await response.json();
      flow.trace.sourceFiles = { [file]: lines.join('\n') };
      flow.trace.events.forEach((event: TraceEvent) => {
        event.source = { file, line: activeLine, endLine: activeLine };
      });
      await route.fulfill({ json: flow });
    });
    await page.goto(url);
    await page.locator('#next').click();
    await expect(page.locator('.code-text')).toHaveText(lines);
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      String(activeLine),
    );
    if (file === 'example.py') {
      await expect(page.locator('.token-string')).toHaveText([
        '"""',
        '    return # appears inside string',
        '    <img src=x onerror=alert(1)>',
        '    """',
      ]);
      await expect(page.locator('.token-comment')).toHaveText([
        '# actual comment',
      ]);
      await expect(page.locator('.token-keyword')).toHaveText([
        'def',
        'return',
      ]);
    } else {
      await expect(page.locator('.token-comment')).toHaveText([
        '/* outer block',
        '    /* nested return */',
        '    public class // still inside comment',
        '  */',
      ]);
      await expect(page.locator('.token-string')).toHaveText([
        '"""',
        '  class // inside raw string',
        '  """',
      ]);
      await expect(page.locator('.token-keyword')).toHaveText([
        'fun',
        'val',
        'return',
      ]);
    }
    await expect(page.locator('#snippet img')).toHaveCount(0);
    await page.unrouteAll();
  }
});

test('JavaScript template interpolation and Rust raw strings preserve visible source and following code', async ({
  page,
}) => {
  const cases = [
    {
      file: 'example.ts',
      lines: [
        'const text = `start ${',
        '  ({ value: 2 }).value + (true ? 3 : 4)',
        '} end`;',
        'const after = 5; // outside',
      ],
      line: 2,
      keyword: 'true',
      number: '5',
      comment: '// outside',
    },
    {
      file: 'example.rs',
      lines: [
        'let text = r#"// literal"#; let result = 12; // outside',
        'let next = 3;',
      ],
      line: 1,
      keyword: 'let',
      number: '12',
      comment: '// outside',
    },
  ];
  for (const { file, lines, line, keyword, number, comment } of cases) {
    await page.route('**/api/flow/*', async (route) => {
      const response = await route.fetch();
      const flow = await response.json();
      flow.trace.sourceFiles = { [file]: lines.join('\n') };
      flow.trace.events.forEach((event: TraceEvent) => {
        event.source = { file, line, endLine: line };
      });
      await route.fulfill({ json: flow });
    });
    await page.goto(url);
    await page.locator('#next').click();
    await expect(page.locator('.code-text')).toHaveText(lines);
    await expect(page.locator('.token-keyword')).toContainText([keyword]);
    await expect(page.locator('.token-number')).toContainText([number]);
    await expect(page.locator('.token-comment')).toHaveText(comment);
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      String(line),
    );
    await page.unrouteAll();
  }
});

test('Java and Go multiline source preserves text, lexical state and execution controls in virtual windows', async ({
  page,
}) => {
  const cases = [
    {
      file: 'Example.java',
      open: 'String description = """',
      close: '"""; // after Java text block',
      after: 'record Result(int value) {}',
      keyword: 'record',
      comment: '// after Java text block',
    },
    {
      file: 'main.go',
      open: 'var description = `',
      close: '` // after Go raw string',
      after: 'func result() int { return 1 }',
      keyword: 'func',
      comment: '// after Go raw string',
    },
  ];
  for (const { file, open, close, after, keyword, comment } of cases) {
    const lines = Array.from({ length: 1000 }, (_, index) => {
      if (index === 0) return open;
      if (index === 799) return close;
      if (index === 800) return after;
      return '  // <img src=x onerror="alert(1)"> is literal text';
    });
    await page.route('**/api/flow/*', async (route) => {
      const response = await route.fetch();
      const flow = await response.json();
      flow.trace.sourceFiles = { [file]: lines.join('\n') };
      flow.trace.events.forEach((event: TraceEvent, index: number) => {
        event.source = {
          file,
          line: index === 0 ? 700 : 701,
          endLine: index === 0 ? 700 : 701,
        };
      });
      await route.fulfill({ json: flow });
    });
    await page.goto(url);
    await page.locator('#next').click();
    const row = page.locator('.code-row[data-line="700"]');
    await expect(row.locator('.code-text')).toHaveText(lines[699]!);
    await expect(row.locator('.token-string')).toHaveText(lines[699]!);
    await expect(row.locator('.token-comment')).toHaveCount(0);
    await expect(page.locator('.code-row')).toHaveCount(301);
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '700',
    );
    await expect(
      page.locator('.code-row[data-line="800"] .token-comment'),
    ).toHaveText(comment);
    await expect(
      page.locator('.code-row[data-line="801"] .token-keyword').filter({
        hasText: keyword,
      }),
    ).toHaveCount(1);
    await expect(page.locator('#snippet img')).toHaveCount(0);
    const original = await row.elementHandle();
    await page.locator('#next').click();
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '701',
    );
    expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
    await expect(
      page.locator('.code-row[data-line="701"] .code-text'),
    ).toHaveText(lines[700]!);
    await page.unrouteAll();
  }
});

test('virtual source windows inherit earlier multiline syntax and retain source nodes while stepping', async ({
  page,
}) => {
  const lines = Array.from({ length: 1000 }, (_, index) => {
    if (index === 0) return '/* opening block';
    if (index === 800) return '*/ const finished = 1;';
    return 'const ignored = "plain"; // inside block';
  });
  await page.route('**/api/flow/*', async (route) => {
    const response = await route.fetch();
    const flow = await response.json();
    flow.trace.sourceFiles = { 'large.ts': lines.join('\n') };
    flow.trace.events.forEach((event: TraceEvent, index: number) => {
      event.source = {
        file: 'large.ts',
        line: index === 0 ? 700 : 701,
        endLine: index === 0 ? 700 : 701,
      };
    });
    await route.fulfill({ json: flow });
  });
  await page.goto(url);
  await page.locator('#next').click();
  const row = page.locator('.code-row[data-line="700"]');
  await expect(row.locator('.token-comment')).toHaveText(
    'const ignored = "plain"; // inside block',
  );
  await expect(row.locator('.token-keyword')).toHaveCount(0);
  const originalRow = await row.elementHandle();
  await page.locator('#next').click();
  expect(await originalRow!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(page.locator('.executing-line')).toHaveAttribute(
    'data-line',
    '701',
  );
  await expect(
    page.locator('.code-row[data-line="801"] .token-keyword'),
  ).toHaveText('const');
});

test('desktop layout resizes, focuses and remembers preferences without moving playback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await page.locator('#timeline').fill('70');
  await expect(page.locator('#progress')).toHaveText('70 / 100');
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const row = document.querySelector('.event-row.current');
        const list = document.getElementById('event-list');
        if (!row || !list) return false;
        const selected = row.getBoundingClientRect();
        const viewport = list.getBoundingClientRect();
        return (
          selected.top >= viewport.top && selected.bottom <= viewport.bottom
        );
      }),
    )
    .toBe(true);
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

test('mobile console navigation preserves the desktop console preference across resizing', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  await page.locator('#timeline').fill('70');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const consolePanel = page.locator('#console-panel');
  for (const expanded of [false, true]) {
    if (expanded) await consolePanel.locator('summary').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Console', exact: true }).click();
    await expect(page.locator('#console-output')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(consolePanel).toHaveJSProperty('open', expanded);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#console-output')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(consolePanel).toHaveJSProperty('open', expanded);
    await expect(page.locator('#progress')).toHaveText('70 / 100');
  }
  expect(requests).toEqual([]);
  await page.reload();
  await expect(consolePanel).toHaveJSProperty('open', true);
});

test('steps panel can release desktop and tablet space without changing playback or mobile navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let flowRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/flow/')) flowRequests++;
  });
  await page.goto(url);
  await page.locator('#timeline').fill('70');
  const toggle = page.locator('#toggle-timeline');
  const trace = page.locator('#timeline-panel');
  const source = page.locator('.source-panel');
  const center = page.locator('.center-column');
  const requestsAfterLoad = flowRequests;
  await page.locator('#toggle-inspector').click();
  const initialWidth = (await center.boundingBox())!.width;
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveText('Show steps');
  await expect(trace).toBeHidden();
  await expect(page.locator('#workspace-divider')).toBeHidden();
  await expect(page.locator('.inspector')).toBeVisible();
  expect((await center.boundingBox())!.width).toBeGreaterThan(
    initialWidth + 130,
  );
  await page.locator('#next').click();
  await expect(page.locator('#progress')).toHaveText('71 / 100');
  await expect(source).toBeVisible();
  expect(flowRequests).toBe(requestsAfterLoad);
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(trace).toBeHidden();
  await expect(page.locator('.inspector')).toBeVisible();
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(trace).toBeHidden();
  await expect(center).toBeVisible();
  expect((await center.boundingBox())!.width).toBeGreaterThan(700);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toggle).toBeHidden();
  await page.locator('button[data-mobile-view="trace"]').click();
  await expect(trace).toBeVisible();
  await expect(page.locator('.event-row').first()).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(trace).toBeVisible();
  await expect(page.locator('#workspace-divider')).toBeVisible();
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

test('compact header and tablet timeline leave room for execution and playback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto(url);
  const header = (await page.locator('.app-header').boundingBox())!;
  const session = (await page.locator('.session-header').boundingBox())!;
  const source = (await page.locator('.source-panel').boundingBox())!;
  const flow = (await page.locator('#flow-panel').boundingBox())!;
  const trace = (await page.locator('.trace-panel').boundingBox())!;
  const center = (await page.locator('.center-column').boundingBox())!;
  const dock = (await page.locator('.playback-dock').boundingBox())!;

  expect(session.y).toBeGreaterThanOrEqual(header.y);
  expect(session.y + session.height).toBeLessThanOrEqual(
    header.y + header.height,
  );
  expect(Math.abs(trace.height - center.height)).toBeLessThan(2);
  expect(trace.y + trace.height).toBeLessThanOrEqual(dock.y + 1);
  expect(source.height).toBeGreaterThan(350);
  expect(flow.height).toBeGreaterThan(350);
  expect(
    await page
      .locator('#event-list')
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#evidence-mode')).toBeVisible();
  const mobileHeader = (await page.locator('.app-header').boundingBox())!;
  const mobileSession = (await page.locator('.session-header').boundingBox())!;
  const actions = (await page.locator('.header-actions').boundingBox())!;
  expect(mobileSession.x + mobileSession.width).toBeLessThanOrEqual(actions.x);
  expect(mobileSession.y + mobileSession.height).toBeLessThanOrEqual(
    mobileHeader.y + mobileHeader.height,
  );
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

test('observed JavaScript recording replays actual source lines, locals and output', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const recorder = new RecordingService(
    runtime.store,
    runtime.baseUrl,
    realpath,
  );
  try {
    const started = await recorder.run({
      action: 'start',
      language: 'javascript',
      projectRoot: fileURLToPath(
        new URL('../fixtures/runtime/', import.meta.url),
      ),
      entry: 'node-main.cjs',
    });
    let status = started;
    await expect
      .poll(async () => {
        status = await recorder.run({ action: 'status', jobId: started.jobId });
        return status.status;
      })
      .toBe('ready');
    expect(status.complete).toBe(true);
    const recorded = (await runtime.store.get(status.sessionId!))!.flow.trace!;
    const entryIndex = recorded.events.findIndex(
      (event) =>
        event.kind === 'enter' && event.symbolId === 'node-main.cjs:add',
    );
    expect(entryIndex).toBeGreaterThanOrEqual(0);
    const outputIndex = recorded.events.findIndex(
      (event) => event.kind === 'console' && event.values?.stream === 'stdout',
    );
    expect(outputIndex).toBeGreaterThanOrEqual(0);
    expect(recorded.events[outputIndex]?.source).toBeUndefined();
    expect(recorded.events[outputIndex]?.callId).toBe('process-output');
    let chunk = await runtime.store.get(status.sessionId!);
    let stdout = '';
    while (chunk) {
      for (const event of chunk.flow.trace!.events)
        if (event.kind === 'console' && event.values?.stream === 'stdout')
          stdout += event.output ?? '';
      chunk = await runtime.store.next(chunk.id);
    }
    // The trace retains the bytes emitted by Node, including ANSI colors.
    // The browser only strips terminal formatting during presentation.
    expect(plainTerminalText(stdout)).toBe('30 6\n');
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(status.url!);
    await expect(page.locator('#evidence-mode')).toHaveText(
      'Recorded execution',
    );
    await page.locator('#timeline').fill(String(entryIndex + 1));
    await expect(page.locator('.method-map-call.current')).toContainText(
      'add()',
    );
    await expect(
      page.locator(
        '.method-map-group:has(.method-map-call.current) .method-map-class',
      ),
    ).toContainText('node-main.cjs');
    await expect(page.locator('#source')).toHaveText('node-main.cjs');
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '2',
    );
    await expect(page.locator('#local-tree')).toContainText('a: 10');
    await expect(page.locator('#local-tree')).toContainText('b: 20');
    await expect(page.locator('#console-output')).toHaveText('');
    const addVisits = recorded.events
      .map((event, index) => ({ event, step: index + 1 }))
      .filter(
        ({ event }) =>
          event.source?.file === 'node-main.cjs' && event.source.line === 2,
      );
    const addJump = page.locator(
      '#snippet .code-row[data-line="2"] .code-jump',
    );
    await expect(addJump).toHaveAccessibleName(
      `Next recorded execution of line 2 (${addVisits.length} loaded visit${addVisits.length === 1 ? '' : 's'})`,
    );
    await addJump.press('Enter');
    await expect(page.locator('#progress')).toHaveText(
      `${addVisits.find(({ step }) => step > entryIndex + 1)?.step ?? addVisits[0]!.step} / ${recorded.events.length}`,
    );
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '2',
    );
    await page.locator('#timeline').fill(String(outputIndex + 1));
    await expect(page.locator('#source')).toHaveText(
      'No source location recorded',
    );
    await expect(page.locator('.overview-step.current')).toContainText(
      'Process stdout (source unresolved)',
    );
    await expect(page.locator('.executing-line')).toHaveCount(0);
    await expect(page.locator('#console-output')).toContainText('30 6');
    const maximum = Number(await page.locator('#timeline').getAttribute('max'));
    await page.locator('#timeline').fill(String(maximum));
    // Playwright's color environment may append a Node warning on stderr.
    // The recorded stdout event above verifies the exact bytes separately.
    await expect(page.locator('#console-output')).toContainText('30 6');
    await page.locator('#timeline').fill(String(entryIndex + 1));
    await expect(page.locator('#console-output')).toHaveText('');
    await expect(page.locator('#local-tree')).toContainText('a: 10');
    expect(errors).toEqual([]);
  } finally {
    recorder.close();
  }
});

test('verified TypeScript source map follows the original lines in real browser playback', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const root = await mkdtemp(join(tmpdir(), 'code-anime-source-map-'));
  const recorder = new RecordingService(
    runtime.store,
    runtime.baseUrl,
    realpath,
  );
  const original = [
    'function double(value: number): number {',
    '  const result = value * 2;',
    '  return result;',
    '}',
    'console.log(double(15));',
  ].join('\n');
  try {
    await mkdir(join(root, 'src'));
    await mkdir(join(root, 'dist'));
    const transpiled = ts.transpileModule(original, {
      fileName: 'entry.ts',
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        sourceMap: true,
        inlineSources: true,
      },
    });
    const map = JSON.parse(transpiled.sourceMapText!);
    map.sources = ['../src/entry.ts'];
    await writeFile(join(root, 'src', 'entry.ts'), original);
    await writeFile(
      join(root, 'dist', 'entry.cjs'),
      transpiled.outputText.replace(
        'sourceMappingURL=entry.js.map',
        'sourceMappingURL=entry.cjs.map',
      ),
    );
    await writeFile(join(root, 'dist', 'entry.cjs.map'), JSON.stringify(map));
    const started = await recorder.run({
      action: 'start',
      language: 'javascript',
      projectRoot: root,
      entry: 'dist/entry.cjs',
    });
    let status = started;
    await expect
      .poll(async () => {
        status = await recorder.run({ action: 'status', jobId: started.jobId });
        return status.status;
      })
      .toBe('ready');
    expect(status.complete).toBe(true);
    const recorded = (await runtime.store.get(status.sessionId!))!.flow.trace!;
    const mappedIndex = recorded.events.findIndex(
      (event) =>
        event.kind === 'statement' &&
        event.source?.file === 'src/entry.ts' &&
        event.source?.line === 2,
    );
    expect(mappedIndex).toBeGreaterThanOrEqual(0);
    await page.goto(status.url!);
    await page.locator('#timeline').fill(String(mappedIndex + 1));
    await expect(page.locator('#source')).toHaveText('src/entry.ts');
    await expect(page.locator('#source')).toHaveAttribute(
      'title',
      /Original source mapped from V8 location dist\/entry\.cjs:/,
    );
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '2',
    );
    await expect(page.locator('.executing-line')).toContainText(
      'const result = value * 2;',
    );
    const mappedVisits = recorded.events
      .map((event, index) => ({ event, step: index + 1 }))
      .filter(
        ({ event }) =>
          event.source?.file === 'src/entry.ts' && event.source.line === 2,
      );
    const mappedJump = page.locator(
      '#snippet .code-row[data-line="2"] .code-jump',
    );
    await mappedJump.press('Enter');
    await expect(page.locator('#progress')).toHaveText(
      `${mappedVisits.find(({ step }) => step > mappedIndex + 1)?.step ?? mappedVisits[0]!.step} / ${recorded.events.length}`,
    );
    await expect(page.locator('.executing-line .code-text')).toContainText(
      'const result = value * 2;',
    );
    const finalIndex = Number(
      await page.locator('#timeline').getAttribute('max'),
    );
    await page.locator('#timeline').fill(String(finalIndex));
    await expect(page.locator('#console-output')).toContainText('30');
  } finally {
    recorder.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('recorded five-iteration loop revisits original lines and restores each historical sum', async ({
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
      entry: 'five-iterations.py',
    });
    let status = started;
    await expect
      .poll(async () => {
        status = await recorder.run({ action: 'status', jobId: started.jobId });
        return status.status;
      })
      .toBe('ready');
    expect(status.complete).toBe(true);
    const stored = await runtime.store.get(status.sessionId!);
    const trace = stored!.flow.trace!;
    expect(trace.recording).toBeDefined();
    expect(trace.events.every((event) => event.certainty === 'observed')).toBe(
      true,
    );
    const body = trace.events
      .map((event, index) => ({ event, step: index + 1 }))
      .filter(
        ({ event }) =>
          event.kind === 'statement' &&
          event.source?.file === 'five-iterations.py' &&
          event.source.line === 3,
      );
    expect(body).toHaveLength(5);
    expect(
      body.map(({ event }) => {
        const locals = event.locals?.[event.callId] as {
          i: number;
          sum: number;
        };
        return [locals.i, locals.sum];
      }),
    ).toEqual([
      [1, 0],
      [2, 1],
      [3, 3],
      [4, 6],
      [5, 10],
    ]);
    await page.goto(status.url!);
    await expect(page.locator('#evidence-mode')).toHaveText(
      'Recorded execution',
    );
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    const visits = trace.events
      .map((event, index) => ({ event, step: index + 1 }))
      .filter(
        ({ event }) =>
          event.source?.file === 'five-iterations.py' &&
          event.source.line === 3,
      );
    expect(visits.length).toBeGreaterThanOrEqual(5);
    const jump = page.locator('#snippet .code-row[data-line="3"] .code-jump');
    await expect(jump).toHaveAccessibleName(
      `Next recorded execution of line 3 (${visits.length} loaded visits)`,
    );
    for (const { step } of visits) {
      await jump.press('Enter');
      await expect(page.locator('#progress')).toHaveText(
        `${step} / ${trace.events.length}`,
      );
      await expect(page.locator('#snippet .executing-line')).toHaveAttribute(
        'data-line',
        '3',
      );
      await expect(jump).toBeFocused();
    }
    await jump.press('Shift+Enter');
    await expect(page.locator('#progress')).toHaveText(
      `${visits[visits.length - 2]!.step} / ${trace.events.length}`,
    );
    await jump.press('Shift+Enter');
    await expect(page.locator('#progress')).toHaveText(
      `${visits[visits.length - 3]!.step} / ${trace.events.length}`,
    );
    await jump.press('Enter');
    await expect(page.locator('#progress')).toHaveText(
      `${visits[visits.length - 2]!.step} / ${trace.events.length}`,
    );
    await jump.press('Enter');
    await expect(page.locator('#progress')).toHaveText(
      `${visits[visits.length - 1]!.step} / ${trace.events.length}`,
    );
    // A line executed more than once cycles through its recorded visits.
    // Source inspection can be resumed from a line even if Follow was off.
    await page.locator('#follow').uncheck();
    await jump.press('Enter');
    await expect(page.locator('#follow')).toBeChecked();
    await expect(page.locator('#progress')).toHaveText(
      `${visits[0]!.step} / ${trace.events.length}`,
    );
    for (const { event, step } of body) {
      await page.locator('#timeline').fill(String(step));
      await expect(page.locator('#source')).toHaveText('five-iterations.py');
      await expect(page.locator('.executing-line')).toHaveAttribute(
        'data-line',
        '3',
      );
      const locals = event.locals![event.callId] as { sum: number };
      await expect(page.locator('#local-tree')).toContainText(
        `sum: ${locals.sum}`,
      );
      await expect(page.locator('#console-output')).toHaveText('');
    }
    await page.locator('#timeline').fill(String(trace.events.length));
    await expect(page.locator('#console-output')).toHaveText('15\n');
    await page.locator('#timeline').fill(String(body[2]!.step));
    await expect(page.locator('#local-tree')).toContainText('sum: 3');
    await expect(page.locator('.executing-line')).toHaveAttribute(
      'data-line',
      '3',
    );
    await expect(page.locator('#console-output')).toHaveText('');
    expect(requests).toEqual([]);
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
    // The high-level path must show the same asynchronous task boundaries
    // that are present in the observed detailed trace.
    await page.locator('#timeline').fill(String(awaiting + 1));
    await expect(page.locator('.overview-step.current')).toContainText(
      'suspended at await',
    );
    await page.locator('#timeline').fill(String(resume + 1));
    await expect(page.locator('.overview-step.current')).toContainText(
      'resumed',
    );
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.locator('.overview-step.current').click();
    await expect(page.locator('#progress')).toHaveText(
      `${resume + 1} / ${events.length}`,
    );
    expect(requests).toEqual([]);
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

test('normal playback, inspection, and layout controls reuse the prepared trace', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));

  await page.locator('#timeline').fill('50');
  await page.locator('#previous').click();
  await page.locator('#next').click();
  await page.locator('#step-over').click();
  await page.locator('#step-out').click();
  await page.locator('#speed').selectOption('450');
  await page.locator('#toggle-inspector').click();
  await page.locator('#tab-state').click();
  await page.locator('#tab-values').click();
  await page.locator('#changes-only').check();
  await page.locator('#bookmark').click();
  await page.locator('#breakpoint').click();
  await page.locator('#bookmarks-only').click();
  await page.locator('#bookmarks-only').click();
  await page.locator('#kind-filter').selectOption('changes');
  await page.locator('#kind-filter').selectOption('all');
  await page.locator('#search').fill('Line 50');
  await page.locator('#search').fill('');
  await page.locator('#view-mode').selectOption('focus');
  await page.locator('#view-mode').selectOption('map');
  await page.locator('#center-view').click();
  await page.locator('#view-mode').selectOption('path');
  await page.locator('#follow').uncheck();
  await page.locator('#follow').check();
  await page.locator('#toggle-flow').click();
  await page.locator('#toggle-flow').click();
  await page.locator('#maximize-source').click();
  await page.locator('#maximize-source').click();
  await page.locator('#maximize-flow').click();
  await page.locator('#maximize-flow').click();
  await page.locator('#console-panel summary').click();
  await page.locator('#help').click();
  await page.keyboard.press('Escape');
  await page.locator('#timeline').fill('30');
  await page.locator('#play').click();
  await expect(page.locator('#play')).toHaveAttribute('data-playing', 'true');
  await page.locator('#play').click();
  await expect(page.locator('#play')).toHaveAttribute('data-playing', 'false');
  await page.locator('#restart').click();
  await expect(page.locator('#progress')).toHaveText('0 / 100');
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

test('large inspector trees retain disclosure and nodes during layout changes, but update for a new frame or step', async ({
  page,
}) => {
  const wide = Object.fromEntries(
    Array.from({ length: 135 }, (_, index) => [`value${index}`, index]),
  );
  const events: TraceEvent[] = [
    {
      id: 'event-1',
      kind: 'enter',
      callId: 'parent',
      symbolId: 'A.m',
      label: 'A.m',
      stack: ['parent'],
      locals: { parent: { label: 'caller', nested: wide } },
      values: {},
      source: { file: 'example.js', line: 1, endLine: 1 },
      certainty: 'mock',
    },
    {
      id: 'event-2',
      kind: 'enter',
      callId: 'child',
      parentCallId: 'parent',
      symbolId: 'B.m2',
      label: 'B.m2',
      stack: ['parent', 'child'],
      locals: {
        parent: { label: 'caller', nested: wide },
        child: { label: 'callee', nested: wide },
      },
      after: { packet: wide },
      values: {},
      source: { file: 'example.js', line: 2, endLine: 2 },
      certainty: 'mock',
    },
    {
      id: 'event-3',
      kind: 'assign',
      callId: 'child',
      symbolId: 'B.m2',
      label: 'update packet',
      stack: ['parent', 'child'],
      locals: {
        parent: { label: 'caller', nested: wide },
        child: { label: 'callee', nested: wide },
      },
      after: { packet: { ...wide, value0: -1 } },
      values: {},
      source: { file: 'example.js', line: 3, endLine: 3 },
      certainty: 'mock',
    },
  ];
  const session = await runtime.store.create(
    traceToFlow(
      {
        version: 2,
        provider: 'browser-test',
        projectRoot: 'fixture',
        sourceHash: 'wide-inspector',
        target: 'A.m',
        scenario: {},
        events,
        diagnostics: [],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
        sourceFiles: {
          'example.js': 'function m() {\n  m2();\n  return 3;\n}',
        },
      },
      'A.m',
    ),
  );
  await page.goto(`${runtime.baseUrl}/flow/${session.id}`);
  await page.locator('#timeline').fill('2');
  await page.locator('#toggle-inspector').click();
  const nestedPacket = page.locator('#fields .object-fields').first();
  await nestedPacket.locator('summary').click();
  await expect(nestedPacket.locator('.field')).toHaveCount(60);
  await nestedPacket.locator('.value-more').click();
  await expect(nestedPacket.locator('.field')).toHaveCount(120);
  const valueRow = await nestedPacket.locator('.field').first().elementHandle();
  const more = await nestedPacket.locator('.value-more').elementHandle();
  expect(valueRow).not.toBeNull();
  expect(more).not.toBeNull();

  await page.locator('#view-mode').selectOption('map');
  await page.locator('#follow').uncheck();
  await page.locator('#toggle-flow').click();
  await page.setViewportSize({ width: 1100, height: 800 });
  expect(await valueRow!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(nestedPacket).toHaveAttribute('open', '');
  await expect(nestedPacket.locator('.field')).toHaveCount(120);
  await more!.focus();
  await page.setViewportSize({ width: 1120, height: 810 });
  expect(await more!.evaluate((node) => document.activeElement === node)).toBe(
    true,
  );

  await page.locator('#tab-state').click();
  await expect(page.locator('#local-tree')).toContainText('callee');
  const localRow = await page
    .locator('#local-tree .field')
    .first()
    .elementHandle();
  await page.locator('#frame-list .stack-link').first().click();
  await expect(page.locator('#local-tree')).toContainText('caller');
  expect(await localRow!.evaluate((node) => node.isConnected)).toBe(false);
  expect(await valueRow!.evaluate((node) => node.isConnected)).toBe(true);

  await page.locator('#timeline').fill('3');
  expect(await valueRow!.evaluate((node) => node.isConnected)).toBe(false);
  await expect(page.locator('#fields')).toContainText('packet');
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
  await expect(page.locator('#help')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#help')).toHaveAttribute(
    'aria-controls',
    'help-panel',
  );
  await expect(page.locator('#evidence-mode')).toHaveAttribute(
    'title',
    'Simulated values',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-panel')).toBeHidden();
  await expect(page.locator('#help')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#help')).toBeFocused();
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
  await page.locator('#view-mode').selectOption('focus');
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
