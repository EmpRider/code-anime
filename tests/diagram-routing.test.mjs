import assert from 'node:assert/strict';
import { createRoutePlanner } from '../public/diagram-routing.js';

const intersects = (a, b, box) =>
  a.x === b.x
    ? a.x > box.x &&
      a.x < box.x + box.width &&
      Math.max(a.y, b.y) > box.y &&
      Math.min(a.y, b.y) < box.y + box.height
    : a.y > box.y &&
      a.y < box.y + box.height &&
      Math.max(a.x, b.x) > box.x &&
      Math.min(a.x, b.x) < box.x + box.width;
const overlap = (a, b, c, d) =>
  a.x === b.x && c.x === d.x && a.x === c.x
    ? Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) >
      Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y))
    : a.y === b.y &&
      c.y === d.y &&
      a.y === c.y &&
      Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) >
        Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x));

for (const vertical of [false, true]) {
  for (const expandedValues of [false, true]) {
    const boxes = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      x: (i % 4) * 274 + 0.5,
      y: Math.floor(i / 4) * (expandedValues ? 336 : 176) + 0.5,
      width: 210,
      height: expandedValues ? 272 : 112,
    }));
    if (vertical)
      for (const box of boxes)
        [box.x, box.y, box.width, box.height] = [
          box.y,
          box.x,
          box.height,
          box.width,
        ];
    const original = structuredClone(boxes),
      planner = createRoutePlanner(boxes),
      routes = [];
    const pairs = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 7],
      [7, 6],
      [6, 5],
      [5, 4],
      [4, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [1, 11],
      [11, 1],
      [2, 8],
      [8, 2],
    ];
    for (const [from, to] of pairs) {
      const route = planner.route(
        boxes[from],
        boxes[to],
        from > to ? 'work returns\n1000 (simulated)' : '',
      );
      assert.ok(route, `route ${from} to ${to}`);
      for (let i = 1; i < route.points.length; i++) {
        const a = route.points[i - 1],
          b = route.points[i];
        assert.ok(a.x === b.x || a.y === b.y, 'orthogonal');
        for (const box of boxes)
          assert.ok(
            !intersects(a, b, box),
            `card clearance ${from} to ${to} / ${box.id}`,
          );
        for (const previous of routes) {
          for (let j = 1; j < previous.points.length; j++)
            assert.ok(
              !overlap(a, b, previous.points[j - 1], previous.points[j]),
              'no shared arrow segments',
            );
          if (previous.label)
            assert.ok(
              !intersects(a, b, previous.label.box),
              'reserved label clearance',
            );
        }
      }
      if (route.label)
        for (const previous of [...routes, route])
          for (let i = 1; i < previous.points.length; i++)
            assert.ok(
              !intersects(
                previous.points[i - 1],
                previous.points[i],
                route.label.box,
              ),
              'label avoids every arrow',
            );
      routes.push(route);
    }
    assert.deepEqual(boxes, original, 'layout not mutated');
    assert.deepEqual(
      createRoutePlanner(boxes).route(boxes[0], boxes[1]),
      routes[0],
      'deterministic',
    );
  }
}
for (const side of ['top', 'bottom', 'left', 'right']) {
  const source = {
    id: 'decision',
    x: 100.5,
    y: 100.5,
    width: 260,
    height: 164,
    shape: 'diamond',
    centered: true,
    sides: [side],
  };
  const target = {
    id: 'next',
    x: side === 'left' ? -300 : side === 'right' ? 600 : 100.5,
    y: side === 'top' ? -300 : side === 'bottom' ? 500 : 100.5,
    width: 260,
    height: 164,
    shape: 'diamond',
    centered: true,
    sides: [
      { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side],
    ],
  };
  const route = createRoutePlanner([source, target]).route(source, target);
  assert.ok(route, `diamond ${side} route`);
  for (const [point, box] of [
    [route.points[0], source],
    [route.points.at(-1), target],
  ]) {
    const perimeter =
      Math.abs(point.x - box.x - box.width / 2) / (box.width / 2) +
      Math.abs(point.y - box.y - box.height / 2) / (box.height / 2);
    assert.ok(
      Math.abs(perimeter - 1) < 1e-10,
      'endpoint touches visible diamond',
    );
  }
  const [start, next] = route.points;
  assert.ok(
    side === 'top'
      ? next.y < start.y
      : side === 'bottom'
        ? next.y > start.y
        : side === 'left'
          ? next.x < start.x
          : next.x > start.x,
    'directed exit',
  );
}
const sealed = [
  { id: 'source', x: 20, y: 20, width: 100, height: 100 },
  { id: 'wall', x: 0, y: 0, width: 140, height: 140 },
  { id: 'target', x: 300, y: 0, width: 100, height: 100 },
];
assert.equal(
  createRoutePlanner(sealed).route(sealed[0], sealed[2]),
  null,
  'no unsafe fallback',
);
console.log(
  'Routing: orthogonal, obstacle-free, separate lanes, labels, values, vertical, bounded failure passed',
);
