// Source structure only; outcomes and visit boundaries come from prepared events.
export function prepareControlFlow(
  nodes,
  { cursor = 0, visits = new Map(), methodCallId } = {},
) {
  const cards = [],
    regions = [],
    edges = [];
  const byIndex = new Map();
  const bypasses = [];
  const scope = (node) =>
    methodCallId ?? node.invocationId ?? node.event?.callId ?? 'flow';
  const regionId = (node, suffix) =>
    `${encodeURIComponent(scope(node))}:region:${encodeURIComponent(node.id)}:${suffix}`;
  function isUnresolved(node) {
    return (
      node.type === 'unresolved' ||
      node.ownershipStatus === 'unresolved' ||
      node.event?.certainty === 'unresolved' ||
      !node.event?.source?.file ||
      !Number.isInteger(node.event?.source?.line)
    );
  }
  function addCard(
    node,
    index,
    parentRegionId,
    extra = {},
    evidenceNode = node,
  ) {
    if (!Number.isInteger(index) || byIndex.has(index)) return;
    const id = `${encodeURIComponent(scope(node))}:event:${index}:${encodeURIComponent(evidenceNode.evidenceIdentity ?? evidenceNode.eventId ?? evidenceNode.id)}`;
    const card = {
      id,
      node,
      index,
      parentRegionId,
      event: evidenceNode.event,
      eventId: evidenceNode.eventId,
      evidenceIdentity: evidenceNode.evidenceIdentity,
      visitIdentity: evidenceNode.visitIdentity,
      invocationId: evidenceNode.invocationId,
      ...extra,
      unresolved: isUnresolved(evidenceNode) || extra.unresolved === true,
    };
    byIndex.set(index, card);
    cards.push(card);
  }
  function walk(items, parentRegionId, uncertain = false) {
    let neutralRegionId;
    for (const node of items ?? []) {
      if (node.iterations) {
        // Visit selection changes geometry; seeking the cursor alone does not.
        let selected = Math.min(
          node.iterations.length - 1,
          Math.max(0, visits.get(node.id) ?? 0),
        );
        const active = node.iterations.findIndex((item) =>
          item.indices.includes(cursor),
        );
        if (active >= 0) selected = active;
        selected = Math.min(selected, node.iterations.length - 1);
        node.iterations.forEach((visit, i) => {
          const id = regionId(node, `visit:${i}`);
          regions.push({
            id,
            type: 'loop',
            label: visit.label ?? `Prepared visit ${i + 1}`,
            selected: i === selected,
            parentRegionId,
          });
          const header =
            visit.children?.find(
              (child) => child.indices?.[0] === visit.indices[0],
            ) ?? node;
          addCard(
            node,
            visit.indices[0],
            id,
            { control: 'loop', visit: i, unresolved: uncertain },
            header,
          );
          walk(visit.children, id, uncertain);
        });
      } else if (node.branches) {
        const id = regionId(node, 'scope');
        regions.push({
          id,
          type: node.type,
          label: node.title ?? node.type,
          parentRegionId,
        });
        addCard(node, node.indices[0], id, {
          control: node.type,
          unresolved: uncertain || node.ownershipStatus === 'unresolved',
        });
        walk(
          node.children,
          id,
          uncertain || node.ownershipStatus === 'unresolved',
        );
        node.branches.forEach((branch, i) => {
          const branchId = regionId(node, `arm:${i}`);
          regions.push({
            id: branchId,
            type: node.type === 'decision' ? 'branch' : node.type,
            label: branch.label,
            selected: branch.selected,
            parentRegionId: id,
          });
          walk(
            branch.children,
            branchId,
            uncertain || node.ownershipStatus === 'unresolved',
          );
          if (
            node.type === 'decision' &&
            branch.label?.startsWith('No · continue without body') &&
            !branch.indices?.length &&
            !branch.children?.length
          )
            bypasses.push({ node, branch, regionId: id });
        });
      } else {
        const unresolved = uncertain || isUnresolved(node);
        let owner = parentRegionId;
        if (unresolved) {
          if (!neutralRegionId) {
            neutralRegionId = regionId(node, 'unresolved');
            regions.push({
              id: neutralRegionId,
              type: 'unresolved',
              label: 'Unresolved · source ownership not proven',
              parentRegionId,
            });
          }
          owner = neutralRegionId;
        }
        addCard(node, node.indices?.[0], owner, { unresolved });
        walk(node.children, owner, unresolved);
      }
    }
  }
  walk(nodes);
  cards.sort((a, b) => a.index - b.index);
  const regionById = new Map(regions.map((region) => [region.id, region]));
  function enclosing(card, label) {
    for (
      let id = card.parentRegionId;
      id;
      id = regionById.get(id)?.parentRegionId
    ) {
      const region = regionById.get(id);
      if (region?.label?.toLowerCase().startsWith(label)) return true;
    }
    return false;
  }
  function hasAncestor(card, regionId) {
    for (
      let id = card.parentRegionId;
      id;
      id = regionById.get(id)?.parentRegionId
    )
      if (id === regionId) return true;
    return false;
  }
  function sharesTryScope(source, target) {
    const sourceScopes = new Set();
    for (
      let id = source.parentRegionId;
      id;
      id = regionById.get(id)?.parentRegionId
    )
      if (regionById.get(id)?.type === 'try') sourceScopes.add(id);
    for (
      let id = target.parentRegionId;
      id;
      id = regionById.get(id)?.parentRegionId
    )
      if (sourceScopes.has(id)) return true;
    return false;
  }
  function decisionArm(card) {
    for (
      let id = card.parentRegionId;
      id;
      id = regionById.get(id)?.parentRegionId
    ) {
      const region = regionById.get(id);
      if (
        region?.type === 'branch' &&
        regionById.get(region.parentRegionId)?.type === 'decision'
      )
        return { id, parent: region.parentRegionId };
    }
  }
  let pendingTerminal;
  for (let i = 1; i < cards.length; i++) {
    const source = cards[i - 1],
      target = cards[i];
    if (scope(source.node) !== scope(target.node)) continue;
    if (source.event?.kind === 'return' || source.event?.kind === 'throw')
      pendingTerminal = source;
    const caught =
      pendingTerminal?.event?.kind === 'throw' &&
      target.event?.kind === 'catch' &&
      sharesTryScope(pendingTerminal, target);
    const cleanup =
      pendingTerminal &&
      enclosing(target, 'finally') &&
      sharesTryScope(pendingTerminal, target);
    if (pendingTerminal && !caught && !cleanup) continue;
    if (caught) pendingTerminal = undefined;
    const loopback =
      target.control === 'loop' &&
      target.visit > 0 &&
      hasAncestor(source, regionId(target.node, `visit:${target.visit - 1}`));
    const kind = loopback
      ? 'loopback'
      : target.event?.kind === 'catch'
        ? 'catch'
        : enclosing(target, 'finally')
          ? 'finally'
          : enclosing(target, 'yes') || enclosing(target, 'no')
            ? 'branch'
            : 'step';
    const sourceArm = decisionArm(source),
      targetArm = decisionArm(target);
    const conflictingArms =
      sourceArm &&
      targetArm &&
      sourceArm.parent === targetArm.parent &&
      sourceArm.id !== targetArm.id;
    edges.push({
      id: `${source.id}->${target.id}`,
      source: source.id,
      target: target.id,
      kind,
      status:
        source.unresolved ||
        target.unresolved ||
        conflictingArms ||
        target.index !== source.index + 1
          ? 'unknown'
          : 'prepared',
    });
  }
  for (const { node, branch, regionId: id } of bypasses) {
    const header = byIndex.get(node.indices[0]);
    const last = Math.max(...node.indices);
    const continuation = cards.find(
      (card) =>
        card.index > last &&
        scope(card.node) === scope(node) &&
        !hasAncestor(card, id),
    );
    if (
      !header ||
      !continuation ||
      edges.some(
        (edge) => edge.source === header.id && edge.target === continuation.id,
      )
    )
      continue;
    edges.push({
      id: `${header.id}->${continuation.id}:branch:${branch.label}`,
      source: header.id,
      target: continuation.id,
      kind: 'branch',
      label: branch.label,
      status:
        header.unresolved || continuation.unresolved
          ? 'unknown'
          : branch.selected === false
            ? 'not-selected'
            : branch.selected === undefined
              ? 'possible'
              : 'prepared',
    });
  }
  const topologyKey = JSON.stringify([
    cards.map(({ id, parentRegionId }) => [id, parentRegionId]),
    regions.map(({ id, parentRegionId, selected }) => [
      id,
      parentRegionId,
      selected,
    ]),
    edges.map(({ id, kind, status }) => [id, kind, status]),
  ]);
  return { cards, regions, edges, topologyKey };
}

export function layoutControlFlow(
  nodes,
  {
    cursor = 0,
    visits = new Map(),
    extraHeight = () => 0,
    direction = 'vertical',
    maxWidth = Infinity,
    targetAspectRatio = 0,
  } = {},
) {
  const cards = [],
    edges = [],
    regions = [];
  const horizontal = direction === 'horizontal';
  const heights = new Map();
  function measure(items) {
    for (const node of items ?? []) {
      const title =
        node.iterations || node.branches || node.type === 'decision'
          ? (node.title ?? '')
          : (node.event?.label ?? node.title ?? '');
      const lines = Math.max(1, Math.ceil(title.length / 30));
      heights.set(
        node.id,
        (node.iterations
          ? 136
          : node.type === 'decision'
            ? Math.max(144, 108 + lines * 20)
            : 120 +
              (lines - 1) * 20 +
              (node.event?.kind === 'return' ? 16 : 0)) + extraHeight(node.id),
      );
      measure(node.children);
      for (const branch of node.branches ?? []) measure(branch.children);
      for (const visit of node.iterations ?? []) measure(visit.children);
    }
  }
  if (horizontal) measure(nodes);
  const inset = horizontal ? 32 : 16,
    gap = 44;
  function sequence(items, x, y) {
    let first,
      last,
      bottom = y,
      left = x,
      right = x + (horizontal ? 0 : 260);
    for (const node of items ?? []) {
      if (node.event?.kind === 'enter') continue;
      const part = place(node, x, bottom);
      if (last) edges.push({ source: last, target: part.first });
      first ??= part.first;
      last = part.last;
      bottom = part.bottom + gap;
      left = Math.min(left, part.left);
      right = Math.max(right, part.right);
    }
    return { first, last, bottom: first ? bottom - gap : y, left, right };
  }
  function place(node, x, y) {
    const control = node.iterations
      ? 'loop'
      : node.branches
        ? node.type
        : node.type === 'decision' &&
            typeof node.event?.values?.condition === 'boolean'
          ? 'decision'
          : undefined;
    const title = control
      ? (node.title ?? '')
      : (node.event?.label ?? node.title ?? '');
    const lines = Math.max(1, Math.ceil(title.length / 30));
    const height = horizontal
      ? 260
      : (control === 'decision'
          ? Math.max(144, 108 + lines * 20)
          : control === 'loop'
            ? 136
            : 120 +
              (lines - 1) * 20 +
              (node.event?.kind === 'return' ? 16 : 0)) + extraHeight(node.id);
    const width = horizontal ? heights.get(node.id) : 260;
    const card = { node, id: node.id, x, y, width, height, control };
    cards.push(card);
    let result = {
      first: node.id,
      last: node.id,
      bottom: y + height,
      left: x,
      right: x + width,
    };
    if (node.iterations?.length) {
      let visit = visits.get(node.id) ?? 0;
      const active = node.iterations.findIndex((item) =>
        item.indices.includes(cursor),
      );
      if (active >= 0) visit = active;
      visit = Math.min(visit, node.iterations.length - 1);
      card.visit = visit;
      const header = node.iterations[visit].indices[0];
      // Only replace an actual loop header; a partial visit may start in its body.
      const children = node.iterations[visit].children.filter(
        (item) => !(item.indices[0] === header && item.event?.kind === 'loop'),
      );
      card.index = header;
      const body = sequence(children, x, y + height + gap);
      if (body.first) {
        edges.push({
          source: node.id,
          target: body.first,
          kind: 'loop',
        });
        result = {
          ...result,
          last: body.last,
          bottom: body.bottom + 16,
          left: body.left - inset,
          right: body.right + 16,
        };
      }
      regions.push({
        id: node.id + '-rail',
        type: 'loop',
        x: result.left,
        y: y + height + 8,
        width: result.right - result.left,
        height: result.bottom - y - height - 8,
        label:
          'Prepared visit ' + (visit + 1) + ' of ' + node.iterations.length,
      });
    } else if (node.branches?.length) {
      let branchX = x;
      const start = y + height + gap + 32;
      let previous;
      const prepared = [];
      const branches = [...node.branches.entries()];
      if (node.type === 'decision') branches.reverse();
      for (const [i, branch] of branches) {
        const staged = node.type === 'try';
        const branchY = staged ? result.bottom + gap : start;
        const part = sequence(branch.children, branchX, branchY + 56);
        if (node.type === 'decision' && !part.first) {
          const id = node.id + '-empty-' + i;
          const title =
            branch.selected === false
              ? 'Path not selected'
              : branch.selected === true
                ? 'No prepared steps'
                : 'Unresolved path';
          cards.push({
            id,
            node: { id, title, indices: [] },
            placeholder: true,
            x: branchX,
            y: branchY + 56,
            width: horizontal ? 56 : 260,
            height: horizontal ? 260 : 56,
          });
          part.first = part.last = id;
          part.right = branchX + (horizontal ? 56 : 260);
          part.bottom = branchY + 56 + (horizontal ? 260 : 56);
        }
        regions.push({
          id: node.id + '-lane-' + i,
          type: node.type,
          x: part.left - inset,
          y: branchY,
          width: part.right - part.left + inset + 16,
          height: Math.max(70, part.bottom - branchY) + 16,
          label:
            branch.label +
            (branch.selected === false
              ? ' · not selected'
              : !part.first
                ? ' · no prepared steps'
                : ''),
          selected: branch.selected,
        });
        if (part.first) {
          const label =
            node.type === 'decision'
              ? branch.selected === undefined
                ? 'Outcome unknown'
                : i === 0
                  ? 'True'
                  : 'False'
              : branch.label;
          edges.push({
            source: staged ? (previous ?? node.id) : node.id,
            target: part.first,
            kind: node.type === 'decision' ? 'branch' : node.type,
            label,
            ...(node.type === 'decision'
              ? { sourceSide: i === 0 ? 'right' : 'bottom' }
              : {}),
            inactive: branch.selected === false,
          });
          if (staged) {
            previous = part.last;
            result.last = part.last;
          } else if (branch.children.length || branch.selected === true) {
            prepared.push({
              ...part,
              index: branch.indices?.[0] ?? node.indices[0],
            });
          }
        }
        result.bottom = Math.max(result.bottom, part.bottom + 16, branchY + 86);
        result.left = Math.min(result.left, part.left - inset);
        result.right = Math.max(result.right, part.right + 16);
        if (!staged) branchX = part.right + gap + 32;
      }
      prepared.sort((a, b) => a.index - b.index);
      for (let i = 0; i < prepared.length; i++) {
        if (i)
          edges.push({
            source: prepared[i - 1].last,
            target: prepared[i].first,
            kind: 'step-order',
            label: 'PREPARED ORDER',
          });
        result.last = prepared[i].last;
      }
      const extra = (node.children ?? []).filter(
        (child) => child.indices[0] !== node.indices[0],
      );
      if (extra.length) {
        const part = sequence(extra, x, result.bottom + gap);
        if (part.first) {
          edges.push({ source: result.last, target: part.first });
          result.last = part.last;
        }
        result.bottom = part.bottom;
        result.right = Math.max(result.right, part.right);
      }
    }
    return result;
  }
  const bounds = sequence(nodes, 24, 0);
  if (horizontal) {
    // Swap layout axes, not text or card dimensions; reserve room for upright labels.
    for (const card of cards) {
      [card.x, card.y] = [card.y + 24, card.x];
      card.width = 260;
      card.height = card.placeholder ? 56 : heights.get(card.id);
    }
    for (const region of regions) {
      [region.x, region.y] = [region.y + 24, region.x];
      [region.width, region.height] = [region.height, region.width];
    }
    for (const edge of edges)
      if (edge.sourceSide)
        edge.sourceSide = edge.sourceSide === 'right' ? 'bottom' : 'right';
  }
  let wrapped;
  if (horizontal && Number.isFinite(maxWidth)) {
    // Pack containment, not individual screen coordinates, so scopes survive row breaks.
    const children = new Map([
      [null, []],
      ...regions.map((region) => [region, []]),
    ]);
    for (const item of [...cards, ...regions]) {
      const parent =
        regions
          .filter(
            (region) =>
              region !== item &&
              region.x <= item.x &&
              region.y <= item.y &&
              region.x + region.width >= item.x + item.width &&
              region.y + region.height >= item.y + item.height &&
              region.width * region.height > item.width * item.height,
          )
          .sort((a, b) => a.width * a.height - b.width * b.height)[0] ?? null;
      children.get(parent).push(item);
    }
    for (const items of children.values())
      items.sort((a, b) => a.x - b.x || a.y - b.y);
    function move(item, dx, dy) {
      item.x += dx;
      item.y += dy;
      for (const child of children.get(item) ?? []) move(child, dx, dy);
    }
    function pack(parent, available) {
      const padding = parent ? 12 : 0;
      const top = parent ? 28 : 0;
      let x = padding,
        y = top,
        rowHeight = 0,
        right = padding;
      for (const item of children.get(parent)) {
        if (children.has(item)) {
          const size = pack(item, Math.max(284, available - padding * 2));
          item.width = size.width;
          item.height = size.height;
          item.x = item.y = 0;
        }
        if (x > padding && x + item.width + padding > available) {
          x = padding;
          y += rowHeight + 40;
          rowHeight = 0;
        }
        move(item, x - item.x, y - item.y);
        right = Math.max(right, x + item.width);
        rowHeight = Math.max(rowHeight, item.height);
        x += item.width + 32;
      }
      return {
        width: Math.max(parent ? 260 : 0, right + padding),
        height: y + rowHeight + padding,
      };
    }
    let available = Math.max(284, maxWidth - 24);
    wrapped = pack(null, available);
    // A narrow viewport must not turn horizontal mode into a portrait column.
    while (
      targetAspectRatio > 0 &&
      wrapped.width / wrapped.height < targetAspectRatio &&
      available < bounds.bottom + 48
    ) {
      available *= 1.2;
      wrapped = pack(null, available);
    }
    for (const item of children.get(null)) move(item, 12, 12);
    wrapped.width += 24;
    wrapped.height += 24;
    const byId = new Map(cards.map((card) => [card.id, card]));
    for (const edge of edges) {
      const source = byId.get(edge.source),
        target = byId.get(edge.target);
      if (target.y >= source.y + source.height) {
        edge.sourceSide = 'bottom';
        edge.targetSide = 'top';
      } else {
        edge.sourceSide ??= 'right';
        edge.targetSide = 'left';
      }
    }
  }
  return {
    cards,
    edges,
    regions,
    width:
      wrapped?.width ?? (horizontal ? bounds.bottom + 48 : bounds.right + 24),
    height: wrapped?.height ?? (horizontal ? bounds.right + 24 : bounds.bottom),
  };
}
