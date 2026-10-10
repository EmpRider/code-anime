import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFlowOverview,
  describeFlowTransition,
} from '../public/flow-overview.js';

test('flow output summaries use complete per-stream ANSI decoding and retain raw events', () => {
  const events = [
    {
      kind: 'console',
      symbolId: 'process:output',
      callId: 'process-output',
      output: 'start\x1b[3',
      values: { stream: 'stdout', attribution: 'unresolved' },
    },
    {
      kind: 'console',
      symbolId: 'process:output',
      callId: 'process-output',
      output: 'stderr',
      values: { stream: 'stderr', attribution: 'unresolved' },
    },
    {
      kind: 'console',
      symbolId: 'process:output',
      callId: 'process-output',
      output: '1mred\x1b[0m',
      values: { stream: 'stdout', attribution: 'unresolved' },
    },
  ];
  const transitions = buildFlowOverview(events);
  assert.deepEqual(transitions.map(describeFlowTransition), [
    'Process stdout (source unresolved): "start"',
    'Process stderr (source unresolved): "stderr"',
    'Process stdout (source unresolved): "red"',
  ]);
  assert.equal(transitions[0].output, 'start\x1b[3');
  assert.equal(transitions[2].output, '1mred\x1b[0m');
});

test('overview follows invocation identities, real inputs, returns and output', () => {
  const events = [
    {
      kind: 'enter',
      callId: 'a-1',
      symbolId: 'A.m',
      stack: ['a-1'],
      inputs: {},
      certainty: 'observed',
    },
    {
      kind: 'statement',
      callId: 'a-1',
      symbolId: 'A.m',
    },
    {
      kind: 'enter',
      callId: 'b-1',
      parentCallId: 'a-1',
      symbolId: 'B.m2',
      stack: ['a-1', 'b-1'],
      inputs: { x: 10, y: 20 },
      certainty: 'observed',
    },
    {
      kind: 'return',
      callId: 'b-1',
      parentCallId: 'a-1',
      symbolId: 'B.m2',
      result: 30,
      certainty: 'observed',
    },
    {
      kind: 'console',
      callId: 'a-1',
      symbolId: 'A.m',
      output: '30',
      source: { file: 'A.ts', line: 5 },
      values: { stream: 'stdout' },
      certainty: 'observed',
    },
    {
      kind: 'console',
      callId: 'a-1',
      symbolId: 'A.m',
      output: '\n',
      source: { file: 'A.ts', line: 5 },
      values: { stream: 'stdout' },
      certainty: 'observed',
    },
  ];
  const transitions = buildFlowOverview(events);
  assert.deepEqual(
    transitions.map((item) => item.index),
    [1, 3, 4, 6],
  );
  assert.deepEqual(transitions.map(describeFlowTransition), [
    'Enter A.m()',
    'A.m → B.m2(x=10, y=20)',
    'B.m2 → 30 → A.m',
    'A.m → output "30\\n"',
  ]);
  assert.equal(transitions[3].certainty, 'observed');
});

test('overview keeps repeated calls and evidence separate, and abbreviates large inputs', () => {
  const events = [
    { kind: 'enter', callId: 'outer', symbolId: 'A.m', stack: ['outer'] },
    {
      kind: 'enter',
      callId: 'one',
      symbolId: 'B.m2',
      stack: ['outer', 'one'],
      parentCallId: 'outer',
      inputs: { items: Array.from({ length: 500 }, (_, i) => i) },
      certainty: 'mock',
    },
    {
      kind: 'return',
      callId: 'one',
      symbolId: 'B.m2',
      parentCallId: 'outer',
      result: null,
      certainty: 'mock',
    },
    {
      kind: 'enter',
      callId: 'two',
      symbolId: 'B.m2',
      stack: ['outer', 'two'],
      parentCallId: 'outer',
      inputs: { x: 2 },
      certainty: 'proposed',
    },
    {
      kind: 'return',
      callId: 'two',
      symbolId: 'B.m2',
      parentCallId: 'outer',
      certainty: 'proposed',
    },
    {
      kind: 'console',
      callId: 'outer',
      symbolId: 'A.m',
      output: 'error',
      values: { stream: 'stderr' },
      certainty: 'observed',
    },
  ];
  const transitions = buildFlowOverview(events);
  assert.equal(transitions.length, 6);
  assert.equal(
    describeFlowTransition(transitions[1]),
    'A.m → B.m2(items=Array(500))',
  );
  assert.equal(describeFlowTransition(transitions[2]), 'B.m2 → null → A.m');
  assert.equal(describeFlowTransition(transitions[4]), 'B.m2 → return → A.m');
  assert.equal(describeFlowTransition(transitions[5]), 'A.m → stderr "error"');
  assert.equal(transitions[3].certainty, 'proposed');
});

test('parent stack fallback accounts for return timing and recursion', () => {
  const transitions = buildFlowOverview([
    { kind: 'enter', callId: 'one', symbolId: 'recur', stack: ['one'] },
    { kind: 'enter', callId: 'two', symbolId: 'recur', stack: ['one', 'two'] },
    {
      kind: 'return',
      callId: 'two',
      symbolId: 'recur',
      stack: ['one', 'two'],
      result: 1,
    },
    { kind: 'return', callId: 'one', symbolId: 'recur', stack: [], result: 2 },
  ]);
  assert.equal(transitions[1].parent, 'recur');
  assert.equal(transitions[2].parent, 'recur');
  assert.equal(transitions[3].parent, undefined);
});

test('stdout from different tasks is not merged even for the same frame', () => {
  const transitions = buildFlowOverview([
    {
      kind: 'console',
      symbolId: 'worker',
      callId: 'shared',
      output: 'A',
      source: { file: 'worker.py', line: 10 },
      values: { stream: 'stdout', taskId: 'first' },
    },
    {
      kind: 'console',
      symbolId: 'worker',
      callId: 'shared',
      output: 'B',
      source: { file: 'worker.py', line: 10 },
      values: { stream: 'stdout', taskId: 'second' },
    },
    {
      kind: 'console',
      symbolId: 'worker',
      callId: 'shared',
      output: '\n',
      source: { file: 'worker.py', line: 10 },
      values: { stream: 'stdout', taskId: 'second' },
    },
  ]);
  assert.equal(transitions.length, 2);
  assert.deepEqual(
    transitions.map((item) => [item.startIndex, item.index, item.output]),
    [
      [1, 1, 'A'],
      [2, 3, 'B\n'],
    ],
  );
});

test('paired calls use one transition active from the original caller call-site', () => {
  const transitions = buildFlowOverview([
    { kind: 'enter', symbolId: 'A.m', callId: 'a', stack: ['a'] },
    {
      kind: 'call',
      symbolId: 'A.m',
      callId: 'a',
      stack: ['a'],
      inputs: { x: 10 },
    },
    {
      kind: 'enter',
      symbolId: 'B.m2',
      callId: 'b',
      stack: ['a', 'b'],
      inputs: { x: 10 },
    },
    {
      kind: 'return',
      symbolId: 'B.m2',
      callId: 'b',
      stack: ['a'],
      result: 10,
    },
  ]);
  assert.deepEqual(
    transitions.map((item) => item.depth),
    [0, 1, 1],
  );
  assert.deepEqual(
    transitions.map((item) => [item.startIndex, item.index]),
    [
      [1, 1],
      [2, 3],
      [4, 4],
    ],
  );
  assert.equal(describeFlowTransition(transitions[1]), 'A.m → B.m2(x=10)');
  assert.equal(describeFlowTransition(transitions[2]), 'B.m2 → 10 → A.m');
});

test('interleaved async tasks cannot lend an unrelated callee to a caller event', () => {
  const transitions = buildFlowOverview([
    {
      kind: 'enter',
      symbolId: 'A.m',
      callId: 'a',
      stack: ['a'],
      values: { task: 'main', thread: 'main' },
    },
    {
      kind: 'call',
      symbolId: 'A.m',
      callId: 'a',
      stack: ['a'],
      values: { task: 'task-1', thread: 'main' },
    },
    {
      kind: 'enter',
      symbolId: 'B.other',
      callId: 'b',
      parentCallId: 'a',
      stack: ['a', 'b'],
      values: { task: 'task-2', thread: 'main' },
    },
    {
      kind: 'call',
      symbolId: 'A.m',
      callId: 'a',
      stack: ['a'],
      values: { task: 'task-2', thread: 'main' },
    },
    {
      kind: 'enter',
      symbolId: 'B.actual',
      callId: 'c',
      parentCallId: 'a',
      stack: ['a', 'c'],
      values: { task: 'task-2', thread: 'main' },
    },
    {
      kind: 'return',
      symbolId: 'B.actual',
      callId: 'c',
      stack: [],
      result: 42,
      values: { task: 'task-2', thread: 'main' },
    },
  ]);
  assert.equal(transitions[1].target, undefined);
  assert.equal(describeFlowTransition(transitions[1]), 'Call A.m()');
  assert.equal(transitions[3].symbol, 'B.actual');
  assert.equal(transitions[3].startIndex, 4);
  assert.equal(transitions[3].index, 5);
  assert.equal(transitions[4].parent, 'A.m');
  assert.equal(transitions[4].depth, 1);
});

test('console writes from different recorded Python tasks remain separate', () => {
  const transitions = buildFlowOverview([
    {
      kind: 'console',
      callId: 'shared',
      symbolId: 'run',
      output: 'A',
      source: { file: 'worker.py', line: 20 },
      values: { stream: 'stdout', task: 'task-1', thread: 'main' },
    },
    {
      kind: 'console',
      callId: 'shared',
      symbolId: 'run',
      output: 'B',
      source: { file: 'worker.py', line: 20 },
      values: { stream: 'stdout', task: 'task-2', thread: 'main' },
    },
    {
      kind: 'console',
      callId: 'shared',
      symbolId: 'run',
      output: '\n',
      source: { file: 'worker.py', line: 20 },
      values: { stream: 'stdout', task: 'task-2', thread: 'main' },
    },
  ]);
  assert.deepEqual(
    transitions.map((item) => item.output),
    ['A', 'B\n'],
  );
});

test('each console statement stays independently navigable in the overview', () => {
  const events = [
    ['first', 10],
    ['second', 11],
    ['third\n', 12],
    ['fourth', 12],
    ['no location', undefined],
  ].map(([output, line]) => ({
    kind: 'console',
    callId: 'main',
    symbolId: 'main',
    output,
    values: { task: 'main', stream: 'stdout' },
    ...(line && { source: { file: 'main.py', line } }),
  }));
  const transitions = buildFlowOverview(events);
  assert.deepEqual(
    transitions.map((item) => item.output),
    events.map((event) => event.output),
  );
  assert.deepEqual(
    transitions.map((item) => item.index),
    [1, 2, 3, 4, 5],
  );
});

test('unattributed Node output stays independent of user invocations and is labeled as unresolved', () => {
  const events = [
    {
      kind: 'enter',
      callId: 'user-1',
      symbolId: 'A.run',
      stack: ['user-1'],
      certainty: 'observed',
    },
    ...['stdout', 'stderr'].map((stream) => ({
      kind: 'console',
      callId: 'process-output',
      symbolId: 'process:output',
      label: `process ${stream}`,
      output: stream === 'stdout' ? 'FIRST' : 'ERR',
      values: { stream, task: 'process-output', attribution: 'unresolved' },
      stack: [],
      certainty: 'observed',
    })),
    {
      kind: 'return',
      callId: 'user-1',
      symbolId: 'A.run',
      stack: [],
      certainty: 'observed',
    },
  ];
  const transitions = buildFlowOverview(events);
  assert.deepEqual(
    transitions.map((item) => item.index),
    [1, 2, 3, 4],
  );
  assert.deepEqual(transitions.slice(1, 3).map(describeFlowTransition), [
    'Process stdout (source unresolved): "FIRST"',
    'Process stderr (source unresolved): "ERR"',
  ]);
  assert.ok(
    transitions
      .slice(1, 3)
      .every(
        (item) =>
          item.source === undefined &&
          item.parent === undefined &&
          item.certainty === 'observed',
      ),
  );
});
