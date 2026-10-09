import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
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
    assert.deepEqual(await readdir(c.directory), []);
  } finally {
    await c.close();
  }
});

test('MCP builder owns IDs, stack, complete snapshots and null returns without project files', async () => {
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
    assert.deepEqual(events.at(-1)!.stack, []);
    assert.equal(events.at(-1)!.objects!['dto-1']!.name, 'Ada');
    assert.deepEqual(
      await readdir(c.directory),
      [],
      'No Python/JS/JSON or animation artifact may be written into target project',
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
          server.close((error) => error ? reject(error) : resolve()),
        );
      }
      assert.equal(browserBlocksPort((server.address() as AddressInfo).port), false);
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
    assert.deepEqual(await readdir(c.directory), []);
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
