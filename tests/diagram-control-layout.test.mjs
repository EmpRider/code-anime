import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSemanticFlow } from '../public/semantic-flow-model.js';
import { layoutControlFlow } from '../public/diagram-control-layout.js';

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
