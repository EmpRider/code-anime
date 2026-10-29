import assert from 'node:assert/strict';
import test from 'node:test';
import { traceSchema } from '../src/domain/trace.js';
import { flowSchema } from '../src/domain/flow.js';

const receipt = '11111111-1111-4111-8111-111111111111';
const event = {
  id: 'event-0',
  kind: 'statement',
  symbolId: 'run',
  label: 'mock step',
  callId: 'call-1',
  source: { file: 'fixture.any', line: 2, endLine: 2 },
  values: {},
  stack: ['call-1'],
  certainty: 'mock',
  evidenceIds: [receipt],
};
const group = {
  id: 'loop-1',
  kind: 'loop',
  title: 'Mock loop',
  callId: 'call-1',
  memberEventIds: ['event-0'],
  source: { file: 'fixture.any', line: 1, endLine: 1 },
  evidenceIds: [receipt],
  certainty: 'mock',
};
const trace = {
  version: 2,
  provider: 'codegraph',
  projectRoot: '/synthetic',
  sourceHash: 'hash',
  target: 'run',
  scenario: {},
  events: [event],
  sourceFiles: { 'fixture.any': 'loop\nstep\n' },
  diagnostics: [],
  truncated: false,
  filesAnalyzed: 1,
  cacheHits: 0,
  simulation: {
    mode: 'ai-mock',
    complete: true,
    coverage: 'synthetic',
    evidenceIds: [receipt],
  },
};

test('optional nested semantic groups survive the flow trust boundary without changing events', () => {
  assert.equal(traceSchema.safeParse(trace).success, true);
  const groups = [
    group,
    {
      ...group,
      id: 'iteration-1',
      kind: 'iteration',
      parentGroupId: 'loop-1',
      iteration: 1,
    },
  ];
  const flow = flowSchema.parse({
    trace: { ...trace, semanticGroups: groups },
    endpoint: 'run',
    steps: [{ from: 'a', to: 'b', dtoName: 'mock', dtoFields: {} }],
  });
  assert.deepEqual(
    (flow.trace as unknown as Record<string, unknown>).semanticGroups,
    groups,
  );
  assert.deepEqual(flow.trace!.events, [event]);
});

test('rejects malformed group identities, memberships, and kind metadata', () => {
  const invalid = [
    [group, group],
    [{ ...group, memberEventIds: ['missing'] }],
    [{ ...group, memberEventIds: ['event-0', 'event-0'] }],
    [{ ...group, iteration: 1 }],
    [{ ...group, kind: 'iteration' }],
    [{ ...group, kind: 'iteration', iteration: 0 }],
    [{ ...group, arm: { id: 'then', label: 'Then' } }],
    [{ ...group, certainty: 'static' }],
    [{ ...group, title: '   ' }],
    [{ ...group, id: 'x'.repeat(201) }],
    Array.from({ length: 2001 }, (_, i) => ({ ...group, id: `g-${i}` })),
  ];
  for (const semanticGroups of invalid)
    assert.equal(
      traceSchema.safeParse({ ...trace, semanticGroups }).success,
      false,
    );
});

test('rejects cycles, missing parents and incompatible invocation ownership', () => {
  const duplicateEvents = { ...trace, events: [event, { ...event }] };
  assert.equal(traceSchema.safeParse(duplicateEvents).success, true);
  for (const semanticGroups of [
    [{ ...group, parentGroupId: 'missing' }],
    [{ ...group, parentGroupId: 'loop-1' }],
    [
      { ...group, parentGroupId: 'child' },
      { ...group, id: 'child', parentGroupId: 'loop-1' },
    ],
    [{ ...group, callId: 'other' }],
    [{ ...group, taskId: 'worker' }],
    [
      group,
      {
        ...group,
        id: 'child',
        callId: 'other',
        memberEventIds: [],
        parentGroupId: 'loop-1',
      },
    ],
  ])
    assert.equal(
      traceSchema.safeParse({ ...trace, semanticGroups }).success,
      false,
    );
  assert.equal(
    traceSchema.safeParse({
      ...trace,
      semanticGroups: [
        { ...group, memberEventIds: [] },
        { ...group, id: 'child', parentGroupId: 'loop-1' },
      ],
    }).success,
    true,
  );
  const decision = { ...group, kind: 'decision' };
  const arm = {
    ...group,
    id: 'arm-a',
    kind: 'branch',
    parentGroupId: group.id,
    arm: { id: 'a', label: 'A' },
  };
  assert.equal(
    traceSchema.safeParse({ ...trace, semanticGroups: [decision, arm] })
      .success,
    true,
  );
  assert.equal(
    traceSchema.safeParse({
      ...trace,
      semanticGroups: [
        decision,
        arm,
        { ...arm, id: 'arm-b', arm: { id: 'b', label: 'B' } },
      ],
    }).success,
    false,
  );
  assert.equal(
    traceSchema.safeParse({
      ...trace,
      semanticGroups: [
        { ...decision, kind: 'switch' },
        { ...arm, kind: 'case' },
        { ...arm, kind: 'case', id: 'case-b', arm: { id: 'b', label: 'B' } },
      ],
    }).success,
    false,
  );
  assert.equal(
    traceSchema.safeParse({ ...duplicateEvents, semanticGroups: [group] })
      .success,
    false,
  );
});

test('rejects objectively false source ranges and evidence without treating receipts as branch truth', () => {
  const unsafeSources = [
    {
      source: {
        file: 'fixture.any',
        line: 1,
        endLine: 1,
        generated: { file: 'x'.repeat(4097), line: 1 },
      },
    },
    {
      source: {
        file: 'fixture.any',
        line: Number.MAX_SAFE_INTEGER + 1,
        endLine: Number.MAX_SAFE_INTEGER + 1,
      },
    },
    {
      source: {
        file: 'fixture.any',
        line: 1,
        endLine: 1,
        generated: { file: 'generated.any', line: Number.MAX_SAFE_INTEGER + 1 },
      },
    },
  ];
  assert.deepEqual(
    unsafeSources.map(
      (patch) =>
        traceSchema.safeParse({
          ...trace,
          sourceFiles: undefined,
          semanticGroups: [{ ...group, ...patch }],
        }).success,
    ),
    [false, false, false],
  );
  for (const patch of [
    { source: { file: 'fixture.any', line: 2, endLine: 1 } },
    { source: { file: 'fixture.any', line: 1, endLine: 99 } },
    { source: { file: 'other.any', line: 1, endLine: 1 } },
    { evidenceIds: ['22222222-2222-4222-8222-222222222222'] },
  ])
    assert.equal(
      traceSchema.safeParse({
        ...trace,
        semanticGroups: [{ ...group, ...patch }],
      }).success,
      false,
    );
  assert.equal(
    traceSchema.safeParse({
      ...trace,
      semanticGroups: [
        {
          ...group,
          kind: 'branch',
          arm: { id: 'then', label: 'Assumed arm' },
          certainty: 'assumed',
        },
      ],
    }).success,
    true,
  );
});
