import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { createRoutePlanner } from '../public/diagram-routing.js';

const intersects = (a, b, box) =>
  a.x === b.x
    ? a.x > box.x &&
      a.x < box.x + box.width &&
      Math.max(a.y, b.y) > box.y &&
      Math.min(a.y, b.y) < box.y + box.height
    : a.y > box.y &&
      a.y < box.y + box.height &&
      Math.max(a.x, b.x) > box.x &&
      Math.min(a.x, b.x) < box.x + box.width;
const overlap = (a, b, c, d) =>
  a.x === b.x && c.x === d.x && a.x === c.x
    ? Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) >
      Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y))
    : a.y === b.y &&
      c.y === d.y &&
      a.y === c.y &&
      Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) >
        Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x));

for (const vertical of [false, true]) {
  for (const expandedValues of [false, true]) {
    const boxes = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      x: (i % 4) * 274 + 0.5,
      y: Math.floor(i / 4) * (expandedValues ? 336 : 176) + 0.5,
      width: 210,
      height: expandedValues ? 272 : 112,
    }));
    if (vertical)
      for (const box of boxes)
        [box.x, box.y, box.width, box.height] = [
          box.y,
          box.x,
          box.height,
          box.width,
        ];
    const original = structuredClone(boxes),
      planner = createRoutePlanner(boxes),
      routes = [];
    const pairs = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 7],
      [7, 6],
      [6, 5],
      [5, 4],
      [4, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [1, 11],
      [11, 1],
      [2, 8],
      [8, 2],
    ];
    for (const [from, to] of pairs) {
      const route = planner.route(
        boxes[from],
        boxes[to],
        from > to ? 'work returns\n1000 (simulated)' : '',
      );
      assert.ok(route, `route ${from} to ${to}`);
      for (let i = 1; i < route.points.length; i++) {
        const a = route.points[i - 1],
          b = route.points[i];
        assert.ok(a.x === b.x || a.y === b.y, 'orthogonal');
        for (const box of boxes)
          assert.ok(
            !intersects(a, b, box),
            `card clearance ${from} to ${to} / ${box.id}`,
          );
        for (const previous of routes) {
          for (let j = 1; j < previous.points.length; j++)
            assert.ok(
              !overlap(a, b, previous.points[j - 1], previous.points[j]),
              'no shared arrow segments',
            );
          if (previous.label)
            assert.ok(
              !intersects(a, b, previous.label.box),
              'reserved label clearance',
            );
        }
      }
      if (route.label)
        for (const previous of [...routes, route])
          for (let i = 1; i < previous.points.length; i++)
            assert.ok(
              !intersects(
                previous.points[i - 1],
                previous.points[i],
                route.label.box,
              ),
              'label avoids every arrow',
            );
      routes.push(route);
    }
    assert.deepEqual(boxes, original, 'layout not mutated');
    assert.deepEqual(
      createRoutePlanner(boxes).route(boxes[0], boxes[1]),
      routes[0],
      'deterministic',
    );
  }
}
for (const side of ['top', 'bottom', 'left', 'right']) {
  const source = {
    id: 'decision',
    x: 100.5,
    y: 100.5,
    width: 260,
    height: 164,
    shape: 'diamond',
    centered: true,
    sides: [side],
  };
  const target = {
    id: 'next',
    x: side === 'left' ? -300 : side === 'right' ? 600 : 100.5,
    y: side === 'top' ? -300 : side === 'bottom' ? 500 : 100.5,
    width: 260,
    height: 164,
    shape: 'diamond',
    centered: true,
    sides: [
      { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side],
    ],
  };
  const route = createRoutePlanner([source, target]).route(source, target);
  assert.ok(route, `diamond ${side} route`);
  for (const [point, box] of [
    [route.points[0], source],
    [route.points.at(-1), target],
  ]) {
    const perimeter =
      Math.abs(point.x - box.x - box.width / 2) / (box.width / 2) +
      Math.abs(point.y - box.y - box.height / 2) / (box.height / 2);
    assert.ok(
      Math.abs(perimeter - 1) < 1e-10,
      'endpoint touches visible diamond',
    );
  }
  const [start, next] = route.points;
  assert.ok(
    side === 'top'
      ? next.y < start.y
      : side === 'bottom'
        ? next.y > start.y
        : side === 'left'
          ? next.x < start.x
          : next.x > start.x,
    'directed exit',
  );
}
const sealed = [
  { id: 'source', x: 20, y: 20, width: 100, height: 100 },
  { id: 'wall', x: 0, y: 0, width: 140, height: 140 },
  { id: 'target', x: 300, y: 0, width: 100, height: 100 },
];
assert.equal(
  createRoutePlanner(sealed).route(sealed[0], sealed[2]),
  null,
  'no unsafe fallback',
);
console.log(
  'Routing: orthogonal, obstacle-free, separate lanes, labels, values, vertical, bounded failure passed',
);

// Exercise the actual createDiagram renderer. X6's browser-only presentation
// boundary, not the semantic/topology/Worker adapter under test, is doubled.
const x6Boundary = `
export const Config = {};
const shapes = new Map();
export const Shape = { HTML: { register(shape) { shapes.set(shape.shape, shape); } } };
class Cell {
  constructor(graph, options, edge = false) {
    this.graph = graph;
    this.id = options.id ?? 'edge-' + graph.cells.size;
    this.options = options;
    this.data = options.data ?? {};
    this.attrs = structuredClone(options.attrs ?? {});
    this.edge = edge;
    this.children = [];
    if (!edge) this.paint();
  }
  paint() {
    this.view?.remove();
    this.view = document.createElement('div');
    this.view.dataset.cellId = this.id;
    const shape = shapes.get(this.options.shape);
    if (shape) this.view.append(shape.html(this));
    this.graph.container.append(this.view);
  }
  getData() { return this.data; }
  setData(value) { this.data = value; this.paint(); }
  position() { return { x: this.options.x, y: this.options.y }; }
  getBBox() { return { x: this.options.x, y: this.options.y, width: this.options.width, height: this.options.height }; }
  addChild(cell) { cell.parent = this; this.children.push(cell); }
  getTargetCellId() { return this.options.target?.cell ?? this.options.target; }
  attr(path, value) {
    const keys = path.split('/');
    let node = this.attrs;
    for (const key of keys.slice(0, -1)) node = node[key] ??= {};
    if (arguments.length === 1) return node[keys.at(-1)];
    node[keys.at(-1)] = value;
  }
}
export class Graph {
  constructor(options) {
    this.container = options.container;
    this.cells = new Map();
    this.events = new Map();
    this.scale = 1;
    this.offset = { tx: 0, ty: 0 };
    globalThis.__diagramGraph = this;
  }
  on(name, handler) { this.events.set(name, handler); }
  addNode(options) { return this.add(options, false); }
  addEdge(options) { return this.add(options, true); }
  add(options, edge) {
    const cell = new Cell(this, options, edge);
    this.cells.set(cell.id, cell);
    return cell;
  }
  clearCells() { for (const cell of this.cells.values()) cell.view?.remove(); this.cells.clear(); }
  getNodes() { return [...this.cells.values()].filter(cell => !cell.edge); }
  getCellById(id) { return this.cells.get(id); }
  findViewByCell(cell) { return { container: cell.view }; }
  zoom(value) { return this.scale; }
  zoomTo(value) { this.scale = value; this.events.get('scale')?.(); }
  zoomToFit() { this.scale = 1; this.fitCalls = (this.fitCalls ?? 0) + 1; this.events.get('scale')?.(); }
  translate(x, y) { if (x === undefined) return this.offset; this.offset = { tx: x, ty: y }; this.events.get('translate')?.(); }
  localToClient(bounds) { return bounds; }
  resize() {}
  centerCell() {}
  dispose() { this.clearCells(); }
}
`;

let rendererImport;
async function renderer() {
  if (!rendererImport) {
    const result = await build({
      entryPoints: [new URL('../public/diagram.js', import.meta.url).pathname],
      bundle: true,
      platform: 'browser',
      format: 'esm',
      write: false,
      plugins: [
        {
          name: 'external-x6-css-boundary',
          setup(plugin) {
            plugin.onResolve({ filter: /^@antv\/x6$/ }, () => ({
              path: 'x6',
              namespace: 'test',
            }));
            plugin.onLoad({ filter: /^x6$/, namespace: 'test' }, () => ({
              contents: x6Boundary,
              loader: 'js',
            }));
            plugin.onResolve({ filter: /\.css$/ }, () => ({
              path: 'css',
              namespace: 'test',
            }));
            plugin.onLoad({ filter: /^css$/, namespace: 'test' }, () => ({
              contents: '',
              loader: 'js',
            }));
          },
        },
      ],
    });
    rendererImport = import(
      'data:text/javascript;base64,' +
        Buffer.from(result.outputFiles[0].text).toString('base64')
    );
  }
  return (await rendererImport).createDiagram;
}

const source = `function run() {
  while (ready) {
    if (ok) {
      tick();
    } else {
      skip();
    }
  }
  return value;
}
function helper() {
  return 42;
}`;
const event = (
  kind,
  line,
  i,
  callId = 'run',
  symbolId = 'run',
  extra = {},
) => ({
  id: `event-${i}`,
  kind,
  source: { file: 'fixture.ts', line },
  callId,
  symbolId,
  label: `${kind} ${i}`,
  certainty: 'mock',
  values: {},
  stack: [callId],
  ...extra,
});
const events = [
  event('enter', 1, 1),
  event('loop', 2, 2),
  event('branch', 3, 3, 'run', 'run', { values: { condition: true } }),
  event('statement', 4, 4),
  event('loop', 2, 5),
  event('statement', 4, 6),
  event('return', 9, 7),
];
const fixture = (items = events) => ({
  endpoint: 'run',
  steps: items.map((entry) => ({
    from: entry.symbolId,
    to: entry.symbolId,
    dtoName: entry.label,
  })),
  trace: { events: items, sourceFiles: { 'fixture.ts': source } },
});

// The fake only stands in for the genuine native Worker outside Node's DOM.
// It accepts actual T4 protocol messages; tests control when replies arrive.
class PendingWorker {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.requests = [];
    PendingWorker.instances.push(this);
  }
  postMessage(message) {
    if (message.cmd === 'register') {
      queueMicrotask(() => this.onmessage?.({ data: { id: message.id } }));
    } else if (message.cmd === 'layout') this.requests.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  resolve() {
    const message = this.requests.shift();
    assert.ok(message, 'a real layout request must be pending');
    const graph = structuredClone(message.graph);
    const absolute = new Map();
    function measure(node, x = 0, y = 0) {
      let nextY = 40;
      for (const child of node.children ?? []) {
        child.x = 16;
        child.y = nextY;
        measure(child, x + child.x, y + child.y);
        nextY += child.height + 16;
      }
      node.width ??= Math.max(
        292,
        ...(node.children ?? []).map((child) => child.width + 32),
      );
      node.height ??= Math.max(180, nextY + 16);
      if (node.id !== 'control-flow')
        absolute.set(node.id, { x, y, width: node.width, height: node.height });
    }
    measure(graph);
    graph.edges = graph.edges.map((edge) => {
      const from = absolute.get(edge.sources[0]);
      const to = absolute.get(edge.targets[0]);
      assert.ok(from && to, 'ELK requested known endpoints');
      const startPoint = {
        x: from.x + from.width / 2,
        y: from.y + from.height,
      };
      const endPoint = { x: to.x + to.width / 2, y: to.y };
      return {
        ...edge,
        sections: [
          {
            startPoint,
            endPoint,
            bendPoints: [{ x: startPoint.x, y: endPoint.y }],
          },
        ],
      };
    });
    this.onmessage?.({ data: { id: message.id, data: graph } });
  }
  fail(message = 'Worker refused') {
    this.onerror?.({ message });
  }
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mounted(flow = fixture()) {
  const dom = new JSDOM('<div id="canvas"></div>', {
    url: 'http://localhost/',
  });
  for (const key of [
    'window',
    'document',
    'HTMLElement',
    'Element',
    'Node',
    'localStorage',
  ])
    globalThis[key] = dom.window[key];
  globalThis.CSS = {
    escape: (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'),
  };
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.Worker = PendingWorker;
  PendingWorker.instances.length = 0;
  const createDiagram = await renderer();
  const sought = [];
  const diagram = createDiagram(document.querySelector('#canvas'), {
    onSelect() {},
    onSeek(index) {
      sought.push(index);
    },
    onPause() {},
  });
  const surface = document.querySelector('.diagram-surface');
  Object.defineProperties(surface, {
    clientWidth: { value: 1366, configurable: true },
    clientHeight: { value: 768, configurable: true },
  });
  diagram.setFlow(flow);
  diagram.render({ mode: 'map', cursor: 0 });
  const graph = globalThis.__diagramGraph;
  const expand = async (index = 0) => {
    const cards = [
      ...document.querySelectorAll(
        '.diagram-card.diagram-expanded-method, .diagram-card:not([data-parent-id])',
      ),
    ];
    assert.ok(cards[index], 'prepared method visible to expand');
    cards[index].querySelector('.diagram-name').click();
    await flush();
  };
  return { dom, diagram, graph, sought, expand };
}

test('render stays synchronous while native Worker layout is pending and exposes status', async () => {
  const h = await mounted();
  await h.expand();
  const result = h.diagram.render({ mode: 'map', cursor: 1 });
  assert.equal(result, undefined);
  const status = document.querySelector('.diagram-layout-status');
  assert.ok(
    status && status.getAttribute('aria-live'),
    'pending layout is announced',
  );
  assert.match(status.textContent, /pending|laying out|loading/i);
  assert.ok(PendingWorker.instances.some((worker) => worker.requests.length));
  h.diagram.dispose();
});

test('ELK frames contain selected loop header and nested branch, arrows preserve status and target', async () => {
  const h = await mounted();
  await h.expand();
  PendingWorker.instances[0].resolve();
  await flush();
  const regions = [...h.graph.cells.values()].filter(
    (cell) => cell.options.shape === 'code-anime-control-region',
  );
  const loop = regions.find(
    (cell) => cell.data.type === 'loop' && cell.data.selected,
  );
  assert.ok(loop, 'actual T2/T4 loop frame rendered');
  const header = [...h.graph.cells.values()].find(
    (cell) => cell.data.index === 2 && cell.data.control === 'loop',
  );
  assert.ok(
    header && header.parent?.id === loop.id,
    'loop header is owned by selected frame',
  );
  assert.ok(
    regions.some(
      (region) =>
        region.parent &&
        region.parent.options.shape === 'code-anime-control-region',
    ),
    'compound nested frame',
  );
  const edges = [...h.graph.cells.values()].filter(
    (cell) => cell.edge && cell.data.status,
  );
  assert.ok(edges.length, 'actual topology edge rendered');
  for (const edge of edges) {
    assert.ok(edge.attrs.line.targetMarker, 'directed target marker');
    assert.equal(edge.attrs.root['data-source-node'], edge.options.source.cell);
    assert.equal(edge.attrs.root['data-target-node'], edge.options.target.cell);
    assert.equal(edge.attrs.root['data-edge-status'], edge.data.status);
    assert.match(
      edge.attrs.root['aria-label'],
      /(prepared|possible|not-selected|unknown)/,
    );
  }
  h.diagram.dispose();
});

test('new trace snapshot invalidates delayed layout and latest source wins', async () => {
  const h = await mounted();
  await h.expand();
  const first = PendingWorker.instances[0];
  const changed = fixture(
    events.map((entry, i) => ({ ...entry, id: `replacement-${i}` })),
  );
  h.diagram.setFlow(changed, true);
  h.diagram.render({ mode: 'map', cursor: 1 });
  assert.equal(document.querySelector('#canvas').dataset.layoutState, 'stale');
  assert.match(
    document.querySelector('.diagram-layout-status').textContent,
    /previous trace layout shown.*not current prepared evidence/i,
  );
  first.resolve();
  await flush();
  const latest = PendingWorker.instances.at(-1);
  assert.notEqual(latest, first, 'aborted native Worker was replaced');
  latest.resolve();
  await flush();
  const header = [...h.graph.cells.values()].find(
    (cell) => cell.data.index === 2 && cell.data.control === 'loop',
  );
  assert.ok(header, 'new trace was actually painted');
  assert.equal(
    header.data.event.id,
    'replacement-1',
    'new event evidence wins',
  );
  assert.equal(document.querySelector('#canvas').dataset.layoutState, 'ready');
  assert.ok(
    ![...h.graph.cells.values()].some(
      (cell) => cell.data.event?.id === 'event-2',
    ),
    'obsolete event evidence absent',
  );
  h.diagram.dispose();
});

test('Worker failure discloses non-fallback layout error while method controls remain', async () => {
  const h = await mounted();
  await h.expand();
  PendingWorker.instances[0].fail('unavailable');
  await flush();
  const status = document.querySelector('.diagram-layout-status');
  assert.ok(status && !status.hidden, 'failure not silently hidden');
  assert.match(status.textContent, /failed|unavailable|error/i);
  assert.ok(
    document.querySelector('.diagram-card .diagram-name'),
    'prepared controls remain',
  );
  h.diagram.dispose();
});

test('actual prepared, possible, not-selected and unknown topology edges retain distinct ARIA and dashes', async () => {
  const branchSource =
    'function run() {\n if (ok) {\n   yes();\n }\n return done;\n}';
  const cases = [
    { outcome: true, expected: 'not-selected', dash: '2 6' },
    { outcome: undefined, expected: 'possible', dash: '4 4' },
    { outcome: true, expected: 'unknown', dash: '8 4 2 4', unresolved: true },
  ];
  for (const { outcome, expected, dash, unresolved } of cases) {
    const items = [
      event('enter', 1, 1),
      event('branch', 2, 2, 'run', 'run', {
        values: outcome === undefined ? {} : { condition: outcome },
      }),
      event(
        'statement',
        3,
        3,
        'run',
        'run',
        unresolved ? { certainty: 'unresolved' } : {},
      ),
      event('return', 5, 4),
    ];
    const flow = fixture(items);
    flow.trace.sourceFiles['fixture.ts'] = branchSource;
    const h = await mounted(flow);
    await h.expand();
    PendingWorker.instances[0].resolve();
    await flush();
    const edges = [...h.graph.cells.values()].filter(
      (cell) => cell.edge && cell.data.status,
    );
    const statuses = new Set(edges.map((cell) => cell.data.status));
    assert.ok(statuses.has('prepared'), 'prepared mock edge retained');
    assert.ok(statuses.has(expected), `${expected} route retained`);
    const target = edges.find((cell) => cell.data.status === expected);
    assert.equal(target.attrs.root['data-edge-status'], expected);
    assert.match(target.attrs.root['aria-label'], new RegExp(expected));
    assert.equal(target.attrs.line.strokeDasharray, dash);
    assert.ok(
      target.attrs.line.targetMarker,
      `${expected} path remains directed`,
    );
    h.diagram.dispose();
  }
});

test('native visit selector invokes prepared seek without losing method controls', async () => {
  const h = await mounted();
  await h.expand();
  PendingWorker.instances[0].resolve();
  await flush();
  const visit = document.querySelector('.diagram-visit');
  assert.ok(visit && visit.options.length === 2, 'real HTML visit picker');
  visit.value = '1';
  visit.dispatchEvent(new window.Event('change', { bubbles: true }));
  assert.equal(
    h.sought.at(-1),
    5,
    'native change navigates prepared second loop visit',
  );
  assert.ok(document.querySelector('.diagram-orientation[aria-label]'));
  assert.ok(document.querySelector('.diagram-card .diagram-values-summary'));
  h.diagram.dispose();
});

test('serial Worker requests eventually paint two expanded methods with distinct call and return routes', async () => {
  const items = [
    event('enter', 1, 1, 'root', 'run'),
    event('call', 4, 2, 'root', 'run'),
    event('enter', 11, 3, 'child', 'helper', {
      parentCallId: 'root',
      stack: ['root', 'child'],
    }),
    event('return', 12, 4, 'child', 'helper', { stack: ['root'], result: 42 }),
    event('return', 9, 5, 'root', 'run', { stack: [], result: 42 }),
  ];
  const h = await mounted(fixture(items));
  await h.expand(0);
  await h.expand(1);
  const worker = PendingWorker.instances[0];
  assert.equal(
    worker.requests.length,
    1,
    'T4 adapter serializes native layout requests',
  );
  worker.resolve();
  await flush();
  assert.equal(
    worker.requests.length,
    1,
    'second expanded method eventually requested',
  );
  worker.resolve();
  await flush();
  const inner = [...h.graph.cells.values()].filter(
    (cell) => cell.data.level === 'step',
  );
  assert.ok(inner.some((cell) => cell.data.callId === 'root'));
  assert.ok(inner.some((cell) => cell.data.callId === 'child'));
  const edges = [...h.graph.cells.values()].filter((cell) => cell.edge);
  assert.ok(
    edges.some(
      (edge) => edge.data.kind === 'call' && edge.data.callId === 'child',
    ),
  );
  assert.ok(
    edges.some(
      (edge) => edge.data.kind === 'return' && edge.data.callId === 'child',
    ),
  );
  h.diagram.dispose();
});

test('expanding and seeking while Worker is pending does not replay an older automatic Fit', async () => {
  const h = await mounted();
  const before = h.graph.fitCalls ?? 0;
  await h.expand();
  h.graph.translate(170, -80);
  h.diagram.render({ mode: 'map', cursor: 2 }, false);
  PendingWorker.instances[0].resolve();
  await flush();
  assert.equal(
    h.graph.fitCalls ?? 0,
    before,
    'pending layout cannot replay stale automatic fit',
  );
  assert.deepEqual(
    h.graph.translate(),
    { tx: 170, ty: -80 },
    'user camera remains unchanged',
  );
  h.diagram.dispose();
});

test('first repeated visit Values expansion reserves extra height despite later closed visit', async () => {
  const h = await mounted(
    fixture(events.map((entry, i) => ({ ...entry, after: { value: i } }))),
  );
  await h.expand();
  const worker = PendingWorker.instances[0];
  const beforeGraph = structuredClone(worker.requests[0].graph);
  worker.resolve();
  await flush();
  const loops = [...h.graph.cells.values()].filter(
    (cell) => cell.data.control === 'loop',
  );
  assert.equal(loops.length, 2, 'two genuine prepared visits');
  const firstValues = loops[0].view.querySelector('.diagram-values-summary');
  assert.ok(firstValues, 'native Values summary on first visit');
  firstValues.click();
  assert.equal(
    worker.requests.length,
    1,
    'Values expansion invokes new geometry',
  );
  const afterGraph = worker.requests[0].graph;
  const nodeHeights = (graph) => {
    const result = new Map();
    const walk = (item) => {
      for (const child of item.children ?? []) {
        if (child.id.includes(':event:2:') || child.id.includes(':event:5:'))
          result.set(child.id, child.height);
        walk(child);
      }
    };
    walk(graph);
    return result;
  };
  const before = nodeHeights(beforeGraph),
    after = nodeHeights(afterGraph);
  assert.equal(before.size, 2);
  assert.equal(after.size, 2);
  for (const [id, height] of before)
    assert.equal(
      after.get(id),
      height + 160,
      'shared T4 node id must not clip first visit',
    );
  h.diagram.dispose();
});

test('same-line repeated child invocations keep both distinct directed call/return pairs and native selection', async () => {
  const items = [
    event('enter', 1, 1, 'root', 'run'),
    event('call', 4, 2, 'root', 'run'),
    event('enter', 11, 3, 'child-a', 'helper', {
      parentCallId: 'root',
      stack: ['root', 'child-a'],
    }),
    event('return', 12, 4, 'child-a', 'helper', { stack: ['root'], result: 1 }),
    event('call', 4, 5, 'root', 'run'),
    event('enter', 11, 6, 'child-b', 'helper', {
      parentCallId: 'root',
      stack: ['root', 'child-b'],
    }),
    event('return', 12, 7, 'child-b', 'helper', { stack: ['root'], result: 2 }),
    event('return', 9, 8, 'root', 'run', { stack: [], result: 3 }),
  ];
  const h = await mounted(fixture(items));
  await h.expand(0);
  await h.expand(1);
  const worker = PendingWorker.instances[0];
  worker.resolve();
  await flush();
  worker.resolve();
  await flush();
  const edges = [...h.graph.cells.values()].filter((cell) => cell.edge);
  for (const kind of ['call', 'return']) {
    const pairs = edges.filter(
      (edge) =>
        edge.data.kind === kind &&
        ['child-a', 'child-b'].includes(edge.data.callId),
    );
    assert.deepEqual(
      pairs.map((edge) => edge.data.callId).sort(),
      ['child-a', 'child-b'],
      `${kind} invocation ancestry distinct`,
    );
    for (const edge of pairs) {
      assert.ok(edge.attrs.line.targetMarker, `${kind} has direction`);
      assert.match(edge.attrs.root['aria-label'], new RegExp(edge.data.callId));
    }
  }
  const select = document.querySelector('.diagram-invocation');
  assert.ok(
    select && select.options.length === 2,
    'native two-invocation selector',
  );
  select.value = 'child-b';
  select.dispatchEvent(new window.Event('change', { bubbles: true }));
  assert.equal(
    h.sought.at(-1),
    6,
    'selecting second same-line invocation seeks its own entry',
  );
  h.diagram.dispose();
});

// T6 race regressions exercise the actual public renderer and real T4 adapter;
// only the native browser Worker/X6 presentation boundary is simulated here.
const activeStepIndices = (graph) =>
  [...graph.cells.values()]
    .filter((cell) => cell.data.level === 'step' && cell.data.active)
    .map((cell) => cell.data.index);

test('T6 cursor-only 5 to 9 updates current step immediately during a pending layout without a second Worker request', async (t) => {
  const nine = [
    ...events.slice(0, 6),
    event('statement', 6, 7),
    event('statement', 7, 8),
    event('return', 9, 9),
  ].map((item) => ({ ...item, after: { value: item.id } }));
  const h = await mounted(fixture(nine));
  t.after(() => h.diagram.dispose());
  await h.expand();
  const worker = PendingWorker.instances[0];
  worker.resolve();
  await flush();
  h.diagram.render({ mode: 'map', cursor: 5 }, false);
  assert.deepEqual(activeStepIndices(h.graph), [5]);
  const values = [...h.graph.cells.values()]
    .find((cell) => cell.data.control === 'loop')
    ?.view.querySelector('.diagram-values-summary');
  assert.ok(
    values,
    JSON.stringify(
      [...h.graph.cells.values()]
        .filter((cell) => cell.data.control === 'loop')
        .map((cell) => [
          cell.data.value,
          cell.data.event?.after,
          Boolean(cell.view.querySelector('.diagram-values-summary')),
        ]),
    ),
  );
  values.click();
  assert.equal(worker.requests.length, 1, 'geometry change is in flight');
  const visit = [...h.graph.cells.values()]
    .find((cell) => cell.data.control === 'loop' && cell.data.index === 5)
    ?.view.querySelector('.diagram-visit');
  assert.ok(
    visit,
    'focused native visit picker belongs to formerly active card',
  );
  visit.focus();
  assert.equal(document.activeElement, visit);
  assert.equal(h.diagram.render({ mode: 'map', cursor: 9 }, false), undefined);
  assert.equal(
    worker.requests.length,
    1,
    'cursor only never starts a second layout',
  );
  assert.deepEqual(
    activeStepIndices(h.graph),
    [9],
    'current styling must not wait for ELK',
  );
  assert.ok(
    document.activeElement?.classList.contains('diagram-visit'),
    'pending cursor repaint keeps keyboard focus in the native picker',
  );
  h.diagram.dispose();
});

test('T6 same-object in-place continuation invalidates an old Worker reply', async (t) => {
  const flow = fixture();
  const h = await mounted(flow);
  t.after(() => h.diagram.dispose());
  await h.expand();
  const old = PendingWorker.instances[0];
  flow.trace.events.push(event('statement', 8, 8));
  flow.steps.push({ from: 'run', to: 'run', dtoName: 'statement 8' });
  h.diagram.setFlow(flow, true);
  h.diagram.render({ mode: 'map', cursor: 8 }, false);
  assert.equal(document.querySelector('#canvas').dataset.layoutState, 'stale');
  old.resolve();
  await flush();
  assert.equal(document.querySelector('#canvas').dataset.layoutState, 'stale');
  const latest = PendingWorker.instances.at(-1);
  assert.notEqual(latest, old);
  latest.resolve();
  await flush();
  assert.ok(
    [...h.graph.cells.values()].some((cell) => cell.data.index === 8),
    'continued prepared event is present in the new atomic layout',
  );
  h.diagram.dispose();
});

test('T6 same flow ID and count with altered evidence never accepts stale geometry or calls old evidence current after failure', async (t) => {
  const original = fixture();
  original.id = 'unchanged-session';
  original.sourceHash = 'unchanged-source';
  const h = await mounted(original);
  t.after(() => h.diagram.dispose());
  await h.expand();
  const old = PendingWorker.instances[0];
  const changed = fixture(
    events.map((item) => ({ ...item, label: `NEW ${item.label}` })),
  );
  changed.id = original.id;
  changed.sourceHash = original.sourceHash;
  h.diagram.setFlow(changed, true);
  h.diagram.render({ mode: 'map', cursor: 5 }, false);
  assert.equal(document.querySelector('#canvas').dataset.layoutState, 'stale');
  old.resolve();
  await flush();
  const newest = PendingWorker.instances.at(-1);
  newest.fail('offline');
  await flush();
  assert.match(
    document.querySelector('.diagram-layout-status').textContent,
    /previous trace|not current prepared evidence/i,
    'old graph is explicitly disclosed as stale even after latest Worker failure',
  );
  assert.equal(document.querySelector('#canvas').dataset.layoutState, 'stale');
  assert.equal(h.diagram.render({ mode: 'map', cursor: 6 }, false), undefined);
  assert.ok(
    document.querySelector('.diagram-card .diagram-name'),
    'native controls survive failure',
  );
  h.diagram.dispose();
});

test('T6 two expanded methods commit together; second Worker error leaves the old coherent graph', async (t) => {
  const items = [
    event('enter', 1, 1, 'root', 'run'),
    event('call', 4, 2, 'root', 'run'),
    event('enter', 11, 3, 'child', 'helper', {
      parentCallId: 'root',
      stack: ['root', 'child'],
    }),
    event('return', 12, 4, 'child', 'helper', { stack: ['root'], result: 4 }),
    event('return', 9, 5, 'root', 'run', { stack: [] }),
  ];
  const h = await mounted(fixture(items));
  t.after(() => h.diagram.dispose());
  await h.expand(0);
  await h.expand(1);
  const worker = PendingWorker.instances[0];
  assert.equal(activeStepIndices(h.graph).length, 0);
  worker.resolve();
  await flush();
  assert.equal(
    [...h.graph.cells.values()].filter((cell) => cell.data.level === 'step')
      .length,
    0,
    'first method response cannot paint half-new inner content',
  );
  worker.fail('second method failed');
  await flush();
  assert.equal(
    [...h.graph.cells.values()].filter((cell) => cell.data.level === 'step')
      .length,
    0,
    'failure preserves old coherent map rather than painting only first method',
  );
  assert.match(
    document.querySelector('.diagram-layout-status').textContent,
    /failed/i,
  );
  h.diagram.dispose();
});

test('T6 explicit Fit survives both serial method layouts and fits only their combined geometry', async (t) => {
  const items = [
    event('enter', 1, 1, 'root', 'run'),
    event('call', 4, 2, 'root', 'run'),
    event('enter', 11, 3, 'child', 'helper', {
      parentCallId: 'root',
      stack: ['root', 'child'],
    }),
    event('return', 12, 4, 'child', 'helper', { stack: ['root'] }),
    event('return', 9, 5, 'root', 'run', { stack: [] }),
  ];
  const h = await mounted(fixture(items));
  t.after(() => h.diagram.dispose());
  await h.expand(0);
  await h.expand(1);
  const worker = PendingWorker.instances[0];
  document.querySelector('button[aria-label="Fit diagram"]').click();
  const afterClick = h.graph.fitCalls ?? 0;
  worker.resolve();
  await flush();
  assert.equal(worker.requests.length, 1, 'second method remains pending');
  assert.equal(
    h.graph.fitCalls ?? 0,
    afterClick,
    'a partial first geometry cannot fit before second method',
  );
  worker.resolve();
  await flush();
  assert.ok(
    (h.graph.fitCalls ?? 0) > afterClick,
    'newest combined layout receives explicit Fit',
  );
  h.diagram.dispose();
});

test('T6 visit, orientation, Values and resized surface invalidate the latest geometry request', async (t) => {
  const h = await mounted(
    fixture(events.map((item) => ({ ...item, after: { value: item.id } }))),
  );
  t.after(() => h.diagram.dispose());
  await h.expand();
  let worker = PendingWorker.instances.at(-1);
  worker.resolve();
  await flush();
  const visit = document.querySelector('.diagram-visit');
  visit.value = '1';
  visit.dispatchEvent(new window.Event('change', { bubbles: true }));
  assert.equal(
    worker.requests.length,
    1,
    'visit choice changes topology geometry',
  );
  document.querySelector('.diagram-orientation').click();
  await flush();
  assert.ok(worker.terminated, 'old selected visit layout is cancelled');
  worker = PendingWorker.instances.at(-1);
  assert.equal(
    worker.requests[0].graph.layoutOptions['elk.direction'],
    'RIGHT',
  );
  worker.resolve();
  await flush();
  const before = h.graph.fitCalls ?? 0;
  const values = [...h.graph.cells.values()]
    .find((cell) => cell.data.control === 'loop')
    ?.view.querySelector('.diagram-values-summary');
  assert.ok(values, 'rendered control card exposes Values');
  values.click();
  assert.equal(
    worker.requests.length,
    1,
    'Values height triggers fresh geometry',
  );
  worker.resolve();
  await flush();
  assert.equal(
    h.graph.fitCalls ?? 0,
    before,
    'Values cannot auto-fit the camera',
  );
  const surface = document.querySelector('.diagram-surface');
  Object.defineProperty(surface, 'clientWidth', {
    configurable: true,
    value: 900,
  });
  h.diagram.render({ mode: 'map', cursor: 0 }, false);
  assert.equal(
    worker.requests.length,
    1,
    'surface width change invalidates layout geometry',
  );
  h.diagram.dispose();
});

test('T6 manual pan and zoom while Worker is pending supersede auto fit; explicit latest Fit still applies', async (t) => {
  const h = await mounted(
    fixture(events.map((item) => ({ ...item, after: { value: item.id } }))),
  );
  t.after(() => h.diagram.dispose());
  await h.expand();
  let worker = PendingWorker.instances[0];
  h.diagram.render({ mode: 'map', cursor: 5 }, true);
  const beforeFit = h.graph.fitCalls ?? 0;
  h.graph.translate(137, -65); // native graph translate, as emitted by user drag
  document.querySelector('button[aria-label="Zoom in"]').click();
  const beforeScale = h.graph.zoom();
  worker.resolve();
  await flush();
  assert.equal(
    h.graph.fitCalls ?? 0,
    beforeFit,
    'old automatic fit cannot steal camera',
  );
  assert.deepEqual(h.graph.translate(), { tx: 137, ty: -65 });
  assert.equal(h.graph.zoom(), beforeScale);
  const values = [...h.graph.cells.values()]
    .find((cell) => cell.data.control === 'loop')
    ?.view.querySelector('.diagram-values-summary');
  assert.ok(values, 'rendered control card exposes Values');
  values.click();
  worker = PendingWorker.instances.at(-1);
  const beforeExplicit = h.graph.fitCalls ?? 0;
  document.querySelector('button[aria-label="Fit diagram"]').click();
  const afterClickFit = h.graph.fitCalls ?? 0;
  assert.equal(
    afterClickFit,
    beforeExplicit + 1,
    'explicit Fit responds immediately',
  );
  worker.resolve();
  await flush();
  assert.ok(
    (h.graph.fitCalls ?? 0) > afterClickFit,
    'explicit user Fit applies again to newest layout',
  );
  h.diagram.dispose();
});

test('T6 Values opening cancels an older queued automatic Fit before its replacement geometry commits', async (t) => {
  const h = await mounted(
    fixture(events.map((item) => ({ ...item, after: { value: item.id } }))),
  );
  t.after(() => h.diagram.dispose());
  await h.expand();
  PendingWorker.instances[0].resolve();
  await flush();
  document.querySelector('.diagram-orientation').click(); // automatic layout Fit queued
  await flush();
  const obsolete = PendingWorker.instances.at(-1);
  assert.equal(obsolete.requests.length, 1);
  const values = [...h.graph.cells.values()]
    .find((cell) => cell.data.control === 'loop')
    ?.view.querySelector('.diagram-values-summary');
  assert.ok(values);
  const before = h.graph.fitCalls ?? 0;
  values.click(); // later Values intent must not replay older automatic Fit
  await flush();
  const current = PendingWorker.instances.at(-1);
  assert.notEqual(current, obsolete);
  obsolete.resolve();
  current.resolve();
  await flush();
  assert.equal(
    h.graph.fitCalls ?? 0,
    before,
    'Values should not inherit older auto-fit',
  );
  h.diagram.dispose();
});

test('T6 delayed reply/error from an aborted Worker epoch never mutates the newer trace', async (t) => {
  const h = await mounted();
  t.after(() => h.diagram.dispose());
  await h.expand();
  const obsolete = PendingWorker.instances[0];
  h.diagram.setFlow(
    fixture(
      events.map((item) => ({ ...item, label: `epoch-two ${item.label}` })),
    ),
    true,
  );
  h.diagram.render({ mode: 'map', cursor: 2 }, false);
  await flush();
  const latest = PendingWorker.instances.at(-1);
  latest.resolve();
  await flush();
  const graphSize = h.graph.cells.size;
  obsolete.resolve();
  obsolete.fail('old epoch error');
  await flush();
  assert.equal(h.graph.cells.size, graphSize);
  assert.equal(document.querySelector('#canvas').dataset.layoutState, 'ready');
  assert.ok(
    [...h.graph.cells.values()]
      .filter((cell) => cell.data.event)
      .every((cell) => cell.data.event.label.startsWith('epoch-two')),
  );
  h.diagram.dispose();
});
