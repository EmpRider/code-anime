import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { traceToFlow } from '../src/analysis/contract.js';
import type { Trace } from '../src/domain/trace.js';
import {
  parseNodes,
  analyzeNativeCodeGraph,
  verifyNativeCodeGraph,
  readNativeEvidence,
} from '../src/analysis/native-codegraph.js';
import { resolveCodeGraphLaunch } from '../src/analysis/codegraph-launcher.js';
import { VisualizationService } from '../src/services/visualization-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp/server.js';

const nodeText = (name: string) =>
  `**${name}** (method)\n**Location:** app.any:1\n`;
const linkText = (name: string) => `- ${name} (method) - app.any:1`;
async function graphFixture(
  call: (tool: string, args: Record<string, unknown>) => Promise<string>,
  limits = {},
) {
  let closed = false;
  const flow = await analyzeNativeCodeGraph(
    { projectRoot: '/project', target: 'root', ...limits },
    new AbortController().signal,
    async () => ({
      call,
      status: 'Fixture indexed graph',
      files: 1,
      close: async () => {
        closed = true;
      },
    }),
  );
  assert.equal(closed, true);
  return flow.trace!;
}

test('native graph traverses over 30 calls and labels recursive edges as static', async () => {
  const trace = await graphFixture(async (tool, args) => {
    const name = String(args.symbol);
    if (tool === 'codegraph_node') return nodeText(name);
    const depth = name === 'root' ? 0 : Number(name.slice(1));
    return linkText(depth < 40 ? `n${depth + 1}` : 'root');
  });
  assert.equal(trace.truncated, false);
  assert.equal(trace.events.filter((e) => e.kind === 'enter').length, 41);
  assert.ok(trace.events.every((e) => e.certainty === 'static'));
  assert.equal(trace.events.at(-1)?.symbolId, 'root@app.any:1');
});

test('unresolved graph children identify incomplete coverage and preserve valid visits', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_callees') return linkText('missing');
    if (args.symbol === 'root') return nodeText('root');
    throw new Error('Unavailable symbol');
  });
  assert.equal(trace.truncated, true);
  assert.equal(trace.events[0]?.kind, 'enter');
  assert.equal(trace.events.at(-1)?.kind, 'unresolved');
  assert.ok(
    trace.diagnostics.some((d) =>
      /missing@app.any:1.*Unavailable symbol/.test(d),
    ),
  );
});

test('indexed external and generated calls stay compact without expanding dependency source', async () => {
  const expanded: string[] = [];
  const trace = await graphFixture(async (tool, args) => {
    const symbol = String(args.symbol);
    if (tool === 'codegraph_node') {
      expanded.push(symbol);
      return `**${symbol}** (method)\n**Location:** app.any:1\n`;
    }
    return symbol === 'root'
      ? [
          '- helper (method) - app.any:1',
          '- framework (method) - node_modules/pkg/index.js:12',
          '- generated (method) - build/generated.kt:3',
          '- outside (method) - ../another-project/Other.kt:1',
        ].join('\n')
      : 'No callees found';
  });
  assert.deepEqual(expanded, ['root', 'helper']);
  assert.equal(trace.truncated, false);
  assert.deepEqual(
    trace.events
      .filter((event) => event.kind === 'call')
      .map((event) => event.label),
    ['helper', 'framework', 'generated', 'outside'],
  );
  assert.ok(
    trace.events
      .filter((event) => event.kind === 'call' && event.label !== 'helper')
      .every((event) => event.note?.includes('intentionally not expanded')),
  );
});

test('out-of-project CodeGraph entry cannot become the structural root', async () => {
  await assert.rejects(
    graphFixture(
      async () =>
        '**root** (method)\n**Location:** ../another-project/Other.kt:1\n',
    ),
    /outside user-written project source/,
  );
});

test('CodeGraph leaves symlinked external methods as compact unexpanded boundaries', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-graph-boundary-'));
  const external = await mkdtemp(join(tmpdir(), 'code-anime-graph-external-'));
  try {
    await mkdir(join(root, 'src'));
    await writeFile(join(root, 'src', 'Root.kt'), 'fun root() {}\n');
    await writeFile(join(external, 'Outside.kt'), 'fun outside() {}\n');
    try {
      await symlink(
        external,
        join(root, 'linked'),
        process.platform === 'win32' ? 'junction' : 'dir',
      );
    } catch (error) {
      if (
        ['EPERM', 'EACCES', 'ENOTSUP'].includes(
          (error as NodeJS.ErrnoException).code ?? '',
        )
      ) {
        t.skip('The filesystem does not permit directory symlinks');
        return;
      }
      throw error;
    }
    const nodeQueries: string[] = [];
    const flow = await analyzeNativeCodeGraph(
      { projectRoot: root, target: 'root' },
      new AbortController().signal,
      async () => ({
        status: 'Fixture indexed graph',
        files: 2,
        close: async () => {},
        call: async (tool, args) => {
          if (tool === 'codegraph_node') {
            nodeQueries.push(String(args.symbol));
            return '**root** (method)\n**Location:** src/Root.kt:1\n';
          }
          return '- outside (method) - linked/Outside.kt:1';
        },
      }),
    );
    assert.deepEqual(nodeQueries, ['root']);
    assert.equal(flow.trace?.truncated, false);
    const boundary = flow.trace?.events.find((event) => event.kind === 'call');
    assert.equal(boundary?.source?.file, 'linked/Outside.kt');
    assert.match(boundary?.note ?? '', /intentionally not expanded/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(external, { recursive: true, force: true });
  }
});

test('callee saturation and configured event limits explain their exact boundary', async () => {
  const trace = await graphFixture(
    async (tool, args) => {
      if (tool === 'codegraph_node') return nodeText(String(args.symbol));
      return args.symbol === 'root'
        ? Array.from({ length: 100 }, (_, i) => linkText(`child${i}`)).join(
            '\n',
          )
        : 'No callees found';
    },
    { maxEvents: 10 },
  );
  assert.equal(trace.events.length, 10);
  assert.equal(trace.truncated, true);
  assert.ok(trace.diagnostics.some((d) => d.includes('callee coverage')));
  assert.ok(trace.diagnostics.some((d) => d.includes('Event budget 10')));
});

test('CodeGraph can return more than 100 relationships when event capacity permits', async () => {
  const limits: number[] = [];
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') return nodeText(String(args.symbol));
    const limit = Number(args.limit);
    limits.push(limit);
    const count = Math.min(150, limit);
    return (
      `Showing ${count} of 150 relationships\n` +
      Array.from(
        { length: count },
        (_, i) => `- ext${i} (method) - node_modules/dependency/f${i}.js:1`,
      ).join('\n')
    );
  });
  assert.deepEqual(limits, [100, 200]);
  assert.equal(trace.truncated, false);
  assert.equal(
    trace.events.filter((event) => event.kind === 'call').length,
    150,
  );
  assert.equal(
    trace.events.filter((event) => event.kind === 'enter').length,
    1,
  );
});

test('CodeGraph fixed provider cap remains explicitly incomplete after a larger query', async () => {
  const limits: number[] = [];
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') return nodeText(String(args.symbol));
    limits.push(Number(args.limit));
    return (
      'Showing 100 of 150 relationships\n' +
      Array.from(
        { length: 100 },
        (_, i) => `- ext${i} (method) - node_modules/dependency/f${i}.js:1`,
      ).join('\n')
    );
  });
  assert.deepEqual(limits, [100, 200]);
  assert.equal(trace.truncated, true);
  assert.ok(
    trace.diagnostics.some((d) =>
      d.includes('additional relationships may exist'),
    ),
  );
});

test('CodeGraph cannot certify complete coverage when reported relationships are missing from its response', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') return nodeText(String(args.symbol));
    return 'Showing 100 of 100 relationships\n- library (method) - node_modules/library/index.js:1';
  });
  assert.equal(trace.truncated, true);
  assert.equal(trace.events.filter((event) => event.kind === 'call').length, 1);
  assert.ok(
    trace.diagnostics.some(
      (note) =>
        note.includes('reported 100 relationships') &&
        note.includes('returned only 1 parseable rows'),
    ),
  );
});

test('duplicate CodeGraph callee rows cannot masquerade as distinct complete relationships', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') return nodeText(String(args.symbol));
    return (
      'Showing 3 of 3 relationships\n' +
      Array.from(
        { length: 3 },
        () => '- library (method) - node_modules/library/index.js:1',
      ).join('\n')
    );
  });
  assert.equal(trace.truncated, true);
  assert.equal(trace.events.filter((event) => event.kind === 'call').length, 1);
  assert.ok(
    trace.diagnostics.some((note) =>
      note.includes('repeated 2 identical callee relationships'),
    ),
  );
  assert.ok(
    trace.diagnostics.some((note) =>
      note.includes('returned only 1 parseable rows'),
    ),
  );
});

test('failed larger CodeGraph query keeps earlier relationships as partial evidence', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') return nodeText(String(args.symbol));
    if (Number(args.limit) > 100) throw new Error('Provider limit is 100');
    return (
      'Showing 100 of 150 relationships\n' +
      Array.from(
        { length: 100 },
        (_, i) => `- ext${i} (method) - node_modules/dependency/f${i}.js:1`,
      ).join('\n')
    );
  });
  assert.equal(trace.truncated, true);
  assert.equal(
    trace.events.filter((event) => event.kind === 'call').length,
    100,
  );
  assert.ok(trace.diagnostics.some((d) => d.includes('Provider limit is 100')));
});

test('smaller response to a larger CodeGraph request cannot discard earlier callee evidence', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') return nodeText(String(args.symbol));
    const count = Number(args.limit) > 100 ? 20 : 100;
    return (
      `Showing ${count} of 150 relationships\n` +
      Array.from(
        { length: count },
        (_, i) => `- ext${i} (method) - node_modules/dependency/f${i}.js:1`,
      ).join('\n')
    );
  });
  assert.equal(trace.truncated, true);
  assert.equal(
    trace.events.filter((event) => event.kind === 'call').length,
    100,
  );
  assert.ok(
    trace.diagnostics.some((d) =>
      d.includes('retaining the larger evidence set'),
    ),
  );
});

test('changed CodeGraph response retains missing earlier relationships and discloses incomplete coverage', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') return nodeText(String(args.symbol));
    const limit = Number(args.limit);
    const names =
      limit > 100
        ? [...Array.from({ length: 149 }, (_, i) => `ext${i + 1}`), 'new150']
        : Array.from({ length: 100 }, (_, i) => `ext${i}`);
    return (
      `Showing ${names.length} of 150 relationships\n` +
      names
        .map(
          (name) => `- ${name} (method) - node_modules/dependency/${name}.js:1`,
        )
        .join('\n')
    );
  });
  const calls = trace.events.filter((event) => event.kind === 'call');
  assert.equal(calls.length, 151);
  assert.ok(calls.some((event) => event.label === 'ext0'));
  assert.ok(calls.some((event) => event.label === 'new150'));
  assert.equal(trace.truncated, true);
  assert.ok(
    trace.diagnostics.some((note) =>
      note.includes('changed previously returned callee relationships'),
    ),
  );
});

test('provider failure after resolving the entry point preserves explicitly partial evidence', async () => {
  const trace = await graphFixture(async (tool) => {
    if (tool === 'codegraph_node') return nodeText('root');
    throw new Error('Provider connection closed');
  });
  assert.equal(trace.truncated, true);
  assert.deepEqual(
    trace.events.map((e) => e.kind),
    ['enter', 'unresolved'],
  );
  assert.ok(
    trace.diagnostics.some((d) => d.includes('Provider connection closed')),
  );
});

test('native adapter reads CodeGraph symbol metadata without interpreting source', () => {
  const text =
    '**generate** (method)\r\n\r\n**Location:** src/Generator.kt:3\r\n\r\n```kotlin\r\n3\tfun generate() = unknown()\r\n```';
  const nodes = parseNodes(text);
  assert.equal(nodes[0]?.file, 'src/Generator.kt');
  assert.equal(nodes[0]?.line, 3);
  assert.match(nodes[0]?.snippet ?? '', /unknown/);
  assert.deepEqual(parseNodes('Symbol "x" not found in the codebase'), []);
  assert.deepEqual(
    parseNodes('**x** (method)\n**Location:** file.kt:3 — stale'),
    [],
  );
  assert.deepEqual(
    parseNodes(text.replace('**generate**', '## generate')),
    nodes,
  );
});

test('same-named definitions are selected by source location and merged callees stay unresolved', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') {
      if (args.symbol === 'root') return nodeText('root');
      return (
        '## helper (method)\n**Location:** app.any:1\n\n' +
        '## helper (method)\n**Location:** other.any:9\n'
      );
    }
    if (args.symbol === 'root') return linkText('helper');
    return '- wrong (method) - other.any:12\n\n> **Note:** Aggregated results across 2 symbols named "helper"';
  });
  assert.equal(trace.truncated, true);
  assert.ok(
    trace.events.some(
      (e) => e.kind === 'enter' && e.symbolId === 'helper@app.any:1',
    ),
  );
  assert.ok(!trace.events.some((e) => e.source?.file === 'other.any'));
  assert.ok(trace.diagnostics.some((d) => d.includes('different definitions')));
});

test('CodeGraph counts only relationships in the selected same-named definition', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') {
      const symbol = String(args.symbol);
      return `**${symbol}** (method)\n**Location:** app.any:${symbol === 'helper' ? 2 : 1}\n`;
    }
    if (args.symbol === 'root') return '- helper (method) - app.any:2';
    return [
      'Found 2 distinct definitions',
      '**helper** (method) — app.any:2',
      'Showing 3 of 3 relationships',
      '- desired (method) - node_modules/desired.js:1',
      '**helper** (method) — app.any:9',
      'Showing 2 of 2 relationships',
      '- wrongA (method) - node_modules/wrongA.js:1',
      '- wrongB (method) - node_modules/wrongB.js:1',
    ].join('\n');
  });
  assert.equal(trace.truncated, true);
  assert.deepEqual(
    trace.events
      .filter((event) => event.kind === 'call')
      .map((event) => event.label),
    ['helper', 'desired'],
  );
  assert.ok(
    trace.diagnostics.some(
      (note) =>
        note.includes('reported 3 relationships for helper@app.any:2') &&
        note.includes('returned only 1 parseable rows'),
    ),
  );
});

test('CodeGraph isolates complete same-named definition sections', async () => {
  const trace = await graphFixture(async (tool, args) => {
    if (tool === 'codegraph_node') {
      const symbol = String(args.symbol);
      return `**${symbol}** (method)\n**Location:** app.any:${symbol === 'helper' ? 2 : 1}\n`;
    }
    if (args.symbol === 'root') return '- helper (method) - app.any:2';
    return [
      'Found 2 distinct definitions',
      '**helper** (method) — app.any:2',
      'Showing 1 of 1 relationships',
      '- desired (method) - node_modules/desired.js:1',
      '**helper** (method) — app.any:9',
      'Showing 1 of 1 relationships',
      '- wrong (method) - node_modules/wrong.js:1',
    ].join('\n');
  });
  assert.equal(trace.truncated, false);
  assert.deepEqual(
    trace.events
      .filter((event) => event.kind === 'call')
      .map((event) => event.label),
    ['helper', 'desired'],
  );
});

test('replay steps retain indexed edge endpoints across sibling graph branches', () => {
  const trace: Trace = {
    version: 2,
    provider: 'codegraph-native',
    projectRoot: '/project',
    sourceHash: 'evidence',
    target: 'root',
    scenario: {},
    diagnostics: [],
    truncated: false,
    filesAnalyzed: 1,
    cacheHits: 0,
    events: ['first', 'second'].map((name, i) => ({
      id: String(i),
      kind: 'call',
      symbolId: name,
      label: name,
      callId: name,
      values: { from: 'root', to: name },
      stack: ['root'],
      certainty: 'static',
    })),
  };
  assert.deepEqual(
    traceToFlow(trace, 'root').steps.map((step) => [step.from, step.to]),
    [
      ['root', 'first'],
      ['root', 'second'],
    ],
  );
});

const executable = process.env.CODE_ANIME_TEST_CODEGRAPH;
test(
  'real CodeGraph: Kotlin, Java, and TypeScript definitions and callees are retrieved without execution',
  { skip: !executable },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'code-anime-multilang-'));
    const priorCommand = process.env.CODE_ANIME_CODEGRAPH_COMMAND;
    try {
      await mkdir(join(root, 'src'));
      const fixtures = [
        {
          file: 'KotlinFlow.kt',
          symbol: 'KotlinFlow.entry',
          call: 'helper',
          helperSymbol: 'KotlinFlow.helper',
          entryLine: 2,
          helperLine: 7,
          consoleLine: 4,
          returnLine: 5,
          content:
            'class KotlinFlow {\n fun entry(input: Int): Int {\n   val total = helper(input)\n   println(total)\n   return total\n }\n fun helper(input: Int): Int = input * 2\n}\n',
        },
        {
          file: 'JavaFlow.java',
          symbol: 'JavaFlow.entry',
          call: 'helper',
          helperSymbol: 'JavaFlow.helper',
          entryLine: 2,
          helperLine: 7,
          consoleLine: 4,
          returnLine: 5,
          content:
            'class JavaFlow {\n int entry(int input) {\n   int total = helper(input);\n   System.out.println(total);\n   return total;\n }\n int helper(int input) { return input * 2; }\n}\n',
        },
        {
          file: 'TypeFlow.ts',
          symbol: 'typescriptEntry',
          call: 'typescriptHelper',
          helperSymbol: 'typescriptHelper',
          entryLine: 1,
          helperLine: 6,
          consoleLine: 3,
          returnLine: 4,
          content:
            'export function typescriptEntry(input: number): number {\n const total = typescriptHelper(input);\n console.log(total);\n return total;\n}\nfunction typescriptHelper(input: number): number { return input * 2; }\n',
        },
      ];
      for (const fixture of fixtures)
        await writeFile(join(root, 'src', fixture.file), fixture.content);
      const launcher = resolveCodeGraphLaunch(
        executable!,
        JSON.parse(process.env.CODE_ANIME_CODEGRAPH_ARGS || '[]'),
      );
      execFileSync(launcher.command, [...launcher.args, 'init', root], {
        env: { ...process.env, CODEGRAPH_TELEMETRY: '0' },
        timeout: 60000,
        stdio: 'pipe',
      });
      process.env.CODE_ANIME_CODEGRAPH_COMMAND = executable!;
      await verifyNativeCodeGraph({
        projectRoot: root,
        target: 'KotlinFlow.entry',
      });
      const files = await readNativeEvidence(
        root,
        'files',
        {},
        new AbortController().signal,
      );
      assert.equal(files.files, 3);
      for (const fixture of fixtures) {
        const node = await readNativeEvidence(
          root,
          'node',
          { symbol: fixture.symbol },
          new AbortController().signal,
        );
        assert.match(
          node.text,
          new RegExp(`src/${fixture.file.replace('.', '\\.')}:`),
        );
        assert.match(node.text, new RegExp(fixture.call));
        const callees = await readNativeEvidence(
          root,
          'callees',
          { symbol: fixture.symbol },
          new AbortController().signal,
        );
        assert.match(callees.text, new RegExp(fixture.call));
      }

      // Exercise the actual MCP protocol with indexed source evidence. Fixture
      // sources are inert: their functions are never imported or executed.
      const store = await FileSessionStore.open(tmpdir(), {
        ttlMs: 60000,
        maxSessions: 20,
        maxSessionBytes: 1000000,
      });
      const server = createMcpServer(store, 'http://127.0.0.1:3456');
      const client = new Client({ name: 'mock-flow-test', version: '1.0.0' });
      const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
      async function callTool<T>(
        name: string,
        args: Record<string, unknown>,
      ): Promise<T> {
        const response = await client.callTool({ name, arguments: args });
        assert.notEqual(
          response.isError,
          true,
          `${name} failed: ${JSON.stringify(response.content)}`,
        );
        assert.ok(Array.isArray(response.content));
        const item = response.content[0];
        assert.ok(item && item.type === 'text');
        return JSON.parse(item.text) as T;
      }
      try {
        await server.connect(serverTransport);
        await client.connect(clientTransport);
        for (const fixture of fixtures) {
          const entryEvidence = await callTool<{ evidenceId: string }>(
            'read_codegraph_evidence',
            {
              projectRoot: root,
              tool: 'node',
              arguments: { symbol: fixture.symbol },
            },
          );
          const helperEvidence = await callTool<{ evidenceId: string }>(
            'read_codegraph_evidence',
            {
              projectRoot: root,
              tool: 'node',
              arguments: { symbol: fixture.helperSymbol },
            },
          );
          const evidenceIds = [
            entryEvidence.evidenceId,
            helperEvidence.evidenceId,
          ];
          const begin = await callTool<{ buildId: string }>(
            'build_mock_animation',
            {
              action: 'begin',
              projectRoot: root,
              endpoint: fixture.symbol,
              evidenceIds,
              scenario: { input: 7, provenance: 'AI-proposed fixture values' },
            },
          );
          const file = `src/${fixture.file}`;
          const entrySource = {
            file,
            line: fixture.entryLine,
            endLine: fixture.entryLine,
          };
          const helperSource = {
            file,
            line: fixture.helperLine,
            endLine: fixture.helperLine,
          };
          const consoleSource = {
            file,
            line: fixture.consoleLine,
            endLine: fixture.consoleLine,
          };
          const returnSource = {
            file,
            line: fixture.returnLine,
            endLine: fixture.returnLine,
          };
          assert.match(
            fixture.content.split('\n')[fixture.consoleLine - 1]!,
            /println|console\.log/,
          );
          await callTool('build_mock_animation', {
            action: 'append',
            buildId: begin.buildId,
            batchId: `${fixture.file}-mock-flow`,
            expectedEventCount: 0,
            operations: [
              {
                kind: 'enter',
                label: 'Simulated entry',
                symbol: fixture.symbol,
                source: entrySource,
                inputs: { input: 7 },
                evidenceIds: [entryEvidence.evidenceId],
              },
              {
                kind: 'enter',
                label: 'Simulated helper call',
                symbol: fixture.helperSymbol,
                source: helperSource,
                inputs: { input: 7 },
                evidenceIds: [helperEvidence.evidenceId],
              },
              {
                kind: 'transform',
                label: 'Simulated multiplication',
                source: helperSource,
                set: { result: 14 },
              },
              {
                kind: 'return',
                label: 'Simulated helper result',
                result: 14,
                assignTo: 'total',
                source: helperSource,
              },
              {
                kind: 'console',
                label: 'Illustrative output',
                output: '14',
                source: consoleSource,
              },
              {
                kind: 'return',
                label: 'Simulated entry result',
                result: 14,
                source: returnSource,
              },
            ],
          });
          const completed = await callTool<{ sessionId: string }>(
            'build_mock_animation',
            {
              action: 'finish',
              buildId: begin.buildId,
              coverage: 'Illustrative two-method mock scenario only',
              complete: true,
            },
          );
          const trace = (await store.get(String(completed.sessionId)))!.flow
            .trace!;
          assert.deepEqual(
            trace.events.map(({ kind }) => kind),
            ['enter', 'enter', 'transform', 'return', 'console', 'return'],
          );
          assert.ok(
            trace.events.every(({ certainty }) => certainty === 'mock'),
          );
          assert.ok(trace.events.every((event) => event.source?.file === file));
          assert.equal(trace.events[3]?.after?.total, 14);
          assert.equal(trace.events[4]?.output, '14');
          assert.equal(trace.events[4]?.source?.line, fixture.consoleLine);
          assert.equal(trace.events[5]?.source?.line, fixture.returnLine);
          assert.equal(trace.simulation?.complete, true);
        }
      } finally {
        await client.close();
        await server.close();
        await store.close();
      }
    } finally {
      if (priorCommand === undefined)
        delete process.env.CODE_ANIME_CODEGRAPH_COMMAND;
      else process.env.CODE_ANIME_CODEGRAPH_COMMAND = priorCommand;
      await rm(root, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100,
      });
    }
  },
);
test(
  'real CodeGraph: missing index stops, indexed Kotlin produces provider-only replay and refinement',
  { skip: !executable },
  async () => {
    const previous = process.env.CODE_ANIME_CODEGRAPH_COMMAND;
    const previousConfig = process.env.CODE_ANIME_CODEGRAPH_CONFIG;
    const previousArgs = process.env.CODE_ANIME_CODEGRAPH_ARGS;
    process.env.CODE_ANIME_CODEGRAPH_COMMAND = executable!;
    delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
    const directory = await mkdtemp(join(tmpdir(), 'code-anime-kotlin-'));
    const store = await FileSessionStore.open(tmpdir(), {
      ttlMs: 60000,
      maxSessionBytes: 1000000,
      maxSessions: 20,
    });
    const service = new VisualizationService(store, 'http://127.0.0.1:1234');
    try {
      await assert.rejects(
        service.start({ projectRoot: directory, target: 'Generator.generate' }),
        /index|initialize/i,
      );
      assert.deepEqual(await service.manage('list'), {
        sessions: [],
        jobs: [],
      });
      await mkdir(join(directory, 'src'));
      await writeFile(
        join(directory, 'src', 'Generator.kt'),
        'class Generator {\n fun generate(input: String): String { return normalize(input) }\n fun normalize(input: String): String { return input.trim() }\n}\nclass Other {\n fun normalize(input: String): String { return input }\n}\n',
      );
      const launcher = resolveCodeGraphLaunch(
        executable!,
        JSON.parse(process.env.CODE_ANIME_CODEGRAPH_ARGS || '[]'),
      );
      execFileSync(launcher.command, [...launcher.args, 'init', directory], {
        env: { ...process.env, CODEGRAPH_TELEMETRY: '0' },
        timeout: 60000,
        stdio: 'pipe',
      });
      // On machines with CodeGraph on PATH, optionally exercise native
      // discovery without any Code Anime command or argument overrides.
      if (process.env.CODE_ANIME_TEST_DEFAULT_CODEGRAPH === '1') {
        delete process.env.CODE_ANIME_CODEGRAPH_COMMAND;
        delete process.env.CODE_ANIME_CODEGRAPH_ARGS;
      }
      const wait = async (id: string) => {
        for (let i = 0; i < 600; i++) {
          const status = service.status(id);
          if (!['queued', 'running'].includes(status.status)) return status;
          await new Promise((r) => setTimeout(r, 50));
        }
        throw new Error('Job timed out');
      };
      const job = await service.start({
        projectRoot: directory,
        target: 'Generator.generate',
        scenario: { input: '  ACH  ' },
      });
      const ready = await wait(job.jobId);
      assert.equal(ready.status, 'ready', JSON.stringify(ready));
      assert.equal(ready.provider, 'codegraph-native');
      const trace = (await store.get(String(ready.sessionId)))!.flow.trace!;
      assert.ok(
        trace.events.some((e) => e.label === 'normalize' && e.kind === 'call'),
      );
      assert.ok(trace.events.some((e) => e.snippet?.includes('input.trim()')));
      assert.ok(
        trace.events.every((e) =>
          ['static', 'unresolved'].includes(e.certainty),
        ),
        JSON.stringify(trace.events),
      );
      assert.ok(
        !trace.events.some((e) => e.source?.line === 6),
        'do not mix the Other.normalize definition into this path',
      );
      if (trace.events.some((e) => e.certainty === 'unresolved')) {
        assert.equal(trace.truncated, true);
        assert.ok(
          trace.diagnostics.some((d) => d.includes('different definitions')),
        );
      }
      assert.ok(!trace.events.some((e) => Object.hasOwn(e.values, 'result')));
      const refine = await service.refine(String(ready.sessionId), {
        input: 'different',
      });
      assert.equal((await wait(refine.jobId)).status, 'ready');
      const ambiguous = await service.start({
        projectRoot: directory,
        target: 'normalize',
      });
      const candidates = await wait(ambiguous.jobId);
      assert.equal(candidates.status, 'needs_selection');
      assert.equal((candidates.candidates as unknown[]).length, 2);
    } finally {
      service.close();
      await store.close();
      await rm(directory, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100,
      });
      if (previous === undefined)
        delete process.env.CODE_ANIME_CODEGRAPH_COMMAND;
      else process.env.CODE_ANIME_CODEGRAPH_COMMAND = previous;
      if (previousConfig === undefined)
        delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
      else process.env.CODE_ANIME_CODEGRAPH_CONFIG = previousConfig;
      if (previousArgs === undefined)
        delete process.env.CODE_ANIME_CODEGRAPH_ARGS;
      else process.env.CODE_ANIME_CODEGRAPH_ARGS = previousArgs;
    }
  },
);
