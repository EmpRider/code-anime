import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSemanticFlow,
  summarizeVisits,
} from '../public/semantic-flow-model.js';

const source = `function run() {
  for (const item of items) {
    if (item.ok) {
      accept(item);
    } else {
      skip(item);
    }
    try {
      save(item);
    } catch (error) {
      recover(error);
    } finally {
      clean();
    }
  }
  return count;
}`;
const event = (kind, line, extra = {}) => ({
  id: `${kind}-${line}`,
  kind,
  callId: 'run',
  symbolId: 'run',
  label: `${kind} at ${line}`,
  source: { file: 'main.ts', line },
  stack: [],
  certainty: 'mock',
  values: {},
  ...extra,
});
const flow = (events, text = source) => ({
  steps: events.map(() => ({})),
  trace: { events, sourceFiles: { 'main.ts': text } },
});
function leaves(nodes) {
  return nodes.flatMap((node) => {
    const children = [
      ...(node.children ?? []),
      ...(node.branches ?? []).flatMap((b) => b.children),
      ...(node.iterations ?? []).flatMap((i) => i.children),
    ];
    return children.length ? leaves(children) : node.indices;
  });
}

test('visit summaries keep changes paired and distinguish checks from iterations', () => {
  const events = [
    event('loop', 2, { values: { condition: true } }),
    event('mutate', 4, { before: { total: 0 }, after: { total: 4 } }),
    event('mutate', 5, { before: { attempts: 1 }, after: { attempts: 2 } }),
    event('loop', 2, { values: { condition: false }, label: 'Stop check' }),
    event('loop', 2, { label: 'true in prose is not evidence' }),
  ];
  const visits = summarizeVisits(
    {
      iterations: [{ indices: [1, 2, 3] }, { indices: [4] }, { indices: [5] }],
    },
    events,
  );
  assert.equal(visits[0].condition, true);
  assert.deepEqual(
    visits[0].changes.map((change) => [
      change.index,
      change.before,
      change.after,
    ]),
    [
      [2, { total: 0 }, { total: 4 }],
      [3, { attempts: 1 }, { attempts: 2 }],
    ],
  );
  assert.equal(visits[0].lastOperation, events[2].label);
  assert.equal(visits[1].condition, false);
  assert.deepEqual(visits[1].changes, []);
  assert.equal(visits[2].condition, undefined);
  assert.equal(visits[0].before, undefined);
});

test('nested loops, decision visits and recovery preserve every global cursor', () => {
  const events = [
    event('enter', 1, { inputs: { items: [1, 2] } }),
    event('loop', 2),
    event('branch', 3, { values: { condition: true } }),
    event('statement', 4),
    event('statement', 9),
    event('catch', 10),
    event('statement', 11),
    event('statement', 13),
    event('loop', 2),
    event('branch', 3, { values: { condition: false } }),
    event('statement', 6),
    event('return', 16, { result: 2 }),
  ];
  const model = buildSemanticFlow(flow(events));
  const method = model.methods[0];
  assert.deepEqual(method.inputs, { items: [1, 2] });
  assert.equal(method.result, 2);
  assert.equal(model.byEvent.get(12), 'run');
  const loop = method.items.find((n) => n.type === 'loop');
  assert.equal(loop.iterations.length, 2);
  const yes = loop.iterations[0].children.find((n) => n.type === 'decision');
  const no = loop.iterations[1].children.find((n) => n.type === 'decision');
  assert.deepEqual(
    yes.branches.map((b) => b.selected),
    [true, false],
  );
  assert.deepEqual(
    no.branches.map((b) => b.selected),
    [false, true],
  );
  assert.deepEqual(no.branches[1].indices, [11]);
  const recovery = loop.iterations[0].children.find((n) => n.type === 'try');
  assert.deepEqual(
    recovery.branches.map((b) => b.indices),
    [[5], [6, 7], [8]],
  );
  assert.deepEqual(
    leaves(method.items).sort((a, b) => a - b),
    events.map((_, i) => i + 1),
  );
});

test('comments and strings are not structures; unknown truth is not guessed', () => {
  const text = `function run() {
  const text = "if (yes) { no(); }";
  // while (true) { forever(); }
  if (ready) {
    work();
  }
}`;
  const model = buildSemanticFlow(
    flow([event('enter', 1), event('branch', 4), event('statement', 5)], text),
  );
  const decision = model.methods[0].items[1];
  assert.equal(decision.type, 'decision');
  assert.equal(decision.branches[0].selected, undefined);
  assert.match(decision.note, /not supplied/);
});

test('switch lanes preserve fallthrough without evaluating cases', () => {
  const text = `function run() {
  switch (value) {
    case 'a':
      first();
    case 'b':
      second();
      break;
    default:
      other();
  }
}`;
  const model = buildSemanticFlow(
    flow(
      [
        event('enter', 1),
        event('branch', 2),
        event('statement', 4),
        event('statement', 6),
        event('statement', 7),
      ],
      text,
    ),
  );
  const node = model.methods[0].items[1];
  assert.equal(node.type, 'switch');
  assert.deepEqual(
    node.branches.map((b) => b.label),
    ["case 'a':", "case 'b':", 'default:'],
  );
  assert.deepEqual(
    node.branches.map((b) => b.indices),
    [[3], [4, 5], []],
  );
  assert.deepEqual(leaves(model.methods[0].items), [1, 2, 3, 4, 5]);
});

test('partial traces and legacy steps remain inspectable', () => {
  const partial = buildSemanticFlow(
    flow([event('branch', 3), event('return', 16, { result: 0 })], ''),
  );
  assert.deepEqual(partial.methods[0].indices, [1, 2]);
  assert.match(partial.methods[0].items[0].note, /prepared order/);
  const legacy = buildSemanticFlow({
    endpoint: 'legacy',
    steps: [{ from: 'a', dtoName: 'payload', dtoFields: { x: 1 } }],
  });
  assert.equal(legacy.byEvent.get(1), 'a');
  assert.equal(legacy.methods[0].items[0].event.certainty, 'unresolved');
});

test('repeated callees link only through verified call sites', () => {
  const events = [event('enter', 1)];
  for (const callId of ['child-1', 'child-2']) {
    events.push(event('call', 4, { symbolId: 'child' }));
    events.push(
      event('enter', 1, {
        callId,
        symbolId: 'child',
        parentCallId: 'run',
        source: { file: 'child.ts', line: 1 },
      }),
    );
    events.push(
      event('return', 2, {
        callId,
        symbolId: 'child',
        parentCallId: 'run',
        result: 3,
        source: { file: 'child.ts', line: 2 },
      }),
    );
  }
  const model = buildSemanticFlow(flow(events, ''));
  assert.equal(model.methods.length, 3);
  assert.deepEqual(model.roots, ['run']);
  assert.deepEqual(
    model.methods[0].items
      .filter((n) => n.type === 'call')
      .map((n) => n.targetId),
    ['child-1', 'child-2'],
  );
});
