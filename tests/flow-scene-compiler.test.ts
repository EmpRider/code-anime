import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AcceptedSceneInput } from '../src/domain/scene-input.js';
import type { ReadyVariant, SceneNode } from '../src/domain/flow-scene.js';
import type { TraceEvent } from '../src/domain/trace.js';
import { validateFlowSceneDocument } from '../public/v3-scene-adapter.js';
import { compileReadyVariant } from '../src/services/flow-scene-compiler.js';

function event(
  id: string,
  kind: TraceEvent['kind'],
  callId: string,
  stack: string[],
  extra: Partial<TraceEvent> = {},
): TraceEvent {
  return {
    id,
    kind,
    callId,
    stack,
    symbolId: callId === 'call:root' ? 'Example.run' : 'Example.child',
    label: 'In-memory simulated operation',
    values: { explanation: 'Display metadata, not local variable state' },
    source: { file: 'src/main.ts', line: 1, endLine: 1 },
    locals: {},
    objects: {},
    certainty: 'mock',
    ...extra,
  };
}

function sampleEvents(): TraceEvent[] {
  return [
    event('root-start', 'enter', 'call:root', ['call:root'], {
      inputs: { seed: 1 },
      locals: { 'call:root': { seed: 1 } },
    }),
    event('child-start', 'enter', 'call:child', ['call:root', 'call:child'], {
      parentCallId: 'call:root',
      source: { file: 'src/main.ts', line: 2, endLine: 2 },
      locals: { 'call:root': { seed: 1 }, 'call:child': { value: 2 } },
    }),
    event('child-set', 'assign', 'call:child', ['call:root', 'call:child'], {
      parentCallId: 'call:root',
      source: {
        file: 'src/main.ts',
        line: 2,
        endLine: 3,
        generated: { file: 'generated.js', line: 1 },
      },
      locals: { 'call:root': { seed: 1 }, 'call:child': { value: 3 } },
      objects: { box: { count: 3 } },
    }),
    event('child-end', 'return', 'call:child', ['call:root'], {
      parentCallId: 'call:root',
      source: { file: 'src/main.ts', line: 2, endLine: 2 },
      result: 3,
      locals: { 'call:root': { seed: 1, answer: 3 } },
      objects: { box: { count: 3 } },
    }),
    event('root-use', 'statement', 'call:root', ['call:root'], {
      source: { file: 'src/main.ts', line: 3, endLine: 3 },
      locals: { 'call:root': { seed: 1, answer: 3 } },
      objects: { box: { count: 3 } },
    }),
    event('root-repeat', 'statement', 'call:root', ['call:root'], {
      source: { file: 'src/main.ts', line: 2, endLine: 2 },
      locals: { 'call:root': { seed: 1, answer: 3 } },
      objects: { box: { count: 3 } },
    }),
    event('root-end', 'return', 'call:root', [], {
      source: { file: 'src/main.ts', line: 4, endLine: 4 },
      result: 3,
      objects: { box: { count: 3 } },
    }),
  ];
}

function inputFor(events = sampleEvents()): AcceptedSceneInput {
  const nodes: SceneNode[] = events.map((item, order) => ({
    id: `node:${item.id}`,
    kind:
      item.kind === 'enter'
        ? 'entry'
        : item.kind === 'return'
          ? 'return'
          : item.kind === 'throw'
            ? 'throw'
            : item.kind === 'console'
              ? 'console'
              : 'statement',
    label: item.label,
    eventIds: [item.id],
    order,
    callId: item.callId,
    taskId: item.taskId ?? 'main',
    groupPathIds: [],
    sourceRef: item.source
      ? {
          fileId: 'file:main',
          line: item.source.line,
          endLine: item.source.endLine,
          ...(item.source.generated
            ? {
                generated: {
                  fileId: 'file:generated',
                  line: item.source.generated.line,
                },
              }
            : {}),
        }
      : null,
    certainty: item.certainty,
    evidenceIds: [],
    note: null,
  }));
  return {
    artifact: {
      id: 'artifact:fixture',
      sessionId: 'session:fixture',
      revision: 'revision:fixture',
      createdAt: '2026-11-01T00:00:00.000Z',
      sourceHash: 'prepared-source-hash-not-to-be-recomputed',
      projectRoot: '/synthetic/project',
      target: 'Example.run',
      producer: 'code-anime-mcp',
    },
    scenario: {
      entrypoint: 'Example.run',
      description: 'Synthetic fixture only',
      mockInputLabel: 'Invented test input',
    },
    provenance: {
      provider: 'codegraph',
      simulationMode: 'ai-mock',
      receipts: [
        {
          id: 'evidence:fixture',
          tool: 'synthetic-test',
          queryDigest: 'fixture-not-native-provider-proof',
        },
      ],
    },
    status: {
      complete: false,
      truncated: true,
      coverage: {
        status: 'partial',
        reasons: ['Synthetic evidence intentionally incomplete'],
      },
      warnings: ['Unvisited alternatives remain'],
      diagnostics: ['Fixture boundary'],
    },
    graph: { nodes, edges: [], groups: [] },
    sources: [
      {
        id: 'file:main',
        path: 'src/main.ts',
        text: 'function run() {\r\n  const value = 3;\n  return value;\r\n}\n',
        languageHint: null,
      },
      {
        id: 'file:generated',
        path: 'generated.js',
        text: 'generated();\n',
        languageHint: null,
      },
    ],
    events,
    activeEdgeIdsByEventId: new Map(events.map((item) => [item.id, []])),
  };
}

function compile(input: AcceptedSceneInput) {
  return compileReadyVariant(input, new AbortController().signal);
}

function valueAt(variant: ReadyVariant, cursor: number) {
  const state =
    cursor === 0
      ? variant.playback.initial
      : variant.playback.frames[cursor - 1]!;
  const snapshot = variant.playback.valueSnapshots.find(
    (item) => item.id === state.valueSnapshotId,
  );
  assert.ok(snapshot, `Missing Values snapshot at cursor ${cursor}`);
  return snapshot;
}

function stackAt(variant: ReadyVariant, cursor: number) {
  const state =
    cursor === 0
      ? variant.playback.initial
      : variant.playback.frames[cursor - 1]!;
  const snapshot = variant.playback.stackSnapshots.find(
    (item) => item.id === state.stackSnapshotId,
  );
  assert.ok(snapshot, `Missing stack snapshot at cursor ${cursor}`);
  return snapshot.frames;
}

test('compiler prepares cursor zero and every full Values objects result and stack snapshot', () => {
  const input = inputFor();
  const before = structuredClone(input);
  const variant = compile(input);
  assert.equal(variant.availability, 'ready');
  assert.deepEqual(valueAt(variant, 0).variables, {});
  assert.deepEqual(valueAt(variant, 0).objects, {});
  assert.equal(Object.hasOwn(valueAt(variant, 0), 'result'), false);
  assert.equal(variant.playback.initial.consoleThrough, 0);
  assert.deepEqual(
    variant.playback.frames.map((frame) => frame.step),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(
    new Set(variant.playback.frames.map((frame) => frame.id)).size,
    7,
  );
  assert.equal(variant.playback.navigationByCursor.length, 8);
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7].map((cursor) => valueAt(variant, cursor).variables),
    [
      { 'call:root': { seed: 1 } },
      { 'call:root': { seed: 1 }, 'call:child': { value: 2 } },
      { 'call:root': { seed: 1 }, 'call:child': { value: 3 } },
      { 'call:root': { seed: 1, answer: 3 } },
      { 'call:root': { seed: 1, answer: 3 } },
      { 'call:root': { seed: 1, answer: 3 } },
      {},
    ],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7].map((cursor) => valueAt(variant, cursor).objects),
    [
      {},
      {},
      { box: { count: 3 } },
      { box: { count: 3 } },
      { box: { count: 3 } },
      { box: { count: 3 } },
      { box: { count: 3 } },
    ],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7].map((cursor) => stackAt(variant, cursor)),
    [
      [],
      [{ callId: 'call:root', label: 'Example.run' }],
      [
        { callId: 'call:root', label: 'Example.run' },
        { callId: 'call:child', label: 'Example.child' },
      ],
      [
        { callId: 'call:root', label: 'Example.run' },
        { callId: 'call:child', label: 'Example.child' },
      ],
      [{ callId: 'call:root', label: 'Example.run' }],
      [{ callId: 'call:root', label: 'Example.run' }],
      [{ callId: 'call:root', label: 'Example.run' }],
      [],
    ],
  );
  assert.equal(valueAt(variant, 4).result, 3);
  assert.equal(Object.hasOwn(valueAt(variant, 5), 'result'), false);
  assert.equal(valueAt(variant, 7).result, 3);
  assert.deepEqual(variant.artifact, before.artifact);
  assert.deepEqual(variant.status, before.status);
  assert.deepEqual(variant.provenance, before.provenance);
  assert.deepEqual(input, before);
  assert.doesNotThrow(() =>
    validateFlowSceneDocument({
      schemaVersion: '3.0.0',
      comparison: { defaultVariantId: 'proposed', variantOrder: ['proposed'] },
      variantsById: { proposed: variant },
    }),
  );
});

test('canonical graph active edges and generated-source locations remain explicit', () => {
  const input = inputFor();
  input.graph.edges = [
    {
      id: 'edge:call',
      fromNodeId: 'node:root-start',
      toNodeId: 'node:child-start',
      kind: 'call',
      label: 'Mock child call',
      certainty: 'mock',
      evidenceIds: [],
      executionStatus: 'simulated-taken',
      callTransition: { fromCallId: 'call:root', toCallId: 'call:child' },
    },
    {
      id: 'edge:return',
      fromNodeId: 'node:child-end',
      toNodeId: 'node:root-use',
      kind: 'return',
      label: 'Mock return',
      certainty: 'mock',
      evidenceIds: [],
      executionStatus: 'simulated-taken',
      callTransition: { fromCallId: 'call:child', toCallId: 'call:root' },
    },
  ];
  input.activeEdgeIdsByEventId = new Map([
    ['root-start', []],
    ['child-start', ['edge:call']],
    ['child-set', []],
    ['child-end', []],
    ['root-use', ['edge:return']],
    ['root-repeat', []],
    ['root-end', []],
  ]);
  const variant = compile(input);
  assert.deepEqual(variant.graph, input.graph);
  assert.deepEqual(
    variant.playback.frames.map((frame) => [
      frame.eventId,
      frame.activeNodeIds,
      frame.activeEdgeIds,
      frame.callId,
      frame.taskId,
    ]),
    [
      ['root-start', ['node:root-start'], [], 'call:root', 'main'],
      [
        'child-start',
        ['node:child-start'],
        ['edge:call'],
        'call:child',
        'main',
      ],
      ['child-set', ['node:child-set'], [], 'call:child', 'main'],
      ['child-end', ['node:child-end'], [], 'call:child', 'main'],
      ['root-use', ['node:root-use'], ['edge:return'], 'call:root', 'main'],
      ['root-repeat', ['node:root-repeat'], [], 'call:root', 'main'],
      ['root-end', ['node:root-end'], [], 'call:root', 'main'],
    ],
  );
  assert.deepEqual(variant.playback.frames[2]!.sourceRef, {
    fileId: 'file:main',
    line: 2,
    endLine: 3,
    generated: { fileId: 'file:generated', line: 1 },
  });
  assert.equal(
    variant.source.files[0]!.text,
    'function run() {\r\n  const value = 3;\n  return value;\r\n}\n',
  );
});

test('chronological Visits retain repeats multiline ranges and invocation ownership', () => {
  const variant = compile(inputFor());
  const visits = [...variant.playback.sourceVisits].sort(
    (left, right) =>
      left.line - right.line ||
      String(left.callId).localeCompare(String(right.callId)),
  );
  assert.deepEqual(visits, [
    { fileId: 'file:main', line: 1, callId: 'call:root', stepIds: [1] },
    { fileId: 'file:main', line: 2, callId: 'call:child', stepIds: [2, 3, 4] },
    { fileId: 'file:main', line: 2, callId: 'call:root', stepIds: [6] },
    { fileId: 'file:main', line: 3, callId: 'call:root', stepIds: [5] },
    { fileId: 'file:main', line: 4, callId: 'call:root', stepIds: [7] },
  ]);
  assert.deepEqual(
    variant.playback.invocations.find((item) => item.callId === 'call:root'),
    {
      callId: 'call:root',
      symbolId: 'Example.run',
      parentCallId: null,
      entryStep: 1,
      stepIds: [1, 5, 6, 7],
    },
  );
  assert.deepEqual(
    variant.playback.invocations.find((item) => item.callId === 'call:child'),
    {
      callId: 'call:child',
      symbolId: 'Example.child',
      parentCallId: 'call:root',
      entryStep: 2,
      stepIds: [2, 3, 4],
    },
  );
});

test('escaping throws preserve their prepared surviving Values and stack without replay', () => {
  const variant = compile(
    inputFor([
      event('root-start', 'enter', 'call:root', ['call:root'], {
        locals: { 'call:root': { retained: 1 } },
      }),
      event('child-start', 'enter', 'call:child', ['call:root', 'call:child'], {
        parentCallId: 'call:root',
        locals: {
          'call:root': { retained: 1 },
          'call:child': { discarded: true },
        },
      }),
      event('escaped', 'throw', 'call:child', ['call:root'], {
        parentCallId: 'call:root',
        locals: { 'call:root': { retained: 2 } },
        objects: { box: { visible: true } },
      }),
      event('root-end', 'return', 'call:root', [], {
        result: null,
        objects: { box: { visible: true } },
      }),
    ]),
  );
  assert.deepEqual(valueAt(variant, 3).variables, {
    'call:root': { retained: 2 },
  });
  assert.deepEqual(valueAt(variant, 3).objects, { box: { visible: true } });
  assert.deepEqual(stackAt(variant, 3), [
    { callId: 'call:root', label: 'Example.run' },
  ]);
  assert.equal(Object.hasOwn(valueAt(variant, 4), 'result'), true);
  assert.equal(valueAt(variant, 4).result, null);
  assert.deepEqual(valueAt(variant, 2).variables, {
    'call:root': { retained: 1 },
    'call:child': { discarded: true },
  });
});

test('split ANSI is normalized per stream once with exact rewindable console boundaries', () => {
  const chunks = [
    { output: 'A\x1b[3', stream: 'stdout' },
    { output: 'E\n', stream: 'stderr' },
    { output: '1mred\x1b[0', stream: 'stdout' },
    { output: 'm!\x1b]0;title', stream: 'stdout' },
    { output: '\x1b', stream: 'stdout' },
    { output: '\\done🙂\n', stream: 'stdout' },
    { output: 'bad\x1b[31', stream: 'stderr' },
  ];
  const input = inputFor([
    event('start', 'enter', 'call:root', ['call:root']),
    ...chunks.map((chunk, index) =>
      event(`output:${index}`, 'console', 'call:root', ['call:root'], {
        output: chunk.output,
        values: { stream: chunk.stream },
      }),
    ),
    event('end', 'return', 'call:root', []),
  ]);
  const before = structuredClone(input.events);
  const variant = compile(input);
  assert.deepEqual(
    variant.playback.consoleEntries.map((item) => [
      item.text,
      item.sourceStep,
      item.certainty,
    ]),
    [
      ['A', 2, 'mock'],
      ['E\n', 3, 'mock'],
      ['red', 4, 'mock'],
      ['!', 5, 'mock'],
      ['', 6, 'mock'],
      ['done🙂\n', 7, 'mock'],
      ['bad\x1b[31', 8, 'mock'],
    ],
  );
  assert.deepEqual(
    variant.playback.frames.map((frame) => frame.consoleThrough),
    [0, 1, 2, 3, 4, 5, 6, 7, 7],
  );
  assert.equal(variant.playback.initial.consoleThrough, 0);
  assert.equal(
    variant.playback.consoleEntries
      .slice(0, variant.playback.frames[3]!.consoleThrough)
      .map((item) => item.text)
      .join(''),
    'AE\nred',
  );
  assert.deepEqual(input.events, before);
});

test('own-key Values and objects survive without aliasing input snapshots', () => {
  const input = inputFor();
  input.events[0]!.locals = JSON.parse(
    '{"call:root":{"__proto__":{"visible":1},"constructor":2,"toString":3}}',
  );
  input.events[0]!.objects = JSON.parse(
    '{"__proto__":{"constructor":4},"toString":{"value":5}}',
  );
  const originalLocals = input.events[0]!.locals!;
  const originalLocalFields = originalLocals['call:root'] as Record<
    string,
    unknown
  >;
  const originalProtoValue = originalLocalFields['__proto__'] as Record<
    string,
    unknown
  >;
  const originalObjects = input.events[0]!.objects!;
  const originalProtoObject = originalObjects['__proto__']!;
  const before = structuredClone(input);
  const variant = compile(input);
  const value = valueAt(variant, 1);
  assert.deepEqual(
    value.variables,
    JSON.parse(
      '{"call:root":{"__proto__":{"visible":1},"constructor":2,"toString":3}}',
    ),
  );
  assert.deepEqual(
    value.objects,
    JSON.parse('{"__proto__":{"constructor":4},"toString":{"value":5}}'),
  );
  assert.equal(Object.hasOwn(value.objects, '__proto__'), true);
  assert.deepEqual(input, before);
  originalProtoValue['visible'] = 10;
  originalLocalFields['constructor'] = 20;
  originalProtoObject['constructor'] = 40;
  originalObjects['toString']!['value'] = 50;
  input.graph.nodes[0]!.label = 'input changed';
  input.sources[0]!.text = 'input changed';
  assert.deepEqual(
    value.variables,
    JSON.parse(
      '{"call:root":{"__proto__":{"visible":1},"constructor":2,"toString":3}}',
    ),
  );
  assert.deepEqual(
    value.objects,
    JSON.parse('{"__proto__":{"constructor":4},"toString":{"value":5}}'),
  );
  assert.equal(variant.graph.nodes[0]!.label, 'In-memory simulated operation');
  assert.equal(
    variant.source.files[0]!.text,
    'function run() {\r\n  const value = 3;\n  return value;\r\n}\n',
  );
  const outputLocalFields = value.variables['call:root'] as Record<
    string,
    unknown
  >;
  const outputProtoValue = outputLocalFields['__proto__'] as Record<
    string,
    unknown
  >;
  const outputProtoObject = value.objects['__proto__'] as Record<
    string,
    unknown
  >;
  // Immutable output may reject these writes; accepted writes must not reach input.
  Reflect.set(outputProtoValue, 'visible', 100);
  Reflect.set(outputLocalFields, 'constructor', 200);
  Reflect.set(outputProtoObject, 'constructor', 400);
  Reflect.set(
    value.objects['toString'] as Record<string, unknown>,
    'value',
    500,
  );
  assert.equal(input.events[0]!.locals, originalLocals);
  assert.equal(input.events[0]!.objects, originalObjects);
  assert.deepEqual(
    originalLocals,
    JSON.parse(
      '{"call:root":{"__proto__":{"visible":10},"constructor":20,"toString":3}}',
    ),
  );
  assert.deepEqual(
    originalObjects,
    JSON.parse('{"__proto__":{"constructor":40},"toString":{"value":50}}'),
  );
});

test('variants with overlapping textual IDs keep independent prepared source and Values', () => {
  const proposedInput = inputFor();
  const baselineInput = inputFor();
  baselineInput.artifact.id = 'artifact:baseline';
  baselineInput.artifact.sessionId = 'session:baseline';
  baselineInput.artifact.sourceHash = 'prepared-baseline-hash';
  baselineInput.sources[0]!.text += '// baseline revision\n';
  baselineInput.events[0]!.locals = { 'call:root': { seed: 100 } };
  const proposed = compile(proposedInput);
  const baseline = compile(baselineInput);
  assert.deepEqual(valueAt(proposed, 1).variables, {
    'call:root': { seed: 1 },
  });
  assert.deepEqual(valueAt(baseline, 1).variables, {
    'call:root': { seed: 100 },
  });
  assert.equal(
    proposed.artifact.sourceHash,
    'prepared-source-hash-not-to-be-recomputed',
  );
  assert.equal(baseline.artifact.sourceHash, 'prepared-baseline-hash');
  assert.equal(
    proposed.source.files[0]!.text.endsWith('// baseline revision\n'),
    false,
  );
  assert.equal(
    baseline.source.files[0]!.text.endsWith('// baseline revision\n'),
    true,
  );
  assert.notEqual(
    proposed.playback.navigationByCursor,
    baseline.playback.navigationByCursor,
  );
  assert.notEqual(
    proposed.playback.valueSnapshots,
    baseline.playback.valueSnapshots,
  );
  assert.doesNotThrow(() =>
    validateFlowSceneDocument({
      schemaVersion: '3.0.0',
      comparison: {
        defaultVariantId: 'proposed',
        variantOrder: ['proposed', 'baseline'],
      },
      variantsById: { proposed, baseline },
    }),
  );
});

test('invalid active edges event ownership and uncaptured source fail closed', () => {
  const edgeInput = inputFor();
  const invalidEdges = new Map(edgeInput.activeEdgeIdsByEventId);
  invalidEdges.set('root-start', ['edge:missing']);
  edgeInput.activeEdgeIdsByEventId = invalidEdges;
  assert.throws(() => compile(edgeInput), Error);
  const ownershipInput = inputFor();
  ownershipInput.graph.nodes[1]!.eventIds.push('root-start');
  assert.throws(() => compile(ownershipInput), Error);
  const sourceInput = inputFor();
  sourceInput.events[0]!.source!.file = 'uncaptured.ts';
  assert.throws(() => compile(sourceInput), Error);
});

test('a pre-aborted signal throws its exact reason without changing accepted input', () => {
  const input = inputFor();
  const before = structuredClone(input);
  const controller = new AbortController();
  const reason = new Error('Synthetic compiler cancellation');
  controller.abort(reason);
  assert.throws(
    () => compileReadyVariant(input, controller.signal),
    (error) => error === reason,
  );
  assert.deepEqual(input, before);
});
