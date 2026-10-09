import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AnimationBuilder } from '../src/services/animation-builder.js';
import { SimulationService } from '../src/services/simulation-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';

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
