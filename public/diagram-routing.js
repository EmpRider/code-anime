const GRID = 16;
const key = (x, y) => `${x},${y}`;
const intersects = (a, b, box, padding = 6) =>
  a.x === b.x
    ? a.x > box.x - padding &&
      a.x < box.x + box.width + padding &&
      Math.max(a.y, b.y) > box.y - padding &&
      Math.min(a.y, b.y) < box.y + box.height + padding
    : a.y > box.y - padding &&
      a.y < box.y + box.height + padding &&
      Math.max(a.x, b.x) > box.x - padding &&
      Math.min(a.x, b.x) < box.x + box.width + padding;
const overlaps = (a, b, c, d) =>
  a.x === b.x && c.x === d.x && a.x === c.x
    ? Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) >
      Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y))
    : a.y === b.y &&
      c.y === d.y &&
      a.y === c.y &&
      Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) >
        Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x));

// All edges share lane/label reservations. Perpendicular crossings use X6 bridges.
export function createRoutePlanner(boxes) {
  const segments = [],
    labels = [],
    ports = new Set(),
    blocked = new Map();
  const minX = Math.floor(Math.min(...boxes.map((b) => b.x)) / GRID) - 8;
  const minY = Math.floor(Math.min(...boxes.map((b) => b.y)) / GRID) - 8;
  const maxX =
    Math.ceil(Math.max(...boxes.map((b) => b.x + b.width)) / GRID) + 8;
  const maxY =
    Math.ceil(Math.max(...boxes.map((b) => b.y + b.height)) / GRID) + 8;
  const freeLane = (a, b) =>
    !segments.some(([c, d]) => overlaps(a, b, c, d)) &&
    !labels.some((box) => intersects(a, b, box));
  const candidates = (box) => {
    const result = [];
    for (const side of box.sides ?? ['right', 'left', 'bottom', 'top']) {
      const horizontal = side === 'right' || side === 'left';
      const low = horizontal ? box.y : box.x;
      const high = low + (horizontal ? box.height : box.width);
      const positions = [];
      for (
        let position = Math.ceil((low + 16) / GRID) * GRID;
        position <= high - 16;
        position += GRID
      )
        positions.push(position);
      positions.sort(
        (a, b) =>
          Math.abs(a - (low + high) / 2) - Math.abs(b - (low + high) / 2),
      );
      for (const position of positions) {
        if (box.centered && Math.abs(position - (low + high) / 2) > GRID)
          continue;
        const inset =
          box.shape === 'diamond'
            ? Math.abs(position - (low + high) / 2) *
              (horizontal ? box.width / box.height : box.height / box.width)
            : 0;
        const boundary = horizontal
          ? box.x + (side === 'right' ? box.width - inset : inset)
          : box.y + (side === 'bottom' ? box.height - inset : inset);
        const outerBoundary = horizontal
          ? box.x + (side === 'right' ? box.width : 0)
          : box.y + (side === 'bottom' ? box.height : 0);
        const outside =
          (side === 'right' || side === 'bottom'
            ? Math.ceil((outerBoundary + 8) / GRID)
            : Math.floor((outerBoundary - 8) / GRID)) * GRID;
        const point = horizontal
          ? { x: boundary, y: position }
          : { x: position, y: boundary };
        const grid = horizontal
          ? { x: outside, y: position }
          : { x: position, y: outside };
        if (
          !ports.has(key(point.x, point.y)) &&
          freeLane(point, grid) &&
          !boxes.some(
            (other) => other.id !== box.id && intersects(point, grid, other),
          )
        )
          result.push({ point, grid });
      }
    }
    return result;
  };
  return {
    route(source, target, label = '') {
      const starts = candidates(source);
      const ends = new Map(
        candidates(target).map((port) => [
          key(port.grid.x / GRID, port.grid.y / GRID),
          port,
        ]),
      );
      if (!starts.length || !ends.size) return null;
      const queue = [],
        seen = new Map();
      // A binary heap keeps a large expanded map from requiring a full grid flood.
      const push = (item) => {
        let index = queue.length;
        queue.push(item);
        while (index > 0) {
          const parent = (index - 1) >> 1;
          if (queue[parent].score <= item.score) break;
          queue[index] = queue[parent];
          index = parent;
        }
        queue[index] = item;
      };
      const pop = () => {
        const first = queue[0],
          last = queue.pop();
        if (queue.length) {
          let index = 0;
          while (index * 2 + 1 < queue.length) {
            let child = index * 2 + 1;
            if (
              child + 1 < queue.length &&
              queue[child + 1].score < queue[child].score
            )
              child++;
            if (queue[child].score >= last.score) break;
            queue[index] = queue[child];
            index = child;
          }
          queue[index] = last;
        }
        return first;
      };
      const estimate = (x, y) =>
        (Math.max(target.x - x * GRID, 0, x * GRID - target.x - target.width) +
          Math.max(
            target.y - y * GRID,
            0,
            y * GRID - target.y - target.height,
          )) /
        GRID;
      for (const port of starts) {
        const x = port.grid.x / GRID,
          y = port.grid.y / GRID,
          id = key(x, y);
        const state = { x, y, id, port, cost: 0, score: estimate(x, y) };
        if (!seen.has(id)) {
          seen.set(id, state);
          push(state);
        }
      }
      let finish;
      // ponytail: bounded search; report congestion instead of an unsafe fallback path.
      for (let count = 0; queue.length && count < 120000; count++) {
        const current = pop();
        if (seen.get(current.id) !== current) continue;
        if (ends.has(current.id)) {
          finish = current;
          break;
        }
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const x = current.x + dx,
            y = current.y + dy,
            id = key(x, y);
          if (x < minX || x > maxX || y < minY || y > maxY) continue;
          const cost =
            current.cost +
            1 +
            (current.dx !== undefined &&
            (current.dx !== dx || current.dy !== dy)
              ? 0.25
              : 0);
          if (seen.has(id) && seen.get(id).cost <= cost) continue;
          const a = { x: current.x * GRID, y: current.y * GRID },
            b = { x: x * GRID, y: y * GRID };
          const segmentKey = [current.id, id].sort().join('|');
          if (!blocked.has(segmentKey))
            blocked.set(
              segmentKey,
              boxes.some((box) => intersects(a, b, box)),
            );
          if (blocked.get(segmentKey) || !freeLane(a, b)) continue;
          const next = {
            x,
            y,
            id,
            dx,
            dy,
            cost,
            score: cost + estimate(x, y),
            previous: current,
          };
          seen.set(id, next);
          push(next);
        }
      }
      if (!finish) return null;
      const end = ends.get(finish.id),
        reversed = [end.point];
      let current = finish;
      while (current) {
        reversed.push({ x: current.x * GRID, y: current.y * GRID });
        if (!current.previous) break;
        current = current.previous;
      }
      reversed.push(current.port.point);
      const points = reversed
        .reverse()
        .filter(
          (point, index, all) =>
            !index ||
            index === all.length - 1 ||
            !(
              (all[index - 1].x === point.x && point.x === all[index + 1].x) ||
              (all[index - 1].y === point.y && point.y === all[index + 1].y)
            ),
        );
      for (let i = 1; i < points.length; i++)
        segments.push([points[i - 1], points[i]]);
      ports.add(key(points[0].x, points[0].y));
      ports.add(key(end.point.x, end.point.y));
      let placement,
        travelled = 0;
      if (label) {
        const width =
          Math.max(...label.split('\n').map((line) => line.length * 6)) + 20;
        const height = label.split('\n').length * 14 + 12;
        for (let i = 1; i < points.length && !placement; i++) {
          const a = points[i - 1],
            b = points[i],
            horizontal = a.y === b.y;
          const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
          for (
            let distance = 24;
            distance < length - 24 && !placement;
            distance += GRID
          ) {
            const x = a.x + Math.sign(b.x - a.x) * distance,
              y = a.y + Math.sign(b.y - a.y) * distance;
            for (const sign of [-1, 1]) {
              const offset = horizontal
                ? { x: 0, y: sign * (height / 2 + 12) }
                : { x: sign * (width / 2 + 12), y: 0 };
              const box = {
                x: x + offset.x - width / 2,
                y: y + offset.y - height / 2,
                width,
                height,
              };
              if (
                [...boxes, ...labels].some(
                  (other) =>
                    box.x < other.x + other.width + 6 &&
                    box.x + width + 6 > other.x &&
                    box.y < other.y + other.height + 6 &&
                    box.y + height + 6 > other.y,
                ) ||
                segments.some(([c, d]) => intersects(c, d, box))
              )
                continue;
              placement = { distance: travelled + distance, offset, box };
              labels.push(box);
              break;
            }
          }
          travelled += length;
        }
      }
      return { points, label: placement };
    },
  };
}
