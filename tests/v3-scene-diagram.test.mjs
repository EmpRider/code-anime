import assert from 'node:assert/strict';
import test from 'node:test';
import { renderV3Scene } from '../public/v3-scene-diagram.js';

const makeNode = (id, kind, groupPathIds = []) => ({
  id,
  kind,
  label: `${kind} <untrusted>`,
  groupPathIds,
  certainty: 'mock',
});
const makeEdge = (id, fromNodeId, toNodeId, kind, status = 'alternative') => ({
  id,
  fromNodeId,
  toNodeId,
  kind,
  label: `${kind} <literal>`,
  certainty: kind === 'branch-false' ? 'unresolved' : 'mock',
  executionStatus: status,
});

class FakeGraph {
  static instances = [];

  constructor(options) {
    this.options = options;
    this.nodes = [];
    this.edges = [];
    this.pan = [];
    this.zooms = [];
    FakeGraph.instances.push(this);
  }

  addNode(spec) {
    const cell = {
      ...spec,
      children: [],
      addChild(child) {
        this.children.push(child.id);
      },
    };
    this.nodes.push(cell);
    return cell;
  }

  addEdge(spec) {
    this.edges.push(spec);
    return spec;
  }

  translateBy(dx, dy) {
    this.pan.push([dx, dy]);
  }

  zoom(amount) {
    this.zooms.push(amount);
  }

  dispose() {
    this.disposed = true;
  }
}

function fakeContainer() {
  const events = new Map();
  return {
    events,
    addEventListener(name, fn) {
      events.set(name, fn);
    },
    removeEventListener(name, fn) {
      if (events.get(name) === fn) events.delete(name);
    },
    setAttribute(name, value) {
      (this.attributes ??= {})[name] = value;
    },
    replaceChildren() {
      this.cleared = true;
    },
  };
}

function route(id, points, extra = {}) {
  return { id, points, ...extra };
}

test('paints original decision/switch/lambda/loop/try shapes, nested group labels and distinct parallel routes', async () => {
  const nodes = [
    makeNode('node:decision', 'decision', ['group:outer', 'group:inner']),
    makeNode('node:switch', 'switch', ['group:outer', 'group:inner']),
    makeNode('node:lambda', 'lambda', ['group:outer', 'group:inner']),
    makeNode('node:loop', 'loop', ['group:outer', 'group:inner']),
    makeNode('node:try', 'try', ['group:outer', 'group:inner']),
  ];
  nodes[0].label = '<img src=x onerror=alert(1)>';
  const edges = [
    makeEdge(
      'edge:true',
      'node:decision',
      'node:switch',
      'branch-true',
      'simulated-taken',
    ),
    makeEdge('edge:false', 'node:decision', 'node:switch', 'branch-false'),
  ];
  const groups = [
    {
      id: 'group:outer',
      kind: 'loop',
      label: 'outer loop',
      parentGroupId: null,
    },
    {
      id: 'group:inner',
      kind: 'try',
      label: 'try <escape>',
      parentGroupId: 'group:outer',
    },
  ];
  const variant = { availability: 'ready', graph: { nodes, edges, groups } };
  const geometry = {
    width: 1100,
    height: 670,
    groups: [
      { id: 'group:outer', x: 10, y: 10, width: 1080, height: 650 },
      { id: 'group:inner', x: 35, y: 55, width: 1030, height: 575 },
    ],
    nodes: [
      { id: 'node:decision', x: 100, y: 150, width: 150, height: 90 },
      { id: 'node:switch', x: 600, y: 150, width: 150, height: 90 },
      { id: 'node:lambda', x: 100, y: 320, width: 150, height: 80 },
      { id: 'node:loop', x: 360, y: 320, width: 150, height: 80 },
      { id: 'node:try', x: 620, y: 320, width: 150, height: 80 },
    ],
    edges: [
      route('edge:true', [
        { x: 250, y: 175 },
        { x: 600, y: 175 },
      ]),
      route('edge:false', [
        { x: 250, y: 220 },
        { x: 440, y: 220 },
        { x: 440, y: 240 },
        { x: 600, y: 240 },
      ]),
    ],
  };
  const original = structuredClone(variant);
  const container = fakeContainer();
  const result = await renderV3Scene(
    container,
    variant,
    geometry,
    {},
    { GraphClass: FakeGraph },
  );
  const graph = result.graph;
  assert.deepEqual(
    graph.nodes.map((cell) => cell.id),
    [
      'group:outer',
      'group:inner',
      'node:decision',
      'node:switch',
      'node:lambda',
      'node:loop',
      'node:try',
    ],
  );
  assert.deepEqual(
    graph.edges.map((edge) => edge.id),
    ['edge:true', 'edge:false'],
  );
  assert.equal(
    graph.nodes
      .find((cell) => cell.id === 'group:outer')
      .children.includes('group:inner'),
    true,
  );
  assert.equal(
    graph.nodes
      .find((cell) => cell.id === 'group:inner')
      .children.includes('node:decision'),
    true,
  );
  assert.equal(
    graph.nodes.find((cell) => cell.id === 'group:inner').attrs.label.text,
    'try <escape>',
  );
  assert.deepEqual(
    ['decision', 'switch', 'lambda', 'loop', 'try'].map(
      (kind) =>
        graph.nodes.find((cell) => cell.id === `node:${kind}`).data.role,
    ),
    ['decision', 'switch', 'lambda', 'loop', 'try'],
  );
  assert.equal(
    graph.nodes.find((cell) => cell.id === 'node:decision').shape,
    'polygon',
  );
  assert.equal(
    graph.nodes.find((cell) => cell.id === 'node:decision').attrs.label.text,
    '<img src=x onerror=alert(1)>',
  );
  assert.equal(
    graph.nodes.find((cell) => cell.id === 'node:switch').shape,
    'polygon',
  );
  assert.equal(
    graph.nodes.find((cell) => cell.id === 'node:lambda').shape,
    'rect',
  );
  assert.equal(
    graph.edges[0].labels[0].attrs.label.text,
    'branch-true <literal>',
  );
  assert.equal(
    graph.edges[1].labels[0].attrs.label.text,
    'branch-false <literal>',
  );
  assert.equal(graph.edges[0].data.executionStatus, 'simulated-taken');
  assert.equal(graph.edges[1].data.certainty, 'unresolved');
  assert.deepEqual(graph.edges[0].data.underlyingEdgeIds, ['edge:true']);
  assert.deepEqual(graph.edges[0].source, { x: 250, y: 175 });
  assert.deepEqual(graph.edges[1].vertices, [
    { x: 440, y: 220 },
    { x: 440, y: 240 },
  ]);
  assert.deepEqual(variant, original);
  assert.equal(
    container.attributes['aria-label'].includes('Code Anime V3'),
    true,
  );
  result.dispose();
  assert.equal(graph.disposed, true);
});

test('collapsed group is its original group ID; separate boundary proxies retain hidden semantic endpoints and status', async () => {
  const nodes = [
    makeNode('node:internal', 'statement', ['group:collapsed']),
    makeNode('node:outside', 'return'),
  ];
  const edges = [
    makeEdge(
      'edge:proxy-a',
      'node:internal',
      'node:outside',
      'branch-true',
      'simulated-taken',
    ),
    makeEdge('edge:proxy-b', 'node:internal', 'node:outside', 'branch-false'),
    makeEdge(
      'edge:hidden',
      'node:internal',
      'node:internal',
      'loop-back',
      'simulated-taken',
    ),
  ];
  const variant = {
    availability: 'ready',
    graph: {
      nodes,
      edges,
      groups: [
        {
          id: 'group:collapsed',
          kind: 'loop',
          label: 'inner loop',
          parentGroupId: null,
        },
      ],
    },
  };
  const original = structuredClone(variant);
  const geometry = {
    width: 750,
    height: 400,
    paintEdgeIds: ['edge:proxy-a', 'edge:proxy-b'],
    hiddenEdgeIds: ['edge:hidden'],
    groups: [{ id: 'group:collapsed', x: 30, y: 70, width: 200, height: 140 }],
    nodes: [{ id: 'node:outside', x: 480, y: 100, width: 150, height: 80 }],
    edges: [
      route(
        'edge:proxy-a',
        [
          { x: 230, y: 116 },
          { x: 480, y: 116 },
        ],
        { layoutSourceId: 'group:collapsed', layoutTargetId: 'node:outside' },
      ),
      route(
        'edge:proxy-b',
        [
          { x: 230, y: 174 },
          { x: 480, y: 174 },
        ],
        { layoutSourceId: 'group:collapsed', layoutTargetId: 'node:outside' },
      ),
    ],
  };
  const result = await renderV3Scene(
    fakeContainer(),
    variant,
    geometry,
    { collapsedGroupIds: ['group:collapsed'], activeEdgeIds: ['edge:hidden'] },
    { GraphClass: FakeGraph },
  );
  assert.deepEqual(
    result.graph.nodes.map((cell) => cell.id),
    ['group:collapsed', 'node:outside'],
  );
  assert.deepEqual(
    result.graph.edges.map((cell) => cell.id),
    ['edge:proxy-a', 'edge:proxy-b'],
  );
  assert.equal(result.graph.nodes[0].data.collapsed, true);
  assert.deepEqual(result.graph.nodes[0].data.hiddenActiveEdgeIds, [
    'edge:hidden',
  ]);
  assert.deepEqual(result.hiddenEdgeIds, ['edge:hidden']);
  assert.deepEqual(result.graph.edges[0].data, {
    ...edges[0],
    underlyingEdgeIds: ['edge:proxy-a'],
    layoutSourceId: 'group:collapsed',
    layoutTargetId: 'node:outside',
    active: false,
  });
  assert.equal(result.graph.edges[1].data.executionStatus, 'alternative');
  assert.deepEqual(result.graph.edges[1].data.underlyingEdgeIds, [
    'edge:proxy-b',
  ]);
  assert.deepEqual(variant, original);
  result.dispose();
});

test('nested simultaneous collapses paint only the outer visible group and attach hidden-active status there', async () => {
  const variant = {
    availability: 'ready',
    graph: {
      groups: [
        {
          id: 'group:outer',
          kind: 'loop',
          label: 'outer',
          parentGroupId: null,
        },
        {
          id: 'group:inner',
          kind: 'decision',
          label: 'inner',
          parentGroupId: 'group:outer',
        },
      ],
      nodes: [
        makeNode('node:inside', 'decision', ['group:outer', 'group:inner']),
        makeNode('node:outside', 'return'),
      ],
      edges: [
        makeEdge('edge:boundary', 'node:inside', 'node:outside', 'branch-true'),
        makeEdge(
          'edge:internal',
          'node:inside',
          'node:inside',
          'loop-back',
          'simulated-taken',
        ),
      ],
    },
  };
  const geometry = {
    width: 700,
    height: 360,
    groups: [{ id: 'group:outer', x: 25, y: 60, width: 205, height: 145 }],
    nodes: [{ id: 'node:outside', x: 480, y: 90, width: 145, height: 80 }],
    edges: [
      route(
        'edge:boundary',
        [
          { x: 230, y: 125 },
          { x: 480, y: 125 },
        ],
        {
          layoutSourceId: 'group:outer',
          layoutTargetId: 'node:outside',
        },
      ),
    ],
    hiddenEdgeIds: ['edge:internal'],
  };
  const result = await renderV3Scene(
    fakeContainer(),
    variant,
    geometry,
    {
      collapsedGroupIds: ['group:outer', 'group:inner'],
      activeEdgeIds: ['edge:internal'],
    },
    { GraphClass: FakeGraph },
  );
  assert.deepEqual(
    result.graph.nodes.map((node) => node.id),
    ['group:outer', 'node:outside'],
  );
  assert.deepEqual(result.graph.nodes[0].data.hiddenActiveEdgeIds, [
    'edge:internal',
  ]);
  assert.match(result.graph.nodes[0].attrs.label.text, /1 active edge inside/);
  assert.match(
    result.graph.nodes[0].attrs.root['aria-label'],
    /1 active edge inside/,
  );
  assert.equal(result.graph.nodes[0].attrs.body.strokeWidth, 3);
  assert.deepEqual(
    result.graph.edges.map((edge) => edge.id),
    ['edge:boundary'],
  );
  result.dispose();
});

test('keyboard focus pans and zooms only the local graph, then detaches on dispose', async () => {
  const variant = {
    availability: 'ready',
    graph: { nodes: [], groups: [], edges: [] },
  };
  const container = fakeContainer();
  const result = await renderV3Scene(
    container,
    variant,
    { width: 300, height: 200, nodes: [], groups: [], edges: [] },
    {},
    { GraphClass: FakeGraph },
  );
  assert.equal(container.tabIndex, 0);
  const event = {
    key: 'ArrowLeft',
    preventDefault() {
      this.prevented = true;
    },
  };
  container.events.get('keydown')(event);
  assert.equal(event.prevented, true);
  assert.deepEqual(result.graph.pan, [[70, 0]]);
  container.events.get('keydown')({ key: '+', preventDefault() {} });
  assert.deepEqual(result.graph.zooms, [0.12]);
  result.dispose();
  assert.equal(container.events.size, 0);
});

test('rejects missing projection identity, route diagonals and unknown visible edge before creating X6', async () => {
  const variant = {
    availability: 'ready',
    graph: {
      nodes: [makeNode('n:1', 'entry'), makeNode('n:2', 'return')],
      groups: [],
      edges: [makeEdge('e:1', 'n:1', 'n:2', 'sequence')],
    },
  };
  const valid = {
    width: 500,
    height: 240,
    nodes: [
      { id: 'n:1', x: 20, y: 40, width: 120, height: 70 },
      { id: 'n:2', x: 340, y: 40, width: 120, height: 70 },
    ],
    groups: [],
    edges: [
      route('e:1', [
        { x: 140, y: 70 },
        { x: 340, y: 70 },
      ]),
    ],
  };
  const count = FakeGraph.instances.length;
  const invalidId = structuredClone(valid);
  invalidId.edges[0].id = 'not-semantic';
  await assert.rejects(
    renderV3Scene(
      fakeContainer(),
      variant,
      invalidId,
      {},
      { GraphClass: FakeGraph },
    ),
    /unknown .*edge/i,
  );
  const diagonal = structuredClone(valid);
  diagonal.edges[0].points[1].y = 100;
  await assert.rejects(
    renderV3Scene(
      fakeContainer(),
      variant,
      diagonal,
      {},
      { GraphClass: FakeGraph },
    ),
    /diagonal/i,
  );
  const untrackedCollapse = structuredClone(valid);
  await assert.rejects(
    renderV3Scene(
      fakeContainer(),
      variant,
      untrackedCollapse,
      { collapsedGroupIds: ['group:untracked'] },
      { GraphClass: FakeGraph },
    ),
    /unknown collapsed group/i,
  );
  assert.equal(FakeGraph.instances.length, count);
});

test('renders a supplied visible self-loop without merging it into another edge', async () => {
  const variant = {
    availability: 'ready',
    graph: {
      nodes: [makeNode('node:recur', 'loop')],
      groups: [],
      edges: [
        makeEdge(
          'edge:back',
          'node:recur',
          'node:recur',
          'loop-back',
          'simulated-taken',
        ),
      ],
    },
  };
  const geometry = {
    width: 420,
    height: 320,
    nodes: [{ id: 'node:recur', x: 100, y: 100, width: 120, height: 80 }],
    groups: [],
    edges: [
      route('edge:back', [
        { x: 220, y: 120 },
        { x: 300, y: 120 },
        { x: 300, y: 240 },
        { x: 180, y: 240 },
        { x: 180, y: 180 },
      ]),
    ],
  };
  const result = await renderV3Scene(
    fakeContainer(),
    variant,
    geometry,
    {},
    { GraphClass: FakeGraph },
  );
  assert.deepEqual(
    result.graph.edges.map((edge) => edge.id),
    ['edge:back'],
  );
  assert.equal(result.graph.edges[0].data.fromNodeId, 'node:recur');
  assert.equal(result.graph.edges[0].data.toNodeId, 'node:recur');
  assert.deepEqual(result.graph.edges[0].data.underlyingEdgeIds, ['edge:back']);
  result.dispose();
});

test('rejects unplaceable required edge labels before allocating X6 resources', async () => {
  const variant = {
    availability: 'ready',
    graph: {
      nodes: [
        makeNode('n:left', 'statement'),
        makeNode('n:right', 'statement'),
      ],
      groups: [],
      edges: [makeEdge('e:short', 'n:left', 'n:right', 'sequence')],
    },
  };
  const geometry = {
    width: 350,
    height: 230,
    nodes: [
      { id: 'n:left', x: 20, y: 50, width: 120, height: 70 },
      { id: 'n:right', x: 160, y: 50, width: 120, height: 70 },
    ],
    groups: [],
    edges: [
      route('e:short', [
        { x: 140, y: 85 },
        { x: 160, y: 85 },
      ]),
    ],
  };
  const before = FakeGraph.instances.length;
  await assert.rejects(
    renderV3Scene(
      fakeContainer(),
      variant,
      geometry,
      {},
      { GraphClass: FakeGraph },
    ),
    /No collision-free V3 edge label position/,
  );
  assert.equal(FakeGraph.instances.length, before);
});

test('rejects collapsed projection that silently drops any unrelated visible node or group', async () => {
  const variant = {
    availability: 'ready',
    graph: {
      nodes: [
        makeNode('n:inside', 'decision', ['g:collapsed']),
        makeNode('n:outside', 'return'),
      ],
      groups: [
        {
          id: 'g:collapsed',
          kind: 'decision',
          label: 'collapsed',
          parentGroupId: null,
        },
        { id: 'g:other', kind: 'try', label: 'unrelated', parentGroupId: null },
      ],
      edges: [],
    },
  };
  const geometry = {
    width: 700,
    height: 300,
    nodes: [{ id: 'n:outside', x: 450, y: 60, width: 150, height: 80 }],
    groups: [
      { id: 'g:collapsed', x: 30, y: 40, width: 190, height: 150 },
      { id: 'g:other', x: 380, y: 20, width: 280, height: 220 },
    ],
    edges: [],
    hiddenEdgeIds: [],
  };
  const before = FakeGraph.instances.length;
  const lostNode = structuredClone(geometry);
  lostNode.nodes = [];
  await assert.rejects(
    renderV3Scene(
      fakeContainer(),
      variant,
      lostNode,
      { collapsedGroupIds: ['g:collapsed'] },
      { GraphClass: FakeGraph },
    ),
    /missing visible V3 node/i,
  );
  const lostGroup = structuredClone(geometry);
  lostGroup.groups = lostGroup.groups.filter((group) => group.id !== 'g:other');
  await assert.rejects(
    renderV3Scene(
      fakeContainer(),
      variant,
      lostGroup,
      { collapsedGroupIds: ['g:collapsed'] },
      { GraphClass: FakeGraph },
    ),
    /missing visible V3 group/i,
  );
  assert.equal(FakeGraph.instances.length, before);
});

test('hidden edge IDs are exactly internal to a visible collapsed group, never arbitrary', async () => {
  const a = makeNode('n:a', 'entry', ['g:collapsed']);
  const b = makeNode('n:b', 'return');
  const edge = makeEdge('e:ab', 'n:a', 'n:b', 'sequence');
  const variant = {
    availability: 'ready',
    graph: {
      nodes: [a, b],
      edges: [edge],
      groups: [
        {
          id: 'g:collapsed',
          kind: 'loop',
          label: 'loop',
          parentGroupId: null,
        },
      ],
    },
  };
  const expanded = {
    width: 600,
    height: 300,
    nodes: [
      { id: 'n:a', x: 40, y: 100, width: 120, height: 80 },
      { id: 'n:b', x: 380, y: 100, width: 120, height: 80 },
    ],
    groups: [{ id: 'g:collapsed', x: 20, y: 50, width: 250, height: 220 }],
    edges: [],
    hiddenEdgeIds: ['e:ab'],
  };
  const before = FakeGraph.instances.length;
  await assert.rejects(
    renderV3Scene(
      fakeContainer(),
      variant,
      expanded,
      {},
      { GraphClass: FakeGraph },
    ),
    /invalid V3 hidden edge/i,
  );
  const collapsed = {
    ...expanded,
    nodes: [expanded.nodes[1]],
    edges: [],
    hiddenEdgeIds: ['e:ab'],
  };
  await assert.rejects(
    renderV3Scene(
      fakeContainer(),
      variant,
      collapsed,
      { collapsedGroupIds: ['g:collapsed'] },
      { GraphClass: FakeGraph },
    ),
    /invalid V3 hidden edge/i,
  );
  assert.equal(FakeGraph.instances.length, before);
});
