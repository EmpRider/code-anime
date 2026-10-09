import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this check through npm run package:check');
const npm = (...args) =>
  execFileSync(process.execPath, [npmCli, ...args], {
    encoding: 'utf8',
    timeout: 120000,
  });
const temporary = await mkdtemp(join(tmpdir(), 'code-anime-package-'));
let client;
try {
  // Build here too: a failed earlier check may have left stale dist artifacts.
  npm('run', 'build');
  const packed = JSON.parse(
    npm('pack', '--json', '--ignore-scripts', '--pack-destination', temporary),
  )[0];
  const paths = packed.files.map((file) => file.path);
  for (const path of [
    'dist/index.js',
    'public/index.html',
    'public/player.js',
    'public/styles.css',
    'public/replay.js',
    'skills/code-anime/SKILL.md',
    'LICENSE',
  ])
    assert.ok(paths.includes(path), 'Missing package asset: ' + path);
  assert.ok(
    !paths.some((path) => /^(src|tests|node_modules)\//.test(path)),
    'Development files leaked into package',
  );
  npm(
    'install',
    '--prefix',
    temporary,
    '--omit=dev',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    join(temporary, packed.filename),
  );
  const installed = join(
    temporary,
    'node_modules',
    '@empirerider',
    'code-anime',
  );
  assert.match(
    await readFile(join(installed, 'dist/index.js'), 'utf8'),
    /^#!\/usr\/bin\/env node/,
  );
  const project = join(temporary, 'project');
  await mkdir(project);
  await writeFile(
    join(project, 'main.ts'),
    'export function double(value: number) { const result = value * 2; return result; }',
  );
  const config = join(temporary, 'bridge.json');
  await writeFile(
    config,
    JSON.stringify({
      transport: 'stdio',
      command: process.execPath,
      args: [resolve('tests/fixtures/provider.mjs')],
      toolName: 'fixture_trace',
    }),
  );
  const nativeCommand = process.env.CODE_ANIME_TEST_CODEGRAPH;
  if (nativeCommand) {
    await writeFile(
      join(project, 'Generator.kt'),
      'class Generator {\n fun generate(input: String): String { return normalize(input) }\n fun normalize(input: String): String { return input.trim() }\n}\n',
    );
    execFileSync(
      nativeCommand,
      [
        ...JSON.parse(process.env.CODE_ANIME_CODEGRAPH_ARGS || '[]'),
        'init',
        project,
      ],
      {
        env: { ...process.env, CODEGRAPH_TELEMETRY: '0' },
        stdio: 'pipe',
        timeout: 60000,
      },
    );
  }
  client = new Client({ name: 'package-smoke', version: '1.0.0' });
  // Exercise the installed npm executable, not a development source file.
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(installed, 'dist/index.js')],
    cwd: temporary,
    env: {
      ...process.env,
      CODE_ANIME_PORT: '0',
      CODE_ANIME_TEMP_DIR: temporary,
      ...(nativeCommand
        ? {
            CODE_ANIME_CODEGRAPH_COMMAND: nativeCommand,
            CODE_ANIME_CODEGRAPH_CONFIG: '',
          }
        : { CODE_ANIME_CODEGRAPH_CONFIG: config }),
    },
    stderr: 'pipe',
  });
  await client.connect(transport);
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 10);
  const submission = await client.callTool({
    name: 'visualize_code_flow',
    arguments: {
      projectRoot: project,
      target: nativeCommand ? 'Generator.generate' : 'double',
      scenario: { value: 3 },
    },
  });
  assert.notEqual(submission.isError, true);
  const job = JSON.parse(submission.content[0].text);
  let ready;
  for (let i = 0; i < 600; i++) {
    const status = await client.callTool({
      name: 'get_visualization_status',
      arguments: { jobId: job.jobId },
    });
    ready = JSON.parse(status.content[0].text);
    if (!['queued', 'running'].includes(ready.status)) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.equal(ready.status, 'ready');
  const trace = await (
    await fetch(new URL('/api/flow/' + ready.sessionId, ready.url))
  ).json();
  assert.equal(
    trace.trace.provider,
    nativeCommand ? 'codegraph-native' : 'codegraph-bridge: fixture',
  );
  if (nativeCommand)
    assert.ok(
      trace.trace.events.some(
        (e) => e.kind === 'call' && e.label === 'normalize',
      ),
    );
  assert.ok(
    !paths.some((path) => path.includes('analysis/analyzer')),
    'Source analyzer leaked into package',
  );
  let session = ready;
  if (nativeCommand) {
    const evidenceResult = await client.callTool({
      name: 'read_codegraph_evidence',
      arguments: {
        projectRoot: project,
        tool: 'node',
        arguments: { symbol: 'Generator.normalize' },
      },
    });
    assert.notEqual(
      evidenceResult.isError,
      true,
      JSON.stringify(evidenceResult),
    );
    const evidence = JSON.parse(evidenceResult.content[0].text);
    assert.match(evidence.text, /input.trim/);
    const call = async (arguments_) => {
      const response = await client.callTool({
        name: 'build_mock_animation',
        arguments: arguments_,
      });
      assert.notEqual(response.isError, true, JSON.stringify(response));
      return JSON.parse(response.content[0].text);
    };
    const build = await call({
      action: 'begin',
      projectRoot: project,
      endpoint: 'Generator.normalize',
      evidenceIds: [evidence.evidenceId],
      scenario: { input: '  ACH  ' },
    });
    await call({
      action: 'append',
      buildId: build.buildId,
      batchId: 'one',
      expectedEventCount: 0,
      operations: [
        {
          kind: 'enter',
          symbol: 'Generator.normalize',
          label: 'Bind input',
          source: { file: 'Generator.kt', line: 3, endLine: 3 },
          inputs: { input: '  ACH  ' },
        },
        {
          kind: 'transform',
          label: 'trim input',
          line: 3,
          inputs: { receiver: '  ACH  ' },
          result: 'ACH',
        },
        {
          kind: 'return',
          label: 'Return trimmed value',
          line: 3,
          result: 'ACH',
        },
      ],
    });
    session = await call({
      action: 'finish',
      buildId: build.buildId,
      coverage: 'Mock trim call and return',
      complete: true,
    });
    const data = await (
      await fetch(new URL('/api/flow/' + session.sessionId, session.url))
    ).json();
    assert.equal(data.trace.events[1].result, 'ACH');
    assert.equal(data.steps[1].dtoFields.result, 'ACH');
    assert.deepEqual(data.trace.events[2].stack, []);
    const { readdir } = await import('node:fs/promises');
    assert.deepEqual(
      (await readdir(project)).filter((name) => !name.startsWith('.')).sort(),
      ['Generator.kt', 'main.ts'],
    );
  }

  const blocked = await client.callTool({
    name: 'generate_mock_flow_animation',
    arguments: {
      endpoint: 'bypass',
      steps: [{ from: 'a', to: 'b', dtoName: 'x', dtoFields: {} }],
    },
  });
  assert.equal(
    blocked.isError,
    true,
    'ungrounded legacy payload must not bypass CodeGraph',
  );
  const page = await fetch(session.url);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Code Anime/);
  for (const asset of ['/player.js', '/styles.css'])
    assert.equal((await fetch(new URL(asset, session.url))).status, 200);
  console.log(
    'Packed npm package: installed CLI, MCP handshake, player assets and flow API passed.',
  );
} finally {
  await client?.close();
  await rm(temporary, { recursive: true, force: true });
}
