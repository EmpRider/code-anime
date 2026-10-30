import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createWebApp } from '../../src/web/app.js';
import type { SessionStore } from '../../src/domain/flow.js';

const fixturePath = fileURLToPath(
  new URL('../fixtures/v3/proposed-baseline.json', import.meta.url),
);

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  const store: SessionStore = {
    async create() {
      throw new Error('The V3 scaffold does not create sessions');
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
  if (!address || typeof address === 'string') {
    throw new Error('No test server address');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('isolated V3 scaffold validates one JSON fixture under production CSP without claiming diagram readiness', async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const response = await page.goto(`${baseUrl}/v3-preview.html`);
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-security-policy']).toContain(
    "script-src 'self'",
  );
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'idle',
  );

  await page.locator('#v3-file').setInputFiles(fixturePath);
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'scaffold-only',
  );
  await expect(page.locator('#v3-nodes')).toHaveText('2');
  await expect(page.locator('#v3-edges')).toHaveText('1');
  await expect(page.getByText('Rendering not connected')).toBeVisible();
  await expect(page.locator('.v3-preview-canvas svg')).toHaveCount(0);
  expect(pageErrors).toEqual([]);

  await page.screenshot({
    path: testInfo.outputPath('ui-v3-scaffold-only-desktop.png'),
    fullPage: true,
  });
});
