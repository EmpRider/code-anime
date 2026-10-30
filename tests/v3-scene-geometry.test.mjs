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
