import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFlowOverview } from '../public/flow-overview.js';

function mock(id, kind, symbolId, callId, stack, extra = {}) {
  return {
    id: `event-${id}`,
    kind,
    symbolId,
    callId,
    stack,
    label: `${kind} ${symbolId}`,
    certainty: 'mock',
    ...extra,
  };
}

test('multi-frame mock throws retain source invocation ancestry after the stack unwinds', () => {
  const events = [
    mock(1, 'enter', 'A.main', 'root', ['root']),
    mock(2, 'enter', 'B.work', 'middle', ['root', 'middle']),
    mock(3, 'enter', 'C.fail', 'deep', ['root', 'middle', 'deep']),
    // The prepared post-throw stack has already unwound both inner frames.
    mock(4, 'throw', 'C.fail', 'deep', ['root']),
    mock(5, 'catch', 'A.main', 'root', ['root']),
    mock(6, 'return', 'A.main', 'root', []),
  ];
  const transitions = buildFlowOverview(events);
  assert.equal(
    transitions.find((step) => step.kind === 'throw')?.parent,
    'B.work',
  );
  assert.equal(
    transitions.find((step) => step.kind === 'catch')?.symbol,
    'A.main',
  );
});

test('identically named mock recursion uses invocation ID instead of the unwound stack', () => {
  const events = [
    mock(1, 'enter', 'A.recur', 'outer', ['outer']),
    mock(2, 'enter', 'A.recur', 'middle', ['outer', 'middle']),
    mock(3, 'enter', 'A.recur', 'inner', ['outer', 'middle', 'inner']),
    mock(4, 'throw', 'A.recur', 'inner', []),
  ];
  const transitions = buildFlowOverview(events);
  assert.equal(transitions.at(-1)?.parent, 'A.recur');
  assert.equal(transitions.at(-1)?.depth, 2);
});
