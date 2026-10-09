import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RecordingService } from '../src/services/recording-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import type { TraceEvent } from '../src/domain/trace.js';
import { traceSchema } from '../src/domain/trace.js';

async function fixture(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-python-'));
  for (const [name, content] of Object.entries(files))
    await writeFile(join(root, name), content);
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessionBytes: 10 * 1024 * 1024,
    maxSessions: 100,
  });
  const service = new RecordingService(
    store,
    'http://127.0.0.1:3456',
    realpath,
  );
  return {
    root,
    store,
    service,
    async close() {
      service.close();
      await store.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}
async function wait(service: RecordingService, jobId: string) {
  for (let i = 0; i < 1000; i++) {
    const result = await service.run({ action: 'status', jobId });
    if (result.status === 'failed') throw new Error(result.error);
    if (result.status === 'ready') return result;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Recording did not finish');
}
async function allEvents(store: FileSessionStore, sessionId: string) {
  let current = await store.get(sessionId);
  const events: TraceEvent[] = [];
  let chunks = 0;
  while (current) {
    chunks++;
    events.push(...current.flow.trace!.events);
    current = await store.next(current.id);
  }
  return { events, chunks };
}

test('records actual nested calls, loop states, executed branches, returns and console across files', async () => {
  const main = [
    'from helpers import add',
    'total = 0',
    'for i in range(1, 6):',
    '    total = add(total, i)',
    'if total == 15:',
    '    print(total)',
    'else:',
    '    print("WRONG BRANCH")',
  ].join('\n');
  const f = await fixture({
    'main.py': main,
    'helpers.py': 'def add(a, b):\n    result = a + b\n    return result\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true);
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.ok(events.every((event) => event.certainty === 'observed'));
    const calls = events.filter(
      (e) => e.kind === 'enter' && e.symbolId.endsWith(':add'),
    );
    assert.equal(calls.length, 5);
    assert.equal(new Set(calls.map((e) => e.callId)).size, 5);
    assert.deepEqual(
      calls.map((e) => e.inputs),
      [
        { a: 0, b: 1 },
        { a: 1, b: 2 },
        { a: 3, b: 3 },
        { a: 6, b: 4 },
        { a: 10, b: 5 },
      ],
    );
    assert.deepEqual(
      events
        .filter((e) => e.kind === 'return' && e.symbolId.endsWith(':add'))
        .map((e) => e.result),
      [1, 3, 6, 10, 15],
    );
    assert.equal(
      events
        .filter((e) => e.kind === 'console')
        .map((e) => e.output)
        .join(''),
      '15\n',
    );
    assert.equal(
      events.some((e) => e.source?.file === 'main.py' && e.source.line === 8),
      false,
    );
    const loops = events.filter(
      (e) =>
        e.kind === 'statement' &&
        e.source?.file === 'main.py' &&
        e.source.line === 4,
    );
    assert.deepEqual(
      loops.map((e) => (e.locals![e.callId] as { total: number }).total),
      [0, 1, 3, 6, 10],
    );
    assert.deepEqual(events.at(-1)!.stack, []);
    assert.equal(
      (await f.store.get(result.sessionId!))!.flow.trace!.sourceFiles![
        'main.py'
      ],
      main,
    );
    const trace = (await f.store.get(result.sessionId!))!.flow.trace!;
    assert.equal(
      traceSchema.safeParse({
        ...trace,
        simulation: {
          mode: 'ai-mock',
          complete: true,
          coverage: 'mock',
          evidenceIds: [],
        },
      }).success,
      false,
    );
    assert.equal(
      traceSchema.safeParse({
        ...trace,
        events: [{ ...trace.events[0], certainty: 'mock' }],
      }).success,
      false,
    );
  } finally {
    await f.close();
  }
});

test('deep recursion exceeds 30 invocations and large recordings use linked storage chunks', async () => {
  const f = await fixture({
    'main.py':
      'def recurse(n):\n    if n:\n        return recurse(n - 1) + 1\n    return 0\nprint(recurse(40))\nfor i in range(1100):\n    x = i\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true);
    const { events, chunks } = await allEvents(f.store, result.sessionId!);
    assert.ok(chunks > 1);
    assert.equal(chunks, result.chunks);
    assert.ok(Math.max(...events.map((e) => e.stack.length)) > 30);
    assert.equal(
      events
        .filter((e) => e.kind === 'console')
        .map((e) => e.output)
        .join(''),
      '40\n',
    );
    assert.equal(events.at(-1)!.id, 'event-' + events.length);
    const first = (await f.store.get(result.sessionId!))!;
    const next = (await f.store.next(first.id))!;
    assert.equal(
      first.flow.trace!.recording!.runId,
      next.flow.trace!.recording!.runId,
    );
    assert.equal(next.flow.trace!.recording!.previousSessionId, first.id);
  } finally {
    await f.close();
  }
});

test('infinite execution preserves valid partial events at the configured budget', async () => {
  const f = await fixture({ 'main.py': 'i = 0\nwhile True:\n    i += 1\n' });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
      maxEvents: 100,
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, false);
    assert.equal(result.eventCount, 100);
    assert.match(result.diagnostics!.join(' '), /event budget/);
    assert.equal(
      (await f.store.get(result.sessionId!))!.flow.trace!.truncated,
      true,
    );
  } finally {
    await f.close();
  }
});

test('timeout and explicit cancellation stop blocked execution and retain partial evidence', async () => {
  const f = await fixture({
    'main.py': 'import time\nx = 1\ntime.sleep(30)\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
      timeoutMs: 700,
    });
    const timed = await wait(f.service, job.jobId);
    assert.equal(timed.complete, false);
    assert.match(timed.diagnostics!.join(' '), /exceeded 700 ms/);
    const second = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    for (let i = 0; i < 200; i++) {
      if (
        (await f.service.run({ action: 'status', jobId: second.jobId }))
          .eventCount >= 3
      )
        break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await f.service.run({ action: 'cancel', jobId: second.jobId });
    const cancelled = await wait(f.service, second.jobId);
    assert.equal(cancelled.complete, false);
    assert.match(cancelled.diagnostics!.join(' '), /cancelled/);
  } finally {
    await f.close();
  }
});

test('caught and unhandled exceptions do not invent normal returns; generators report a boundary', async () => {
  const f = await fixture({
    'main.py':
      'def fail():\n    try:\n        raise ValueError("bad")\n    finally:\n        x = 1\ntry:\n    fail()\nexcept ValueError:\n    print("caught")\n',
    'generator.py': 'def gen():\n    yield 1\nlist(gen())\n',
    'dynamic.py': 'x = 1\nexec("print(42)")\n',
    'uncaught.py': 'def fail():\n    raise ValueError("bad")\nfail()\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true);
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.equal(
      events.some((e) => e.kind === 'return' && e.symbolId.endsWith(':fail')),
      false,
    );
    assert.ok(events.some((e) => e.note?.includes('unwound')));
    assert.equal(
      events
        .filter((e) => e.kind === 'console')
        .map((e) => e.output)
        .join(''),
      'caught\n',
    );
    const generator = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'generator.py',
    });
    const unsupported = await wait(f.service, generator.jobId);
    assert.equal(unsupported.complete, false);
    assert.match(unsupported.diagnostics!.join(' '), /Generator or coroutine/);
    for (const [entry, reason] of [
      ['dynamic.py', /Dynamically compiled/],
      ['uncaught.py', /terminated with ValueError/],
    ] as const) {
      const started = await f.service.run({
        action: 'start',
        language: 'python',
        projectRoot: f.root,
        entry,
      });
      const boundary = await wait(f.service, started.jobId);
      assert.equal(boundary.complete, false);
      assert.match(boundary.diagnostics!.join(' '), reason);
    }
    await assert.rejects(
      f.service.run({
        action: 'start',
        language: 'python',
        projectRoot: f.root,
        entry: '../outside.py',
      }),
    );
  } finally {
    await f.close();
  }
});
