import { test, expect, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { flowSchema, type SessionStore } from '../../src/domain/flow.js';
import { createWebApp } from '../../src/web/app.js';

const id = '11111111-1111-4111-8111-111111111111';
const events = [
  { kind: 'enter', symbolId: 'A.main', callId: 'a', stack: ['a'], line: 2 },
  { kind: 'call', symbolId: 'A.main', callId: 'a', stack: ['a'], line: 3 },
  {
    kind: 'enter',
    symbolId: 'B.work',
    callId: 'b',
    parentCallId: 'a',
    stack: ['a', 'b'],
    line: 6,
  },
  {
    kind: 'assign',
    symbolId: 'B.work',
    callId: 'b',
    stack: ['a', 'b'],
    line: 7,
    before: { value: 1 },
    after: { value: 2 },
  },
  {
    kind: 'return',
    symbolId: 'B.work',
    callId: 'b',
    stack: ['a'],
    line: 8,
    result: 2,
  },
  {
    kind: 'assign',
    symbolId: 'A.main',
    callId: 'a',
    stack: ['a'],
    line: 4,
    after: { value: 2 },
  },
  {
    kind: 'console',
    symbolId: 'A.main',
    callId: 'a',
    stack: ['a'],
    line: 4,
    output: '\u001b[32mresult: 2\u001b[0m',
  },
  {
    kind: 'return',
    symbolId: 'A.main',
    callId: 'a',
    stack: [],
    line: 5,
    result: 2,
  },
].map(({ line, ...event }, index) => ({
  ...event,
  id: `event-${index + 1}`,
  label: `${event.kind} ${event.symbolId}`,
  source: { file: 'demo.ts', line, endLine: line },
  certainty: 'mock',
  values: {},
  locals: Object.fromEntries(
    event.stack.map((call) => [call, { value: index + 1 }]),
  ),
}));
const flow = flowSchema.parse({
  endpoint: 'A.main',
  steps: events.map((event) => ({
    from: event.symbolId,
    to: event.symbolId,
    dtoName: event.label,
    dtoFields: event.after ?? { value: 1 },
  })),
  trace: {
    version: 2,
    provider: 'test mock',
    projectRoot: 'fixture',
    sourceHash: 'fixture',
    target: 'A.main',
    scenario: {},
    events,
    sourceFiles: {
      'demo.ts':
        'class A {\n  main() {\n    B.work();\n    console.log(2);\n  }\n  work() {\n    const value = 2;\n    return value;\n  }\n}\n' +
        Array.from({ length: 700 }, (_, i) => `// line ${i + 11}`).join('\n'),
    },
    diagnostics: ['Synthetic parity fixture'],
    truncated: false,
    filesAnalyzed: 1,
    cacheHits: 0,
    simulation: {
      mode: 'ai-mock',
      complete: true,
      coverage: 'Prepared scenario',
      evidenceIds: [],
      coverageAssessment: {
        status: 'unknown',
        reasons: ['Fixture coverage only'],
      },
    },
  },
});
const continuationFirstId = '88888888-8888-4888-8888-888888888888';
const continuationId = '33333333-3333-4333-8333-333333333333';
const baselineId = '44444444-4444-4444-8444-444444444444';
const proposedId = '55555555-5555-4555-8555-555555555555';
const consoleOverflowId = '66666666-6666-4666-8666-666666666666';
const continuationFlow = flowSchema.parse({
  ...flow,
  steps: flow.steps.slice(0, 4),
  trace: {
    ...flow.trace!,
    events: flow.trace!.events.slice(0, 4),
    truncated: true,
    simulation: { ...flow.trace!.simulation!, complete: false },
  },
});
const continuationNextFlow = flowSchema.parse({
  ...flow,
  steps: flow.steps.slice(4),
  trace: {
    ...flow.trace!,
    events: flow.trace!.events.slice(4),
    simulation: {
      ...flow.trace!.simulation!,
      previousSessionId: continuationFirstId,
    },
  },
});
const proposedFlow = flowSchema.parse({
  ...flow,
  baselineSessionId: baselineId,
  baselineTrace: {
    ...flow.trace!,
    events: flow.trace!.events.slice(0, 2),
    simulation: { ...flow.trace!.simulation!, coverage: 'Baseline coverage' },
  },
  trace: {
    ...flow.trace!,
    simulation: {
      ...flow.trace!.simulation!,
      previousSessionId: id,
      coverage: 'Proposed coverage',
    },
  },
});
const overflowEvents = Array.from({ length: 350 }, (_, i) => ({
  id: `overflow-event-${i + 1}`,
  kind: 'console' as const,
  symbolId: 'A.main',
  callId: 'a',
  stack: ['a'],
  label: `console line ${i + 1}`,
  source: { file: 'demo.ts', line: 4, endLine: 4 },
  certainty: 'mock' as const,
  values: {},
  locals: { a: {} },
  output: `line ${i + 1}`,
}));
const overflowFlow = flowSchema.parse({
  ...flow,
  steps: overflowEvents.map((event) => ({
    from: event.symbolId,
    to: event.symbolId,
    dtoName: event.label,
    dtoFields: { value: 1 },
  })),
  trace: {
    ...flow.trace!,
    events: overflowEvents,
    truncated: true,
    diagnostics: ['Truncated fixture trace', 'Synthetic parity fixture'],
    simulation: {
      ...flow.trace!.simulation!,
      coverage: 'Overflow console fixture',
      coverageAssessment: {
        status: 'partial',
        reasons: ['Console overflow test'],
      },
    },
  },
});
const dtoFallbackId = '77777777-7777-4777-8777-777777777777';
const dtoFallbackFlow = flowSchema.parse({
  ...flow,
  steps: [{ ...flow.steps[0], dtoFields: { fallbackField: 'from-dtoFields' } }],
  trace: { ...flow.trace!, events: flow.trace!.events.slice(0, 1) },
});
let server: Server;
let baseUrl: string;
test.beforeAll(async () => {
  const sessions: Record<
    string,
    { id: string; createdAt: string; flow: typeof flow }
  > = {};
  const baseSession = { id, createdAt: new Date(0).toISOString(), flow };
  sessions[id] = baseSession;
  sessions[continuationId] = {
    id: continuationId,
    createdAt: new Date(0).toISOString(),
    flow: continuationNextFlow,
  };
  sessions[continuationFirstId] = {
    id: continuationFirstId,
    createdAt: new Date(0).toISOString(),
    flow: continuationFlow,
  };
  sessions[proposedId] = {
    id: proposedId,
    createdAt: new Date(0).toISOString(),
    flow: proposedFlow,
  };
  sessions[consoleOverflowId] = {
    id: consoleOverflowId,
    createdAt: new Date(0).toISOString(),
    flow: overflowFlow,
  };
  sessions[dtoFallbackId] = {
    id: dtoFallbackId,
    createdAt: new Date(0).toISOString(),
    flow: dtoFallbackFlow,
  };
  const store: SessionStore = {
    async create() {
      return baseSession;
    },
    async get(key) {
      return sessions[key];
    },
    async next(key) {
      return key === continuationFirstId ? sessions[continuationId] : undefined;
    },
    async latest() {
      return baseSession;
    },
    async close() {},
  };
  server = createServer(createWebApp(store));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No server address');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
async function open(page: Page, route: string, eventCount = events.length) {
  await page.goto(`${baseUrl}/${route}/${id}?diagram=connections`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#title')).toHaveText('A.main');
  await expect(page.locator('#progress')).toHaveText(`0 / ${eventCount}`);
}
async function seek(page: Page, cursor: number) {
  await page.locator('#timeline').fill(String(cursor));
  await expect(page.locator('#progress')).toHaveText(`${cursor} / 8`);
}
async function show(
  page: Page,
  mobile: boolean,
  view: 'trace' | 'state' | 'code' | 'flow' | 'console',
) {
  if (mobile)
    await page.locator(`.mobile-views [data-mobile-view="${view}"]`).click();
  else if (view === 'state') {
    if (
      (await page
        .locator('#toggle-inspector')
        .getAttribute('aria-expanded')) === 'false'
    )
      await page.locator('#toggle-inspector').click();
  } else if (view === 'console')
    await page.locator('#console-panel').evaluate((el: HTMLDetailsElement) => {
      el.open = true;
    });
}
async function expectPointerHitTarget(page: Page, name: string) {
  const target = page.getByRole('button', { name, exact: true });
  await expect(target).toBeVisible();
  await expect
    .poll(
      () =>
        target.evaluate((button) => {
          const box = button.getBoundingClientRect();
          const surface = document
            .querySelector('.diagram-surface')
            ?.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          const hit = document.elementFromPoint(x, y);
          return {
            withinSurface: Boolean(
              surface &&
              x >= surface.left &&
              x < surface.right &&
              y >= surface.top &&
              y < surface.bottom,
            ),
            unobstructed: hit === button || button.contains(hit),
            coveredByCamera: Boolean(hit?.closest('.diagram-footer')),
          };
        }),
      {
        timeout: 3000,
        message: `${name} must stay clickable above camera controls`,
      },
    )
    .toEqual({
      withinSurface: true,
      unobstructed: true,
      coveredByCamera: false,
    });
}
for (const mobile of [false, true]) {
  test.describe(mobile ? 'mobile' : 'desktop', () => {
    test.use({
      viewport: mobile
        ? { width: 375, height: 812 }
        : { width: 1440, height: 900 },
      reducedMotion: 'reduce',
      hasTouch: mobile,
    });
    test('explicit Fit makes far source steps pointer reachable and remains idempotent', async ({
      page,
    }) => {
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      const viewportTransform = () =>
        page.locator('.x6-graph-svg-viewport').evaluate((node) => {
          const matrix = (node as SVGGraphicsElement).getCTM();
          if (!matrix) throw new Error('SVG viewport has no coordinate matrix');
          return {
            scale: Math.hypot(matrix.a, matrix.b),
            x: matrix.e,
            y: matrix.f,
          };
        });
      const originalTransform = await viewportTransform();
      expect(originalTransform.scale).toBeGreaterThanOrEqual(0.89);
      const viewport = page.locator('.x6-graph-svg-viewport');
      const localTransform = await viewport.getAttribute('transform');
      const svg = page.locator('.x6-graph-svg');
      const originalViewBox = await svg.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        if (!bounds.width || !bounds.height)
          throw new Error('SVG diagram has no measurable bounds');
        const original = node.getAttribute('viewBox');
        node.setAttribute(
          'viewBox',
          `17 13 ${bounds.width * 2} ${bounds.height * 2}`,
        );
        return original;
      });
      try {
        const ancestorTransform = await viewportTransform();
        expect(
          Math.abs(ancestorTransform.scale - originalTransform.scale),
        ).toBeGreaterThan(0.1);
        expect(
          Math.hypot(
            ancestorTransform.x - originalTransform.x,
            ancestorTransform.y - originalTransform.y,
          ),
        ).toBeGreaterThan(1);
        expect(await viewport.getAttribute('transform')).toBe(localTransform);
      } finally {
        await svg.evaluate((node, previous) => {
          if (previous === null) node.removeAttribute('viewBox');
          else node.setAttribute('viewBox', previous);
        }, originalViewBox);
      }
      await seek(page, 4);
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .click();
      const fit = page.getByRole('button', {
        name: 'Fit diagram',
        exact: true,
      });
      const step = page.getByRole('button', {
        name: 'Go to source step 5',
        exact: true,
      });
      await fit.click();
      const hitTarget = () =>
        step.evaluate((button) => {
          const box = button.getBoundingClientRect();
          const surface = document
            .querySelector('.diagram-surface')!
            .getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          const hit = document.elementFromPoint(x, y);
          const dock = document
            .querySelector('.playback-dock')
            ?.getBoundingClientRect();
          return {
            reachable: hit === button || button.contains(hit),
            contained:
              box.left >= surface.left + 2 &&
              box.right <= surface.right - 2 &&
              box.top >= surface.top + 2 &&
              box.bottom <= surface.bottom - 2,
            underDock: Boolean(
              dock &&
              x >= dock.left &&
              x < dock.right &&
              y >= dock.top &&
              y < dock.bottom,
            ),
            x,
            y,
          };
        });
      await expect.poll(hitTarget).toMatchObject({
        reachable: true,
        contained: true,
        underDock: false,
      });
      const first = await hitTarget();
      const firstTransform = await viewportTransform();
      await fit.click();
      const second = await hitTarget();
      const secondTransform = await viewportTransform();
      expect(Math.abs(second.x - first.x)).toBeLessThan(1);
      expect(Math.abs(second.y - first.y)).toBeLessThan(1);
      expect(
        Math.abs(secondTransform.scale - firstTransform.scale),
      ).toBeLessThan(0.0001);
      expect(Math.abs(secondTransform.x - firstTransform.x)).toBeLessThan(1);
      expect(Math.abs(secondTransform.y - firstTransform.y)).toBeLessThan(1);
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await step.focus();
      await expect(step).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await seek(page, 4);
      await step.click();
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await expect(page).toHaveURL(/step=5/);
      await show(page, mobile, 'code');
      await expect(page.locator('.code-row[data-line="8"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
    });
    test('explicit Fit retains expanded Values, breakpoint, dock and keyboard source access', async ({
      page,
    }) => {
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      await seek(page, 4);
      await show(page, mobile, 'state');
      await page.locator('#breakpoint').click();
      await show(page, mobile, 'flow');
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .click();
      const values = page.locator(
        '.diagram-card[data-call-id="b"]:not([data-parent-id])',
      );
      await values.locator('.diagram-values-summary').focus();
      await page.keyboard.press('Enter');
      await expect(values.locator('.diagram-value')).toBeVisible();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const fit = page.getByRole('button', {
        name: 'Fit diagram',
        exact: true,
      });
      const step = page.getByRole('button', {
        name: 'Go to source step 5',
        exact: true,
      });
      await fit.click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await expect(values.locator('.diagram-value')).toBeVisible();
      await show(page, mobile, 'state');
      await expect(page.locator('#breakpoint')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await show(page, mobile, 'flow');
      await expect(page.locator('#previous')).toBeEnabled();
      await page.locator('#previous').click();
      await expect(page.locator('#progress')).toHaveText('3 / 8');
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await fit.click();
      await step.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#progress')).toHaveText('5 / 8');
    });
    test('Values toggle preserves camera after close and remains pointer reachable', async ({
      page,
    }) => {
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      await seek(page, 4);
      const values = page.locator(
        '.diagram-card[data-call-id="b"]:not([data-parent-id])',
      );
      const summary = values.locator('.diagram-values-summary');
      const content = values.locator('.diagram-value');
      const transform = () =>
        page.locator('.x6-graph-svg-viewport').getAttribute('transform');
      const settleFrames = () =>
        page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
      const expectPointerReachable = async () => {
        await expect
          .poll(() =>
            summary.evaluate((target) => {
              const bounds = target.getBoundingClientRect();
              const x = bounds.left + bounds.width / 2;
              const y = bounds.top + bounds.height / 2;
              const hit = document.elementFromPoint(x, y);
              return {
                insideViewport:
                  x >= 0 &&
                  x < window.innerWidth &&
                  y >= 0 &&
                  y < window.innerHeight,
                reachable: hit === target || target.contains(hit),
              };
            }),
          )
          .toMatchObject({ insideViewport: true, reachable: true });
      };

      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(content).toBeVisible();
      await settleFrames();
      const beforeKeyboardCollapse = await transform();
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(content).toBeHidden();
      await settleFrames();
      expect(await transform()).toBe(beforeKeyboardCollapse);

      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(content).toBeVisible();
      await settleFrames();
      await expectPointerReachable();
      const beforePointerCollapse = await transform();
      await summary.click();
      await expect(content).toBeHidden();
      await settleFrames();
      expect(await transform()).toBe(beforePointerCollapse);

      await page.evaluate(() => {
        // Re-query on each click: the X6 card is replaced by render().
        for (let index = 0; index < 3; index++) {
          const target = document.querySelector<HTMLElement>(
            '.diagram-card[data-call-id="b"]:not([data-parent-id]) .diagram-values-summary',
          );
          if (!target) throw new Error('Missing Values control');
          target.click();
        }
      });
      await expect(content).toBeVisible();
      await settleFrames();
      await expectPointerReachable();
      const beforeRapidCollapse = await transform();
      await settleFrames();
      expect(await transform()).toBe(beforeRapidCollapse);
      await summary.evaluate((target) => (target as HTMLElement).click());
      expect(await transform()).toBe(beforeRapidCollapse);
      await expect(content).toBeHidden();
      await settleFrames();
      expect(await transform()).toBe(beforeRapidCollapse);

      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await page.locator('#previous').click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
    });
    test('vanilla player renders all views without React assets', async ({
      page,
    }, info) => {
      const scripts: string[] = [];
      page.on('request', (request) => {
        if (request.resourceType() === 'script') scripts.push(request.url());
      });
      await open(page, 'flow');
      await seek(page, 4);
      for (const selector of [
        '#toggle-timeline',
        '#toggle-inspector',
        '#toggle-flow',
        '#source-values-toggle',
      ]) {
        await expect(page.locator(selector)).toHaveCSS('font-size', '0px');
        expect(
          await page
            .locator(selector)
            .evaluate((el) => getComputedStyle(el, '::before').maskImage),
        ).toContain('/assets/icons/');
      }
      await expect(page.locator('#status')).toHaveText('Simulated replay');
      expect(
        await page
          .locator('#play')
          .evaluate((button) => getComputedStyle(button, '::before').maskImage),
      ).toContain('/assets/icons/play.png');
      expect(
        await page
          .locator('html > body')
          .evaluate((body) => getComputedStyle(body).backgroundColor),
      ).toBe('rgb(11, 16, 32)');
      const theme = page.getByRole('button', {
        name: 'Dark theme',
        exact: true,
      });
      await expect(theme).toHaveAttribute('aria-pressed', 'true');
      await theme.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      expect(
        await page
          .locator('html > body')
          .evaluate((body) => getComputedStyle(body).backgroundColor),
      ).toBe('rgb(248, 250, 252)');
      await page.reload();
      await expect(theme).toHaveAttribute('aria-pressed', 'false');
      await theme.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await seek(page, 4);
      await show(page, mobile, 'state');
      await page.locator('#tab-values').click();
      await expect(page.locator('#fields')).toContainText('value');
      await show(page, mobile, 'flow');
      for (const mode of ['map']) {
        await expect(page.locator('#canvas')).toBeVisible();
        await expect(
          page.locator('#canvas .diagram-name').first(),
        ).toBeInViewport();
        await page.screenshot({
          path: info.outputPath(`${mode}.png`),
          animations: 'disabled',
          fullPage: true,
        });
      }
      expect(scripts.some((url) => url.endsWith('/player.js'))).toBe(true);
      expect(
        scripts.some((url) => /\/(react|assets)\//.test(new URL(url).pathname)),
      ).toBe(false);
    });
    test('recursive invocations share one node and keep self-call edges', async ({
      page,
    }) => {
      const recursive = structuredClone(flow);
      const original = recursive.trace!.events;
      const rows = [
        original[0]!,
        { ...original[1]!, symbolId: 'A.main' },
        {
          ...original[2]!,
          symbolId: 'A.main',
          callId: 'recursive',
          parentCallId: 'a',
        },
        { ...original[4]!, symbolId: 'A.main', callId: 'recursive', result: 1 },
        original[7]!,
      ];
      recursive.trace!.events = rows;
      recursive.steps = rows.map((event) => ({
        from: event.symbolId,
        to: event.symbolId,
        dtoName: event.label,
        dtoFields: {},
      }));
      await page.route('**/api/flow/' + id, (route) =>
        route.fulfill({ json: recursive }),
      );
      await page.goto(`${baseUrl}/flow/${id}?diagram=connections`);
      await show(page, mobile, 'flow');
      await expect(
        page.locator('.diagram-card:not([data-parent-id])'),
      ).toHaveCount(1);
      await expect(page.locator('[data-edge-kind="call"]')).toHaveCount(1);
      await expect(page.locator('[data-edge-kind="return"]')).toHaveCount(1);
      await page.getByLabel('Invocation of A.main').selectOption('recursive');
      await expect(page.locator('#progress')).toHaveText('3 / 5');
    });

    test('shared function node keeps every invocation and return edge', async ({
      page,
    }) => {
      if (!mobile) await page.setViewportSize({ width: 1600, height: 1000 });
      const shared = structuredClone(flow);
      const original = shared.trace!.events;
      const repeated = [
        original[0]!,
        original[1]!,
        original[2]!,
        original[3]!,
        original[4]!,
        {
          ...original[1]!,
          id: 'call-again',
          source: { file: 'demo.ts', line: 4, endLine: 4 },
        },
        {
          ...original[2]!,
          id: 'enter-again',
          callId: 'b-again',
          inputs: { value: 9 },
        },
        { ...original[4]!, id: 'return-again', callId: 'b-again', result: 18 },
        original[7]!,
      ];
      for (const event of repeated) {
        if (event.symbolId === 'B.work' && event.source)
          event.source.file = 'worker.ts';
      }
      shared.trace!.sourceFiles!['worker.ts'] =
        shared.trace!.sourceFiles!['demo.ts']!;
      shared.trace!.events = repeated;
      shared.steps = repeated.map((event) => ({
        from: event.symbolId,
        to: event.symbolId,
        dtoName: event.label,
        dtoFields: {},
      }));
      await page.route('**/api/flow/' + id, (route) =>
        route.fulfill({ json: shared }),
      );
      await page.goto(`${baseUrl}/flow/${id}?diagram=connections`);
      await expect(page.locator('#progress')).toHaveText('0 / 9');
      await show(page, mobile, 'flow');
      await expect(
        page.locator('.diagram-card:not([data-parent-id])'),
      ).toHaveCount(2);
      await expect(page.locator('[data-edge-kind="call"]')).toHaveCount(2);
      await expect(page.locator('[data-edge-kind="return"]')).toHaveCount(2);
      for (const theme of ['light', 'dark']) {
        await page.evaluate((theme) => {
          document.documentElement.dataset.theme = theme;
        }, theme);
        expect(
          await page.locator('.diagram-boundary').evaluateAll((groups) =>
            groups.every((group) => {
              const css = getComputedStyle(group);
              return ['Top', 'Right', 'Bottom', 'Left'].every(
                (side) =>
                  parseFloat(
                    css.getPropertyValue(`border-${side.toLowerCase()}-width`),
                  ) > 0,
              );
            }),
          ),
        ).toBe(true);
      }
      const picker = page.getByLabel('Invocation of B.work');
      await expect(picker.locator('option')).toHaveCount(2);
      await expect
        .poll(() =>
          page
            .locator('.diagram-card')
            .evaluateAll(
              (cards) =>
                cards.filter(
                  (card) => card.scrollHeight > card.clientHeight + 1,
                ).length,
            ),
        )
        .toBe(0);
      await picker.selectOption('b-again');
      await expect(page.locator('#progress')).toHaveText('7 / 9');
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .click();
      await expect(
        page.locator(
          '.diagram-card[data-call-id="b-again"]:not([data-parent-id])',
        ),
      ).toHaveCount(1);
      await page.locator('#timeline').fill('8');
      await expect(page.locator('#progress')).toHaveText('8 / 9');
      await expect(page.locator('#source-line')).toHaveText('L8');
      await expect(
        page.locator('.diagram-card:not([data-parent-id])'),
      ).toHaveCount(2);
      if (
        await page
          .locator('.diagram-surface')
          .evaluate((surface) => surface.clientWidth >= 640)
      ) {
        const tops = await page
          .locator('.diagram-boundary-file')
          .evaluateAll((groups) =>
            groups.map((group) => group.getBoundingClientRect().top),
          );
        expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
      }
      await picker.selectOption('b');
      await expect(page.locator('#progress')).toHaveText('3 / 9');
      await page.goto(`${baseUrl}/flow/${id}`);
      await show(page, mobile, 'flow');
      await expect(
        page.locator('.diagram-card:not([data-parent-id])'),
      ).toHaveCount(2);
      await page.locator('#follow').uncheck();
      await page.getByLabel('Invocation of B.work').selectOption('b-again');
      await expect(page.locator('[data-edge-kind="return"]')).toHaveCount(2);
      await expect(page.locator('#progress')).toHaveText('7 / 9');
    });

    test('expanded loop routes only its selected prepared call visit', async ({
      page,
    }) => {
      const prepared = [
        ['enter', 'run', 1],
        ['loop', 'run', 2],
        ['call', 'run', 3],
        ['enter', 'worker-1', 6],
        ['return', 'worker-1', 7],
        ['loop', 'run', 2],
        ['call', 'run', 3],
        ['enter', 'worker-2', 6],
        ['return', 'worker-2', 7],
        ['return', 'run', 5],
      ].map(([kind, callId, line], index) => ({
        id: `visit-${index}`,
        kind,
        callId,
        symbolId: callId === 'run' ? 'run' : 'work',
        ...(callId !== 'run' ? { parentCallId: 'run' } : {}),
        label: `${kind} ${callId}`,
        certainty: 'mock',
        values: {},
        stack:
          callId === 'run'
            ? ['run']
            : kind === 'return'
              ? ['run']
              : ['run', callId],
        source: { file: 'visits.ts', line, endLine: line },
      }));
      await page.route(`**/api/flow/${id}`, (route) =>
        route.fulfill({
          json: {
            ...flow,
            steps: prepared.map((event) => ({
              from: event.symbolId,
              to: event.symbolId,
              dtoName: event.label,
              dtoFields: {},
            })),
            trace: {
              ...flow.trace,
              events: prepared,
              sourceFiles: {
                'visits.ts':
                  'function run() {\n for (const x of xs) {\n  work(x);\n }\n return;\n}\nfunction work(x) { return x; }',
              },
            },
          },
        }),
      );
      await page.goto(`${baseUrl}/flow/${id}`);
      await show(page, mobile, 'flow');
      await expect(page.locator('[data-edge-kind="call"]')).toHaveCount(2);
      await page
        .getByRole('button', { name: 'Expand method run', exact: true })
        .click();
      await expect(page.locator('[data-edge-kind="call"]')).toHaveCount(1);
      await expect(page.locator('[data-edge-kind="call"]')).toHaveAttribute(
        'aria-label',
        /worker-1/,
      );
      await page.locator('.diagram-visit').selectOption('1');
      await expect(page.locator('[data-edge-kind="call"]')).toHaveCount(1);
      await expect(page.locator('[data-edge-kind="call"]')).toHaveAttribute(
        'aria-label',
        /worker-2/,
      );
      await expect(
        page.getByLabel('Invocation of work').locator('option'),
      ).toHaveCount(2);
      await expect(page.locator('#progress')).toHaveText('6 / 10');
    });

    test('graph preserves source stepping and exposes exact mock values', async ({
      page,
    }) => {
      await page.goto(`${baseUrl}/flow/${id}`);
      await expect(page.locator('#title')).toHaveText('A.main');
      await show(page, mobile, 'flow');
      await expect(page.locator('.diagram-surface')).toBeVisible();
      await seek(page, 4);
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .click();
      await expect(page.locator('#source-line')).toHaveText('L7');
      const active = page.locator('.diagram-card[data-parent-id].is-active');
      await expect(active).toContainText('assign B.work');
      await expect(active).toHaveCSS('border-right-style', 'solid');
      await expect(active).not.toHaveCSS('border-right-width', '0px');
      await expect(page.locator('.diagram-expanded-method')).toHaveCSS(
        'border-bottom-style',
        'solid',
      );
      await page.locator('#next').click();
      await page.locator('#previous').click();
      await active.locator('summary').click();
      await expect(active).toContainText('"value": 2');
      await page.locator('#next').click();
      await expect(page.locator('#source-line')).toHaveText('L8');
      await expect(active).toContainText('return B.work');
      expect(
        await active.evaluate((card) => {
          const css = getComputedStyle(card);
          // Keep the first text line inside the rounded corner's safe inset.
          return (
            parseFloat(css.paddingLeft) >=
            parseFloat(css.borderTopLeftRadius) / 2
          );
        }),
      ).toBe(true);
      await page.locator('#previous').click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await expect(active).toContainText('assign B.work');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
    test('graph groups loop visits and decision paths without losing steps', async ({
      page,
    }) => {
      const source =
        'function run() {\n  for (const item of items) {\n    if (item.ok) {\n      accept(item);\n    } else {\n      skip(item);\n    }\n  }\n  return count;\n}';
      const prepared = [
        ['enter', 1, 'Start', {}],
        ['loop', 2, 'Item 1', {}],
        ['branch', 3, 'Item is valid', { condition: true }],
        ['statement', 4, 'Accept item', {}],
        ['loop', 2, 'Item 2', {}],
        ['branch', 3, 'Item is invalid', { condition: false }],
        ['statement', 6, 'Skip item', {}],
        ['return', 9, 'Return count', {}],
      ].map(([kind, line, label, values], i) => ({
        id: `control-${i}`,
        kind,
        label,
        values,
        symbolId: 'run',
        callId: 'run',
        stack: kind === 'return' ? [] : ['run'],
        certainty: 'mock',
        source: { file: 'control.ts', line, endLine: line },
      }));
      await page.route(`**/api/flow/${id}`, (route) =>
        route.fulfill({
          json: {
            ...flow,
            steps: prepared.map((event) => ({
              from: 'run',
              to: 'run',
              dtoName: event.label,
              dtoFields: {},
            })),
            trace: {
              ...flow.trace,
              events: prepared,
              sourceFiles: { 'control.ts': source },
            },
          },
        }),
      );
      await page.goto(`${baseUrl}/flow/${id}`);
      await expect(page.locator('#progress')).toHaveText('0 / 8');
      await show(page, mobile, 'flow');
      await expect(page.locator('.diagram-boundary-file')).toHaveCount(1);
      await expect(page.locator('.diagram-boundary-owner')).toHaveCount(0);
      await page
        .getByRole('button', { name: 'Expand method run', exact: true })
        .click();
      const picker = page.locator('.diagram-visit');
      await expect(picker.locator('option')).toHaveCount(2);
      await picker.selectOption('1');
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await expect(
        page.locator('.diagram-card[data-control-type="loop"]'),
      ).toHaveCount(1);
      await seek(page, 6);
      const decision = page.locator(
        '.diagram-card[data-control-type="decision"]',
      );
      await expect(decision).toContainText('Condition false');
      await expect(decision).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(
        page.locator('.diagram-control-region[data-control-type="decision"]'),
      ).toHaveCount(2);
      await expect(page.locator('[data-edge-kind="branch"]')).toHaveCount(2);
      await expect(page.locator('.diagram-path-note')).toHaveText(
        'Path not selected',
      );
      await expect(page.locator('.diagram-path-note button')).toHaveCount(0);
      await expect(
        page.locator(
          '.diagram-control-region[data-control-type="loop"] > span',
        ),
      ).toHaveCSS('writing-mode', 'horizontal-tb');
      await expect(page.locator('.diagram-routing-status')).toBeHidden();
      expect(
        await page
          .locator('.diagram-control-region')
          .evaluateAll((regions) =>
            regions.every(
              (region) =>
                parseFloat(getComputedStyle(region).borderRightWidth) > 0,
            ),
          ),
      ).toBe(true);
      await page
        .getByRole('button', { name: 'Fit diagram', exact: true })
        .click();
      expect(
        await decision.locator('.diagram-name').evaluate((name) => {
          const viewport = document.querySelector<SVGGraphicsElement>(
            '.x6-graph-svg-viewport',
          )!;
          return (
            parseFloat(getComputedStyle(name).fontSize) * viewport.getCTM()!.a
          );
        }),
      ).toBeGreaterThanOrEqual(12);
      expect(
        await page
          .locator('.diagram-card[data-control-type="loop"]')
          .evaluate((card) => {
            const box = card.getBoundingClientRect();
            const surface = document
              .querySelector('.diagram-surface')!
              .getBoundingClientRect();
            return box.left >= surface.left && box.right <= surface.right;
          }),
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          const labels = [
            ...document.querySelectorAll('.diagram-control-region > span'),
          ].map((n) => n.getBoundingClientRect());
          const matrix = document
            .querySelector<SVGGraphicsElement>('.x6-graph-svg-viewport')!
            .getScreenCTM()!;
          return [...document.querySelectorAll('[data-route]')].some((edge) => {
            const points = JSON.parse(edge.getAttribute('data-route')!).map(
              (p: { x: number; y: number }) =>
                new DOMPoint(p.x, p.y).matrixTransform(matrix),
            );
            return points.slice(1).some((b: DOMPoint, i: number) => {
              const a = points[i];
              return labels.some((r) =>
                a.x === b.x
                  ? a.x > r.left &&
                    a.x < r.right &&
                    Math.max(a.y, b.y) > r.top &&
                    Math.min(a.y, b.y) < r.bottom
                  : a.y > r.top &&
                    a.y < r.bottom &&
                    Math.max(a.x, b.x) > r.left &&
                    Math.min(a.x, b.x) < r.right,
              );
            });
          });
        }),
      ).toBe(false);
      const routes = await page
        .locator('[data-edge-kind="branch"]')
        .evaluateAll((edges) =>
          edges.map((edge) => ({
            points: JSON.parse(edge.getAttribute('data-route')!),
            path: edge.querySelector('path')?.getAttribute('d'),
          })),
        );
      expect(routes.some(({ points }) => points[1].x > points[0].x)).toBe(true);
      expect(routes.some(({ points }) => points[1].y > points[0].y)).toBe(true);
      expect(routes.some(({ path }) => /[CQ]/.test(path ?? ''))).toBe(true);
      await expect(page.locator('#source-line')).toHaveText('L3');
      await picker.selectOption('0');
      await expect(page.locator('#progress')).toHaveText('2 / 8');
      await expect(decision).toContainText('Condition true');
    });
    test('diagram navigation remains usable in desktop grid and mobile in-flow layouts', async ({
      page,
    }, info) => {
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      const controls = page.locator('.diagram-controls');
      await expect(controls).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      const canvas = (await page.locator('#canvas').boundingBox())!;
      const positions = [
        ['Horizontal layout', 1, 1],
        ['Pan up', 1, 2],
        ['Zoom in', 1, 3],
        ['Pan left', 2, 1],
        ['Fit diagram', 2, 2],
        ['Pan right', 2, 3],
        ['Pan down', 3, 2],
        ['Zoom out', 3, 3],
      ] as const;
      if (mobile) {
        const footer = page.locator('.diagram-footer');
        await expect(footer).toHaveCSS('position', 'relative');
        await expect(controls).toHaveCSS('display', 'flex');
        await expect(controls).toHaveCSS('overflow-x', 'auto');
        await expect(controls).toHaveCSS('flex-wrap', 'nowrap');
        const surface = (await page.locator('.diagram-surface').boundingBox())!;
        const dock = (await footer.boundingBox())!;
        expect(dock.y).toBeGreaterThanOrEqual(surface.y + surface.height - 1);
        expect(dock.x).toBeGreaterThanOrEqual(canvas.x - 1);
        expect(dock.x + dock.width).toBeLessThanOrEqual(
          canvas.x + canvas.width + 1,
        );
        for (const [name] of positions) {
          const button = controls.getByRole('button', { name, exact: true });
          await button.scrollIntoViewIfNeeded();
          await expect(button).toBeInViewport();
          await expect
            .poll(() =>
              button.evaluate((node) => {
                const box = node.getBoundingClientRect();
                const hit = document.elementFromPoint(
                  box.left + box.width / 2,
                  box.top + box.height / 2,
                );
                return hit === node || node.contains(hit);
              }),
            )
            .toBe(true);
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      } else {
        await expect(controls).toHaveCSS('display', 'grid');
        const bounds = (await controls.boundingBox())!;
        expect(canvas.x + canvas.width - bounds.x - bounds.width).toBeCloseTo(
          12,
          0,
        );
        expect(canvas.y + canvas.height - bounds.y - bounds.height).toBeCloseTo(
          12,
          0,
        );
        for (const [name, row, column] of positions) {
          const button = controls.getByRole('button', { name, exact: true });
          await expect(button).toBeInViewport();
          await expect(button).toHaveCSS('grid-row-start', String(row));
          await expect(button).toHaveCSS('grid-column-start', String(column));
        }
      }
      const viewport = page.locator('.x6-graph-svg-viewport');
      const before = await viewport.getAttribute('transform');
      await controls
        .getByRole('button', { name: 'Pan right', exact: true })
        .click();
      await expect
        .poll(() => viewport.getAttribute('transform'))
        .not.toBe(before);
      await controls
        .getByRole('button', { name: 'Fit diagram', exact: true })
        .click();
      const cursor = await page.locator('#progress').textContent();
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .focus();
      await page.keyboard.press('Enter');
      const children = page.locator('.diagram-card[data-parent-id]');
      const beforeDirection = await children.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-step')),
      );
      await controls
        .getByRole('button', { name: 'Horizontal layout', exact: true })
        .focus();
      await page.keyboard.press('Enter');
      await expect(
        controls.getByRole('button', { name: 'Vertical layout', exact: true }),
      ).toBeVisible();
      await expect(page.locator('#progress')).toHaveText(cursor!);
      expect(
        await children.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-step')),
        ),
      ).toEqual(beforeDirection);
      const first = (await children.nth(0).boundingBox())!;
      const second = (await children.nth(1).boundingBox())!;
      if (second.y > first.y + first.height) {
        expect(second.x).toBeCloseTo(first.x, 0);
      } else {
        expect(second.x).toBeGreaterThan(first.x + first.width);
        expect(second.y).toBeCloseTo(first.y, 0);
      }
      await expect(
        controls.locator('.diagram-orientation .diagram-layout-icon'),
      ).toBeVisible();
      await expect(controls.locator('.diagram-orientation')).not.toContainText(
        '⇅',
      );
      await expect(page.locator('.diagram-routing-status')).toBeEmpty();
      await controls
        .getByRole('button', { name: 'Vertical layout', exact: true })
        .click();
      const verticalFirst = (await children.nth(0).boundingBox())!;
      const verticalSecond = (await children.nth(1).boundingBox())!;
      expect(verticalSecond.y).toBeGreaterThan(
        verticalFirst.y + verticalFirst.height,
      );
      expect(verticalSecond.x).toBeCloseTo(verticalFirst.x, 0);
      await controls
        .getByRole('button', { name: 'Horizontal layout', exact: true })
        .click();
      await page.reload();
      await show(page, mobile, 'flow');
      await expect(
        controls.getByRole('button', { name: 'Vertical layout', exact: true }),
      ).toBeVisible();
      await controls
        .getByRole('button', { name: 'Vertical layout', exact: true })
        .click();
      await expect(
        controls.getByRole('button', {
          name: 'Horizontal layout',
          exact: true,
        }),
      ).toBeVisible();
      await page.screenshot({ path: info.outputPath('corner-controls.png') });
      if (mobile) {
        await page
          .getByRole('button', { name: 'Open class A details', exact: true })
          .click();
        await page
          .getByRole('button', { name: 'Expand method A.main', exact: true })
          .click();
        const sourceStep = page.getByRole('button', {
          name: 'Go to source step 6',
          exact: true,
        });
        const isUnobstructed = () =>
          sourceStep.evaluate((button) => {
            const box = button.getBoundingClientRect();
            const hit = document.elementFromPoint(
              box.left + box.width / 2,
              box.top + box.height / 2,
            );
            return hit === button || button.contains(hit);
          });
        await expectPointerHitTarget(page, 'Go to source step 6');
        await sourceStep.evaluate((button) => {
          const box = button.getBoundingClientRect();
          const overlay = document.createElement('div');
          overlay.dataset.testStepOverlay = 'true';
          Object.assign(overlay.style, {
            position: 'fixed',
            left: `${box.left}px`,
            top: `${box.top}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
            zIndex: '2147483647',
            backgroundColor: '#000',
            pointerEvents: 'auto',
          });
          document.body.append(overlay);
        });
        try {
          await expect.poll(isUnobstructed).toBe(false);
        } finally {
          await page
            .locator('[data-test-step-overlay="true"]')
            .evaluate((overlay) => overlay.remove());
        }
        await expectPointerHitTarget(page, 'Go to source step 6');
        await sourceStep.click();
        await expect(page.locator('#progress')).toHaveText('6 / 8');
        await show(page, mobile, 'code');
        await expect(page.locator('.code-row[data-line="4"]')).toHaveAttribute(
          'aria-current',
          'location',
        );
      }
    });
    test('method inputs persist and controls follow the selected theme', async ({
      page,
    }) => {
      await page.route(`**/api/flow/${id}`, async (route) => {
        const response = await route.fetch();
        const data = await response.json();
        data.trace.events[2].inputs = { prices: [20, 30] };
        await route.fulfill({ response, json: data });
      });
      await open(page, 'flow');
      await seek(page, 4);
      await show(page, mobile, 'flow');
      const method = page.locator(
        '.diagram-card[data-call-id="b"]:not([data-parent-id])',
      );
      await expect(method.locator('summary')).toHaveText(
        'Inputs + values · simulated',
      );
      await method.locator('summary').click();
      await expect(method.locator('.diagram-value')).toContainText(
        '"prices": [\n    20,\n    30',
      );
      await expect(method.locator('.diagram-value')).toContainText(
        '"value": 2',
      );
      await page.locator('#next').click();
      await expect(method.locator('.diagram-value')).toContainText('"prices"');
      await method
        .getByRole('button', { name: 'Inspect method B.work', exact: true })
        .click();
      await page.mouse.move(0, 0);
      const action = page.locator('.diagram-selection button').first();
      const inactiveEvent = page
        .locator('.method-event:not([aria-current="step"])')
        .first();
      await expect(action).toHaveCSS('background-color', 'rgb(30, 44, 67)');
      await expect(inactiveEvent).toHaveCSS(
        'background-color',
        'rgb(30, 44, 67)',
      );
      await page
        .getByRole('button', { name: 'Dark theme', exact: true })
        .click();
      await expect(action).toHaveCSS('background-color', 'rgb(241, 245, 249)');
      await expect(inactiveEvent).toHaveCSS(
        'background-color',
        'rgb(241, 245, 249)',
      );
    });
    test('full map nests files and owners with synchronized visible mock context', async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      await expect(page.locator('.diagram-boundary-file')).toHaveCount(1);
      await expect(page.locator('.diagram-boundary-owner')).toHaveCount(2);
      await expect(page.locator('.x6-edge[data-edge-kind="call"]')).toHaveCount(
        1,
      );
      await expect(
        page.locator('.x6-edge[data-edge-kind="return"]'),
      ).toHaveCount(1);
      await expect(page.locator('.diagram-context')).toHaveCount(0);
      await expect(
        page.getByRole('group', { name: 'Pan diagram', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Read selected method', exact: true }),
      ).toHaveCount(0);
      const panRight = page.getByRole('button', {
        name: 'Pan right',
        exact: true,
      });
      await expect(panRight).toHaveCSS('font-size', '0px');
      expect(
        await panRight.evaluate(
          (el) => getComputedStyle(el, '::before').maskImage,
        ),
      ).toContain('/pan-arrow.png');
      expect(
        (await page.locator('.diagram-heading').boundingBox())!.height,
      ).toBeLessThan(mobile ? 110 : 80);
      await seek(page, 4);
      const valuesCard = page.locator(
        '.diagram-card[data-call-id="b"]:not([data-parent-id])',
      );
      await expect(valuesCard.locator('.diagram-location')).toHaveText(
        'demo.ts:7',
      );
      await expect(valuesCard.locator('.diagram-value')).toBeHidden();
      await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
      const surfaceBounds = (await page
        .locator('.diagram-surface')
        .boundingBox())!;
      await page.mouse.move(surfaceBounds.x + 8, surfaceBounds.y + 8);
      await page.mouse.down();
      await page.mouse.move(surfaceBounds.x + 28, surfaceBounds.y + 28, {
        steps: 4,
      });
      await page.mouse.up();
      const viewportTransform = () =>
        page.locator('.x6-graph-svg-viewport').getAttribute('transform');
      const beforeExpand = await viewportTransform();
      const collapsedHeight = await valuesCard.evaluate(
        (el) => el.clientHeight,
      );
      await valuesCard.locator('summary').focus();
      await page.keyboard.press('Enter');
      expect(await viewportTransform()).toBe(beforeExpand);
      await expect(valuesCard.locator('.diagram-value')).toBeVisible();
      expect(await valuesCard.locator('.diagram-value').textContent()).toBe(
        '{\n  "value": 2\n}',
      );
      expect(
        await valuesCard.evaluate(
          (el) => el.scrollHeight <= el.clientHeight + 1,
        ),
      ).toBe(true);
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await expect(page.locator('.diagram-boundary.is-active')).toHaveCount(2);
      await page
        .getByRole('button', { name: 'Fit diagram', exact: true })
        .click();
      const file = await page.locator('.diagram-boundary-file').boundingBox();
      const owner = await page
        .locator('.diagram-boundary-owner.is-active')
        .boundingBox();
      const card = await page.locator('.diagram-card.is-active').boundingBox();
      for (const [outer, inner] of [
        [file, owner],
        [owner, card],
      ]) {
        expect(inner!.x).toBeGreaterThan(outer!.x);
        expect(inner!.y).toBeGreaterThan(outer!.y);
        expect(inner!.x + inner!.width).toBeLessThan(outer!.x + outer!.width);
        expect(inner!.y + inner!.height).toBeLessThan(outer!.y + outer!.height);
      }
      await page.screenshot({ path: info.outputPath('grouped-map.png') });
      await page.locator('#next').click();
      await expect(valuesCard.locator('.diagram-value')).toHaveText('2');
      const returnEdge = page.locator('.x6-edge[data-edge-kind="return"]');
      await expect(returnEdge).toContainText('B.work returns');
      await expect(returnEdge).toContainText('2 (simulated)');
      await expect(returnEdge).toHaveAttribute('aria-label', /b to a; 2/);
      await expect(returnEdge.locator('path[marker-end]')).toHaveAttribute(
        'stroke',
        '#4f46e5',
      );
      await page.locator('#previous').click();
      await expect(returnEdge.locator('path[marker-end]')).toHaveAttribute(
        'stroke',
        '#64748b',
      );
      await expect(valuesCard.locator('.diagram-value')).toContainText(
        '"value": 2',
      );
      const beforeCollapse = await viewportTransform();
      await valuesCard.locator('summary').focus();
      await page.keyboard.press('Enter');
      expect(await viewportTransform()).toBe(beforeCollapse);
      await expect(valuesCard.locator('.diagram-value')).toBeHidden();
      expect(await valuesCard.evaluate((el) => el.clientHeight)).toBe(
        collapsedHeight,
      );
      await page
        .getByRole('button', { name: 'Toggle group B', exact: true })
        .click();
      await expect(page.locator('.diagram-boundary-owner')).toHaveCount(1);
      await expect(
        page.locator('.x6-edge[data-edge-kind="return"]'),
      ).toHaveCount(0);
      await expect(valuesCard).toHaveCount(0);
      await expect(page.locator('.diagram-selection')).toBeHidden();
      await page
        .getByRole('button', { name: 'Toggle group B', exact: true })
        .click();
      const methodButton = page.getByRole('button', {
        name: 'Expand method B.work',
        exact: true,
      });
      await methodButton.focus();
      const beforeMethod = await valuesCard.boundingBox();
      const beforeMethodScale = await page
        .locator('.x6-graph-svg-viewport')
        .evaluate((el) => new DOMMatrix(el.getAttribute('transform')!).a);
      await page.keyboard.press('Enter');
      const afterMethod = (await valuesCard.boundingBox())!;
      await expect(
        page.locator('.x6-edge[data-selected-pair="true"]'),
      ).toHaveCount(2);
      expect(afterMethod.x).toBeCloseTo(beforeMethod!.x, 0);
      expect(afterMethod.y).toBeCloseTo(beforeMethod!.y, 0);
      expect(
        await page
          .locator('.x6-graph-svg-viewport')
          .evaluate((el) => new DOMMatrix(el.getAttribute('transform')!).a),
      ).toBeCloseTo(beforeMethodScale);
      await page.locator('.diagram-surface').focus();
      const beforePan = await viewportTransform();
      const beforePanCursor = await page.locator('#progress').textContent();
      await page.keyboard.press('ArrowRight');
      expect(await viewportTransform()).not.toBe(beforePan);
      await expect(page.locator('#progress')).toHaveText(beforePanCursor!);
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('.diagram-pan > summary')).toHaveCount(0);
      await page
        .getByRole('button', { name: 'Pan right', exact: true })
        .click();
      expect(await viewportTransform()).not.toBe(beforePan);
      await expect(page.locator('#progress')).toHaveText(beforePanCursor!);
      await page.getByRole('button', { name: 'Pan left', exact: true }).click();
      await expect(page.locator('.diagram-pan > summary')).toHaveCount(0);
      if (mobile) {
        const readTarget = await page
          .getByRole('button', { name: 'Read selected node', exact: true })
          .boundingBox();
        expect(readTarget!.width).toBeGreaterThanOrEqual(44);
        expect(readTarget!.height).toBeGreaterThanOrEqual(44);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      }
      await page
        .getByRole('button', { name: 'Read selected node', exact: true })
        .click();
      expect(
        await page
          .locator('.x6-graph-svg-viewport')
          .evaluate((el) => new DOMMatrix(el.getAttribute('transform')!).a),
      ).toBe(1);
      await page
        .getByRole('button', { name: 'Fit diagram', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText(
        'Execution path',
      );
      await expect(
        page.locator('.diagram-card:not([data-parent-id])'),
      ).toHaveCount(2);
      await expect(page.locator('.diagram-boundary-owner')).toHaveCount(2);
      await expect(
        page.locator('.x6-edge:not([data-edge-kind="return"])'),
      ).toHaveCount(2);
      const expanded = page.locator(
        '.diagram-card[data-call-id="b"]:not([data-parent-id])',
      );
      await expect(expanded.locator('.diagram-name')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      const methodNode = await expanded.getAttribute('data-node-id');
      const inner = page.locator(
        `.diagram-card[data-parent-id=${JSON.stringify(methodNode)}]`,
      );
      await expect(inner).toHaveCount(2);
      await expect(inner.first().locator('.diagram-name')).toContainText(
        'assign B.work',
      );
      await expect(inner.locator('.diagram-kind')).not.toContainText([
        'enter',
        'call',
      ]);
      await expect(page.locator('.diagram-inline-steps')).toHaveCount(0);
      const firstStep = (await inner.nth(0).boundingBox())!;
      const secondStep = (await inner.nth(1).boundingBox())!;
      expect(secondStep.y).toBeGreaterThan(firstStep.y + firstStep.height);
      expect(Math.abs(secondStep.x - firstStep.x)).toBeLessThan(1);
      const stepHeight = await inner.first().evaluate((el) => el.clientHeight);
      await inner.first().locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(inner.first().locator('.diagram-value')).toBeVisible();
      expect(
        await inner.first().evaluate((el) => el.clientHeight),
      ).toBeGreaterThan(stepHeight);
      expect(
        await inner
          .first()
          .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      ).toBe(true);
      const outerBounds = (await expanded.boundingBox())!;
      for (const child of await inner.all()) {
        const bounds = (await child.boundingBox())!;
        expect(bounds.x).toBeGreaterThan(outerBounds.x);
        expect(bounds.y).toBeGreaterThan(outerBounds.y);
        expect(bounds.x + bounds.width).toBeLessThan(
          outerBounds.x + outerBounds.width,
        );
        expect(bounds.y + bounds.height).toBeLessThan(
          outerBounds.y + outerBounds.height,
        );
      }
      await page.screenshot({ path: info.outputPath('expanded-values.png') });
      const innerValues = inner.first().locator('summary');
      await expect
        .poll(() =>
          innerValues.evaluate((summary) => {
            const bounds = summary.getBoundingClientRect();
            const x = bounds.left + bounds.width / 2;
            const y = bounds.top + bounds.height / 2;
            const hit = document.elementFromPoint(x, y);
            return {
              reachable: hit === summary || summary.contains(hit),
              bounds: bounds.toJSON(),
              hit: hit?.className?.toString() ?? hit?.tagName,
            };
          }),
        )
        .toMatchObject({ reachable: true });
      await innerValues.click();
      await expect(inner.first().locator('.diagram-value')).toBeHidden();
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await page.locator('#previous').click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await page
        .getByRole('button', { name: 'Fit diagram', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Go to source step 5', exact: true })
        .click();
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await expect(valuesCard.locator('.diagram-value')).toHaveText('2');
      await page
        .getByRole('button', { name: 'Expand method A.main', exact: true })
        .click();
      await expect(page.locator('.diagram-expanded-method')).toHaveCount(2);
      await page
        .getByRole('button', { name: 'Fit diagram', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .click();
      await expect(page.locator('.diagram-expanded-method')).toHaveCount(1);
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .click();
      await expect(page.locator('.diagram-expanded-method')).toHaveCount(2);
      const callerNode = await page
        .locator('.diagram-card[data-call-id="a"]:not([data-parent-id])')
        .getAttribute('data-node-id');
      const callingStep = page.locator(
        `.diagram-card[data-parent-id=${JSON.stringify(callerNode)}][data-step="2"]`,
      );
      await expect(callingStep).toHaveCount(1);
      await expect(callingStep.locator('.diagram-name')).toContainText(
        'B.work();',
      );
      await expect(
        page.locator(
          `.diagram-card[data-parent-id=${JSON.stringify(methodNode)}][data-step="3"]`,
        ),
      ).toHaveCount(0);
      await expect(
        page.locator('.diagram-card[data-call-id="b"]:not([data-parent-id])'),
      ).toHaveCount(1);
      const callNode = await callingStep.getAttribute('data-node-id');
      const entryNode = methodNode;
      const returnNode = await page
        .locator(
          `.diagram-card[data-parent-id=${JSON.stringify(methodNode)}][data-step="5"]`,
        )
        .getAttribute('data-node-id');
      const callEdge = page.locator('.x6-edge[data-edge-kind="call"]');
      await expect(callEdge).toHaveAttribute('data-source-node', callNode!);
      await expect(callEdge).toHaveAttribute('data-target-node', entryNode!);
      await expect(returnEdge).toHaveAttribute('data-source-node', returnNode!);
      await expect(returnEdge).toHaveAttribute('data-target-node', callNode!);
      const geometryErrors = await page.evaluate(() => {
        const errors: string[] = [];
        const viewport = document.querySelector<SVGGElement>(
          '.x6-graph-svg-viewport',
        )!;
        const matrix = viewport.getScreenCTM()!.inverse();
        const method = document
          .querySelector(
            '.diagram-card[data-call-id="b"]:not([data-parent-id])',
          )!
          .getBoundingClientRect();
        const topLeft = new DOMPoint(method.left, method.top).matrixTransform(
          matrix,
        );
        const bottomRight = new DOMPoint(
          method.right,
          method.bottom,
        ).matrixTransform(matrix);
        const callRoute = JSON.parse(
          document
            .querySelector('.x6-edge[data-edge-kind="call"]')!
            .getAttribute('data-route')!,
        );
        const destination = callRoute.at(-1);
        if (
          Math.min(
            Math.abs(destination.x - topLeft.x),
            Math.abs(destination.x - bottomRight.x),
          ) > 1 ||
          destination.y <= topLeft.y ||
          destination.y >= topLeft.y + 112
        )
          errors.push('call misses method header side');
        const boxes = [
          ...document.querySelectorAll(
            '.diagram-card:not(.diagram-expanded-method)',
          ),
        ].map((card) => {
          const rect = card.getBoundingClientRect();
          const start = new DOMPoint(rect.left, rect.top).matrixTransform(
            matrix,
          );
          const end = new DOMPoint(rect.right, rect.bottom).matrixTransform(
            matrix,
          );
          return {
            x: start.x + 1,
            y: start.y + 1,
            width: end.x - start.x - 2,
            height: end.y - start.y - 2,
          };
        });
        type Point = { x: number; y: number };
        const segments: [Point, Point][] = [];
        for (const edge of document.querySelectorAll('.x6-edge')) {
          const points: Point[] = JSON.parse(edge.getAttribute('data-route')!);
          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1]!,
              b = points[i]!;
            if (a.x !== b.x && a.y !== b.y) errors.push('diagonal');
            for (const box of boxes) {
              const collision =
                a.x === b.x
                  ? a.x > box.x &&
                    a.x < box.x + box.width &&
                    Math.max(a.y, b.y) > box.y &&
                    Math.min(a.y, b.y) < box.y + box.height
                  : a.y > box.y &&
                    a.y < box.y + box.height &&
                    Math.max(a.x, b.x) > box.x &&
                    Math.min(a.x, b.x) < box.x + box.width;
              if (collision) errors.push('card crossed');
            }
            for (const [c, d] of segments) {
              const overlap =
                a.x === b.x && c.x === d.x && a.x === c.x
                  ? Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) >
                    Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y))
                  : a.y === b.y &&
                    c.y === d.y &&
                    a.y === c.y &&
                    Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) >
                      Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x));
              if (overlap) errors.push('shared segment');
            }
            segments.push([a, b]);
          }
          const path = edge.querySelector<SVGPathElement>('path[marker-end]')!;
          const screen = path.getScreenCTM()!;
          for (
            let distance = 4;
            distance < path.getTotalLength() - 4;
            distance += 4
          ) {
            const p = path
              .getPointAtLength(distance)
              .matrixTransform(screen)
              .matrixTransform(matrix);
            if (
              boxes.some(
                (box) =>
                  p.x > box.x &&
                  p.x < box.x + box.width &&
                  p.y > box.y &&
                  p.y < box.y + box.height,
              )
            )
              errors.push('rendered path crosses card');
          }
        }
        return errors;
      });
      expect(geometryErrors).toEqual([]);
      await expect(page.locator('.diagram-routing-status')).toBeEmpty();
      await page
        .getByRole('button', { name: 'Fit diagram', exact: true })
        .click();
      await page.screenshot({ path: info.outputPath('inline-map.png') });
      if (!mobile) {
        await page.locator('#maximize-flow').click();
        await expect(async () => {
          const surface = (await page
            .locator('.diagram-surface')
            .boundingBox())!;
          const panel = (await page.locator('#flow-panel').boundingBox())!;
          expect(surface.height / panel.height).toBeGreaterThan(0.7);
          await expect(page.locator('.diagram-context')).toHaveCount(0);
        }).toPass();
        await page.screenshot({
          path: info.outputPath('compact-workspace.png'),
        });
      }
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
      const scale = () =>
        page
          .locator('.x6-graph-svg-viewport')
          .evaluate((el) => new DOMMatrix(el.getAttribute('transform')!).a);
      const beforeScale = await scale();
      await page.locator('#previous').click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      expect(await scale()).toBeCloseTo(beforeScale);
      await page.locator('#next').click();
      await page
        .getByRole('button', { name: 'Collapse expanded methods', exact: true })
        .click();
      await expect(page.locator('.diagram-card[data-parent-id]')).toHaveCount(
        0,
      );
      await expect(page.locator('.x6-edge[data-edge-kind="call"]')).toHaveCount(
        1,
      );
      await expect(
        page.locator('.x6-edge[data-edge-kind="return"]'),
      ).toHaveCount(1);
      const callerId = 'function:' + JSON.stringify(['demo.ts', 'A.main']);
      const calleeId = 'function:' + JSON.stringify(['demo.ts', 'B.work']);
      await expect(callEdge).toHaveAttribute('data-source-node', callerId);
      await expect(callEdge).toHaveAttribute('data-target-node', calleeId);
      await expect(returnEdge).toHaveAttribute('data-source-node', calleeId);
      await expect(returnEdge).toHaveAttribute('data-target-node', callerId);
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await expect(page.locator('.diagram-boundary')).toHaveCount(0);
      await expect(page.locator('.diagram-selection')).toBeHidden();
      await expect(page.locator('.diagram-context')).toBeHidden();
      expect(errors).toEqual([]);
    });
    test('load recovery keeps help available and restores URL context', async ({
      page,
    }) => {
      let failed = true;
      await page.route('**/api/flow/' + id, (route) =>
        route.fulfill(
          failed
            ? { status: 503, json: { error: 'Temporary failure' } }
            : { json: flow },
        ),
      );
      await page.goto(`${baseUrl}/flow/${id}?view=map&step=4`);
      await expect(page.locator('#title')).toHaveText('Flow unavailable');
      await expect(page.locator('#play')).toBeDisabled();
      await page.locator('#help').click();
      await expect(page.locator('#help-panel')).toBeVisible();
      await page.locator('#close-help').click();
      failed = false;
      await page.getByRole('button', { name: 'Retry loading flow' }).click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await expect(page).toHaveURL(/view=map&step=4/);
      await show(page, mobile, 'flow');
      if (mobile)
        await expect(
          page.locator('.mobile-views [data-mobile-view="flow"]'),
        ).toHaveAttribute('aria-pressed', 'true');
      await expect(
        page.getByRole('button', { name: 'Expand method A.main', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Toggle group A', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Open class A details', exact: true }),
      ).toBeVisible();
      await expect(page.locator('#play')).toBeEnabled();
      await page.locator('#next').click();
      await expect(page).toHaveURL(/view=map&step=5/);
      await page.reload();
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('link', { name: 'Skip to workspace' }),
      ).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#workspace-main')).toBeFocused();
      await expect(page.locator('#snippet')).toHaveAttribute('translate', 'no');
    });
    test('map owner direct source keeps the global call-site and breakpoint', async ({
      page,
    }) => {
      await open(page, 'flow');
      await seek(page, 4);
      await show(page, mobile, 'state');
      await page.locator('#breakpoint').click();
      await expect(page.locator('#breakpoint')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await show(page, mobile, 'flow');
      await expect(
        page.getByRole('button', { name: 'Toggle group A', exact: true }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Open class A details', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText('A');
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await page
        .getByRole('button', { name: 'Expand method A.main', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText(
        'A.main · a',
      );
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await test.step('A.main prepared step remains an unobstructed pointer target', async () => {
        await expectPointerHitTarget(page, 'Go to source step 6');
        await page
          .getByRole('button', { name: 'Go to source step 6', exact: true })
          .click();
      });
      await expect(page.locator('#progress')).toHaveText('6 / 8');
      await show(page, mobile, 'code');
      await expect(page.locator('.code-row[data-line="4"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await seek(page, 2);
      await expect(page.locator('#progress')).toHaveText('2 / 8');
      await expect(page.locator('.code-row[data-line="3"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await seek(page, 4);
      await show(page, mobile, 'state');
      await expect(page.locator('#breakpoint')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await show(page, mobile, 'flow');
      await page
        .getByRole('button', { name: 'Collapse diagram level', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText('A');
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await page
        .getByRole('button', { name: 'Collapse diagram level', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText(
        'Execution path',
      );
      await expect(page.locator('.x6-edge[data-edge-kind="call"]')).toHaveCount(
        1,
      );
    });
    test('map owner nested B.work remains clickable after direct A.main source navigation', async ({
      page,
    }) => {
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      await test.step('open class and method scopes', async () => {
        await page
          .getByRole('button', { name: 'Open class A details', exact: true })
          .click();
        await page
          .getByRole('button', { name: 'Expand method A.main', exact: true })
          .click();
        await expect(page.locator('.diagram-heading > strong')).toHaveText(
          'A.main · a',
        );
      });
      await test.step('source selection does not obstruct nested method', async () => {
        await expectPointerHitTarget(page, 'Go to source step 6');
        await page
          .getByRole('button', { name: 'Go to source step 6', exact: true })
          .click();
        await expect(page.locator('#progress')).toHaveText('6 / 8');
        await show(page, mobile, 'code');
        await seek(page, 4);
        await show(page, mobile, 'flow');
        await expectPointerHitTarget(page, 'Expand method B.work');
        await page
          .getByRole('button', { name: 'Expand method B.work', exact: true })
          .click();
        await expect(page.locator('.diagram-heading > strong')).toHaveText(
          'B.work · b',
        );
      });
      await test.step('nested prepared source, return, and call-site remain navigable', async () => {
        await seek(page, 3);
        await expectPointerHitTarget(page, 'Go to source step 4');
        await page
          .getByRole('button', { name: 'Go to source step 4', exact: true })
          .click();
        await expect(page.locator('#progress')).toHaveText('4 / 8');
        await show(page, mobile, 'code');
        await expect(page.locator('.code-row[data-line="7"]')).toHaveAttribute(
          'aria-current',
          'location',
        );
        await seek(page, 2);
        await expect(page.locator('.code-row[data-line="3"]')).toHaveAttribute(
          'aria-current',
          'location',
        );
        await show(page, mobile, 'flow');
        for (const heading of ['A.main · a', 'A', 'Execution path']) {
          await page
            .getByRole('button', {
              name: 'Collapse diagram level',
              exact: true,
            })
            .click();
          await expect(page.locator('.diagram-heading > strong')).toHaveText(
            heading,
          );
        }
        await expect(
          page.locator('.x6-edge[data-edge-kind="call"]'),
        ).toHaveCount(1);
      });
    });
    test('map owner keyboard reaches nested prepared step without changing URL scope', async ({
      page,
    }) => {
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      for (const [name, heading] of [
        ['Open class A details', 'A'],
        ['Expand method A.main', 'A.main · a'],
        ['Expand method B.work', 'B.work · b'],
      ] as const) {
        await page.getByRole('button', { name, exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('.diagram-heading > strong')).toHaveText(
          heading,
        );
      }
      await page
        .getByRole('button', { name: 'Go to source step 4', exact: true })
        .focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await expect(page).toHaveURL(/view=map&step=4/);
      await show(page, mobile, 'code');
      await expect(page.locator('.code-row[data-line="7"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
    });
    test('routing disclosures expose congested connections without hover', async ({
      page,
    }) => {
      const repeatedReturns = Array.from({ length: 40 }, (_, index) => ({
        ...events[4],
        id: `return-${index}`,
        result: index,
      }));
      await page.route('**/api/flow/' + id, (route) =>
        route.fulfill({
          json: {
            ...flow,
            trace: {
              ...flow.trace,
              events: [
                ...events.slice(0, 4),
                ...repeatedReturns,
                ...events.slice(5),
              ],
            },
          },
        }),
      );
      await page.goto(`${baseUrl}/flow/${id}`);
      await expect(page.locator('#title')).toHaveText('A.main');
      await show(page, mobile, 'flow');
      const warning = page.locator('.diagram-routing-status');
      await expect(warning.locator('summary')).toContainText(
        'connections not drawn',
      );
      await warning.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(warning.locator('p')).toContainText(
        'Collapse unrelated methods',
      );
      await expect(warning.locator('ul')).toContainText('B.work');
      await expect(warning.locator('ul')).toContainText('A.main');
    });
    test('diagram drilldown changes playback detail without losing cursor or breakpoints', async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      await page
        .getByRole('button', { name: 'Open class A details', exact: true })
        .click();
      await expect(
        page.locator('.diagram-heading > span:not(.diagram-control-legend)'),
      ).toContainText('Method-level playback');
      await expect(page.locator('.diagram-control-legend')).toContainText(
        'Decision',
      );
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('1 / 8');
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('3 / 8');
      await page.locator('#previous').click();
      await expect(page.locator('#progress')).toHaveText('1 / 8');
      await page
        .getByRole('button', { name: 'Expand method A.main', exact: true })
        .click();
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('2 / 8');
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('3 / 8');
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('6 / 8');
      await page.locator('#previous').click();
      await expect(page.locator('#progress')).toHaveText('3 / 8');
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .click();
      await expect(
        page.getByRole('button', { name: 'Go to source step 4', exact: true }),
      ).toContainText('const value = 2;');
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await expect(page.locator('.diagram-card.is-active')).toHaveCount(1);
      await expect(page.locator('.diagram-card.is-active')).toBeInViewport();
      await page.screenshot({ path: info.outputPath('drilldown.png') });
      await show(page, mobile, 'state');
      await page.locator('#breakpoint').click();
      await show(page, mobile, 'flow');
      await page
        .getByRole('button', { name: 'Collapse diagram level', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText(
        'A.main · a',
      );
      await seek(page, 3);
      await page.locator('#play').click();
      await expect(page.locator('#progress')).toHaveText('4 / 8');
      await expect(page.locator('#play')).toHaveAttribute(
        'data-playing',
        'false',
      );
      await show(page, mobile, 'code');
      await expect(page.locator('.code-row[data-line="7"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await show(page, mobile, 'flow');
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('6 / 8');
      await page
        .getByRole('button', { name: 'Collapse diagram level', exact: true })
        .click();
      await expect(
        page.locator('.diagram-heading > span:not(.diagram-control-legend)'),
      ).toContainText('Method-level playback');
      await page
        .getByRole('button', { name: 'Collapse diagram level', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText(
        'Execution path',
      );
      await expect(
        page.getByRole('button', { name: 'Open class A details', exact: true }),
      ).toBeVisible();
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('7 / 8');
      await show(page, mobile, 'console');
      await expect(page.locator('#console-output')).toContainText('result: 2');
      expect(errors).toEqual([]);
    });
    test('full map fanout keeps distinct call routes and arrowheads', async ({
      page,
    }, info) => {
      const fanout = [
        events[0]!,
        ...['b', 'c', 'd'].flatMap((callId) => [
          {
            ...events[2]!,
            id: callId + '-enter',
            callId,
            parentCallId: 'a',
            stack: ['a', callId],
          },
          {
            ...events[4]!,
            id: callId + '-return',
            callId,
            parentCallId: 'a',
            stack: ['a'],
          },
        ]),
        events[7]!,
      ];
      await page.route(`**/api/flow/${id}`, (route) =>
        route.fulfill({
          json: {
            ...flow,
            trace: { ...flow.trace!, events: fanout },
            steps: fanout.map((event) => ({
              from: event.symbolId,
              to: event.symbolId,
              dtoName: event.label,
              dtoFields: {},
            })),
          },
        }),
      );
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      if (!mobile) await page.locator('#maximize-flow').click();
      await expect(
        page.locator('.x6-edge:not([data-edge-kind="return"])'),
      ).toHaveCount(3);
      const routes = await page
        .locator('.x6-edge[data-edge-kind="call"] path')
        .evaluateAll((paths) =>
          paths
            .filter((el) => el.hasAttribute('marker-end'))
            .map((el) => {
              const path = el as SVGPathElement;
              const start = path.getPointAtLength(0);
              const near = path.getPointAtLength(
                Math.min(20, path.getTotalLength() / 4),
              );
              return {
                d: path.getAttribute('d'),
                start: [start.x, start.y],
                near: [near.x, near.y],
                length: path.getTotalLength(),
              };
            }),
        );
      expect(routes).toHaveLength(3);
      expect(new Set(routes.map((route) => route.d)).size).toBe(3);
      expect(
        new Set(routes.map((route) => JSON.stringify(route.near))).size,
      ).toBe(3);
      expect(routes.every((route) => route.length > 20)).toBe(true);
      await page.screenshot({ path: info.outputPath('fanout-routes.png') });
    });
    test('typed call and return routes use prepared invocation ancestry, not edge count', async ({
      page,
    }) => {
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      const caller = page.locator(
        '.diagram-card[data-call-id="a"]:not([data-parent-id])',
      );
      const callee = page.locator(
        '.diagram-card[data-call-id="b"]:not([data-parent-id])',
      );
      const callerId = await caller.getAttribute('data-node-id');
      const calleeId = await callee.getAttribute('data-node-id');
      expect(callerId).toBeTruthy();
      expect(calleeId).toBeTruthy();
      const call = page.locator('.x6-edge[data-edge-kind="call"]');
      const preparedReturn = page.locator('.x6-edge[data-edge-kind="return"]');
      await expect(call).toHaveCount(1);
      await expect(preparedReturn).toHaveCount(1);
      await expect(call).toHaveAttribute('data-source-node', callerId!);
      await expect(call).toHaveAttribute('data-target-node', calleeId!);
      await expect(call).toHaveAttribute('aria-label', /Call b:.*step 2/);
      await expect(preparedReturn).toHaveAttribute(
        'data-source-node',
        calleeId!,
      );
      await expect(preparedReturn).toHaveAttribute(
        'data-target-node',
        callerId!,
      );
      await expect(preparedReturn).toHaveAttribute(
        'aria-label',
        /Prepared simulated return at step 5: b to a/,
      );

      // Contradictory return ancestry is not evidence for a prepared arrow.
      const conflicted = flowSchema.parse({
        ...flow,
        trace: {
          ...flow.trace!,
          events: events.map((event, index) =>
            index === 4 ? { ...event, parentCallId: 'wrong-parent' } : event,
          ),
        },
      });
      await page.route(`**/api/flow/${id}`, (route) =>
        route.fulfill({ json: conflicted }),
      );
      await page.reload();
      await show(page, mobile, 'flow');
      await expect(call).toHaveCount(1);
      await expect(preparedReturn).toHaveCount(0);
      await expect(page.locator('#progress')).toHaveText('0 / 8');
    });
    test('map scope pages preserve source-step access and every prepared cursor', async ({
      page,
    }) => {
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      await page
        .getByRole('button', { name: 'Open class A details', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Expand method A.main', exact: true })
        .click();
      await expect(page.locator('.diagram-pages')).toContainText('1–3 / 4');
      await expect(page.locator('.diagram-card')).toHaveCount(3);
      await expect(
        page.locator('.x6-edge[data-edge-kind="step-order"]'),
      ).toHaveCount(2);
      await expect(page.locator('.x6-edge[data-edge-kind="call"]')).toHaveCount(
        0,
      );
      await page
        .getByRole('button', { name: 'Next diagram page', exact: true })
        .click();
      await expect(page.locator('.diagram-pages')).toContainText('4–4 / 4');
      await page
        .getByRole('button', { name: 'Go to source step 8', exact: true })
        .click();
      await expect(page.locator('#progress')).toHaveText('8 / 8');
      for (let index = 1; index <= events.length; index++) {
        await seek(page, index);
        await show(page, mobile, 'code');
        await expect(
          page.locator(
            `.code-row[data-line="${events[index - 1]!.source.line}"]`,
          ),
        ).toHaveAttribute('aria-current', 'location');
        await show(page, mobile, 'flow');
      }
    });
    test('recursive drilldown keeps invocation identity and restores each parent', async ({
      page,
    }) => {
      const recursiveEvents = [
        events[0]!,
        events[1]!,
        events[2]!,
        {
          ...events[2]!,
          id: 'recursive-enter',
          callId: 'c',
          parentCallId: 'b',
          stack: ['a', 'b', 'c'],
        },
        {
          ...events[4]!,
          id: 'recursive-return',
          callId: 'c',
          parentCallId: 'b',
          stack: ['a', 'b'],
        },
        { ...events[3]!, stack: ['a', 'b'] },
        events[4]!,
        events[7]!,
      ];
      const recursiveFlow = flowSchema.parse({
        ...flow,
        trace: { ...flow.trace!, events: recursiveEvents },
        steps: recursiveEvents.map((event) => ({
          from: event.symbolId,
          to: event.symbolId,
          dtoName: event.label,
          dtoFields: {},
        })),
      });
      await page.route(`**/api/flow/${id}`, (route) =>
        route.fulfill({ json: recursiveFlow }),
      );
      await open(page, 'flow');
      await show(page, mobile, 'flow');
      if (!mobile) await page.setViewportSize({ width: 2400, height: 1000 });
      const assertOrderedLayout = async (
        level: 'overview' | 'class',
        axis: 'vertical' | 'horizontal',
      ) => {
        const cards = page.locator('.diagram-card');
        await expect(page.locator('.diagram-canvas')).toHaveAttribute(
          'data-direction',
          axis,
        );
        if (level === 'overview') {
          // Repeated B.work invocations share one method card, not one route.
          await expect(
            page.locator('.x6-edge[data-edge-kind="call"]'),
          ).toHaveCount(2);
          await expect(
            page.locator('.x6-edge[data-edge-kind="return"]'),
          ).toHaveCount(2);
          for (const invocationId of ['b', 'c']) {
            await expect(
              page.locator(
                `.x6-edge[data-edge-kind="call"][aria-label^="Call ${invocationId}:"]`,
              ),
            ).toHaveCount(1);
            await expect(
              page.locator(
                `.x6-edge[data-edge-kind="return"][aria-label*="${invocationId} to ${invocationId === 'c' ? 'b' : 'a'}"]`,
              ),
            ).toHaveCount(1);
          }
        } else {
          // Scoped method ordering is explicitly not a prepared call route.
          await expect(
            page.locator('.x6-edge[data-edge-kind="first-appearance"]'),
          ).toHaveCount((await cards.count()) - 1);
          await expect(
            page.locator('.x6-edge[data-edge-kind="call"]'),
          ).toHaveCount(0);
          await expect(
            page.locator('.x6-edge[data-edge-kind="return"]'),
          ).toHaveCount(0);
          await expect(
            page.locator('.x6-edge[data-edge-kind="first-appearance"]'),
          ).toHaveAttribute('aria-label', /First appearance order—not a call/);
        }
        await expect(async () => {
          const first = await cards.nth(0).boundingBox();
          const second = await cards.nth(1).boundingBox();
          expect(first).not.toBeNull();
          expect(second).not.toBeNull();
          const xSeparated = second!.x >= first!.x + first!.width - 1;
          const ySeparated = second!.y >= first!.y + first!.height - 1;
          // Prepared siblings may not overlap in either layout, even if a
          // horizontal file group wraps into a new row on a narrow viewport.
          expect(xSeparated || ySeparated).toBe(true);
          if (axis === 'vertical') expect(ySeparated).toBe(true);
          if (axis === 'horizontal' && !mobile) expect(xSeparated).toBe(true);
        }).toPass();
      };
      // Viewport width does not choose the graph direction: new sessions use
      // top-to-bottom until the accessible orientation control is activated.
      await assertOrderedLayout('overview', 'vertical');
      await page
        .getByRole('button', { name: 'Horizontal layout', exact: true })
        .click();
      await assertOrderedLayout('overview', 'horizontal');
      await page
        .getByRole('button', { name: 'Open class B details', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText('B');
      await assertOrderedLayout('class', 'horizontal');
      await seek(page, 4);
      await expect(page.locator('.diagram-card.is-active')).toHaveCount(1);
      await expect(page.locator('.diagram-card.is-active')).toHaveAttribute(
        'data-call-id',
        'c',
      );
      await page
        .locator('.diagram-card[data-call-id="b"] .diagram-name')
        .click();
      await page
        .getByRole('button', { name: 'Expand method B.work', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText(
        'B.work · c',
      );
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await page
        .getByRole('button', { name: 'Collapse diagram level', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText(
        'B.work · b',
      );
      await page.locator('#next').click();
      await expect(page.locator('#progress')).toHaveText('6 / 8');
      await page
        .getByRole('button', { name: 'Collapse diagram level', exact: true })
        .click();
      await expect(page.locator('.diagram-heading > strong')).toHaveText('B');
      await assertOrderedLayout('class', 'horizontal');
      await expect(page.locator('.diagram-card.is-active')).toHaveAttribute(
        'data-call-id',
        'b',
      );
    });
    test('sibling methods keep two real parent calls without inventing a sibling call', async ({
      page,
    }) => {
      const siblingEvents = [
        events[0]!,
        events[1]!,
        events[2]!,
        events[4]!,
        {
          ...events[2]!,
          id: 'sibling-enter',
          callId: 'c',
          parentCallId: 'a',
          stack: ['a', 'c'],
        },
        {
          ...events[4]!,
          id: 'sibling-return',
          callId: 'c',
          parentCallId: 'a',
          stack: ['a'],
        },
        events[7]!,
      ];
      const siblings = flowSchema.parse({
        ...flow,
        trace: { ...flow.trace!, events: siblingEvents },
        steps: siblingEvents.map((event) => ({
          from: event.symbolId,
          to: event.symbolId,
          dtoName: event.label,
          dtoFields: {},
        })),
      });
      await page.route(`**/api/flow/${id}`, (route) =>
        route.fulfill({ json: siblings }),
      );
      await open(page, 'flow', siblingEvents.length);
      await show(page, mobile, 'flow');
      await expect(page.locator('.x6-edge[data-edge-kind="call"]')).toHaveCount(
        2,
      );
      await expect(
        page.locator('.x6-edge[data-edge-kind="return"]'),
      ).toHaveCount(2);
      for (const callId of ['b', 'c']) {
        await expect(
          page.locator(
            `.x6-edge[data-edge-kind="return"][aria-label*="${callId} to a"]`,
          ),
        ).toHaveCount(1);
      }
      await page
        .getByRole('button', { name: 'Open class B details', exact: true })
        .click();
      await expect(page.locator('.diagram-card')).toHaveCount(2);
      await expect(page.locator('.x6-edge[data-edge-kind="call"]')).toHaveCount(
        0,
      );
      await expect(
        page.locator('.x6-edge[data-edge-kind="return"]'),
      ).toHaveCount(0);
      const ordered = page.locator(
        '.x6-edge[data-edge-kind="first-appearance"]',
      );
      await expect(ordered).toHaveCount(1);
      await expect(ordered).toHaveAttribute(
        'aria-label',
        /First appearance order—not a call/,
      );
      await expect(ordered.locator('path[marker-end]')).toHaveAttribute(
        'stroke-dasharray',
        /5[ ,]+7/,
      );
    });
    test('player controls perform the expected actions', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await open(page, 'flow');
      await expect(page.locator('#snippet')).toContainText('class');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('#progress')).toHaveText('1 / 8');
      await page.keyboard.press('i');
      await expect(page.locator('#progress')).toHaveText('2 / 8');
      await page.keyboard.press('i');
      await expect(page.locator('#progress')).toHaveText('3 / 8');
      await page.keyboard.press('u');
      await expect(page.locator('#progress')).toHaveText('5 / 8');
      await page.keyboard.press('Home');
      await expect(page.locator('#progress')).toHaveText('0 / 8');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('o');
      await expect(page.locator('#progress')).toHaveText('2 / 8');
      await page.keyboard.press('o');
      await expect(page.locator('#progress')).toHaveText('6 / 8');
      await page.keyboard.press('Home');
      await page.locator('#speed').selectOption('225');
      await page.locator('#speed').evaluate((el: HTMLElement) => el.blur());
      await page.keyboard.press('Space');
      await expect(page.locator('#progress')).toHaveText('8 / 8');
      await expect(page.locator('#play')).toHaveAttribute(
        'data-playing',
        'false',
      );
      await page.keyboard.press('/');
      await expect(page.locator('#search')).toBeFocused();
      await page.locator('#search').fill('assign');
      await expect(page.locator('#event-list .event-row')).toHaveCount(2);
      await page.locator('#search').fill('');
      await page.locator('#kind-filter').selectOption('changes');
      await expect(page.locator('#event-list .event-row')).toHaveCount(2);
      await seek(page, 4);
      await show(page, mobile, 'state');
      await page.locator('#tab-values').click();
      await expect(page.locator('#fields')).toContainText('value');
      await page.locator('#changes-only').check();
      await expect(page.locator('#fields .changed')).not.toHaveCount(0);
      await page.locator('#bookmark').click();
      await expect(page.locator('#bookmark')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.locator('#breakpoint').click();
      await expect(page.locator('#breakpoint')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await show(page, mobile, 'trace');
      await page.locator('#bookmarks-only').click();
      await expect(page.locator('#event-list .event-row')).toHaveCount(1);
      await seek(page, 8);
      await show(page, mobile, 'console');
      await expect(page.locator('#console-output')).toContainText('result: 2');
      await expect(page.locator('#console-output')).not.toContainText('\u001b');
      await page.locator('#help').click();
      await expect(page.locator('#help-panel')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#help-panel')).toBeHidden();
      await expect(page.locator('#help')).toBeFocused();
      expect(errors).toEqual([]);
    });
  });
}
test('layout persists, source pages navigate, export downloads, errors display', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 'flow');
  await page.locator('#workspace-divider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#workspace-divider')).toHaveAttribute(
    'aria-valuenow',
    '240',
  );
  await page.locator('#source-flow-divider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#source-flow-divider')).toHaveAttribute(
    'aria-valuenow',
    '60',
  );
  await page.reload();
  await expect(page.locator('#workspace-divider')).toHaveAttribute(
    'aria-valuenow',
    '240',
  );
  await expect(page.locator('#source-flow-divider')).toHaveAttribute(
    'aria-valuenow',
    '60',
  );
  // Shared CSS regressions can pass entrypoint screenshot comparisons.
  for (const divider of ['#workspace-divider', '#source-flow-divider']) {
    await expect(page.locator(divider)).toHaveCSS('border-radius', '4px');
    await expect(page.locator(divider)).not.toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
  }
  await page.locator('#source-later').click();
  await expect(page.locator('#source-resume')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.locator('#export').click();
  expect((await download).suggestedFilename()).toBe('code-anime-trace.json');
  await page.goto(`${baseUrl}/flow/22222222-2222-4222-8222-222222222222`);
  await expect(page.locator('#title')).toHaveText('Flow unavailable');
  await expect(page.locator('#status')).toHaveText(
    'Session expired or not found',
  );
  await expect(page.locator('#play')).toBeDisabled();
});
test('X6 views preserve source playback, paging, inspection and zoom', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().includes('Content Security Policy')
    )
      errors.push(message.text());
  });
  await open(page, 'flow');
  await expect(page.locator('.diagram-card')).toHaveCount(2);
  await expect(page.locator('.diagram-pages')).toContainText(
    '2 visible · drag to pan',
  );
  await expect(
    page.getByRole('button', { name: 'Next diagram page', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Open class A details', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Expand method A.main', exact: true })
    .click();
  await expect(page.locator('.diagram-pages')).toContainText('1–3 / 4');
  await expect(page.locator('.diagram-card')).toHaveCount(3);
  await page
    .getByRole('button', { name: 'Next diagram page', exact: true })
    .click();
  await expect(page.locator('.diagram-pages')).toContainText('4–4 / 4');
  await expect(
    page.getByRole('button', { name: 'Next diagram page' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Previous diagram page' }).click();
  await expect(page.locator('.diagram-card[data-step="8"]')).toHaveCount(0);
  await expect(page.locator('.diagram-pages')).toContainText('1–3 / 4');
  await page
    .getByRole('button', { name: 'Next diagram page', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Go to source step 8', exact: true })
    .click();
  await expect(page.locator('#progress')).toHaveText('8 / 8');
  await expect(page.locator('.code-row[data-line="5"]')).toHaveAttribute(
    'aria-current',
    'location',
  );
  await page
    .getByRole('button', { name: 'Show all prepared steps', exact: true })
    .click();
  await expect(page.locator('.diagram-heading > strong')).toHaveText(
    'Execution path',
  );
  await seek(page, 4);
  await expect(page).toHaveURL(/view=map&step=4/);
  await expect(page.locator('.diagram-card.is-active')).toContainText('value');
  await expect(page.locator('.code-row[data-line="7"]')).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(page.locator('.diagram-card')).toHaveCount(2);
  await expect(page.locator('.x6-edge[data-edge-kind="call"]')).toHaveCount(1);
  await expect(page.locator('.x6-edge[data-edge-kind="return"]')).toHaveCount(
    1,
  );
  await expect(page.locator('.diagram-card.is-active')).toContainText('work');
  await expect(
    page.locator('.diagram-card.is-active .diagram-location'),
  ).toHaveText('demo.ts:7');
  await page
    .getByRole('button', { name: 'Inspect method B.work', exact: true })
    .click();
  await expect(page.locator('#method-details')).toBeVisible();
  await page
    .getByRole('button', { name: 'Inspect selected node', exact: true })
    .click();
  await expect(page.locator('#method-details')).toBeHidden();
  const transform = await page
    .locator('.x6-graph-svg-viewport')
    .getAttribute('transform');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.locator('.x6-graph-svg-viewport')).not.toHaveAttribute(
    'transform',
    transform ?? '',
  );
  await page.getByRole('button', { name: 'Fit diagram', exact: true }).click();
  await page
    .getByRole('button', { name: 'Toggle group B', exact: true })
    .click();
  await expect(page.locator('.diagram-card')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Toggle group B', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Toggle group B', exact: true })
    .click();
  await expect(page.locator('.diagram-card')).toHaveCount(2);
  await page.locator('#speed').selectOption('225');
  await page.locator('#play').click();
  await expect(page.locator('#progress')).toHaveText('8 / 8');
  expect(errors).toEqual([]);
});

test('continuation auto-extends playback and exposes next/previous chunk links', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/flow/${continuationFirstId}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('0 / 4');
  await page
    .getByRole('button', { name: 'Expand method A.main', exact: true })
    .first()
    .click();
  const mainCard = page.locator(
    '.diagram-card[data-call-id="a"]:not([data-parent-id])',
  );
  await expect(mainCard).toHaveClass(/diagram-expanded-method/);
  const mainNodeId = await mainCard.getAttribute('data-node-id');
  expect(mainNodeId).not.toBeNull();
  const mainSteps = page.locator(
    `.diagram-card[data-parent-id=${JSON.stringify(mainNodeId)}]`,
  );
  await expect(mainSteps.first()).toBeVisible();
  await expect(page.locator('.diagram-heading > strong')).toHaveText(
    'Execution path',
  );
  await show(page, false, 'state');
  await page.locator('#tab-context').click();
  await expect(page.locator('#next-chunk')).toBeVisible();
  await expect(page.locator('#next-chunk')).toHaveAttribute(
    'href',
    `/flow/${continuationId}`,
  );
  await page.locator('#speed').selectOption('225');
  await page.locator('#speed').evaluate((el: HTMLElement) => el.blur());
  await page.locator('#play').click();
  await expect(page.locator('#progress')).toHaveText('8 / 8');
  await expect(page.locator('#next-chunk')).toBeHidden();
  await expect(mainCard).toHaveClass(/diagram-expanded-method/);
  await expect(mainSteps.first()).toBeVisible();
  await expect(page.locator('.diagram-heading > strong')).toHaveText(
    'Execution path',
  );
  await expect(page.locator('#play')).toHaveAttribute('data-playing', 'false');
  await page.screenshot({
    path: info.outputPath('continuation-complete.png'),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
  await page.goto(`${baseUrl}/flow/${continuationId}`);
  await expect(page.locator('#progress')).toHaveText('0 / 4');
  await show(page, false, 'state');
  await page.locator('#tab-context').click();
  await expect(page.locator('#previous-chunk')).toHaveAttribute(
    'href',
    `/flow/${continuationFirstId}`,
  );
  await page.locator('#previous-chunk').click();
  await expect(page).toHaveURL(`${baseUrl}/flow/${continuationFirstId}`);
});
test('baseline variant switch isolates flow data and refreshes chunk links', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/flow/${proposedId}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('0 / 8');
  await page.keyboard.press('End');
  await show(page, false, 'state');
  await page.locator('#tab-context').click();
  await expect(page.locator('#coverage')).toContainText('Proposed coverage');
  await expect(page.locator('#previous-chunk')).toHaveAttribute(
    'href',
    `/flow/${id}`,
  );
  await page.locator('#variant').selectOption('baseline');
  await expect(page.locator('#progress')).toHaveText('0 / 2');
  await expect(page.locator('#coverage')).toContainText('Baseline coverage');
  await expect(page.locator('#previous-chunk')).toBeHidden();
  await expect(page.locator('#previous-chunk')).not.toHaveAttribute('href');
  await page.screenshot({
    path: info.outputPath('baseline-variant-switch.png'),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
  await page.locator('#variant').selectOption('proposed');
  await expect(page.locator('#coverage')).toContainText('Proposed coverage');
  await expect(page.locator('#progress')).toHaveText('8 / 8');
  await expect(page.locator('#previous-chunk')).toBeVisible();
  await expect(page.locator('#previous-chunk')).toHaveAttribute(
    'href',
    `/flow/${id}`,
  );
});
test('coverage, diagnostics and truncated warning render from trace metadata', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/flow/${consoleOverflowId}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('0 / 350');
  await page.keyboard.press('End');
  await show(page, false, 'state');
  await page.locator('#tab-context').click();
  await page.locator('#panel-context summary').click();
  await expect(page.locator('#evidence-mode')).toHaveText('Simulated values');
  await expect(page.locator('#coverage')).toContainText(
    'Overflow console fixture',
  );
  await expect(page.locator('#diagnostics')).toContainText(
    'Truncated fixture trace',
  );
  await expect(page.locator('#status')).toContainText('Trace incomplete');
  await page.screenshot({
    path: info.outputPath('coverage-diagnostics-truncated.png'),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
});
test('source gutter click sets breakpoint and pauses playback at that line', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/flow/${id}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#snippet')).toContainText('class');
  const gutter = page.locator('.code-row[data-line="3"] .code-gutter');
  await expect(gutter).toBeEnabled();
  await gutter.click();
  await expect(gutter).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#speed').selectOption('225');
  await page.locator('#speed').evaluate((el: HTMLElement) => el.blur());
  await page.locator('#play').click();
  await expect(page.locator('#progress')).toHaveText('2 / 8');
  await expect
    .poll(async () => page.locator('#status').textContent())
    .toMatch(/Breakpoint/);
  await expect(page.locator('#play')).toHaveAttribute('data-playing', 'false');
  await page.screenshot({
    path: info.outputPath('source-line-breakpoint-pause.png'),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
});
test('console older/newer pages navigate when events exceed page size', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/flow/${consoleOverflowId}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('0 / 350');
  await page.keyboard.press('End');
  await show(page, false, 'console');
  await expect(page.locator('#console-output')).toContainText('line 350');
  await expect(page.locator('#console-older')).toBeEnabled();
  await page.locator('#console-older').click();
  await expect(page.locator('#console-output')).toContainText('line 50');
  await expect(page.locator('#console-newer')).toBeEnabled();
  await page.locator('#console-newer').click();
  await expect(page.locator('#console-output')).toContainText('line 350');
  await page.screenshot({
    path: info.outputPath('console-pagination.png'),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
});
test('End jumps to last step and Left arrow returns to cursor zero', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/flow/${id}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('0 / 8');
  await page.keyboard.press('End');
  await expect(page.locator('#progress')).toHaveText('8 / 8');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#progress')).toHaveText('7 / 8');
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#progress')).toHaveText('0 / 8');
});
test('inspector falls back to dtoFields when event.after is absent', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/flow/${dtoFallbackId}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#title')).toHaveText('A.main');
  await page.keyboard.press('ArrowRight');
  await show(page, false, 'state');
  await page.locator('#tab-values').click();
  await expect(page.locator('#fields')).toContainText('fallbackField');
  await expect(page.locator('#fields')).toContainText('from-dtoFields');
  await page.screenshot({
    path: info.outputPath('dtofields-fallback.png'),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
});
