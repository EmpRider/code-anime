import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ELK from 'elkjs/lib/elk.bundled.js';
import { reserveRouteLabel } from '../public/diagram-label-placement.js';
import { renderV3Scene } from '../public/v3-scene-diagram.js';
import {
  buildV3ElkGraph,
  flattenV3ElkGraph,
  createV3SceneLayout,
  prepareV3LayoutInput,
} from '../public/v3-scene-geometry.js';

const fixture = JSON.parse(
  readFileSync(
    new URL('./fixtures/v3/nested-multilingual.json', import.meta.url),
  ),
);
const scene = fixture.variantsById.proposed;
const options = { viewport: { width: 900, height: 600 } };

function allChildren(root) {
  return root.children.flatMap((child) => [
    child,
    ...(child.children ? allChildren(child) : []),
  ]);
}

test('preserves exact V3 node/group/edge IDs and explicit ownership', () => {
  const graph = buildV3ElkGraph(scene, options);
  const children = allChildren(graph);
  assert.deepEqual(
    new Set(children.map((item) => item.id)),
    new Set([
      ...scene.graph.groups.map((item) => item.id),
      ...scene.graph.nodes.map((item) => item.id),
    ]),
  );
  assert.deepEqual(
    graph.edges.map((edge) => [edge.id, edge.sources[0], edge.targets[0]]),
    scene.graph.edges.map((edge) => [edge.id, edge.fromNodeId, edge.toNodeId]),
  );
  const outer = children.find((child) => child.id === 'group:outer');
  assert(outer.children.some((child) => child.id === 'group:choice'));
  assert(
    children
      .find((child) => child.id === 'group:handler')
      .children.some((child) => child.id === 'node:unknown'),
  );
});

test('orientation and both viewport dimensions affect presentation only', () => {
  const horizontal = buildV3ElkGraph(scene, options);
  const vertical = buildV3ElkGraph(scene, {
    orientation: 'vertical',
    viewport: options.viewport,
  });
  const narrower = buildV3ElkGraph(scene, {
    viewport: { width: 600, height: 900 },
  });
  assert.equal(horizontal.layoutOptions['elk.direction'], 'RIGHT');
  assert.equal(vertical.layoutOptions['elk.direction'], 'DOWN');
  assert.notEqual(
    horizontal.layoutOptions['elk.aspectRatio'],
    narrower.layoutOptions['elk.aspectRatio'],
  );
  assert.equal(
    horizontal.layoutOptions['elk.layered.wrapping.strategy'],
    'OFF',
  );
  assert.deepEqual(horizontal.edges, vertical.edges);
  assert.deepEqual(scene, fixture.variantsById.proposed);
});

test('honors measured node sizes and rejects unsafe geometry', () => {
  const graph = buildV3ElkGraph(scene, {
    ...options,
    nodeSizes: { 'node:λ': { width: 325, height: 186 } },
  });
  const measured = allChildren(graph).find((item) => item.id === 'node:λ');
  assert.equal(measured.width, 325);
  assert.equal(measured.height, 186);
  assert.throws(
    () => buildV3ElkGraph(scene, { viewport: { width: 0, height: 600 } }),
    /viewport width/,
  );
  assert.throws(
    () => buildV3ElkGraph(scene, { ...options, orientation: 'diagonal' }),
    /orientation/,
  );
  assert.throws(
    () =>
      buildV3ElkGraph(scene, {
        ...options,
        nodeSizes: { 'node:λ': { width: Infinity, height: 50 } },
      }),
    /node:λ width/,
  );
});

const simpleScene = JSON.parse(
  readFileSync(
    new URL('./fixtures/v3/proposed-baseline.json', import.meta.url),
  ),
).variantsById.proposed;

test('avoids private root collisions with node, edge, and suffix IDs while preserving graph identity', async () => {
  const variant = structuredClone(simpleScene);
  const firstId = variant.graph.nodes[0].id;
  const secondId = variant.graph.nodes[1].id;
  variant.graph.nodes[0].id = 'v3-scene-root';
  variant.graph.nodes[1].id = 'v3-scene-root#1';
  variant.graph.edges[0].id = 'v3-scene-root#2';
  for (const edge of variant.graph.edges) {
    if (edge.fromNodeId === firstId) edge.fromNodeId = 'v3-scene-root';
    if (edge.fromNodeId === secondId) edge.fromNodeId = 'v3-scene-root#1';
    if (edge.toNodeId === firstId) edge.toNodeId = 'v3-scene-root';
    if (edge.toNodeId === secondId) edge.toNodeId = 'v3-scene-root#1';
  }
  const baseline = structuredClone(variant);
  for (const orientation of ['horizontal', 'vertical']) {
    const input = buildV3ElkGraph(variant, { ...options, orientation });
    assert.equal(input.id, 'v3-scene-root#3');
    assert.deepEqual(
      input.children.map((node) => node.id),
      ['v3-scene-root', 'v3-scene-root#1'],
    );
    const output = await new ELK().layout(input);
    const geometry = flattenV3ElkGraph(output, variant);
    assert.deepEqual(
      geometry.nodes.map((node) => node.id),
      input.children.map((node) => node.id),
    );
    assert.deepEqual(
      geometry.edges.map((edge) => edge.id),
      ['v3-scene-root#2'],
    );
  }
  assert.deepEqual(variant, baseline);
});

test('avoids private root collisions with nested group IDs in real ELK output', async () => {
  const variant = structuredClone(scene);
  const original = 'group:outer';
  variant.graph.groups.find((group) => group.id === original).id =
    'v3-scene-root';
  for (const group of variant.graph.groups) {
    if (group.parentGroupId === original) group.parentGroupId = 'v3-scene-root';
  }
  for (const node of variant.graph.nodes) {
    node.groupPathIds = node.groupPathIds.map((id) =>
      id === original ? 'v3-scene-root' : id,
    );
  }
  for (const orientation of ['horizontal', 'vertical']) {
    const graph = buildV3ElkGraph(variant, { ...options, orientation });
    assert.equal(graph.id, 'v3-scene-root#1');
    assert(graph.children.some((child) => child.id === 'v3-scene-root'));
    const geometry = flattenV3ElkGraph(await new ELK().layout(graph), variant);
    assert(geometry.groups.some((group) => group.id === 'v3-scene-root'));
    assert.equal(geometry.nodes.length, variant.graph.nodes.length);
  }
});

const simpleElk = {
  id: 'v3-scene-root',
  width: 600,
  height: 220,
  children: [
    { id: 'node:one', x: 20, y: 20, width: 260, height: 124 },
    { id: 'node:two', x: 320, y: 20, width: 260, height: 124 },
  ],
  edges: [
    {
      id: 'edge:1',
      sections: [
        {
          startPoint: { x: 280, y: 82 },
          bendPoints: [{ x: 300, y: 82 }],
          endPoint: { x: 320, y: 82 },
        },
      ],
    },
  ],
};

test('flattens exact semantic records and rejects diagonals without inventing repairs', () => {
  const result = flattenV3ElkGraph(simpleElk, simpleScene);
  assert.deepEqual(
    result.nodes.map(({ id }) => id),
    simpleScene.graph.nodes.map(({ id }) => id),
  );
  assert.deepEqual(
    result.edges.map(({ id }) => id),
    ['edge:1'],
  );
  assert.equal(result.nodes[1].x, 320);
  const diagonal = structuredClone(simpleElk);
  diagonal.edges[0].sections[0].endPoint.y = 100;
  assert.throws(
    () => flattenV3ElkGraph(diagonal, simpleScene),
    /diagonal V3 ELK route/,
  );
  assert.deepEqual(simpleElk.edges[0].sections[0].endPoint, { x: 320, y: 82 });
});

test('rejects a route crossing an unrelated card interior', () => {
  const withObstacle = structuredClone(simpleScene);
  withObstacle.graph.nodes.push({
    ...simpleScene.graph.nodes[0],
    id: 'node:obstacle',
    order: 2,
  });
  const elk = structuredClone(simpleElk);
  elk.children.push({
    id: 'node:obstacle',
    x: 290,
    y: 72,
    width: 20,
    height: 20,
  });
  assert.throws(
    () => flattenV3ElkGraph(elk, withObstacle),
    /edge:1 crosses node node:obstacle/,
  );
});

test('worker registration/layout produces an isolated, validated result', async () => {
  class FakeWorker {
    constructor() {
      FakeWorker.instance = this;
      this.messages = [];
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
    reply(data) {
      this.onmessage({ data });
    }
  }
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const pending = engine.layout(simpleScene, options);
  const worker = FakeWorker.instance;
  assert.equal(worker.messages[0].cmd, 'register');
  const { id } = worker.messages[0];
  worker.reply({ id });
  assert.equal(worker.messages[1].cmd, 'layout');
  assert.equal(
    worker.messages[1].graph.edges.length,
    simpleScene.graph.edges.length,
  );
  worker.reply({ id, data: simpleElk });
  const result = await pending;
  assert.deepEqual(
    result.edges.map((edge) => edge.id),
    ['edge:1'],
  );
  assert(worker.terminated);
  engine.dispose();
});

test('malformed Worker registration ACKs fail closed without dispatching layout', async (t) => {
  const malformed = [
    ['unexpected field', (id) => ({ id, notAnAck: true })],
    ['premature data', (id) => ({ id, data: simpleElk })],
    ['registration error', (id) => ({ id, error: 'unavailable' })],
    ['wrong id', (id) => ({ id: id + 1 })],
    ['missing id', () => ({})],
    [
      'array with id',
      (id) => {
        const reply = [];
        reply.id = id;
        return reply;
      },
    ],
    ['inherited id', (id) => Object.create({ id })],
    ['symbol key', (id) => ({ id, [Symbol('hidden')]: true })],
    [
      'non-enumerable key',
      (id) => Object.defineProperty({ id }, 'hidden', { value: true }),
    ],
    [
      'throwing id getter',
      () =>
        Object.defineProperty({}, 'id', {
          enumerable: true,
          get() {
            throw new Error('malicious id getter');
          },
        }),
    ],
    [
      'throwing proxy ownKeys',
      (id) =>
        new Proxy(
          { id },
          {
            ownKeys() {
              throw new Error('malicious proxy keys');
            },
          },
        ),
    ],
  ];
  for (const [label, makeReply] of malformed) {
    await t.test(label, async () => {
      class FakeWorker {
        constructor() {
          FakeWorker.instance = this;
          this.messages = [];
        }
        postMessage(message) {
          this.messages.push(message);
        }
        terminate() {
          this.terminated = true;
        }
      }
      const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
      const pending = engine.layout(simpleScene, {
        ...options,
        timeoutMs: 35,
      });
      const worker = FakeWorker.instance;
      const id = worker.messages[0].id;
      try {
        assert.doesNotThrow(() => {
          worker.onmessage({ data: makeReply(id) });
        });
        await assert.rejects(pending, /Malformed V3 ELK registration ACK/);
        assert.deepEqual(
          worker.messages.map((message) => message.cmd),
          ['register'],
        );
        assert.equal(worker.terminated, true);
      } finally {
        engine.dispose();
        await pending.catch(() => {});
      }
    });
  }
});

test('malformed ACK and timeout do not poison later Worker layout epochs', async () => {
  class FakeWorker {
    constructor() {
      FakeWorker.instances.push(this);
      this.messages = [];
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
  }
  FakeWorker.instances = [];
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const rejected = engine.layout(simpleScene, options);
  const first = FakeWorker.instances[0];
  first.onmessage({ data: { id: first.messages[0].id, invalid: true } });
  await assert.rejects(rejected, /Malformed V3 ELK registration ACK/);
  assert.equal(first.terminated, true);
  assert.deepEqual(
    first.messages.map((message) => message.cmd),
    ['register'],
  );

  const timedOut = engine.layout(simpleScene, { ...options, timeoutMs: 20 });
  const second = FakeWorker.instances[1];
  await assert.rejects(timedOut, /V3 ELK Worker timeout/);
  assert.equal(second.terminated, true);

  const fresh = engine.layout(simpleScene, options);
  const third = FakeWorker.instances[2];
  const id = third.messages[0].id;
  third.onmessage({ data: { id } });
  third.onmessage({ data: { id, data: simpleElk } });
  const result = await fresh;
  assert.deepEqual(
    result.edges.map((edge) => edge.id),
    ['edge:1'],
  );
  assert.deepEqual(
    third.messages.map((message) => message.cmd),
    ['register', 'layout'],
  );
  assert.equal(third.terminated, true);
  engine.dispose();
});

test('new geometry epochs cancel stale Worker responses', async () => {
  class FakeWorker {
    constructor() {
      FakeWorker.instances.push(this);
    }
    postMessage() {}
    terminate() {
      this.terminated = true;
    }
  }
  FakeWorker.instances = [];
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const stale = engine.layout(simpleScene, options);
  const next = engine.layout(simpleScene, options);
  await assert.rejects(stale, /Stale V3 layout request/);
  assert(FakeWorker.instances[0].terminated);
  engine.dispose();
  await assert.rejects(next, /V3 layout disposed/);
});

test('invalid new viewport still invalidates a pending older worker epoch', async () => {
  class FakeWorker {
    constructor() {
      FakeWorker.instance = this;
    }
    postMessage() {}
    terminate() {
      this.terminated = true;
    }
  }
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const older = engine.layout(simpleScene, options);
  const newer = engine.layout(simpleScene, {
    viewport: { width: 0, height: 600 },
  });
  await assert.rejects(older, /Stale V3 layout request/);
  await assert.rejects(newer, /viewport width/);
  assert(FakeWorker.instance.terminated);
  engine.dispose();
});

test('abort, worker fault, and unsafe worker origins settle without stale output', async () => {
  assert.throws(
    () => createV3SceneLayout({ workerUrl: 'https://example.com/worker.js' }),
    /same-origin/,
  );
  assert.throws(
    () => createV3SceneLayout({ workerUrl: '//example.com/worker.js' }),
    /same-origin/,
  );
  class FakeWorker {
    constructor() {
      FakeWorker.instance = this;
    }
    postMessage() {}
    terminate() {
      this.terminated = true;
    }
  }
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const controller = new AbortController();
  const pending = engine.layout(simpleScene, {
    ...options,
    signal: controller.signal,
  });
  controller.abort();
  await assert.rejects(pending, /V3 layout aborted/);
  assert(FakeWorker.instance.terminated);
  const failed = engine.layout(simpleScene, options);
  FakeWorker.instance.onerror({ message: 'unexpected crash' });
  await assert.rejects(failed, /unexpected crash/);
  engine.dispose();
});

test('real ELK preserves nested multilingual graph in both orientations', async () => {
  const elk = new ELK();
  for (const orientation of ['horizontal', 'vertical']) {
    const input = buildV3ElkGraph(scene, { ...options, orientation });
    const output = await elk.layout(input);
    const geometry = flattenV3ElkGraph(output, scene);
    assert.equal(geometry.nodes.length, scene.graph.nodes.length);
    assert.equal(geometry.groups.length, scene.graph.groups.length);
    assert.equal(geometry.edges.length, scene.graph.edges.length);
    assert(geometry.width > 0 && geometry.height > 0);
    for (const edge of geometry.edges) assert(edge.points.length >= 2);
    const byId = new Map(geometry.nodes.map((node) => [node.id, node]));
    function onBoundary(point, rect) {
      const betweenX =
        point.x >= rect.x - 1e-6 && point.x <= rect.x + rect.width + 1e-6;
      const betweenY =
        point.y >= rect.y - 1e-6 && point.y <= rect.y + rect.height + 1e-6;
      const xEdge =
        Math.abs(point.x - rect.x) < 1e-6 ||
        Math.abs(point.x - rect.x - rect.width) < 1e-6;
      const yEdge =
        Math.abs(point.y - rect.y) < 1e-6 ||
        Math.abs(point.y - rect.y - rect.height) < 1e-6;
      return betweenX && betweenY && (xEdge || yEdge);
    }
    for (const edge of geometry.edges) {
      assert(
        onBoundary(edge.points[0], byId.get(edge.fromNodeId)),
        `${orientation}: ${edge.id} source port`,
      );
      assert(
        onBoundary(edge.points.at(-1), byId.get(edge.toNodeId)),
        `${orientation}: ${edge.id} target port`,
      );
    }
  }
});

test('long explicit sequences request wrapping without losing any graph ID', async () => {
  const long = structuredClone(simpleScene);
  long.graph.nodes = Array.from({ length: 28 }, (_, index) => ({
    ...simpleScene.graph.nodes[0],
    id: `explicit:${index}`,
    order: index,
    groupPathIds: [],
  }));
  long.graph.edges = long.graph.nodes.slice(1).map((node, index) => ({
    ...simpleScene.graph.edges[0],
    id: `explicit-edge:${index}`,
    fromNodeId: `explicit:${index}`,
    toNodeId: node.id,
  }));
  const elk = new ELK();
  for (const orientation of ['horizontal', 'vertical']) {
    const graph = buildV3ElkGraph(long, {
      orientation,
      viewport: { width: 900, height: 600 },
      nodeSizes: Object.fromEntries(
        long.graph.nodes.map(({ id }) => [id, { width: 110, height: 70 }]),
      ),
    });
    assert.equal(
      graph.layoutOptions['elk.layered.wrapping.strategy'],
      'MULTI_EDGE',
    );
    const result = flattenV3ElkGraph(await elk.layout(graph), long);
    assert.equal(result.nodes.length, 28);
    assert.equal(result.edges.length, 27);
    assert.deepEqual(
      result.nodes.map(({ id }) => id),
      long.graph.nodes.map(({ id }) => id),
    );
    const secondary = orientation === 'horizontal' ? 'y' : 'x';
    assert(
      new Set(result.nodes.map((node) => node[secondary])).size > 1,
      `${orientation} must occupy more than one ${secondary} lane`,
    );
  }
});

test('identical immutable inputs produce deterministic geometry; viewport changes re-pack only', async () => {
  const elk = new ELK();
  const narrowSettings = {
    orientation: 'horizontal',
    viewport: { width: 500, height: 850 },
  };
  const wideSettings = {
    orientation: 'horizontal',
    viewport: { width: 1900, height: 850 },
  };
  const firstInput = buildV3ElkGraph(scene, narrowSettings);
  const secondInput = buildV3ElkGraph(scene, narrowSettings);
  assert.deepEqual(firstInput, secondInput);
  const first = flattenV3ElkGraph(await elk.layout(firstInput), scene);
  const second = flattenV3ElkGraph(await elk.layout(secondInput), scene);
  assert.deepEqual(first, second);
  const wider = flattenV3ElkGraph(
    await elk.layout(buildV3ElkGraph(scene, wideSettings)),
    scene,
  );
  assert.deepEqual(
    first.nodes.map(({ id }) => id),
    wider.nodes.map(({ id }) => id),
  );
  assert.deepEqual(
    first.edges.map(({ id }) => id),
    wider.edges.map(({ id }) => id),
  );
  assert.notEqual(
    buildV3ElkGraph(scene, narrowSettings).layoutOptions['elk.aspectRatio'],
    buildV3ElkGraph(scene, wideSettings).layoutOptions['elk.aspectRatio'],
  );
});

const collapseScene = (() => {
  const variant = structuredClone(simpleScene);
  const node = variant.graph.nodes[0];
  const edge = variant.graph.edges[0];
  const group = scene.graph.groups[0];
  variant.graph.groups = [
    { ...group, id: 'outer', parentGroupId: null, memberNodeIds: ['W'] },
    {
      ...group,
      id: 'inner',
      parentGroupId: 'outer',
      memberNodeIds: ['X', 'Y'],
    },
  ];
  variant.graph.nodes = [
    { ...node, id: 'X', groupPathIds: ['outer', 'inner'], order: 0 },
    { ...node, id: 'Y', groupPathIds: ['outer', 'inner'], order: 1 },
    { ...node, id: 'W', groupPathIds: ['outer'], order: 2 },
    { ...node, id: 'Z', groupPathIds: [], order: 3 },
  ];
  variant.graph.edges = [
    ['e:xy', 'X', 'Y', 'inner-only'],
    ['e:xz:a', 'X', 'Z', 'parallel A'],
    ['e:xz:b', 'X', 'Z', 'parallel B'],
    ['e:wx', 'W', 'X', 'sibling-to-inner'],
    ['e:yw', 'Y', 'W', 'return-to-sibling'],
    ['e:zw', 'Z', 'W', 'external-to-sibling'],
  ].map(([id, fromNodeId, toNodeId, label], index) => ({
    ...edge,
    id,
    fromNodeId,
    toNodeId,
    label,
    certainty: index % 2 ? 'unresolved' : 'mock',
  }));
  variant.artifact.revision = 'revision:collapse';
  return variant;
})();

const collapsePresentation = {
  variantId: 'proposed',
  orientation: 'horizontal',
  viewport: { width: 800, height: 600 },
  collapsedGroupIds: ['inner'],
};

test('RED CA055: nested projection preserves semantic records, parallel identities and hidden edges', () => {
  const before = structuredClone(collapseScene);
  const prepared = prepareV3LayoutInput(collapseScene, collapsePresentation, {
    inner: { width: 175, height: 70 },
  });
  assert.deepEqual(
    prepared.cards.map(({ id, parentRegionId }) => [id, parentRegionId]),
    [
      ['W', 'outer'],
      ['Z', null],
      ['inner', 'outer'],
    ],
  );
  assert.deepEqual(
    prepared.regions.map(({ id }) => id),
    ['outer'],
  );
  assert.deepEqual(
    prepared.edges.map(({ id }) => id),
    ['e:xz:a', 'e:xz:b', 'e:wx', 'e:yw', 'e:zw'],
  );
  assert.deepEqual(prepared.hiddenEdgeIds, ['e:xy']);
  for (const edge of prepared.edges) {
    const semantic = collapseScene.graph.edges.find(({ id }) => id === edge.id);
    assert.equal(edge.fromNodeId, semantic.fromNodeId);
    assert.equal(edge.toNodeId, semantic.toNodeId);
    assert.equal(edge.label, semantic.label);
    assert.equal(edge.certainty, semantic.certainty);
    assert.deepEqual(edge.underlyingEdgeIds, [edge.id]);
    assert.equal(edge.layoutSourceId, edge.source);
    assert.equal(edge.layoutTargetId, edge.target);
  }
  assert.deepEqual(
    prepared.edges
      .filter(({ id }) => id.startsWith('e:xz'))
      .map((edge) => [edge.source, edge.target]),
    [
      ['inner', 'Z'],
      ['inner', 'Z'],
    ],
  );
  assert.deepEqual(collapseScene, before);
  assert.throws(
    () =>
      prepareV3LayoutInput(collapseScene, {
        ...collapsePresentation,
        collapsedGroupIds: ['phantom'],
      }),
    /Unknown collapsed V3 group/,
  );
});

test('RED CA055: outermost visible collapsed ancestor hides internal edge and restores on expand', () => {
  const outer = prepareV3LayoutInput(collapseScene, {
    ...collapsePresentation,
    collapsedGroupIds: ['inner', 'outer'],
  });
  assert.deepEqual(
    outer.cards.map(({ id }) => id),
    ['Z', 'outer'],
  );
  assert.deepEqual(outer.regions, []);
  assert.deepEqual(
    outer.edges.map(({ id }) => id),
    ['e:xz:a', 'e:xz:b', 'e:zw'],
  );
  assert.deepEqual(outer.hiddenEdgeIds, ['e:xy', 'e:wx', 'e:yw']);
  assert(outer.edges.every(({ source, target }) => source !== target));
  assert.deepEqual(
    outer.edges.map(({ source, target }) => [source, target]),
    [
      ['outer', 'Z'],
      ['outer', 'Z'],
      ['Z', 'outer'],
    ],
  );
  const expanded = prepareV3LayoutInput(collapseScene, {
    ...collapsePresentation,
    collapsedGroupIds: [],
  });
  assert.deepEqual(
    new Set(expanded.cards.map(({ id }) => id)),
    new Set(collapseScene.graph.nodes.map(({ id }) => id)),
  );
  assert.deepEqual(
    expanded.regions.map(({ id }) => id),
    ['outer', 'inner'],
  );
  assert.deepEqual(
    expanded.edges.map(({ id }) => id),
    collapseScene.graph.edges.map(({ id }) => id),
  );
  assert.deepEqual(expanded.hiddenEdgeIds, []);
});

test('RED CA055: distinct collapsed sibling anchors and a visible self-loop remain real edges', () => {
  const variant = structuredClone(collapseScene);
  const inner = variant.graph.groups.find(({ id }) => id === 'inner');
  variant.graph.groups.push({
    ...inner,
    id: 'sibling',
    parentGroupId: 'outer',
    memberNodeIds: ['V'],
  });
  variant.graph.nodes.push({
    ...variant.graph.nodes[0],
    id: 'V',
    groupPathIds: ['outer', 'sibling'],
  });
  variant.graph.edges.push({
    ...variant.graph.edges[0],
    id: 'e:siblings',
    fromNodeId: 'X',
    toNodeId: 'V',
  });
  variant.graph.edges.push({
    ...variant.graph.edges[0],
    id: 'e:loop',
    fromNodeId: 'Z',
    toNodeId: 'Z',
  });
  const prepared = prepareV3LayoutInput(variant, {
    ...collapsePresentation,
    collapsedGroupIds: ['inner', 'sibling'],
  });
  assert.deepEqual(
    prepared.edges
      .filter(({ id }) => id === 'e:siblings' || id === 'e:loop')
      .map(({ id, source, target }) => [id, source, target]),
    [
      ['e:siblings', 'inner', 'sibling'],
      ['e:loop', 'Z', 'Z'],
    ],
  );
  assert(!prepared.hiddenEdgeIds.includes('e:siblings'));
  assert(!prepared.hiddenEdgeIds.includes('e:loop'));
});

test('RED CA055: private ELK root never collides with hidden semantic IDs', () => {
  const variant = structuredClone(collapseScene);
  variant.graph.nodes.find(({ id }) => id === 'X').id = 'v3-scene-root';
  for (const edge of variant.graph.edges) {
    if (edge.fromNodeId === 'X') edge.fromNodeId = 'v3-scene-root';
    if (edge.toNodeId === 'X') edge.toNodeId = 'v3-scene-root';
  }
  const graph = buildV3ElkGraph(variant, {
    presentationState: collapsePresentation,
  });
  assert.equal(graph.id, 'v3-scene-root#1');
  assert(graph.children.some(({ id }) => id === 'outer'));
  assert(!allChildren(graph).some(({ id }) => id === 'v3-scene-root'));
});

test('RED CA055: topology cache key tracks geometry, not playback state', () => {
  const base = prepareV3LayoutInput(collapseScene, collapsePresentation);
  function key(presentation, measurements = {}) {
    return prepareV3LayoutInput(collapseScene, presentation, measurements)
      .topologyKey;
  }
  assert.equal(
    base.topologyKey,
    key({
      ...collapsePresentation,
      cursor: 5,
      activeEdgeIds: ['e:xy'],
      frameId: 'frame:5',
    }),
  );
  assert.notEqual(
    base.topologyKey,
    key({ ...collapsePresentation, orientation: 'vertical' }),
  );
  assert.notEqual(
    base.topologyKey,
    key({ ...collapsePresentation, viewport: { width: 801, height: 600 } }),
  );
  assert.notEqual(
    base.topologyKey,
    key({ ...collapsePresentation, viewport: { width: 800, height: 601 } }),
  );
  assert.notEqual(
    base.topologyKey,
    key({ ...collapsePresentation, collapsedGroupIds: ['outer'] }),
  );
  assert.notEqual(
    base.topologyKey,
    key({ ...collapsePresentation, variantId: 'baseline' }),
  );
  assert.notEqual(
    base.topologyKey,
    key({ ...collapsePresentation, expandedValueIds: ['object:1'] }),
  );
  assert.notEqual(
    base.topologyKey,
    key({ ...collapsePresentation, fontRevision: 'font:2' }),
  );
  assert.notEqual(
    base.topologyKey,
    key({ ...collapsePresentation, groupHeaderHeight: 48 }),
  );
  assert.notEqual(
    base.topologyKey,
    key(collapsePresentation, { inner: { width: 180, height: 75 } }),
  );
  assert.equal(
    key(
      collapsePresentation,
      new Map([
        ['inner', { width: 180, height: 75 }],
        ['X', { width: 260, height: 124 }],
      ]),
    ),
    key(
      collapsePresentation,
      new Map([
        ['X', { width: 260, height: 124 }],
        ['inner', { width: 180, height: 75 }],
      ]),
    ),
  );
  const revision = structuredClone(collapseScene);
  revision.artifact.revision = 'revision:later';
  assert.notEqual(
    base.topologyKey,
    prepareV3LayoutInput(revision, collapsePresentation).topologyKey,
  );
  assert.equal(
    key({ ...collapsePresentation, collapsedGroupIds: ['inner', 'outer'] }),
    key({ ...collapsePresentation, collapsedGroupIds: ['outer', 'inner'] }),
  );
});

function onBoundary(point, rect) {
  const x = point.x >= rect.x - 1e-6 && point.x <= rect.x + rect.width + 1e-6;
  const y = point.y >= rect.y - 1e-6 && point.y <= rect.y + rect.height + 1e-6;
  return (
    x &&
    y &&
    (Math.abs(point.x - rect.x) < 1e-6 ||
      Math.abs(point.x - rect.x - rect.width) < 1e-6 ||
      Math.abs(point.y - rect.y) < 1e-6 ||
      Math.abs(point.y - rect.y - rect.height) < 1e-6)
  );
}

test('RED CA055: real bundled ELK nested group leaf routes in both directions and viewports', async () => {
  const elk = new ELK();
  const semantic = structuredClone(collapseScene);
  for (const orientation of ['horizontal', 'vertical']) {
    for (const viewport of [
      { width: 800, height: 600 },
      { width: 1920, height: 1080 },
    ]) {
      const settings = { orientation, viewport };
      const layouts = [];
      for (const collapsedGroupIds of [
        [],
        ['inner'],
        ['outer'],
        ['outer', 'inner'],
      ]) {
        const presentationState = { ...settings, collapsedGroupIds };
        const prepared = prepareV3LayoutInput(
          collapseScene,
          presentationState,
          {
            inner: { width: 175, height: 70 },
            outer: { width: 190, height: 80 },
          },
        );
        const input = buildV3ElkGraph(collapseScene, {
          ...settings,
          presentationState,
          measuredCards: {
            inner: { width: 175, height: 70 },
            outer: { width: 190, height: 80 },
          },
        });
        const output = await elk.layout(input);
        const layout = flattenV3ElkGraph(output, collapseScene, prepared);
        assert.deepEqual(
          layout.edges.map(({ id }) => id),
          prepared.edges.map(({ id }) => id),
        );
        assert.deepEqual(
          new Set([...layout.nodes, ...layout.groups].map(({ id }) => id)),
          new Set([...prepared.cards, ...prepared.regions].map(({ id }) => id)),
        );
        const positions = new Map(
          [...layout.nodes, ...layout.groups].map((record) => [
            record.id,
            record,
          ]),
        );
        for (const edge of layout.edges) {
          assert(
            onBoundary(edge.points[0], positions.get(edge.layoutSourceId)),
            `${orientation}: ${edge.id} source`,
          );
          assert(
            onBoundary(edge.points.at(-1), positions.get(edge.layoutTargetId)),
            `${orientation}: ${edge.id} target`,
          );
          assert.deepEqual(edge.underlyingEdgeIds, [edge.id]);
        }
        const parallelA = layout.edges.find(({ id }) => id === 'e:xz:a');
        const parallelB = layout.edges.find(({ id }) => id === 'e:xz:b');
        assert.notDeepEqual(
          parallelA.points,
          parallelB.points,
          `${orientation}: distinct parallel ELK routes`,
        );
        assert.equal(parallelA.label, 'parallel A');
        assert.equal(parallelB.label, 'parallel B');
        layouts.push(layout);
      }
      assert(
        layouts[2].width * layouts[2].height <
          layouts[0].width * layouts[0].height,
        `${orientation} outer collapse compacts bounding box`,
      );
      assert.deepEqual(collapseScene, semantic);
    }
  }
});

test('RED CA055: native nested edge.container is normalized exactly once', async () => {
  const presentationState = collapsePresentation;
  const prepared = prepareV3LayoutInput(collapseScene, presentationState);
  const raw = await new ELK().layout(
    buildV3ElkGraph(collapseScene, { ...options, presentationState }),
  );
  const local = raw.edges.find(({ id }) => id === 'e:wx');
  assert.equal(local.container, 'outer');
  const outer = raw.children.find(({ id }) => id === 'outer');
  assert(outer.x > 0 && outer.y > 0);
  const flat = flattenV3ElkGraph(raw, collapseScene, prepared);
  const edge = flat.edges.find(({ id }) => id === 'e:wx');
  const start = local.sections[0].startPoint;
  assert(Math.abs(edge.points[0].x - (start.x + outer.x)) < 1e-6);
  assert(Math.abs(edge.points[0].y - (start.y + outer.y)) < 1e-6);
  assert.notDeepEqual(edge.points[0], start);
  assert.deepEqual(
    raw.edges.find(({ id }) => id === 'e:wx'),
    local,
  );
});

test('RED CA055: projected flattener rejects an internally consistent but semantically incomplete visible edge subset', async () => {
  const prepared = prepareV3LayoutInput(collapseScene, collapsePresentation);
  const raw = await new ELK().layout(
    buildV3ElkGraph(collapseScene, { presentationState: collapsePresentation }),
  );
  const omitted = structuredClone(prepared);
  omitted.edges = omitted.edges.filter(({ id }) => id !== 'e:xz:b');
  const omittedLayout = structuredClone(raw);
  omittedLayout.edges = omittedLayout.edges.filter(({ id }) => id !== 'e:xz:b');
  assert.throws(
    () => flattenV3ElkGraph(omittedLayout, collapseScene, omitted),
    /Invalid V3 projection edge subset/,
  );
});

test('RED CA055: cursor-only changes reuse Worker pending and completed geometry', async () => {
  class FakeWorker {
    constructor() {
      this.messages = [];
      FakeWorker.instances.push(this);
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
    reply(data) {
      this.onmessage({ data });
    }
  }
  FakeWorker.instances = [];
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const presentationState = { ...options, collapsedGroupIds: [], cursor: 0 };
  const first = engine.layout(simpleScene, { presentationState });
  const pending = engine.layout(simpleScene, {
    presentationState: {
      ...presentationState,
      cursor: 2,
      activeEdgeIds: ['edge:1'],
    },
  });
  assert.equal(pending, first);
  assert.equal(FakeWorker.instances.length, 1);
  const worker = FakeWorker.instances[0];
  const id = worker.messages[0].id;
  worker.reply({ id });
  worker.reply({ id, data: simpleElk });
  const geometry = await first;
  assert.deepEqual(await pending, geometry);
  const replay = await engine.layout(simpleScene, {
    presentationState: { ...presentationState, cursor: 1 },
  });
  assert.equal(replay, geometry);
  assert.equal(FakeWorker.instances.length, 1);
  const newEpoch = engine.layout(simpleScene, {
    presentationState: { ...presentationState, expandedValueIds: ['value:1'] },
  });
  assert.equal(FakeWorker.instances.length, 2);
  engine.dispose();
  await assert.rejects(newEpoch, /disposed/);
});

function reverseObjectProperties(value) {
  if (Array.isArray(value)) return value.map(reverseObjectProperties);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .map(([key, entry]) => [key, reverseObjectProperties(entry)]),
  );
}

test('RED CA057: canonical full graph metadata changes key; clone property order does not', () => {
  const clone = structuredClone(collapseScene);
  const original = prepareV3LayoutInput(
    clone,
    collapsePresentation,
  ).topologyKey;
  assert.equal(
    original,
    prepareV3LayoutInput(reverseObjectProperties(clone), {
      ...collapsePresentation,
      collapsedGroupIds: new Set(['inner']),
    }).topologyKey,
    'equal semantic content with different object insertion order has one key',
  );
  function expectChange(change) {
    const variant = structuredClone(collapseScene);
    change(variant.graph);
    assert.notEqual(
      original,
      prepareV3LayoutInput(variant, collapsePresentation).topologyKey,
    );
  }
  expectChange((graph) => {
    graph.edges[0].label = 'different label only';
  });
  expectChange((graph) => {
    graph.edges[0].certainty = 'unresolved';
  });
  expectChange((graph) => {
    graph.nodes[0].label = 'changed node label';
  });
  expectChange((graph) => {
    graph.nodes[0].id = 'Χ';
    graph.groups[1].memberNodeIds = graph.groups[1].memberNodeIds.map((id) =>
      id === 'X' ? 'Χ' : id,
    );
    for (const edge of graph.edges) {
      if (edge.fromNodeId === 'X') edge.fromNodeId = 'Χ';
      if (edge.toNodeId === 'X') edge.toNodeId = 'Χ';
    }
  });
  expectChange((graph) => {
    graph.edges[0].toNodeId = 'W';
  });
  expectChange((graph) => {
    graph.nodes[2].groupPathIds = [];
    graph.groups[0].memberNodeIds = [];
  });
  expectChange((graph) => {
    graph.edges.reverse();
  });
  expectChange((graph) => {
    graph.nodes[0].order = -0;
  });
  const unicode = structuredClone(collapseScene);
  unicode.graph.nodes.push({
    ...unicode.graph.nodes[0],
    id: 'é',
    groupPathIds: [],
    order: 10,
  });
  unicode.graph.nodes.push({
    ...unicode.graph.nodes[0],
    id: 'e\u0301',
    groupPathIds: [],
    order: 11,
  });
  const sizeA = { width: 151, height: 91 };
  const sizeB = { width: 152, height: 92 };
  const first = prepareV3LayoutInput(
    unicode,
    collapsePresentation,
    new Map([
      ['é', sizeA],
      ['e\u0301', sizeB],
    ]),
  ).topologyKey;
  const second = prepareV3LayoutInput(
    unicode,
    collapsePresentation,
    new Map([
      ['e\u0301', sizeB],
      ['é', sizeA],
    ]),
  ).topologyKey;
  assert.equal(
    first,
    second,
    'Unicode-distinct measurement IDs sort by code units, independent of insertion order',
  );
  const invalid = structuredClone(collapseScene);
  invalid.graph.nodes[0].order = NaN;
  assert.throws(
    () => prepareV3LayoutInput(invalid, collapsePresentation),
    /Invalid V3 topology number/,
  );
});

test('RED CA057: returned geometry is deeply immutable without freezing caller variant', async () => {
  class FakeWorker {
    constructor() {
      FakeWorker.instance = this;
      this.messages = [];
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
    reply(data) {
      this.onmessage({ data });
    }
  }
  const variant = structuredClone(collapseScene);
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const pending = engine.layout(variant, {
    presentationState: collapsePresentation,
  });
  const worker = FakeWorker.instance;
  const id = worker.messages[0].id;
  worker.reply({ id });
  const native = await new ELK().layout(worker.messages[1].graph);
  worker.reply({ id, data: native });
  const geometry = await pending;
  assert(Object.isFrozen(geometry));
  assert(Object.isFrozen(geometry.nodes));
  assert(Object.isFrozen(geometry.nodes[0]));
  assert(Object.isFrozen(geometry.groups));
  assert(Object.isFrozen(geometry.groups[0]));
  assert(Object.isFrozen(geometry.edges[0].sections));
  assert(Object.isFrozen(geometry.edges[0].sections[0][0]));
  assert(Object.isFrozen(geometry.edges[0].underlyingEdgeIds));
  assert.throws(() => {
    geometry.nodes[0].id = 'CORRUPTED_BY_CONSUMER';
  }, TypeError);
  assert.throws(() => {
    geometry.groups[0].label = 'CORRUPTED';
  }, TypeError);
  assert.throws(() => {
    geometry.edges[0].sections[0][0].x = -900;
  }, TypeError);
  assert.throws(() => {
    geometry.edges[0].underlyingEdgeIds.push('phantom');
  }, TypeError);
  assert.equal(
    await engine.layout(variant, {
      presentationState: { ...collapsePresentation, cursor: 200 },
    }),
    geometry,
  );
  assert.equal(geometry.nodes[0].id, 'W');
  assert.equal(geometry.edges[0].underlyingEdgeIds.length, 1);
  assert.equal(FakeWorker.instance, worker);
  assert.equal(Object.isFrozen(variant.graph), false);
  variant.graph.nodes[0].label = 'caller owns this editable input';
  assert.equal(variant.graph.nodes[0].label, 'caller owns this editable input');
  engine.dispose();
});

test('RED CA057: midflight caller mutation cannot mix old Worker routing with new semantic metadata', async () => {
  class FakeWorker {
    constructor() {
      FakeWorker.instance = this;
      this.messages = [];
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
    reply(data) {
      this.onmessage({ data });
    }
  }
  const variant = structuredClone(collapseScene);
  const original = structuredClone(variant);
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const pending = engine.layout(variant, {
    presentationState: collapsePresentation,
  });
  const worker = FakeWorker.instance;
  const id = worker.messages[0].id;
  worker.reply({ id });
  const sentGraph = structuredClone(worker.messages[1].graph);
  variant.graph.nodes[0].label = 'MUTATED AFTER_DISPATCH';
  variant.graph.nodes[2].label = 'MUTATED AFTER_DISPATCH';
  variant.graph.groups[0].label = 'MUTATED AFTER_DISPATCH';
  variant.graph.edges[1].label = 'MUTATED AFTER_DISPATCH';
  variant.graph.edges[1].toNodeId = 'W';
  worker.reply({ id, data: await new ELK().layout(sentGraph) });
  const geometry = await pending;
  assert.equal(
    geometry.nodes.find(({ id }) => id === 'W').label,
    original.graph.nodes[2].label,
  );
  assert.equal(
    geometry.groups.find(({ id }) => id === 'outer').label,
    original.graph.groups[0].label,
  );
  const edge = geometry.edges.find(({ id }) => id === 'e:xz:a');
  assert.equal(edge.toNodeId, 'Z');
  assert.equal(edge.label, 'parallel A');
  assert.equal(edge.layoutTargetId, 'Z');
  assert.equal(
    geometry.topologyKey,
    prepareV3LayoutInput(original, collapsePresentation).topologyKey,
  );
  assert.notEqual(
    geometry.topologyKey,
    prepareV3LayoutInput(variant, collapsePresentation).topologyKey,
  );
  engine.dispose();
});

test('CA057: changed graph with identical revision dispatches a new Worker; single-entry cache evicts prior result', async () => {
  class FakeWorker {
    static instances = [];
    constructor() {
      this.messages = [];
      FakeWorker.instances.push(this);
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
    reply(data) {
      this.onmessage({ data });
    }
  }
  const variant = structuredClone(simpleScene);
  const original = structuredClone(variant.graph.edges[0]);
  const state = { ...options, collapsedGroupIds: [] };
  const elk = new ELK();
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  async function complete(promise) {
    const worker = FakeWorker.instances.at(-1);
    const id = worker.messages[0].id;
    worker.reply({ id });
    worker.reply({ id, data: await elk.layout(worker.messages[1].graph) });
    return promise;
  }
  const first = await complete(
    engine.layout(variant, { presentationState: state }),
  );
  variant.graph.edges[0].fromNodeId = 'node:two';
  variant.graph.edges[0].toNodeId = 'node:one';
  variant.graph.edges[0].label = 'reversed in same revision';
  const second = await complete(
    engine.layout(variant, { presentationState: state }),
  );
  assert.equal(FakeWorker.instances.length, 2);
  assert.notEqual(second, first);
  assert.equal(second.edges[0].fromNodeId, 'node:two');
  assert.equal(second.edges[0].toNodeId, 'node:one');
  assert.equal(second.edges[0].label, 'reversed in same revision');
  assert.equal(
    await engine.layout(variant, {
      presentationState: { ...state, cursor: 7 },
    }),
    second,
  );
  assert.equal(FakeWorker.instances.length, 2);
  variant.graph.edges[0] = original;
  const third = await complete(
    engine.layout(variant, { presentationState: state }),
  );
  assert.equal(
    FakeWorker.instances.length,
    3,
    'one-entry cache evicts the older key',
  );
  assert.notEqual(third, first);
  assert.equal(third.edges[0].fromNodeId, original.fromNodeId);
  engine.dispose();
});

test('CA057: graph change while Worker pending supersedes epoch and ignores stale reply', async () => {
  class FakeWorker {
    static instances = [];
    constructor() {
      this.messages = [];
      FakeWorker.instances.push(this);
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
    reply(data) {
      this.onmessage({ data });
    }
  }
  const variant = structuredClone(simpleScene);
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const state = { ...options, collapsedGroupIds: [] };
  const stale = engine.layout(variant, { presentationState: state });
  const staleWorker = FakeWorker.instances[0];
  variant.graph.edges[0].label = 'new semantic version same revision';
  const fresh = engine.layout(variant, { presentationState: state });
  await assert.rejects(stale, /Stale V3 layout request/);
  assert.equal(staleWorker.terminated, true);
  assert.equal(FakeWorker.instances.length, 2);
  staleWorker.reply({ id: staleWorker.messages[0].id });
  const worker = FakeWorker.instances[1];
  const id = worker.messages[0].id;
  worker.reply({ id });
  worker.reply({ id, data: simpleElk });
  assert.equal(
    (await fresh).edges[0].label,
    'new semantic version same revision',
  );
  engine.dispose();
});

test('CA057: frozen Worker result is readable by CA030 X6 cell-config consumer', async () => {
  class FakeWorker {
    constructor() {
      FakeWorker.instance = this;
      this.messages = [];
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
    reply(data) {
      this.onmessage({ data });
    }
  }
  class FakeGraph {
    constructor() {
      this.nodes = [];
      this.edges = [];
    }
    addNode(spec) {
      const cell = { ...spec, addChild() {} };
      this.nodes.push(cell);
      return cell;
    }
    addEdge(spec) {
      this.edges.push(spec);
      return spec;
    }
    dispose() {
      this.disposed = true;
    }
  }
  const container = {
    replaceChildren() {},
    setAttribute() {},
    addEventListener() {},
    removeEventListener() {},
  };
  const variant = structuredClone(simpleScene);
  variant.graph.edges[0].label = '';
  const engine = createV3SceneLayout({ WorkerClass: FakeWorker });
  const pending = engine.layout(variant, {
    presentationState: { ...options, collapsedGroupIds: [] },
  });
  const worker = FakeWorker.instance;
  const id = worker.messages[0].id;
  worker.reply({ id });
  worker.reply({ id, data: simpleElk });
  const frozen = await pending;
  assert(Object.isFrozen(frozen.edges[0].points[0]));
  const rendered = await renderV3Scene(
    container,
    variant,
    frozen,
    {},
    { GraphClass: FakeGraph },
  );
  assert.deepEqual(
    rendered.graph.nodes.map(({ id }) => id),
    ['node:one', 'node:two'],
  );
  assert.deepEqual(
    rendered.graph.edges.map(({ id }) => id),
    ['edge:1'],
  );
  assert.notEqual(rendered.graph.edges[0].source, frozen.edges[0].points[0]);
  assert.equal(Object.isFrozen(frozen.edges[0].points[0]), true);
  rendered.dispose();
  engine.dispose();
});

test('RED CA057: canonical key rejects a cyclic ancestor without exhausting the key budget', () => {
  const variant = structuredClone(simpleScene);
  // A large property makes the old unguarded serializer reach its 32 MiB
  // budget in only two visits. The pre-fix RED cannot run indefinitely.
  const cyclic = { payload: 'x'.repeat(17 * 1024 * 1024) };
  cyclic.self = cyclic;
  variant.graph.nodes[0].sourceRef = cyclic;
  assert.throws(
    () => prepareV3LayoutInput(variant, { viewport: options.viewport }),
    /Cyclic V3 topology/,
  );
});

test('CA057: canonical key accepts shared acyclic graph metadata references', () => {
  const shared = { fileId: 'source:shared', line: 7, endLine: 7 };
  const variant = structuredClone(simpleScene);
  variant.graph.nodes[0].sourceRef = shared;
  variant.graph.nodes[1].sourceRef = shared;
  const equivalent = structuredClone(variant);
  equivalent.graph.nodes[1].sourceRef = structuredClone(shared);
  const presentation = { viewport: options.viewport };
  assert.equal(
    prepareV3LayoutInput(variant, presentation).topologyKey,
    prepareV3LayoutInput(equivalent, presentation).topologyKey,
  );
});

test('CA058: ELK reserves native label dimensions for exact visible original edges', () => {
  for (const variant of [simpleScene, scene]) {
    for (const orientation of ['horizontal', 'vertical']) {
      const root = buildV3ElkGraph(variant, { ...options, orientation });
      assert.deepEqual(
        root.edges.map(({ id, sources, targets }) => [
          id,
          ...sources,
          ...targets,
        ]),
        variant.graph.edges.map(({ id, fromNodeId, toNodeId }) => [
          id,
          fromNodeId,
          toNodeId,
        ]),
      );
      for (const input of root.edges) {
        const original = variant.graph.edges.find(({ id }) => id === input.id);
        assert.equal(input.labels?.length, 1);
        assert.equal(input.labels[0].text, original.label);
        assert(Number.isFinite(input.labels[0].width));
        assert(Number.isFinite(input.labels[0].height));
        assert(input.labels[0].width >= 46);
        assert(input.labels[0].height >= 26);
      }
    }
  }
});

test('CA058: Unicode and multiline ELK reservations are conservative and immutable', () => {
  const variant = structuredClone(simpleScene);
  variant.graph.edges[0].label = 'සිංහල\n漢字漢字漢字漢字 🌟🌟🌟🌟';
  const before = structuredClone(variant);
  const input = buildV3ElkGraph(variant, options).edges[0];
  assert.equal(input.labels[0].text, before.graph.edges[0].label);
  assert(input.labels[0].width >= 148);
  assert(input.labels[0].height >= 40);
  assert.deepEqual(variant, before);
});

test('CA058: Arabic edge labels reserve conservative native ELK bounds', () => {
  const variant = structuredClone(simpleScene);
  variant.graph.edges[0].label = 'مسار الشرط\nعودة';
  const input = buildV3ElkGraph(variant, options).edges[0];
  assert.equal(input.labels[0].text, variant.graph.edges[0].label);
  assert(input.labels[0].width >= 90);
  assert(input.labels[0].height >= 40);
});

test('CA058: oversized edge labels fail closed under a finite resource budget', () => {
  const variant = structuredClone(simpleScene);
  variant.graph.edges[0].label = 'X'.repeat(200_000);
  assert.throws(
    () => buildV3ElkGraph(variant, options),
    /V3 edge label.*budget/,
  );
});

test('CA058: 10k original edge labels produce bounded, distinct ELK reservations', (t) => {
  const variant = structuredClone(simpleScene);
  const original = variant.graph.edges[0];
  variant.graph.edges = Array.from({ length: 10_000 }, (_, index) => ({
    ...original,
    id: `edge:bulk:${index}`,
    label: `next ${index}`,
  }));
  const start = performance.now();
  const input = buildV3ElkGraph(variant, options);
  const elapsed = performance.now() - start;
  assert.equal(input.edges.length, 10_000);
  assert.equal(new Set(input.edges.map(({ id }) => id)).size, 10_000);
  assert(input.edges.every(({ labels }) => labels.length === 1));
  assert.equal(input.edges[9999].labels[0].text, 'next 9999');
  t.diagnostic(`10k CA058 ELK label reservations: ${elapsed.toFixed(2)}ms`);
});

// CA059 D0: diagnostic-only mirror of the unchanged renderer's edge-label
// placement inputs. This is a test reconstruction, not renderer telemetry;
// preserve the original strict renderer exception after printing the evidence.
const ca059Collides = (a, b) =>
  a.x < b.x + b.width + 6 &&
  a.x + a.width + 6 > b.x &&
  a.y < b.y + b.height + 6 &&
  a.y + a.height + 6 > b.y;

test('CA059 D0: exact 6px clearance accepts contact and rejects 1px intrusion', () => {
  const box = { x: 0, y: 0, width: 10, height: 10 };
  for (const [clear, intruding] of [
    [{ x: 16, y: 0 }, { x: 15, y: 0 }],
    [{ x: -16, y: 0 }, { x: -15, y: 0 }],
    [{ x: 0, y: 16 }, { x: 0, y: 15 }],
    [{ x: 0, y: -16 }, { x: 0, y: -15 }],
  ]) {
    assert.equal(ca059Collides(box, { ...clear, width: 10, height: 10 }), false);
    assert.equal(ca059Collides(box, { ...intruding, width: 10, height: 10 }), true);
  }
});

// Fixed normal offsets are a declared finite search domain, not a change to
// the renderer's placement policy or a proof about all imaginable placements.
function ca059FiniteJointPlacement(variant, state, raw, geometry) {
  const maxLabels = 8;
  const maxIntervals = 20;
  const maxAssignments = 20_000;
  const deadline = performance.now() + 2_500;
  const normalGaps = [10, 6, 16];
  const originals = new Map(variant.graph.edges.map((edge) => [edge.id, edge]));
  const visible = geometry.edges.filter((edge) => originals.get(edge.id)?.label);
  const obstacleBoxes = [
    ...geometry.nodes,
    ...geometry.groups.map((group) => ({
      ...group,
      height: Math.min(42, group.height),
    })),
  ];
  const dimensions = (text) => {
    const lines = text.split('\n');
    return {
      width: Math.max(46, ...lines.map((line) => line.length * 6 + 20)),
      height: lines.length * 14 + 12,
    };
  };
  // Remove an OPEN forbidden interval; equality at the 6px boundary is legal.
  const subtract = (ranges, low, high) => ranges.flatMap(([left, right]) => {
    if (high <= left || low >= right) return [[left, right]];
    const remaining = [];
    if (low >= left) remaining.push([left, Math.min(low, right)]);
    if (high <= right) remaining.push([Math.max(high, left), right]);
    return remaining;
  });
  let truncatedIntervals = false;
  const domains = visible.map((edge) => {
    const original = originals.get(edge.id);
    const size = dimensions(original.label);
    const segments = [];
    for (let i = 1; i < edge.points.length; i++) {
      const a = edge.points[i - 1];
      const b = edge.points[i];
      if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) continue;
      const horizontal = a.y === b.y;
      const vertical = a.x === b.x;
      const length = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      if ((!horizontal && !vertical) || length < 32) continue;
      segments.push({ a, b, horizontal, length, index: i - 1 });
    }
    segments.sort((a, b) => b.length - a.length || a.index - b.index);
    const intervals = [];
    let clipped = false;
    for (const segment of segments) {
      for (const gap of normalGaps) {
        for (const side of [-1, 1]) {
          const axis = segment.horizontal ? 'x' : 'y';
          const fixed = segment.horizontal
            ? segment.a.y + (side < 0 ? -size.height - gap : gap)
            : segment.a.x + (side < 0 ? -size.width - gap : gap);
          const varyingSize = segment.horizontal ? size.width : size.height;
          const fixedSize = segment.horizontal ? size.height : size.width;
          const points = segment.horizontal
            ? [segment.a.x, segment.b.x]
            : [segment.a.y, segment.b.y];
          const sceneLimit = segment.horizontal ? geometry.width : geometry.height;
          const fixedLimit = segment.horizontal ? geometry.height : geometry.width;
          if (fixed < 0 || fixed + fixedSize > fixedLimit) continue;
          const left = Math.max(0, Math.min(...points) - varyingSize / 2);
          const right = Math.min(sceneLimit - varyingSize, Math.max(...points) - varyingSize / 2);
          if (left > right) continue;
          let free = [[left, right]];
          for (const obstacle of obstacleBoxes) {
            const obstacleFixed = obstacle[axis === 'x' ? 'y' : 'x'];
            const obstacleFixedSize = obstacle[axis === 'x' ? 'height' : 'width'];
            if (fixed >= obstacleFixed + obstacleFixedSize + 6 ||
                fixed + fixedSize + 6 <= obstacleFixed) continue;
            const obstacleAxis = obstacle[axis];
            const obstacleSize = obstacle[axis === 'x' ? 'width' : 'height'];
            free = subtract(free, obstacleAxis - varyingSize - 6, obstacleAxis + obstacleSize + 6);
          }
          for (const [low, high] of free) {
            if (intervals.length === maxIntervals) {
              clipped = true;
              break;
            }
            intervals.push({ axis, fixed, low, high, size, segment: segment.index, gap, side });
          }
          if (clipped) break;
        }
        if (clipped) break;
      }
      if (clipped) break;
    }
    truncatedIntervals ||= clipped;
    return { id: edge.id, original, intervals };
  });
  const exactFour = ['e:xz:a', 'e:xz:b', 'e:wx', 'e:yw'];
  if (visible.length > maxLabels || exactFour.some((id) => !domains.some((entry) => entry.id === id)))
    return { status: 'UNRESOLVED', reason: 'projection/label cap', visible: visible.map(({ id }) => id) };

  const boxAt = (domain, coordinate) => domain.axis === 'x'
    ? { x: coordinate, y: domain.fixed, ...domain.size }
    : { x: domain.fixed, y: coordinate, ...domain.size };
  const choices = [...domains].sort((a, b) =>
    a.intervals.length - b.intervals.length || a.id.localeCompare(b.id));
  const occupied = [];
  let attempts = 0;
  let timedOut = false;
  let solution = null;
  function search(index) {
    if (index === choices.length) {
      solution = occupied.map(({ id, box, interval }) => ({ id, box, interval }));
      return true;
    }
    if (attempts >= maxAssignments || performance.now() > deadline) {
      timedOut = true;
      return false;
    }
    const entry = choices[index];
    for (const interval of entry.intervals) {
      let free = [[interval.low, interval.high]];
      for (const { box } of occupied) {
        const otherFixed = box[interval.axis === 'x' ? 'y' : 'x'];
        const otherFixedSize = box[interval.axis === 'x' ? 'height' : 'width'];
        const fixedSize = interval.axis === 'x' ? interval.size.height : interval.size.width;
        if (interval.fixed >= otherFixed + otherFixedSize + 6 ||
            interval.fixed + fixedSize + 6 <= otherFixed) continue;
        free = subtract(free,
          box[interval.axis] - (interval.axis === 'x' ? interval.size.width : interval.size.height) - 6,
          box[interval.axis] + box[interval.axis === 'x' ? 'width' : 'height'] + 6);
      }
      for (const [low, high] of free) {
        // Endpoints and midpoint expose exact-contact and interior choices.
        for (const coordinate of new Set([(low + high) / 2, low, high])) {
          if (attempts >= maxAssignments || performance.now() > deadline) {
            timedOut = true;
            return false;
          }
          attempts++;
          const box = boxAt(interval, coordinate);
          if ([...obstacleBoxes, ...occupied.map((item) => item.box)]
            .some((obstacle) => ca059Collides(box, obstacle))) continue;
          occupied.push({ id: entry.id, box, interval: {
            axis: interval.axis, segment: interval.segment,
            gap: interval.gap, side: interval.side, low, high,
          } });
          if (search(index + 1)) return true;
          occupied.pop();
          if (timedOut) return false;
        }
      }
    }
    return false;
  }
  search(0);
  const target = geometry.edges.find(({ id }) => id === 'e:yw');
  const rawOrigins = new Map([[raw.id, { x: 0, y: 0 }]]);
  const queue = [raw];
  for (let i = 0; i < queue.length; i++) {
    const parent = queue[i];
    for (const child of parent.children ?? []) {
      const origin = rawOrigins.get(parent.id);
      rawOrigins.set(child.id, { x: origin.x + child.x, y: origin.y + child.y });
      queue.push(child);
    }
  }
  const collected = queue.flatMap((node) => (node.edges ?? [])
    .filter(({ id }) => id === 'e:yw')
    .map((edge) => ({ collection: node.id, edge })))[0];
  const native = collected?.edge.labels?.[0];
  const owner = collected?.edge.container ?? collected?.collection;
  const origin = rawOrigins.get(owner);
  const rawSection = collected?.edge.sections?.[0];
  const rawPoints = rawSection
    ? [rawSection.startPoint, ...(rawSection.bendPoints ?? []), rawSection.endPoint]
    : [];
  const sectionOwnerMatches = Boolean(origin && target?.sections?.[0] &&
    rawPoints.length === target.sections[0].length &&
    rawPoints.every(({ x, y }, index) =>
      Math.abs(x + origin.x - target.sections[0][index].x) < 1e-7 &&
      Math.abs(y + origin.y - target.sections[0][index].y) < 1e-7));
  const routeDistance = (label, offset) => {
    if (!label || !target?.points) return null;
    const center = { x: label.x + label.width / 2 + offset.x,
      y: label.y + label.height / 2 + offset.y };
    let shortest = Infinity;
    for (let i = 1; i < target.points.length; i++) {
      const a = target.points[i - 1];
      const b = target.points[i];
      const span = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
      const fraction = span ? Math.max(0, Math.min(1,
        ((center.x - a.x) * (b.x - a.x) + (center.y - a.y) * (b.y - a.y)) / span)) : 0;
      shortest = Math.min(shortest, Math.hypot(center.x - a.x - fraction * (b.x - a.x),
        center.y - a.y - fraction * (b.y - a.y)));
    }
    return Number(shortest.toFixed(3));
  };
  const report = {
    issue: 'CA059-finite-D0',
    case: { orientation: state.orientation, collapsedGroupIds: state.collapsedGroupIds },
    status: solution ? 'VALID_TEST_GEOMETRY_PENDING_X6_PIXELS'
      : timedOut || truncatedIntervals ? 'UNRESOLVED' : 'NO_SOLUTION_IN_SAMPLED_ASSIGNMENTS',
    limits: { labels: maxLabels, intervalsPerLabel: maxIntervals, attempts: maxAssignments, milliseconds: 2500 },
    actual: { visibleLabels: visible.length, attempts, truncatedIntervals, timedOut },
    searchCompleteness: 'Exact continuous obstacle-free intervals; only low/mid/high sampled per interval after reservations. No global continuous infeasibility proof.',
    declaredNormalGapsPx: normalGaps,
    intervals: domains.map(({ id, intervals }) => ({
      id, count: intervals.length,
      ranges: id === 'e:yw' ? intervals.map(({ axis, fixed, low, high, gap, side, segment }) =>
        ({ axis, fixed, low, high, gap, side, segment })) : undefined,
    })),
    originalSemanticLabels: visible.map(({ id }) => ({
      id, from: originals.get(id).fromNodeId, to: originals.get(id).toNodeId,
      label: originals.get(id).label, status: originals.get(id).executionStatus,
    })),
    nativeLabelFrame: native ? {
      collection: collected.collection, reportedContainer: collected.edge.container ?? null,
      sectionOwner: owner, ownerOrigin: origin ?? null,
      sectionOwnerMatchesFlattenedWorld: sectionOwnerMatches,
      raw: { x: native.x, y: native.y, width: native.width, height: native.height },
      ownerTranslated: origin ? { x: native.x + origin.x, y: native.y + origin.y } : null,
      distanceToWorldRoutePx: {
        collectionFrame: routeDistance(native, { x: 0, y: 0 }),
        containerFrame: origin ? routeDistance(native, origin) : null,
      },
      classification: 'frame inferred by route proximity, NOT independently verified; X6 ignores raw ELK label coordinates',
    } : null,
    unchangedRoute: target?.points,
    solution,
    performance: 'Node test-only interval/assignment CPU; not ELK Worker or X6 glyph timing',
  };
  return report;
}

test('CA059 D0: finite joint assignment retains four original IDs and rejects fully obstructed routes', () => {
  const ids = ['e:xz:a', 'e:xz:b', 'e:wx', 'e:yw'];
  const variant = { graph: { edges: ids.map((id) => ({
    id, fromNodeId: 'X', toNodeId: 'W', label: id,
  })) } };
  const geometry = {
    width: 400, height: 300, nodes: [], groups: [],
    edges: ids.map((id, index) => ({
      id, points: [{ x: 40, y: 35 + index * 60 }, { x: 360, y: 35 + index * 60 }],
    })),
  };
  const state = { orientation: 'horizontal', collapsedGroupIds: ['inner'] };
  const raw = { id: 'root', children: [], edges: [] };
  const valid = ca059FiniteJointPlacement(variant, state, raw, geometry);
  assert.equal(valid.status, 'VALID_TEST_GEOMETRY_PENDING_X6_PIXELS');
  assert.deepEqual(new Set(valid.solution.map(({ id }) => id)), new Set(ids));
  for (const [index, { id, box }] of valid.solution.entries()) {
    assert.equal(box.width, Math.max(46, id.length * 6 + 20));
    for (const later of valid.solution.slice(index + 1))
      assert.equal(ca059Collides(box, later.box), false);
  }
  const blocked = structuredClone(geometry);
  blocked.nodes.push({ id: 'obstruction', x: 0, y: 0, width: 400, height: 300 });
  assert.equal(ca059FiniteJointPlacement(variant, state, raw, blocked).status,
    'NO_SOLUTION_IN_SAMPLED_ASSIGNMENTS');
});

// One-factor probes only. The bundled ELK registry supplies supported option
// IDs, numeric types and defaults; no option ID is fabricated by this test.
async function ca059FiniteElkOptions(elk, variant, state, input, container, GraphClass) {
  const started = performance.now();
  const maxTrials = 12;
  const timeBudgetMs = 15_000;
  let known;
  try {
    known = await elk.knownLayoutOptions();
    if (!Array.isArray(known)) throw new Error('ELK option registry is not an array');
  } catch (error) {
    return { phase: 'finite one-factor native ELK variations', status: 'UNRESOLVED_NO_VERIFIED_REGISTRY',
      reason: String(error?.message).slice(0, 160) };
  }
  const candidates = known.filter((option) => {
    const description = `${option.id ?? ''} ${option.name ?? ''}`.toLowerCase();
    const numeric = Number(option.defaultValue);
    return /spacing/.test(description) && /(edge.*label|label.*edge|edge.*node|node.*edge|edge.*edge)/.test(description) &&
      /double|float|integer|int/i.test(option.type ?? '') &&
      Number.isFinite(numeric) && numeric >= 0;
  }).sort((a, b) => a.id.localeCompare(b.id)).slice(0, 6);
  const prepared = prepareV3LayoutInput(variant, state);
  const originalById = new Map(variant.graph.edges.map((edge) => [edge.id, edge]));
  const probes = [];
  let timeCapped = false;
  for (const option of candidates) {
    for (const scope of ['root', 'outer']) {
      if (probes.length >= maxTrials || performance.now() - started > timeBudgetMs) {
        timeCapped = true;
        break;
      }
      const detached = structuredClone(input);
      const target = scope === 'root'
        ? detached : detached.children.find(({ id }) => id === 'outer');
      if (!target?.layoutOptions) continue;
      const old = Number(option.defaultValue);
      const value = Number(Math.max(old * 1.5, old + 6, 12).toFixed(3));
      target.layoutOptions[option.id] = String(value);
      const trial = { option: option.id, scope, fromDefault: old, value };
      const start = performance.now();
      try {
        const raw = await elk.layout(detached);
        trial.elkMainThreadMs = Number((performance.now() - start).toFixed(2));
        const geometry = flattenV3ElkGraph(raw, variant, prepared);
        trial.scene = { width: geometry.width, height: geometry.height };
        trial.areaRatio = Number((geometry.width * geometry.height / (1128 * 296)).toFixed(3));
        trial.reviewAlarm = trial.areaRatio > 1.25 ||
          geometry.width > 1128 * 1.2 || geometry.height > 296 * 1.2;
        trial.targetRoute = geometry.edges.find(({ id }) => id === 'e:yw')?.points ?? null;
        try {
          const painted = await renderV3Scene(container, variant, geometry, state, {
            GraphClass,
          });
          const correct = painted.graph.edges.length === prepared.edges.length &&
            painted.graph.edges.every((edge) =>
              edge.labels?.length === 1 &&
              edge.labels[0].attrs.label.text === originalById.get(edge.id)?.label);
          trial.strictRenderer = correct ? 'GREEN_TEST_CONFIG' : 'SEMANTIC_MISMATCH';
          painted.dispose();
        } catch (error) {
          trial.strictRenderer = 'RED';
          trial.failedAt = String(error?.message).slice(0, 160);
        }
      } catch (error) {
        trial.strictRenderer = 'INVALID_LAYOUT';
        trial.failedAt = String(error?.message).slice(0, 160);
      }
      probes.push(trial);
    }
    if (timeCapped) break;
  }
  return {
    phase: 'finite one-factor native ELK variations',
    case: { orientation: state.orientation, collapsedGroupIds: state.collapsedGroupIds },
    status: timeCapped || performance.now() - started > timeBudgetMs
      ? 'UNRESOLVED_TIME_CAP'
      : candidates.length ? 'BOUNDED_PROBES_FINISHED' : 'UNRESOLVED_NO_VERIFIED_OPTIONS',
    registrySupportedCandidates: candidates.map(({ id, type, defaultValue }) =>
      ({ id, type, defaultValue })),
    caps: { trials: maxTrials, elapsedMs: timeBudgetMs,
      note: 'soft alarm checked between layouts; individual synchronous ELK calls cannot be interrupted' },
    actual: { trials: probes.length, elapsedMs: Number((performance.now() - started).toFixed(2)) },
    measurement: 'synchronous bundled ELK Node layout, NOT 30s Worker/X6 DOM or 10k preparation',
    visual: '900x600 actual glyph checks and seven browser screenshots still required',
    probes,
  };
}

function ca059TraceFailedOriginalLabel(variant, state, input, raw, geometry) {
  const targetId = 'e:yw';
  const original = variant.graph.edges.find(({ id }) => id === targetId);
  const target = geometry.edges.find(({ id }) => id === targetId);
  if (!original || !target) return 'CA059 target absent from projection';
  const number = (value) =>
    Number.isFinite(value) ? Number(value.toFixed(3)) : null;
  const point = ({ x, y }) => ({ x: number(x), y: number(y) });
  const rectangle = ({ x, y, width, height }) => ({
    x: number(x),
    y: number(y),
    width: number(width),
    height: number(height),
  });
  const obstacles = [
    ...geometry.nodes.map((node) => ({
      id: node.id,
      kind: 'node',
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    })),
    ...geometry.groups.map((group) => ({
      id: group.id,
      kind: 'group-header',
      x: group.x,
      y: group.y,
      width: group.width,
      height: Math.min(42, group.height),
    })),
  ];
  if (obstacles.length > 128)
    return JSON.stringify({
      issue: 'CA059-D0',
      case: { orientation: state.orientation, collapsedGroupIds: state.collapsedGroupIds },
      targetId,
      obstacleCount: obstacles.length,
      diagnosticsTruncated: '128-obstacle investigation cap',
    });
  const reserved = [];
  const preceding = [];
  const byId = new Map(variant.graph.edges.map((edge) => [edge.id, edge]));
  for (const edge of geometry.edges) {
    if (edge.id === targetId) break;
    const label = byId.get(edge.id)?.label;
    if (!label) continue;
    const placement = reserveRouteLabel(edge.points, label, obstacles, reserved);
    preceding.push({
      id: edge.id,
      placed: Boolean(placement),
      box: placement ? rectangle(placement) : null,
    });
    if (!placement) break;
  }
  const lines = original.label.split('\n');
  const width = Math.max(46, ...lines.map((line) => line.length * 6 + 20));
  const height = lines.length * 14 + 12;
  const collides = (a, b) =>
    a.x < b.x + b.width + 6 &&
    a.x + a.width + 6 > b.x &&
    a.y < b.y + b.height + 6 &&
    a.y + a.height + 6 > b.y;
  const segments = [];
  const skipped = { short: 0, diagonal: 0, nonfinite: 0 };
  for (let i = 1; i < target.points.length; i++) {
    const a = target.points[i - 1];
    const b = target.points[i];
    if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) {
      skipped.nonfinite++;
      continue;
    }
    const horizontal = a.y === b.y;
    const vertical = a.x === b.x;
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (!horizontal && !vertical) skipped.diagonal++;
    else if (length < 32) skipped.short++;
    else segments.push({ a, b, horizontal, length, index: i - 1 });
  }
  segments.sort((a, b) => b.length - a.length);
  const candidates = [];
  let totalCandidates = 0;
  let firstAccepted = null;
  candidateSearch: for (const segment of segments) {
    for (const ratio of [0.5, 0.25, 0.75, 0.125, 0.875]) {
      const midX = segment.a.x + (segment.b.x - segment.a.x) * ratio;
      const midY = segment.a.y + (segment.b.y - segment.a.y) * ratio;
      for (const side of [-1, 1]) {
        if (totalCandidates >= 32) break candidateSearch;
        const box = segment.horizontal
          ? {
              x: midX - width / 2,
              y: midY + (side < 0 ? -height - 10 : 10),
              width,
              height,
            }
          : {
              x: midX + (side < 0 ? -width - 10 : 10),
              y: midY - height / 2,
              width,
              height,
            };
        const obstacle = obstacles.find((item) => collides(box, item));
        const reservation = reserved.findIndex((item) => collides(box, item));
        const rejectedBy = obstacle
          ? { kind: obstacle.kind, id: obstacle.id }
          : reservation >= 0
            ? { kind: 'preceding-label', id: preceding[reservation]?.id ?? '?' }
            : null;
        const collidingBox = obstacle ?? (reservation >= 0 ? reserved[reservation] : null);
        totalCandidates++;
        if (candidates.length < 32)
          candidates.push({
            segment: segment.index,
            ratio,
            side,
            box: rectangle(box),
            rejectedBy,
            // Positive values on all axes are the unchanged helper's 6px
            // asymmetric-overlap inequalities (unrounded input arithmetic).
            overlapTerms: collidingBox
              ? {
                  left: number(collidingBox.x + collidingBox.width + 6 - box.x),
                  right: number(box.x + box.width + 6 - collidingBox.x),
                  top: number(collidingBox.y + collidingBox.height + 6 - box.y),
                  bottom: number(box.y + box.height + 6 - collidingBox.y),
                }
              : null,
          });
        if (!rejectedBy && !firstAccepted)
          firstAccepted = { segment: segment.index, ratio, side };
      }
    }
  }
  // ELK edge sections can be owned by a nested container even when listed on
  // root.edges; make coordinate ownership explicit and do not mutate raw data.
  const origins = new Map([[raw.id, { x: 0, y: 0 }]]);
  const owners = [{ node: raw, origin: { x: 0, y: 0 } }];
  for (let i = 0; i < owners.length; i++) {
    const { node, origin } = owners[i];
    for (const child of node.children ?? []) {
      const at = { x: origin.x + child.x, y: origin.y + child.y };
      if (!origins.has(child.id)) {
        origins.set(child.id, at);
        owners.push({ node: child, origin: at });
      }
    }
  }
  let rawEdge = null;
  for (const { node, origin } of owners) {
    const edge = (node.edges ?? []).find(({ id }) => id === targetId);
    if (!edge) continue;
    const relativeTo = edge.container ?? node.id;
    const ownerOrigin = origins.get(relativeTo);
    const sections = (edge.sections ?? []).slice(0, 8).map((section) => {
      const local = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
        .filter(Boolean)
        .slice(0, 16);
      return {
        local: local.map(point),
        inferredWorld: ownerOrigin
          ? local.map(({ x, y }) => point({ x: x + ownerOrigin.x, y: y + ownerOrigin.y }))
          : null,
      };
    });
    rawEdge = {
      collectionId: node.id,
      collectionOrigin: point(origin),
      reportedContainerId: edge.container ?? null,
      inferredSectionOwnerId: relativeTo,
      inferredSectionOwnerOrigin: ownerOrigin ? point(ownerOrigin) : null,
      sectionCount: (edge.sections ?? []).length,
      sections,
      elkLabels: (edge.labels ?? []).slice(0, 2).map((label) => ({
        ...rectangle(label),
        textCodeUnits: label.text?.length ?? null,
      })),
    };
    break;
  }
  const trace = {
    issue: 'CA059-D0',
    evidenceType: 'test-only reconstruction; renderer exception observed',
    case: {
      fixture: 'collapseScene',
      orientation: state.orientation,
      collapsedGroupIds: state.collapsedGroupIds,
    },
    original: {
      id: original.id,
      source: original.fromNodeId,
      target: original.toNodeId,
      label: original.label,
      rendererBox: { width, height },
      nativeElkBox: input.edges.find(({ id }) => id === targetId)?.labels?.[0] ?? null,
    },
    rawEdge,
    flattened: {
      scene: { width: number(geometry.width), height: number(geometry.height) },
      points: target.points.slice(0, 32).map(point),
      pointCount: target.points.length,
      sections: target.sections?.slice(0, 8).map((section) => section.slice(0, 16).map(point)) ?? null,
    },
    rendererObstacleCount: obstacles.length,
    obstacles: obstacles.slice(0, 128).map((item) => ({
      id: item.id,
      kind: item.kind,
      ...rectangle(item),
    })),
    precedingReservations: preceding.slice(0, 32),
    skippedSegments: skipped,
    eligibleSegments: segments.slice(0, 16).map(({ a, b, length, index }) => ({
      index,
      from: point(a),
      to: point(b),
      length: number(length),
    })),
    candidateCount: totalCandidates,
    candidateSearchTruncated: segments.length * 10 > 32,
    candidates,
    reconstructionFirstAccepted: firstAccepted,
    unchangedHelperMirror: reserveRouteLabel(
      target.points,
      original.label,
      obstacles,
      reserved.slice(),
    ) == null
      ? null
      : 'position-available',
    diagnosticCaps: { edgeCount: 1, obstacles: 128, candidates: 32, bytes: 16384 },
  };
  let serialized = JSON.stringify(trace);
  if (Buffer.byteLength(serialized, 'utf8') > 16384)
    serialized = JSON.stringify({
      issue: trace.issue,
      case: trace.case,
      original: trace.original,
      totalBytesBeforeCap: Buffer.byteLength(serialized, 'utf8'),
      diagnosticsTruncated: true,
    });
  return serialized;
}

test('CA058: official ELK/X6 preflight preserves original labels across orientations and nested collapse', async (t) => {
  class FakeGraph {
    constructor() {
      this.nodes = [];
      this.edges = [];
    }
    addNode(spec) {
      const cell = { ...spec, addChild() {} };
      this.nodes.push(cell);
      return cell;
    }
    addEdge(spec) {
      this.edges.push(spec);
      return spec;
    }
    dispose() {}
  }
  const container = {
    replaceChildren() {},
    setAttribute() {},
    addEventListener() {},
    removeEventListener() {},
  };
  const elk = new ELK();
  const variants = [
    { variant: simpleScene, collapsedGroupIds: [] },
    { variant: scene, collapsedGroupIds: [] },
    { variant: collapseScene, collapsedGroupIds: [] },
    { variant: collapseScene, collapsedGroupIds: ['inner'] },
    { variant: collapseScene, collapsedGroupIds: ['outer'] },
  ];
  for (const { variant, collapsedGroupIds } of variants) {
    for (const orientation of ['horizontal', 'vertical']) {
      const state = { ...options, orientation, collapsedGroupIds };
      const input = buildV3ElkGraph(variant, {
        ...state,
        presentationState: state,
      });
      const prepared = prepareV3LayoutInput(variant, state);
      assert.deepEqual(
        input.edges.map(({ id }) => id),
        prepared.edges.map(({ id }) => id),
      );
      for (const edge of input.edges) {
        const original = variant.graph.edges.find(({ id }) => id === edge.id);
        assert.equal(edge.labels[0].text, original.label);
      }
      const raw = await elk.layout(input);
      const geometry = flattenV3ElkGraph(raw, variant, prepared);
      let painted;
      try {
        painted = await renderV3Scene(container, variant, geometry, state, {
          GraphClass: FakeGraph,
        });
      } catch (error) {
        if (
          variant === collapseScene &&
          error?.message === 'No collision-free V3 edge label position for e:yw'
        ) {
          try {
            const originalTrace = ca059TraceFailedOriginalLabel(variant, state, input, raw, geometry);
            t.diagnostic(originalTrace);
            const phase1 = ca059FiniteJointPlacement(variant, state, raw, geometry);
            const phase2 = phase1.status === 'VALID_TEST_GEOMETRY_PENDING_X6_PIXELS'
              ? { status: 'SKIPPED_VALID_PHASE1' }
              : await ca059FiniteElkOptions(elk, variant, state, input, container, FakeGraph);
            const finiteTrace = JSON.stringify({ phase1, phase2 });
            const remaining = 16_384 - Buffer.byteLength(originalTrace, 'utf8');
            if (remaining > 256)
              t.diagnostic(Buffer.byteLength(finiteTrace, 'utf8') <= remaining
                ? finiteTrace
                : JSON.stringify({ issue: 'CA059-finite-D0', status: 'UNRESOLVED',
                    reason: '16KiB trace limit', traceBytes: Buffer.byteLength(finiteTrace, 'utf8') }));
          } catch (diagnosticError) {
            t.diagnostic(
              `CA059 D0 trace failed: ${String(diagnosticError?.message).slice(0, 160)}`,
            );
          }
        }
        throw error;
      }
      assert.deepEqual(
        painted.graph.edges.map(({ id }) => id),
        prepared.edges.map(({ id }) => id),
      );
      assert(
        painted.graph.edges.every(({ labels }) => labels.length === 1),
        `${orientation}/${collapsedGroupIds.join(',') || 'expanded'}: original visible labels`,
      );
      for (const edge of painted.graph.edges) {
        const original = variant.graph.edges.find(({ id }) => id === edge.id);
        assert.equal(edge.labels[0].attrs.label.text, original.label);
      }
      painted.dispose();
    }
  }
});
