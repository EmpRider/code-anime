import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkInvocationIntegrity } from '../src/services/invocation-integrity.js';
import type { TraceEvent } from '../src/domain/trace.js';

const event = (
  id: string,
  kind: TraceEvent['kind'],
  callId: string,
  stack: string[],
  taskId?: string,
): TraceEvent => ({
  id,
  kind,
  callId,
  stack,
  ...(taskId ? { taskId } : {}),
  symbolId: 'Fixture.flow',
  label: 'Inert mock operation',
  values: {},
  certainty: 'mock',
});

test('completed one-shot snapshots must close explicitly entered children of an unknown root', () => {
  const snapshot = event('snapshot', 'statement', 'implicit', ['implicit']);
  const enter = event('enter', 'enter', 'child', ['implicit', 'child']);
  assert.throws(
    () => checkInvocationIntegrity([[snapshot, enter]], true),
    /retains active invocations: child \(task main\)/,
  );
  const returned = event('return', 'return', 'child', ['implicit']);
  assert.doesNotThrow(() =>
    checkInvocationIntegrity([[snapshot, enter], [returned]], true),
  );
  // The implicit root was already active before the supplied snapshot.
  assert.doesNotThrow(() => checkInvocationIntegrity([[snapshot]], true));
});

test('one-shot call events opening invocations must also close before complete', () => {
  const snapshot = event('snapshot', 'statement', 'implicit', ['implicit']);
  const call = event('call', 'call', 'child', ['implicit', 'child']);
  assert.throws(
    () => checkInvocationIntegrity([[snapshot, call]], true),
    /retains active invocations: child \(task main\)/,
  );
  assert.doesNotThrow(() =>
    checkInvocationIntegrity(
      [[snapshot, call, event('done', 'return', 'child', ['implicit'])]],
      true,
    ),
  );
});

test('interleaved mock tasks cannot leave explicitly entered secondary frames open', () => {
  const main = event('main-start', 'enter', 'main-root', ['main-root']);
  const callback = event(
    'callback-start',
    'enter',
    'callback-root',
    ['callback-root'],
    'callback',
  );
  const callbackReturn = event(
    'callback-end',
    'return',
    'callback-root',
    [],
    'callback',
  );
  const mainReturn = event('main-end', 'return', 'main-root', []);
  assert.throws(
    () => checkInvocationIntegrity([[main, callback, mainReturn]], true),
    /retains active invocations: callback-root \(task callback\)/,
  );
  assert.doesNotThrow(() =>
    checkInvocationIntegrity(
      [
        [main, callback],
        [callbackReturn, mainReturn],
      ],
      true,
    ),
  );
});

test('invocation IDs remain unique across task contexts and mock continuations', () => {
  const first = event('first', 'statement', 'shared', ['shared']);
  const duplicate = event(
    'second',
    'statement',
    'shared',
    ['shared'],
    'callback',
  );
  assert.throws(
    () => checkInvocationIntegrity([[first], [duplicate]], false),
    /shares invocation ID shared across mock tasks/,
  );
});

test('mock exception unwinding can close an explicitly entered child', () => {
  const root = event('root', 'enter', 'root-id', ['root-id']);
  const child = event('child', 'enter', 'child-id', ['root-id', 'child-id']);
  const unwind = event('unwind', 'throw', 'child-id', ['root-id']);
  const done = event('done', 'return', 'root-id', []);
  assert.doesNotThrow(() =>
    checkInvocationIntegrity(
      [
        [root, child],
        [unwind, done],
      ],
      true,
    ),
  );
});

test('first-return snapshots cannot imply duplicate active invocation IDs', () => {
  // The first event of a legacy one-shot trace may return from an implicit
  // frame, but its post-return stack cannot still contain that same frame.
  assert.throws(
    () =>
      checkInvocationIntegrity([
        [event('invalid-root-return', 'return', 'root-id', ['root-id'])],
      ]),
    /repeats an invocation in its inferred pre-event stack/,
  );
  assert.throws(
    () =>
      checkInvocationIntegrity([
        [
          event('invalid-nested-return', 'return', 'parent-id', [
            'parent-id',
            'child-id',
          ]),
        ],
      ]),
    /repeats an invocation in its inferred pre-event stack/,
  );
  assert.doesNotThrow(() =>
    checkInvocationIntegrity([
      [event('valid-implicit-return', 'return', 'child-id', ['parent-id'])],
    ]),
  );
});
