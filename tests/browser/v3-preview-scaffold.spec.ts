import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createWebApp } from '../../src/web/app.js';
import type { SessionStore } from '../../src/domain/flow.js';

const fixturePath = fileURLToPath(
  new URL('../fixtures/v3/proposed-baseline.json', import.meta.url),
);
const nestedPath = fileURLToPath(
  new URL('../fixtures/v3/nested-multilingual.json', import.meta.url),
);

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  const store: SessionStore = {
    async create() {
      throw new Error('The isolated V3 preview never creates sessions');
    },
    async get() {
      return undefined;
    },
    async latest() {
      return undefined;
    },
    async close() {},
  };
  server = createServer(createWebApp(store));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No test server address');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('local immutable V3 JSON renders X6 using the real same-origin ELK Worker under production CSP', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const semanticRequests: string[] = [];
  const workerUrls: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('worker', (worker) => workerUrls.push(worker.url()));
  page.on('request', (request) => {
    if (/\/api\/flow\/|\/fixtures\/.*\.json/.test(request.url()))
      semanticRequests.push(request.url());
  });
  await page.addInitScript(() => {
    const original = Worker.prototype.postMessage;
    (window as any).__v3WorkerCommands = [];
    (window as any).__v3CspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      (window as any).__v3CspViolations.push(event.violatedDirective);
    });
    Worker.prototype.postMessage = function (message: unknown, ...rest: any[]) {
      (window as any).__v3WorkerCommands.push(
        (message as { cmd?: string })?.cmd,
      );
      return original.call(this, message, ...rest);
    };
  });
  const response = await page.goto(`${baseUrl}/v3-preview.html`);
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-security-policy']).toContain(
    "script-src 'self'",
  );
  expect(response?.headers()['content-security-policy']).toContain(
    "style-src 'self'",
  );
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'idle',
  );

  await page.locator('#v3-file').setInputFiles(fixturePath);
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'ready',
  );
  await expect(page.locator('#v3-empty-state')).toBeHidden();
  await expect(page.locator('#v3-nodes')).toHaveText('2');
  await expect(page.locator('#v3-edges')).toHaveText('1');
  await expect(page.locator('#v3-scene svg')).not.toHaveCount(0);
  await expect(page.locator('[data-cell-id="node:one"]')).toHaveCount(1);
  await expect(page.locator('[data-cell-id="node:two"]')).toHaveCount(1);
  await expect(page.locator('[data-cell-id="edge:1"]')).toHaveCount(1);
  await expect(page.locator('#v3-empty-state')).toBeHidden();
  expect(await page.evaluate(() => (window as any).__v3WorkerCommands)).toEqual(
    ['register', 'layout'],
  );
  expect(workerUrls).toHaveLength(1);
  const workerUrl = workerUrls[0];
  if (!workerUrl) throw new Error('V3 ELK Worker was not registered');
  expect(new URL(workerUrl).pathname).toBe('/vendor/elk-worker.min.js');
  expect(semanticRequests).toEqual([]);

  await page.locator('#v3-variant').selectOption('baseline');
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'ready',
  );
  await expect(page.locator('[data-cell-id="node:baseline"]')).toHaveCount(1);
  await expect(page.locator('[data-cell-id="edge:1"]')).toHaveCount(0);
  await page.locator('#v3-orientation').selectOption('vertical');
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'ready',
  );
  expect(semanticRequests).toEqual([]);

  await page.locator('#v3-file').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{invalid'),
  });
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'invalid',
  );
  await expect(page.locator('#v3-scene svg')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__v3CspViolations)).toEqual(
    [],
  );
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

for (const { width, height } of [
  { width: 900, height: 600 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`native nested X6 Worker screenshot matrix ${width}x${height} horizontal and vertical`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const semanticRequests: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.addInitScript(() => {
      (window as any).__v3CspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        (window as any).__v3CspViolations.push(event.violatedDirective);
      });
    });
    page.on('request', (request) => {
      if (/\/api\/flow\/|\/fixtures\/.*\.json/.test(request.url()))
        semanticRequests.push(request.url());
    });
    await page.goto(`${baseUrl}/v3-preview.html`);
    await page.locator('#v3-file').setInputFiles(nestedPath);
    for (const orientation of ['horizontal', 'vertical'] as const) {
      await page.locator('#v3-orientation').selectOption(orientation);
      await expect(page.locator('#v3-preview')).toHaveAttribute(
        'data-v3-state',
        'ready',
      );
      await expect(page.locator('[data-cell-id="node:choice"]')).toHaveCount(1);
      await expect(page.locator('[data-cell-id="node:λ"]')).toHaveCount(1);
      await expect(page.locator('[data-cell-id="group:outer"]')).toHaveCount(1);
      await expect(page.locator('[data-cell-id="edge:start"]')).toHaveCount(1);
      await expect(page.locator('[data-cell-id="edge:true"]')).toHaveCount(1);
      await expect(page.locator('#v3-scene svg')).toContainText('next');
      await page.screenshot({
        path: testInfo.outputPath(
          `ui-v3-${width}x${height}-${orientation}.png`,
        ),
        fullPage: true,
      });
    }

    await page.locator('#v3-cursor').evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = '2';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('#v3-cursor-value')).toHaveText('2 / 4');
    await expect(page.locator('[data-cell-id="edge:start"]')).toHaveCount(1);
    const beforeCollapse = await page
      .locator('#v3-scene [data-cell-id]')
      .count();
    await page.locator('[data-v3-group-id="group:outer"]').check();
    await expect(page.locator('#v3-preview')).toHaveAttribute(
      'data-v3-state',
      'ready',
    );
    await expect(page.locator('#v3-empty-state')).toBeHidden();
    await expect(page.locator('[data-cell-id="group:outer"]')).toHaveCount(1);
    await expect(page.locator('[data-cell-id="node:choice"]')).toHaveCount(0);
    await expect(page.locator('[data-cell-id="edge:true"]')).toHaveCount(0);
    expect(await page.locator('#v3-scene [data-cell-id]').count()).toBeLessThan(
      beforeCollapse,
    );
    if (width === 1440) {
      await page.screenshot({
        path: testInfo.outputPath('ui-v3-1440x900-collapsed.png'),
        fullPage: true,
      });
    }
    await page.locator('[data-v3-group-id="group:outer"]').uncheck();
    await expect(page.locator('#v3-preview')).toHaveAttribute(
      'data-v3-state',
      'ready',
    );
    await expect(page.locator('[data-cell-id="node:choice"]')).toHaveCount(1);
    await page.locator('[data-v3-group-id="group:choice"]').check();
    await expect(page.locator('#v3-preview')).toHaveAttribute(
      'data-v3-state',
      'ready',
    );
    await expect(page.locator('[data-cell-id="group:choice"]')).toHaveCount(1);
    await expect(page.locator('[data-cell-id="node:choice"]')).toHaveCount(0);
    await page.locator('[data-v3-group-id="group:choice"]').uncheck();
    await expect(page.locator('#v3-preview')).toHaveAttribute(
      'data-v3-state',
      'ready',
    );
    await page.locator('#v3-scene').focus();
    const viewport = page.locator('#v3-scene .x6-graph-svg-viewport');
    const beforePan = await viewport.getAttribute('transform');
    await page.keyboard.press('ArrowLeft');
    await expect(viewport).not.toHaveAttribute('transform', beforePan ?? '');
    const beforeZoom = await viewport.getAttribute('transform');
    await page.keyboard.press('+');
    await expect(viewport).not.toHaveAttribute('transform', beforeZoom ?? '');
    expect(semanticRequests).toEqual([]);
    expect(
      await page.evaluate(() => (window as any).__v3CspViolations),
    ).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}
