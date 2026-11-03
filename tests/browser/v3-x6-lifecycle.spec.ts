import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, normalizePath } from 'vite';
import { createWebApp } from '../../src/web/app.js';
import { x6CSSLifecyclePlugin } from '../../scripts/x6-css-lifecycle-plugin.mjs';
import type { SessionStore } from '../../src/domain/flow.js';

const fixturePath = fileURLToPath(
  new URL('../fixtures/v3/proposed-baseline.json', import.meta.url),
);

// Test-only IIFE: both constructors and Config originate from one X6 module instance.
async function bundledX6Probe(): Promise<string> {
  const entry = 'virtual:ca060-x6-lifecycle';
  const resolved = `\0${entry}`;
  let expectedRootId: string | undefined;
  const output = await build({
    configFile: false,
    publicDir: false,
    logLevel: 'error',
    plugins: [
      x6CSSLifecyclePlugin(),
      {
        name: 'ca060-x6-lifecycle-entry',
        enforce: 'pre',
        configResolved(config) {
          expectedRootId = normalizePath(resolve(config.root, entry));
        },
        resolveId(id, importer, options) {
          if (id === entry) return resolved;
          if (
            expectedRootId !== undefined &&
            normalizePath(id) === expectedRootId &&
            importer == null &&
            options?.isEntry === true
          )
            return resolved;
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
        throw new Error(
          'CA060 bundled Config/Graph module identity unavailable',
        );
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

test('CA060: X6 core CSS survives both disposal orders and HMR-skipped owners', async ({
  browser,
}) => {
  const code = await bundledX6Probe();
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({ content: code });
    const cases = [
      {
        name: 'two owners, first graph disposed',
        flags: [true, true],
        first: 0,
        expected: [0, 1, 1, 1, 0],
      },
      {
        name: 'two owners, second graph disposed',
        flags: [true, true],
        first: 1,
        expected: [0, 1, 1, 1, 0],
      },
      {
        name: 'no owners',
        flags: [false, false],
        first: 0,
        expected: [0, 0, 0, 0, 0],
      },
      {
        name: 'opt-out graph before owner',
        flags: [false, true],
        first: 0,
        expected: [0, 0, 1, 1, 0],
      },
      {
        name: 'owner before opt-out graph',
        flags: [true, false],
        first: 0,
        expected: [0, 1, 1, 0, 0],
      },
      {
        name: 'HMR skips initial ownership',
        flags: [true, true],
        hmr: 0,
        first: 0,
        expected: [0, 0, 1, 1, 0],
      },
      {
        name: 'HMR preserves existing ownership',
        flags: [true, true],
        hmr: 1,
        first: 0,
        expected: [0, 1, 1, 1, 0],
      },
    ];
    for (const scenario of cases) {
      const observed = await page.evaluate(({ flags, hmr, first }) => {
        const { Graph, Config } = (window as any).__ca060X6Probe;
        const oldFlag = Config.autoInsertCSS;
        const oldModule = (window as any).module;
        const coreStyles = () =>
          Array.from(document.querySelectorAll('style')).filter((style) => {
            const content = style.textContent ?? '';
            if (content.length !== 2854) return false;
            let hash = 2166136261;
            for (let i = 0; i < content.length; i++) {
              hash ^= content.charCodeAt(i);
              hash = Math.imul(hash, 16777619);
            }
            return (hash >>> 0).toString(16).padStart(8, '0') === 'a73d50ec';
          }).length;
        document.body.innerHTML = '<div id="g1"></div><div id="g2"></div>';
        const graphs: any[] = [];
        const counts = [coreStyles()];
        try {
          for (let i = 0; i < 2; i++) {
            Config.autoInsertCSS = flags[i];
            (window as any).module =
              hmr === i ? { hot: { status: () => 'apply' } } : oldModule;
            try {
              graphs.push(
                new Graph({
                  container: document.getElementById(`g${i + 1}`),
                  width: 200,
                  height: 120,
                  autoResize: false,
                }),
              );
            } finally {
              (window as any).module = oldModule;
            }
            counts.push(coreStyles());
          }
          graphs[first].dispose();
          counts.push(coreStyles());
          graphs[1 - first].dispose();
          counts.push(coreStyles());
          return counts;
        } finally {
          (window as any).module = oldModule;
          Config.autoInsertCSS = oldFlag;
        }
      }, scenario);
      expect(observed, scenario.name).toEqual(scenario.expected);
    }
  } finally {
    await context.close();
  }
});

test('CA060: repeated CSS init and dispose never leak or release another Graph owner', async ({
  browser,
}) => {
  const code = await bundledX6Probe();
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({ content: code });
    const counts = await page.evaluate(() => {
      const { Graph, Config } = (window as any).__ca060X6Probe;
      const previousFlag = Config.autoInsertCSS;
      document.body.innerHTML = '<div id="g1"></div><div id="g2"></div>';
      const coreStyles = () =>
        Array.from(document.querySelectorAll('style')).filter((style) => {
          const content = style.textContent ?? '';
          if (content.length !== 2854) return false;
          let hash = 2166136261;
          for (let i = 0; i < content.length; i++) {
            hash ^= content.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
          }
          return (hash >>> 0).toString(16).padStart(8, '0') === 'a73d50ec';
        }).length;
      let g1: any;
      let g2: any;
      try {
        Config.autoInsertCSS = true;
        const results = [coreStyles()];
        g1 = new Graph({
          container: document.getElementById('g1'),
          width: 200,
          height: 120,
        });
        results.push(coreStyles());
        // Graph.css is the actual X6 3.1.8 CSSManager instance under test.
        g1.css.init();
        g1.css.init();
        results.push(coreStyles());
        g2 = new Graph({
          container: document.getElementById('g2'),
          width: 200,
          height: 120,
        });
        results.push(coreStyles());
        g1.css.dispose();
        g1.css.dispose();
        results.push(coreStyles());
        g1.dispose();
        g1 = undefined;
        results.push(coreStyles());
        g2.dispose();
        g2 = undefined;
        results.push(coreStyles());
        return results;
      } finally {
        try {
          g1?.dispose();
        } finally {
          g2?.dispose();
          Config.autoInsertCSS = previousFlag;
        }
      }
    });
    expect(counts).toEqual([0, 1, 1, 1, 1, 1, 0]);
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

test('CA060: native V3 trusted X6 CSS works under strict CSP while inline CSS stays blocked', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__ca060CspEvents = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      (window as any).__ca060CspEvents.push({
        directive: event.effectiveDirective,
        blockedUri: event.blockedURI,
      });
    });
  });
  const response = await page.goto(`${baseUrl}/v3-preview.html`);
  expect(response?.headers()['content-security-policy']).toContain(
    "style-src 'self'",
  );
  await page.locator('#v3-file').setInputFiles(fixturePath);
  await expect(page.locator('#v3-preview')).toHaveAttribute(
    'data-v3-state',
    'ready',
  );
  const css = await page
    .locator('.x6-graph')
    .first()
    .evaluate((graph) => ({
      touchAction: getComputedStyle(graph).touchAction,
      external: [...document.styleSheets].some((sheet) =>
        sheet.href?.endsWith('/vendor/x6.css'),
      ),
    }));
  expect(css).toEqual({ touchAction: 'none', external: true });
  expect(await page.evaluate(() => (window as any).__ca060CspEvents)).toEqual(
    [],
  );

  await page.evaluate(() => {
    const injected = document.createElement('style');
    injected.textContent = 'body { --ca060-inline-probe: 1 }';
    document.head.append(injected);
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__ca060CspEvents.some(
          (event: { directive: string; blockedUri: string }) =>
            event.directive === 'style-src-elem' &&
            event.blockedUri === 'inline',
        ),
      ),
    )
    .toBe(true);
});
