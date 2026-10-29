import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ELK from 'elkjs/lib/elk.bundled.js';
import {
  buildV3ElkGraph,
  flattenV3ElkGraph,
  createV3SceneLayout,
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
