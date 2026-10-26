import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDrilldown } from '../public/diagram-drilldown.js';

const events = [
  ['enter', 'a', 'A.run', null, 1],
  ['assign', 'a', 'A.run', null, 2],
  ['enter', 'b', 'B.work', 'a', 1],
  ['loop', 'b', 'B.work', 'a', 2],
  ['enter', 'c', 'B.work', 'b', 1],
  ['return', 'c', 'B.work', 'b', 3],
  ['loop', 'b', 'B.work', 'a', 2],
  ['return', 'b', 'B.work', 'a', 3],
  ['return', 'a', 'A.run', null, 3],
].map(([kind, callId, symbolId, parentCallId, line], i) => ({
  id: String(i),
  kind,
  callId,
  symbolId,
  parentCallId: parentCallId ?? undefined,
  label: kind,
  source: { file: symbolId[0] + '.ts', line, endLine: line },
  certainty: 'mock',
  stack: [],
}));
const model = createDrilldown(events, { 'B.ts': 'work() {\n  for (;;) {}\n}' });
test('cards preserve global cursors, recursive identity and source lines', () => {
  assert.deepEqual(
    model.classes.map((c) => c.index),
    [1, 3],
  );
  assert.deepEqual(
    model.methods('B').map((c) => c.callId),
    ['b', 'c'],
  );
  assert.deepEqual(
    model.steps('a').map((c) => c.index),
    [1, 2, 3, 9],
  );
  assert.deepEqual(
    model.steps('b').map((c) => [c.kind, c.index]),
    [
      ['step', 3],
      ['step', 4],
      ['method', 5],
      ['step', 7],
      ['step', 8],
    ],
  );
  assert.equal(model.steps('b')[1].code, '  for (;;) {}');
  assert.equal(model.steps('b')[3].code, '  for (;;) {}');
  assert.deepEqual(model.methods('B'), model.methods('B'));
});
test('readable flow hides bookkeeping without losing calls, recursion or evidence gaps', () => {
  const trace = [
    events[0],
    { ...events[1], kind: 'call', label: 'Resolve category' },
    events[2],
    events[3],
    events[4],
    events[5],
    events[6],
    events[7],
    events[8],
  ];
  const readable = createDrilldown(trace);
  assert.deepEqual(
    readable.flowSteps('a').map((card) => [card.kind, card.index]),
    [
      ['method', 3],
      ['step', 9],
    ],
  );
  assert.deepEqual(
    readable.flowSteps('b').map((card) => [card.kind, card.index]),
    [
      ['step', 4],
      ['method', 5],
      ['step', 7],
      ['step', 8],
    ],
  );
  assert.equal(readable.steps('a').length, 4);
  assert.equal(readable.next(1, null), 2);
  assert.equal(readable.previous(3, null), 2);
  const gap = createDrilldown([
    { ...trace[0], certainty: 'unresolved' },
    { ...trace[1], certainty: 'unresolved' },
    { ...trace[2], taskId: 'unrelated' },
  ]);
  assert.deepEqual(
    gap.flowSteps('a').map((card) => card.index),
    [1, 2, 3],
  );
  assert.deepEqual(readable.flowSteps('missing'), []);
});
test('coarse playback is reversible and reaches final event', () => {
  for (const [scope, expected] of [
    [{ kind: 'classes' }, [0, 1, 3, 9]],
    [{ kind: 'class', id: 'B' }, [0, 1, 3, 5, 7, 9]],
    [{ kind: 'method', id: 'a' }, [0, 1, 2, 3, 9]],
    [{ kind: 'method', id: 'b' }, [0, 1, 2, 3, 4, 5, 7, 8, 9]],
  ]) {
    const result = [0];
    while (result.at(-1) < events.length) {
      const next = model.next(result.at(-1), scope);
      assert.ok(next > result.at(-1));
      result.push(next);
    }
    assert.deepEqual(result, expected);
    for (let i = result.length - 1; i > 0; i--)
      assert.equal(model.previous(result[i], scope), result[i - 1]);
  }
  assert.equal(model.next(8, null), 9);
  assert.equal(model.next(9, null), 9);
  assert.equal(model.previous(0, null), 0);
});
test('unrelated interleaved tasks remain visible inside an invocation interval', () => {
  const interleaved = createDrilldown([
    events[0],
    events[2],
    { ...events[1], callId: 'other', symbolId: 'Other.run' },
    events[7],
    events[8],
  ]);
  assert.equal(interleaved.next(2, { kind: 'method', id: 'a' }), 3);
});
test('empty and orphan traces are safe', () => {
  const empty = createDrilldown();
  assert.deepEqual(empty.classes, []);
  assert.equal(empty.next(0, { kind: 'classes' }), 0);
  assert.deepEqual(empty.steps('missing'), []);
  const orphan = createDrilldown([{ ...events[2], parentCallId: 'missing' }]);
  assert.equal(orphan.steps('b')[0].index, 1);
  assert.equal(orphan.contains('b', 'b'), true);
  assert.equal(orphan.contains('b', 'a'), false);
});
test('partial frames and evidence gaps remain inspectable', () => {
  const partial = createDrilldown([
    events[0],
    { ...events[3], certainty: 'unresolved' },
    events[7],
  ]);
  assert.deepEqual(
    partial.steps('b').map((card) => card.index),
    [2, 3],
  );
  assert.equal(partial.steps('a')[1].callId, 'b');
  assert.equal(partial.methods('B')[0].event.kind, 'loop');
  assert.equal(partial.classes[1].certainty, 'unresolved / mock');
  assert.equal(partial.next(1, { kind: 'method', id: 'a' }), 2);
});
