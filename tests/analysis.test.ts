import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { SourceAnalyzer, CandidateError } from '../src/analysis/analyzer.js';
import { VisualizationService } from '../src/services/visualization-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import { tmpdir } from 'node:os';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
const root = fileURLToPath(new URL('./fixtures/analysis/', import.meta.url));
test('without a configured restriction, analysis accepts a project outside the server directory', async () => {
  const project = await mkdtemp(join(tmpdir(), 'code-anime-root-'));
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessionBytes: 1000000,
    maxSessions: 20,
  });
  const service = new VisualizationService(store, 'http://127.0.0.1:1234');
  try {
    await writeFile(
      join(project, 'main.ts'),
      'export function double(value: number) { return value * 2; }',
    );
    assert.equal(service.capabilities().projectRootPolicy, 'per-request');
    const job = await service.start({
      projectRoot: project,
      target: 'double',
      scenario: { value: 3 },
    });
    let status = service.status(job.jobId);
    for (
      let i = 0;
      i < 100 && ['queued', 'running'].includes(status.status);
      i++
    ) {
      await new Promise((r) => setTimeout(r, 10));
      status = service.status(job.jobId);
    }
    assert.equal(status.status, 'ready');
  } finally {
    service.close();
    await store.close();
    await rm(project, { recursive: true, force: true });
  }
});
test('source analysis resolves cross-file method calls and observes scenario branches/mutations', async () => {
  const analyzer = new SourceAnalyzer();
  const flow = await analyzer.analyze({
    projectRoot: root,
    target: 'generate',
    scenario: { value: 5, approved: true, amounts: [1, 2] },
  });
  assert.ok(flow.trace);
  assert.ok(
    flow.trace.events.some(
      (e) => e.label === 'Processor.generate' && e.kind === 'enter',
    ),
  );
  assert.ok(
    flow.trace.events.some((e) => e.label === 'format' && e.kind === 'enter'),
  );
  assert.ok(
    flow.trace.events.some((e) => e.kind === 'mutate' && e.values.after === 7),
  );
  assert.equal(flow.trace.events.at(-1)?.values.result, 4);
  assert.ok(flow.trace.events.every((e) => e.source && e.source.line > 0));
  const other = await analyzer.analyze({
    projectRoot: root,
    target: 'generate',
    scenario: { value: 5, approved: false, amounts: [] },
  });
  assert.equal(other.trace?.events.at(-1)?.values.result, 9);
  assert.ok((other.trace?.cacheHits ?? 0) > 0);
});
test('recursion, external calls and ambiguous targets have honest diagnostics', async () => {
  const analyzer = new SourceAnalyzer();
  const recursive = await analyzer.analyze({
    projectRoot: root,
    target: 'recursive',
  });
  assert.equal(recursive.trace?.truncated, true);
  assert.ok(recursive.trace?.events.some((e) => e.kind === 'unresolved'));
  const external = await analyzer.analyze({
    projectRoot: root,
    target: 'external',
  });
  assert.ok(external.trace?.events.some((e) => e.certainty === 'unresolved'));
  await assert.rejects(
    analyzer.analyze({ projectRoot: root, target: 'not-found' }),
    CandidateError,
  );
});
test('analysis service creates jobs, paginates, refines, plans and isolates allowed roots', async () => {
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessionBytes: 1000000,
    maxSessions: 20,
  });
  const service = new VisualizationService(
    store,
    'http://127.0.0.1:1234',
    root,
  );
  const wait = async (id: string) => {
    for (let i = 0; i < 100; i++) {
      const result = service.status(id);
      if (!['queued', 'running'].includes(result.status)) return result;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error('Job timed out');
  };
  try {
    const job = await service.start({
      projectRoot: root,
      target: 'generate',
      scenario: { value: 1, approved: true, amounts: [] },
    });
    const ready = await wait(job.jobId);
    assert.equal(ready.status, 'ready');
    const id = String(ready.sessionId);
    const page = await service.inspect(id, 0, 2);
    assert.equal(page.events.length, 2);
    assert.equal(page.nextOffset, 2);
    const refined = await service.refine(id, { approved: false });
    assert.equal((await wait(refined.jobId)).status, 'ready');
    const plan = await service.plan(id, [
      {
        from: 'generate',
        to: 'Audit.record',
        description: 'Add audit logging',
      },
    ]);
    const session = await store.get(String(plan.sessionId));
    assert.equal(session?.flow.trace?.events.at(-1)?.certainty, 'proposed');
    await assert.rejects(
      service.start({ projectRoot: tmpdir(), target: 'x' }),
      /projectRoot/,
    );
    const cancelled = await service.start({
      projectRoot: root,
      target: 'generate',
    });
    await service.manage('cancel', cancelled.jobId);
    assert.equal(service.status(cancelled.jobId).status, 'cancelled');
    assert.deepEqual(await service.manage('delete', id), { deleted: true });
  } finally {
    service.close();
    await store.close();
  }
});
test('counted loops expand helpers and logical expressions preserve short circuit', async () => {
  const analyzer = new SourceAnalyzer();
  const flow = await analyzer.analyze({ projectRoot: root, target: 'counted' });
  assert.equal(flow.trace?.events.at(-1)?.values.result, 3);
  assert.equal(flow.trace?.events.filter((e) => e.kind === 'loop').length, 2);
  const logical = await analyzer.analyze({
    projectRoot: root,
    target: 'logical',
  });
  assert.equal(logical.trace?.events.at(-1)?.values.result, false);
  assert.equal(
    logical.trace?.events.some((e) => e.kind === 'call'),
    false,
  );
});
test('scenario inputs remain immutable during analysis', async () => {
  const analyzer = new SourceAnalyzer();
  const scenario = { input: { amount: 1 } };
  const result = await analyzer.analyze({
    projectRoot: root,
    target: 'update',
    scenario,
  });
  assert.equal(result.trace?.events.at(-1)?.values.result, 4);
  assert.equal(scenario.input.amount, 1);
  assert.deepEqual(result.trace?.scenario, scenario);
});
