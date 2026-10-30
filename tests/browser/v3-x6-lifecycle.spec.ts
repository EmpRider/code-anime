import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { createWebApp } from '../../src/web/app.js';
import type { SessionStore } from '../../src/domain/flow.js';

const fixturePath = fileURLToPath(
  new URL('../fixtures/v3/proposed-baseline.json', import.meta.url),
);

// Test-only IIFE: both constructors and Config originate from one X6 module instance.
async function bundledX6Probe(): Promise<string> {
  const entry = 'virtual:ca060-x6-lifecycle';
  const resolved = `\0${entry}`;
  const output = await build({
    configFile: false,
    publicDir: false,
    logLevel: 'error',
    plugins: [
      {
        name: 'ca060-x6-lifecycle-entry',
        resolveId(id) {
          if (id === entry) return resolved;
        },
        load(id) {
          if (id === resolved)
            return `import { Config, Graph } from '@antv/x6';
                    globalThis.__ca060X6Probe = { Config, Graph };`;
        },
      },
    ],
    build: {
      write: false,
      emptyOutDir: false,
      minify: true,
      lib: {
        entry,
        formats: ['iife'],
        name: 'CA060X6Probe',
        fileName: () => 'ca060-x6-probe.js',
      },
    },
  });
  const chunks = (Array.isArray(output) ? output : [output]).flatMap((item) =>
    'output' in item ? item.output : [],
  );
  const chunk = chunks.find((item) => item.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk' || chunk.code.length > 8_000_000)
    throw new Error('CA060 isolated X6 test bundle unavailable or oversized');
  return chunk.code;
}

test('CA060: same-module G2 opt-out disposal cannot drop live G1 X6 core CSS', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(60_000);
  const code = await bundledX6Probe();
  const context = await browser.newContext(); // Separate browser module realm for global Config.
  try {
    const page = await context.newPage();
    await page.goto('about:blank'); // No CSP here; production CSP tests stay unchanged.
    await page.setContent('<div id="g1"></div><div id="g2"></div>');
    await page.addScriptTag({ content: code });
    const result = await page.evaluate(() => {
      const probe = (window as any).__ca060X6Probe;
      if (!probe?.Graph || !probe?.Config)
        throw new Error('CA060 bundled Config/Graph module identity unavailable');
      const { Graph, Config } = probe;
      const previousFlag = Config.autoInsertCSS;
      const fingerprint = (value: string): string => {
        let hash = 2166136261;
        for (let i = 0; i < value.length; i++) {
          hash ^= value.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16).padStart(8, '0');
      };
      const coreStyles = (): number =>
        Array.from(document.querySelectorAll('style')).filter((style) => {
          const content = style.textContent ?? '';
          return content.length === 2854 && fingerprint(content) === 'a73d50ec';
        }).length;
      const counts = {
        before: coreStyles(),
        afterG1: 0,
        afterG2: 0,
        afterG2Dispose: 0,
      };
      let g1: any;
      let g2: any;
      try {
        Config.autoInsertCSS = true;
        g1 = new Graph({
          container: document.getElementById('g1'),
          width: 200,
          height: 120,
          autoResize: false,
        });
        counts.afterG1 = coreStyles();
        Config.autoInsertCSS = false;
        g2 = new Graph({
          container: document.getElementById('g2'),
          width: 200,
          height: 120,
          autoResize: false,
        });
        counts.afterG2 = coreStyles();
        g2.dispose();
        g2 = undefined;
        counts.afterG2Dispose = coreStyles();
      } finally {
        try {
          g2?.dispose();
        } finally {
          try {
            g1?.dispose();
          } finally {
            Config.autoInsertCSS = previousFlag;
          }
        }
      }
      return counts;
    });
    await testInfo.attach('ca060-x6-core-style-counts', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    });
    // A negative control: a Graph with auto CSS disabled must not tear down
    // another live Graph's core style. A RED result blocks a global Config fix.
    expect(result.afterG1, JSON.stringify(result)).toBeGreaterThan(
      result.before,
    );
    expect(result.afterG2, JSON.stringify(result)).toBe(result.afterG1);
    expect(result.afterG2Dispose, JSON.stringify(result)).toBe(result.afterG1);
  } finally {
    await context.close();
  }
});

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

test('CA060: native V3 preview uses its own script bundle, not legacy X6 entry', async ({
  page,
}, testInfo) => {
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script')
      scripts.push(new URL(request.url()).pathname);
  });
  const response = await page.goto(`${baseUrl}/v3-preview.html`);
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-security-policy']).toContain(
    "style-src 'self'",
  );
  expect(await page.locator('link[href="/vendor/x6.css"]').count()).toBe(1);
  await page.locator('#v3-file').setInputFiles(fixturePath);
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'ready',
  );
  await testInfo.attach('ca060-v3-script-resources', {
    body: JSON.stringify([...new Set(scripts)].slice(0, 64)),
    contentType: 'application/json',
  });
  expect(scripts, JSON.stringify(scripts)).toContain('/v3-preview/preview.js');
  expect(
    scripts.filter((path) => path.startsWith('/diagram/')),
    JSON.stringify(scripts),
  ).toEqual([]);
  // Standalone script isolation does not prove safety if legacy and V3 share
  // the same document. The G1/G2 test above characterizes that risk.
});
