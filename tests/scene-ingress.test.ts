import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSceneAppend } from '../src/services/scene-ingress.js';
import { validateSceneDocument } from '../src/domain/flow-scene.js';

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
