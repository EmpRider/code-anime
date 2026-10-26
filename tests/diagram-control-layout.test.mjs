import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSemanticFlow } from '../public/semantic-flow-model.js';
import { layoutControlFlow } from '../public/diagram-control-layout.js';

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
