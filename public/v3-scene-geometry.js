// Presentation-only ELK input for a previously validated V3 ready variant.
// No graph relationships, group membership, or execution order are inferred here.
import { flattenElkLayout } from './diagram-elk-layout.js';

const finitePositive = (value, label) => {
  if (!Number.isFinite(value) || value <= 0)
    throw new TypeError(`Invalid ${label}: expected a positive finite number`);
  return value;
};

function wrappingFor(children, orientation, viewport) {
  if (children.length < 4) return 'OFF';
  const primary = orientation === 'horizontal' ? 'width' : 'height';
  const available = viewport[primary];
  // Unknown group dimensions are a conservative estimate. ELK computes their
  // real nested sizes; this only decides whether wrapping is worth considering.
  const demand = children.reduce(
    (sum, child) =>
      sum + (child[primary] ?? (primary === 'width' ? 280 : 170)) + 24,
    0,
  );
  return demand > available * 1.25 ? 'MULTI_EDGE' : 'OFF';
}

// ELK may emit cross-hierarchy edges in the root edges[] collection while
// retaining section points relative to edge.container (a nested group).
// Normalize those points into their actual collection owner's coordinates.
// The legacy flattening helper does not interpret edge.container itself.
function normalizeV3EdgeContainers(elk) {
  const copy = structuredClone(elk);
  const origins = new Map([[copy.id, { x: 0, y: 0 }]]);
  const containers = [{ node: copy, x: 0, y: 0 }];
  const seen = new Set();
  for (let i = 0; i < containers.length; i++) {
    const { node, x, y } = containers[i];
    if (seen.has(node)) throw new Error('Invalid cyclic V3 ELK hierarchy');
    seen.add(node);
    for (const child of node.children ?? []) {
      if (!Number.isFinite(child.x) || !Number.isFinite(child.y))
        throw new Error(`Invalid V3 ELK child offset for ${child.id}`);
      if (origins.has(child.id))
        throw new Error(`Duplicate V3 ELK node ${child.id}`);
      const childX = x + child.x;
      const childY = y + child.y;
      origins.set(child.id, { x: childX, y: childY });
      containers.push({ node: child, x: childX, y: childY });
    }
  }
  for (const { node, x, y } of containers) {
    for (const edge of node.edges ?? []) {
      const owner = origins.get(edge.container ?? node.id);
      if (!owner)
        throw new Error(`Unknown V3 ELK edge container ${edge.container}`);
      const offsetX = owner.x - x;
      const offsetY = owner.y - y;
      for (const section of edge.sections ?? []) {
        for (const point of [
          section.startPoint,
          ...(section.bendPoints ?? []),
          section.endPoint,
        ]) {
          if (!point) continue; // Existing strict route validation rejects missing points.
          point.x += offsetX;
          point.y += offsetY;
        }
      }
    }
  }
  return copy;
}

export function buildV3ElkGraph(
  variant,
  {
    orientation = 'horizontal',
    viewport,
    nodeSizes = {},
    groupHeaderHeight = 42,
  } = {},
) {
  if (variant?.availability !== 'ready' || !variant.graph)
    throw new TypeError('V3 geometry requires a validated ready variant');
  if (!['horizontal', 'vertical'].includes(orientation))
    throw new TypeError('Invalid V3 orientation');
  const width = finitePositive(viewport?.width, 'viewport width');
  const height = finitePositive(viewport?.height, 'viewport height');
  finitePositive(groupHeaderHeight, 'group header height');
  const { nodes, edges, groups } = variant.graph;
  if (![nodes, edges, groups].every(Array.isArray))
    throw new TypeError('Invalid validated V3 graph');

  const direction = orientation === 'horizontal' ? 'RIGHT' : 'DOWN';
  const aspect = Math.max(0.5, Math.min(3, width / height));
  const options = {
    'elk.algorithm': 'layered',
    'elk.direction': direction,
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.layered.wrapping.strategy': 'OFF',
    'elk.aspectRatio': aspect,
    'elk.padding': '[top=20,left=20,bottom=20,right=20]',
  };
  const occupiedIds = new Set(
    [...nodes, ...groups, ...edges].map((record) => record.id),
  );
  let rootId = 'v3-scene-root';
  for (let suffix = 1; occupiedIds.has(rootId); suffix++)
    rootId = `v3-scene-root#${suffix}`;
  const root = {
    id: rootId,
    layoutOptions: options,
    children: [],
    edges: [],
  };
  const containers = new Map([[null, root]]);
  for (const group of groups) {
    if (containers.has(group.id))
      throw new Error(`Duplicate group ${group.id}`);
    containers.set(group.id, {
      id: group.id,
      layoutOptions: {
        ...options,
        'elk.padding': `[top=${groupHeaderHeight},left=18,bottom=18,right=18]`,
      },
      children: [],
    });
  }
  for (const group of groups) {
    const parent = containers.get(group.parentGroupId ?? null);
    if (!parent) throw new Error(`Unknown parent for ${group.id}`);
    parent.children.push(containers.get(group.id));
  }
  for (const node of nodes) {
    const parentId = node.groupPathIds.at(-1) ?? null;
    const parent = containers.get(parentId);
    if (!parent) throw new Error(`Unknown group for ${node.id}`);
    const size = Object.hasOwn(nodeSizes, node.id)
      ? nodeSizes[node.id]
      : { width: 260, height: 124 };
    parent.children.push({
      id: node.id,
      width: finitePositive(size?.width, `${node.id} width`),
      height: finitePositive(size?.height, `${node.id} height`),
    });
  }
  root.edges = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.fromNodeId],
    targets: [edge.toNodeId],
  }));
  for (const container of containers.values())
    container.layoutOptions['elk.layered.wrapping.strategy'] = wrappingFor(
      container.children,
      orientation,
      viewport,
    );
  return root;
}

/** Validate and flatten ELK output while restoring the exact supplied V3 records. */
export function flattenV3ElkGraph(elk, variant) {
  if (variant?.availability !== 'ready' || !variant.graph)
    throw new TypeError('V3 geometry requires a validated ready variant');
  const { nodes, groups, edges } = variant.graph;
  const prepared = {
    cards: nodes.map((node) => ({
      id: node.id,
      parentRegionId: node.groupPathIds.at(-1) ?? null,
    })),
    regions: groups.map((group) => ({
      id: group.id,
      parentRegionId: group.parentGroupId,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
    })),
  };
  const layout = flattenElkLayout(normalizeV3EdgeContainers(elk), prepared);
  const nodeGeometry = new Map(
    layout.cards.map(({ id, x, y, width, height }) => [
      id,
      { x, y, width, height },
    ]),
  );
  const groupGeometry = new Map(
    layout.regions.map(({ id, x, y, width, height }) => [
      id,
      { x, y, width, height },
    ]),
  );
  const edgeGeometry = new Map(
    layout.edges.map(({ id, sections, points }) => [id, { sections, points }]),
  );
  for (const edge of layout.edges) {
    for (const section of edge.sections) {
      for (let i = 1; i < section.length; i++) {
        const a = section[i - 1];
        const b = section[i];
        if (Math.abs(a.x - b.x) > 1e-7 && Math.abs(a.y - b.y) > 1e-7)
          throw new Error(`Invalid diagonal V3 ELK route for ${edge.id}`);
        for (const card of layout.cards) {
          // Border contact is a legitimate port; crossing the open interior
          // of any card is never an acceptable geometry-only route.
          const insideX =
            Math.max(a.x, b.x) > card.x + 1e-7 &&
            Math.min(a.x, b.x) < card.x + card.width - 1e-7;
          const insideY =
            Math.max(a.y, b.y) > card.y + 1e-7 &&
            Math.min(a.y, b.y) < card.y + card.height - 1e-7;
          const horizontalCrossing =
            Math.abs(a.y - b.y) <= 1e-7 &&
            a.y > card.y + 1e-7 &&
            a.y < card.y + card.height - 1e-7 &&
            insideX;
          const verticalCrossing =
            Math.abs(a.x - b.x) <= 1e-7 &&
            a.x > card.x + 1e-7 &&
            a.x < card.x + card.width - 1e-7 &&
            insideY;
          if (horizontalCrossing || verticalCrossing)
            throw new Error(`V3 ELK route ${edge.id} crosses node ${card.id}`);
        }
      }
    }
  }
  return {
    width: layout.width,
    height: layout.height,
    nodes: nodes.map((node) => ({ ...node, ...nodeGeometry.get(node.id) })),
    groups: groups.map((group) => ({
      ...group,
      ...groupGeometry.get(group.id),
    })),
    edges: edges.map((edge) => ({ ...edge, ...edgeGeometry.get(edge.id) })),
  };
}

/** Dedicated same-origin worker boundary; superseded requests never paint. */
export function createV3SceneLayout({
  workerUrl = '/vendor/elk-worker.min.js',
  WorkerClass = globalThis.Worker,
} = {}) {
  if (
    typeof workerUrl !== 'string' ||
    !workerUrl.startsWith('/') ||
    workerUrl.startsWith('//') ||
    workerUrl.includes('\\') ||
    workerUrl.split('/').includes('..')
  )
    throw new TypeError(
      'V3 ELK Worker URL must be same-origin and path-absolute',
    );
  let active;
  let disposed = false;
  let serial = 0;

  function cancelActive(reason) {
    if (!active) return;
    const pending = active;
    active = undefined;
    clearTimeout(pending.timer);
    pending.signal?.removeEventListener('abort', pending.abort);
    pending.worker.terminate();
    pending.reject(new Error(reason));
  }

  function layout(variant, settings = {}) {
    if (disposed) return Promise.reject(new Error('V3 layout disposed'));
    // Even a rejected new geometry request supersedes an older viewport epoch.
    cancelActive('Stale V3 layout request');
    if (settings.signal?.aborted)
      return Promise.reject(new Error('V3 layout aborted'));
    let graph;
    try {
      graph = buildV3ElkGraph(variant, settings);
      if (
        !Number.isFinite(settings.timeoutMs ?? 30000) ||
        (settings.timeoutMs ?? 30000) <= 0
      )
        throw new TypeError('Invalid V3 layout timeout');
      if (typeof WorkerClass !== 'function')
        throw new Error('ELK Worker unavailable');
    } catch (error) {
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      let worker;
      try {
        worker = new WorkerClass(workerUrl);
      } catch (error) {
        reject(error);
        return;
      }
      const id = ++serial;
      const pending = { worker, reject, signal: settings.signal };
      active = pending;
      const settle = (error, value) => {
        if (active !== pending) return;
        active = undefined;
        clearTimeout(pending.timer);
        pending.signal?.removeEventListener('abort', pending.abort);
        worker.terminate();
        if (error) reject(error);
        else resolve(value);
      };
      pending.abort = () => settle(new Error('V3 layout aborted'));
      pending.signal?.addEventListener('abort', pending.abort, { once: true });
      if (pending.signal?.aborted) {
        pending.abort();
        return;
      }
      pending.timer = setTimeout(
        () => settle(new Error('V3 ELK Worker timeout')),
        settings.timeoutMs ?? 30000,
      );
      worker.onerror = (event) =>
        settle(
          new Error(
            `V3 ELK Worker failed: ${event?.message ?? 'unknown error'}`,
          ),
        );
      worker.onmessageerror = () =>
        settle(new Error('Malformed V3 ELK Worker message'));
      worker.onmessage = (event) => {
        if (active !== pending) return;
        const reply = event?.data;
        if (!reply || reply.id !== id)
          return settle(new Error('Malformed V3 ELK Worker reply'));
        if (!pending.registered) {
          if ('data' in reply || 'error' in reply)
            return settle(new Error('Malformed V3 ELK registration ACK'));
          pending.registered = true;
          try {
            worker.postMessage({
              cmd: 'layout',
              graph,
              layoutOptions: {},
              options: { logging: false, measureExecutionTime: false },
              id,
            });
          } catch (error) {
            settle(error);
          }
          return;
        }
        if ('error' in reply)
          return settle(
            new Error(
              `V3 ELK Worker error: ${reply.error?.message ?? String(reply.error)}`,
            ),
          );
        try {
          settle(null, flattenV3ElkGraph(reply.data, variant));
        } catch (error) {
          settle(error);
        }
      };
      try {
        worker.postMessage({ cmd: 'register', algorithms: ['layered'], id });
      } catch (error) {
        settle(error);
      }
    });
  }

  return {
    layout,
    dispose() {
      disposed = true;
      cancelActive('V3 layout disposed');
    },
  };
}
