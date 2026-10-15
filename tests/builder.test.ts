import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AnimationBuilder } from '../src/services/animation-builder.js';
import { SimulationService } from '../src/services/simulation-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import { createWebApp } from '../src/web/app.js';
import { browserBlocksPort } from '../src/web/browser-port.js';
import { createServer } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';

async function setup(maxSessionBytes = 10 * 1024 * 1024) {
  const directory = await mkdtemp(
    join(tmpdir(), 'code-anime-builder-project-'),
  );
  // All mock-complete fixture traces must point at available, inert source.
  // The builder reads this text but never executes it.
  await writeFile(
    join(directory, 'Workflow.any'),
    'inert source line\n'.repeat(20),
  );
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessions: 20,
    maxSessionBytes,
  });
  const simulation = new SimulationService(
    store,
    'http://localhost:3456',
    async (r) => r,
    async () => ({
      text: 'CodeGraph source fixture',
      status: 'indexed',
      files: 1,
    }),
  );
  const builder = new AnimationBuilder(simulation, store);
  const evidence = await simulation.read({
    projectRoot: directory,
    tool: 'node',
    arguments: { file: 'Workflow.any' },
  });
  const begin = () =>
    builder.run({
      action: 'begin',
      projectRoot: directory,
      endpoint: 'Workflow.run',
      scenario: { input: '  Ada  ' },
      evidenceIds: [evidence.evidenceId],
    });
  return {
    directory,
    store,
    simulation,
    builder,
    evidence,
    begin,
    close: async () => {
      builder.close();
      simulation.close();
      await store.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}
const source = { file: 'Workflow.any', line: 1, endLine: 1 };
test('saved mock animations do not exhaust capacity for subsequent MCP builds', async () => {
  const c = await setup();
  try {
    const sessions: string[] = [];
    const handles: string[] = [];
    for (let i = 0; i < 11; i++) {
      const { buildId } = await c.begin();
      handles.push(String(buildId));
      await c.builder.run({
        action: 'append',
        buildId,
        batchId: `run-${i}`,
        expectedEventCount: 0,
        operations: [
          {
            kind: 'enter',
            symbol: 'Workflow.run',
            label: `Simulated run ${i}`,
            source,
          },
          { kind: 'return', label: 'Complete simulated run', result: i },
        ],
      });
      const done = await c.builder.run({
        action: 'finish',
        buildId,
        coverage: `A prepared mock scenario ${i}`,
        complete: true,
      });
      sessions.push(String(done.sessionId));
      if (i === 9) {
        await assert.rejects(
          c.builder.run({
            action: 'begin',
            projectRoot: c.directory,
            endpoint: 'Workflow.invalid',
            evidenceIds: [randomUUID()],
          }),
          /CodeGraph evidence is required/,
        );
        assert.equal(
          (await c.builder.run({ action: 'status', buildId: handles[0] }))
            .status,
          'ready',
          'invalid new evidence must not evict a finalized build handle',
        );
      }
    }
    assert.equal(sessions.length, 11);
    await assert.rejects(
      c.builder.run({ action: 'status', buildId: handles[0] }),
      /Build expired or not found/,
    );
    assert.equal(
      (await c.builder.run({ action: 'status', buildId: handles[1] })).status,
      'ready',
    );
    const first = await c.store.get(sessions[0]!);
    assert.equal(first?.flow.trace?.events.at(-1)?.result, 0);
    assert.equal(first?.flow.trace?.simulation?.complete, true);
    const last = await c.store.get(sessions.at(-1)!);
    assert.equal(last?.flow.trace?.events.at(-1)?.result, 10);
  } finally {
    await c.close();
  }
});
test('active mock animation handles survive capacity pressure and cancel releases capacity', async () => {
  const c = await setup();
  try {
    const handles: string[] = [];
    for (let i = 0; i < 10; i++) {
      const { buildId } = await c.begin();
      handles.push(String(buildId));
    }
    await assert.rejects(c.begin(), /Build limit reached/);
    for (const buildId of handles)
      assert.equal(
        (await c.builder.run({ action: 'status', buildId })).status,
        'building',
      );
    assert.equal(
      (await c.builder.run({ action: 'cancel', buildId: handles[0] }))
        .cancelled,
      true,
    );
    await assert.rejects(
      c.builder.run({ action: 'status', buildId: handles[0] }),
      /Build expired or not found/,
    );
    const { buildId } = await c.begin();
    assert.equal(
      (await c.builder.run({ action: 'status', buildId })).status,
      'building',
    );
  } finally {
    await c.close();
  }
});
test('mock async tasks interleave with independent stacks and reversible state snapshots', async () => {
  const c = await setup();
  try {
    const { buildId } = await c.begin();
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'main-start',
      expectedEventCount: 0,
      operations: [
        { kind: 'enter', label: 'Start main', symbol: 'Workflow.main', source },
        { kind: 'await', label: 'Wait for callback', set: { waiting: true } },
        {
          kind: 'enter',
          taskId: 'callback',
          label: 'Start callback',
          symbol: 'Workflow.callback',
          source,
        },
        {
          kind: 'assign',
          taskId: 'callback',
          label: 'Compute mock value',
          set: { value: 12 },
        },
      ],
    });
    const active = await c.builder.run({ action: 'status', buildId });
    assert.equal((active.stack as unknown[]).length, 1);
    assert.equal(
      (active.activeTasks as Record<string, unknown[]>).callback?.length,
      1,
    );
    await assert.rejects(
      c.builder.run({
        action: 'finish',
        buildId,
        coverage: 'Both tasks',
        complete: true,
      }),
      /Active call frames remain/,
    );
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'complete-both',
      expectedEventCount: 4,
      operations: [
        {
          kind: 'return',
          taskId: 'callback',
          label: 'Callback result',
          result: 12,
        },
        {
          kind: 'resume',
          label: 'Resume main',
          set: { waiting: false, value: 12 },
        },
        { kind: 'return', label: 'Finish main', result: 12 },
      ],
    });
    const done = await c.builder.run({
      action: 'finish',
      buildId,
      coverage: 'Both simulated tasks completed',
      complete: true,
    });
    const trace = (await c.store.get(String(done.sessionId)))!.flow.trace!;
    assert.deepEqual(
      trace.events.map((event) => event.taskId ?? 'main'),
      ['main', 'main', 'callback', 'callback', 'callback', 'main', 'main'],
    );
    assert.deepEqual(
      trace.events.map((event) => event.stack.length),
      [1, 1, 1, 1, 0, 1, 0],
    );
    assert.deepEqual(Object.keys(trace.events[3]!.locals ?? {}).sort(), [
      'call-1',
      'call-2',
    ]);
    assert.deepEqual(Object.keys(trace.events[4]!.locals ?? {}), ['call-1']);
    assert.equal(trace.simulation?.complete, true);
  } finally {
    await c.close();
  }
});

test('interleaved mock tasks share object state without losing caller return assignments across batches', async () => {
  const c = await setup();
  try {
    const { buildId } = await c.begin();
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'shared-object-start',
      expectedEventCount: 0,
      operations: [
        {
          kind: 'enter',
          symbol: 'Workflow.main',
          label: 'Main',
          source,
          inputs: { amount: 8 },
        },
        {
          kind: 'enter',
          taskId: 'worker',
          symbol: 'Workflow.worker',
          label: 'Worker',
          source,
          inputs: { count: 0 },
        },
        {
          kind: 'mutate',
          taskId: 'worker',
          label: 'Worker creates shared mock object',
          objectId: 'shared',
          fields: { count: 1, owner: 'worker' },
        },
        {
          kind: 'enter',
          symbol: 'Workflow.child',
          label: 'Main enters child',
          source,
        },
        {
          kind: 'mutate',
          label: 'Child changes shared object',
          objectId: 'shared',
          fields: { count: 2, owner: 'child' },
        },
      ],
    });
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'shared-object-finish',
      expectedEventCount: 5,
      operations: [
        {
          kind: 'return',
          label: 'Child returns value to main',
          result: 2,
          assignTo: 'childResult',
        },
        {
          kind: 'mutate',
          taskId: 'worker',
          label: 'Worker revisits shared object',
          objectId: 'shared',
          fields: { count: 3 },
        },
        {
          kind: 'return',
          taskId: 'worker',
          label: 'Worker finishes',
          result: 3,
        },
        { kind: 'console', label: 'Mock console', output: 'final=3\n' },
        { kind: 'return', label: 'Main returns', result: 3 },
      ],
    });
    const done = await c.builder.run({
      action: 'finish',
      buildId,
      coverage: 'One explicit simulated interleaving',
      complete: true,
    });
    const events = (await c.store.get(String(done.sessionId)))!.flow.trace!
      .events;
    assert.equal(events.length, 10);
    assert.deepEqual(
      events.map((step) => step.callId),
      [
        'call-1',
        'call-2',
        'call-2',
        'call-3',
        'call-3',
        'call-3',
        'call-2',
        'call-2',
        'call-1',
        'call-1',
      ],
    );
    assert.deepEqual(events[4]!.before, { count: 1, owner: 'worker' });
    assert.deepEqual(events[4]!.after, { count: 2, owner: 'child' });
    assert.deepEqual(events[6]!.before, { count: 2, owner: 'child' });
    assert.deepEqual(events[6]!.after, { count: 3, owner: 'child' });
    assert.equal(
      (events[6]!.locals as Record<string, Record<string, unknown>>)['call-1']
        ?.childResult,
      2,
    );
    assert.deepEqual(events[9]!.objects?.shared, { count: 3, owner: 'child' });
    assert.deepEqual(events[9]!.stack, []);
    assert.equal(events[8]!.output, 'final=3\n');
    assert.ok(events.every((step) => step.certainty === 'mock'));
  } finally {
    await c.close();
  }
});
test('mock objects retain special JavaScript property names across append batches and storage', async () => {
  const c = await setup();
  try {
    const { buildId } = await c.begin();
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'object-first',
      expectedEventCount: 0,
      operations: [
        { kind: 'enter', label: 'Enter', symbol: 'Workflow.run', source },
        ...['constructor', 'toString', '__proto__'].map((objectId) => ({
          kind: 'mutate',
          label: `Create ${objectId}`,
          objectId,
          fields: { original: objectId },
          source,
        })),
      ],
    });
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'object-second',
      expectedEventCount: 4,
      operations: [
        ...['constructor', 'toString', '__proto__'].map((objectId) => ({
          kind: 'mutate',
          label: `Update ${objectId}`,
          objectId,
          fields: { updated: true },
          source,
        })),
        { kind: 'return', label: 'Return' },
      ],
    });
    const result = await c.builder.run({
      action: 'finish',
      buildId,
      coverage: 'Three opaque mock object IDs with two state changes each',
      complete: true,
    });
    const trace = (await c.store.get(String(result.sessionId)))!.flow.trace!;
    const last = trace.events.at(-1)!;
    for (const objectId of ['constructor', 'toString', '__proto__']) {
      assert.ok(Object.hasOwn(last.objects ?? {}, objectId));
      assert.deepEqual(last.objects?.[objectId], {
        original: objectId,
        updated: true,
      });
    }
    assert.equal(trace.simulation?.complete, true);
  } finally {
    await c.close();
  }
});
test('CodeGraph-backed mock builder preserves more than 30 nested user calls', async () => {
  const c = await setup();
  try {
    // The source file is inert text. The builder must never execute it.
    await writeFile(
      join(c.directory, source.file),
      'function root() { return 42; }\n',
    );
    const { buildId } = await c.begin();
    const depth = 42;
    const operations = [
      ...Array.from({ length: depth }, (_, i) => ({
        kind: 'enter',
        symbol: `UserModule.method${i}`,
        label: `Enter method ${i}`,
        source,
        inputs: { depth: i },
      })),
      ...Array.from({ length: depth }, (_, i) => ({
        kind: 'return',
        label: `Return method ${depth - i - 1}`,
        line: 1,
        result: depth - i - 1,
        ...(i < depth - 1 ? { assignTo: `childResult${i}` } : {}),
      })),
    ];
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'deep-mock-flow',
      expectedEventCount: 0,
      operations,
    });
    const result = await c.builder.run({
      action: 'finish',
      buildId,
      complete: true,
      coverage: '42 nested synthetic user methods with complete mock returns',
    });
    const trace = (await c.store.get(String(result.sessionId)))!.flow.trace!;
    assert.equal(result.eventCount, depth * 2);
    assert.equal(trace.events[depth - 1]!.stack.length, depth);
    assert.equal(
      new Set(trace.events.map((event) => event.callId)).size,
      depth,
    );
    assert.equal(trace.events.at(-1)!.stack.length, 0);
    assert.equal(trace.events.at(-1)!.result, 0);
    assert.equal(trace.simulation?.complete, true);
    assert.deepEqual(Object.keys(trace.sourceFiles ?? {}), [source.file]);
    assert.ok(trace.events.every((event) => event.certainty === 'mock'));
  } finally {
    await c.close();
  }
});
test('builder records caught and uncaught exceptions with exact post-unwind stacks', async () => {
  const c = await setup();
  try {
    const { buildId } = await c.begin();
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'enter',
      expectedEventCount: 0,
      operations: [
        {
          kind: 'enter',
          symbol: 'Workflow.run',
          label: 'Caller',
          source,
          inputs: { keep: 1 },
        },
        {
          kind: 'enter',
          symbol: 'Helper.run',
          label: 'Helper',
          source,
          inputs: { child: 2 },
        },
      ],
    });
    await assert.rejects(
      c.builder.run({
        action: 'append',
        buildId,
        batchId: 'invalid',
        expectedEventCount: 2,
        operations: [
          { kind: 'throw', label: 'Bad target', unwindTo: 'call-999' },
        ],
      }),
      /active invocation/,
    );
    assert.equal(
      (await c.builder.run({ action: 'status', buildId })).eventCount,
      2,
    );
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'exception',
      expectedEventCount: 2,
      operations: [
        {
          kind: 'throw',
          label: 'Raise error',
          result: { message: 'bad input' },
          unwindTo: 'call-1',
        },
        {
          kind: 'catch',
          label: 'Handle error',
          set: { error: { message: 'bad input' } },
        },
        { kind: 'throw', label: 'Rethrow uncaught', unwindTo: null },
      ],
    });
    const done = await c.builder.run({
      action: 'finish',
      buildId,
      complete: true,
      coverage: 'Caught then rethrown',
    });
    const events = (await c.store.get(String(done.sessionId)))!.flow.trace!
      .events;
    assert.deepEqual(events[2]!.stack, ['call-1']);
    assert.equal(events[2]!.callId, 'call-2');
    assert.deepEqual(events[2]!.locals, { 'call-1': { keep: 1 } });
    assert.equal(events[3]!.kind, 'catch');
    assert.equal(events[3]!.callId, 'call-1');
    assert.deepEqual(events[3]!.after, {
      keep: 1,
      error: { message: 'bad input' },
    });
    assert.deepEqual(events[4]!.stack, []);
    assert.deepEqual(events[4]!.locals, {});
  } finally {
    await c.close();
  }
});

test('builder persists and finalizes more than 40 MiB without losing snapshots', async () => {
  const c = await setup();
  try {
    const { buildId } = await c.begin();
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'enter',
      expectedEventCount: 0,
      operations: [
        {
          kind: 'enter',
          symbol: 'Workflow.run',
          label: 'Enter',
          source,
          inputs: { payload: 'x'.repeat(160000) },
        },
      ],
    });
    for (let i = 0; i < 100; i += 10) {
      const batch = {
        action: 'append',
        buildId,
        batchId: `loops-${i}`,
        expectedEventCount: i + 1,
        operations: Array.from({ length: 10 }, () => ({
          kind: 'loop',
          label: 'Iteration',
          line: 2,
        })),
      };
      await c.builder.run(batch);
      if (i === 90)
        assert.equal((await c.builder.run(batch)).replayedBatch, true);
    }
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'return',
      expectedEventCount: 101,
      operations: [{ kind: 'return', label: 'Done' }],
    });
    const done = await c.builder.run({
      action: 'finish',
      buildId,
      complete: true,
      coverage: 'All iterations',
    });
    assert.equal(done.eventCount, 102);
    let bytes = 0;
    const ids = new Set<string>();
    for (const session of await c.store.list()) {
      const stored = await c.store.get(session.id);
      for (const event of stored!.flow.trace!.events) {
        bytes += Buffer.byteLength(JSON.stringify(event));
        ids.add(event.id);
      }
    }
    assert.ok(bytes > 40 * 1024 * 1024);
    assert.equal(ids.size, 102);
    assert.ok(ids.has('event-102'));
    assert.deepEqual(await readdir(c.directory), ['Workflow.any']);
  } finally {
    await c.close();
  }
});

test('MCP builder owns IDs, stack, complete snapshots and null returns without generated project files', async () => {
  const c = await setup();
  try {
    const started = await c.begin();
    const buildId = started.buildId;
    const batch = {
      action: 'append',
      buildId,
      batchId: 'one',
      expectedEventCount: 0,
      operations: [
        {
          kind: 'enter',
          symbol: 'Workflow.run',
          label: 'Input',
          source,
          inputs: { input: '  Ada  ', payments: [1, 2, 3], unchanged: 'keep' },
        },
        {
          kind: 'assign',
          label: 'Create DTO',
          line: 2,
          objectId: 'dto-1',
          fields: { name: '  Ada  ', rows: [1, 2, 3] },
          set: { dto: { objectId: 'dto-1' } },
        },
        {
          kind: 'enter',
          symbol: 'trimName',
          label: 'Enter helper',
          source,
          inputs: { name: '  Ada  ' },
        },
        {
          kind: 'transform',
          label: 'trim()',
          line: 3,
          inputs: { receiver: '  Ada  ' },
          result: 'Ada',
        },
        {
          kind: 'return',
          label: 'Bind result to caller',
          line: 4,
          result: 'Ada',
          assignTo: 'normalized',
        },
        {
          kind: 'mutate',
          label: 'Update DTO',
          line: 5,
          objectId: 'dto-1',
          fields: { name: 'Ada' },
        },
      ],
    };
    const first = await c.builder.run(batch);
    assert.equal(first.eventCount, 6);
    const retry = await c.builder.run(batch);
    assert.equal(retry.eventCount, 6);
    assert.equal(retry.replayedBatch, true);
    await assert.rejects(
      c.builder.run({ ...batch, operations: batch.operations.slice(0, 1) }),
      /batchId/,
    );
    // Entire invalid batch rolls back, including stack pushes and generated IDs.
    await assert.rejects(
      c.builder.run({
        action: 'append',
        buildId,
        batchId: 'bad',
        expectedEventCount: 6,
        operations: [
          { kind: 'enter', symbol: 'temporary', label: 'Enter', source },
          { kind: 'return', label: 'Bad binding', assignTo: 'x' },
        ],
      }),
      /assignTo requires result/,
    );
    assert.equal(
      (await c.builder.run({ action: 'status', buildId })).eventCount,
      6,
    );
    await assert.rejects(
      c.builder.run({
        action: 'finish',
        buildId,
        coverage: 'incomplete',
        complete: true,
      }),
      /Active call frames/,
    );
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'two',
      expectedEventCount: 6,
      operations: [
        {
          kind: 'enter',
          symbol: 'trimName',
          label: 'Repeated helper',
          source,
          inputs: { name: 'Ada' },
        },
        {
          kind: 'return',
          label: 'Null result',
          result: null,
          assignTo: 'optional',
        },
        { kind: 'return', label: 'Return DTO', result: { objectId: 'dto-1' } },
      ],
    });
    const done = await c.builder.run({
      action: 'finish',
      buildId,
      coverage: 'Full mock path',
      complete: true,
    });
    assert.equal(done.status, 'ready');
    assert.match(String(done.url), /http:\/\/localhost:3456\/flow\//);
    const flow = (await c.store.get(String(done.sessionId)))!.flow;
    const events = flow.trace!.events;
    assert.equal(events.length, 9);
    assert.equal(new Set(events.map((e) => e.id)).size, 9);
    assert.notEqual(events[2]!.callId, events[6]!.callId);
    assert.equal(
      (events[4]!.locals!['call-1'] as Record<string, unknown>).normalized,
      'Ada',
    );
    assert.equal(events[4]!.before!.normalized, undefined);
    assert.equal(events[4]!.after!.normalized, 'Ada');
    assert.equal(events[4]!.before!.unchanged, 'keep');
    assert.equal(events[4]!.after!.unchanged, 'keep');
    assert.equal(events[4]!.result, 'Ada');
    assert.equal(events[4]!.values.assignedTo, 'normalized');
    assert.equal(events[4]!.values.assignedInCallId, 'call-1');
    assert.deepEqual(
      (events[4]!.locals!['call-1'] as Record<string, unknown>).payments,
      [1, 2, 3],
    );
    assert.equal(
      (events[4]!.locals!['call-1'] as Record<string, unknown>).unchanged,
      'keep',
    );
    assert.equal(events[5]!.before!.name, '  Ada  ');
    assert.equal(events[5]!.after!.name, 'Ada');
    assert.deepEqual(events[5]!.after!.rows, [1, 2, 3]);
    assert.equal(
      (events[7]!.locals!['call-1'] as Record<string, unknown>).optional,
      null,
    );
    assert.equal(events[7]!.before!.optional, undefined);
    assert.equal(events[7]!.after!.optional, null);
    assert.deepEqual(events.at(-1)!.stack, []);
    assert.equal(events.at(-1)!.objects!['dto-1']!.name, 'Ada');
    assert.deepEqual(
      await readdir(c.directory),
      ['Workflow.any'],
      'Only the preexisting inert source may exist; no animation artifact may be written into the target project',
    );
    const again = await c.builder.run({
      action: 'finish',
      buildId,
      coverage: 'Full mock path',
      complete: true,
    });
    assert.equal(again.url, done.url);
    assert.equal((await c.store.list()).length, 1);
  } finally {
    await c.close();
  }
});

test('unknown mock steps must disclose uncertainty and the evidence gap', async () => {
  const c = await setup();
  try {
    const { buildId } = await c.begin();
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'entry',
      expectedEventCount: 0,
      operations: [
        {
          kind: 'enter',
          label: 'Enter workflow',
          symbol: 'Workflow.run',
          source,
        },
      ],
    });
    const uncertain = {
      action: 'append',
      buildId,
      batchId: 'unknown',
      expectedEventCount: 1,
      operations: [{ kind: 'unresolved', label: 'Unknown callback', line: 2 }],
    };
    await assert.rejects(c.builder.run(uncertain), /certainty: unresolved/);
    await assert.rejects(
      c.builder.run({
        ...uncertain,
        operations: [{ ...uncertain.operations[0], certainty: 'unresolved' }],
      }),
      /in note/,
    );
    assert.equal(
      (await c.builder.run({ action: 'status', buildId })).eventCount,
      1,
      'Failed mock batches cannot change the prepared replay',
    );
    await c.builder.run({
      ...uncertain,
      operations: [
        {
          ...uncertain.operations[0],
          certainty: 'unresolved',
          note: 'CodeGraph could not determine this callback target',
        },
      ],
    });
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'exit',
      expectedEventCount: 2,
      operations: [{ kind: 'return', label: 'Return with unknown path' }],
    });
    const result = await c.builder.run({
      action: 'finish',
      buildId,
      coverage: 'Dynamic callback remains unresolved',
      complete: false,
    });
    const saved = (await c.store.get(String(result.sessionId)))!.flow.trace!;
    assert.equal(saved.events[1]?.certainty, 'unresolved');
    assert.match(saved.events[1]?.note ?? '', /CodeGraph/);
    assert.equal(saved.simulation?.complete, false);
  } finally {
    await c.close();
  }
});

test('builder automatically chunks large flows and returns one first-player URL', async () => {
  const c = await setup();
  try {
    const { buildId } = await c.begin();
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'start',
      expectedEventCount: 0,
      operations: [
        { kind: 'enter', symbol: 'Workflow.run', label: 'Enter', source },
      ],
    });
    for (let offset = 0; offset < 2100; offset += 100)
      await c.builder.run({
        action: 'append',
        buildId,
        batchId: 'batch-' + offset,
        expectedEventCount: offset + 1,
        operations: Array.from({ length: 100 }, (_, i) => ({
          kind: 'loop',
          label: 'Iteration ' + (offset + i),
          line: 2,
          set: { i: offset + i },
        })),
      });
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'end',
      expectedEventCount: 2101,
      operations: [{ kind: 'return', label: 'Done', result: 2100 }],
    });
    const done = await c.builder.run({
      action: 'finish',
      buildId,
      complete: true,
      coverage: 'All 2100 iterations',
    });
    assert.equal(done.eventCount, 2102);
    assert.equal(done.chunks, 2);
    const sessions = await c.store.list();
    assert.equal(sessions.length, 2);
    const first = sessions.find(
      (s) => !s.flow.trace!.simulation!.previousSessionId,
    )!;
    assert.ok(String(done.url).endsWith(first.id));
    assert.equal(first.flow.trace!.events.length, 2000);
    const last = sessions.find((s) => s.id !== first.id)!;
    assert.equal(last.flow.trace!.simulation!.previousSessionId, first.id);
    assert.equal(last.flow.trace!.events[0]!.id, 'event-2001');
    const read = c.store.get.bind(c.store);
    const reads: string[] = [];
    c.store.get = async (id) => {
      reads.push(id);
      return read(id);
    };
    assert.equal((await c.store.next(first.id))?.id, last.id);
    assert.deepEqual(
      reads,
      [last.id],
      'continuation lookup reads only its successor',
    );
    await c.store.delete(last.id);
    reads.length = 0;
    assert.equal(await c.store.next(first.id), undefined);
    assert.deepEqual(reads, [], 'deleted continuation must leave the index');
  } finally {
    await c.close();
  }
});

test('comparison preserves independently chunked runs with changes only in the final chunk', async () => {
  const c = await setup();
  try {
    async function build(baselineSessionId?: string) {
      const { buildId } = await c.builder.run({
        action: 'begin',
        projectRoot: c.directory,
        endpoint: 'Workflow.run',
        evidenceIds: [c.evidence.evidenceId],
        baselineSessionId,
      });
      await c.builder.run({
        action: 'append',
        buildId,
        batchId: 'start',
        expectedEventCount: 0,
        operations: [
          { kind: 'enter', symbol: 'Workflow.run', label: 'Enter', source },
        ],
      });
      for (let offset = 0; offset < 2000; offset += 100)
        await c.builder.run({
          action: 'append',
          buildId,
          batchId: String(offset),
          expectedEventCount: offset + 1,
          operations: Array.from({ length: 100 }, () => ({
            kind: 'loop',
            label: 'Iteration',
            line: 2,
          })),
        });
      await c.builder.run({
        action: 'append',
        buildId,
        batchId: 'end',
        expectedEventCount: 2001,
        operations: [
          {
            kind: 'return',
            label: 'Return',
            result: baselineSessionId ? 42 : 30,
            certainty: baselineSessionId ? 'proposed' : 'mock',
          },
        ],
      });
      return c.builder.run({
        action: 'finish',
        buildId,
        complete: true,
        coverage: 'All iterations',
      });
    }
    const baseline = await build();
    const proposed = await build(String(baseline.sessionId));
    assert.equal(baseline.chunks, 2);
    assert.equal(proposed.chunks, 2);
    const baselineRoot = String(baseline.url).split('/').at(-1)!;
    const proposedRoot = String(proposed.url).split('/').at(-1)!;
    const first = (await c.store.get(proposedRoot))!;
    assert.equal(
      first.flow.baselineSessionId,
      baselineRoot,
      'a baseline tail resolves to its first chunk',
    );
    assert.equal(first.flow.baselineTrace!.events.length, 2000);
    const last = (await c.store.next(proposedRoot))!;
    assert.equal(last.flow.trace!.simulation!.baselineSessionId, baselineRoot);
    assert.equal(last.flow.trace!.events.at(-1)!.result, 42);
    assert.equal(
      (await c.store.next(baselineRoot))!.flow.trace!.events.at(-1)!.result,
      30,
    );
    const server = createServer(createWebApp(c.store));
    try {
      // fetch() correctly refuses browser-blocked ports even on localhost.
      // Windows may randomly select one of these ports for listen(0).
      for (let attempts = 0; attempts < 25; attempts++) {
        server.listen(0, '127.0.0.1');
        await once(server, 'listening');
        if (!browserBlocksPort((server.address() as AddressInfo).port)) break;
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      }
      assert.equal(
        browserBlocksPort((server.address() as AddressInfo).port),
        false,
      );
      const response = await fetch(
        `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/flow/${proposedRoot}`,
      );
      assert.equal(response.status, 200);
      const playerFlow = await response.json();
      assert.equal(playerFlow.baselineSessionId, baselineRoot);
      assert.equal(playerFlow.baselineNextSessionId, baseline.sessionId);
      assert.equal(playerFlow.nextSessionId, proposed.sessionId);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
    assert.deepEqual(await readdir(c.directory), ['Workflow.any']);
  } finally {
    await c.close();
  }
});

test('builder blocks missing evidence and removes partial sessions on finish failure', async () => {
  const c = await setup();
  try {
    await assert.rejects(
      c.builder.run({
        action: 'begin',
        projectRoot: c.directory,
        endpoint: 'x',
        evidenceIds: [randomUUID()],
      }),
      /CodeGraph evidence is required/,
    );
    assert.equal((await c.store.list()).length, 0);
    const { buildId } = await c.begin();
    // Inject a storage failure on the second chunk to verify atomic cleanup.
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'start',
      expectedEventCount: 0,
      operations: [{ kind: 'enter', symbol: 'x', label: 'Enter', source }],
    });
    const original = c.simulation.submit.bind(c.simulation);
    let calls = 0;
    c.simulation.submit = async (raw) => {
      if (++calls === 2) throw new Error('fixture storage failure');
      return original(raw);
    };
    for (let offset = 0; offset < 2000; offset += 100)
      await c.builder.run({
        action: 'append',
        buildId,
        batchId: String(offset),
        expectedEventCount: offset + 1,
        operations: Array.from({ length: 100 }, () => ({
          kind: 'loop',
          label: 'Iteration',
          set: { value: 1 },
        })),
      });
    await c.builder.run({
      action: 'append',
      buildId,
      batchId: 'return',
      expectedEventCount: 2001,
      operations: [{ kind: 'return', label: 'Return' }],
    });
    await assert.rejects(
      c.builder.run({
        action: 'finish',
        buildId,
        complete: true,
        coverage: 'test',
      }),
      /storage failure/,
    );
    assert.equal((await c.store.list()).length, 0);
    c.simulation.submit = original;
    assert.equal(
      (
        await c.builder.run({
          action: 'finish',
          buildId,
          complete: true,
          coverage: 'test',
        })
      ).status,
      'ready',
    );
  } finally {
    await c.close();
  }
});
