const WORKER_TIMEOUT_MS = 30000;
const DIRECTIONS = { vertical: 'DOWN', horizontal: 'RIGHT' };

const validNumber = (value, name) => {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`Invalid ${name}: expected nonnegative finite geometry`);
  return value;
};

function checkPrepared(prepared) {
  if (
    !prepared ||
    !Array.isArray(prepared.cards) ||
    !Array.isArray(prepared.regions) ||
    !Array.isArray(prepared.edges)
  )
    throw new Error('Invalid prepared control-flow topology');
  const ids = new Set();
  for (const item of [
    ...prepared.cards,
    ...prepared.regions,
    ...prepared.edges,
  ]) {
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id))
      throw new Error(`Duplicate or invalid topology id: ${item.id}`);
    ids.add(item.id);
  }
  const regions = new Map(
    prepared.regions.map((region) => [region.id, region]),
  );
  for (const item of [...prepared.regions, ...prepared.cards]) {
    const seen = new Set();
    for (
      let parent = item.parentRegionId;
      parent;
      parent = regions.get(parent)?.parentRegionId
    ) {
      if (!regions.has(parent) || parent === item.id || seen.has(parent))
        throw new Error(`Invalid parent region or cycle for ${item.id}`);
      seen.add(parent);
    }
  }
  const cards = new Set(prepared.cards.map((card) => card.id));
  for (const edge of prepared.edges) {
    if (!cards.has(edge.source) || !cards.has(edge.target))
      throw new Error(`Invalid edge endpoint for ${edge.id}`);
  }
  return regions;
}

function elkGraph(prepared, direction, extraHeight) {
  const regions = checkPrepared(prepared);
  if (direction !== 'vertical' && direction !== 'horizontal')
    throw new Error(`Invalid layout direction: ${direction}`);
  if (typeof extraHeight !== 'function')
    throw new TypeError('extraHeight must be a function');
  const graph = {
    id: 'control-flow',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': DIRECTIONS[direction],
      // Wrap the flat outer event sequence, not nested decision/try scopes.
      'elk.layered.wrapping.strategy':
        direction === 'horizontal' ? 'MULTI_EDGE' : 'OFF',
      'elk.aspectRatio': 2,
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.padding': '[top=16,left=16,bottom=16,right=16]',
    },
    children: [],
    edges: [],
  };
  const containers = new Map([['', graph]]);
  for (const region of prepared.regions) {
    const node = {
      id: region.id,
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': DIRECTIONS[direction],
        'elk.padding': '[top=40,left=16,bottom=16,right=16]',
      },
      children: [],
    };
    containers.set(region.id, node);
  }
  for (const region of prepared.regions)
    containers
      .get(region.parentRegionId || '')
      .children.push(containers.get(region.id));
  for (const card of prepared.cards) {
    const title = card.node?.title ?? card.event?.label ?? '';
    const extra = extraHeight(card.node?.id ?? card.id);
    validNumber(extra, `extraHeight for ${card.id}`);
    const baseline =
      card.control === 'loop' ? 136 : card.control === 'decision' ? 144 : 120;
    containers.get(card.parentRegionId || '').children.push({
      id: card.id,
      width: 260,
      height:
        baseline + Math.max(0, Math.ceil(title.length / 30) - 1) * 20 + extra,
    });
  }
  // Keep cross-region edges at the common root; ELK owns their routes.
  graph.edges = prepared.edges.map(({ id, source, target }) => ({
    id,
    sources: [source],
    targets: [target],
  }));
  return graph;
}

/** Convert every child-relative ELK rectangle/route into absolute graph coordinates. */
export function flattenElkLayout(elk, prepared) {
  checkPrepared(prepared);
  if (!elk || typeof elk !== 'object' || !Array.isArray(elk.children))
    throw new Error('Malformed ELK graph');
  const width = validNumber(elk.width, 'graph width');
  const height = validNumber(elk.height, 'graph height');
  const expected = new Set(
    [...prepared.cards, ...prepared.regions].map(({ id }) => id),
  );
  const expectedParents = new Map(
    [...prepared.cards, ...prepared.regions].map(({ id, parentRegionId }) => [
      id,
      parentRegionId || '',
    ]),
  );
  const geometry = new Map();
  const routes = new Map();
  const visited = new Set();
  function point(value, offsetX, offsetY) {
    if (!value || typeof value !== 'object')
      throw new Error('Invalid ELK edge point');
    return {
      x: validNumber(value.x + offsetX, 'edge x'),
      y: validNumber(value.y + offsetY, 'edge y'),
    };
  }
  function walk(container, originX, originY, parentId = '') {
    if (visited.has(container)) throw new Error('ELK child cycle');
    visited.add(container);
    for (const edge of container.edges ?? []) {
      if (
        !edge ||
        !prepared.edges.some((item) => item.id === edge.id) ||
        routes.has(edge.id)
      )
        throw new Error(`Duplicate or unknown ELK edge ${edge?.id}`);
      if (!Array.isArray(edge.sections) || !edge.sections.length)
        throw new Error(`Invalid ELK edge route ${edge.id}`);
      const sections = edge.sections.map((section) => [
        point(section.startPoint, originX, originY),
        ...(section.bendPoints ?? []).map((bend) =>
          point(bend, originX, originY),
        ),
        point(section.endPoint, originX, originY),
      ]);
      routes.set(edge.id, sections);
    }
    if (!Array.isArray(container.children))
      throw new Error('Malformed ELK children');
    for (const child of container.children) {
      if (!child || !expected.has(child.id) || geometry.has(child.id))
        throw new Error(`Duplicate or unknown ELK child ${child?.id}`);
      if (expectedParents.get(child.id) !== parentId)
        throw new Error(`Invalid ELK parent ownership for ${child.id}`);
      const x = originX + validNumber(child.x, `${child.id} x`);
      const y = originY + validNumber(child.y, `${child.id} y`);
      const width = validNumber(child.width, `${child.id} width`);
      const height = validNumber(child.height, `${child.id} height`);
      geometry.set(child.id, { x, y, width, height });
      if (child.children) walk(child, x, y, child.id);
      else if (child.edges?.length)
        throw new Error(`Invalid ELK edges inside leaf ${child.id}`);
    }
  }
  walk(elk, 0, 0);
  if (geometry.size !== expected.size || routes.size !== prepared.edges.length)
    throw new Error(
      'Malformed ELK graph: missing card, region or edge geometry',
    );
  const cards = prepared.cards.map((card) => ({
    ...card,
    ...geometry.get(card.id),
  }));
  const regions = prepared.regions.map((region) => ({
    ...region,
    ...geometry.get(region.id),
  }));
  const byRegion = new Map(regions.map((region) => [region.id, region]));
  for (const card of cards) {
    const owner = byRegion.get(card.parentRegionId);
    if (
      owner &&
      (card.x < owner.x ||
        card.y < owner.y ||
        card.x + card.width > owner.x + owner.width ||
        card.y + card.height > owner.y + owner.height)
    )
      throw new Error(`Invalid ELK ownership geometry for ${card.id}`);
  }
  const edges = prepared.edges.map((edge) => {
    const sections = routes.get(edge.id);
    const points = [...sections[0]];
    for (const section of sections.slice(1)) {
      const last = points.at(-1);
      if (last.x !== section[0].x || last.y !== section[0].y)
        throw new Error(
          `Invalid disconnected ELK edge sections for ${edge.id}`,
        );
      points.push(...section.slice(1));
    }
    return { ...edge, sections, points };
  });
  return { cards, regions, edges, width, height };
}

export function createControlLayout({
  workerUrl = '/vendor/elk-worker.min.js',
} = {}) {
  let lifecycle = 0;
  let nextId = 0;
  let generation = 0;
  let currentKey;
  let state;
  let disposed = false;

  function settle(pending, error, result) {
    if (!pending || pending.settled) return;
    pending.settled = true;
    clearTimeout(pending.timer);
    pending.signal?.removeEventListener('abort', pending.onAbort);
    state?.requests.delete(pending.id);
    if (error) pending.reject(error);
    else pending.resolve(result);
  }

  function stop(error) {
    const old = state;
    if (!old) return;
    state = undefined;
    old.worker.terminate();
    for (const pending of old.requests.values()) settle(pending, error);
    old.requests.clear();
    lifecycle++;
  }

  function receive(origin, event) {
    if (state !== origin || origin.epoch !== lifecycle) return;
    const reply = event?.data;
    if (!reply || typeof reply !== 'object' || !Number.isInteger(reply.id)) {
      stop(new Error('Malformed Worker response'));
      return;
    }
    if (reply.id === origin.registerId && !origin.registered) {
      if (reply.error || 'data' in reply) {
        stop(new Error('Malformed Worker register ACK'));
        return;
      }
      origin.registered = true;
      for (const pending of origin.requests.values()) {
        if (!pending.settled) {
          try {
            origin.worker.postMessage(pending.message);
          } catch (error) {
            stop(error);
            return;
          }
        }
      }
      return;
    }
    const pending = origin.requests.get(reply.id);
    if (!pending || pending.settled) return; // Late/unknown/duplicate reply.
    if (
      pending.epoch !== lifecycle ||
      pending.generation !== generation ||
      pending.geometryKey !== currentKey ||
      ('workerEpoch' in reply && reply.workerEpoch !== pending.epoch) ||
      ('geometryKey' in reply && reply.geometryKey !== pending.geometryKey)
    ) {
      settle(
        pending,
        new Error('Stale Worker epoch/request/geometry mismatch'),
      );
      return;
    }
    if ('error' in reply) {
      const detail = reply.error?.message ?? String(reply.error);
      settle(pending, new Error(`ELK Worker error: ${detail}`));
      return;
    }
    try {
      settle(pending, null, flattenElkLayout(reply.data, pending.prepared));
    } catch (error) {
      settle(pending, error);
    }
  }

  function ensureWorker() {
    if (state) return state;
    const worker = new Worker(workerUrl);
    const origin = {
      worker,
      epoch: lifecycle,
      registerId: nextId++,
      registered: false,
      requests: new Map(),
    };
    state = origin;
    worker.onmessage = (event) => receive(origin, event);
    worker.onerror = (event) => {
      if (state === origin && lifecycle === origin.epoch)
        stop(
          new Error(`ELK Worker failed: ${event?.message ?? 'unknown error'}`),
        );
    };
    worker.onmessageerror = () => {
      if (state === origin && lifecycle === origin.epoch)
        stop(new Error('ELK Worker message error'));
    };
    try {
      worker.postMessage({
        cmd: 'register',
        algorithms: ['layered'],
        id: origin.registerId,
      });
    } catch (error) {
      stop(error);
      throw error;
    }
    return origin;
  }

  function layout(
    prepared,
    {
      direction = 'vertical',
      extraHeight = () => 0,
      signal,
      timeoutMs = WORKER_TIMEOUT_MS,
    } = {},
  ) {
    if (disposed) return Promise.reject(new Error('Control layout disposed'));
    if (signal?.aborted)
      return Promise.reject(new Error('Control layout aborted'));
    let graph;
    try {
      graph = elkGraph(prepared, direction, extraHeight);
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
        throw new Error('Invalid Worker timeout');
    } catch (error) {
      return Promise.reject(error);
    }
    const geometryKey = JSON.stringify([
      prepared.topologyKey,
      direction,
      graph,
    ]);
    generation++;
    currentKey = geometryKey;
    for (const request of state?.requests.values() ?? [])
      settle(request, new Error('Stale control layout request'));
    let origin;
    try {
      origin = ensureWorker();
    } catch (error) {
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const pending = {
        id,
        resolve,
        reject,
        prepared,
        signal,
        geometryKey,
        epoch: origin.epoch,
        generation,
        settled: false,
        message: {
          cmd: 'layout',
          graph,
          layoutOptions: {},
          options: { logging: false, measureExecutionTime: false },
          id,
        },
      };
      pending.onAbort = () => stop(new Error('Control layout aborted'));
      origin.requests.set(id, pending);
      signal?.addEventListener('abort', pending.onAbort, { once: true });
      pending.timer = setTimeout(
        () => stop(new Error('ELK Worker timeout')),
        timeoutMs,
      );
      if (origin.registered) {
        try {
          origin.worker.postMessage(pending.message);
        } catch (error) {
          stop(error);
        }
      }
    });
  }

  return {
    layout,
    dispose() {
      if (disposed) return;
      disposed = true;
      stop(new Error('Control layout disposed'));
    },
  };
}
