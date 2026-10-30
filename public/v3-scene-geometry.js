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

const DEFAULT_NODE_SIZE = { width: 260, height: 124 };
const DEFAULT_COLLAPSED_SIZE = { width: 220, height: 90 };
const MAX_V3_TOPOLOGY_KEY_CODE_UNITS = 32 * 1024 * 1024;
const MAX_V3_EDGE_LABEL_CODE_UNITS = 4096;

// ELK needs at least the renderer's collision envelope before it routes edges.
// Wide glyphs reserve extra space without changing supplied labels or semantics.
function nativeV3EdgeLabels(text) {
  if (!text) return [];
  if (typeof text !== 'string' || text.length > MAX_V3_EDGE_LABEL_CODE_UNITS)
    throw new Error('V3 edge label exceeds safe resource budget');
  const lines = text.split('\n');
  if (lines.length > 64)
    throw new Error('V3 edge label exceeds safe resource budget');
  let width = 46;
  for (const line of lines) {
    let reserved = 20;
    for (const character of line) {
      const point = character.codePointAt(0);
      reserved += point < 128 ? 6 : point >= 0x1f000 ? 16 : 12;
    }
    width = Math.max(width, line.length * 6 + 20, reserved);
  }
  const height = lines.length * 14 + 12;
  if (width > 4096 || height > 1024)
    throw new Error('V3 edge label exceeds safe resource budget');
  return [{ text, width, height }];
}

// JSON objects are unordered; ELK child/edge arrays are not. Keep their order
// while using Unicode code-unit sorting for every object's property names.
function canonicalV3Json(value) {
  const fragments = [];
  let length = 0;
  const pending = [{ value }];
  const ancestors = new WeakSet();
  function append(fragment) {
    length += fragment.length;
    if (length > MAX_V3_TOPOLOGY_KEY_CODE_UNITS)
      throw new Error('V3 topology key exceeds safe resource budget');
    fragments.push(fragment);
  }
  while (pending.length) {
    const next = pending.pop();
    if (Object.hasOwn(next, 'exit')) {
      ancestors.delete(next.exit);
      continue;
    }
    if (Object.hasOwn(next, 'literal')) {
      append(next.literal);
      continue;
    }
    const item = next.value;
    if (item === null) append('null');
    else if (typeof item === 'string') append(JSON.stringify(item));
    else if (typeof item === 'boolean') append(String(item));
    else if (typeof item === 'number') {
      if (!Number.isFinite(item))
        throw new TypeError('Invalid V3 topology number');
      append(Object.is(item, -0) ? '-0' : JSON.stringify(item));
    } else if (Array.isArray(item)) {
      if (ancestors.has(item)) throw new TypeError('Cyclic V3 topology');
      ancestors.add(item);
      append('[');
      pending.push({ exit: item });
      pending.push({ literal: ']' });
      for (let i = item.length - 1; i >= 0; i--) {
        pending.push({ value: item[i] });
        if (i > 0) pending.push({ literal: ',' });
      }
    } else if (
      item &&
      typeof item === 'object' &&
      (Object.getPrototypeOf(item) === Object.prototype ||
        Object.getPrototypeOf(item) === null)
    ) {
      if (ancestors.has(item)) throw new TypeError('Cyclic V3 topology');
      ancestors.add(item);
      append('{');
      pending.push({ exit: item });
      pending.push({ literal: '}' });
      const keys = Object.keys(item).sort();
      for (let i = keys.length - 1; i >= 0; i--) {
        pending.push({ value: item[keys[i]] });
        pending.push({ literal: ':' });
        pending.push({ literal: JSON.stringify(keys[i]) });
        if (i > 0) pending.push({ literal: ',' });
      }
    } else {
      throw new TypeError('Invalid V3 topology JSON value');
    }
  }
  return fragments.join('');
}

function detachedFrozenV3Geometry(value) {
  const detached = structuredClone(value);
  const seen = new WeakSet();
  const pending = [detached];
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    for (const child of Object.values(current))
      if (child && typeof child === 'object') pending.push(child);
    Object.freeze(current);
  }
  return detached;
}

function cardMeasurements(measuredCards) {
  if (measuredCards instanceof Map) return [...measuredCards.entries()];
  if (
    measuredCards === null ||
    typeof measuredCards !== 'object' ||
    Array.isArray(measuredCards)
  )
    throw new TypeError('Invalid V3 measured cards');
  return Object.entries(measuredCards);
}

function canonicalIds(value, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value) && !(value instanceof Set))
    throw new TypeError(`Invalid V3 ${label}`);
  const ids = [...value];
  if (ids.some((id) => typeof id !== 'string' || !id))
    throw new TypeError(`Invalid V3 ${label}`);
  return [...new Set(ids)].sort();
}

/**
 * Project only visible presentation geometry. The supplied semantic variant
 * and its playback remain immutable: no edge is synthesized or merged.
 * Collapsed groups are cards for ELK/strict route validation, but remain
 * original semantic groups when geometry is returned to the renderer.
 */
export function prepareV3LayoutInput(
  readyVariant,
  presentationState = {},
  measuredCards = {},
) {
  if (readyVariant?.availability !== 'ready' || !readyVariant.graph)
    throw new TypeError('V3 geometry requires a validated ready variant');
  if (!presentationState || typeof presentationState !== 'object')
    throw new TypeError('Invalid V3 presentation state');
  const { nodes, edges, groups } = readyVariant.graph;
  if (![nodes, edges, groups].every(Array.isArray))
    throw new TypeError('Invalid validated V3 graph');
  const orientation = presentationState.orientation ?? 'horizontal';
  if (!['horizontal', 'vertical'].includes(orientation))
    throw new TypeError('Invalid V3 orientation');
  const viewport = {
    width: finitePositive(presentationState.viewport?.width, 'viewport width'),
    height: finitePositive(
      presentationState.viewport?.height,
      'viewport height',
    ),
  };
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const knownCardIds = new Set([
    ...nodes.map(({ id }) => id),
    ...groupsById.keys(),
  ]);
  const collapsedGroupIds = canonicalIds(
    presentationState.collapsedGroupIds,
    'collapsed group IDs',
  );
  for (const id of collapsedGroupIds)
    if (!groupsById.has(id))
      throw new Error(`Unknown collapsed V3 group ${id}`);
  const collapsed = new Set(collapsedGroupIds);
  const sizes = new Map();
  for (const [id, size] of cardMeasurements(measuredCards)) {
    if (!knownCardIds.has(id))
      throw new Error(`Unknown measured V3 card ${id}`);
    sizes.set(id, {
      width: finitePositive(size?.width, `${id} width`),
      height: finitePositive(size?.height, `${id} height`),
    });
  }
  const firstCollapsedAncestor = (node) =>
    node.groupPathIds.find((id) => collapsed.has(id)) ?? null;
  const visibleNodes = nodes.filter((node) => !firstCollapsedAncestor(node));
  const visibleGroups = groups.filter((group) => {
    const seenAncestors = new Set();
    for (
      let parent = group.parentGroupId;
      parent !== null && parent !== undefined;
      parent = groupsById.get(parent)?.parentGroupId
    ) {
      if (collapsed.has(parent)) return false;
      if (!groupsById.has(parent) || seenAncestors.has(parent))
        throw new Error(`Invalid V3 parent group for ${group.id}`);
      seenAncestors.add(parent);
    }
    return true;
  });
  const cards = visibleNodes.map((node) => ({
    id: node.id,
    kind: 'node',
    parentRegionId: node.groupPathIds.at(-1) ?? null,
    ...sizes.get(node.id),
  }));
  const regions = [];
  for (const group of visibleGroups) {
    if (collapsed.has(group.id)) {
      cards.push({
        id: group.id,
        kind: 'collapsed-group',
        parentRegionId: group.parentGroupId,
        ...(sizes.get(group.id) ?? DEFAULT_COLLAPSED_SIZE),
      });
    } else {
      regions.push({
        id: group.id,
        parentRegionId: group.parentGroupId,
      });
    }
  }
  const anchors = new Map(
    nodes.map((node) => [node.id, firstCollapsedAncestor(node) ?? node.id]),
  );
  const projectedEdges = [];
  const hiddenEdgeIds = [];
  for (const edge of edges) {
    const source = anchors.get(edge.fromNodeId);
    const target = anchors.get(edge.toNodeId);
    if (!source || !target)
      throw new Error(`Unknown V3 edge endpoint for ${edge.id}`);
    if (source === target && collapsed.has(source)) {
      hiddenEdgeIds.push(edge.id);
      continue;
    }
    projectedEdges.push({
      ...edge,
      source,
      target,
      originalSourceId: edge.fromNodeId,
      originalTargetId: edge.toNodeId,
      layoutSourceId: source,
      layoutTargetId: target,
      underlyingEdgeIds: [edge.id],
    });
  }
  const expandedValueIds = canonicalIds(
    presentationState.expandedValueIds ?? presentationState.expandedValuesIds,
    'expanded value IDs',
  );
  // Only geometry-affecting state belongs here. In particular, playback
  // cursor, frames, active IDs, selection and highlight do not relayout.
  const topologyKey = canonicalV3Json([
    'v3-layout-projection-2',
    presentationState.variantId ?? readyVariant.variantId ?? null,
    readyVariant.artifact?.id ?? null,
    readyVariant.artifact?.revision ?? null,
    readyVariant.artifact?.sourceHash ?? null,
    // Cached output includes these original records, not just geometry. This
    // prevents stale labels/provenance when artifact metadata is reused.
    readyVariant.graph,
    orientation,
    viewport.width,
    viewport.height,
    collapsedGroupIds,
    expandedValueIds,
    presentationState.valuesExpansionKey ?? null,
    presentationState.fontRevision ?? null,
    presentationState.renderRevision ?? null,
    finitePositive(
      presentationState.groupHeaderHeight ?? 42,
      'group header height',
    ),
    [...sizes].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  ]);
  return {
    cards,
    regions,
    edges: projectedEdges,
    hiddenEdgeIds,
    topologyKey,
  };
}

function resolvedPresentation(settings) {
  return {
    ...settings.presentationState,
    orientation:
      settings.orientation ??
      settings.presentationState?.orientation ??
      'horizontal',
    viewport: settings.viewport ?? settings.presentationState?.viewport,
    groupHeaderHeight:
      settings.groupHeaderHeight ??
      settings.presentationState?.groupHeaderHeight ??
      42,
  };
}

function verifyV3Projection(variant, projection) {
  const collapsedGroupIds = projection.cards
    .filter(({ kind }) => kind === 'collapsed-group')
    .map(({ id }) => id);
  const expected = prepareV3LayoutInput(variant, {
    collapsedGroupIds,
    viewport: { width: 1, height: 1 },
  });
  const ownership = (items) =>
    items.map(({ id, kind, parentRegionId }) => [
      id,
      kind ?? null,
      parentRegionId ?? null,
    ]);
  if (
    JSON.stringify(ownership(projection.cards)) !==
      JSON.stringify(ownership(expected.cards)) ||
    JSON.stringify(ownership(projection.regions)) !==
      JSON.stringify(ownership(expected.regions))
  )
    throw new Error('Invalid V3 projection visible entity subset');
  const identifiers = (items) =>
    items.map(({ id, source, target }) => [id, source, target]);
  if (
    JSON.stringify(identifiers(projection.edges)) !==
      JSON.stringify(identifiers(expected.edges)) ||
    JSON.stringify(projection.hiddenEdgeIds) !==
      JSON.stringify(expected.hiddenEdgeIds)
  )
    throw new Error('Invalid V3 projection edge subset');
  const originals = new Map(variant.graph.edges.map((edge) => [edge.id, edge]));
  for (const edge of projection.edges) {
    const original = originals.get(edge.id);
    if (
      !original ||
      Object.entries(original).some(
        ([key, value]) => JSON.stringify(edge[key]) !== JSON.stringify(value),
      ) ||
      edge.originalSourceId !== original.fromNodeId ||
      edge.originalTargetId !== original.toNodeId ||
      edge.layoutSourceId !== edge.source ||
      edge.layoutTargetId !== edge.target ||
      JSON.stringify(edge.underlyingEdgeIds) !== JSON.stringify([edge.id])
    )
      throw new Error(`Invalid V3 projection edge provenance for ${edge.id}`);
  }
}

export function buildV3ElkGraph(
  variant,
  {
    orientation,
    viewport,
    nodeSizes = {},
    presentationState,
    measuredCards,
    groupHeaderHeight,
  } = {},
) {
  // Explicit layout options take precedence over presentation defaults.
  const state = resolvedPresentation({
    orientation,
    viewport,
    presentationState,
    groupHeaderHeight,
  });
  const prepared = prepareV3LayoutInput(
    variant,
    state,
    measuredCards ?? nodeSizes,
  );
  return buildV3ElkGraphFromPrepared(
    prepared,
    {
      orientation: state.orientation,
      viewport: state.viewport,
      groupHeaderHeight: state.groupHeaderHeight,
    },
    variant,
  );
}

function buildV3ElkGraphFromPrepared(
  prepared,
  { orientation, viewport, groupHeaderHeight = 42 },
  variant,
) {
  if (!['horizontal', 'vertical'].includes(orientation))
    throw new TypeError('Invalid V3 orientation');
  const width = finitePositive(viewport?.width, 'viewport width');
  const height = finitePositive(viewport?.height, 'viewport height');
  finitePositive(groupHeaderHeight, 'group header height');
  const { cards, edges, regions } = prepared;

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
    [
      ...variant.graph.nodes,
      ...variant.graph.groups,
      ...variant.graph.edges,
    ].map((record) => record.id),
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
  for (const group of regions) {
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
  for (const group of regions) {
    const parent = containers.get(group.parentRegionId ?? null);
    if (!parent) throw new Error(`Unknown parent for ${group.id}`);
    parent.children.push(containers.get(group.id));
  }
  for (const card of cards) {
    const parent = containers.get(card.parentRegionId ?? null);
    if (!parent) throw new Error(`Unknown group for ${card.id}`);
    const fallback =
      card.kind === 'collapsed-group'
        ? DEFAULT_COLLAPSED_SIZE
        : DEFAULT_NODE_SIZE;
    parent.children.push({
      id: card.id,
      width: finitePositive(card.width ?? fallback.width, `${card.id} width`),
      height: finitePositive(
        card.height ?? fallback.height,
        `${card.id} height`,
      ),
    });
  }
  root.edges = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
    labels: nativeV3EdgeLabels(edge.label),
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
export function flattenV3ElkGraph(elk, variant, prepared) {
  if (variant?.availability !== 'ready' || !variant.graph)
    throw new TypeError('V3 geometry requires a validated ready variant');
  const { nodes, groups, edges } = variant.graph;
  const projection = prepared ?? {
    cards: nodes.map((node) => ({
      id: node.id,
      parentRegionId: node.groupPathIds.at(-1) ?? null,
    })),
    regions: groups.map((group) => ({
      id: group.id,
      parentRegionId: group.parentGroupId,
    })),
    edges: edges.map((edge) => ({
      ...edge,
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      originalSourceId: edge.fromNodeId,
      originalTargetId: edge.toNodeId,
      layoutSourceId: edge.fromNodeId,
      layoutTargetId: edge.toNodeId,
      underlyingEdgeIds: [edge.id],
    })),
  };
  if (prepared) verifyV3Projection(variant, projection);
  const layout = flattenElkLayout(normalizeV3EdgeContainers(elk), projection);
  const nodeGeometry = new Map(
    layout.cards.map(({ id, x, y, width, height }) => [
      id,
      { x, y, width, height },
    ]),
  );
  const groupGeometry = new Map(
    [
      ...layout.regions,
      ...layout.cards.filter(({ kind }) => kind === 'collapsed-group'),
    ].map(({ id, x, y, width, height }) => [id, { x, y, width, height }]),
  );
  const edgeGeometry = new Map(
    layout.edges.map(({ id, sections, points }) => [id, { sections, points }]),
  );
  const cardsById = new Map(layout.cards.map((card) => [card.id, card]));
  const boundary = (point, card) => {
    if (!card) return false;
    const withinX =
      point.x >= card.x - 1e-6 && point.x <= card.x + card.width + 1e-6;
    const withinY =
      point.y >= card.y - 1e-6 && point.y <= card.y + card.height + 1e-6;
    return (
      withinX &&
      withinY &&
      (Math.abs(point.x - card.x) < 1e-6 ||
        Math.abs(point.x - card.x - card.width) < 1e-6 ||
        Math.abs(point.y - card.y) < 1e-6 ||
        Math.abs(point.y - card.y - card.height) < 1e-6)
    );
  };
  for (const edge of layout.edges) {
    const source = cardsById.get(edge.source);
    const target = cardsById.get(edge.target);
    if (
      !boundary(edge.points[0], source) ||
      !boundary(edge.points.at(-1), target)
    )
      throw new Error(`Invalid V3 ELK endpoint port for ${edge.id}`);
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
    nodes: nodes
      .filter((node) => nodeGeometry.has(node.id))
      .map((node) => ({ ...node, ...nodeGeometry.get(node.id) })),
    groups: groups
      .filter((group) => groupGeometry.has(group.id))
      .map((group) => ({
        ...group,
        ...groupGeometry.get(group.id),
      })),
    edges: projection.edges.map((edge) => ({
      ...edge,
      ...edgeGeometry.get(edge.id),
    })),
    hiddenEdgeIds: projection.hiddenEdgeIds ?? [],
    topologyKey: projection.topologyKey,
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
  let cached;

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
    let graph;
    let projection;
    let variantSnapshot;
    try {
      if (settings.signal?.aborted) throw new Error('V3 layout aborted');
      // One detached request-time snapshot owns the layout graph, key and
      // later Worker reply flatten. Caller mutation cannot cross epochs.
      variantSnapshot = structuredClone(variant);
      if (settings.presentationState !== undefined) {
        const state = structuredClone(resolvedPresentation(settings));
        const measured = structuredClone(
          settings.measuredCards ?? settings.nodeSizes ?? {},
        );
        projection = prepareV3LayoutInput(variantSnapshot, state, measured);
        graph = buildV3ElkGraphFromPrepared(projection, state, variantSnapshot);
      } else {
        graph = buildV3ElkGraph(variantSnapshot, settings);
      }
      if (
        !Number.isFinite(settings.timeoutMs ?? 30000) ||
        (settings.timeoutMs ?? 30000) <= 0
      )
        throw new TypeError('Invalid V3 layout timeout');
      if (typeof WorkerClass !== 'function')
        throw new Error('ELK Worker unavailable');
    } catch (error) {
      // Even invalid new viewports supersede an earlier Worker epoch.
      cancelActive('Stale V3 layout request');
      return Promise.reject(error);
    }
    const key = projection?.topologyKey;
    if (key && active?.key === key && active.signal === settings.signal)
      return active.promise;
    cancelActive('Stale V3 layout request');
    if (key && cached?.key === key) return Promise.resolve(cached.result);
    const promise = new Promise((resolve, reject) => {
      let worker;
      try {
        worker = new WorkerClass(workerUrl);
      } catch (error) {
        reject(error);
        return;
      }
      const id = ++serial;
      const pending = { worker, reject, signal: settings.signal, key };
      active = pending;
      const settle = (error, value) => {
        if (active !== pending) return;
        active = undefined;
        clearTimeout(pending.timer);
        pending.signal?.removeEventListener('abort', pending.abort);
        worker.terminate();
        if (error) reject(error);
        else {
          if (key) cached = { key, result: value };
          resolve(value);
        }
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
        if (!pending.registered) {
          let validAck;
          try {
            validAck =
              reply !== null &&
              typeof reply === 'object' &&
              !Array.isArray(reply) &&
              Reflect.ownKeys(reply).length === 1 &&
              Object.hasOwn(reply, 'id') &&
              reply.id === id;
          } catch {
            return settle(new Error('Malformed V3 ELK registration ACK'));
          }
          if (!validAck)
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
        if (!reply || reply.id !== id)
          return settle(new Error('Malformed V3 ELK Worker reply'));
        if ('error' in reply)
          return settle(
            new Error(
              `V3 ELK Worker error: ${reply.error?.message ?? String(reply.error)}`,
            ),
          );
        try {
          settle(
            null,
            detachedFrozenV3Geometry(
              flattenV3ElkGraph(reply.data, variantSnapshot, projection),
            ),
          );
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
    if (active) active.promise = promise;
    return promise;
  }

  return {
    layout,
    dispose() {
      disposed = true;
      cancelActive('V3 layout disposed');
    },
  };
}
