import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMethodGroups,
  groupFunctionInvocations,
} from '../public/flow-overview.js';

test('shared function identities retain multiple callers, loop/branch visits, recursion and distinct values', () => {
  const events = [];
  const enter = (
    callId,
    symbolId,
    parentCallId,
    file = 'main.ts',
    input = callId,
  ) =>
    events.push({
      kind: 'enter',
      callId,
      symbolId,
      parentCallId,
      source: { file, line: events.length + 1 },
      inputs: { input },
      stack: [],
    });
  enter('a', 'A');
  enter('b', 'B');
  enter('c', 'C');
  enter('d-a', 'D', 'a');
  enter('d-b', 'D', 'b');
  enter('d-c', 'D', 'c');
  for (const id of ['loop-1', 'loop-2', 'if', 'else']) enter(id, 'D', 'a');
  enter('recursive', 'D', 'd-a');
  enter('mutual-a', 'A', 'recursive');
  enter('mutual-d', 'D', 'mutual-a');
  enter('class-one', 'One.work', 'a');
  enter('class-two', 'Two.work', 'a');
  enter('other-module', 'D', 'a', 'other.ts');
  const before = structuredClone(events);
  const graph = groupFunctionInvocations(
    buildMethodGroups(events).invocations,
    events,
  );
  const shared = graph.functions.find(
    (item) => item.symbol === 'D' && item.invocations[0].callId === 'd-a',
  );
  assert.equal(shared.invocations.length, 9);
  assert.equal(graph.functions.length, 7);
  assert.equal(graph.relationships.length, events.length - 3);
  assert.equal(
    graph.relationships.filter((edge) => edge.target === shared.id).length,
    9,
  );
  assert.ok(
    graph.relationships.some(
      (edge) => edge.source === shared.id && edge.target === shared.id,
    ),
  );
  assert.notEqual(graph.byCall.get('class-one'), graph.byCall.get('class-two'));
  assert.notEqual(graph.byCall.get('d-a'), graph.byCall.get('other-module'));
  assert.deepEqual(events, before);
  assert.equal(
    new Set(
      shared.invocations.map((item) => events[item.index - 1].inputs.input),
    ).size,
    9,
  );
  const shifted = events.map((event) => ({
    ...event,
    source: { ...event.source, line: event.source.line + 100 },
  }));
  assert.deepEqual(
    groupFunctionInvocations(
      buildMethodGroups(shifted).invocations,
      shifted,
    ).functions.map((item) => item.id),
    graph.functions.map((item) => item.id),
  );
});

test('qualified and unqualified symbols in the same source use one identity', () => {
  const events = [
    {
      kind: 'enter',
      callId: 'first',
      symbolId: 'main.ts:Worker.run',
      source: { file: 'main.ts', line: 2 },
    },
    {
      kind: 'enter',
      callId: 'second',
      symbolId: 'Worker.run',
      source: { file: 'main.ts', line: 8 },
    },
  ];
  const graph = groupFunctionInvocations(
    buildMethodGroups(events).invocations,
    events,
  );
  assert.equal(graph.functions.length, 1);
  assert.equal(graph.functions[0].invocations.length, 2);
});
