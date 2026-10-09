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

test('caught and unhandled exceptions do not invent normal returns; generators retain invocation identity across yields', async () => {
  const f = await fixture({
    'main.py':
      'def fail():\n    try:\n        raise ValueError("bad")\n    finally:\n        x = 1\ntry:\n    fail()\nexcept ValueError:\n    print("caught")\n',
    'generator.py':
      'def gen():\n    yield 1\n    yield 2\n    return "done"\nprint(list(gen()))\n',
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
    const generated = await wait(f.service, generator.jobId);
    assert.equal(generated.complete, true);
    const { events: generatorEvents } = await allEvents(
      f.store,
      generated.sessionId!,
    );
    const entered = generatorEvents.filter(
      (e) => e.kind === 'enter' && e.symbolId.endsWith(':gen'),
    );
    const yielded = generatorEvents.filter(
      (e) => e.kind === 'yield' && e.symbolId.endsWith(':gen'),
    );
    const resumed = generatorEvents.filter(
      (e) => e.kind === 'resume' && e.symbolId.endsWith(':gen'),
    );
    assert.equal(entered.length, 1);
    assert.deepEqual(
      yielded.map((e) => e.result),
      [1, 2],
    );
    assert.equal(resumed.length, 2);
    assert.ok(
      [...yielded, ...resumed].every((e) => e.callId === entered[0]!.callId),
    );
    assert.deepEqual(
      generatorEvents
        .filter((e) => e.kind === 'return' && e.symbolId.endsWith(':gen'))
        .map((e) => e.result),
      ['done'],
    );
    assert.ok(yielded.every((e) => !e.stack.includes(e.callId)));
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

test('records coroutine suspension and independent asyncio task interleaving without fictitious returns', async () => {
  const f = await fixture({
    'main.py': [
      'import asyncio',
      'async def worker(name):',
      '    total = 0',
      '    for i in range(2):',
      '        total += 1',
      '        await asyncio.sleep(0)',
      '    print(name, total)',
      '    return total',
      'async def main():',
      '    results = await asyncio.gather(worker("A"), worker("B"))',
      '    print(sum(results))',
      'asyncio.run(main())',
    ].join('\n'),
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
    const workers = events.filter(
      (e) => e.kind === 'enter' && e.symbolId.endsWith(':worker'),
    );
    assert.equal(workers.length, 2);
    assert.equal(new Set(workers.map((e) => e.values.task)).size, 2);
    assert.ok(workers.every((e) => e.values.task !== 'main'));
    for (const worker of workers) {
      const own = events.filter((e) => e.callId === worker.callId);
      assert.equal(own.filter((e) => e.kind === 'return').length, 1);
      assert.ok(own.filter((e) => e.kind === 'await').length >= 2);
      assert.ok(own.filter((e) => e.kind === 'resume').length >= 2);
      assert.ok(own.every((e) => e.values.task === worker.values.task));
      assert.ok(
        own
          .filter((e) => e.kind === 'await')
          .every((e) => !e.stack.includes(e.callId)),
      );
    }
    assert.equal(
      events.filter(
        (e) => e.kind === 'return' && e.symbolId.endsWith(':worker'),
      ).length,
      2,
    );
    assert.equal(
      events
        .filter((e) => e.kind === 'console')
        .map((e) => e.output)
        .join(''),
      'A 2\nB 2\n4\n',
    );
  } finally {
    await f.close();
  }
});

test('async cancellation and propagated awaited exceptions never become normal returns', async () => {
  const f = await fixture({
    'cancel.py': [
      'import asyncio',
      'async def worker():',
      '    try:',
      '        await asyncio.sleep(10)',
      '    finally:',
      '        print("cleanup")',
      'async def main():',
      '    task = asyncio.create_task(worker())',
      '    await asyncio.sleep(0)',
      '    task.cancel()',
      '    try:',
      '        await task',
      '    except asyncio.CancelledError:',
      '        print("cancelled")',
      'asyncio.run(main())',
    ].join('\n'),
    'exception.py': [
      'import asyncio',
      'async def worker():',
      '    await asyncio.sleep(0)',
      '    raise ValueError("bad")',
      'async def main():',
      '    try:',
      '        await worker()',
      '    except ValueError:',
      '        print("caught")',
      'asyncio.run(main())',
    ].join('\n'),
  });
  try {
    for (const [entry, expected] of [
      ['cancel.py', 'cleanup\ncancelled\n'],
      ['exception.py', 'caught\n'],
    ] as const) {
      const job = await f.service.run({
        action: 'start',
        language: 'python',
        projectRoot: f.root,
        entry,
      });
      const result = await wait(f.service, job.jobId);
      assert.equal(result.complete, true);
      const { events } = await allEvents(f.store, result.sessionId!);
      const worker = events.filter((e) => e.symbolId.endsWith(':worker'));
      const invocation = worker.find((e) => e.kind === 'enter');
      assert.ok(invocation);
      assert.ok(worker.some((e) => e.kind === 'await'));
      assert.ok(worker.some((e) => e.kind === 'resume'));
      assert.ok(worker.some((e) => e.kind === 'throw'));
      assert.ok(worker.every((e) => e.callId === invocation.callId));
      assert.equal(worker.filter((e) => e.kind === 'return').length, 0);
      assert.equal(
        events
          .filter((e) => e.kind === 'console')
          .map((e) => e.output)
          .join(''),
        expected,
      );
    }
  } finally {
    await f.close();
  }
});
