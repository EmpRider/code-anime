// Strict, presentation-only V3 artifact boundary. No source or execution inference.

const NODE_KINDS = new Set([
  'entry',
  'statement',
  'decision',
  'branch',
  'loop',
  'iteration',
  'try',
  'catch',
  'finally',
  'switch',
  'case',
  'lambda',
  'call',
  'return',
  'throw',
  'await',
  'yield',
  'console',
  'unresolved',
]);
const EDGE_KINDS = new Set([
  'sequence',
  'branch-true',
  'branch-false',
  'case',
  'loop-body',
  'loop-back',
  'loop-exit',
  'exception',
  'finally',
  'call',
  'return',
  'await',
  'resume',
  'unresolved',
]);
const GROUP_KINDS = new Set([
  'decision',
  'branch',
  'loop',
  'iteration',
  'try',
  'catch',
  'finally',
  'switch',
  'case',
  'lambda',
  'sequence',
  'unresolved',
]);
const CERTAINTIES = new Set([
  'static',
  'mock',
  'assumed',
  'unresolved',
  'proposed',
]);
const TOKEN_KINDS = new Set([
  'keyword',
  'identifier',
  'type',
  'function',
  'string',
  'number',
  'comment',
  'operator',
  'punctuation',
  'other',
]);
const COVERAGE = new Set([
  'unknown',
  'partial',
  'unresolved',
  'provider-truncated',
]);
const EXECUTION_STATUS = new Set([
  'simulated-taken',
  'alternative',
  'unresolved',
]);
const NAV_KEYS = [
  'previousCursor',
  'nextCursor',
  'intoCursor',
  'overCursor',
  'outCursor',
];

function fail(path, detail) {
  const error = new Error(`Invalid V3 scene at ${path}: ${detail}`);
  error.name = 'InvalidArtifactError';
  error.code = 'INVALID_ARTIFACT';
  throw error;
}

// Detach and freeze JSON input before validation/exposure. Own data descriptors avoid
// invoking untrusted getters/toJSON, while defineProperty preserves literal key names.
function detach(value, path, ancestors) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value !== 'object') fail(path, 'expected JSON data');
  if (ancestors.has(value)) fail(path, 'cyclic input is not JSON');
  const isArray = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (
    prototype !== (isArray ? Array.prototype : Object.prototype) &&
    prototype !== null
  ) {
    fail(path, 'expected a plain JSON array or object');
  }
  const keys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const result = isArray ? [] : {};
  ancestors.add(value);
  if (isArray) {
    if (!Number.isSafeInteger(value.length)) fail(path, 'invalid array length');
    for (const key of keys) {
      if (key === 'length') continue;
      if (
        typeof key !== 'string' ||
        !/^(0|[1-9]\d*)$/.test(key) ||
        Number(key) >= value.length
      ) {
        fail(path, 'unexpected non-JSON array property');
      }
    }
    for (let i = 0; i < value.length; i += 1) {
      const descriptor = descriptors[i];
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        fail(`${path}[${i}]`, 'missing array element or accessor');
      }
      result.push(detach(descriptor.value, `${path}[${i}]`, ancestors));
    }
  } else {
    for (const key of keys) {
      if (typeof key !== 'string')
        fail(path, 'JSON object cannot have symbol keys');
      const descriptor = descriptors[key];
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
        fail(
          `${path}.${key}`,
          'expected enumerable JSON data, not an accessor',
        );
      }
      Object.defineProperty(result, key, {
        value: detach(descriptor.value, `${path}.${key}`, ancestors),
        enumerable: true,
        writable: false,
        configurable: false,
      });
    }
  }
  ancestors.delete(value);
  return Object.freeze(result);
}

function object(value, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(path, 'expected object');
  }
  return value;
}
function array(value, path) {
  if (!Array.isArray(value)) fail(path, 'expected array');
  return value;
}
function field(parent, key, path) {
  object(parent, path);
  if (!Object.hasOwn(parent, key))
    fail(`${path}.${key}`, 'required field missing');
  return parent[key];
}
function str(value, path, nonempty = false) {
  if (typeof value !== 'string' || (nonempty && value.length === 0)) {
    fail(path, nonempty ? 'expected nonempty string' : 'expected string');
  }
  return value;
}
function id(value, path) {
  return str(value, path, true);
}
function integer(value, path, min = 0) {
  if (!Number.isSafeInteger(value) || value < min)
    fail(path, `expected integer >= ${min}`);
  return value;
}
function bool(value, path) {
  if (typeof value !== 'boolean') fail(path, 'expected boolean');
}
function oneOf(value, choices, path) {
  if (!choices.has(value)) fail(path, 'unsupported enum value');
}
function stringArray(value, path) {
  array(value, path).forEach((item, i) => str(item, `${path}[${i}]`));
}
function ids(value, path, unique = true) {
  const seen = new Set();
  array(value, path).forEach((item, i) => {
    id(item, `${path}[${i}]`);
    if (unique && seen.has(item)) fail(`${path}[${i}]`, `duplicate ID ${item}`);
    seen.add(item);
  });
}
function indexed(items, path, getId = (item) => item.id) {
  const result = new Map();
  array(items, path).forEach((item, i) => {
    object(item, `${path}[${i}]`);
    const key = id(getId(item), `${path}[${i}].id`);
    if (result.has(key)) fail(`${path}[${i}]`, `duplicate ID ${key}`);
    result.set(key, item);
  });
  return result;
}
function existing(map, key, path) {
  id(key, path);
  if (!map.has(key)) fail(path, `unknown local reference ${key}`);
}
function evidence(value, receipts, path) {
  ids(value, path);
  value.forEach((key, i) => existing(receipts, key, `${path}[${i}]`));
}
function certainty(value, path) {
  oneOf(value, CERTAINTIES, path);
}

function sourceRef(value, files, path) {
  if (value === null) return;
  object(value, path);
  const fileId = field(value, 'fileId', path);
  existing(files, fileId, `${path}.fileId`);
  const line = integer(field(value, 'line', path), `${path}.line`, 1);
  const endLine = integer(
    field(value, 'endLine', path),
    `${path}.endLine`,
    line,
  );
  if (endLine > files.get(fileId).lineCount)
    fail(path, 'source line beyond exact file text');
  if (Object.hasOwn(value, 'generated')) {
    const generated = object(value.generated, `${path}.generated`);
    const generatedId = field(generated, 'fileId', `${path}.generated`);
    existing(files, generatedId, `${path}.generated.fileId`);
    const generatedLine = integer(
      field(generated, 'line', `${path}.generated`),
      `${path}.generated.line`,
      1,
    );
    if (generatedLine > files.get(generatedId).lineCount)
      fail(path, 'generated source line beyond file');
  }
}

function validateSource(source, path) {
  object(source, path);
  const items = array(field(source, 'files', path), `${path}.files`);
  const files = new Map();
  items.forEach((file, i) => {
    const at = `${path}.files[${i}]`;
    object(file, at);
    const fileId = id(field(file, 'id', at), `${at}.id`);
    if (files.has(fileId)) fail(at, `duplicate source file ${fileId}`);
    str(field(file, 'path', at), `${at}.path`);
    const sourceText = str(field(file, 'text', at), `${at}.text`);
    const hint = field(file, 'languageHint', at);
    if (hint !== null) str(hint, `${at}.languageHint`);
    const spans = array(field(file, 'tokenSpans', at), `${at}.tokenSpans`);
    const ranges = [];
    spans.forEach((span, t) => {
      const where = `${at}.tokenSpans[${t}]`;
      object(span, where);
      const start = integer(
        field(span, 'startUtf16', where),
        `${where}.startUtf16`,
      );
      const end = integer(
        field(span, 'endUtf16', where),
        `${where}.endUtf16`,
        start + 1,
      );
      oneOf(field(span, 'kind', where), TOKEN_KINDS, `${where}.kind`);
      if (end > sourceText.length) fail(where, 'token end beyond UTF-16 text');
      for (const offset of [start, end]) {
        if (
          offset > 0 &&
          offset < sourceText.length &&
          sourceText.charCodeAt(offset - 1) >= 0xd800 &&
          sourceText.charCodeAt(offset - 1) <= 0xdbff &&
          sourceText.charCodeAt(offset) >= 0xdc00 &&
          sourceText.charCodeAt(offset) <= 0xdfff
        ) {
          fail(where, 'token boundary splits UTF-16 surrogate pair');
        }
      }
      ranges.push([start, end]);
    });
    ranges.sort((a, b) => a[0] - b[0]);
    for (let t = 1; t < ranges.length; t += 1) {
      if (ranges[t][0] < ranges[t - 1][1]) fail(at, 'overlapping token spans');
    }
    files.set(fileId, { lineCount: sourceText.split(/\r\n|\r|\n/).length });
  });
  return files;
}

function validateGraph(graph, files, receipts, path) {
  object(graph, path);
  const nodes = indexed(field(graph, 'nodes', path), `${path}.nodes`);
  const edges = indexed(field(graph, 'edges', path), `${path}.edges`);
  const groups = indexed(field(graph, 'groups', path), `${path}.groups`);
  const graphIds = new Map();
  for (const [kind, records] of [
    ['nodes', nodes],
    ['edges', edges],
    ['groups', groups],
  ]) {
    for (const graphId of records.keys()) {
      const previousKind = graphIds.get(graphId);
      if (previousKind) {
        fail(
          `${path}.${kind}(${graphId})`,
          `duplicate graph ID ${graphId} across ${previousKind} and ${kind}`,
        );
      }
      graphIds.set(graphId, kind);
    }
  }
  const events = new Map();
  for (const [nodeId, node] of nodes) {
    const at = `${path}.nodes(${nodeId})`;
    oneOf(field(node, 'kind', at), NODE_KINDS, `${at}.kind`);
    str(field(node, 'label', at), `${at}.label`);
    integer(field(node, 'order', at), `${at}.order`);
    id(field(node, 'callId', at), `${at}.callId`);
    id(field(node, 'taskId', at), `${at}.taskId`);
    ids(field(node, 'eventIds', at), `${at}.eventIds`);
    for (const eventId of node.eventIds) {
      if (events.has(eventId)) fail(at, `duplicate event ID ${eventId}`);
      events.set(eventId, node);
    }
    ids(field(node, 'groupPathIds', at), `${at}.groupPathIds`);
    sourceRef(field(node, 'sourceRef', at), files, `${at}.sourceRef`);
    certainty(field(node, 'certainty', at), `${at}.certainty`);
    evidence(field(node, 'evidenceIds', at), receipts, `${at}.evidenceIds`);
    const note = field(node, 'note', at);
    if (note !== null) str(note, `${at}.note`);
    if (node.sourceRef === null && (!note || note.trim().length === 0)) {
      fail(at, 'missing source requires explicit uncertainty note');
    }
  }
  for (const [groupId, group] of groups) {
    const at = `${path}.groups(${groupId})`;
    oneOf(field(group, 'kind', at), GROUP_KINDS, `${at}.kind`);
    str(field(group, 'label', at), `${at}.label`);
    const parentId = field(group, 'parentGroupId', at);
    if (parentId !== null) {
      existing(groups, parentId, `${at}.parentGroupId`);
      const parent = groups.get(parentId);
      if (parent.callId !== group.callId || parent.taskId !== group.taskId)
        fail(at, 'group differs from parent call/task');
    }
    integer(field(group, 'order', at), `${at}.order`);
    id(field(group, 'callId', at), `${at}.callId`);
    id(field(group, 'taskId', at), `${at}.taskId`);
    ids(field(group, 'memberNodeIds', at), `${at}.memberNodeIds`);
    const arm = field(group, 'arm', at);
    if (arm !== null) {
      if (group.kind !== 'branch' && group.kind !== 'case')
        fail(at, 'arm only allowed on branch/case');
      object(arm, `${at}.arm`);
      id(field(arm, 'id', `${at}.arm`), `${at}.arm.id`);
      str(field(arm, 'label', `${at}.arm`), `${at}.arm.label`);
    }
    const iteration = field(group, 'iteration', at);
    if (group.kind === 'iteration') integer(iteration, `${at}.iteration`, 1);
    else if (iteration !== null)
      fail(at, 'iteration index only allowed on iteration groups');
    sourceRef(field(group, 'sourceRef', at), files, `${at}.sourceRef`);
    certainty(field(group, 'certainty', at), `${at}.certainty`);
    evidence(field(group, 'evidenceIds', at), receipts, `${at}.evidenceIds`);
  }
  const acyclic = new Set();
  for (const groupId of groups.keys()) {
    const walking = new Set();
    let current = groupId;
    while (current !== null && !acyclic.has(current)) {
      if (walking.has(current))
        fail(path, `cyclic group ancestry at ${current}`);
      walking.add(current);
      current = groups.get(current).parentGroupId;
    }
    for (const visited of walking) acyclic.add(visited);
  }
  const directOwners = new Map();
  for (const [groupId, group] of groups) {
    for (const memberId of group.memberNodeIds) {
      existing(nodes, memberId, `${path}.groups(${groupId}).memberNodeIds`);
      if (directOwners.has(memberId))
        fail(path, `node ${memberId} has conflicting direct group membership`);
      directOwners.set(memberId, groupId);
      const member = nodes.get(memberId);
      if (member.callId !== group.callId || member.taskId !== group.taskId) {
        fail(path, `node ${memberId} differs from direct group call/task`);
      }
    }
  }
  for (const [nodeId, node] of nodes) {
    const ancestry = node.groupPathIds;
    const direct = directOwners.get(nodeId);
    if (
      (direct === undefined) !== (ancestry.length === 0) ||
      (ancestry.length && ancestry[ancestry.length - 1] !== direct)
    ) {
      fail(path, `node ${nodeId} has contradictory direct group membership`);
    }
    ancestry.forEach((groupId, i) => {
      existing(groups, groupId, `${path}.nodes(${nodeId}).groupPathIds[${i}]`);
      if (
        groups.get(groupId).parentGroupId !== (i === 0 ? null : ancestry[i - 1])
      ) {
        fail(path, `node ${nodeId} has contradictory group ancestry`);
      }
    });
  }
  for (const [edgeId, edge] of edges) {
    const at = `${path}.edges(${edgeId})`;
    existing(nodes, field(edge, 'fromNodeId', at), `${at}.fromNodeId`);
    existing(nodes, field(edge, 'toNodeId', at), `${at}.toNodeId`);
    oneOf(field(edge, 'kind', at), EDGE_KINDS, `${at}.kind`);
    str(field(edge, 'label', at), `${at}.label`);
    certainty(field(edge, 'certainty', at), `${at}.certainty`);
    evidence(field(edge, 'evidenceIds', at), receipts, `${at}.evidenceIds`);
    oneOf(
      field(edge, 'executionStatus', at),
      EXECUTION_STATUS,
      `${at}.executionStatus`,
    );
    const fromCallId = nodes.get(edge.fromNodeId).callId;
    const toCallId = nodes.get(edge.toNodeId).callId;
    const transfer = field(edge, 'callTransition', at);
    if (transfer !== null) {
      object(transfer, `${at}.callTransition`);
      if (edge.kind !== 'call' && edge.kind !== 'return')
        fail(at, 'unexpected call transition');
      if (
        field(transfer, 'fromCallId', `${at}.callTransition`) !== fromCallId ||
        field(transfer, 'toCallId', `${at}.callTransition`) !== toCallId
      ) {
        fail(at, 'call transition does not match endpoint ownership');
      }
    }
    if (fromCallId !== toCallId && transfer === null) {
      fail(
        at,
        'cross-invocation edge requires an explicit call/return transition',
      );
    }
  }
  return { nodes, edges, groups, events };
}

function validatePlayback(playback, graph, files, path) {
  object(playback, path);
  const frames = array(field(playback, 'frames', path), `${path}.frames`);
  const frameIds = new Set();
  const frameEvents = new Set();
  const values = indexed(
    field(playback, 'valueSnapshots', path),
    `${path}.valueSnapshots`,
  );
  const stacks = indexed(
    field(playback, 'stackSnapshots', path),
    `${path}.stackSnapshots`,
  );
  const consoles = indexed(
    field(playback, 'consoleEntries', path),
    `${path}.consoleEntries`,
  );
  const invocations = indexed(
    field(playback, 'invocations', path),
    `${path}.invocations`,
    (item) => item.callId,
  );
  const visitRecords = array(
    field(playback, 'sourceVisits', path),
    `${path}.sourceVisits`,
  );
  const navigation = array(
    field(playback, 'navigationByCursor', path),
    `${path}.navigationByCursor`,
  );

  for (const [snapshotId, snapshot] of values) {
    const at = `${path}.valueSnapshots(${snapshotId})`;
    object(field(snapshot, 'variables', at), `${at}.variables`);
    object(field(snapshot, 'objects', at), `${at}.objects`);
    // Optional result is already checked for JSON-only values by detach().
  }
  for (const [snapshotId, snapshot] of stacks) {
    const at = `${path}.stackSnapshots(${snapshotId})`;
    array(field(snapshot, 'frames', at), `${at}.frames`).forEach((entry, i) => {
      const where = `${at}.frames[${i}]`;
      object(entry, where);
      existing(invocations, field(entry, 'callId', where), `${where}.callId`);
      str(field(entry, 'label', where), `${where}.label`);
    });
  }
  const consoleItems = array(playback.consoleEntries, `${path}.consoleEntries`);
  consoleItems.forEach((entry, i) => {
    const at = `${path}.consoleEntries[${i}]`;
    str(field(entry, 'text', at), `${at}.text`);
    certainty(field(entry, 'certainty', at), `${at}.certainty`);
    const step = integer(field(entry, 'sourceStep', at), `${at}.sourceStep`, 1);
    if (step > frames.length) fail(at, 'console sourceStep outside frames');
  });
  const initial = object(field(playback, 'initial', path), `${path}.initial`);
  existing(
    values,
    field(initial, 'valueSnapshotId', `${path}.initial`),
    `${path}.initial.valueSnapshotId`,
  );
  existing(
    stacks,
    field(initial, 'stackSnapshotId', `${path}.initial`),
    `${path}.initial.stackSnapshotId`,
  );
  const initialConsole = integer(
    field(initial, 'consoleThrough', `${path}.initial`),
    `${path}.initial.consoleThrough`,
  );
  if (initialConsole > consoleItems.length)
    fail(`${path}.initial`, 'consoleThrough exceeds prepared console entries');

  let lastConsoleThrough = initialConsole;
  frames.forEach((frame, i) => {
    const at = `${path}.frames[${i}]`;
    object(frame, at);
    const frameId = id(field(frame, 'id', at), `${at}.id`);
    if (frameIds.has(frameId)) fail(at, `duplicate frame ID ${frameId}`);
    frameIds.add(frameId);
    if (integer(field(frame, 'step', at), `${at}.step`, 1) !== i + 1)
      fail(at, 'frame steps must be consecutive 1..N');
    const eventId = field(frame, 'eventId', at);
    existing(graph.events, eventId, `${at}.eventId`);
    if (frameEvents.has(eventId))
      fail(at, `repeated playback event ID ${eventId}`);
    frameEvents.add(eventId);
    const owner = graph.events.get(eventId);
    ids(field(frame, 'activeNodeIds', at), `${at}.activeNodeIds`);
    frame.activeNodeIds.forEach((key, n) =>
      existing(graph.nodes, key, `${at}.activeNodeIds[${n}]`),
    );
    ids(field(frame, 'activeEdgeIds', at), `${at}.activeEdgeIds`);
    frame.activeEdgeIds.forEach((key, n) =>
      existing(graph.edges, key, `${at}.activeEdgeIds[${n}]`),
    );
    const callId = field(frame, 'callId', at);
    existing(invocations, callId, `${at}.callId`);
    if (
      callId !== owner.callId ||
      field(frame, 'taskId', at) !== owner.taskId
    ) {
      fail(at, 'frame event invocation/task differs from owning node');
    }
    sourceRef(field(frame, 'sourceRef', at), files, `${at}.sourceRef`);
    existing(
      values,
      field(frame, 'valueSnapshotId', at),
      `${at}.valueSnapshotId`,
    );
    existing(
      stacks,
      field(frame, 'stackSnapshotId', at),
      `${at}.stackSnapshotId`,
    );
    const through = integer(
      field(frame, 'consoleThrough', at),
      `${at}.consoleThrough`,
    );
    if (through < lastConsoleThrough || through > consoleItems.length)
      fail(at, 'consoleThrough must be monotonic and within prepared entries');
    lastConsoleThrough = through;
  });
  const stepsByCall = new Map();
  for (const [callId, invocation] of invocations) {
    const at = `${path}.invocations(${callId})`;
    id(field(invocation, 'symbolId', at), `${at}.symbolId`);
    const parent = field(invocation, 'parentCallId', at);
    if (parent !== null) existing(invocations, parent, `${at}.parentCallId`);
    const entryStep = integer(
      field(invocation, 'entryStep', at),
      `${at}.entryStep`,
      1,
    );
    const steps = array(field(invocation, 'stepIds', at), `${at}.stepIds`);
    let prev = 0;
    steps.forEach((step, i) => {
      integer(step, `${at}.stepIds[${i}]`, 1);
      if (
        step <= prev ||
        step > frames.length ||
        frames[step - 1].callId !== callId
      ) {
        fail(
          at,
          'invocation step references must increase and own their frames',
        );
      }
      prev = step;
    });
    if (!steps.length || steps[0] !== entryStep)
      fail(at, 'entryStep must match first invocation step');
    stepsByCall.set(callId, new Set(steps));
  }
  const acyclicCalls = new Set();
  for (const callId of invocations.keys()) {
    const visited = new Set();
    let current = callId;
    while (current !== null && !acyclicCalls.has(current)) {
      if (visited.has(current))
        fail(path, `cyclic invocation ancestry at ${current}`);
      visited.add(current);
      current = invocations.get(current).parentCallId;
    }
    for (const resolved of visited) acyclicCalls.add(resolved);
  }
  frames.forEach((frame, i) => {
    if (!stepsByCall.get(frame.callId).has(i + 1)) {
      fail(path, `frame ${frame.id} omitted from owning invocation steps`);
    }
  });
  const visitKeys = new Set();
  const coveredVisitSteps = new Set();
  visitRecords.forEach((visit, i) => {
    const at = `${path}.sourceVisits[${i}]`;
    object(visit, at);
    const fileId = field(visit, 'fileId', at);
    existing(files, fileId, `${at}.fileId`);
    const line = integer(field(visit, 'line', at), `${at}.line`, 1);
    if (line > files.get(fileId).lineCount)
      fail(at, 'Visit line outside source');
    const callId = field(visit, 'callId', at);
    if (callId !== null) existing(invocations, callId, `${at}.callId`);
    const visitKey = JSON.stringify([fileId, line, callId]);
    if (visitKeys.has(visitKey)) fail(at, 'duplicate source Visit grouping');
    visitKeys.add(visitKey);
    const steps = array(field(visit, 'stepIds', at), `${at}.stepIds`);
    let previous = 0;
    steps.forEach((step, s) => {
      integer(step, `${at}.stepIds[${s}]`, 1);
      if (step <= previous || step > frames.length)
        fail(at, 'Visit steps must be increasing 1-based cursors');
      const frame = frames[step - 1];
      if (
        !frame.sourceRef ||
        frame.sourceRef.fileId !== fileId ||
        line < frame.sourceRef.line ||
        line > frame.sourceRef.endLine ||
        (callId !== null && callId !== frame.callId)
      ) {
        fail(
          at,
          `Visit step ${step} does not match its frame source/invocation`,
        );
      }
      coveredVisitSteps.add(step);
      previous = step;
    });
  });
  frames.forEach((frame, i) => {
    if (frame.sourceRef !== null && !coveredVisitSteps.has(i + 1)) {
      fail(path, `sourced frame ${frame.id} has no matching prepared Visit`);
    }
  });
  if (navigation.length !== frames.length + 1)
    fail(path, 'navigation must cover cursors 0..N');
  navigation.forEach((entry, cursor) => {
    const at = `${path}.navigationByCursor[${cursor}]`;
    object(entry, at);
    if (
      Object.keys(entry).length !== NAV_KEYS.length + 1 ||
      Object.keys(entry).some(
        (key) => key !== 'cursor' && !NAV_KEYS.includes(key),
      )
    ) {
      fail(at, 'navigation entry permits exactly cursor and five targets');
    }
    if (field(entry, 'cursor', at) !== cursor)
      fail(at, 'cursor index mismatch');
    for (const key of NAV_KEYS) {
      const target = field(entry, key, at);
      if (target !== null) {
        integer(target, `${at}.${key}`);
        if (target > frames.length)
          fail(at, 'cursor target outside prepared frames');
        if (
          ['intoCursor', 'overCursor', 'outCursor'].includes(key) &&
          target <= cursor
        ) {
          fail(at, 'semantic navigation target must move forward');
        }
      }
    }
    const previous = cursor === 0 ? null : cursor - 1;
    const next = cursor === frames.length ? null : cursor + 1;
    if (entry.previousCursor !== previous || entry.nextCursor !== next)
      fail(at, 'previous/next target mismatch');
    if (cursor === 0) {
      if (
        entry.intoCursor !== next ||
        entry.overCursor !== next ||
        entry.outCursor !== null
      ) {
        fail(at, 'before-first step navigation mismatch');
      }
    } else if (
      cursor === frames.length &&
      (entry.intoCursor !== null ||
        entry.overCursor !== null ||
        entry.outCursor !== null)
    ) {
      fail(at, 'terminal cursor must disable moving actions');
    }
  });
}

function validateReady(variant, path) {
  object(variant, path);
  if (field(variant, 'availability', path) !== 'ready')
    fail(path, 'expected ready variant');
  const artifact = object(field(variant, 'artifact', path), `${path}.artifact`);
  for (const key of [
    'id',
    'sessionId',
    'revision',
    'sourceHash',
    'projectRoot',
    'target',
  ]) {
    id(field(artifact, key, `${path}.artifact`), `${path}.artifact.${key}`);
  }
  const createdAt = str(
    field(artifact, 'createdAt', `${path}.artifact`),
    `${path}.artifact.createdAt`,
  );
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+00:00)$/.test(
      createdAt,
    ) ||
    !Number.isFinite(Date.parse(createdAt)) ||
    new Date(createdAt).toISOString().slice(0, 19) !== createdAt.slice(0, 19)
  )
    fail(`${path}.artifact.createdAt`, 'expected UTC ISO-8601 timestamp');
  if (field(artifact, 'producer', `${path}.artifact`) !== 'code-anime-mcp')
    fail(path, 'invalid producer');
  const scenario = object(field(variant, 'scenario', path), `${path}.scenario`);
  for (const key of ['entrypoint', 'description', 'mockInputLabel']) {
    str(field(scenario, key, `${path}.scenario`), `${path}.scenario.${key}`);
  }
  const provenance = object(
    field(variant, 'provenance', path),
    `${path}.provenance`,
  );
  if (
    field(provenance, 'provider', `${path}.provenance`) !== 'codegraph' ||
    field(provenance, 'simulationMode', `${path}.provenance`) !== 'ai-mock'
  )
    fail(path, 'invalid provenance mode');
  const receipts = indexed(
    field(provenance, 'receipts', `${path}.provenance`),
    `${path}.provenance.receipts`,
  );
  for (const [receiptId, receipt] of receipts) {
    const at = `${path}.provenance.receipts(${receiptId})`;
    str(field(receipt, 'tool', at), `${at}.tool`);
    str(field(receipt, 'queryDigest', at), `${at}.queryDigest`);
    if (Object.hasOwn(receipt, 'providerBoundary'))
      str(receipt.providerBoundary, `${at}.providerBoundary`);
  }
  const status = object(field(variant, 'status', path), `${path}.status`);
  bool(field(status, 'complete', `${path}.status`), `${path}.status.complete`);
  bool(
    field(status, 'truncated', `${path}.status`),
    `${path}.status.truncated`,
  );
  const coverage = object(
    field(status, 'coverage', `${path}.status`),
    `${path}.status.coverage`,
  );
  oneOf(
    field(coverage, 'status', `${path}.status.coverage`),
    COVERAGE,
    `${path}.status.coverage.status`,
  );
  stringArray(
    field(coverage, 'reasons', `${path}.status.coverage`),
    `${path}.status.coverage.reasons`,
  );
  stringArray(
    field(status, 'warnings', `${path}.status`),
    `${path}.status.warnings`,
  );
  stringArray(
    field(status, 'diagnostics', `${path}.status`),
    `${path}.status.diagnostics`,
  );
  const files = validateSource(
    field(variant, 'source', path),
    `${path}.source`,
  );
  const graph = validateGraph(
    field(variant, 'graph', path),
    files,
    receipts,
    `${path}.graph`,
  );
  validatePlayback(
    field(variant, 'playback', path),
    graph,
    files,
    `${path}.playback`,
  );
}

/** Validate and detach every ready variant atomically, or throw INVALID_ARTIFACT. */
export function validateFlowSceneDocument(raw) {
  let document;
  try {
    document = detach(
      typeof raw === 'string' ? JSON.parse(raw) : raw,
      '$',
      new WeakSet(),
    );
  } catch (error) {
    if (error?.code === 'INVALID_ARTIFACT') throw error;
    fail('$', 'cannot parse or safely copy JSON input');
  }
  object(document, '$');
  if (field(document, 'schemaVersion', '$') !== '3.0.0')
    fail('$.schemaVersion', 'unsupported schema version');
  const comparison = object(field(document, 'comparison', '$'), '$.comparison');
  const variants = object(
    field(document, 'variantsById', '$'),
    '$.variantsById',
  );
  if (
    !Object.hasOwn(variants, 'proposed') ||
    Object.keys(variants).some(
      (key) => key !== 'proposed' && key !== 'baseline',
    )
  ) {
    fail(
      '$.variantsById',
      'requires proposed and permits only optional baseline',
    );
  }
  const requested = array(
    field(comparison, 'variantOrder', '$.comparison'),
    '$.comparison.variantOrder',
  );
  ids(requested, '$.comparison.variantOrder');
  if (
    requested.length !== Object.keys(variants).length ||
    requested.some((key) => !Object.hasOwn(variants, key))
  ) {
    fail(
      '$.comparison.variantOrder',
      'must list every present variant exactly once',
    );
  }
  const defaultId = id(
    field(comparison, 'defaultVariantId', '$.comparison'),
    '$.comparison.defaultVariantId',
  );
  if (!Object.hasOwn(variants, defaultId))
    fail('$.comparison', 'default variant missing');
  validateReady(variants.proposed, '$.variantsById.proposed');
  if (Object.hasOwn(variants, 'baseline')) {
    const baseline = object(variants.baseline, '$.variantsById.baseline');
    const availability = field(
      baseline,
      'availability',
      '$.variantsById.baseline',
    );
    if (availability === 'unavailable') {
      if (
        Object.keys(baseline).length !== 2 ||
        !Object.hasOwn(baseline, 'reason')
      ) {
        fail(
          '$.variantsById.baseline',
          'unavailable baseline permits exactly availability and reason',
        );
      }
      str(baseline.reason, '$.variantsById.baseline.reason', true);
    } else if (availability === 'ready') {
      validateReady(baseline, '$.variantsById.baseline');
      for (const key of ['projectRoot', 'target']) {
        if (baseline.artifact[key] !== variants.proposed.artifact[key]) {
          fail(
            '$.variantsById.baseline.artifact',
            `${key} must match proposed variant`,
          );
        }
      }
    } else
      fail('$.variantsById.baseline.availability', 'unsupported availability');
  }
  if (variants[defaultId].availability !== 'ready')
    fail('$.comparison.defaultVariantId', 'default must be ready');
  return document;
}

/** Return one ready variant, the declared unavailable baseline, or null for an omitted baseline. */
export function selectReadyVariant(document, variantId) {
  if (typeof variantId !== 'string') fail('$.comparison', 'unknown variant');
  if (
    variantId === 'baseline' &&
    !Object.hasOwn(document.variantsById, 'baseline')
  )
    return null;
  if (!Object.hasOwn(document.variantsById, variantId))
    fail('$.comparison', 'unknown variant');
  return document.variantsById[variantId];
}
