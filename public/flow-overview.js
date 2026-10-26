import {
  plainTerminalText,
  preparePlainTerminalOutput,
} from './terminal-text.js';

// Prepared trace events may include the entering invocation or only its
// callers. All views must agree on parent attribution.
export function parentInvocationId(event) {
  const stack = event?.stack ?? [];
  const parent =
    event?.parentCallId ??
    (stack.at(-1) === event?.callId ? stack.at(-2) : stack.at(-1));
  return parent === event?.callId ? undefined : parent;
}

// Match a call with its adjacent entry only when ancestry and async context
// agree. Neighboring events can otherwise belong to unrelated tasks.
function matchedEntry(call, entry) {
  if (
    call?.kind !== 'call' ||
    entry?.kind !== 'enter' ||
    parentInvocationId(entry) !== call.callId
  )
    return false;
  const task = (item) =>
    item.values?.task ?? item.values?.taskId ?? item.taskId;
  const thread = (item) => item.values?.thread ?? item.thread;
  return task(call) === task(entry) && thread(call) === thread(entry);
}

// Extract the user-visible transitions once from prepared events. Statement
// snapshots stay in the detailed replay; they are not part of this overview.
export function buildFlowOverview(
  events = [],
  preparedOutput = preparePlainTerminalOutput(events),
) {
  const invocations = new Map();
  const invocationDepth = new Map();
  const invocationParents = new Map();
  const transitions = [];
  for (const [offset, event] of events.entries()) {
    if (!event) continue;
    if (
      ![
        'enter',
        'call',
        'return',
        'console',
        'throw',
        'await',
        'yield',
        'resume',
        'catch',
        'unresolved',
      ].includes(event.kind)
    )
      continue;
    // Prepared returns may be emitted before or after the callee leaves its
    // stack. In either case the current invocation cannot be its own parent.
    const stack = event.stack ?? [];
    // A simulated return or exception can carry the post-unwind stack, which
    // no longer contains the original caller. Preserve the parent established
    // at this invocation's entry for every later event in that invocation.
    // Explicit event ancestry remains authoritative when supplied.
    const parentId =
      event.parentCallId ??
      (event.kind === 'enter'
        ? parentInvocationId(event)
        : (invocationParents.get(event.callId) ?? parentInvocationId(event)));
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
    // Console mock events may provide text and a newline separately.
    // Combine fragments of one print statement, not unrelated writes from
    // subsequent lines. Without a source location the grouping is unknown.
    const sameSource =
      previous?.source &&
      event.source &&
      previous.source.file === event.source.file &&
      previous.source.line === event.source.line;
    if (
      event.kind === 'console' &&
      previous?.kind === 'console' &&
      previous.callId === event.callId &&
      previous.stream === event.values?.stream &&
      sameSource &&
      !/[\r\n]$/.test(previous.output) &&
      previous.index === offset &&
      previous.taskId ===
        (event.values?.task ?? event.values?.taskId ?? event.taskId) &&
      previous.thread === (event.values?.thread ?? event.thread)
    ) {
      previous.output += event.output;
      previous.display += preparedOutput[offset] ?? '';
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
      exception: event.values?.exception,
      output: event.output,
      display: preparedOutput[offset],
      stream: event.values?.stream,
      attribution: event.values?.attribution,
      taskId: event.values?.task ?? event.values?.taskId ?? event.taskId,
      thread: event.values?.thread ?? event.thread,
      certainty: event.certainty,
      source: event.source,
      label: event.label,
    });
  }
  return transitions;
}

// Build the compact method map only from actual entry events. A class label is
// a presentation grouping, not an assertion that an instance was constructed.
// Keep invocation IDs and ancestry: two calls to the same method are not one
// execution, and interleaved async tasks do not form a sequential call chain.
export function buildMethodGroups(events = []) {
  const entries = new Map();
  const invocations = [];
  for (const [offset, event] of events.entries()) {
    if (event?.kind !== 'enter' || !event.callId || entries.has(event.callId))
      continue;
    const symbol = event.symbolId ?? 'Unknown symbol';
    // CodeGraph-qualified symbols may contain the relative source file:
    // `module.py:Worker.run` or `main.cjs:add`. Split that provenance before
    // looking for class/method delimiters; the dot in `.py` is not a class.
    const sourceFile = event.source?.file;
    const inferredFile =
      sourceFile && symbol.startsWith(`${sourceFile}:`)
        ? sourceFile
        : /^(.+\.[a-z0-9]{1,12}):(?=[^:])(.+)$/i.exec(symbol)?.[1];
    const qualified = inferredFile
      ? symbol.slice(inferredFile.length + 1)
      : symbol;
    const separator = Math.max(
      qualified.lastIndexOf('::'),
      qualified.lastIndexOf('.'),
    );
    const owner = separator >= 0 ? qualified.slice(0, separator) : '';
    const className = inferredFile
      ? owner
        ? `${owner} · ${inferredFile}`
        : inferredFile
      : owner || 'Functions';
    const methodName =
      separator >= 0
        ? qualified.slice(
            separator +
              (qualified.slice(separator, separator + 2) === '::' ? 2 : 1),
          )
        : qualified;
    // Some prepared events include the entering frame in `stack`; others report
    // only the frames that led to it. In the latter case the final frame is
    // the caller. Never infer a parent by dropping that final frame.
    const parentCallId = parentInvocationId(event);
    const entry = {
      callId: event.callId,
      symbol,
      className: className || 'Functions',
      methodName: methodName || symbol,
      parentCallId: parentCallId !== event.callId ? parentCallId : undefined,
      index: offset + 1,
      callSiteIndex: matchedEntry(events[offset - 1], event)
        ? offset
        : undefined,
      certainty: event.certainty ?? 'unverified',
    };
    entries.set(event.callId, entry);
    invocations.push(entry);
  }
  const groups = new Map();
  for (const invocation of invocations) {
    const parent = entries.get(invocation.parentCallId);
    const node = {
      ...invocation,
      parentSymbol: parent?.symbol,
      parentKnown: Boolean(parent),
    };
    if (!groups.has(node.className)) groups.set(node.className, []);
    groups.get(node.className).push(node);
  }
  return {
    invocations: invocations.map((entry) => ({
      ...entry,
      parentSymbol: entries.get(entry.parentCallId)?.symbol,
      parentKnown: entries.has(entry.parentCallId),
    })),
    classCount: groups.size,
  };
}

// Function identity excludes call sites; invocation records remain unchanged.
export function groupFunctionInvocations(invocations, events = []) {
  const functions = new Map();
  const byCall = new Map();
  for (const entry of invocations) {
    const file = events[entry.index - 1]?.source?.file ?? '';
    const symbol =
      file && entry.symbol.startsWith(file + ':')
        ? entry.symbol.slice(file.length + 1)
        : entry.symbol;
    const id = 'function:' + JSON.stringify([file, symbol]);
    if (!functions.has(id))
      functions.set(id, { id, symbol: entry.symbol, invocations: [] });
    functions.get(id).invocations.push(entry);
    byCall.set(entry.callId, id);
  }
  const relationships = invocations
    .filter((entry) => byCall.has(entry.parentCallId))
    .map((entry) => ({
      source: byCall.get(entry.parentCallId),
      target: byCall.get(entry.callId),
      callId: entry.callId,
      parentCallId: entry.parentCallId,
      index: entry.callSiteIndex ?? entry.index,
    }));
  return { functions: [...functions.values()], byCall, relationships };
}

// Keep summaries small even for a trace with large nested values. Inspection
// of the mock value is available in the synchronized step inspector.
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

// Runtime recorders can provide an observed exception type and native args.
// Keep the high-level view useful without expanding arbitrary saved objects.
function briefException(detail) {
  if (!detail || typeof detail !== 'object' || typeof detail.type !== 'string')
    return undefined;
  const kind = detail.type.trim();
  if (!kind) return undefined;
  const args = Array.isArray(detail.args) ? detail.args : [];
  if (!args.length) return kind;
  return `${kind}(${args.slice(0, 2).map(briefValue).join(', ')}${args.length > 2 ? ', …' : ''})`;
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
      if (item.attribution === 'unresolved' && !item.source)
        return `Process ${item.stream ?? 'output'} (source unresolved): ${briefValue(item.display ?? plainTerminalText(item.output))}`;
      return `${symbol} → ${item.stream === 'stderr' ? 'stderr' : 'output'} ${briefValue(item.display ?? plainTerminalText(item.output))}`;
    case 'throw':
      return `${symbol} → exception: ${briefException(item.result) ?? item.label ?? 'unresolved'}`;
    case 'await':
      return `${symbol} → suspended at await (result pending)`;
    case 'yield':
      return `${symbol} → yielded${item.hasResult ? ' ' + briefValue(item.result) : ' (value unavailable)'}`;
    case 'resume':
      return `${symbol} → resumed`;
    case 'catch': {
      const exception = briefException(item.exception);
      return `${symbol} → ${exception ? `caught ${exception}` : 'entered exception handler'}`;
    }
    case 'unresolved':
      return `${symbol} → exit unresolved (return/exception unverified)`;
    default:
      return item.label ?? symbol;
  }
}
