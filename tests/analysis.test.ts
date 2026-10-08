import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VisualizationService } from '../src/services/visualization-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';

test('CodeGraph is required for every language; missing setup creates no job or session', async () => {
  const previous = process.env.CODE_ANIME_CODEGRAPH_CONFIG;
  delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessionBytes: 1000000,
    maxSessions: 20,
  });
  const service = new VisualizationService(store, 'http://127.0.0.1:1234');
  try {
    assert.equal(service.capabilities().codeGraphRequired, true);
    assert.deepEqual(service.capabilities().languages, []);
    for (const target of [
      'JavaService.run',
      'KotlinService.run',
      'typescriptFunction',
    ]) {
      await assert.rejects(
        service.start({ projectRoot: '/not-even-readable', target }),
        /CodeGraph is required/,
      );
    }
    await assert.rejects(
      service.start({ projectRoot: tmpdir(), target: 'x', provider: 'source' }),
      /Invalid literal/,
    );
    assert.deepEqual(await service.manage('list'), { sessions: [], jobs: [] });
  } finally {
    service.close();
    await store.close();
    if (previous === undefined) delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
    else process.env.CODE_ANIME_CODEGRAPH_CONFIG = previous;
  }
});

test('CodeGraph jobs support active roots, inspection, refinement, plans and cancellation without source parsing', async () => {
  const previous = process.env.CODE_ANIME_CODEGRAPH_CONFIG;
  const directory = await mkdtemp(join(tmpdir(), 'code-anime-graph-'));
  const config = join(directory, 'bridge.json');
  await writeFile(
    config,
    JSON.stringify({
      transport: 'stdio',
      command: process.execPath,
      args: [
        fileURLToPath(new URL('./fixtures/provider.mjs', import.meta.url)),
      ],
      toolName: 'fixture_trace',
    }),
  );
  await writeFile(
    join(directory, 'Service.kt'),
    'not parseable Kotlin; provider owns analysis',
  );
  process.env.CODE_ANIME_CODEGRAPH_CONFIG = config;
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessionBytes: 1000000,
    maxSessions: 20,
  });
  const service = new VisualizationService(
    store,
    'http://127.0.0.1:1234',
    directory,
  );
  const wait = async (id: string) => {
    for (let i = 0; i < 200; i++) {
      const result = service.status(id);
      if (!['queued', 'running'].includes(result.status)) return result;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error('Job timed out');
  };
  try {
    assert.ok(service.capabilities().providers.includes('codegraph-bridge'));
    const job = await service.start({
      projectRoot: directory,
      target: 'Service.run',
    });
    const ready = await wait(job.jobId);
    assert.equal(ready.status, 'ready');
    assert.equal(ready.provider, 'codegraph-bridge: fixture');
    const id = String(ready.sessionId);
    assert.equal((await service.inspect(id, 0, 2)).events.length, 1);
    const refined = await service.refine(id, { value: 4 });
    assert.equal((await wait(refined.jobId)).status, 'ready');
    const plan = await service.plan(id, [
      { from: 'Service.run', to: 'Audit.save', description: 'Add audit' },
    ]);
    assert.equal(
      (await store.get(String(plan.sessionId)))?.flow.trace?.events.at(-1)
        ?.certainty,
      'proposed',
    );
    await assert.rejects(
      service.start({ projectRoot: tmpdir(), target: 'x' }),
      /projectRoot/,
    );
    const cancelled = await service.start({
      projectRoot: directory,
      target: 'x',
    });
    await service.manage('cancel', cancelled.jobId);
    assert.equal(service.status(cancelled.jobId).status, 'cancelled');
    process.env.CODE_ANIME_CODEGRAPH_CONFIG = join(directory, 'missing.json');
    const unavailable = await service.start({
      projectRoot: directory,
      target: 'x',
    });
    assert.equal((await wait(unavailable.jobId)).status, 'failed');
  } finally {
    service.close();
    await store.close();
    await rm(directory, { recursive: true, force: true });
    if (previous === undefined) delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
    else process.env.CODE_ANIME_CODEGRAPH_CONFIG = previous;
  }
});
