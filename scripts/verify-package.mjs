import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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
  // CI has already built and checked the source. Pack exactly those artifacts.
  const packed = JSON.parse(
    npm('pack', '--json', '--ignore-scripts', '--pack-destination', temporary),
  )[0];
  const paths = packed.files.map((file) => file.path);
  for (const path of [
    'dist/index.js',
    'public/index.html',
    'public/player.js',
    'public/styles.css',
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
    },
    stderr: 'pipe',
  });
  await client.connect(transport);
  const flow = JSON.parse(
    await readFile(resolve('examples/login-flow.json'), 'utf8'),
  );
  const result = await client.callTool({
    name: 'generate_mock_flow_animation',
    arguments: flow,
  });
  assert.notEqual(result.isError, true);
  const session = JSON.parse(result.content[0].text);
  const page = await fetch(session.url);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Code Anime/);
  for (const asset of ['/player.js', '/styles.css']) {
    assert.equal((await fetch(new URL(asset, session.url))).status, 200);
  }
  const data = await fetch(
    new URL('/api/flow/' + session.sessionId, session.url),
  );
  assert.deepEqual(await data.json(), flow);
  console.log(
    'Packed npm package: installed CLI, MCP handshake, player assets and flow API passed.',
  );
} finally {
  await client?.close();
  await rm(temporary, { recursive: true, force: true });
}
