// Match a call with its adjacent entry only when ancestry and async context
// agree. Neighboring events can otherwise belong to unrelated tasks.
function matchedEntry(call, entry) {
  if (
    call?.kind !== 'call' ||
    entry?.kind !== 'enter' ||
    !(entry.parentCallId === call.callId || entry.stack?.at(-2) === call.callId)
  )
    return false;
  const task = (item) =>
    item.values?.task ?? item.values?.taskId ?? item.taskId;
  const thread = (item) => item.values?.thread ?? item.thread;
  return task(call) === task(entry) && thread(call) === thread(entry);
}

// Extract the user-visible transitions once from prepared events. Statement
// snapshots stay in the detailed replay; they are not part of this overview.
export function buildFlowOverview(events = []) {
  const invocations = new Map();
  const invocationDepth = new Map();
  const invocationParents = new Map();
  const transitions = [];
  for (const [offset, event] of events.entries()) {
    if (!event) continue;
    if (!['enter', 'call', 'return', 'console', 'throw'].includes(event.kind))
      continue;
    // Recorded returns may be emitted before or after the callee leaves its
    // stack. In either case the current invocation cannot be its own parent.
    const stack = event.stack ?? [];
    const parentId =
      event.parentCallId ??
      (stack.at(-1) === event.callId ? stack.at(-2) : stack.at(-1)) ??
      invocationParents.get(event.callId);
    if (event.kind === 'enter') {
      invocations.set(event.callId, event.symbolId);
      if (parentId && parentId !== event.callId)
        invocationParents.set(event.callId, parentId);
      invocationDepth.set(
        event.callId,
        stack.includes(event.callId)
          ? stack.indexOf(event.callId)
          : parentId
            ? (invocationDepth.get(parentId) ?? 0) + 1
            : 0,
      );
    }
    const parent =
      parentId === event.callId ? undefined : invocations.get(parentId);
    if (event.kind === 'console' && event.output === undefined) continue;
    // Paired call and enter events are one high-level transition. The row
    // becomes active on the call-site line; selecting it seeks to the callee.
    if (matchedEntry(event, events[offset + 1])) continue;
    const callSite =
      event.kind === 'enter' && matchedEntry(events[offset - 1], event)
        ? events[offset - 1]
        : undefined;
    const previous = transitions.at(-1);
    // Python print and many streams emit text and a newline separately.
    // Combine only consecutive writes from the same invocation and stream.
    if (
      event.kind === 'console' &&
      previous?.kind === 'console' &&
      previous.callId === event.callId &&
      previous.stream === event.values?.stream &&
      previous.index === offset &&
      previous.taskId ===
        (event.values?.task ?? event.values?.taskId ?? event.taskId) &&
      previous.thread === (event.values?.thread ?? event.thread)
    ) {
      previous.output += event.output;
      previous.index = offset + 1;
      continue;
    }
    transitions.push({
      startIndex: offset + (callSite ? 0 : 1),
      index: offset + 1,
      kind: event.kind,
      callId: event.callId,
      symbol: event.symbolId,
      parent,
      depth: invocationDepth.get(event.callId) ?? Math.max(0, stack.length - 1),
      inputs: event.inputs ?? callSite?.inputs,
      target: event.values?.to,
      result: event.result,
      hasResult: Object.hasOwn(event, 'result'),
      output: event.output,
      stream: event.values?.stream,
      taskId: event.values?.task ?? event.values?.taskId ?? event.taskId,
      thread: event.values?.thread ?? event.thread,
      certainty: event.certainty,
      source: event.source,
      label: event.label,
    });
  }
  return transitions;
}

// Keep summaries small even for a trace with large nested values. Inspection
// of the actual value is available in the synchronized runtime inspector.
function briefValue(value) {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value).length} fields}`;
  const valueString = JSON.stringify(value);
  return valueString === undefined
    ? 'unknown'
    : valueString.length > 72
      ? valueString.slice(0, 69) + '…'
      : valueString;
}

export function describeFlowTransition(item) {
  const args =
    item.inputs && Object.keys(item.inputs).length
      ? '(' +
        Object.entries(item.inputs)
          .slice(0, 3)
          .map(([name, value]) => `${name}=${briefValue(value)}`)
          .join(', ') +
        (Object.keys(item.inputs).length > 3 ? ', …' : '') +
        ')'
      : '()';
  const symbol = item.symbol ?? 'Unknown symbol';
  switch (item.kind) {
    case 'enter':
      return item.parent
        ? `${item.parent} → ${symbol}${args}`
        : `Enter ${symbol}${args}`;
    case 'call':
      return item.target
        ? `${item.symbol ?? 'Caller'} → call ${item.target}${args}`
        : `Call ${symbol}${args}`;
    case 'return':
      return `${symbol} → ${item.hasResult ? briefValue(item.result) : 'return'}${item.parent ? ' → ' + item.parent : ''}`;
    case 'console':
      return `${symbol} → ${item.stream === 'stderr' ? 'stderr' : 'output'} ${briefValue(item.output)}`;
    case 'throw':
      return `${symbol} → exception: ${item.label ?? 'unresolved'}`;
    default:
      return item.label ?? symbol;
  }
}
