import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { TraceEvent } from '../src/domain/trace.js';
import { compileNavigation } from '../src/services/flow-scene-navigation.js';

function event(
  id: string,
  kind: TraceEvent['kind'],
  callId: string,
  stack: string[],
  parentCallId?: string,
): TraceEvent {
  return {
    id,
    kind,
    callId,
    stack,
    ...(parentCallId === undefined ? {} : { parentCallId }),
    symbolId: `Example.${callId}`,
    label: 'Synthetic mock event',
    taskId: 'shared-scheduler-label',
    values: {},
    certainty: 'mock',
  };
}

test('empty and single-frame navigation preserve before-first and terminal cursors', () => {
  assert.deepEqual(compileNavigation([]), [
    {
      cursor: 0,
      previousCursor: null,
      nextCursor: null,
      intoCursor: null,
      overCursor: null,
      outCursor: null,
    },
  ]);
  assert.deepEqual(
    compileNavigation([event('start', 'enter', 'root', ['root'])]),
    [
      {
        cursor: 0,
        previousCursor: null,
        nextCursor: 1,
        intoCursor: 1,
        overCursor: 1,
        outCursor: null,
      },
      {
        cursor: 1,
        previousCursor: 0,
        nextCursor: null,
        intoCursor: null,
        overCursor: null,
        outCursor: null,
      },
    ],
  );
});

test('Into follows a direct child while Over and Out exclude interleaved siblings', () => {
  const events = [
    event('root-start', 'enter', 'root', ['root']),
    event('root-await', 'await', 'root', ['root']),
    event('sibling-start', 'enter', 'sibling', ['sibling']),
    event('child-start', 'enter', 'child', ['root'], 'root'),
    event('child-work', 'statement', 'child', ['root', 'child'], 'root'),
    event('child-end', 'return', 'child', ['root'], 'root'),
    event('root-resume', 'resume', 'root', ['root']),
    event('sibling-end', 'return', 'sibling', []),
    event('root-end', 'return', 'root', []),
  ];
  const before = structuredClone(events);
  assert.deepEqual(compileNavigation(events), [
    {
      cursor: 0,
      previousCursor: null,
      nextCursor: 1,
      intoCursor: 1,
      overCursor: 1,
      outCursor: null,
    },
    {
      cursor: 1,
      previousCursor: 0,
      nextCursor: 2,
      intoCursor: 2,
      overCursor: 2,
      outCursor: 9,
    },
    {
      cursor: 2,
      previousCursor: 1,
      nextCursor: 3,
      intoCursor: 4,
      overCursor: 7,
      outCursor: 9,
    },
    {
      cursor: 3,
      previousCursor: 2,
      nextCursor: 4,
      intoCursor: 8,
      overCursor: 8,
      outCursor: 8,
    },
    {
      cursor: 4,
      previousCursor: 3,
      nextCursor: 5,
      intoCursor: 5,
      overCursor: 5,
      outCursor: 6,
    },
    {
      cursor: 5,
      previousCursor: 4,
      nextCursor: 6,
      intoCursor: 6,
      overCursor: 6,
      outCursor: 6,
    },
    {
      cursor: 6,
      previousCursor: 5,
      nextCursor: 7,
      intoCursor: 7,
      overCursor: 7,
      outCursor: 9,
    },
    {
      cursor: 7,
      previousCursor: 6,
      nextCursor: 8,
      intoCursor: 9,
      overCursor: 9,
      outCursor: 9,
    },
    {
      cursor: 8,
      previousCursor: 7,
      nextCursor: 9,
      intoCursor: 9,
      overCursor: 9,
      outCursor: null,
    },
    {
      cursor: 9,
      previousCursor: 8,
      nextCursor: null,
      intoCursor: null,
      overCursor: null,
      outCursor: null,
    },
  ]);
  assert.deepEqual(events, before);
});

test('caught throws stay inside their invocation until a later escaping throw', () => {
  const events = [
    event('root-start', 'enter', 'root', ['root']),
    event('child-start', 'enter', 'child', ['root', 'child'], 'root'),
    event('caught', 'throw', 'child', ['root', 'child'], 'root'),
    event('child-work', 'statement', 'child', ['root', 'child'], 'root'),
    event('escaped', 'throw', 'child', ['root'], 'root'),
    event('root-catch', 'catch', 'root', ['root']),
    event('root-end', 'return', 'root', []),
  ];
  assert.deepEqual(compileNavigation(events), [
    {
      cursor: 0,
      previousCursor: null,
      nextCursor: 1,
      intoCursor: 1,
      overCursor: 1,
      outCursor: null,
    },
    {
      cursor: 1,
      previousCursor: 0,
      nextCursor: 2,
      intoCursor: 2,
      overCursor: 6,
      outCursor: 7,
    },
    {
      cursor: 2,
      previousCursor: 1,
      nextCursor: 3,
      intoCursor: 3,
      overCursor: 3,
      outCursor: 5,
    },
    {
      cursor: 3,
      previousCursor: 2,
      nextCursor: 4,
      intoCursor: 4,
      overCursor: 4,
      outCursor: 5,
    },
    {
      cursor: 4,
      previousCursor: 3,
      nextCursor: 5,
      intoCursor: 5,
      overCursor: 5,
      outCursor: 5,
    },
    {
      cursor: 5,
      previousCursor: 4,
      nextCursor: 6,
      intoCursor: 6,
      overCursor: 6,
      outCursor: 7,
    },
    {
      cursor: 6,
      previousCursor: 5,
      nextCursor: 7,
      intoCursor: 7,
      overCursor: 7,
      outCursor: 7,
    },
    {
      cursor: 7,
      previousCursor: 6,
      nextCursor: null,
      intoCursor: null,
      overCursor: null,
      outCursor: null,
    },
  ]);
});

test('a nested throw exits intermediate frames and resumes the surviving ancestor', () => {
  const events = [
    event('root-start', 'enter', 'root', ['root']),
    event('middle-start', 'enter', 'middle', ['root', 'middle'], 'root'),
    event('leaf-start', 'enter', 'leaf', ['root', 'middle', 'leaf'], 'middle'),
    event('unwind', 'throw', 'leaf', ['root'], 'middle'),
    event('root-catch', 'catch', 'root', ['root']),
    event('root-end', 'return', 'root', []),
  ];
  assert.deepEqual(compileNavigation(events), [
    {
      cursor: 0,
      previousCursor: null,
      nextCursor: 1,
      intoCursor: 1,
      overCursor: 1,
      outCursor: null,
    },
    {
      cursor: 1,
      previousCursor: 0,
      nextCursor: 2,
      intoCursor: 2,
      overCursor: 5,
      outCursor: 6,
    },
    {
      cursor: 2,
      previousCursor: 1,
      nextCursor: 3,
      intoCursor: 3,
      overCursor: 4,
      outCursor: 4,
    },
    {
      cursor: 3,
      previousCursor: 2,
      nextCursor: 4,
      intoCursor: 4,
      overCursor: 4,
      outCursor: 4,
    },
    {
      cursor: 4,
      previousCursor: 3,
      nextCursor: 5,
      intoCursor: 5,
      overCursor: 5,
      outCursor: 6,
    },
    {
      cursor: 5,
      previousCursor: 4,
      nextCursor: 6,
      intoCursor: 6,
      overCursor: 6,
      outCursor: 6,
    },
    {
      cursor: 6,
      previousCursor: 5,
      nextCursor: null,
      intoCursor: null,
      overCursor: null,
      outCursor: null,
    },
  ]);
});

test('unresolved exits select the parent even when the exit snapshot retains the child', () => {
  const events = [
    event('root-start', 'enter', 'root', ['root']),
    event('child-start', 'enter', 'child', ['root', 'child'], 'root'),
    {
      ...event(
        'unknown-exit',
        'unresolved',
        'child',
        ['root', 'child'],
        'root',
      ),
      certainty: 'unresolved' as const,
      note: 'Synthetic missing evidence',
    },
    event('root-work', 'statement', 'root', ['root']),
    event('root-end', 'return', 'root', []),
  ];
  assert.deepEqual(compileNavigation(events), [
    {
      cursor: 0,
      previousCursor: null,
      nextCursor: 1,
      intoCursor: 1,
      overCursor: 1,
      outCursor: null,
    },
    {
      cursor: 1,
      previousCursor: 0,
      nextCursor: 2,
      intoCursor: 2,
      overCursor: 4,
      outCursor: 5,
    },
    {
      cursor: 2,
      previousCursor: 1,
      nextCursor: 3,
      intoCursor: 3,
      overCursor: 3,
      outCursor: 3,
    },
    {
      cursor: 3,
      previousCursor: 2,
      nextCursor: 4,
      intoCursor: 4,
      overCursor: 4,
      outCursor: 5,
    },
    {
      cursor: 4,
      previousCursor: 3,
      nextCursor: 5,
      intoCursor: 5,
      overCursor: 5,
      outCursor: 5,
    },
    {
      cursor: 5,
      previousCursor: 4,
      nextCursor: null,
      intoCursor: null,
      overCursor: null,
      outCursor: null,
    },
  ]);
});

test('attributed exhaustion targets N without inventing a return or following a sibling', () => {
  const events = [
    event('root-start', 'enter', 'root', ['root']),
    event('sibling-start', 'enter', 'sibling', ['sibling']),
    event('sibling-work', 'statement', 'sibling', ['sibling']),
    event('boundary', 'await', 'sibling', ['sibling']),
  ];
  assert.deepEqual(compileNavigation(events), [
    {
      cursor: 0,
      previousCursor: null,
      nextCursor: 1,
      intoCursor: 1,
      overCursor: 1,
      outCursor: null,
    },
    {
      cursor: 1,
      previousCursor: 0,
      nextCursor: 2,
      intoCursor: 4,
      overCursor: 4,
      outCursor: 4,
    },
    {
      cursor: 2,
      previousCursor: 1,
      nextCursor: 3,
      intoCursor: 3,
      overCursor: 3,
      outCursor: 4,
    },
    {
      cursor: 3,
      previousCursor: 2,
      nextCursor: 4,
      intoCursor: 4,
      overCursor: 4,
      outCursor: 4,
    },
    {
      cursor: 4,
      previousCursor: 3,
      nextCursor: null,
      intoCursor: null,
      overCursor: null,
      outCursor: null,
    },
  ]);
  assert.equal(
    events.some((item) => item.kind === 'return'),
    false,
  );
});

test('unattributed console advances Out while another unattributed event disables it', () => {
  const events = [
    {
      ...event('output', 'console', 'process-output', []),
      output: 'mock output',
    },
    event('unattributed', 'statement', 'unknown-call', []),
    event('root-start', 'enter', 'root', ['root']),
    event('root-end', 'return', 'root', []),
  ];
  assert.deepEqual(compileNavigation(events), [
    {
      cursor: 0,
      previousCursor: null,
      nextCursor: 1,
      intoCursor: 1,
      overCursor: 1,
      outCursor: null,
    },
    {
      cursor: 1,
      previousCursor: 0,
      nextCursor: 2,
      intoCursor: 2,
      overCursor: 2,
      outCursor: 2,
    },
    {
      cursor: 2,
      previousCursor: 1,
      nextCursor: 3,
      intoCursor: 3,
      overCursor: 3,
      outCursor: null,
    },
    {
      cursor: 3,
      previousCursor: 2,
      nextCursor: 4,
      intoCursor: 4,
      overCursor: 4,
      outCursor: 4,
    },
    {
      cursor: 4,
      previousCursor: 3,
      nextCursor: null,
      intoCursor: null,
      overCursor: null,
      outCursor: null,
    },
  ]);
});
