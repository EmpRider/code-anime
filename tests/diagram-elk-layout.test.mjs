import assert from 'node:assert/strict';
import test from 'node:test';

const adapter = await import('../public/diagram-elk-layout.js');

const prepared = () => ({
  topologyKey: 'loop-with-branch',
  cards: [
    {
      id: 'header',
      index: 2,
      node: { id: 'loop', title: 'while' },
      parentRegionId: 'loop',
      control: 'loop',
    },
    {
      id: 'body',
      index: 3,
      node: { id: 'statement', title: 'work' },
      parentRegionId: 'branch',
    },
    { id: 'exit', index: 4, node: { id: 'return', title: 'return' } },
  ],
  regions: [
    { id: 'loop', type: 'loop', label: 'Prepared visit 1' },
    { id: 'branch', type: 'branch', label: 'Yes', parentRegionId: 'loop' },
  ],
  edges: [
    {
      id: 'enter-body',
      source: 'header',
      target: 'body',
      kind: 'branch',
      status: 'prepared',
    },
    {
      id: 'body-exit',
      source: 'body',
      target: 'exit',
      kind: 'step',
      status: 'unknown',
    },
  ],
});

// Hand-derived ELK child coordinates are relative to their immediate parent.
function elkResult() {
  return {
    id: 'control-flow',
    x: 0,
    y: 0,
    width: 500,
    height: 460,
    children: [
      {
        id: 'loop',
        x: 20,
        y: 30,
        width: 310,
        height: 300,
        children: [
          { id: 'header', x: 16, y: 44, width: 260, height: 136 },
          {
            id: 'branch',
            x: 40,
            y: 195,
            width: 240,
            height: 90,
            children: [{ id: 'body', x: 14, y: 32, width: 210, height: 50 }],
          },
        ],
        edges: [
          {
            id: 'enter-body',
            sections: [
              {
                startPoint: { x: 146, y: 180 },
                endPoint: { x: 159, y: 227 },
                bendPoints: [{ x: 146, y: 205 }],
              },
            ],
          },
        ],
      },
      { id: 'exit', x: 380, y: 260, width: 110, height: 120 },
    ],
    edges: [
      {
        id: 'body-exit',
        sections: [
          {
            startPoint: { x: 294, y: 290 },
            endPoint: { x: 380, y: 320 },
            bendPoints: [{ x: 350, y: 290 }],
          },
        ],
      },
    ],
  };
}

class NativeWorkerDouble {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.sent = [];
    this.terminated = false;
    NativeWorkerDouble.instances.push(this);
  }
  postMessage(message) {
    assert.ok(['register', 'layout'].includes(message.cmd));
    this.sent.push(structuredClone(message));
  }
  terminate() {
    this.terminated = true;
  }
  receive(response) {
    this.onmessage?.({ data: response });
  }
  fail(error = new Error('Worker failed')) {
    this.onerror?.({ error, message: error.message });
  }
  latest(cmd) {
    return this.sent.findLast((message) => message.cmd === cmd);
  }
}

async function nextMessage(worker, cmd) {
  for (let i = 0; i < 8 && !worker.latest(cmd); i++) await Promise.resolve();
  const message = worker.latest(cmd);
  assert.ok(message, `expected ${cmd} native Worker request`);
  return message;
}

async function workerLayout(control, flow = prepared(), options) {
  const pending = control.layout(flow, options);
  const worker = NativeWorkerDouble.instances.at(-1);
  assert.ok(worker);
  const register = await nextMessage(worker, 'register');
  assert.deepEqual(register.algorithms, ['layered']);
  worker.receive({ id: register.id });
  const request = await nextMessage(worker, 'layout');
  return { pending, worker, request };
}

function withWorker(fn) {
  return async () => {
    const existing = globalThis.Worker;
    NativeWorkerDouble.instances.length = 0;
    globalThis.Worker = NativeWorkerDouble;
    try {
      await fn();
    } finally {
      globalThis.Worker = existing;
    }
  };
}

function longSequence({ nested = false } = {}) {
  const cards = Array.from({ length: 28 }, (_, index) => ({
    id: `visit-${index}`,
    index,
    node: { id: `event-${index}`, title: `Prepared event ${index}` },
    ...(nested && {
      parentRegionId: index < 14 ? 'first-arm' : 'second-arm',
    }),
  }));
  return {
    topologyKey: nested ? 'nested-sequence' : 'flat-sequence',
    cards,
    regions: nested
      ? [
          { id: 'outer', type: 'decision', label: 'Prepared decision' },
          {
            id: 'first-arm',
            type: 'branch',
            parentRegionId: 'outer',
            label: 'First arm',
          },
          {
            id: 'second-arm',
            type: 'branch',
            parentRegionId: 'outer',
            label: 'Second arm',
          },
        ]
      : [],
    edges: cards.slice(1).map((card, index) => ({
      id: `link-${index}`,
      source: cards[index].id,
      target: card.id,
      kind: 'step',
    })),
  };
}

function assertValidGeometry(topology, geometry) {
  assert.deepEqual(
    geometry.edges.map(({ id, source, target }) => [id, source, target]),
    topology.edges.map(({ id, source, target }) => [id, source, target]),
  );
  assert.deepEqual(
    geometry.cards.map(({ id }) => id),
    topology.cards.map(({ id }) => id),
  );
  assert.deepEqual(
    geometry.regions.map(({ id }) => id),
    topology.regions.map(({ id }) => id),
  );
  const rectangles = [...geometry.cards, ...geometry.regions];
  const regions = new Map(
    geometry.regions.map((region) => [region.id, region]),
  );
  for (const rect of rectangles) {
    for (const value of [rect.x, rect.y, rect.width, rect.height])
      assert.ok(Number.isFinite(value) && value >= 0, `${rect.id} finite`);
    const parent = regions.get(rect.parentRegionId);
    if (parent) {
      assert.ok(rect.x >= parent.x && rect.y >= parent.y, `${rect.id} inside`);
      assert.ok(
        rect.x + rect.width <= parent.x + parent.width + 0.01 &&
          rect.y + rect.height <= parent.y + parent.height + 0.01,
        `${rect.id} enclosed`,
      );
    }
  }
  for (let index = 0; index < rectangles.length; index++) {
    const first = rectangles[index];
    for (const second of rectangles.slice(index + 1)) {
      if ((first.parentRegionId || '') !== (second.parentRegionId || ''))
        continue;
      const overlapWidth =
        Math.min(first.x + first.width, second.x + second.width) -
        Math.max(first.x, second.x);
      const overlapHeight =
        Math.min(first.y + first.height, second.y + second.height) -
        Math.max(first.y, second.y);
      assert.ok(
        overlapWidth <= 0.01 || overlapHeight <= 0.01,
        `overlapping siblings: ${first.id} and ${second.id}`,
      );
    }
  }
  for (const edge of geometry.edges) {
    assert.ok(edge.points.length >= 2, `${edge.id} routed`);
    for (const point of edge.points)
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    for (let index = 1; index < edge.points.length; index++) {
      const previous = edge.points[index - 1];
      const point = edge.points[index];
      assert.ok(
        Math.abs(previous.x - point.x) < 0.01 ||
          Math.abs(previous.y - point.y) < 0.01,
        `${edge.id} orthogonal segment`,
      );
    }
  }
}

async function realLayout(control, elk, topology, options) {
  const { pending, worker, request } = await workerLayout(
    control,
    topology,
    options,
  );
  const raw = await elk.layout(request.graph);
  worker.receive({ id: request.id, data: raw });
  return { geometry: await pending, request };
}

test(
  'horizontal viewport ratio changes number of left-to-right rows without losing geometry',
  withWorker(async () => {
    const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
    const control = adapter.createControlLayout();
    const topology = longSequence();
    const elk = new ELK();
    try {
      const wide = await realLayout(control, elk, topology, {
        direction: 'horizontal',
        viewport: { width: 1900, height: 700 },
      });
      const tall = await realLayout(control, elk, topology, {
        direction: 'horizontal',
        viewport: { width: 750, height: 1400 },
      });
      for (const result of [wide, tall])
        assertValidGeometry(topology, result.geometry);
      const rows = (result) =>
        new Set(result.geometry.cards.map(({ y }) => y)).size;
      assert.ok(rows(wide) > 1, 'long horizontal sequence uses multiple rows');
      assert.ok(rows(tall) > rows(wide), 'taller canvas supports more rows');
      assert.ok(
        tall.geometry.width / tall.geometry.height <
          wide.geometry.width / wide.geometry.height,
        'viewport changes final graph aspect',
      );
      const repeat = await realLayout(control, elk, topology, {
        direction: 'horizontal',
        viewport: { width: 750, height: 1400 },
      });
      assert.deepEqual(repeat.geometry, tall.geometry, 'layout deterministic');
    } finally {
      control.dispose();
    }
  }),
);

test(
  'vertical viewport ratio creates top-to-bottom columns with intact nested regions',
  withWorker(async () => {
    const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
    const control = adapter.createControlLayout();
    const topology = longSequence({ nested: true });
    const elk = new ELK();
    try {
      const wide = await realLayout(control, elk, topology, {
        direction: 'vertical',
        viewport: { width: 1900, height: 700 },
        extraHeight: (id) => (id === 'event-3' ? 180 : 0),
      });
      const tall = await realLayout(control, elk, topology, {
        direction: 'vertical',
        viewport: { width: 750, height: 1400 },
        extraHeight: (id) => (id === 'event-3' ? 180 : 0),
      });
      for (const result of [wide, tall])
        assertValidGeometry(topology, result.geometry);
      const cols = (result) =>
        new Set(
          result.geometry.cards
            .filter((card) => card.parentRegionId === 'first-arm')
            .map(({ x }) => x),
        ).size;
      assert.ok(cols(wide) > 1, 'wide canvas permits multiple nested columns');
      assert.ok(cols(wide) > cols(tall), 'narrow canvas uses fewer columns');
      assert.ok(
        wide.geometry.width / wide.geometry.height >
          tall.geometry.width / tall.geometry.height,
        'viewport affects vertical nested aspect',
      );
      assert.equal(
        wide.geometry.cards.find(({ id }) => id === 'visit-3').height,
        300,
      );
      const repeat = await realLayout(control, elk, topology, {
        direction: 'vertical',
        viewport: { width: 1900, height: 700 },
        extraHeight: (id) => (id === 'event-3' ? 180 : 0),
      });
      assert.deepEqual(
        repeat.geometry,
        wide.geometry,
        'nested layout deterministic',
      );
    } finally {
      control.dispose();
    }
  }),
);

test(
  'flat vertical and nested horizontal layouts wrap without breaking hierarchy',
  withWorker(async () => {
    const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
    const control = adapter.createControlLayout();
    const elk = new ELK();
    try {
      for (const [direction, nested, viewport] of [
        ['vertical', false, { width: 1900, height: 700 }],
        ['horizontal', true, { width: 750, height: 1400 }],
      ]) {
        const topology = longSequence({ nested });
        const { geometry, request } = await realLayout(control, elk, topology, {
          direction,
          viewport,
        });
        assertValidGeometry(topology, geometry);
        assert.equal(
          request.graph.layoutOptions['elk.direction'],
          direction === 'vertical' ? 'DOWN' : 'RIGHT',
        );
        const positions = new Set(
          geometry.cards.map((card) =>
            direction === 'vertical' ? card.x : card.y,
          ),
        );
        assert.ok(positions.size > 1, `${direction} has multiple lanes`);
      }
    } finally {
      control.dispose();
    }
  }),
);

test('rejects nested regions outside their owners', () => {
  const invalid = elkResult();
  invalid.children[0].children[1].x = 240;
  assert.throws(
    () => adapter.flattenElkLayout(invalid, prepared()),
    /ownership|containment|parent/i,
  );
});

test('rejects root overflow and overlapping sibling rectangles', () => {
  for (const corrupt of [
    (graph) => {
      graph.width = 100;
      graph.height = 100; // Even root-level cards exceed the canvas.
    },
    (graph) => {
      graph.children[1].x = 420; // Root width is only 500.
    },
    (graph) => {
      graph.children[1].x = 100;
      graph.children[1].y = 100; // Root card collides with root region.
    },
    (graph) => {
      graph.children[0].children[1].y = 100; // Nested branch intersects header.
    },
  ]) {
    const invalid = elkResult();
    corrupt(invalid);
    assert.throws(
      () => adapter.flattenElkLayout(invalid, prepared()),
      /ownership|containment|overlap|collision/i,
    );
  }
  const touching = elkResult();
  touching.children[1].x = 330; // Touches the root region edge only.
  assert.doesNotThrow(() => adapter.flattenElkLayout(touching, prepared()));
  const zeroArea = elkResult();
  zeroArea.children[1].width = 0;
  zeroArea.children[1].x = 100; // A zero-width rectangle has no overlap area.
  assert.doesNotThrow(() => adapter.flattenElkLayout(zeroArea, prepared()));
});

test(
  'viewport resize invalidates an older worker generation',
  withWorker(async () => {
    const control = adapter.createControlLayout();
    try {
      const first = await workerLayout(control, prepared(), {
        direction: 'vertical',
        viewport: { width: 800, height: 1300 },
      });
      const second = control.layout(prepared(), {
        direction: 'vertical',
        viewport: { width: 1700, height: 800 },
      });
      await assert.rejects(first.pending, /stale/i);
      const current = await nextMessage(first.worker, 'layout');
      assert.notEqual(
        first.request.graph.layoutOptions['elk.aspectRatio'],
        current.graph.layoutOptions['elk.aspectRatio'],
      );
      first.worker.receive({ id: first.request.id, data: elkResult() });
      assert.equal(
        await Promise.race([
          second.then(() => 'resolved'),
          Promise.resolve('pending'),
        ]),
        'pending',
      );
      first.worker.receive({ id: current.id, data: elkResult() });
      assert.equal((await second).cards.length, 3);
      await assert.rejects(
        control.layout(prepared(), { viewport: { width: 0, height: 700 } }),
        /viewport/i,
      );
    } finally {
      control.dispose();
    }
  }),
);

test(
  'invalid wrapped nested geometry retries the same trace with legacy ELK options',
  withWorker(async () => {
    const control = adapter.createControlLayout();
    try {
      const flow = prepared();
      let heightReads = 0;
      const { pending, worker, request } = await workerLayout(control, flow, {
        direction: 'vertical',
        viewport: { width: 1700, height: 800 },
        extraHeight: (id) => (id === 'statement' ? ++heightReads * 40 : 0),
      });
      const bad = elkResult();
      bad.children[0].children[1].x = 240; // Nested region escapes its owner.
      worker.receive({ id: request.id, data: bad });
      const retries = worker.sent.filter(({ cmd }) => cmd === 'layout');
      assert.equal(retries.length, 2, 'one safe legacy retry');
      assert.equal(
        retries[1].graph.layoutOptions['elk.layered.wrapping.strategy'],
        'OFF',
      );
      assert.equal(retries[1].graph.layoutOptions['elk.aspectRatio'], 2);
      assert.deepEqual(retries[1].graph.edges, request.graph.edges);
      const bodyHeight = (graph) =>
        graph.children[0].children.find(({ id }) => id === 'branch').children[0]
          .height;
      assert.equal(
        bodyHeight(retries[1].graph),
        bodyHeight(request.graph),
        'fallback retains original Values height',
      );
      assert.equal(heightReads, 1, 'fallback does not re-measure Values');
      worker.receive({ id: retries[1].id, data: elkResult() });
      assert.deepEqual(
        (await pending).edges.map(({ id, source, target }) => [
          id,
          source,
          target,
        ]),
        flow.edges.map(({ id, source, target }) => [id, source, target]),
      );
    } finally {
      control.dispose();
    }
  }),
);

test(
  'overlapping wrapped output retries once with original Values and edges',
  withWorker(async () => {
    const control = adapter.createControlLayout();
    const flow = prepared();
    let heightReads = 0;
    try {
      const { pending, worker, request } = await workerLayout(control, flow, {
        direction: 'horizontal',
        viewport: { width: 900, height: 1400 },
        extraHeight: (id) => (id === 'statement' ? ++heightReads * 20 : 0),
      });
      const bad = elkResult();
      bad.children[1].x = 100;
      bad.children[1].y = 100;
      worker.receive({ id: request.id, data: bad });
      const retries = worker.sent.filter(({ cmd }) => cmd === 'layout');
      assert.equal(retries.length, 2);
      assert.equal(retries[1].id, request.id, 'same Worker request epoch');
      assert.equal(retries[1].graph.layoutOptions['elk.aspectRatio'], 2);
      assert.deepEqual(retries[1].graph.edges, request.graph.edges);
      assert.equal(heightReads, 1, 'Values dimensions are a snapshot');
      worker.receive({ id: retries[1].id, data: elkResult() });
      const geometry = await pending;
      assert.deepEqual(
        geometry.edges.map(({ id, source, target }) => [id, source, target]),
        flow.edges.map(({ id, source, target }) => [id, source, target]),
      );
    } finally {
      control.dispose();
    }
  }),
);

test(
  'horizontal native layout wraps a long sequence into readable landscape rows',
  withWorker(async () => {
    const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
    const cards = Array.from({ length: 20 }, (_, index) => ({
      id: `step-${index}`,
      index,
      node: { title: 'Prepared step' },
    }));
    const topology = {
      topologyKey: 'long-horizontal-sequence',
      cards,
      regions: [],
      edges: cards.slice(1).map((card, index) => ({
        id: `edge-${index}`,
        source: cards[index].id,
        target: card.id,
        kind: 'step',
      })),
    };
    const control = adapter.createControlLayout();
    try {
      const { pending, worker, request } = await workerLayout(
        control,
        topology,
        { direction: 'horizontal' },
      );
      const elk = new ELK();
      const result = await elk.layout(request.graph);
      worker.receive({ id: request.id, data: result });
      const geometry = await pending;
      assert.equal(geometry.cards.length, 20);
      assert.equal(geometry.edges.length, 19);
      assert.ok(
        geometry.width / geometry.height >= 1.5,
        'horizontal stays landscape',
      );
      assert.ok(
        geometry.width / geometry.height <= 4,
        'long sequence wraps instead of shrinking into one row',
      );
      assert.ok(
        new Set(geometry.cards.map((card) => card.y)).size > 1,
        'multiple rows',
      );
      const nested = {
        ...topology,
        topologyKey: 'nested-horizontal-sequence',
        cards: cards.map((card) => ({ ...card, parentRegionId: 'loop' })),
        regions: [{ id: 'loop', type: 'loop', label: 'Selected loop visit' }],
      };
      const next = await workerLayout(control, nested, {
        direction: 'horizontal',
      });
      next.worker.receive({
        id: next.request.id,
        data: await elk.layout(next.request.graph),
      });
      const compound = await next.pending;
      assert.equal(compound.cards.length, 20);
      assert.ok(
        compound.width / compound.height >= 1.5,
        'nested layout stays landscape',
      );
      assert.ok(
        compound.width / compound.height <= 4,
        'nested sequence also wraps',
      );
    } finally {
      control.dispose();
    }
  }),
);

test('flattens_nested_offsets_to_absolute_positions', () => {
  assert.equal(typeof adapter.flattenElkLayout, 'function');
  const result = adapter.flattenElkLayout(elkResult(), prepared());
  assert.deepEqual(
    result.cards.map(({ id, x, y }) => [id, x, y]),
    [
      ['header', 36, 74],
      ['body', 74, 257],
      ['exit', 380, 260],
    ],
  );
  assert.deepEqual(
    result.regions.map(({ id, x, y }) => [id, x, y]),
    [
      ['loop', 20, 30],
      ['branch', 60, 225],
    ],
  );
  assert.deepEqual([result.width, result.height], [500, 460]);
});

test('includes_loop_header_within_frame', () => {
  assert.equal(typeof adapter.flattenElkLayout, 'function');
  const result = adapter.flattenElkLayout(elkResult(), prepared());
  const loop = result.regions.find(({ id }) => id === 'loop');
  const header = result.cards.find(({ id }) => id === 'header');
  assert.equal(header.parentRegionId, loop.id);
  assert.ok(header.x >= loop.x && header.y >= loop.y);
  assert.ok(header.x + header.width <= loop.x + loop.width);
  assert.ok(header.y + header.height <= loop.y + loop.height);
});

test(
  'both_directions_keep_ids_and_ownership',
  withWorker(async () => {
    assert.equal(typeof adapter.createControlLayout, 'function');
    for (const [direction, expected] of [
      ['vertical', 'DOWN'],
      ['horizontal', 'RIGHT'],
    ]) {
      const control = adapter.createControlLayout({
        workerUrl: '/base/vendor/elk-worker.min.js',
      });
      const { pending, worker, request } = await workerLayout(
        control,
        prepared(),
        { direction },
      );
      assert.equal(worker.url, '/base/vendor/elk-worker.min.js');
      assert.equal(request.graph.layoutOptions['elk.direction'], expected);
      assert.equal(
        request.graph.layoutOptions['elk.hierarchyHandling'],
        'INCLUDE_CHILDREN',
      );
      assert.equal(
        request.graph.layoutOptions['elk.edgeRouting'],
        'ORTHOGONAL',
      );
      assert.deepEqual(request.layoutOptions, {});
      assert.deepEqual(request.options, {
        logging: false,
        measureExecutionTime: false,
      });
      worker.receive({ id: request.id, data: elkResult() });
      const result = await pending;
      assert.deepEqual(
        result.cards.map((card) => [card.id, card.parentRegionId]),
        [
          ['header', 'loop'],
          ['body', 'branch'],
          ['exit', undefined],
        ],
      );
      assert.deepEqual(
        result.edges.map(({ id, status }) => [id, status]),
        [
          ['enter-body', 'prepared'],
          ['body-exit', 'unknown'],
        ],
      );
      const serializedEdges = request.graph.edges;
      assert.deepEqual(
        serializedEdges.map(({ sources, targets }) => [sources, targets]),
        [
          [['header'], ['body']],
          [['body'], ['exit']],
        ],
      );
      control.dispose();
    }
  }),
);

test(
  'ancestor_grows_for_values_expansion',
  withWorker(async () => {
    assert.equal(typeof adapter.createControlLayout, 'function');
    const control = adapter.createControlLayout();
    const { pending, worker, request } = await workerLayout(
      control,
      prepared(),
      {
        extraHeight: (id) => (id === 'statement' ? 160 : 0),
      },
    );
    const region = request.graph.children.find(({ id }) => id === 'loop');
    const branch = region.children.find(({ id }) => id === 'branch');
    const body = branch.children.find(({ id }) => id === 'body');
    assert.equal(
      body.height,
      280,
      'card size requests extra 160px at original node identity',
    );
    assert.ok(
      !('width' in region) && !('height' in branch),
      'compound ancestors may grow naturally',
    );
    const grown = elkResult();
    grown.height = 760;
    grown.children[0].height = 600;
    grown.children[0].children[1].height = 350;
    grown.children[0].children[1].children[0].height = 280;
    worker.receive({ id: request.id, data: grown });
    const result = await pending;
    assert.equal(result.cards.find(({ id }) => id === 'body').height, 280);
    assert.equal(result.regions.find(({ id }) => id === 'branch').height, 350);
    assert.equal(result.regions.find(({ id }) => id === 'loop').height, 600);
    control.dispose();
  }),
);

test('preserves_cross_boundary_edge_direction', () => {
  assert.equal(typeof adapter.flattenElkLayout, 'function');
  const result = adapter.flattenElkLayout(elkResult(), prepared());
  const edge = result.edges.find(({ id }) => id === 'body-exit');
  assert.equal(edge.source, 'body');
  assert.equal(edge.target, 'exit');
  assert.deepEqual(edge.points, [
    { x: 294, y: 290 },
    { x: 350, y: 290 },
    { x: 380, y: 320 },
  ]);
  const inner = result.edges.find(({ id }) => id === 'enter-body');
  assert.deepEqual(inner.points, [
    { x: 166, y: 210 },
    { x: 166, y: 235 },
    { x: 179, y: 257 },
  ]);
});

test(
  'rejects_malformed_or_unmatched_worker_response',
  withWorker(async () => {
    assert.equal(typeof adapter.createControlLayout, 'function');
    const control = adapter.createControlLayout();
    const first = await workerLayout(control);
    first.worker.receive({ id: first.request.id + 500, data: elkResult() });
    const state = await Promise.race([
      first.pending.then(
        () => 'resolved',
        () => 'rejected',
      ),
      Promise.resolve('pending'),
    ]);
    assert.equal(state, 'pending');
    first.worker.receive({ id: first.request.id, data: null });
    await assert.rejects(first.pending, /malformed|invalid|graph/i);
    control.dispose();
  }),
);

test(
  'rejects_mismatched_worker_epoch_request_id_geometry_key',
  withWorker(async () => {
    assert.equal(typeof adapter.createControlLayout, 'function');
    const control = adapter.createControlLayout();
    const first = await workerLayout(control);
    const superseded = control.layout(
      { ...prepared(), topologyKey: 'changed-real-topology' },
      { direction: 'horizontal' },
    );
    await assert.rejects(
      first.pending,
      /stale/i,
      'local geometry-key change retires prior pending generation',
    );
    const current = await nextMessage(first.worker, 'layout');
    assert.equal(current.graph.layoutOptions['elk.direction'], 'RIGHT');
    // first Worker reply has the correct original ID but *no* echoed metadata.
    first.worker.receive({ id: first.request.id, data: elkResult() });
    assert.equal(
      await Promise.race([
        superseded.then(() => 'resolved'),
        Promise.resolve('pending'),
      ]),
      'pending',
    );
    first.worker.receive({ id: current.id, data: elkResult() });
    assert.equal((await superseded).cards.length, 3);
    control.dispose();
  }),
);

test(
  'worker_restart_reused_request_id_is_rejected',
  withWorker(async () => {
    assert.equal(typeof adapter.createControlLayout, 'function');
    const control = adapter.createControlLayout();
    const old = await workerLayout(control);
    old.worker.fail();
    await assert.rejects(old.pending, /worker/i);
    const fresh = await workerLayout(control);
    assert.notEqual(fresh.worker, old.worker);
    old.worker.receive({ id: fresh.request.id, data: elkResult() });
    old.worker.fail(new Error('late A error after B restart'));
    old.worker.onmessageerror?.({ data: 'late A malformed data' });
    assert.equal(
      await Promise.race([
        fresh.pending.then(() => 'resolved'),
        Promise.resolve('pending'),
      ]),
      'pending',
    );
    fresh.worker.receive({ id: fresh.request.id, data: elkResult() });
    assert.equal((await fresh.pending).cards.length, 3);
    control.dispose();
  }),
);

test(
  'duplicate_reply_or_invalid_geometry_rejected',
  withWorker(async () => {
    assert.equal(typeof adapter.flattenElkLayout, 'function');
    for (const corrupt of [
      (g) => {
        g.children.push({ ...g.children[1] });
      },
      (g) => {
        g.children[1].x = NaN;
      },
      (g) => {
        g.children[0].width = -1;
      },
      (g) => {
        g.children[0].children.push({
          id: 'loop',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
        });
      },
      (g) => {
        g.edges[0].sections[0].bendPoints[0].x = NaN;
      },
      (g) => {
        g.edges[0].id = 'unknown-edge';
      },
      (g) => {
        g.edges[0].sections.push({
          startPoint: { x: 1, y: 1 },
          endPoint: { x: 5, y: 5 },
        });
      },
    ]) {
      const graph = elkResult();
      corrupt(graph);
      assert.throws(
        () => adapter.flattenElkLayout(graph, prepared()),
        /duplicate|invalid|cycle|nonfinite|negative/i,
      );
    }
    const control = adapter.createControlLayout();
    const first = await workerLayout(control);
    first.worker.receive({ id: first.request.id, data: elkResult() });
    assert.equal((await first.pending).cards.length, 3);
    const second = await workerLayout(control);
    first.worker.receive({ id: first.request.id, data: elkResult() });
    assert.equal(
      await Promise.race([
        second.pending.then(() => 'resolved'),
        Promise.resolve('pending'),
      ]),
      'pending',
    );
    second.worker.receive({ id: second.request.id, data: elkResult() });
    assert.equal((await second.pending).cards.length, 3);
    const withStatuses = prepared();
    withStatuses.edges[0].status = 'possible';
    withStatuses.edges[1].status = 'not-selected';
    assert.deepEqual(
      adapter
        .flattenElkLayout(elkResult(), withStatuses)
        .edges.map(({ status }) => status),
      ['possible', 'not-selected'],
    );
    const cycle = prepared();
    cycle.regions[0].parentRegionId = 'branch';
    assert.throws(
      () => adapter.flattenElkLayout(elkResult(), cycle),
      /cycle|parent/i,
    );
    const misplacedCard = elkResult();
    const child = misplacedCard.children[0].children[1].children.shift();
    Object.assign(child, { x: 74, y: 257 }); // Same absolute rectangle, wrong hierarchy.
    misplacedCard.children.push(child);
    assert.throws(
      () => adapter.flattenElkLayout(misplacedCard, prepared()),
      /ownership|parent/i,
    );
    const misplacedRegion = elkResult();
    const branch = misplacedRegion.children[0].children.pop();
    Object.assign(branch, { x: 60, y: 225 });
    misplacedRegion.children.push(branch);
    assert.throws(
      () => adapter.flattenElkLayout(misplacedRegion, prepared()),
      /ownership|parent/i,
    );
    await assert.rejects(
      control.layout(prepared(), { direction: 'constructor' }),
      /direction/i,
    );
    control.dispose();
  }),
);

test(
  'register_ack_does_not_settle_layout',
  withWorker(async () => {
    assert.equal(typeof adapter.createControlLayout, 'function');
    const control = adapter.createControlLayout();
    const { pending, worker, request } = await workerLayout(control);
    const register = worker.latest('register');
    worker.receive({ id: register.id });
    worker.receive({ id: request.id });
    await assert.rejects(
      pending,
      /malformed|invalid|graph/i,
      'id-only layout response must not be mistaken for registration',
    );
    control.dispose();
  }),
);

test(
  'abort_error_timeout_dispose_settle_pending',
  withWorker(async () => {
    assert.equal(typeof adapter.createControlLayout, 'function');
    const abortControl = adapter.createControlLayout();
    const abort = new AbortController();
    const a = await workerLayout(abortControl, prepared(), {
      signal: abort.signal,
    });
    abort.abort();
    await assert.rejects(a.pending, /abort/i);
    assert.equal(a.worker.terminated, true);
    abortControl.dispose();

    const errorControl = adapter.createControlLayout();
    const e = await workerLayout(errorControl);
    e.worker.receive({
      id: e.request.id,
      error: { message: 'layered failed' },
    });
    await assert.rejects(e.pending, /layered failed/);
    errorControl.dispose();

    const timeoutControl = adapter.createControlLayout();
    const t = await workerLayout(timeoutControl, prepared(), { timeoutMs: 5 });
    await assert.rejects(t.pending, /timeout/i);
    assert.equal(t.worker.terminated, true);
    timeoutControl.dispose();

    const disposeControl = adapter.createControlLayout();
    const d = await workerLayout(disposeControl);
    disposeControl.dispose();
    await assert.rejects(d.pending, /dispos/i);
    assert.equal(d.worker.terminated, true);
    await assert.rejects(disposeControl.layout(prepared()), /dispos/i);
  }),
);
