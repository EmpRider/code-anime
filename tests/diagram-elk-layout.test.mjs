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
