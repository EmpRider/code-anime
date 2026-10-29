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
    'MULTI_EDGE',
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
  }
});
