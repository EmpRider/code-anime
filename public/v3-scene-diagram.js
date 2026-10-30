// X6 paints validated V3 semantics at CA029-provided positions. It never
// derives a node, graph edge, simulated branch, or source relationship.
import { reserveRouteLabel } from './diagram-label-placement.js';

const NODE_ROLES = {
  decision: {
    shape: 'polygon',
    points: '0,50 50,0 100,50 50,100',
    color: '#f7bc72',
  },
  switch: {
    shape: 'polygon',
    points: '0,50 24,0 76,0 100,50 76,100 24,100',
    color: '#85d7f2',
  },
  loop: { shape: 'rect', color: '#baa3ff', radius: 18 },
  iteration: { shape: 'rect', color: '#baa3ff', radius: 18 },
  try: { shape: 'rect', color: '#f3ac87', radius: 6 },
  catch: { shape: 'rect', color: '#f3ac87', radius: 6 },
  finally: { shape: 'rect', color: '#f3ac87', radius: 6 },
  lambda: { shape: 'rect', color: '#a7e3c1', radius: 24 },
};

const EDGE_COLORS = {
  'branch-true': '#6bd5a9',
  'branch-false': '#efad88',
  case: '#87c6ec',
  'loop-back': '#b5a0ed',
  'loop-exit': '#b9c4d9',
  exception: '#f393a3',
  finally: '#f3ac87',
  unresolved: '#9ba8be',
};

function indexById(records, label) {
  if (!Array.isArray(records)) throw new TypeError(`Invalid V3 ${label}`);
  const indexed = new Map();
  for (const record of records) {
    if (typeof record?.id !== 'string' || !record.id || indexed.has(record.id))
      throw new Error(`Invalid duplicate or missing V3 ${label} ID`);
    indexed.set(record.id, record);
  }
  return indexed;
}

function box(record, label) {
  if (
    ![record?.x, record?.y, record?.width, record?.height].every(
      Number.isFinite,
    ) ||
    record.width <= 0 ||
    record.height <= 0
  )
    throw new Error(`Invalid V3 ${label} geometry ${record?.id ?? ''}`);
  return {
    x: record.x,
    y: record.y,
    width: record.width,
    height: record.height,
  };
}

function routePoints(edge) {
  const points = edge.points;
  if (!Array.isArray(points) || points.length < 2)
    throw new Error(`Missing V3 route for ${edge.id}`);
  for (const point of points)
    if (![point?.x, point?.y].every(Number.isFinite))
      throw new Error(`Invalid V3 route point for ${edge.id}`);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (Math.abs(a.x - b.x) > 1e-7 && Math.abs(a.y - b.y) > 1e-7)
      throw new Error(`Invalid diagonal V3 route for ${edge.id}`);
  }
  return points;
}

function labelPosition(points, labelBox) {
  const center = {
    x: labelBox.x + labelBox.width / 2,
    y: labelBox.y + labelBox.height / 2,
  };
  const segments = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const length = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (!length) continue;
    const t =
      a.x === b.x
        ? Math.max(0, Math.min(1, (center.y - a.y) / (b.y - a.y)))
        : Math.max(0, Math.min(1, (center.x - a.x) / (b.x - a.x)));
    const projected = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const distanceSquared =
      (center.x - projected.x) ** 2 + (center.y - projected.y) ** 2;
    segments.push({
      length,
      along: total + length * t,
      projected,
      distanceSquared,
    });
    total += length;
  }
  if (!total) throw new Error('Invalid zero-length V3 route');
  const nearest = segments.reduce(
    (best, segment) =>
      !best || segment.distanceSquared < best.distanceSquared ? segment : best,
    null,
  );
  return {
    distance: nearest.along / total,
    offset: {
      x: center.x - nearest.projected.x,
      y: center.y - nearest.projected.y,
    },
    options: { absoluteOffset: true },
  };
}

function nestedDepth(group, groups) {
  let depth = 0;
  let parent = group.parentGroupId;
  const seen = new Set([group.id]);
  while (parent != null) {
    if (seen.has(parent)) throw new Error('Cyclic V3 group geometry');
    seen.add(parent);
    const parentGroup = groups.get(parent);
    if (!parentGroup) throw new Error(`Unknown parent V3 group ${parent}`);
    parent = parentGroup.parentGroupId;
    depth++;
  }
  return depth;
}

function preparePaint(variant, geometry, presentationState) {
  if (variant?.availability !== 'ready' || !variant.graph)
    throw new TypeError('V3 X6 renderer requires a validated ready variant');
  const nodes = indexById(variant.graph.nodes, 'semantic node');
  const groups = indexById(variant.graph.groups, 'semantic group');
  const edges = indexById(variant.graph.edges, 'semantic edge');
  const shownNodes = indexById(geometry?.nodes, 'geometry node');
  const shownGroups = indexById(geometry?.groups, 'geometry group');
  const shownEdges = indexById(geometry?.edges, 'geometry edge');
  if (
    ![geometry?.width, geometry?.height].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  )
    throw new Error('Invalid V3 geometry bounds');
  const collapsed = new Set(presentationState?.collapsedGroupIds ?? []);
  for (const id of collapsed)
    if (!groups.has(id)) throw new Error(`Unknown collapsed group ${id}`);
  const visibleCollapsed = new Set(
    [...collapsed].filter((id) => {
      let ancestor = groups.get(id).parentGroupId;
      while (ancestor != null) {
        if (collapsed.has(ancestor)) return false;
        ancestor = groups.get(ancestor)?.parentGroupId;
      }
      return true;
    }),
  );
  // Visibility is a projection of supplied group ancestry, not a geometry
  // omission policy: every unrelated original ID must remain visible.
  for (const [id, node] of nodes) {
    const visible = !(node.groupPathIds ?? []).some((groupId) =>
      collapsed.has(groupId),
    );
    if (visible && !shownNodes.has(id))
      throw new Error(`Missing visible V3 node ${id}`);
  }
  for (const [id, group] of groups) {
    let ancestor = group.parentGroupId;
    let visible = true;
    while (ancestor != null) {
      if (collapsed.has(ancestor)) {
        visible = false;
        break;
      }
      ancestor = groups.get(ancestor)?.parentGroupId;
    }
    if (visible && !shownGroups.has(id))
      throw new Error(`Missing visible V3 group ${id}`);
  }
  for (const [id, item] of shownNodes) {
    if (!nodes.has(id)) throw new Error(`Unknown V3 geometry node ${id}`);
    box(item, 'node');
    if (
      (nodes.get(id).groupPathIds ?? []).some((groupId) =>
        collapsed.has(groupId),
      )
    )
      throw new Error(`Collapsed V3 descendant still painted: ${id}`);
  }
  for (const [id, item] of shownGroups) {
    if (!groups.has(id)) throw new Error(`Unknown V3 geometry group ${id}`);
    box(item, 'group');
    let ancestor = groups.get(id).parentGroupId;
    while (ancestor != null) {
      if (collapsed.has(ancestor))
        throw new Error(`Collapsed V3 child group still painted: ${id}`);
      ancestor = groups.get(ancestor)?.parentGroupId;
    }
  }
  for (const id of visibleCollapsed)
    if (!shownGroups.has(id))
      throw new Error(`Missing collapsed V3 group ${id}`);
  const paintIds = geometry.paintEdgeIds ??
    geometry.visibleEdgeIds ?? [...shownEdges.keys()];
  const paint = new Set(paintIds);
  for (const id of shownEdges.keys())
    if (!edges.has(id)) throw new Error(`Unknown V3 geometry edge ${id}`);
  if (
    paint.size !== paintIds.length ||
    paint.size !== shownEdges.size ||
    [...shownEdges.keys()].some((id) => !paint.has(id))
  )
    throw new Error('Invalid V3 paint edge set');
  const hidden = geometry.hiddenEdgeIds ?? [];
  const hiddenSet = new Set(hidden);
  const expectedAnchors = new Map(
    [...nodes].map(([id, node]) => [
      id,
      (node.groupPathIds ?? []).find((groupId) => collapsed.has(groupId)) ?? id,
    ]),
  );
  if (
    hiddenSet.size !== hidden.length ||
    [...edges.keys()].some((id) => !paint.has(id) && !hiddenSet.has(id)) ||
    [...hiddenSet].some((id) => !edges.has(id) || paint.has(id)) ||
    [...edges.values()].some((edge) => {
      const source = expectedAnchors.get(edge.fromNodeId);
      const target = expectedAnchors.get(edge.toNodeId);
      return (
        hiddenSet.has(edge.id) !==
        (source === target && visibleCollapsed.has(source))
      );
    })
  )
    throw new Error('Invalid V3 hidden edge set');
  const preparedEdges = [];
  for (const [id, visual] of shownEdges) {
    const original = edges.get(id);
    if (!original) throw new Error(`Unknown V3 geometry edge ${id}`);
    if (
      visual.underlyingEdgeIds &&
      (visual.underlyingEdgeIds.length !== 1 ||
        visual.underlyingEdgeIds[0] !== id)
    )
      throw new Error(`Invalid V3 edge provenance ${id}`);
    const from = visual.layoutSourceId ?? original.fromNodeId;
    const to = visual.layoutTargetId ?? original.toNodeId;
    if (
      from !== expectedAnchors.get(original.fromNodeId) ||
      to !== expectedAnchors.get(original.toNodeId)
    )
      throw new Error(`Incorrect V3 projected edge endpoints for ${id}`);
    if (
      !(
        shownNodes.has(from) ||
        (collapsed.has(from) && shownGroups.has(from))
      ) ||
      !(shownNodes.has(to) || (collapsed.has(to) && shownGroups.has(to)))
    )
      throw new Error(`Invalid V3 layout endpoints for ${id}`);
    preparedEdges.push({
      visual,
      original,
      from,
      to,
      points: routePoints(visual),
    });
  }
  if (collapsed.size && !Array.isArray(geometry.hiddenEdgeIds))
    throw new Error('Collapsed V3 projection lacks hidden edge IDs');
  const activeEdges = new Set(presentationState?.activeEdgeIds ?? []);
  const hiddenActive = new Map([...visibleCollapsed].map((id) => [id, []]));
  for (const id of hidden) {
    if (!activeEdges.has(id)) continue;
    const edge = edges.get(id);
    for (const groupId of visibleCollapsed) {
      const belongs = [edge.fromNodeId, edge.toNodeId].some((nodeId) =>
        nodes.get(nodeId)?.groupPathIds?.includes(groupId),
      );
      if (belongs) hiddenActive.get(groupId).push(id);
    }
  }
  return {
    nodes,
    groups,
    shownNodes,
    shownGroups,
    preparedEdges,
    hidden,
    collapsed,
    activeEdges,
    hiddenActive,
  };
}

function shapeFor(node) {
  const role = NODE_ROLES[node.kind] ?? {
    shape: 'rect',
    color: '#839bbb',
    radius: 10,
  };
  const unresolved = node.certainty === 'unresolved';
  return {
    shape: role.shape,
    attrs: {
      body: {
        fill: '#1c2942',
        stroke: unresolved ? '#a6aabc' : role.color,
        strokeWidth: 2,
        strokeDasharray: unresolved ? '4 3' : '',
        rx: role.radius ?? 0,
        ry: role.radius ?? 0,
        ...(role.points ? { refPoints: role.points } : {}),
      },
      label: {
        text: node.label,
        fill: '#f2f5ff',
        fontSize: 13,
        fontWeight: 650,
        textWrap: { width: -20, height: -12, ellipsis: false },
      },
      root: {
        tabindex: 0,
        'aria-label': `${node.kind}: ${node.label} (${node.certainty})`,
      },
    },
  };
}

/** Mount one validated, already laid-out scene. The caller owns layout and teardown. */
export async function renderV3Scene(
  container,
  readyVariant,
  geometry,
  presentationState = {},
  options = {},
) {
  const paint = preparePaint(readyVariant, geometry, presentationState);
  const obstacles = [
    ...[...paint.shownNodes.values()].map((item) => box(item, 'node')),
    ...[...paint.shownGroups.values()].map((item) => {
      const dimensions = box(item, 'group');
      return { ...dimensions, height: Math.min(42, dimensions.height) };
    }),
  ];
  const reserved = [];
  const labels = new Map();
  for (const { original, points } of paint.preparedEdges) {
    if (!original.label) continue;
    const label = reserveRouteLabel(
      points,
      original.label,
      obstacles,
      reserved,
    );
    if (!label)
      throw new Error(
        `No collision-free V3 edge label position for ${original.id}`,
      );
    labels.set(original.id, labelPosition(points, label));
  }
  // Node tests inject a graph; Vite resolves the installed X6 module at browser runtime.
  const GraphClass = options.GraphClass ?? (await import('@antv/x6')).Graph;
  if (typeof GraphClass !== 'function') throw new Error('X6 Graph unavailable');
  container.replaceChildren();
  container.tabIndex = 0;
  container.setAttribute('role', 'region');
  container.setAttribute(
    'aria-label',
    'Code Anime V3 semantic flow graph; arrows pan, plus and minus zoom',
  );
  const graph = new GraphClass({
    container,
    async: false,
    autoResize: false,
    panning: true,
    mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'] },
    interacting: false,
    background: { color: 'transparent' },
  });
  const cells = new Map();
  const groupOrder = [...paint.shownGroups.keys()].sort(
    (a, b) =>
      nestedDepth(paint.groups.get(a), paint.groups) -
      nestedDepth(paint.groups.get(b), paint.groups),
  );
  for (const id of groupOrder) {
    const group = paint.groups.get(id);
    const dimensions = box(paint.shownGroups.get(id), 'group');
    const isCollapsed = paint.collapsed.has(id);
    const activeInside = isCollapsed
      ? (paint.hiddenActive.get(id)?.length ?? 0)
      : 0;
    const cue = activeInside
      ? `${activeInside} active edge${activeInside === 1 ? '' : 's'} inside`
      : '';
    const cell = graph.addNode({
      id,
      ...dimensions,
      shape: 'rect',
      zIndex: -10 + nestedDepth(group, paint.groups),
      attrs: {
        body: {
          fill: isCollapsed ? '#293455' : '#152239',
          fillOpacity: isCollapsed ? 0.95 : 0.68,
          stroke: activeInside
            ? '#ffd36e'
            : (NODE_ROLES[group.kind]?.color ?? '#6b89bd'),
          strokeWidth: activeInside ? 3 : 1.5,
          strokeDasharray: activeInside
            ? ''
            : group.certainty === 'unresolved'
              ? '5 4'
              : '8 3',
          rx: 13,
          ry: 13,
        },
        label: {
          text: cue ? `${group.label}\n● ${cue}` : group.label,
          fill: '#ebefff',
          fontWeight: 700,
          fontSize: 13,
          refX: 15,
          refY: isCollapsed ? '50%' : 23,
          textAnchor: 'start',
          textVerticalAnchor: 'middle',
          textWrap: { width: -24, height: -8, ellipsis: false },
        },
        root: {
          tabindex: 0,
          'aria-label': `${group.kind} group: ${group.label}${isCollapsed ? ', collapsed' : ''}${cue ? `, ${cue}` : ''}`,
        },
      },
      data: {
        ...group,
        role: group.kind,
        collapsed: isCollapsed,
        hiddenActiveEdgeIds: paint.hiddenActive.get(id) ?? [],
      },
    });
    cells.set(id, cell);
    const parent = cells.get(group.parentGroupId);
    if (parent) parent.addChild(cell);
  }
  for (const [id, dimensions] of paint.shownNodes) {
    const node = paint.nodes.get(id);
    const style = shapeFor(node);
    const cell = graph.addNode({
      id,
      ...box(dimensions, 'node'),
      ...style,
      zIndex: 3,
      data: {
        ...node,
        role: node.kind,
        active: Boolean(presentationState?.activeNodeIds?.includes(id)),
      },
    });
    cells.set(id, cell);
    const parent = cells.get(node.groupPathIds.at(-1));
    if (parent) parent.addChild(cell);
  }

  for (const { visual, original, from, to, points } of paint.preparedEdges) {
    const active = paint.activeEdges.has(original.id);
    const uncertain =
      original.certainty === 'unresolved' ||
      original.executionStatus === 'unresolved';
    const alternative = original.executionStatus === 'alternative';
    const color = EDGE_COLORS[original.kind] ?? '#8da8c9';
    const label = labels.get(original.id);
    graph.addEdge({
      id: original.id,
      zIndex: 2,
      source: { ...points[0] },
      target: { ...points.at(-1) },
      vertices: points.slice(1, -1).map((point) => ({ ...point })),
      connector: { name: 'normal' },
      attrs: {
        line: {
          stroke: color,
          strokeWidth: active ? 3 : 2,
          strokeDasharray: uncertain ? '2 4' : alternative ? '6 5' : '',
          strokeOpacity: alternative ? 0.76 : 1,
          targetMarker: { name: 'classic', size: 8 },
        },
        root: {
          tabindex: 0,
          'aria-label': `${original.kind}: ${original.label}, ${original.certainty}, ${original.executionStatus}`,
        },
      },
      labels: label
        ? [
            {
              position: label,
              attrs: {
                body: { fill: '#121f36', stroke: '#536586', rx: 5, ry: 5 },
                label: { text: original.label, fill: '#ecf2ff', fontSize: 11 },
              },
            },
          ]
        : [],
      data: {
        ...original,
        underlyingEdgeIds: [original.id],
        layoutSourceId: from,
        layoutTargetId: to,
        active,
      },
    });
  }
  const onKeyDown = (event) => {
    const pan = {
      ArrowLeft: [70, 0],
      ArrowRight: [-70, 0],
      ArrowUp: [0, 70],
      ArrowDown: [0, -70],
    }[event.key];
    if (pan) graph.translateBy(...pan);
    else if (event.key === '+' || event.key === '=') graph.zoom(0.12);
    else if (event.key === '-') graph.zoom(-0.12);
    else return;
    event.preventDefault();
  };
  container.addEventListener('keydown', onKeyDown);
  return {
    graph,
    hiddenEdgeIds: [...paint.hidden],
    dispose() {
      container.removeEventListener('keydown', onKeyDown);
      graph.dispose();
    },
  };
}
