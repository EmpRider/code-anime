import assert from 'node:assert/strict';
import { preparedReturns, returnRoute } from '../public/diagram-returns.js';

const entries = [
  { callId: 'root', symbol: 'recurse' },
  { callId: 'child', parentCallId: 'root', symbol: 'recurse' },
  { callId: 'grandchild', parentCallId: 'child', symbol: 'recurse' },
  { callId: 'orphan', parentCallId: 'unknown' },
  { callId: 'self', parentCallId: 'self' },
];
const events = [
  { kind: 'enter', callId: 'child' },
  { kind: 'return', callId: 'grandchild', result: 0, certainty: 'simulated' },
  { kind: 'return', callId: 'child', result: false, certainty: 'assumed' },
  { kind: 'return', callId: 'child', result: null },
  { kind: 'return', callId: 'child' },
  { kind: 'return', callId: 'root', result: 1 },
  { kind: 'return', callId: 'orphan', result: 1 },
  { kind: 'return', callId: 'missing', result: 1 },
  { kind: 'return', callId: 'self', result: 1 },
  { kind: 'throw', callId: 'child' },
  { kind: 'unresolved', callId: 'child' },
  { kind: 'return', callId: 'child', parentCallId: 'grandchild', result: 1 },
];
const returns = preparedReturns(events, entries);
assert.equal(returns.size, 2);
assert.equal(returns.get('grandchild')[0].to, 'child');
assert.equal(returns.get('grandchild')[0].index, 2);
assert.equal(
  returns.get('grandchild')[0].label,
  'recurse returns\n0 (simulated)',
);
assert.deepEqual(
  returns.get('child').map((item) => item.label),
  [
    'recurse returns\nfalse (assumed)',
    'recurse returns\nnull (unverified)',
    'recurse returns\nvalue unavailable (unverified)',
  ],
);
assert.ok(returns.get('child').every((item) => item.to === 'root'));
assert.equal(
  preparedReturns([{ kind: 'enter', callId: 'child' }], entries).size,
  0,
);
const long = preparedReturns(
  [{ kind: 'return', callId: 'child', result: 'x'.repeat(100) }],
  entries,
).get('child')[0];
assert.ok(long.label.includes('… (unverified)'));
assert.equal(
  preparedReturns(
    [{ kind: 'return', callId: 'child', result: 1000, certainty: 'mock' }],
    entries,
  ).get('child')[0].label,
  'recurse returns\n1000 (simulated)',
);
assert.ok(long.description.includes('x'.repeat(100)));

const caller = { x: 0, y: 0, width: 210, height: 112 };
const callee = { x: 400, y: 0, width: 210, height: 112 };
const points = [
  { x: 105, y: 0 },
  { x: 200, y: 0 },
  { x: 295, y: 0 },
];
const original = structuredClone(points);
assert.deepEqual(returnRoute(points, caller, callee, false), [
  { x: 295, y: 14 },
  { x: 200, y: 14 },
  { x: 105, y: 14 },
]);
assert.deepEqual(points, original);
assert.notDeepEqual(
  returnRoute(points, caller, callee, false, 2),
  returnRoute(points, caller, callee, false),
);
const below = { ...callee, x: 0, y: 300 };
assert.deepEqual(
  returnRoute(
    [
      { x: 0, y: 56 },
      { x: 0, y: 150 },
      { x: 0, y: 244 },
    ],
    caller,
    below,
    true,
  ),
  [
    { x: 14, y: 244 },
    { x: 14, y: 150 },
    { x: 14, y: 56 },
  ],
);
const onBorder = (point, node) => {
  const dx = Math.abs(point.x - node.x);
  const dy = Math.abs(point.y - node.y);
  assert.ok(dx <= node.width / 2 && dy <= node.height / 2);
  assert.ok(dx === node.width / 2 || dy === node.height / 2);
};
const fanout = returnRoute(
  [
    { x: 0, y: -56 },
    { x: 200, y: -100 },
    { x: 400, y: -56 },
  ],
  caller,
  callee,
  false,
);
onBorder(fanout[0], callee);
onBorder(fanout.at(-1), caller);
// Steep fanout must retain perpendicular clearance, not merely a vertical shift.
const steep = [
  { x: 0, y: 56 },
  { x: 20, y: 156 },
  { x: 40, y: 256 },
];
const steepRoute = returnRoute(
  steep,
  caller,
  { ...callee, x: 40, y: 312 },
  false,
);
const offset = {
  x: steepRoute[1].x - steep[1].x,
  y: steepRoute[1].y - steep[1].y,
};
assert.ok(
  Math.abs(
    Math.abs(offset.x * 100 - offset.y * 20) / Math.hypot(20, 100) - 14,
  ) < 0.001,
);
const duplicate = returnRoute(
  [points[0], points[1], points[1], points[2]],
  caller,
  callee,
  false,
);
assert.ok(
  duplicate.every(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  ),
);
const clamped = returnRoute(points, caller, callee, false, 100);
onBorder(clamped[0], callee);
onBorder(clamped.at(-1), caller);
console.log(
  'Return regressions passed: explicit evidence, recursion identity, absent/null/false/zero results, long values, horizontal/vertical routes, border anchors.',
);
