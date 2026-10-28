import assert from 'node:assert/strict';
import test from 'node:test';
import { reserveRouteLabel } from '../public/diagram-label-placement.js';

const collide = (a, b) =>
  a.x < b.x + b.width + 6 &&
  a.x + a.width + 6 > b.x &&
  a.y < b.y + b.height + 6 &&
  a.y + a.height + 6 > b.y;

test('horizontal native route reserves a readable label outside cards', () => {
  const obstacles = [{ x: 140, y: 44, width: 80, height: 100 }];
  const reserved = [];
  const label = reserveRouteLabel(
    [
      { x: 0, y: 100 },
      { x: 360, y: 100 },
    ],
    'No · path not selected',
    obstacles,
    reserved,
  );
  assert.ok(label);
  assert.ok(!collide(label, obstacles[0]));
  assert.equal(reserved.length, 1);
});

test('two labels on a shared route never overlap', () => {
  const route = [{ x: 0, y: 100 }, { x: 320, y: 100 }];
  const reserved = [];
  const first = reserveRouteLabel(route, 'Yes', [], reserved);
  const second = reserveRouteLabel(route, 'No', [], reserved);
  assert.ok(first && second);
  assert.equal(collide(first, second), false);
});

test('no free label region omits visual text without altering route', () => {
  const route = [{ x: 0, y: 100 }, { x: 320, y: 100 }];
  const blockers = [{ x: -500, y: -500, width: 2000, height: 2000 }];
  const reserved = [];
  assert.equal(
    reserveRouteLabel(
      route,
      'Unresolved · source not proven',
      blockers,
      reserved,
    ),
    null,
  );
  assert.equal(reserved.length, 0);
  assert.equal(route.length, 2);
});

test('vertical native route can reserve a side label', () => {
  const reserved = [];
  const label = reserveRouteLabel(
    [
      { x: 100, y: 0 },
      { x: 100, y: 340 },
    ],
    'FINALLY',
    [],
    reserved,
  );
  assert.ok(label);
  assert.equal(label.height, 26);
});
