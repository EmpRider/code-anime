import { buildMethodGroups } from './flow-overview.js';

// All indices are shared replay cursors: zero is Ready, events start at one.
export function createDrilldown(events = [], sourceFiles = {}) {
  const entered = new Set(
    events
      .filter((event) => event.kind === 'enter')
      .map((event) => event.callId),
  );
  // Partial traces still have inspectable frames; grouping does not invent an entry event.
  const entries = buildMethodGroups(
    events.map((event) => {
      if (entered.has(event.callId)) return event;
      entered.add(event.callId);
      return { ...event, kind: 'enter' };
    }),
  ).invocations;
  const byId = new Map(entries.map((entry) => [entry.callId, entry]));
  const byOwner = new Map();
  const byCall = new Map();
  const owners = events.map((event) => byId.get(event.callId)?.className);
  const methodCards = new Map();
  const sourceLines = new Map();
  const ownerEvidence = new Map();
  for (const entry of entries) {
    const event = events[entry.index - 1];
    const card = {
      id: `method:${entry.callId}`,
      kind: 'method',
      index: entry.index,
      label: entry.methodName,
      symbol: entry.symbol,
      callId: entry.callId,
      owner: entry.className,
      source: event?.source,
      certainty: event?.certainty,
      event,
    };
    methodCards.set(entry.callId, card);
    if (!byOwner.has(entry.className)) byOwner.set(entry.className, []);
    byOwner.get(entry.className).push(card);
    byCall.set(entry.callId, []);
  }
  for (const [offset, event] of events.entries()) {
    const index = offset + 1;
    const own = byCall.get(event.callId);
    const source = event.source;
    if (
      source &&
      Object.hasOwn(sourceFiles, source.file) &&
      !sourceLines.has(source.file)
    )
      sourceLines.set(source.file, sourceFiles[source.file].split(/\r?\n/));
    const code = sourceLines.get(source?.file)?.[source.line - 1];
    const owner = owners[offset];
    if (!ownerEvidence.has(owner)) ownerEvidence.set(owner, new Set());
    ownerEvidence.get(owner).add(event.certainty ?? 'unverified');
    own?.push({
      id: `step:${index}`,
      kind: 'step',
      index,
      label: code?.trim() || event.label,
      symbol: event.symbolId,
      callId: event.callId,
      source,
      certainty: event.certainty,
      event,
      code,
    });
    const method = methodCards.get(event.callId);
    if (method?.index === index) {
      const parent = byId.get(event.callId)?.parentCallId;
      if (method && parent !== event.callId) byCall.get(parent)?.push(method);
    }
  }
  const classes = [...byOwner].map(([owner, methods]) => ({
    id: `class:${owner}`,
    kind: 'class',
    owner,
    label: owner,
    symbol: owner,
    index: methods[0].index,
    certainty: [...ownerEvidence.get(owner)].join(' / '),
    count: methods.length,
  }));
  // Keep replay untouched; only verified bookkeeping disappears from the diagram.
  const pairedCalls = new Set(
    entries.map((entry) => entry.callSiteIndex).filter(Boolean),
  );
  const flowSteps = new Map(
    [...byCall].map(([id, cards]) => [
      id,
      cards.filter(
        (card) =>
          card.kind === 'method' ||
          card.certainty === 'unresolved' ||
          (card.event.kind !== 'enter' && !pairedCalls.has(card.index)),
      ),
    ]),
  );
  const descendantCache = new Map();
  function descendant(callId, parentId) {
    const key = JSON.stringify([callId, parentId]);
    if (descendantCache.has(key)) return descendantCache.get(key);
    const seen = new Set();
    let id = callId;
    while (id && !seen.has(id) && id !== parentId) {
      seen.add(id);
      id = byId.get(id)?.parentCallId;
    }
    const result = id === parentId;
    descendantCache.set(key, result);
    return result;
  }
  const stopsCache = new Map();
  function stops(scope) {
    const key = JSON.stringify(scope);
    if (stopsCache.has(key)) return stopsCache.get(key);
    const indices = [0];
    for (const [offset, event] of events.entries()) {
      let visible = true;
      if (scope?.kind === 'classes')
        visible = offset === 0 || owners[offset] !== owners[offset - 1];
      else if (scope?.kind === 'class')
        visible = offset === 0 || event.callId !== events[offset - 1].callId;
      else if (scope?.kind === 'method')
        visible =
          event.callId === scope.id ||
          !descendant(event.callId, scope.id) ||
          (methodCards.get(event.callId)?.index === offset + 1 &&
            byId.get(event.callId)?.parentCallId === scope.id);
      if (visible || offset === events.length - 1) indices.push(offset + 1);
    }
    stopsCache.set(key, indices);
    return indices;
  }
  function move(cursor, scope, direction) {
    if (!scope) return Math.max(0, Math.min(events.length, cursor + direction));
    const indices = stops(scope);
    let low = 0,
      high = indices.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (
        indices[middle] < cursor ||
        (direction > 0 && indices[middle] === cursor)
      )
        low = middle + 1;
      else high = middle;
    }
    return direction > 0
      ? (indices[low] ?? events.length)
      : (indices[low - 1] ?? 0);
  }
  return {
    classes,
    methods: (owner) => byOwner.get(owner) ?? [],
    steps: (id) => byCall.get(id) ?? [],
    flowSteps: (id) => flowSteps.get(id) ?? [],
    owner: (id) => byId.get(id)?.className,
    contains: descendant,
    next: (cursor, scope) => move(cursor, scope, 1),
    previous: (cursor, scope) => move(cursor, scope, -1),
  };
}
