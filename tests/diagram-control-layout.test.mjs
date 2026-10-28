import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSemanticFlow } from '../public/semantic-flow-model.js';
import { layoutControlFlow } from '../public/diagram-control-layout.js';
import * as topology from '../public/diagram-control-layout.js';

const topologyEvent = (kind, line, i, extras = {}) => ({
  id: `e-${i}`,
  kind,
  source: { file: 'fixture.ts', line },
  callId: 'run',
  symbolId: 'run',
  label: `${kind} ${i}`,
  values: {},
  stack: [],
  certainty: 'mock',
  ...extras,
});
function methodItems(source, specs) {
  const events = specs.map(([kind, line, extras], i) =>
    topologyEvent(kind, line, i, extras),
  );
  return buildSemanticFlow({
    trace: { events, sourceFiles: { 'fixture.ts': source } },
  }).methods[0].items;
}
const cardAt = (prepared, index) =>
  prepared.cards.find((card) => card.index === index);
const edgeAt = (prepared, source, target) =>
  prepared.edges.find(
    (edge) =>
      edge.source === cardAt(prepared, source)?.id &&
      edge.target === cardAt(prepared, target)?.id,
  );

test('loop_header_is_member_of_selected_iteration_region', () => {
  const source =
    'function run() {\n while (more) {\n  tick();\n }\n return done;\n}';
  const events = [
    ['enter', 1],
    ['loop', 2],
    ['statement', 3],
    ['loop', 2],
    ['statement', 3],
    ['return', 5],
  ].map(([kind, line], i) => ({
    id: `event-${i}`,
    kind,
    source: { file: 'loop.ts', line },
    callId: 'run',
    symbolId: 'run',
    label: kind,
    values: {},
    stack: [],
    certainty: 'mock',
  }));
  const method = buildSemanticFlow({
    trace: { events, sourceFiles: { 'loop.ts': source } },
  }).methods[0];
  assert.equal(typeof topology.prepareControlFlow, 'function');
  const loop = method.items.find((node) => node.type === 'loop');
  const prepared = topology.prepareControlFlow(method.items, {
    cursor: 5,
    visits: new Map([[loop.id, 1]]),
  });
  const selected = prepared.regions.find(
    (region) => region.type === 'loop' && region.selected,
  );
  assert.ok(selected, 'second prepared loop visit owns a frame');
  assert.equal(
    prepared.cards.find((card) => card.index === 4).parentRegionId,
    selected.id,
    'loop header must be inside its visit, not above the region',
  );
  assert.deepEqual(
    prepared.cards.map((card) => card.index).sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6],
  );
});

test('branch_arms_have_true_parent', () => {
  const source = `function run() {
  while (ready) {
    if (ok) {
      yes();
    } else {
      no();
    }
  }
  return done;
}`;
  const nodes = methodItems(source, [
    ['enter', 1],
    ['loop', 2],
    ['branch', 3, { values: { condition: true } }],
    ['statement', 4],
    ['return', 9],
  ]);
  const prepared = topology.prepareControlFlow(nodes);
  const loop = prepared.regions.find((region) => region.type === 'loop');
  const decision = prepared.regions.find(
    (region) => region.type === 'decision',
  );
  const arms = prepared.regions.filter((region) => region.type === 'branch');
  assert.ok(loop && decision);
  assert.equal(decision.parentRegionId, loop.id);
  assert.equal(arms.length, 2);
  assert.ok(arms.every((region) => region.parentRegionId === decision.id));
  assert.equal(cardAt(prepared, 4).parentRegionId, arms[0].id);
  assert.equal(edgeAt(prepared, 3, 4)?.status, 'prepared');
  const parents = new Map(
    prepared.regions.map((region) => [region.id, region.parentRegionId]),
  );
  for (const region of prepared.regions) {
    const seen = new Set();
    for (let at = region.id; at; at = parents.get(at)) {
      assert.ok(!seen.has(at), 'region ancestry must be acyclic');
      seen.add(at);
    }
  }
});

test('normal_try_skips_unexecuted_catch', () => {
  const source = `function run() {
  try {
    work();
  } catch (error) {
    recover();
  } finally {
    cleanup();
  }
  return done;
}`;
  const prepared = topology.prepareControlFlow(
    methodItems(source, [
      ['enter', 1],
      ['statement', 3],
      ['statement', 7],
      ['return', 9],
    ]),
  );
  assert.deepEqual(
    prepared.cards.map((card) => card.index),
    [1, 2, 3, 4],
  );
  assert.equal(edgeAt(prepared, 2, 3)?.status, 'prepared');
  assert.equal(edgeAt(prepared, 2, 3)?.kind, 'finally');
  assert.ok(!prepared.cards.some((card) => card.node.event?.kind === 'catch'));
  assert.ok(
    !prepared.edges.some(
      (edge) => !prepared.cards.some((card) => card.id === edge.target),
    ),
  );
});

test('prepared_exception_visits_catch_and_finally', () => {
  const source = `function run() {
  try {
    risky();
  } catch (error) {
    recover(error);
  } finally {
    cleanup();
  }
  return done;
}`;
  const prepared = topology.prepareControlFlow(
    methodItems(source, [
      ['enter', 1],
      ['statement', 3],
      ['catch', 4],
      ['statement', 5],
      ['statement', 7],
      ['return', 9],
    ]),
  );
  assert.equal(edgeAt(prepared, 2, 3)?.status, 'prepared');
  assert.equal(edgeAt(prepared, 2, 3)?.kind, 'catch');
  assert.equal(edgeAt(prepared, 4, 5)?.kind, 'finally');
  const catchRegion = prepared.regions.find((region) =>
    region.label?.startsWith('Catch'),
  );
  assert.ok(catchRegion);
  assert.equal(cardAt(prepared, 3).parentRegionId, catchRegion.id);
  assert.deepEqual(
    prepared.cards.map((card) => card.index),
    [1, 2, 3, 4, 5, 6],
  );
});

test('next_iteration_loopback_requires_evidence', () => {
  const source = `function run() {
  while (ready) {
    tick();
  }
  return done;
}`;
  const repeated = topology.prepareControlFlow(
    methodItems(source, [
      ['enter', 1],
      ['loop', 2],
      ['statement', 3],
      ['loop', 2],
      ['statement', 3],
      ['return', 5],
    ]),
  );
  assert.equal(edgeAt(repeated, 3, 4)?.kind, 'loopback');
  assert.equal(edgeAt(repeated, 3, 4)?.status, 'prepared');
  const once = topology.prepareControlFlow(
    methodItems(source, [
      ['enter', 1],
      ['loop', 2],
      ['statement', 3],
      ['return', 5],
    ]),
  );
  assert.ok(!once.edges.some((edge) => edge.kind === 'loopback'));
});

test('return_or_throw_terminates_loopback', () => {
  const source = `function run() {
  while (ready) {
    work();
  }
  return done;
}`;
  for (const terminal of ['return', 'throw']) {
    const prepared = topology.prepareControlFlow(
      methodItems(source, [
        ['enter', 1],
        ['loop', 2],
        [terminal, 3],
        ['loop', 2],
        ['statement', 3],
      ]),
    );
    assert.equal(
      edgeAt(prepared, 3, 4),
      undefined,
      `${terminal} must not invent another prepared loop visit`,
    );
    assert.ok(!prepared.edges.some((edge) => edge.kind === 'loopback'));
    assert.deepEqual(
      prepared.cards.map((card) => card.index),
      [1, 2, 3, 4, 5],
      'even contradictory later prepared events stay inspectable',
    );
  }
});

test('repeated_source_lines_keep_distinct_invocation_edges', () => {
  const source = 'function run() {\n  ping(); ping();\n  return ok;\n}';
  const nodes = methodItems(source, [
    ['enter', 1, { id: 'duplicated' }],
    ['call', 2, { id: 'same-event' }],
    ['call', 2, { id: 'same-event' }],
    ['return', 3, { id: 'duplicated' }],
  ]);
  const a = topology.prepareControlFlow(nodes, {
    methodCallId: 'invocation-a',
    cursor: 1,
  });
  const b = topology.prepareControlFlow(nodes, {
    methodCallId: 'invocation-b',
    cursor: 4,
  });
  assert.deepEqual(
    a.cards.map((card) => card.index),
    [1, 2, 3, 4],
  );
  assert.equal(new Set(a.cards.map((card) => card.id)).size, 4);
  assert.equal(new Set(a.edges.map((edge) => edge.id)).size, a.edges.length);
  assert.ok(a.cards.every((card) => card.id.startsWith('invocation-a:')));
  assert.ok(b.cards.every((card) => card.id.startsWith('invocation-b:')));
  assert.notEqual(a.topologyKey, b.topologyKey, 'invocations do not alias');
  assert.equal(edgeAt(a, 2, 3)?.status, 'prepared');
  assert.equal(cardAt(a, 2).evidenceIdentity, nodes[1].evidenceIdentity);
  assert.equal(cardAt(a, 3).evidenceIdentity, nodes[2].evidenceIdentity);
  assert.equal(
    topology.prepareControlFlow(nodes, {
      methodCallId: 'invocation-a',
      cursor: 4,
    }).topologyKey,
    a.topologyKey,
    'cursor-only highlighting does not invalidate topology',
  );
});

test('all_events_and_unknown_paths_preserved', () => {
  const nodes = methodItems(
    'function run() {\n  if (ok) work();\n  after();\n}',
    [
      ['enter', 1],
      ['branch', 2],
      ['statement', 3],
      ['return', 3],
    ],
  );
  const snapshot = JSON.stringify(nodes);
  const prepared = topology.prepareControlFlow(nodes);
  assert.deepEqual(
    prepared.cards.map((card) => card.index),
    [1, 2, 3, 4],
  );
  assert.equal(new Set(prepared.cards.map((card) => card.id)).size, 4);
  assert.equal(
    JSON.stringify(nodes),
    snapshot,
    'translator cannot mutate input',
  );
  assert.ok(prepared.cards.every((card) => !card.placeholder));
  const ids = new Set(prepared.cards.map((card) => card.id));
  assert.ok(
    prepared.edges.every(
      (edge) => ids.has(edge.source) && ids.has(edge.target),
    ),
  );
  assert.ok(
    prepared.edges.every((edge) => typeof edge.id === 'string' && edge.id),
  );
  assert.equal(cardAt(prepared, 2).node.ownershipStatus, 'unresolved');
  assert.equal(edgeAt(prepared, 2, 3)?.status, 'unknown');
});

test('unproven_source_uses_neutral_lane_and_unknown_edge_status', () => {
  const nodes = methodItems('', [
    ['branch', 8, { certainty: 'unresolved' }],
    ['statement', 9, { certainty: 'unresolved', source: undefined }],
  ]);
  const prepared = topology.prepareControlFlow(nodes);
  const lane = prepared.regions.find((region) => region.type === 'unresolved');
  assert.ok(lane, 'unproven events remain in a neutral unresolved lane');
  assert.equal(cardAt(prepared, 1).parentRegionId, lane.id);
  assert.equal(cardAt(prepared, 2).parentRegionId, lane.id);
  assert.equal(edgeAt(prepared, 1, 2)?.status, 'unknown');
  assert.ok(!prepared.edges.some((edge) => edge.status === 'prepared'));
});

test('source_proven_empty_false_arm_exposes_typed_candidate_not_fabricated_step', () => {
  const source = `function run() {
  if (ok) {
    work();
  }
  after();
}`;
  for (const [condition, expected] of [
    [true, 'not-selected'],
    [undefined, 'possible'],
  ]) {
    const nodes = methodItems(source, [
      ['branch', 2, condition === undefined ? {} : { values: { condition } }],
      ['statement', 3],
      ['statement', 5],
    ]);
    const prepared = topology.prepareControlFlow(nodes);
    const bypass = edgeAt(prepared, 1, 3);
    assert.equal(bypass?.status, expected);
    assert.equal(bypass?.kind, 'branch');
    assert.match(bypass?.label ?? '', /No/);
    assert.deepEqual(
      prepared.cards.map((card) => card.index),
      [1, 2, 3],
    );
    assert.ok(prepared.cards.every((card) => !card.placeholder));
  }
});

test('unresolved_mock_outcome_never_claims_prepared_decision_transition', () => {
  const source = `function run() {
  if (ready) {
    work();
  }
  return done;
}`;
  const prepared = topology.prepareControlFlow(
    methodItems(source, [
      ['branch', 2, { certainty: 'unresolved', values: { condition: true } }],
      ['statement', 3],
      ['return', 5],
    ]),
  );
  assert.equal(cardAt(prepared, 1).unresolved, true);
  assert.equal(edgeAt(prepared, 1, 2)?.status, 'unknown');
  assert.ok(
    !prepared.edges.some(
      (edge) =>
        edge.status === 'prepared' && edge.source === cardAt(prepared, 1).id,
    ),
  );
});

test('return_in_prepared_try_keeps_evidenced_finally_cleanup_without_loopback', () => {
  const source = `function run() {
  try {
    return done;
  } finally {
    cleanup();
  }
}`;
  const prepared = topology.prepareControlFlow(
    methodItems(source, [
      ['return', 3],
      ['statement', 5],
    ]),
  );
  assert.equal(edgeAt(prepared, 1, 2)?.kind, 'finally');
  assert.equal(edgeAt(prepared, 1, 2)?.status, 'prepared');
  assert.ok(!prepared.edges.some((edge) => edge.kind === 'loopback'));
});

test('terminal_through_finally_does_not_prepare_a_later_sibling', () => {
  for (const terminal of ['return', 'throw']) {
    const source = `function run() {
  try {
    ${terminal === 'return' ? 'return value;' : 'throw error;'}
  } finally {
    cleanup();
  }
  after();
}`;
    const prepared = topology.prepareControlFlow(
      methodItems(source, [
        [terminal, 3],
        ['statement', 5],
        ['statement', 7],
      ]),
    );
    assert.equal(edgeAt(prepared, 1, 2)?.kind, 'finally');
    assert.equal(edgeAt(prepared, 1, 2)?.status, 'prepared');
    assert.deepEqual(
      prepared.cards.map((card) => card.index),
      [1, 2, 3],
      'contradictory later prepared event remains inspectable',
    );
    assert.ok(
      !prepared.edges.some(
        (edge) =>
          edge.source === cardAt(prepared, 2).id &&
          edge.target === cardAt(prepared, 3).id &&
          edge.status === 'prepared',
      ),
      `${terminal} cannot become a normal prepared continuation after cleanup`,
    );
  }
});

test('caught_throw_can_resume_after_prepared_catch_and_finally', () => {
  const source = `function run() {
  try {
    throw error;
  } catch (error) {
    recover();
  } finally {
    cleanup();
  }
  after();
}`;
  const prepared = topology.prepareControlFlow(
    methodItems(source, [
      ['throw', 3],
      ['catch', 4],
      ['statement', 5],
      ['statement', 7],
      ['statement', 9],
    ]),
  );
  assert.equal(edgeAt(prepared, 1, 2)?.kind, 'catch');
  assert.equal(edgeAt(prepared, 1, 2)?.status, 'prepared');
  assert.equal(edgeAt(prepared, 4, 5)?.status, 'prepared');
});

test('structural_explicit_visit_selection_changes_topology_key_but_cursor_styling_does_not', () => {
  const source = `function run() {
  while (ready) {
    tick();
  }
  return done;
}`;
  const nodes = methodItems(source, [
    ['enter', 1],
    ['loop', 2],
    ['statement', 3],
    ['loop', 2],
    ['statement', 3],
    ['return', 5],
  ]);
  const loopId = nodes.find((node) => node.type === 'loop').id;
  const options = (visit, cursor) => ({
    cursor,
    visits: new Map([[loopId, visit]]),
  });
  const first = topology.prepareControlFlow(nodes, options(0, 0));
  const second = topology.prepareControlFlow(nodes, options(1, 0));
  assert.equal(
    first.regions.filter((region) => region.type === 'loop' && region.selected)
      .length,
    1,
  );
  assert.equal(
    second.regions.filter((region) => region.type === 'loop' && region.selected)
      .length,
    1,
  );
  assert.notEqual(first.topologyKey, second.topologyKey);
  assert.equal(
    topology.prepareControlFlow(nodes, options(0, 1)).topologyKey,
    first.topologyKey,
    'cursor-only highlight within the same selected structure is stable',
  );
  assert.equal(
    topology.prepareControlFlow(nodes, options(0, 4)).topologyKey,
    topology.prepareControlFlow(nodes, options(0, 2)).topologyKey,
    'seeking across prepared events does not change explicitly selected geometry',
  );
});

test('mutually_exclusive_decision_arms_never_create_prepared_cross_arm_edge', () => {
  const source = `function run() {
  if (ready) {
    yes();
  } else {
    no();
  }
  return done;
}`;
  const prepared = topology.prepareControlFlow(
    methodItems(source, [
      ['branch', 2],
      ['statement', 3],
      ['statement', 5],
      ['return', 7],
    ]),
  );
  assert.deepEqual(
    prepared.cards.map((card) => card.index),
    [1, 2, 3, 4],
  );
  assert.equal(edgeAt(prepared, 2, 3)?.status, 'unknown');
  assert.ok(
    !prepared.edges.some(
      (edge) =>
        edge.source === cardAt(prepared, 2).id &&
        edge.target === cardAt(prepared, 3).id &&
        edge.status === 'prepared',
    ),
  );
});

test('horizontal layout wraps within the viewport without losing steps or groups', () => {
  const leaf = (id) => ({
    id,
    type: 'step',
    indices: [Number(id)],
    event: { kind: 'statement', label: 'Prepared step' },
  });
  const nodes = [
    leaf('1'),
    {
      id: 'loop',
      type: 'loop',
      title: 'Loop',
      indices: [2, 3, 4, 5, 6, 7],
      iterations: [
        {
          indices: [2, 3, 4, 5, 6, 7],
          children: Array.from({ length: 6 }, (_, i) => leaf(String(i + 2))),
        },
      ],
    },
    leaf('8'),
  ];
  const wide = layoutControlFlow(nodes, {
    direction: 'horizontal',
    maxWidth: 960,
  });
  const narrow = layoutControlFlow(nodes, {
    direction: 'horizontal',
    maxWidth: 620,
    extraHeight: (id) => (id === '4' ? 160 : 0),
  });
  for (const [layout, width] of [
    [wide, 960],
    [narrow, 620],
  ]) {
    assert.ok(layout.width <= width, 'layout respects available width');
    assert.ok(
      new Set(layout.cards.map((card) => card.y)).size > 1,
      'steps use multiple rows',
    );
    for (const a of layout.cards) {
      for (const b of layout.cards) {
        if (a === b) continue;
        assert.ok(
          a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y,
          'cards do not overlap',
        );
      }
    }
    const region = layout.regions.find((item) => item.type === 'loop');
    for (const card of layout.cards.filter(
      (item) => Number(item.id) >= 2 && Number(item.id) <= 7,
    )) {
      assert.ok(
        card.x >= region.x && card.x + card.width <= region.x + region.width,
      );
      assert.ok(
        card.y >= region.y + 24 &&
          card.y + card.height <= region.y + region.height,
      );
    }
    assert.equal(layout.cards.length, 9);
    assert.equal(layout.edges.length, 8);
  }
  assert.deepEqual(
    narrow.cards.map((card) => card.id),
    wide.cards.map((card) => card.id),
  );
});

test('wrapped nested scopes retain containment and expanded value clearance', () => {
  const leaf = (id) => ({
    id,
    type: 'step',
    indices: [Number(id)],
    event: { kind: 'statement' },
  });
  const nested = {
    id: 'nested',
    type: 'loop',
    title: 'Inner loop',
    indices: [3, 4],
    iterations: [{ indices: [3, 4], children: [leaf('3'), leaf('4')] }],
  };
  const outer = {
    id: 'outer',
    type: 'loop',
    title: 'Outer loop',
    indices: [2, 3, 4, 5],
    iterations: [
      { indices: [2, 3, 4, 5], children: [leaf('2'), nested, leaf('5')] },
    ],
  };
  const layout = layoutControlFlow([leaf('1'), outer, leaf('6')], {
    direction: 'horizontal',
    maxWidth: 720,
    extraHeight: (id) => (id === '3' ? 180 : 0),
  });
  for (const [id, members] of [
    ['outer-rail', ['2', 'nested', '3', '4', '5']],
    ['nested-rail', ['3', '4']],
  ]) {
    const region = layout.regions.find((item) => item.id === id);
    for (const member of members) {
      const card = layout.cards.find((item) => item.id === member);
      assert.ok(
        card.x >= region.x + 12 &&
          card.x + card.width <= region.x + region.width - 12,
      );
      assert.ok(
        card.y >= region.y + 28 &&
          card.y + card.height <= region.y + region.height - 12,
      );
    }
  }
  for (const a of layout.cards)
    for (const b of layout.cards) {
      if (a === b) continue;
      assert.ok(
        a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y,
      );
    }
  assert.ok(layout.width <= 720);
});

test('horizontal wrapping favors landscape proportions on narrow viewports', () => {
  const nodes = Array.from({ length: 20 }, (_, i) => ({
    id: String(i),
    type: 'step',
    indices: [i + 1],
    event: { kind: 'statement', label: 'Prepared step' },
  }));
  const layout = layoutControlFlow(nodes, {
    direction: 'horizontal',
    maxWidth: 620,
    targetAspectRatio: 1.8,
  });
  assert.ok(
    layout.width / layout.height >= 1.6,
    'horizontal layout must remain wider than tall',
  );
  const rows = new Set(layout.cards.map((card) => card.y));
  assert.ok(
    rows.size > 1 && rows.size < 6,
    'wrap into a few rows, not a narrow column or one giant row',
  );
  assert.equal(layout.cards.length, 20);
  assert.equal(layout.edges.length, 19);
});

test('recovery lanes preserve order and expanded values reserve space', () => {
  const leaf = (id, kind = 'statement') => ({
    id,
    type: 'step',
    indices: [Number(id)],
    event: { kind },
  });
  const nodes = [
    {
      id: 'try',
      type: 'try',
      indices: [1, 2, 3, 4],
      event: { kind: 'statement' },
      children: [leaf('1')],
      branches: [
        { label: 'Try', children: [leaf('2')], indices: [2] },
        { label: 'Catch', children: [leaf('3', 'catch')], indices: [3] },
        { label: 'Finally', children: [leaf('4')], indices: [4] },
      ],
    },
  ];
  const layout = layoutControlFlow(nodes, {
    extraHeight: (id) => (id === '2' ? 160 : 0),
  });
  assert.equal(layout.regions.length, 3);
  assert.equal(new Set(layout.regions.map((region) => region.x)).size, 1);
  for (let i = 1; i < layout.regions.length; i++) {
    const previous = layout.regions[i - 1];
    assert.ok(layout.regions[i].y > previous.y + previous.height);
  }
  for (const edge of layout.edges) {
    const source = layout.cards.find((card) => card.id === edge.source);
    const target = layout.cards.find((card) => card.id === edge.target);
    assert.ok(target.y > source.y + source.height, 'recovery arrows flow down');
  }
  assert.ok(
    layout.edges.some((edge) => edge.source === '2' && edge.target === '3'),
  );
  assert.ok(
    layout.edges.some((edge) => edge.source === '3' && edge.target === '4'),
  );
  const collapsed = layoutControlFlow(nodes);
  assert.equal(
    layout.cards.find((card) => card.id === '2').height -
      collapsed.cards.find((card) => card.id === '2').height,
    160,
  );
  assert.ok(
    collapsed.cards.find((card) => card.id === '2').height <= 120,
    'ordinary steps do not reserve empty control-card space',
  );
  for (const region of layout.regions) {
    const enclosed = layout.cards.filter(
      (card) =>
        card.y >= region.y && card.y + card.height <= region.y + region.height,
    );
    assert.ok(enclosed.length);
    assert.ok(
      enclosed.every(
        (card) =>
          card.x >= region.x + 12 &&
          card.x + card.width <= region.x + region.width - 12,
      ),
      'group outlines have an inset around their content',
    );
  }
});

test('graph controls split decision lanes and retain selectable loop visits', () => {
  const source =
    'function run() {\n for (const x of xs) {\n  if (x.ok) {\n   accept();\n  } else {\n   skip();\n  }\n }\n return count;\n}';
  const events = [
    ['enter', 1],
    ['loop', 2],
    ['branch', 3, true],
    ['statement', 4],
    ['loop', 2],
    ['branch', 3, false],
    ['statement', 6],
    ['return', 9],
  ].map(([kind, line, condition], i) => ({
    id: String(i),
    kind,
    source: { file: 'test.ts', line },
    callId: 'run',
    symbolId: 'run',
    label: kind,
    values: typeof condition === 'boolean' ? { condition } : {},
    stack: [],
    certainty: 'mock',
  }));
  const flow = {
    steps: events.map(() => ({})),
    trace: { events, sourceFiles: { 'test.ts': source } },
  };
  const method = buildSemanticFlow(flow).methods[0];
  const first = layoutControlFlow(method.items);
  assert.equal(first.cards.filter((card) => card.control === 'loop').length, 1);
  assert.equal(
    first.cards.filter((card) => card.control === 'decision').length,
    1,
  );
  assert.ok(
    first.edges.some((edge) => edge.kind === 'branch' && edge.label === 'True'),
  );
  const second = layoutControlFlow(method.items, { cursor: 6 });
  assert.equal(second.cards.find((card) => card.control === 'loop').visit, 1);
  assert.ok(
    second.edges.some(
      (edge) => edge.kind === 'branch' && edge.label === 'False',
    ),
  );
  assert.ok(second.cards.some((card) => card.node.indices.includes(7)));
  assert.ok(!second.cards.some((card) => card.node.id === 'event-4'));
  assert.equal(
    new Set(second.cards.map((card) => card.id)).size,
    second.cards.length,
  );
  for (const edge of second.edges) {
    assert.ok(second.cards.some((card) => card.id === edge.source));
    assert.ok(second.cards.some((card) => card.id === edge.target));
  }
  assert.ok(
    second.regions
      .filter((region) => region.type === 'decision')
      .every((region) => region.width >= 260),
  );
  const horizontal = layoutControlFlow(method.items, {
    cursor: 6,
    direction: 'horizontal',
  });
  assert.deepEqual(
    horizontal.cards.map((card) => card.id),
    second.cards.map((card) => card.id),
  );
  assert.deepEqual(
    horizontal.cards.map((card) => card.node.indices),
    second.cards.map((card) => card.node.indices),
  );
  const horizontalLoop = horizontal.cards.find(
    (card) => card.control === 'loop',
  );
  const horizontalBody = horizontal.cards.find(
    (card) =>
      card.id ===
      horizontal.edges.find((edge) => edge.source === horizontalLoop.id).target,
  );
  assert.ok(horizontalBody.x >= horizontalLoop.x + horizontalLoop.width);
  assert.equal(horizontalBody.y, horizontalLoop.y);
  assert.equal(
    horizontalLoop.height,
    second.cards.find((card) => card.control === 'loop').height,
  );
  assert.equal(
    horizontal.edges.find((edge) => edge.label === 'False').sourceSide,
    'right',
  );
  const placeholder = horizontal.cards.find((card) => card.placeholder);
  const emptyLane = horizontal.regions.find(
    (region) => region.type === 'decision' && region.selected === false,
  );
  assert.equal(
    emptyLane.height,
    placeholder.height + 48,
    'empty horizontal lane wraps its placeholder, not a full card band',
  );
  const populatedLane = horizontal.regions.find(
    (region) => region.type === 'decision' && region.selected === true,
  );
  assert.equal(
    populatedLane.height,
    120 + 48,
    'horizontal lane wraps ordinary step height',
  );
  const expanded = layoutControlFlow(method.items, {
    cursor: 6,
    direction: 'horizontal',
    extraHeight: (id) => (id === horizontalLoop.id ? 400 : 0),
  });
  assert.deepEqual(
    expanded.regions,
    horizontal.regions,
    'a tall header must not inflate unrelated branch lanes',
  );
  for (const layout of [first, second]) {
    const decision = layout.cards.find((card) => card.control === 'decision');
    const branches = layout.edges.filter((edge) => edge.source === decision.id);
    assert.equal(branches.length, 2, 'both source paths have an endpoint');
    const yes = branches.find((edge) => edge.label === 'True');
    const no = branches.find((edge) => edge.label === 'False');
    assert.equal(yes.sourceSide, 'right');
    assert.equal(no.sourceSide, 'bottom');
    const yesCard = layout.cards.find((card) => card.id === yes.target);
    const noCard = layout.cards.find((card) => card.id === no.target);
    assert.ok(yesCard.x > decision.x + decision.width);
    assert.equal(noCard.x, decision.x);
    const skipped = layout.cards.find((card) => card.placeholder);
    assert.match(skipped.node.title, /not selected/);
    assert.equal(skipped.node.event, undefined, 'placeholder is not an event');
    assert.ok(
      !layout.edges.some((edge) => edge.source === skipped.id),
      'unselected path cannot imply execution',
    );
    const loop = layout.cards.find((card) => card.control === 'loop');
    const body = layout.cards.find(
      (card) =>
        card.id === layout.edges.find((edge) => edge.source === loop.id).target,
    );
    assert.equal(body.x, loop.x, 'loop body follows the header column');
  }
});

for (const count of [76, 500, 1000]) {
  test(`T9 ${count} synthetic mock events retain stable topology`, () => {
    const nodes = Array.from({ length: count }, (_, offset) => {
      const index = offset + 1;
      return {
        id: `mock-node-${index}`,
        eventId: `mock-event-${index}`,
        evidenceIdentity: `mock-run:${index}`,
        invocationId: 'mock-run',
        type: 'step',
        indices: [index],
        event: {
          id: `mock-event-${index}`,
          kind: index === count ? 'return' : 'statement',
          source: { file: 'synthetic.ts', line: index },
          callId: 'mock-run',
          symbolId: 'mock-run',
          certainty: 'mock',
          label: `Simulated statement ${index}`,
        },
      };
    });
    const early = topology.prepareControlFlow(nodes, {
      cursor: 1,
      methodCallId: 'mock-run',
    });
    const late = topology.prepareControlFlow(nodes, {
      cursor: count,
      methodCallId: 'mock-run',
    });
    assert.equal(early.cards.length, count);
    assert.equal(early.edges.length, count - 1);
    assert.equal(new Set(early.cards.map(({ id }) => id)).size, count);
    assert.deepEqual(
      early.cards.map(({ index }) => index),
      Array.from({ length: count }, (_, offset) => offset + 1),
    );
    assert.ok(early.edges.every(({ status }) => status === 'prepared'));
    assert.equal(early.topologyKey, late.topologyKey);
  });
}
