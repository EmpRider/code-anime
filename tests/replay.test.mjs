import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replayState } from '../public/replay.js';
test('reverse and seek restore exact snapshots without mutating events', () => {
  const events = [
    { stack: ['a'], locals: { row: { amount: 1 } } },
    { stack: ['a', 'b'], locals: { row: { amount: 3 } } },
  ];
  const final = replayState(events, 2);
  final.locals.row.amount = 99;
  assert.equal(replayState(events, 1).locals.row.amount, 1);
  assert.equal(replayState(events, 2).locals.row.amount, 3);
  assert.deepEqual(replayState(events, 0).stack, []);
  assert.deepEqual(replayState(events, 100).stack, ['a', 'b']);
});
