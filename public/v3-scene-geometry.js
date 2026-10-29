// Presentation-only ELK input for a previously validated V3 ready variant.
// No graph relationships, group membership, or execution order are inferred here.
import { flattenElkLayout } from './diagram-elk-layout.js';

const finitePositive = (value, label) => {
  if (!Number.isFinite(value) || value <= 0)
    throw new TypeError(`Invalid ${label}: expected a positive finite number`);
  return value;
};

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
    'elk.layered.wrapping.strategy': 'MULTI_EDGE',
    'elk.aspectRatio': aspect,
    'elk.padding': '[top=20,left=20,bottom=20,right=20]',
  };
  const root = {
    id: 'v3-scene-root',
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
  const layout = flattenElkLayout(elk, prepared);
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
    cancelActive('Stale V3 layout request');
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
