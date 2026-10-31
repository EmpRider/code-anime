import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import fsPromises from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseSceneAppend,
  parseSceneEvent,
} from '../src/services/scene-ingress.js';
import { eventSchema } from '../src/domain/trace.js';
import { validateSceneDocument } from '../src/domain/flow-scene.js';
import { AnimationBuilder } from '../src/services/animation-builder.js';
import { SimulationService } from '../src/services/simulation-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import type { SceneAppend, SceneBegin } from '../src/domain/scene-input.js';
import type { EventJournal } from '../src/storage/event-journal.js';
import * as sourceCatalog from '../src/services/source-catalog.js';

const source = { file: 'Workflow.any', line: 1, endLine: 1 };
function authoredBatch() {
  return {
    action: 'append',
    buildId: '11111111-1111-4111-8111-111111111111',
    batchId: 'first',
    expectedEventCount: 0,
    operations: [
      {
        key: 'enter',
        nodeKey: 'start',
        callKey: 'main',
        activeEdgeKeys: [],
        kind: 'enter',
        label: 'Start',
        symbol: 'Workflow.run',
        source,
        certainty: 'mock',
      },
    ],
    nodes: [
      {
        key: 'start',
        callKey: 'main',
        groupPathKeys: [],
        source,
        kind: 'entry',
        label: 'Start',
        order: 0,
        taskId: 'main',
        certainty: 'mock',
        evidenceIds: [],
        note: null,
      },
    ],
    edges: [],
    groups: [],
  };
}

test('strict authored append accepts keys without predicted server IDs', () => {
  const input = authoredBatch();
  assert.deepEqual(parseSceneAppend(input), input);
});

test('strict authored append rejects old groupPath authority and unknown fields', () => {
  for (const extra of [{ groupPath: [] }, { unexpected: true }]) {
    const input = authoredBatch();
    Object.assign(input.operations[0]!, extra);
    assert.throws(() => parseSceneAppend(input), /groupPath|unexpected/);
  }
});

test('strict authored append rejects predicted IDs and unknown nested source fields', () => {
  const predicted = authoredBatch();
  Object.assign(predicted.nodes[0]!, { id: 'node:predicted' });
  assert.throws(() => parseSceneAppend(predicted), /id/);

  const nested = structuredClone(authoredBatch());
  Object.assign(nested.nodes[0]!.source, { injected: true });
  assert.throws(() => parseSceneAppend(nested), /injected/);
});

test('strict authored append preserves explicit graph alternatives without inventing events', () => {
  const input = authoredBatch();
  input.nodes.push({ ...input.nodes[0]!, key: 'alternative', order: 1 });
  const parsed = parseSceneAppend(input);
  assert.deepEqual(
    parsed.nodes.map(({ key }) => key),
    ['start', 'alternative'],
  );
  assert.equal(parsed.operations.length, 1);
  assert.equal(parsed.operations[0]!.nodeKey, 'start');
});

function sceneFixture() {
  return JSON.parse(
    readFileSync(
      new URL('./fixtures/v3/proposed-baseline.json', import.meta.url),
      'utf8',
    ),
  );
}

test('server scene boundary delegates atomic validation and immutable detachment', () => {
  const input = sceneFixture();
  const document = validateSceneDocument(input);
  assert.notEqual(document, input);
  assert.deepEqual(document, input);
  assert.ok(Object.isFrozen(document));
  assert.ok(Object.isFrozen(document.variantsById.proposed.graph.nodes[0]));
  input.variantsById.proposed.graph.nodes[0].label = 'Changed after validation';
  assert.equal(
    document.variantsById.proposed.graph.nodes[0]!.label,
    'start <img src=x onerror=alert(1)>',
  );
});

test('server scene boundary rejects malformed ready baseline and V2 roots', () => {
  const input = sceneFixture();
  input.variantsById.baseline.graph.nodes[0].sourceRef.fileId = 'missing-file';
  assert.throws(() => validateSceneDocument(input), /unknown local reference/);
  assert.throws(
    () => validateSceneDocument({ version: 2, events: [] }),
    /schemaVersion/,
  );
});

async function candidate(evidenceText = 'Inert CodeGraph test evidence') {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-scene-ingress-'));
  await writeFile(join(root, 'Workflow.any'), 'entry\r\nreturn\n');
  const store = await FileSessionStore.open(join(root, 'store'), {
    ttlMs: 60_000,
    maxSessions: 10,
    maxSessionBytes: 1024 * 1024,
  });
  const simulation = new SimulationService(
    store,
    'http://127.0.0.1:3456',
    async (path) => path,
    async () => ({ text: evidenceText, status: 'indexed', files: 1 }),
  );
  const builder = new AnimationBuilder(simulation, store);
  const evidence = await simulation.read({
    projectRoot: root,
    tool: 'node',
    arguments: { file: 'Workflow.any' },
  });
  return {
    root,
    store,
    builder,
    simulation,
    evidence,
    begin: () =>
      builder.beginScene({
        projectRoot: root,
        endpoint: 'Workflow.run',
        evidenceIds: [evidence.evidenceId],
        scenario: {
          entrypoint: 'Workflow.run',
          description: 'One host-authored mock call',
          mockInputLabel: 'fixture',
        },
      }),
    close: async () => {
      builder.close();
      simulation.close();
      await store.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}

function callBatch(buildId: string, evidenceId: string): SceneAppend {
  const start = {
    ...authoredBatch().nodes[0]!,
    kind: 'entry' as const,
    certainty: 'mock' as const,
    evidenceIds: [evidenceId],
  };
  return {
    action: 'append',
    buildId,
    batchId: 'call',
    expectedEventCount: 0,
    nodes: [
      start,
      {
        ...start,
        key: 'done',
        kind: 'return',
        order: 1,
        source: { file: 'Workflow.any', line: 2, endLine: 2 },
      },
    ],
    edges: [
      {
        key: 'next',
        fromNodeKey: 'start',
        toNodeKey: 'done',
        kind: 'sequence',
        label: 'next',
        certainty: 'mock',
        evidenceIds: [evidenceId],
        executionStatus: 'simulated-taken',
        callTransition: null,
      },
    ],
    groups: [],
    operations: [
      {
        key: 'enter',
        nodeKey: 'start',
        callKey: 'main',
        activeEdgeKeys: [],
        kind: 'enter',
        label: 'Start',
        symbol: 'Workflow.run',
        source,
        certainty: 'mock',
      },
      {
        key: 'return',
        nodeKey: 'done',
        callKey: 'main',
        activeEdgeKeys: ['next'],
        kind: 'return',
        label: 'Done',
        source: { file: 'Workflow.any', line: 2, endLine: 2 },
        result: null,
        certainty: 'mock',
      },
    ],
  };
}

function candidateJournal(builder: AnimationBuilder, buildId: string) {
  return (
    builder as unknown as {
      sceneBuilds: Map<string, { events: EventJournal }>;
    }
  ).sceneBuilds.get(buildId)!.events;
}

test('candidate append canonicalizes author keys and replays an identical batch without publication', async () => {
  const c = await candidate();
  try {
    const begun = await c.begin();
    assert.deepEqual(Object.keys(begun), ['buildId']);
    const batch = callBatch(begun.buildId, c.evidence.evidenceId);
    assert.deepEqual(await c.builder.appendScene(batch), {
      buildId: begun.buildId,
      acceptedEventCount: 2,
      replayedBatch: false,
    });
    assert.deepEqual(await c.builder.appendScene(batch), {
      buildId: begun.buildId,
      acceptedEventCount: 2,
      replayedBatch: true,
    });
    const journal = candidateJournal(c.builder, begun.buildId);
    const events = [];
    for await (const chunk of journal.chunks()) events.push(...chunk);
    assert.equal(journal.count, 2);
    assert.equal(new Set(events.map(({ id }) => id)).size, 2);
    assert.ok(events.every(({ id }) => !['enter', 'return'].includes(id)));
    assert.equal(events[0]!.callId, events[1]!.callId);
    assert.notEqual(events[0]!.callId, 'main');
    assert.equal(events[1]!.result, null);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('candidate append rejects unknown ownership and conflicting retry without changing the journal', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    const bad = structuredClone(batch);
    bad.operations[0]!.nodeKey = 'unknown';
    await assert.rejects(c.builder.appendScene(bad), /node|Unknown/);
    assert.equal(candidateJournal(c.builder, buildId).count, 0);
    await c.builder.appendScene(batch);
    const changed = structuredClone(batch);
    changed.operations[1]!.result = 42;
    await assert.rejects(c.builder.appendScene(changed), /batchId|different/);
    assert.equal(candidateJournal(c.builder, buildId).count, 2);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('candidate append rejects unapproved cross-call edges and false evidence before journal commit', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    const crossing = structuredClone(batch);
    crossing.nodes[1]!.callKey = 'another-call';
    await assert.rejects(
      c.builder.appendScene(crossing),
      /cross|transition|ownership/,
    );
    const forged = structuredClone(batch);
    forged.nodes[0]!.evidenceIds = ['22222222-2222-4222-8222-222222222222'];
    await assert.rejects(c.builder.appendScene(forged), /evidence|receipt/i);
    assert.equal(candidateJournal(c.builder, buildId).count, 0);
    await c.builder.appendScene(batch);
    assert.equal(candidateJournal(c.builder, buildId).count, 2);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('candidate journal failure leaves the full batch retryable without consuming identities', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    const journal = candidateJournal(c.builder, buildId);
    const append = journal.append.bind(journal);
    journal.append = async () => {
      throw new Error('injected candidate journal failure');
    };
    await assert.rejects(
      c.builder.appendScene(batch),
      /injected candidate journal failure/,
    );
    assert.equal(journal.count, 0);
    journal.append = append;
    assert.equal((await c.builder.appendScene(batch)).replayedBatch, false);
    assert.equal(journal.count, 2);
    assert.equal((await c.builder.appendScene(batch)).replayedBatch, true);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('candidate append rejects an unknown explicit parent even on a root invocation', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    batch.operations[0]!.parentCallKey = 'not-declared';
    await assert.rejects(c.builder.appendScene(batch), /parent call|Unknown/);
    assert.equal(candidateJournal(c.builder, buildId).count, 0);
  } finally {
    await c.close();
  }
});

test('I01 authored dictionaries retain exact own keys and detached nested values', () => {
  const input = authoredBatch();
  const dictionary = JSON.parse(
    '{"__proto__":{"nested":{"__proto__":"kept"}},"constructor":"own","ordinary":7}',
  );
  const origins = JSON.parse(
    '{"__proto__":"source","constructor":"constructor-source","ordinary":"ordinary-source"}',
  );
  Object.assign(input.operations[0]!, {
    inputs: dictionary,
    set: dictionary,
    fields: dictionary,
    values: dictionary,
    origins,
  });
  const parsed = parseSceneAppend(input).operations[0]!;
  for (const field of ['inputs', 'set', 'fields', 'values'] as const) {
    const retained = parsed[field]!;
    assert.deepEqual(Object.keys(retained), [
      '__proto__',
      'constructor',
      'ordinary',
    ]);
    assert.equal(Object.getPrototypeOf(retained), Object.prototype);
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(retained, '__proto__')!.value,
      JSON.parse('{"nested":{"__proto__":"kept"}}'),
    );
    assert.equal(retained.constructor, 'own');
    assert.equal(retained.ordinary, 7);
  }
  assert.deepEqual(Object.keys(parsed.origins!), [
    '__proto__',
    'constructor',
    'ordinary',
  ]);
  assert.equal(
    Object.getOwnPropertyDescriptor(parsed.origins!, '__proto__')!.value,
    'source',
  );
  dictionary.__proto__.nested.__proto__ = 'changed by caller';
  origins.__proto__ = 'changed by caller';
  assert.deepEqual(
    Object.getOwnPropertyDescriptor(parsed.inputs!, '__proto__')!.value,
    JSON.parse('{"nested":{"__proto__":"kept"}}'),
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(parsed.origins!, '__proto__')!.value,
    'source',
  );
  assert.equal(Object.getPrototypeOf(dictionary), Object.prototype);
  assert.equal(Object.hasOwn(Object.prototype, 'nested'), false);
});

test('I01 origins remain string-valued and special keys are not exempt', () => {
  const input = authoredBatch();
  Object.assign(input.operations[0]!, {
    origins: JSON.parse('{"__proto__":7,"ordinary":"source"}'),
  });
  assert.throws(() => parseSceneAppend(input), /origins|string/);
});

test('I01 outer and nested array accessors reject without invocation', () => {
  let invoked = 0;
  const outer = authoredBatch();
  Object.defineProperty(outer, 'operations', {
    enumerable: true,
    get() {
      invoked++;
      return [];
    },
  });
  assert.throws(() => parseSceneAppend(outer), /accessor|data/i);
  assert.equal(invoked, 0);
  const input = authoredBatch();
  const values = [1];
  Object.defineProperty(values, '0', {
    enumerable: true,
    get() {
      invoked++;
      return 7;
    },
  });
  Object.assign(input.operations[0]!, { inputs: { values } });
  assert.throws(() => parseSceneAppend(input), /accessor|data/i);
  assert.equal(invoked, 0);
});

test('I01 cycles reject while repeated acyclic JSON values remain accepted and detached', () => {
  const cyclic = authoredBatch();
  const value: Record<string, unknown> = {};
  value.self = value;
  Object.assign(cyclic.operations[0]!, { inputs: value });
  assert.throws(() => parseSceneAppend(cyclic), /cyclic/i);
  const input = authoredBatch();
  const shared = JSON.parse('{"__proto__":"shared","ordinary":[1,null]}');
  Object.assign(input.operations[0]!, {
    inputs: { left: shared, right: shared },
  });
  const parsed = parseSceneAppend(input).operations[0]!.inputs!;
  assert.deepEqual(
    parsed.left,
    JSON.parse('{"__proto__":"shared","ordinary":[1,null]}'),
  );
  assert.deepEqual(
    parsed.right,
    JSON.parse('{"__proto__":"shared","ordinary":[1,null]}'),
  );
  shared.ordinary[0] = 99;
  assert.deepEqual(
    parsed.left,
    JSON.parse('{"__proto__":"shared","ordinary":[1,null]}'),
  );
  assert.deepEqual(
    parsed.right,
    JSON.parse('{"__proto__":"shared","ordinary":[1,null]}'),
  );
});

test('I01 null-prototype dictionaries preserve own values without inherited-key promotion', () => {
  const input = authoredBatch();
  const dictionary = Object.create(null);
  Object.defineProperty(dictionary, '__proto__', {
    value: 'own',
    enumerable: true,
  });
  Object.assign(input.operations[0]!, { inputs: dictionary });
  const parsed = parseSceneAppend(input).operations[0]!.inputs!;
  assert.equal(Object.getPrototypeOf(parsed), null);
  assert.deepEqual(Object.keys(parsed), ['__proto__']);
  assert.equal(
    Object.getOwnPropertyDescriptor(parsed, '__proto__')!.value,
    'own',
  );
  const inherited = authoredBatch();
  Object.assign(inherited.operations[0]!, {
    inputs: Object.create({ inherited: 7 }),
  });
  assert.throws(() => parseSceneAppend(inherited), /plain|prototype|JSON/i);
});

test('I01 rejects sparse arrays and non-JSON properties rather than silently dropping them', () => {
  for (const invalid of [
    new Array(1),
    { value: undefined },
    { value: Infinity },
  ]) {
    const input = authoredBatch();
    Object.assign(input.operations[0]!, { inputs: { invalid } });
    assert.throws(() => parseSceneAppend(input), /JSON|data|array/i);
  }
  const input = authoredBatch();
  const invalid = {};
  Object.defineProperty(invalid, 'hidden', { value: 7 });
  Object.assign(input.operations[0]!, { inputs: invalid });
  assert.throws(() => parseSceneAppend(input), /data|enumerable|JSON/i);
});

test('I01 candidate journal retains exact authored dictionary keys in events and snapshots', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    const inputs = JSON.parse(
      '{"__proto__":{"nested":{"__proto__":"input"}},"constructor":"input-constructor","ordinary":[1,null]}',
    );
    const set = JSON.parse(
      '{"__proto__":{"nested":{"__proto__":"set"}},"constructor":"set-constructor","ordinary":[2,null]}',
    );
    const fields = JSON.parse(
      '{"__proto__":{"nested":{"__proto__":"field"}},"constructor":"field-constructor","ordinary":[3,null]}',
    );
    Object.assign(batch.operations[0]!, {
      inputs,
      set,
      values: JSON.parse(
        '{"__proto__":{"nested":{"__proto__":"value"}},"constructor":"value-constructor","ordinary":4}',
      ),
      origins: JSON.parse(
        '{"__proto__":"source","constructor":"constructor-source","ordinary":"ordinary-source"}',
      ),
    });
    batch.operations.splice(1, 0, {
      key: 'mutate',
      nodeKey: 'start',
      callKey: 'main',
      activeEdgeKeys: [],
      kind: 'mutate',
      label: 'Mutate mock object',
      objectId: '__proto__',
      fields,
      certainty: 'mock',
    });
    batch.operations[2]!.result = JSON.parse(
      '{"__proto__":{"nested":{"__proto__":"result"}},"constructor":"result-constructor","ordinary":5}',
    );
    assert.equal((await c.builder.appendScene(batch)).acceptedEventCount, 3);
    inputs.__proto__.nested.__proto__ = 'caller mutation';
    set.ordinary[0] = 99;
    fields.constructor = 'caller mutation';
    const events = [];
    for await (const chunk of candidateJournal(c.builder, buildId).chunks())
      events.push(...chunk);
    assert.equal(events.length, 3);
    assert.deepEqual(
      {
        inputs: events[0]!.inputs,
        before: events[0]!.before,
        after: events[0]!.after,
        locals: events[0]!.locals![events[0]!.callId],
        values: events[0]!.values,
        origins: events[0]!.origins,
        objectAfter: events[1]!.after,
        objectSnapshot: events[2]!.objects!.__proto__,
        result: events[2]!.result,
      },
      JSON.parse(`{
      "inputs":{"__proto__":{"nested":{"__proto__":"input"}},"constructor":"input-constructor","ordinary":[1,null]},
      "before":{"__proto__":{"nested":{"__proto__":"input"}},"constructor":"input-constructor","ordinary":[1,null]},
      "after":{"__proto__":{"nested":{"__proto__":"set"}},"constructor":"set-constructor","ordinary":[2,null]},
      "locals":{"__proto__":{"nested":{"__proto__":"set"}},"constructor":"set-constructor","ordinary":[2,null]},
      "values":{"from":"Workflow.run","to":"Workflow.run","__proto__":{"nested":{"__proto__":"value"}},"constructor":"value-constructor","ordinary":4},
      "origins":{"__proto__":"source","constructor":"constructor-source","ordinary":"ordinary-source"},
      "objectAfter":{"__proto__":{"nested":{"__proto__":"field"}},"constructor":"field-constructor","ordinary":[3,null]},
      "objectSnapshot":{"__proto__":{"nested":{"__proto__":"field"}},"constructor":"field-constructor","ordinary":[3,null]},
      "result":{"__proto__":{"nested":{"__proto__":"result"}},"constructor":"result-constructor","ordinary":5}
    }`),
    );
    assert.equal(Object.getPrototypeOf(events[0]!.inputs!), Object.prototype);
    assert.equal(Object.hasOwn(events[2]!.objects!, '__proto__'), true);
    assert.equal(Object.hasOwn(Object.prototype, 'nested'), false);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('I01 candidate rollback and exact retry preserve prior snapshots and detached state', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const first = callBatch(buildId, c.evidence.evidenceId);
    first.operations.splice(1);
    first.operations[0]!.inputs = JSON.parse(
      '{"__proto__":{"nested":"initial"},"constructor":"initial-constructor","ordinary":1}',
    );
    await c.builder.appendScene(first);
    const journal = candidateJournal(c.builder, buildId);
    const original = [];
    for await (const chunk of journal.chunks()) original.push(...chunk);
    const beforeFailure = JSON.stringify(original);
    (first.operations[0]!.inputs!.__proto__ as { nested: string }).nested =
      'caller mutation';
    const next: SceneAppend = {
      action: 'append',
      buildId,
      batchId: 'next',
      expectedEventCount: 1,
      nodes: [],
      edges: [],
      groups: [],
      operations: [
        {
          key: 'update',
          nodeKey: 'start',
          callKey: 'main',
          activeEdgeKeys: [],
          kind: 'assign',
          label: 'Update mock locals',
          certainty: 'mock',
          set: JSON.parse(
            '{"__proto__":{"nested":"updated"},"constructor":"updated-constructor","ordinary":2}',
          ),
        },
      ],
    };
    const append = journal.append.bind(journal);
    journal.append = async () => {
      throw new Error('injected I01 journal failure');
    };
    await assert.rejects(
      c.builder.appendScene(next),
      /injected I01 journal failure/,
    );
    assert.equal(journal.count, 1);
    const afterFailure = [];
    for await (const chunk of journal.chunks()) afterFailure.push(...chunk);
    assert.equal(JSON.stringify(afterFailure), beforeFailure);
    journal.append = append;
    assert.deepEqual(await c.builder.appendScene(next), {
      buildId,
      acceptedEventCount: 1,
      replayedBatch: false,
    });
    assert.deepEqual(await c.builder.appendScene(next), {
      buildId,
      acceptedEventCount: 1,
      replayedBatch: true,
    });
    const changed = structuredClone(next);
    changed.operations[0]!.set!.ordinary = 3;
    await assert.rejects(c.builder.appendScene(changed), /batchId|different/);
    assert.equal(journal.count, 2);
    const events = [];
    for await (const chunk of journal.chunks()) events.push(...chunk);
    assert.equal(JSON.stringify(events[0]), JSON.stringify(original[0]));
    assert.notEqual(events[0]!.id, events[1]!.id);
    assert.equal(events[0]!.callId, events[1]!.callId);
    assert.deepEqual(
      { before: events[1]!.before, after: events[1]!.after },
      JSON.parse(`{
      "before":{"__proto__":{"nested":"initial"},"constructor":"initial-constructor","ordinary":1},
      "after":{"__proto__":{"nested":"updated"},"constructor":"updated-constructor","ordinary":2}
    }`),
    );
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('I01 candidate rejects outer and nested array accessors without invoking them', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const invoked: [number, number] = [0, 0];
    const outer = callBatch(buildId, c.evidence.evidenceId);
    const operations = outer.operations;
    Object.defineProperty(outer, 'operations', {
      enumerable: true,
      get() {
        invoked[0]++;
        return operations;
      },
    });
    const nested = callBatch(buildId, c.evidence.evidenceId);
    const values = [1];
    Object.defineProperty(values, '0', {
      enumerable: true,
      get() {
        invoked[1]++;
        return 7;
      },
    });
    nested.operations[0]!.inputs = { values };
    for (const malformed of [outer, nested]) {
      await assert.rejects(c.builder.appendScene(malformed), /accessor|data/i);
      assert.equal(candidateJournal(c.builder, buildId).count, 0);
    }
    assert.deepEqual(invoked, [0, 0]);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('I01 candidate event validation preserves dictionary and ordinary metadata constraints', () => {
  const event = {
    id: 'event-1',
    kind: 'statement',
    symbolId: 'Workflow.run',
    label: 'Statement',
    callId: 'call-1',
    values: {},
    stack: [],
    certainty: 'mock',
  };
  assert.deepEqual(parseSceneEvent(event), event);
  const { values: _values, ...missingValues } = event;
  const invalid: Array<{ label: string; input: unknown }> = [
    { label: 'required values', input: missingValues },
    {
      label: 'string origins',
      input: { ...event, origins: JSON.parse('{"__proto__":7}') },
    },
    {
      label: 'finite result',
      input: { ...event, result: { nested: Infinity } },
    },
    {
      label: 'finite dictionary',
      input: { ...event, inputs: { nested: { value: Infinity } } },
    },
    {
      label: 'finite object snapshot',
      input: { ...event, objects: { item: { nested: Infinity } } },
    },
    { label: 'known kind', input: { ...event, kind: 'not-an-event' } },
    { label: 'string stack', input: { ...event, stack: [1] } },
    {
      label: 'evidence UUID',
      input: { ...event, evidenceIds: ['not-a-uuid'] },
    },
    {
      label: 'positive source line',
      input: {
        ...event,
        source: { file: 'Workflow.any', line: 0, endLine: 1 },
      },
    },
    {
      label: 'positive generated line',
      input: {
        ...event,
        source: {
          file: 'Workflow.any',
          line: 1,
          endLine: 1,
          generated: { file: 'Generated.any', line: 0 },
        },
      },
    },
    { label: 'snippet limit', input: { ...event, snippet: 'x'.repeat(801) } },
  ];
  for (const field of [
    'values',
    'inputs',
    'before',
    'after',
    'locals',
    'origins',
  ])
    invalid.push({
      label: `${field} is a dictionary`,
      input: { ...event, [field]: [] },
    });
  for (const { label, input } of invalid)
    assert.throws(() => parseSceneEvent(input), label);
});

test('I01 candidate admission measures detached incoming UTF8 bytes before parser defaults', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    const { certainty: _certainty, ...withoutDefault } = batch.operations[0]!;
    const raw = {
      ...batch,
      operations: [withoutDefault, batch.operations[1]!],
    };
    raw.nodes[0]!.label = '';
    const overhead = Buffer.byteLength(JSON.stringify(raw));
    raw.nodes[0]!.label = 'é' + 'x'.repeat(1_048_576 - overhead - 2);
    assert.equal(Buffer.byteLength(JSON.stringify(raw)), 1_048_576);
    assert.ok(
      Buffer.byteLength(JSON.stringify(parseSceneAppend(raw))) > 1_048_576,
    );
    const oversized = structuredClone(raw);
    oversized.nodes[0]!.label += 'x';
    assert.equal(Buffer.byteLength(JSON.stringify(oversized)), 1_048_577);
    assert.equal(JSON.stringify(oversized).length, 1_048_576);
    assert.equal(
      parseSceneAppend(oversized).nodes[0]!.label,
      oversized.nodes[0]!.label,
    );
    await assert.rejects(
      c.builder.appendScene(oversized),
      /Batch exceeds 1 MiB/,
    );
    assert.equal(candidateJournal(c.builder, buildId).count, 0);
    assert.deepEqual(await c.builder.appendScene(raw), {
      buildId,
      acceptedEventCount: 2,
      replayedBatch: false,
    });
    assert.equal(candidateJournal(c.builder, buildId).count, 2);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('I01 candidate pending evidence retains detached data and original retry identity', async () => {
  const c = await candidate();
  const originalValidate = c.simulation.validateSceneEvidence;
  let release = () => {};
  let pendingAppend: Promise<unknown> | undefined;
  try {
    const { buildId } = await c.begin();
    const batch = structuredClone(callBatch(buildId, c.evidence.evidenceId));
    batch.operations[0]!.inputs = JSON.parse(
      '{"__proto__":{"nested":"original"},"ordinary":{"nested":[1,null]}}',
    );
    const saved = structuredClone(batch);
    let reached = () => {};
    const barrier = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let firstCheck = true;
    c.simulation.validateSceneEvidence = async (...args) => {
      if (firstCheck) {
        firstCheck = false;
        reached();
        await gate;
      }
      return originalValidate.apply(c.simulation, args);
    };
    pendingAppend = c.builder.appendScene(batch);
    await barrier;
    (batch.operations[0]!.inputs!.__proto__ as { nested: string }).nested =
      'caller mutation';
    (batch.operations[0]!.inputs!.ordinary as { nested: unknown[] }).nested[0] =
      99;
    batch.operations[0]!.source!.file = 'Changed.any';
    batch.nodes[0]!.source!.file = 'Changed.any';
    batch.nodes[0]!.evidenceIds[0] = '22222222-2222-4222-8222-222222222222';
    release();
    await pendingAppend;
    const events = [];
    for await (const chunk of candidateJournal(c.builder, buildId).chunks())
      events.push(...chunk);
    assert.deepEqual(
      events[0]!.inputs,
      JSON.parse(
        '{"__proto__":{"nested":"original"},"ordinary":{"nested":[1,null]}}',
      ),
    );
    assert.deepEqual(events[0]!.source, {
      file: 'Workflow.any',
      line: 1,
      endLine: 1,
    });
    assert.deepEqual(events[0]!.evidenceIds, [c.evidence.evidenceId]);
    assert.deepEqual(await c.builder.appendScene(saved), {
      buildId,
      acceptedEventCount: 2,
      replayedBatch: true,
    });
    await assert.rejects(c.builder.appendScene(batch), /batchId|different/);
    assert.equal(candidateJournal(c.builder, buildId).count, 2);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    release();
    await pendingAppend?.catch(() => undefined);
    c.simulation.validateSceneEvidence = originalValidate;
    await c.close();
  }
});

test('I01 candidate event validation leaves live builder parser dispatch unchanged', async () => {
  const c = await candidate();
  const originalParse = eventSchema.parse;
  let sharedParses = 0;
  try {
    eventSchema.parse = (data, params) => {
      sharedParses++;
      return originalParse.call(eventSchema, data, params);
    };
    const live = await c.builder.run({
      action: 'begin',
      projectRoot: c.root,
      endpoint: 'Workflow.run',
      evidenceIds: [c.evidence.evidenceId],
      scenario: {},
    });
    await c.builder.run({
      action: 'append',
      buildId: live.buildId,
      batchId: 'live',
      expectedEventCount: 0,
      operations: [
        { kind: 'enter', label: 'Enter', symbol: 'Workflow.run', source },
        { kind: 'return', label: 'Return', result: null },
      ],
    });
    assert.equal(sharedParses, 2);
    const { buildId } = await c.begin();
    await c.builder.appendScene(callBatch(buildId, c.evidence.evidenceId));
    assert.equal(sharedParses, 2);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    eventSchema.parse = originalParse;
    await c.close();
  }
});

function preparationIdentity(projectRoot: string) {
  return {
    id: 'artifact:preparation',
    sessionId: '11111111-1111-4111-8111-111111111111',
    revision: 'revision:1',
    createdAt: '2026-10-31T00:00:00.000Z',
    projectRoot,
    target: 'Workflow.run',
    producer: 'code-anime-mcp' as const,
  };
}

const partialCompletion = {
  complete: false,
  coverage: {
    status: 'partial' as const,
    reasons: ['Only the declared mock path is supplied'],
  },
};

test('T03 begin requires all three own scenario strings without inventing defaults', async () => {
  const c = await candidate();
  try {
    const valid = {
      entrypoint: 'Host.entry',
      description: '',
      mockInputLabel: '  input  ',
    };
    for (const field of ['entrypoint', 'description', 'mockInputLabel']) {
      for (const value of [undefined, null, 7]) {
        const scenario: Record<string, unknown> = { ...valid };
        if (value === undefined) delete scenario[field];
        else scenario[field] = value;
        await assert.rejects(
          c.builder.beginScene({
            projectRoot: c.root,
            endpoint: 'Workflow.run',
            evidenceIds: [c.evidence.evidenceId],
            scenario: scenario as SceneBegin['scenario'],
          }),
          /scenario|entrypoint|description|mockInputLabel|string/,
        );
      }
    }
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 begin preserves exact host scenario and extra own metadata without caller aliases', async () => {
  const c = await candidate();
  try {
    const scenario = JSON.parse(
      '{"entrypoint":"  Different.entry  ","description":"","mockInputLabel":"  input  ","__proto__":{"nested":{"__proto__":"saved"}},"constructor":"own"}',
    );
    const { buildId } = await c.builder.beginScene({
      projectRoot: c.root,
      endpoint: 'Workflow.run',
      evidenceIds: [c.evidence.evidenceId],
      scenario,
    });
    scenario.__proto__.nested.__proto__ = 'caller mutation';
    const retained = (
      c.builder as unknown as {
        sceneBuilds: Map<string, { input: SceneBegin }>;
      }
    ).sceneBuilds.get(buildId)!.input.scenario;
    assert.deepEqual(
      retained,
      JSON.parse(
        '{"entrypoint":"  Different.entry  ","description":"","mockInputLabel":"  input  ","__proto__":{"nested":{"__proto__":"saved"}},"constructor":"own"}',
      ),
    );
    await c.builder.appendScene(callBatch(buildId, c.evidence.evidenceId));
    const prepared = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    assert.deepEqual(prepared.input.scenario, {
      entrypoint: '  Different.entry  ',
      description: '',
      mockInputLabel: '  input  ',
    });
    assert.deepEqual(Object.keys(prepared), ['input']);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 begin rejects caller accessors before invoking them', async () => {
  const c = await candidate();
  try {
    let invoked = 0;
    const scenario = {
      entrypoint: 'Workflow.run',
      description: '',
      mockInputLabel: '',
    };
    Object.defineProperty(scenario, 'metadata', {
      enumerable: true,
      get() {
        invoked++;
        return { value: 7 };
      },
    });
    await assert.rejects(
      c.builder.beginScene({
        projectRoot: c.root,
        endpoint: 'Workflow.run',
        evidenceIds: [c.evidence.evidenceId],
        scenario,
      }),
      /accessor|data/i,
    );
    assert.equal(invoked, 0);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 source collector includes explicit graph-only locations without broadening live collection', async () => {
  const c = await candidate();
  try {
    await writeFile(join(c.root, 'é.any'), 'α\r\n😀\n');
    const { buildId } = await c.begin();
    await c.builder.appendScene(callBatch(buildId, c.evidence.evidenceId));
    const events = [];
    for await (const chunk of candidateJournal(c.builder, buildId).chunks())
      events.push(...chunk);
    const live = await sourceCatalog.collectSourceFiles(c.root, events);
    assert.deepEqual(Object.entries(live.files), [
      ['Workflow.any', 'entry\r\nreturn\n'],
    ]);
    assert.deepEqual(live.diagnostics, []);
    const captured = await sourceCatalog.collectSourceLocations(c.root, [
      { file: 'é.any', line: 1, endLine: 2 },
      source,
      source,
    ]);
    assert.deepEqual(Object.entries(captured.files), [
      ['é.any', 'α\r\n😀\n'],
      ['Workflow.any', 'entry\r\nreturn\n'],
    ]);
    assert.deepEqual(captured.diagnostics, []);
  } finally {
    await c.close();
  }
});

test('T03 preparation captures graph-only source once for canonical links and exact digest', async () => {
  const c = await candidate();
  try {
    await writeFile(join(c.root, 'é.any'), 'α\r\n😀\n');
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    batch.nodes.unshift({
      ...batch.nodes[0]!,
      key: 'alternative',
      kind: 'statement',
      order: 2,
      source: { file: 'é.any', line: 1, endLine: 2 },
      groupPathKeys: ['group-only'],
      evidenceIds: [],
    });
    batch.groups.push({
      key: 'group-only',
      kind: 'sequence',
      label: 'Graph-only group',
      parentGroupKey: null,
      memberNodeKeys: ['alternative'],
      order: 0,
      callKey: 'main',
      taskId: 'main',
      source: { file: 'é.any', line: 1, endLine: 2 },
      arm: null,
      iteration: null,
      certainty: 'mock',
      evidenceIds: [],
    });
    await c.builder.appendScene(batch);
    const prepared = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    const input = prepared.input;
    assert.equal(
      input.artifact.sourceHash,
      '8b556458d6133939c991cd821a2558dd49b31ae7b267607856449521d68d86be',
    );
    assert.deepEqual(
      input.sources.map(({ path, text }) => [path, text]).sort(),
      [
        ['Workflow.any', 'entry\r\nreturn\n'],
        ['é.any', 'α\r\n😀\n'],
      ],
    );
    const graphOnly = input.graph.nodes.find(
      (node) => node.label === 'Start' && node.eventIds.length === 0,
    )!;
    const graphFile = input.sources.find((file) => file.path === 'é.any')!;
    assert.equal(graphOnly.sourceRef!.fileId, graphFile.id);
    assert.equal(input.graph.groups[0]!.sourceRef!.fileId, graphFile.id);
    assert.deepEqual(graphOnly.groupPathIds, [input.graph.groups[0]!.id]);
    assert.deepEqual(input.graph.groups[0]!.memberNodeIds, [graphOnly.id]);
    assert.equal(
      input.graph.nodes.find((node) =>
        node.eventIds.includes(input.events[0]!.id),
      )!.callId,
      input.events[0]!.callId,
    );
    assert.deepEqual(input.activeEdgeIdsByEventId.get(input.events[1]!.id), [
      input.graph.edges[0]!.id,
    ]);
    assert.equal(input.status.complete, false);
    assert.equal(input.status.coverage.status, 'partial');
    await writeFile(join(c.root, 'Workflow.any'), 'changed after capture\n');
    await writeFile(join(c.root, 'é.any'), 'also changed\n');
    assert.deepEqual(
      input.sources.map(({ path, text }) => [path, text]).sort(),
      [
        ['Workflow.any', 'entry\r\nreturn\n'],
        ['é.any', 'α\r\n😀\n'],
      ],
    );
    assert.equal(
      input.artifact.sourceHash,
      '8b556458d6133939c991cd821a2558dd49b31ae7b267607856449521d68d86be',
    );
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 preparation keeps interleaved baseline handoffs private and omits absent baseline', async () => {
  const c = await candidate();
  const originalGet = c.store.get;
  try {
    c.store.get = async () => {
      throw new Error('legacy baseline lookup is forbidden');
    };
    const ids = [
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ];
    const builds = [];
    for (const baselineSessionId of [...ids, undefined]) {
      builds.push(
        await c.builder.beginScene({
          projectRoot: c.root,
          endpoint: 'Workflow.run',
          evidenceIds: [c.evidence.evidenceId],
          scenario: {
            entrypoint: 'Host.entry',
            description: '',
            mockInputLabel: '',
          },
          ...(baselineSessionId === undefined ? {} : { baselineSessionId }),
        }),
      );
    }
    for (const index of [1, 0, 2]) {
      const buildId = builds[index]!.buildId;
      const batch = callBatch(buildId, c.evidence.evidenceId);
      if (index !== 2) {
        for (const operation of batch.operations)
          operation.certainty = 'proposed';
      }
      await c.builder.appendScene(batch);
      const prepared = await c.builder.prepareScene(
        buildId,
        preparationIdentity(c.root),
        partialCompletion,
        new AbortController().signal,
      );
      assert.equal(prepared.baselineSessionId, ids[index]);
      assert.equal(Object.hasOwn(prepared, 'baselineSessionId'), index !== 2);
      assert.deepEqual(
        Object.keys(prepared).sort(),
        index === 2 ? ['input'] : ['baselineSessionId', 'input'],
      );
    }
    assert.deepEqual(await c.store.list(), []);
  } finally {
    c.store.get = originalGet;
    await c.close();
  }
});

test('T03 preparation abort preserves accepted journal and allows un-aborted preparation', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    await c.builder.appendScene(batch);
    const controller = new AbortController();
    controller.abort(new Error('cancelled preparation'));
    await assert.rejects(
      c.builder.prepareScene(
        buildId,
        preparationIdentity(c.root),
        partialCompletion,
        controller.signal,
      ),
      /cancelled preparation|abort/i,
    );
    assert.equal(candidateJournal(c.builder, buildId).count, 2);
    assert.equal((await c.builder.appendScene(batch)).replayedBatch, true);
    const prepared = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    assert.equal(prepared.input.events.length, 2);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 coverage retains honest authored uncertainty and appends measured reasons losslessly', async () => {
  for (const boundary of ['none', 'provider', 'unread'] as const) {
    const c = await candidate(
      boundary === 'provider'
        ? 'Showing 1 of 2 results'
        : boundary === 'unread'
          ? 'x'.repeat(16001)
          : undefined,
    );
    try {
      const statuses =
        boundary === 'provider'
          ? ([
              'unknown',
              'partial',
              'unresolved',
              'provider-truncated',
            ] as const)
          : (['unknown', 'partial', 'unresolved'] as const);
      for (const status of statuses) {
        for (const complete of boundary === 'none' ? [false, true] : [false]) {
          const { buildId } = await c.begin();
          await c.builder.appendScene(
            callBatch(buildId, c.evidence.evidenceId),
          );
          const measured =
            boundary === 'provider'
              ? `CodeGraph node receipt ${c.evidence.evidenceId}: Showing 1 of 2 results`
              : boundary === 'unread'
                ? `Unread CodeGraph node receipt ${c.evidence.evidenceId}`
                : complete
                  ? 'The submitted mock scenario is complete, but CodeGraph receipts cannot prove exhaustive source or relationship discovery'
                  : 'Mock scenario is not yet complete; remaining paths are unverified';
          const reasons = [
            '  host-only uncertainty  ',
            'duplicate',
            'duplicate',
            ...(status === 'unknown' ? [measured] : []),
          ];
          const result = await c.builder.prepareScene(
            buildId,
            preparationIdentity(c.root),
            { complete, coverage: { status, reasons } },
            new AbortController().signal,
          );
          assert.equal(result.input.status.complete, complete);
          assert.equal(
            result.input.status.coverage.status,
            boundary === 'provider'
              ? 'provider-truncated'
              : boundary === 'unread'
                ? 'unresolved'
                : status,
          );
          assert.deepEqual(
            result.input.status.coverage.reasons,
            status === 'unknown' ? reasons : [...reasons, measured],
          );
        }
      }
      assert.deepEqual(await c.store.list(), []);
    } finally {
      await c.close();
    }
  }
});

test('T03 coverage rejects unsupported provider claims and server-verifiable false completion without freezing history', async () => {
  for (const boundary of [
    'provider-claim',
    'provider',
    'unread',
    'active',
    'unresolved',
    'missing-source',
  ] as const) {
    const c = await candidate(
      boundary === 'provider'
        ? 'Showing 1 of 2 results'
        : boundary === 'unread'
          ? 'x'.repeat(16001)
          : undefined,
    );
    try {
      const { buildId } = await c.begin();
      const batch = callBatch(buildId, c.evidence.evidenceId);
      if (boundary === 'active') batch.operations.pop();
      if (boundary === 'unresolved') {
        batch.operations[1]!.certainty = 'unresolved';
        batch.operations[1]!.note = 'The final mock behavior is unresolved';
      }
      await c.builder.appendScene(batch);
      if (boundary === 'missing-source') await rm(join(c.root, 'Workflow.any'));
      const completion =
        boundary === 'provider-claim'
          ? {
              complete: false,
              coverage: {
                status: 'provider-truncated' as const,
                reasons: ['claim'],
              },
            }
          : {
              complete: true,
              coverage: { status: 'unknown' as const, reasons: [] },
            };
      await assert.rejects(
        c.builder.prepareScene(
          buildId,
          preparationIdentity(c.root),
          completion,
          new AbortController().signal,
        ),
        /provider|unread|active|invocation|unresolved|source|complete/i,
      );
      assert.equal(
        candidateJournal(c.builder, buildId).count,
        batch.operations.length,
      );
      assert.equal((await c.builder.appendScene(batch)).replayedBatch, true);
      assert.deepEqual(await c.store.list(), []);
    } finally {
      await c.close();
    }
  }
});

test('T03 preparation strictly detaches and validates identity and completion before awaiting', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    await c.builder.appendScene(batch);
    const identity = preparationIdentity(c.root);
    const invalidIdentities = [
      { ...identity, projectRoot: c.root + '/other' },
      { ...identity, target: 'Other.run' },
      { ...identity, producer: 'caller' },
      { ...identity, sourceHash: 'caller-supplied' },
      { ...identity, sessionId: '' },
      { ...identity, revision: null },
    ];
    for (const invalid of invalidIdentities)
      await assert.rejects(
        c.builder.prepareScene(
          buildId,
          invalid as typeof identity,
          partialCompletion,
          new AbortController().signal,
        ),
        /project|target|producer|sourceHash|session|revision|identity|string/i,
      );
    let invoked = 0;
    const accessorIdentity = { ...identity };
    Object.defineProperty(accessorIdentity, 'target', {
      enumerable: true,
      get() {
        invoked++;
        return 'Workflow.run';
      },
    });
    await assert.rejects(
      c.builder.prepareScene(
        buildId,
        accessorIdentity,
        partialCompletion,
        new AbortController().signal,
      ),
      /accessor|data/i,
    );
    const invalidCompletions = [
      { complete: true, coverage: { status: 'complete', reasons: [] } },
      { complete: false, coverage: { status: 'partial', reasons: [7] } },
      { ...partialCompletion, extra: true },
    ];
    for (const invalid of invalidCompletions)
      await assert.rejects(
        c.builder.prepareScene(
          buildId,
          identity,
          invalid as typeof partialCompletion,
          new AbortController().signal,
        ),
        /coverage|status|reason|extra|string/i,
      );
    const accessorCompletion = {
      complete: false,
      coverage: partialCompletion.coverage,
    };
    Object.defineProperty(accessorCompletion, 'coverage', {
      enumerable: true,
      get() {
        invoked++;
        return partialCompletion.coverage;
      },
    });
    await assert.rejects(
      c.builder.prepareScene(
        buildId,
        identity,
        accessorCompletion,
        new AbortController().signal,
      ),
      /accessor|data/i,
    );
    assert.equal(invoked, 0);
    assert.equal((await c.builder.appendScene(batch)).replayedBatch, true);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 first successful preparation retains identity and freezes append history under the authored completion key', async () => {
  const c = await candidate();
  const originalCheck = c.simulation.checkEvidence;
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    await c.builder.appendScene(batch);
    const first = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    c.simulation.checkEvidence = async () => {
      throw new Error('Replay recaptured evidence');
    };
    await rm(join(c.root, 'Workflow.any'));
    const regenerated = {
      ...preparationIdentity(c.root),
      id: 'artifact:new',
      sessionId: '22222222-2222-4222-8222-222222222222',
      revision: 'revision:new',
      createdAt: '2026-11-01T00:00:00.000Z',
    };
    const replay = await c.builder.prepareScene(
      buildId,
      regenerated,
      structuredClone(partialCompletion),
      new AbortController().signal,
    );
    assert.deepEqual(replay, first);
    assert.notEqual(replay, first);
    assert.equal(replay.input.artifact.id, 'artifact:preparation');
    await assert.rejects(
      c.builder.appendScene(batch),
      /prepared|finalized|finish/i,
    );
    await assert.rejects(
      c.builder.appendScene({
        ...batch,
        batchId: 'later',
        expectedEventCount: 2,
      }),
      /prepared|finalized|finish/i,
    );
    await assert.rejects(
      c.builder.prepareScene(
        buildId,
        regenerated,
        {
          ...partialCompletion,
          coverage: { ...partialCompletion.coverage, reasons: ['changed'] },
        },
        new AbortController().signal,
      ),
      /conflict|different|completion/i,
    );
    await assert.rejects(
      c.builder.prepareScene(
        buildId,
        { ...regenerated, target: 'Other.run' },
        partialCompletion,
        new AbortController().signal,
      ),
      /target|identity|binding/i,
    );
    const controller = new AbortController();
    controller.abort(new Error('pre-aborted replay'));
    await assert.rejects(
      c.builder.prepareScene(
        buildId,
        regenerated,
        partialCompletion,
        controller.signal,
      ),
      /pre-aborted replay/,
    );
    assert.deepEqual(
      await c.builder.prepareScene(
        buildId,
        regenerated,
        partialCompletion,
        new AbortController().signal,
      ),
      first,
    );
    assert.equal(candidateJournal(c.builder, buildId).count, 2);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    c.simulation.checkEvidence = originalCheck;
    await c.close();
  }
});

test('T03 prepared consumer Maps and nested JSON cannot mutate the private replay snapshot', async () => {
  const c = await candidate();
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    batch.operations[0]!.inputs = { nested: { list: [1, 2] } };
    await c.builder.appendScene(batch);
    const first = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    const expected = structuredClone(first);
    const active = first.input.activeEdgeIdsByEventId as Map<string, string[]>;
    const returnId = first.input.events[1]!.id;
    active.get(returnId)!.push('consumer edge');
    active.set('consumer', ['edge']);
    active.delete(returnId);
    active.clear();
    (first.input.events[0]!.inputs!.nested as { list: number[] }).list.push(3);
    first.input.sources[0]!.text = 'consumer changed source';
    first.input.graph.nodes[0]!.eventIds.length = 0;
    first.input.graph.nodes[0]!.evidenceIds.push('consumer receipt');
    first.input.scenario.description = 'consumer description';
    first.input.status.coverage.reasons.push('consumer reason');
    const second = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    assert.deepEqual(second, expected);
    assert.notEqual(
      second.input.activeEdgeIdsByEventId,
      first.input.activeEdgeIdsByEventId,
    );
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 capture reads each owned source once and detaches arguments before its await', async () => {
  const c = await candidate();
  const originalRead = fsPromises.readFile;
  let release!: () => void;
  let started!: () => void;
  const captured = new Promise<void>((resolve) => {
    started = resolve;
  });
  const resume = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    const { buildId } = await c.begin();
    await c.builder.appendScene(callBatch(buildId, c.evidence.evidenceId));
    let reads = 0;
    fsPromises.readFile = (async (...args: Parameters<typeof originalRead>) => {
      const result = await originalRead(...args);
      if (args[0] === join(c.root, 'Workflow.any')) {
        reads++;
        if (reads === 1) {
          started();
          await resume;
        }
      }
      return result;
    }) as typeof originalRead;
    syncBuiltinESMExports();
    const identity = preparationIdentity(c.root);
    const completion = structuredClone(partialCompletion);
    const pending = c.builder.prepareScene(
      buildId,
      identity,
      completion,
      new AbortController().signal,
    );
    await Promise.race([
      captured,
      pending.then(() => {
        throw new Error('Capture spy was bypassed');
      }),
    ]);
    identity.id = 'mutated while pending';
    identity.target = 'Other.run';
    completion.coverage.reasons[0] = 'mutated while pending';
    completion.complete = true;
    await writeFile(
      join(c.root, 'Workflow.any'),
      'replacement after captured read\n',
    );
    release();
    const prepared = await pending;
    assert.equal(reads, 1);
    assert.equal(prepared.input.artifact.id, 'artifact:preparation');
    assert.equal(prepared.input.artifact.target, 'Workflow.run');
    assert.equal(prepared.input.sources[0]!.text, 'entry\r\nreturn\n');
    assert.equal(prepared.input.status.complete, false);
    assert.equal(
      prepared.input.status.coverage.reasons[0],
      'Only the declared mock path is supplied',
    );
    const replay = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    assert.equal(reads, 1);
    assert.deepEqual(replay, prepared);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    release();
    fsPromises.readFile = originalRead;
    syncBuiltinESMExports();
    await c.close();
  }
});

test('T03 abort during source capture installs no prepared record and preserves append retry', async () => {
  const c = await candidate();
  const originalRead = fsPromises.readFile;
  try {
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    await c.builder.appendScene(batch);
    const controller = new AbortController();
    let reads = 0;
    fsPromises.readFile = (async (...args: Parameters<typeof originalRead>) => {
      const result = await originalRead(...args);
      if (args[0] === join(c.root, 'Workflow.any')) {
        reads++;
        controller.abort(new Error('abort after source read'));
      }
      return result;
    }) as typeof originalRead;
    syncBuiltinESMExports();
    await assert.rejects(
      c.builder.prepareScene(
        buildId,
        preparationIdentity(c.root),
        partialCompletion,
        controller.signal,
      ),
      /abort after source read/,
    );
    assert.equal(reads, 1);
    fsPromises.readFile = originalRead;
    syncBuiltinESMExports();
    assert.equal((await c.builder.appendScene(batch)).replayedBatch, true);
    const prepared = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    assert.equal(prepared.input.events.length, 2);
    assert.equal(candidateJournal(c.builder, buildId).count, 2);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    fsPromises.readFile = originalRead;
    syncBuiltinESMExports();
    await c.close();
  }
});

test('T03 conflicting group ancestry and call ownership reject before journal acceptance', async () => {
  const c = await candidate();
  try {
    for (const failure of [
      'unknown-group',
      'group-owner',
      'conflicting-node',
    ] as const) {
      const { buildId } = await c.begin();
      const batch = callBatch(buildId, c.evidence.evidenceId);
      if (failure === 'unknown-group')
        batch.nodes[0]!.groupPathKeys = ['absent'];
      if (failure === 'group-owner') {
        batch.nodes[0]!.groupPathKeys = ['owner'];
        batch.groups.push({
          key: 'owner',
          kind: 'sequence',
          label: 'Owner',
          parentGroupKey: null,
          memberNodeKeys: ['start'],
          order: 0,
          callKey: 'other-call',
          taskId: 'other-task',
          source,
          arm: null,
          iteration: null,
          certainty: 'mock',
          evidenceIds: [c.evidence.evidenceId],
        });
      }
      if (failure === 'conflicting-node') {
        await c.builder.appendScene(batch);
        batch.batchId = 'conflict';
        batch.expectedEventCount = 2;
        batch.nodes[0]!.label = 'conflicting declaration';
      }
      await assert.rejects(
        c.builder.appendScene(batch),
        /group|membership|ownership|conflict/i,
      );
      assert.equal(
        candidateJournal(c.builder, buildId).count,
        failure === 'conflicting-node' ? 2 : 0,
      );
    }
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 incomplete preparation rejects uncaptured nonnull graph and generated source references', async () => {
  const c = await candidate();
  try {
    for (const generated of [false, true]) {
      const { buildId } = await c.begin();
      const batch = callBatch(buildId, c.evidence.evidenceId);
      batch.nodes.push({
        ...batch.nodes[0]!,
        key: 'unavailable',
        order: 2,
        evidenceIds: [],
        source: generated
          ? { ...source, generated: { file: 'missing.any', line: 1 } }
          : { file: 'missing.any', line: 1, endLine: 1 },
      });
      await c.builder.appendScene(batch);
      await assert.rejects(
        c.builder.prepareScene(
          buildId,
          preparationIdentity(c.root),
          partialCompletion,
          new AbortController().signal,
        ),
        /captured|source|missing/i,
      );
      assert.equal(candidateJournal(c.builder, buildId).count, 2);
      assert.equal((await c.builder.appendScene(batch)).replayedBatch, true);
    }
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 preparation preserves authored null-source uncertainty and maps captured generated references', async () => {
  const c = await candidate();
  try {
    await writeFile(join(c.root, 'generated.any'), 'display only\n');
    const { buildId } = await c.begin();
    const batch = callBatch(buildId, c.evidence.evidenceId);
    batch.nodes[0]!.source = {
      ...source,
      generated: { file: 'generated.any', line: 1 },
    };
    batch.nodes.push({
      ...batch.nodes[0]!,
      key: 'unlocated',
      order: 2,
      source: null,
      certainty: 'unresolved',
      evidenceIds: [],
      note: 'Host explicitly supplied no source',
    });
    await c.builder.appendScene(batch);
    const prepared = await c.builder.prepareScene(
      buildId,
      preparationIdentity(c.root),
      partialCompletion,
      new AbortController().signal,
    );
    const file = prepared.input.sources.find(
      ({ path }) => path === 'generated.any',
    )!;
    assert.equal(file.text, 'display only\n');
    assert.deepEqual(prepared.input.graph.nodes[0]!.sourceRef!.generated, {
      fileId: file.id,
      line: 1,
    });
    assert.equal(prepared.input.graph.nodes[2]!.sourceRef, null);
    assert.equal(
      prepared.input.graph.nodes[2]!.note,
      'Host explicitly supplied no source',
    );
    assert.equal(prepared.input.graph.nodes.length, 3);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('T03 source digest is stable across builds and changes with exact captured text', async () => {
  const c = await candidate();
  try {
    const hashes: string[] = [];
    for (const iteration of [0, 1, 2]) {
      if (iteration === 2)
        await writeFile(join(c.root, 'Workflow.any'), 'entry\nreturn\n');
      const { buildId } = await c.begin();
      const batch = callBatch(buildId, c.evidence.evidenceId);
      if (iteration === 1) batch.nodes.reverse();
      await c.builder.appendScene(batch);
      const prepared = await c.builder.prepareScene(
        buildId,
        preparationIdentity(c.root),
        partialCompletion,
        new AbortController().signal,
      );
      hashes.push(prepared.input.artifact.sourceHash);
      assert.equal(
        prepared.input.sources[0]!.text,
        iteration === 2 ? 'entry\nreturn\n' : 'entry\r\nreturn\n',
      );
    }
    assert.equal(hashes[0], hashes[1]);
    assert.notEqual(hashes[0], hashes[2]);
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});
