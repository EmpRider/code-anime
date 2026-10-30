import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  validateFlowSceneDocument,
  selectReadyVariant,
} from '../public/v3-scene-adapter.js';

function fixture(name) {
  const path = new URL(`./fixtures/v3/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function invalid(mutator, name = 'proposed-baseline') {
  const data = fixture(name);
  mutator(data, data.variantsById.proposed, data.variantsById.baseline);
  assert.throws(
    () => validateFlowSceneDocument(data),
    (error) => {
      assert.equal(error.code, 'INVALID_ARTIFACT');
      assert.match(error.message, /.+/);
      return true;
    },
  );
}

test('accepts complete independent proposed/baseline with distinct source hashes and local IDs', () => {
  const raw = fixture('proposed-baseline');
  const result = validateFlowSceneDocument(raw);
  assert.deepEqual(result.comparison.variantOrder, ['proposed', 'baseline']);
  assert.equal(
    selectReadyVariant(result, 'proposed').artifact.sourceHash,
    'hash:proposed',
  );
  assert.equal(
    selectReadyVariant(result, 'baseline').artifact.sourceHash,
    'hash:baseline',
  );
  assert.equal(
    selectReadyVariant(result, 'baseline').graph.nodes[0].id,
    'node:baseline',
  );
  assert.equal(raw.variantsById.proposed.artifact.sourceHash, 'hash:proposed');
  assert.equal(
    validateFlowSceneDocument(JSON.stringify(raw)).variantsById.proposed
      .artifact.id,
    'artifact:p',
  );
});

test('preserves exact CRLF, emoji UTF-16 spans, repeated source Visits, console and HTML-looking text', () => {
  const variant = selectReadyVariant(
    validateFlowSceneDocument(fixture('proposed-baseline')),
    'proposed',
  );
  assert.equal(
    variant.source.files[0].text,
    'const 😄 = 1;\r\nconsole.log(😄);\n',
  );
  assert.equal(variant.source.files[0].text.slice(6, 8), '😄');
  assert.deepEqual(variant.playback.sourceVisits[0].stepIds, [1, 3]);
  assert.equal(variant.playback.frames[2].eventId, 'event:3');
  assert.equal(
    variant.graph.nodes[0].label,
    'start <img src=x onerror=alert(1)>',
  );
  assert.equal(variant.playback.consoleEntries[0].text, 'mock 😄\n');
});

test('preserves constructor and __proto__ as literal own JSON data without polluting prototypes', () => {
  const variant = selectReadyVariant(
    validateFlowSceneDocument(fixture('proposed-baseline')),
    'proposed',
  );
  const variables = variant.playback.valueSnapshots[1].variables;
  assert.equal(Object.hasOwn(variables, '__proto__'), true);
  assert.equal(variables.__proto__.polluted, false);
  assert.equal(Object.hasOwn(variables, 'constructor'), true);
  assert.equal(variables.constructor, 'safe');
  assert.equal({}.polluted, undefined);
  assert.equal(variant.source.files[0].path, '__proto__');
});

test('freezes a detached validated output recursively; input mutations never change selected variants', () => {
  const raw = fixture('proposed-baseline');
  const result = validateFlowSceneDocument(raw);
  raw.variantsById.proposed.graph.nodes[0].label = 'mutated';
  assert.equal(
    selectReadyVariant(result, 'proposed').graph.nodes[0].label,
    'start <img src=x onerror=alert(1)>',
  );
  assert.equal(Object.isFrozen(result), true);
  assert.equal(
    Object.isFrozen(
      result.variantsById.proposed.playback.valueSnapshots[1].variables
        .__proto__,
    ),
    true,
  );
  assert.throws(() => {
    result.variantsById.proposed.graph.nodes.push({ id: 'fabricated' });
  }, TypeError);
});

test('accepts explicit unavailable baseline and exposes its exact reason without any fallback', () => {
  const result = validateFlowSceneDocument(fixture('unavailable-baseline'));
  assert.equal(
    selectReadyVariant(result, 'proposed').graph.nodes[0].certainty,
    'unresolved',
  );
  assert.deepEqual(selectReadyVariant(result, 'baseline'), {
    availability: 'unavailable',
    reason: 'Baseline session expired',
  });
  assert.equal(
    selectReadyVariant(
      validateFlowSceneDocument(fixture('nested-multilingual')),
      'baseline',
    ),
    null,
  );
});

test('accepts nested multilingual groups and a genuine unresolved node/edge without synthesizing facts', () => {
  const result = validateFlowSceneDocument(fixture('nested-multilingual'));
  const variant = selectReadyVariant(result, 'proposed');
  assert.deepEqual(variant.graph.nodes[2].groupPathIds, [
    'group:outer',
    'group:choice',
    'group:arm',
    'group:lambda',
  ]);
  assert.equal(variant.graph.edges[2].certainty, 'unresolved');
  assert.equal(variant.graph.edges[2].executionStatus, 'unresolved');
  assert.equal(variant.graph.nodes[3].sourceRef, null);
  assert.equal(
    variant.source.files[1].text,
    'if (準備完了) {\n  println("OK")\n}\n',
  );
});

test('preserves producer-supplied bounded monotonic consoleThrough without reconstructing it from sourceStep', () => {
  const raw = fixture('proposed-baseline');
  raw.variantsById.proposed.playback.frames[0].consoleThrough = 1;
  const result = validateFlowSceneDocument(raw);
  assert.equal(
    result.variantsById.proposed.playback.frames[0].consoleThrough,
    1,
  );
  const beforeFirst = fixture('proposed-baseline');
  beforeFirst.variantsById.proposed.playback.initial.consoleThrough = 1;
  beforeFirst.variantsById.proposed.playback.frames[0].consoleThrough = 1;
  assert.equal(
    validateFlowSceneDocument(beforeFirst).variantsById.proposed.playback
      .initial.consoleThrough,
    1,
  );
  const interleaved = fixture('proposed-baseline');
  interleaved.variantsById.proposed.playback.consoleEntries.push({
    id: 'console:older-step-delivered-later',
    text: 'buffered output',
    certainty: 'mock',
    sourceStep: 1,
  });
  assert.equal(
    validateFlowSceneDocument(interleaved).variantsById.proposed.playback
      .consoleEntries[1].sourceStep,
    1,
  );
});

test('preserves producer-authored highlight subsets and explicit UTC +00:00 timestamps', () => {
  const raw = fixture('proposed-baseline');
  raw.variantsById.proposed.playback.frames[1].activeNodeIds = [];
  raw.variantsById.proposed.artifact.createdAt = '2026-10-29T00:00:00+00:00';
  const variant = validateFlowSceneDocument(raw).variantsById.proposed;
  assert.deepEqual(variant.playback.frames[1].activeNodeIds, []);
  assert.equal(variant.artifact.createdAt, '2026-10-29T00:00:00+00:00');
});

test('accepts one producer-authored Visit for a multiline frame and a null-call Visit row', () => {
  const raw = fixture('proposed-baseline');
  const p = raw.variantsById.proposed;
  p.playback.frames[0].sourceRef.endLine = 2;
  p.playback.sourceVisits = [
    { fileId: 'file:emoji', line: 2, callId: null, stepIds: [1] },
    { fileId: 'file:emoji', line: 2, callId: 'call:p', stepIds: [2] },
    { fileId: 'file:emoji', line: 1, callId: 'call:p', stepIds: [3] },
  ];
  const result = validateFlowSceneDocument(raw);
  assert.deepEqual(
    result.variantsById.proposed.playback.sourceVisits[0].stepIds,
    [1],
  );
  assert.equal(
    result.variantsById.proposed.playback.frames[0].sourceRef.endLine,
    2,
  );
});

test('rejects a malformed ready baseline atomically, even if proposed is valid', () => {
  assert.throws(
    () => validateFlowSceneDocument(fixture('invalid-ready-baseline')),
    { code: 'INVALID_ARTIFACT' },
  );
  invalid((root, proposed, baseline) => {
    baseline.playback.frames[0].valueSnapshotId =
      proposed.playback.valueSnapshots[0].id;
  });
});

test('rejects invalid schema, comparison selections and unavailable variant shapes', () => {
  invalid((root) => {
    delete root.comparison;
  });
  invalid((root) => {
    root.schemaVersion = '4.0.0';
  });
  invalid((root) => {
    root.comparison.defaultVariantId = 'baseline-missing';
  });
  invalid((root) => {
    root.comparison.variantOrder = ['proposed', 'proposed'];
  });
  invalid((root) => {
    root.comparison.variantOrder = ['proposed'];
  });
  invalid((root) => {
    root.variantsById.proposed.availability = 'unavailable';
  });
  invalid((root) => {
    root.variantsById.extra = clone(root.variantsById.baseline);
  });
  invalid((root) => {
    root.variantsById.baseline = {
      availability: 'unavailable',
      reason: 'expired',
      graph: {},
    };
  });
  invalid((root) => {
    root.variantsById.baseline = { availability: 'unavailable', reason: '' };
  });
  invalid((root) => {
    root.comparison.defaultVariantId = 'baseline';
    root.variantsById.baseline = {
      availability: 'unavailable',
      reason: 'expired',
    };
  });
  invalid((root) => {
    root.variantsById.baseline.artifact.projectRoot = 'different project';
  });
  invalid((root) => {
    root.variantsById.baseline.artifact.target = 'different target';
  });
  invalid((root) => {
    root.variantsById.proposed.artifact.createdAt = '2026-10-29 00:00:00';
  });
  invalid((root) => {
    root.variantsById.proposed.artifact.createdAt = '2026-02-30T00:00:00Z';
  });
});

test('rejects duplicate node, edge, group, event and frame IDs', () => {
  invalid((root, p) => {
    p.graph.nodes.push(clone(p.graph.nodes[0]));
  });
  invalid((root, p) => {
    p.graph.edges.push(clone(p.graph.edges[0]));
  });
  invalid((root, p) => {
    p.graph.nodes[1].eventIds[0] = 'event:1';
  });
  invalid((root, p) => {
    p.playback.frames[1].id = p.playback.frames[0].id;
  });
  invalid((root, p) => {
    p.playback.frames[2].eventId = 'event:1';
  });
  invalid((root, p) => {
    p.graph.groups.push(clone(p.graph.groups[0]));
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.nodes[0].eventIds.push('event:1');
  });
});

test('rejects cross-kind graph IDs before playback checks, even with updated references', () => {
  const raw = fixture('proposed-baseline');
  const variant = raw.variantsById.proposed;
  variant.graph.edges[0].id = variant.graph.nodes[0].id;
  variant.playback.frames[1].activeEdgeIds = [variant.graph.nodes[0].id];
  assert.throws(
    () => validateFlowSceneDocument(raw),
    (error) => {
      assert.equal(error.code, 'INVALID_ARTIFACT');
      assert.match(error.message, /duplicate graph ID node:one.*nodes.*edges/);
      return true;
    },
  );
});

test('rejects node/group ID collisions with otherwise consistent nesting', () => {
  const nodeGroup = fixture('nested-multilingual');
  const p = nodeGroup.variantsById.proposed;
  const oldGroupId = 'group:outer';
  const sharedId = p.graph.nodes[0].id;
  p.graph.groups.find((group) => group.id === oldGroupId).id = sharedId;
  for (const group of p.graph.groups) {
    if (group.parentGroupId === oldGroupId) group.parentGroupId = sharedId;
  }
  for (const node of p.graph.nodes) {
    node.groupPathIds = node.groupPathIds.map((id) =>
      id === oldGroupId ? sharedId : id,
    );
  }
  assert.throws(
    () => validateFlowSceneDocument(nodeGroup),
    (error) => {
      assert.equal(error.code, 'INVALID_ARTIFACT');
      assert.match(
        error.message,
        /duplicate graph ID node:入口.*nodes.*groups/,
      );
      return true;
    },
  );
});

test('rejects group/edge ID collisions with updated playback references', () => {
  const groupEdge = fixture('nested-multilingual');
  const q = groupEdge.variantsById.proposed;
  const oldEdgeId = q.graph.edges[0].id;
  const sameId = q.graph.groups[0].id;
  q.graph.edges[0].id = sameId;
  for (const frame of q.playback.frames) {
    frame.activeEdgeIds = frame.activeEdgeIds.map((id) =>
      id === oldEdgeId ? sameId : id,
    );
  }
  assert.throws(
    () => validateFlowSceneDocument(groupEdge),
    (error) => {
      assert.equal(error.code, 'INVALID_ARTIFACT');
      assert.match(
        error.message,
        /duplicate graph ID group:outer.*edges.*groups/,
      );
      return true;
    },
  );
});

test('allows identical graph IDs in different ready variants without remapping', () => {
  const raw = fixture('proposed-baseline');
  const baseline = raw.variantsById.baseline;
  baseline.graph.nodes[0].id = raw.variantsById.proposed.graph.nodes[0].id;
  baseline.playback.frames[0].activeNodeIds = [baseline.graph.nodes[0].id];
  const validated = validateFlowSceneDocument(raw);
  assert.equal(validated.variantsById.proposed.graph.nodes[0].id, 'node:one');
  assert.equal(validated.variantsById.baseline.graph.nodes[0].id, 'node:one');
  assert.deepEqual(raw.variantsById.baseline.playback.frames[0].activeNodeIds, [
    'node:one',
  ]);
});

test('rejects graph, source and evidence references missing from the same ready variant', () => {
  invalid((root, p) => {
    p.graph.edges[0].toNodeId = 'node:baseline';
  });
  invalid((root, p) => {
    p.playback.frames[1].activeNodeIds = ['node:baseline'];
  });
  invalid((root, p) => {
    p.playback.frames[1].activeEdgeIds = ['edge:unknown'];
  });
  invalid((root, p) => {
    p.playback.frames[0].eventId = 'event:unknown';
  });
  invalid((root, p) => {
    p.graph.nodes[0].sourceRef.fileId = 'file:unknown';
  });
  invalid((root, p) => {
    p.graph.nodes[0].sourceRef.endLine = 100;
  });
  invalid((root, p) => {
    p.graph.nodes[0].sourceRef.generated = { fileId: 'file:missing', line: 1 };
  });
  invalid((root, p) => {
    p.playback.frames[1].sourceRef.fileId = 'file:unknown';
  });
  invalid((root, p) => {
    p.graph.nodes[0].evidenceIds = ['receipt:missing'];
  });
  invalid((root, p) => {
    p.graph.edges[0].evidenceIds = ['receipt:missing'];
  });
  invalid((root, p) => {
    p.playback.frames[1].valueSnapshotId = 'value:unknown';
  });
  invalid((root, p) => {
    p.playback.initial.stackSnapshotId = 'stack:missing';
  });
  invalid((root, p) => {
    p.playback.stackSnapshots[1].frames[0].callId = 'call:unknown';
  });
});

test('rejects missing, cyclic, contradictory or foreign group ownership', () => {
  invalid((root, p) => {
    p.graph.groups[1].parentGroupId = 'group:missing';
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.groups[0].parentGroupId = 'group:lambda';
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.nodes[2].groupPathIds.reverse();
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.groups[1].memberNodeIds.push('node:λ');
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.groups[1].memberNodeIds.push('node:missing');
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.groups[3].taskId = 'task:other';
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.groups[0].arm = { id: 'arm:bad', label: 'bad' };
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.groups[2].arm = { id: '', label: 'empty' };
  }, 'nested-multilingual');
  invalid((root, p) => {
    p.graph.groups[3].iteration = 2;
  }, 'nested-multilingual');
});

test('validates deep explicit group ancestry iteratively without an arbitrary depth cap', () => {
  const raw = fixture('proposed-baseline');
  const variant = raw.variantsById.proposed;
  const depth = 4096;
  variant.graph.groups = Array.from({ length: depth }, (_, i) => ({
    id: `group:${i}`,
    kind: 'sequence',
    label: `scope ${i}`,
    parentGroupId: i === 0 ? null : `group:${i - 1}`,
    memberNodeIds: i === depth - 1 ? ['node:one'] : [],
    order: i,
    callId: 'call:p',
    taskId: 'task:p',
    arm: null,
    iteration: null,
    sourceRef: null,
    certainty: 'mock',
    evidenceIds: [],
  }));
  variant.graph.nodes[0].groupPathIds = variant.graph.groups.map(
    (group) => group.id,
  );
  const result = validateFlowSceneDocument(raw);
  assert.equal(
    result.variantsById.proposed.graph.nodes[0].groupPathIds.length,
    depth,
  );
});

test('rejects invalid half-open UTF-16 token spans but preserves intact emoji and mixed newlines', () => {
  invalid((root, p) => {
    p.source.files[0].tokenSpans[1].startUtf16 = 7;
  });
  invalid((root, p) => {
    p.source.files[0].tokenSpans[1].endUtf16 = 7;
  });
  invalid((root, p) => {
    p.source.files[0].tokenSpans[2].endUtf16 = 999;
  });
  invalid((root, p) => {
    p.source.files[0].tokenSpans[1].endUtf16 = 17;
  });
  invalid((root, p) => {
    p.source.files[0].tokenSpans[0].kind = 'made-up';
  });
  invalid((root, p) => {
    p.source.files[0].tokenSpans[0].startUtf16 = -1;
  });
});

test('rejects gaps, duplicate references, bad Visit steps and false source-line ownership', () => {
  invalid((root, p) => {
    p.playback.sourceVisits = [];
  });
  invalid((root, p) => {
    p.playback.sourceVisits[0].stepIds = [1];
  });
  invalid((root, p) => {
    p.playback.frames[1].step = 4;
  });
  invalid((root, p) => {
    p.playback.sourceVisits[0].stepIds = [3, 1];
  });
  invalid((root, p) => {
    p.playback.sourceVisits[0].stepIds = [1, 1, 3];
  });
  invalid((root, p) => {
    p.playback.sourceVisits[0].stepIds = [1, 4];
  });
  invalid((root, p) => {
    p.playback.sourceVisits[0].stepIds = [1, 2, 3];
  });
  invalid((root, p) => {
    p.playback.sourceVisits[0].fileId = 'file:missing';
  });
  invalid((root, p) => {
    p.playback.sourceVisits[0].callId = 'call:other';
  });
  invalid((root, p) => {
    p.playback.invocations[0].stepIds = [1, 3, 2];
  });
  invalid((root, p) => {
    p.playback.invocations[0].parentCallId = 'call:missing';
  });
  invalid((root, p) => {
    p.playback.invocations[0].entryStep = 2;
  });
  invalid((root, p) => {
    p.playback.invocations[0].parentCallId = 'call:p';
  });
});

test('rejects invalid navigation cursor/target, including wrong end state and backward Into', () => {
  invalid((root, p) => {
    p.playback.navigationByCursor.pop();
  });
  invalid((root, p) => {
    p.playback.navigationByCursor[1].cursor = 2;
  });
  invalid((root, p) => {
    p.playback.navigationByCursor[0].previousCursor = 0;
  });
  invalid((root, p) => {
    p.playback.navigationByCursor[2].nextCursor = 1;
  });
  invalid((root, p) => {
    p.playback.navigationByCursor[1].intoCursor = 0;
  });
  invalid((root, p) => {
    p.playback.navigationByCursor[2].outCursor = 4;
  });
  invalid((root, p) => {
    p.playback.navigationByCursor[3].overCursor = 3;
  });
  invalid((root, p) => {
    p.playback.navigationByCursor[0].nextCursor = 'frame:1';
  });
  invalid((root, p) => {
    p.playback.navigationByCursor[0].hiddenExtraTarget = 1;
  });
});

test('rejects inconsistent console and snapshot states, certainty, and foreign invocation ownership', () => {
  invalid((root, p) => {
    p.playback.frames[2].consoleThrough = 0;
  });
  invalid((root, p) => {
    p.playback.frames[1].consoleThrough = 2;
  });
  invalid((root, p) => {
    p.playback.initial.consoleThrough = 2;
  });
  invalid((root, p) => {
    p.playback.consoleEntries[0].sourceStep = 4;
  });
  invalid((root, p) => {
    p.playback.valueSnapshots[1].variables = [];
  });
  invalid((root, p) => {
    p.graph.nodes[0].certainty = 'observed-runtime';
  });
  invalid((root, p) => {
    p.graph.nodes[0].sourceRef = null;
    p.graph.nodes[0].note = null;
  });
  invalid((root, p) => {
    p.graph.nodes[0].sourceRef = null;
    p.graph.nodes[0].note = '   ';
  });
  invalid((root, p) => {
    p.playback.frames[0].taskId = 'task:foreign';
  });
  invalid((root, p) => {
    p.graph.edges[0].callTransition = {
      fromCallId: 'call:p',
      toCallId: 'call:foreign',
    };
  });
});

test('rejects non-JSON objects, malicious accessor properties and object-key collisions without running them', () => {
  assert.throws(() => validateFlowSceneDocument('{broken'), {
    code: 'INVALID_ARTIFACT',
  });
  const raw = fixture('proposed-baseline');
  let invoked = false;
  Object.defineProperty(raw.variantsById, 'constructor', {
    enumerable: true,
    get() {
      invoked = true;
      return {};
    },
  });
  assert.throws(() => validateFlowSceneDocument(raw), {
    code: 'INVALID_ARTIFACT',
  });
  assert.equal(invoked, false);
  invalid((root, p) => {
    p.source.files.push({ ...p.source.files[0], id: 'file:emoji' });
  });
  invalid((root, p) => {
    p.playback.valueSnapshots.push(clone(p.playback.valueSnapshots[0]));
  });
});

test('rejects an object-valued enum as typed INVALID_ARTIFACT without invoking value coercion', () => {
  invalid((root, p) => {
    p.graph.nodes[0].kind = {
      toString: 'not callable',
      valueOf: 'not callable',
    };
  });
});

test('rejects an invalid variant selector as typed INVALID_ARTIFACT without coercion', () => {
  const document = validateFlowSceneDocument(fixture('proposed-baseline'));
  const invalidId = { toString: 'not callable', valueOf: 'not callable' };
  assert.throws(() => selectReadyVariant(document, invalidId), {
    code: 'INVALID_ARTIFACT',
  });
});
