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
function terminalNodes(nodes) {
  return nodes.flatMap((node) => {
    const children = [
      ...(node.children ?? []),
      ...(node.branches ?? []).flatMap((branch) => branch.children),
      ...(node.iterations ?? []).flatMap((visit) => visit.children),
    ];
    return children.length ? terminalNodes(children) : [node];
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

test('groups_multiline_else_if_and_nested_try', () => {
  const text = `function run() {
  if (a) {
    yes();
  }
  else if (b) {
    try {
      risky();
    }
    catch (error) {
      recover();
    }
    finally {
      cleanup();
    }
  }
  else {
    fallback();
  }
  return done;
}`;
  const events = [
    event('enter', 1),
    event('branch', 2, { values: { condition: false } }),
    event('branch', 5, { values: { condition: true } }),
    event('statement', 7),
    event('catch', 9),
    event('statement', 10),
    event('statement', 13),
    event('return', 19),
  ];
  const model = buildSemanticFlow(flow(events, text));
  const method = model.methods[0];
  const outer = method.items.find((node) => node.type === 'decision');
  assert.ok(outer, 'outer if is source-proven');
  assert.equal(
    method.items.filter((node) => node.type === 'decision').length,
    1,
    'else if belongs to the outer false arm, not a sibling scope',
  );
  assert.equal(outer.branches.length, 2, 'binary layout contract');
  const nested = outer.branches[1].children.find(
    (node) => node.type === 'decision',
  );
  assert.ok(nested, 'else if remains an inspectable nested condition');
  assert.equal(nested.branches.length, 2);
  assert.ok(
    nested.branches[0].children.some((node) => node.type === 'try'),
    'nested try stays in the source-proven else-if arm',
  );
  assert.deepEqual(
    leaves(method.items).sort((a, b) => a - b),
    events.map((_, index) => index + 1),
  );
});

test('does_not_invent_unbraced_or_damaged_scope', () => {
  for (const { text, events } of [
    {
      text: 'function run() {\n  if (ready)\n    work();\n}',
      events: [event('branch', 2), event('statement', 3)],
    },
    {
      text: 'function run() {\n  if (ready) {\n    work();',
      events: [event('branch', 2), event('statement', 3)],
    },
    {
      text: 'function run() {\n  /* never closed\n  if (ready) {\n    work();\n  }\n}',
      events: [event('branch', 3), event('statement', 4)],
    },
  ]) {
    const method = buildSemanticFlow(flow(events, text)).methods[0];
    assert.ok(
      method.items.every((node) => node.type !== 'decision'),
      'unbraced/damaged source does not fabricate a decision',
    );
    const unknown = method.items.find((node) => node.indices.includes(1));
    assert.equal(unknown?.type, 'unresolved');
    assert.match(unknown?.note ?? '', /[Uu]nresolved|not proven/);
    assert.deepEqual(leaves(method.items), [1, 2]);
  }
});

test('keeps_repeated_call_and_visit_event_identity', () => {
  const repeated = [
    event('enter', 1, { id: 'duplicate' }),
    event('call', 4, { id: 'same-call', symbolId: 'child' }),
    event('enter', 1, {
      id: 'duplicate',
      callId: 'child-1',
      parentCallId: 'run',
      symbolId: 'child',
      source: { file: 'child.ts', line: 1 },
    }),
    event('return', 2, {
      id: 'same-return',
      callId: 'child-1',
      parentCallId: 'run',
      source: { file: 'child.ts', line: 2 },
    }),
    event('call', 4, { id: 'same-call', symbolId: 'child' }),
    event('enter', 1, {
      id: 'duplicate',
      callId: 'child-2',
      parentCallId: 'run',
      symbolId: 'child',
      source: { file: 'child.ts', line: 1 },
    }),
    event('return', 2, {
      id: 'same-return',
      callId: 'child-2',
      parentCallId: 'run',
      source: { file: 'child.ts', line: 2 },
    }),
  ];
  const initial = buildSemanticFlow(flow(repeated, ''));
  const extended = buildSemanticFlow(
    flow([...repeated, event('return', 9)], ''),
  );
  const byIndex = (model) =>
    new Map(
      model.methods.flatMap((method) =>
        terminalNodes(method.items).map((node) => [node.indices[0], node]),
      ),
    );
  const original = byIndex(initial);
  const appended = byIndex(extended);
  const originalEvidence = [...original.values()].map(
    (node) => node.evidenceIdentity,
  );
  assert.ok(originalEvidence.every(Boolean), 'every event has provenance');
  assert.equal(
    new Set(originalEvidence).size,
    originalEvidence.length,
    'repeated event.id values and same-line calls stay distinct',
  );
  for (const [index, node] of original) {
    const later = appended.get(index);
    assert.equal(node.id, later.id);
    assert.equal(node.evidenceIdentity, later.evidenceIdentity);
  }
  const replacement = [...repeated];
  replacement[1] = { ...replacement[1], id: 'replaced-same-index' };
  const replacedNode = byIndex(buildSemanticFlow(flow(replacement, ''))).get(2);
  assert.equal(
    original.get(2).id,
    replacedNode.id,
    'consumer-compatible node IDs remain index-based; T6 invalidates stale replacement selection',
  );
  assert.notEqual(
    original.get(2).evidenceIdentity,
    replacedNode.evidenceIdentity,
    'changed supplied provenance at the same cursor must not claim identity',
  );
  const run = initial.methods.find((method) => method.id === 'run');
  assert.deepEqual(
    run.items
      .filter((node) => node.type === 'call')
      .map((node) => node.targetId),
    ['child-1', 'child-2'],
  );
  assert.equal(initial.byEvent.get(3), 'child-1');
  assert.equal(initial.byEvent.get(6), 'child-2');

  const loopEvents = [
    event('enter', 1),
    event('loop', 2, { id: 'repeated-loop-event' }),
    event('statement', 3, { id: 'repeated-body-event' }),
    event('loop', 2, { id: 'repeated-loop-event' }),
    event('statement', 3, { id: 'repeated-body-event' }),
  ];
  const loopModel = buildSemanticFlow(
    flow(
      loopEvents,
      'function run() {\n  while (ready) {\n    tick();\n  }\n}',
    ),
  );
  const loop = loopModel.methods[0].items.find((node) => node.type === 'loop');
  assert.equal(loop.iterations.length, 2);
  const visitNodes = loop.iterations.flatMap((visit) =>
    terminalNodes(visit.children),
  );
  const visitIdentity = visitNodes.map((node) => node.evidenceIdentity);
  assert.ok(visitIdentity.every(Boolean));
  assert.equal(new Set(visitIdentity).size, visitIdentity.length);
  assert.deepEqual(
    leaves(loopModel.methods[0].items).sort((a, b) => a - b),
    loopEvents.map((_, index) => index + 1),
  );
});

test('contains_each_prepared_index_exactly_once', () => {
  const events = Array.from({ length: 256 }, (_, i) =>
    event(i % 7 === 0 ? 'loop' : 'statement', i + 1, {
      id: i % 3 ? 'repeated-id' : 'fixed-id',
    }),
  );
  const model = buildSemanticFlow(flow(events, ''));
  assert.deepEqual(
    model.methods
      .flatMap((method) => leaves(method.items))
      .sort((a, b) => a - b),
    events.map((_, i) => i + 1),
  );
  assert.deepEqual(
    [...model.byEvent.keys()].sort((a, b) => a - b),
    events.map((_, i) => i + 1),
  );
});

test('marks_unknown_ownership_at_overview', () => {
  for (const sourceFiles of [
    {},
    { 'main.ts': null },
    { 'main.ts': 42 },
    { 'main.ts': 'function run() {\n if (ready) {\n }\n}' },
  ]) {
    const events = [event('branch', 8), event('loop', 9)];
    const model = buildSemanticFlow({
      trace: { events, sourceFiles },
      steps: events.map(() => ({})),
    });
    const method = model.methods[0];
    assert.deepEqual(leaves(method.items), [1, 2]);
    assert.ok(
      method.items.every((node) => node.type === 'unresolved'),
      'missing or contradictory source cannot justify semantic ownership',
    );
    assert.ok(
      method.items.every((node) =>
        /[Uu]nresolved|not proven/.test(node.note ?? ''),
      ),
    );
  }
  const withoutEventSource = [
    event('branch', 8, { source: undefined }),
    event('loop', 9, { source: null }),
  ];
  const missing = buildSemanticFlow({
    trace: {
      events: withoutEventSource,
      sourceFiles: { 'main.ts': 'function run() {\n if (ready) {}\n}' },
    },
    steps: withoutEventSource.map(() => ({})),
  });
  assert.ok(
    missing.methods[0].items.every((node) => node.type === 'unresolved'),
  );
  assert.deepEqual(leaves(missing.methods[0].items), [1, 2]);
});

test('T1 method named if and misleading regex source are not decisions', () => {
  const cases = [
    [
      'class Matcher {\n  if(flag) {\n    doWork();\n  }\n}',
      [
        event('statement', 2, {
          callId: 'Matcher.if',
          symbolId: 'Matcher.if',
        }),
        event('statement', 3, {
          callId: 'Matcher.if',
          symbolId: 'Matcher.if',
        }),
      ],
    ],
    [
      'function run() {\n  const fake = /if(flag) {notABlock()}/;\n  work();\n}',
      [event('branch', 2), event('statement', 3)],
    ],
  ];
  for (const [text, events] of cases) {
    const method = buildSemanticFlow(flow(events, text)).methods[0];
    assert.ok(method.items.every((node) => node.type !== 'decision'));
    assert.deepEqual(leaves(method.items), [1, 2]);
  }
});

test('T1 shared closing and else-if header never belongs to outer true arm', () => {
  const text = `function run() {
  if (a) {
    yes();
  } else if (b) {
    alternative();
  } else {
    fallback();
  }
  return done;
}`;
  const events = [
    event('enter', 1),
    event('branch', 2, { values: { condition: false } }),
    event('branch', 4),
    event('statement', 5),
    event('return', 9),
  ];
  const model = buildSemanticFlow(flow(events, text));
  const method = model.methods[0];
  const outer = method.items.find((node) => node.type === 'decision');
  assert.ok(outer);
  assert.ok(!outer.branches[0].indices.includes(3));
  assert.ok(!leaves(outer.branches[0].children).includes(3));
  assert.deepEqual(
    leaves(method.items).sort((a, b) => a - b),
    events.map((_, i) => i + 1),
  );
});
