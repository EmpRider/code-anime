import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { analyzeWithCodeGraph } from '../src/analysis/codegraph-provider.js';
test('configured MCP provider bridge validates and imports normalized trace', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'code-anime-provider-'));
  const path = join(directory, 'config.json');
  try {
    await writeFile(
      path,
      JSON.stringify({
        transport: 'stdio',
        command: process.execPath,
        args: [
          fileURLToPath(new URL('./fixtures/provider.mjs', import.meta.url)),
        ],
        toolName: 'fixture_trace',
      }),
    );
    const flow = await analyzeWithCodeGraph(
      path,
      { projectRoot: directory, target: 'fixture' },
      new AbortController().signal,
    );
    assert.equal(flow.trace?.provider, 'codegraph-bridge: fixture');
    assert.equal(flow.trace?.events.length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
