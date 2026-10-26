// Source structure only; outcomes and visit boundaries come from prepared events.
export function layoutControlFlow(
  nodes,
  { cursor = 0, visits = new Map(), extraHeight = () => 0 } = {},
) {
  const cards = [],
    edges = [],
    regions = [];
  const width = 260,
    gap = 44;
  function sequence(items, x, y) {
    let first,
      last,
      bottom = y,
      left = x,
      right = x + width;
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
    const height =
      (control === 'decision'
        ? Math.max(144, 108 + lines * 20)
        : control === 'loop'
          ? 148
          : 120 + (lines - 1) * 20 + (node.event?.kind === 'return' ? 16 : 0)) +
      extraHeight(node.id);
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
          left: body.left - 16,
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
            width,
            height: 56,
          });
          part.first = part.last = id;
          part.bottom = branchY + 112;
        }
        regions.push({
          id: node.id + '-lane-' + i,
          type: node.type,
          x: part.left - 16,
          y: branchY,
          width: part.right - part.left + 32,
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
        result.left = Math.min(result.left, part.left - 16);
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
  return {
    cards,
    edges,
    regions,
    width: bounds.right + 24,
    height: bounds.bottom,
  };
}
