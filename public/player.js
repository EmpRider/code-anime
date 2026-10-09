import { replayState } from './replay.js';
const $ = (id) => document.getElementById(id);
let flow, originalFlow, timer, animation;
let cursor = 0;
const nodes = new Map();
const bookmarks = new Set();
const breakpoints = new Set();
const sourceBreakpoints = new Set();
const sourceLocationKey = (source) =>
  source ? source.file + ':' + source.line : undefined;
const hasBreakpoint = (index) =>
  breakpoints.has(index) ||
  sourceBreakpoints.has(
    sourceLocationKey(flow?.trace?.events[index - 1]?.source),
  );
const rows = [];
const invocations = new Map();
const expandedCalls = new Set();
let shownSource = '';
let shownFirstLine = 1;
let pinnedCallId;
let inspectedSourceEvent;
let lastConsoleText = '';
const sourceLines = new Map();
const consoleEvents = [];
let navigationVersion = 0;
const continuationStates = new WeakMap();
function registerFlow(value, id) {
  continuationStates.set(value, {
    tailId: id,
    loadedIds: new Set(id ? [id] : []),
    cursor: 0,
  });
  return value;
}
const text = (tag, value, className) => {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
};
const valueText = (value) =>
  value === undefined ? '∅' : JSON.stringify(value);
const changed = (event) =>
  ['assign', 'mutate', 'transform'].includes(event?.kind) ||
  (event?.before !== undefined &&
    valueText(event.before) !== valueText(event.after));
function fieldRows(parent, after, before, prefix = '') {
  for (const key of new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ])) {
    const next = after?.[key],
      prior = before?.[key];
    const path = prefix ? prefix + '.' + key : key;
    const sample = next ?? prior;
    if (
      sample &&
      typeof sample === 'object' &&
      (next === undefined || typeof next === 'object') &&
      (prior === undefined || typeof prior === 'object')
    ) {
      const child = document.createElement('details');
      child.className = 'object-fields';
      child.open = true;
      child.append(
        text('summary', path + (Array.isArray(sample) ? ' []' : ' {}')),
      );
      fieldRows(
        child,
        next ?? {},
        before === undefined ? undefined : (prior ?? {}),
        path,
      );
      if (Object.keys(sample).length === 0)
        child.append(text('span', valueText(sample), 'field'));
      parent.append(child);
    } else {
      const row = text('div', '', 'field');
      const isChanged =
        before !== undefined && valueText(prior) !== valueText(next);
      row.classList.toggle('changed', isChanged);
      row.append(text('span', path + ': ', 'field-key'));
      if (isChanged)
        row.append(
          text('span', valueText(prior), 'field-before'),
          text('span', ' → ', 'field-arrow'),
        );
      row.append(
        text(
          'span',
          valueText(next),
          isChanged ? 'field-after' : 'field-value',
        ),
      );
      parent.append(row);
    }
  }
}
function pause() {
  // Invalidate playback and any asynchronous navigation started earlier.
  navigationVersion++;
  clearTimeout(timer);
  timer = undefined;
  $('play').textContent = 'Play';
  $('play').dataset.playing = 'false';
}
function traceSteps(trace) {
  return trace.events.map((e, i) => ({
    from:
      e.values?.from ??
      (e.kind === 'enter'
        ? e.symbolId
        : (trace.events[i - 1]?.symbolId ?? e.symbolId)),
    to: e.values?.to ?? e.symbolId,
    dtoName: e.kind + ' · ' + e.label,
    dtoFields: e.after ?? e.values ?? {},
  }));
}
function buildNodes(preserveInspection = false) {
  nodes.clear();
  invocations.clear();
  if (!preserveInspection) {
    expandedCalls.clear();
    pinnedCallId = undefined;
    inspectedSourceEvent = undefined;
    shownSource = '';
    lastConsoleText = '';
  }
  sourceLines.clear();
  consoleEvents.length = 0;
  for (const event of flow.trace?.events ?? [])
    if (event.kind === 'enter') invocations.set(event.callId, event);
  flow.trace?.events.forEach((event, index) => {
    if (event.kind === 'console' && event.output !== undefined)
      consoleEvents.push({ index: index + 1, output: event.output });
    if (!event.source) return;
    const key = event.source.file + ':' + event.source.line;
    if (!sourceLines.has(key)) sourceLines.set(key, index + 1);
  });
  $('canvas').replaceChildren();
  const proposed = new Set(
    flow.trace?.events
      .filter((e) => e.certainty === 'proposed')
      .map((e) => e.symbolId),
  );
  for (const step of flow.steps)
    for (const name of [step.from, step.to]) {
      if (nodes.has(name)) continue;
      const node = text('div', '', 'node');
      node.append(
        text('span', 'SYMBOL', 'node-caption'),
        text('span', name, 'node-name'),
      );
      node.title = name;
      node.classList.toggle('proposed', proposed.has(name));
      nodes.set(name, node);
      $('canvas').append(node);
    }
  $('timeline').max = flow.steps.length;
  $('stat-events').textContent = flow.steps.length;
  $('stat-symbols').textContent = nodes.size;
  $('stat-changes').textContent =
    flow.trace?.events.filter(changed).length ?? '—';
  buildList();
}
const LIST_PAGE_SIZE = 150;
let listPage = 0;
let listCursor = -1;
let listSignature = '';
function createEventRow(index) {
  const { event, step } = rows[index];
  const container = text('div', '', 'event-item');
  const button = text('button', '', 'event-row');
  button.dataset.kind = event?.kind ?? 'flow';
  button.dataset.index = index + 1;
  button.append(
    text('span', String(index + 1).padStart(2, '0'), 'event-index'),
  );
  const description = text('span', '', 'event-description');
  const label = text('span', event?.label ?? step.dtoName, 'event-label');
  if (event?.kind === 'enter') {
    const disclosure = text('button', '▸', 'call-disclosure');
    disclosure.dataset.callId = event.callId;
    disclosure.setAttribute('aria-expanded', 'false');
    disclosure.setAttribute(
      'aria-label',
      'Expand ' + (event.label ?? event.symbolId),
    );
    disclosure.onclick = () => {
      expandedCalls.has(event.callId)
        ? expandedCalls.delete(event.callId)
        : expandedCalls.add(event.callId);
      filterList();
      // Filtering can replace this page. Keep keyboard focus on its disclosure.
      for (const control of $('event-list').querySelectorAll(
        '.call-disclosure',
      ))
        if (control.dataset.callId === event.callId)
          control.focus({ preventScroll: true });
    };
    container.append(disclosure);
  }
  description.append(label);
  const meta = text('span', '', 'event-meta');
  meta.append(text('span', event?.kind ?? 'flow', 'event-type'));
  if (event?.source) meta.append(text('span', 'L' + event.source.line));
  description.append(meta);
  button.append(description);
  button.onclick = () => seek(index + 1);
  button.ondblclick = () => toggleBreakpoint(index + 1);
  button.title = 'Select step. Double-click to toggle a playback breakpoint.';
  if (event?.stack?.length)
    button.style.setProperty(
      '--call-depth',
      String(Math.min(5, event.stack.length - 1)),
    );
  container.append(button);
  return container;
}
function buildList() {
  rows.length = 0;
  listSignature = '';
  flow.steps.forEach((step, index) => {
    const event = flow.trace?.events[index];
    rows.push({
      event,
      step,
      search: JSON.stringify([event, step]).toLowerCase(),
    });
  });
  filterList();
}
function filterList() {
  const query = $('search').value.trim().toLowerCase();
  const kind = $('kind-filter').value;
  const onlyBookmarks =
    $('bookmarks-only').getAttribute('aria-pressed') === 'true';
  const groups = {
    changes: ['assign', 'mutate', 'transform'],
    calls: ['enter', 'call', 'return', 'await', 'throw', 'catch'],
    control: ['branch', 'loop'],
  };
  const visible = [];
  rows.forEach(({ event, search }, i) => {
    const essential = [
      'enter',
      'call',
      'return',
      'console',
      'throw',
      'catch',
      'unresolved',
      'plan',
    ];
    const collapsed =
      event &&
      !essential.includes(event.kind) &&
      (!expandedCalls.has(event.callId) ||
        (invocations.get(event.callId)?.stack ?? []).some(
          (callId) => invocations.has(callId) && !expandedCalls.has(callId),
        ));
    const matches =
      kind === 'all' ||
      (kind === 'changes' && changed(event)) ||
      groups[kind]?.includes(event?.kind) ||
      (kind === 'uncertain' &&
        ['assumed', 'unresolved', 'proposed'].includes(event?.certainty));
    if (
      matches &&
      search.includes(query) &&
      (!onlyBookmarks || bookmarks.has(i + 1)) &&
      !(
        collapsed &&
        kind === 'all' &&
        !query &&
        !onlyBookmarks &&
        cursor !== i + 1
      )
    )
      visible.push(i);
  });
  if (listCursor !== cursor) {
    const active = visible.indexOf(cursor - 1);
    if (active >= 0) listPage = Math.floor(active / LIST_PAGE_SIZE);
    listCursor = cursor;
  }
  const pages = Math.max(1, Math.ceil(visible.length / LIST_PAGE_SIZE));
  listPage = Math.min(listPage, pages - 1);
  const page = visible.slice(
    listPage * LIST_PAGE_SIZE,
    (listPage + 1) * LIST_PAGE_SIZE,
  );
  const signature = [listPage, pages, ...page].join(',');
  if (signature !== listSignature) {
    const fragment = document.createDocumentFragment();
    if (pages > 1) {
      const navigation = text('nav', '', 'event-pages');
      navigation.setAttribute('aria-label', 'Execution event pages');
      for (const [label, delta] of [
        ['Previous events', -1],
        ['Next events', 1],
      ]) {
        const button = text('button', label);
        button.disabled = listPage + delta < 0 || listPage + delta >= pages;
        button.onclick = () => {
          listPage += delta;
          filterList();
        };
        navigation.append(button);
      }
      navigation.append(text('span', `${listPage + 1} / ${pages}`));
      fragment.append(navigation);
    }
    for (const index of page) fragment.append(createEventRow(index));
    $('event-list').replaceChildren(fragment);
    listSignature = signature;
  }
  for (const button of $('event-list').querySelectorAll('.event-row')) {
    const index = Number(button.dataset.index);
    button.classList.toggle('bookmarked', bookmarks.has(index));
    button.classList.toggle('breakpoint', hasBreakpoint(index));
    button.classList.toggle('current', cursor === index);
    if (cursor === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
  for (const disclosure of $('event-list').querySelectorAll(
    '.call-disclosure',
  )) {
    const event = invocations.get(disclosure.dataset.callId);
    const expanded = expandedCalls.has(disclosure.dataset.callId);
    disclosure.textContent = expanded ? '▾' : '▸';
    disclosure.setAttribute('aria-expanded', String(expanded));
    disclosure.setAttribute(
      'aria-label',
      (expanded ? 'Collapse ' : 'Expand ') + (event.label ?? event.symbolId),
    );
  }
  const count = visible.length;
  $('trace-count').textContent = count + ' / ' + rows.length;
  $('no-events').hidden = count > 0;
}
function inspectFrame(callId) {
  pinnedCallId = callId;
  $('follow').checked = false;
  render();
}
function activeFrame(state, event) {
  if (pinnedCallId && state.stack.includes(pinnedCallId)) return pinnedCallId;
  return state.stack.at(-1) ?? event?.callId;
}
function frameLocals(state, event) {
  const mapped = state.stack.some(
    (id) =>
      Object.hasOwn(state.locals, id) &&
      state.locals[id] !== null &&
      typeof state.locals[id] === 'object',
  );
  return mapped
    ? (state.locals[activeFrame(state, event)] ?? {})
    : state.locals;
}
// Compare recorded snapshots of the same invocation. A newly entered frame
// has no preceding state; switching frames must not look like a mutation.
function precedingFrameLocals(state, event, previousEvent) {
  if (!previousEvent?.locals || !event?.locals) return undefined;
  const frame = activeFrame(state, event);
  if (
    frame &&
    Object.hasOwn(event.locals, frame) &&
    Object.hasOwn(previousEvent.locals, frame)
  )
    return previousEvent.locals[frame];
  // Older agent traces store one flat locals object per event.
  if (
    state.stack.length &&
    previousEvent.callId === event.callId &&
    !state.stack.some((id) => Object.hasOwn(event.locals, id)) &&
    !(previousEvent.stack ?? []).some((id) =>
      Object.hasOwn(previousEvent.locals, id),
    )
  )
    return previousEvent.locals;
  return undefined;
}
// Token spans only decorate literal source text. Source code is never generated.
function codeText(content) {
  const container = text('span', '', 'code-text');
  const token =
    /\/\/.*|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:class|function|fun|const|let|var|public|private|static|return|if|else|for|while|new|async|await|throw|import|export|void|int|String|number|boolean|true|false|null)\b|\b\d+(?:\.\d+)?\b/g;
  let start = 0;
  for (const match of content.matchAll(token)) {
    if (match.index > start)
      container.append(
        document.createTextNode(content.slice(start, match.index)),
      );
    const kind = /^(?:\/\/|\/\*)/.test(match[0])
      ? 'comment'
      : /^["']/.test(match[0])
        ? 'string'
        : /^\d/.test(match[0])
          ? 'number'
          : 'keyword';
    container.append(text('span', match[0], 'token-' + kind));
    start = match.index + match[0].length;
  }
  if (start < content.length)
    container.append(document.createTextNode(content.slice(start)));
  return container;
}
function renderSource(state, event) {
  const trace = flow.trace;
  const events = trace?.events ?? [];
  if (!$('follow').checked && !pinnedCallId) pinnedCallId = event?.callId;
  const frameId = pinnedCallId ?? activeFrame(state, event);
  const selected = pinnedCallId
    ? events.slice(0, cursor).findLast((e) => e.callId === frameId && e.source)
    : event;
  let sourceEvent = selected?.source
    ? selected
    : events.slice(0, cursor).findLast((e) => e.callId === frameId && e.source);
  if (!$('follow').checked && !sourceEvent) sourceEvent = inspectedSourceEvent;
  if (sourceEvent) inspectedSourceEvent = sourceEvent;
  const location = sourceEvent?.source;
  const sourceCode = location ? trace?.sourceFiles?.[location.file] : undefined;
  $('source').textContent = location?.file ?? 'No source location recorded';
  $('source-line').textContent = location ? 'L' + location.line : '—';
  const sourceKey =
    sourceCode === undefined
      ? 'excerpt:' + (location?.file ?? '') + ':' + (sourceEvent?.snippet ?? '')
      : location.file + '\0' + sourceCode;
  const lines = sourceCode?.split(/\r?\n/) ?? [];
  // Long files keep only the current source window in the DOM.
  const firstLine =
    lines.length > 600
      ? Math.min(
          Math.max(1, (location?.line ?? 1) - 150),
          Math.max(1, lines.length - 300),
        )
      : 1;
  const endLine =
    lines.length > 600 ? Math.min(lines.length, firstLine + 300) : lines.length;
  const needsBuild =
    sourceKey !== shownSource ||
    shownFirstLine !== firstLine ||
    !$('snippet').hasChildNodes();
  if (needsBuild) {
    shownSource = sourceKey;
    shownFirstLine = firstLine;
    if (sourceCode !== undefined) {
      const fragment = document.createDocumentFragment();
      for (let i = firstLine; i <= endLine; i++) {
        const row = text('div', '', 'code-row');
        row.dataset.line = String(i);
        const gutter = text('button', String(i), 'code-gutter');
        const stepIndex = sourceLines.get(location.file + ':' + i);
        gutter.type = 'button';
        gutter.title = stepIndex
          ? 'Toggle breakpoint at line ' + i
          : 'No execution recorded on this line';
        gutter.disabled = !stepIndex;
        row.append(gutter, codeText(lines[i - 1] ?? ''));
        fragment.append(row);
      }
      $('snippet').replaceChildren(fragment);
    } else $('snippet').textContent = sourceEvent?.snippet ?? '';
  }
  $('source-empty').hidden = Boolean(
    sourceCode !== undefined || sourceEvent?.snippet,
  );
  for (const old of $('snippet').querySelectorAll('.executing-line'))
    old.classList.remove('executing-line');
  for (const row of $('snippet').querySelectorAll('.code-row')) {
    const key = location.file + ':' + row.dataset.line;
    const index = sourceLines.get(key);
    const gutter = row.querySelector('.code-gutter');
    gutter.disabled = !index;
    gutter.title = index
      ? 'Toggle breakpoint at line ' + row.dataset.line
      : 'No execution recorded on this line';
    gutter.onclick = index
      ? () => {
          sourceBreakpoints.has(key)
            ? sourceBreakpoints.delete(key)
            : sourceBreakpoints.add(key);
          render();
        }
      : null;
    row.classList.toggle(
      'has-breakpoint',
      sourceBreakpoints.has(key) || breakpoints.has(index),
    );
    gutter.setAttribute(
      'aria-pressed',
      String(sourceBreakpoints.has(key) || breakpoints.has(index)),
    );
  }
  const isExecuting =
    sourceEvent?.callId === event?.callId &&
    location?.file === event?.source?.file;
  const active =
    isExecuting &&
    event?.source &&
    $('snippet').querySelector(`[data-line="${event.source.line}"]`);
  if (active) {
    active.classList.add('executing-line');
    if (
      $('follow').checked &&
      (active.offsetTop < $('snippet').scrollTop ||
        active.offsetTop + active.offsetHeight >
          $('snippet').scrollTop + $('snippet').clientHeight)
    )
      active.scrollIntoView?.({ block: 'nearest' });
  }
  $('source-stack').replaceChildren();
  for (const callId of state.stack) {
    const frame = invocations.get(callId);
    const button = text('button', frame?.symbolId ?? callId, 'stack-link');
    button.title = frame?.source?.file ?? callId;
    button.classList.toggle(
      'selected',
      (pinnedCallId ?? event?.callId) === callId,
    );
    button.onclick = () => inspectFrame(callId);
    $('source-stack').append(button);
  }
}
function renderConsole() {
  let lo = 0,
    hi = consoleEvents.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (consoleEvents[mid].index <= cursor) lo = mid + 1;
    else hi = mid;
  }
  const value = consoleEvents
    .slice(Math.max(0, lo - 300), lo)
    .map((e) => e.output)
    .join(flow.trace?.recording ? '' : '\n');
  if (value !== lastConsoleText) {
    $('console-output').textContent = value;
    lastConsoleText = value;
  }
  $('console-count').textContent = lo + ' events';
}
// Continuation sessions are prepared by the MCP server. Fetching the next
// stored chunk only extends the replay timeline; it never performs analysis.
async function loadNextChunk() {
  const state = continuationStates.get(flow);
  if (state?.loading) return state.loading;
  if (!flow?.nextSessionId) return false;
  const currentFlow = flow;
  const nextId = currentFlow.nextSessionId;
  state.loading = (async () => {
    const response = await fetch('/api/flow/' + nextId);
    if (!response.ok) throw new Error('Could not load continuation ' + nextId);
    const next = await response.json();
    const currentEvidence =
      currentFlow.trace?.recording ?? currentFlow.trace?.simulation;
    const nextEvidence = next.trace?.recording ?? next.trace?.simulation;
    if (
      !nextEvidence ||
      nextEvidence.mode !== currentEvidence?.mode ||
      nextEvidence.runId !== currentEvidence?.runId ||
      nextEvidence.previousSessionId !== state.tailId ||
      next.endpoint !== currentFlow.endpoint ||
      next.trace.projectRoot !== currentFlow.trace?.projectRoot ||
      next.trace.sourceHash !== currentFlow.trace?.sourceHash ||
      next.trace.target !== currentFlow.trace?.target ||
      JSON.stringify(next.trace.scenario) !==
        JSON.stringify(currentFlow.trace?.scenario) ||
      !Array.isArray(next.trace.events) ||
      next.trace.events.length !== next.steps?.length ||
      !next.trace.events.length
    )
      throw new Error('Continuation does not match the current execution');
    if (
      state.loadedIds.has(nextId) ||
      (next.nextSessionId &&
        (next.nextSessionId === nextId ||
          state.loadedIds.has(next.nextSessionId)))
    )
      throw new Error('Continuation contains a session cycle');
    const existingIds = new Set(
      currentFlow.trace.events.map((event) => event.id),
    );
    const newIds = next.trace.events.map((event) => event.id);
    if (
      newIds.some((id) => typeof id !== 'string' || existingIds.has(id)) ||
      new Set(newIds).size !== newIds.length
    )
      throw new Error('Continuation contains duplicate execution events');
    const previous = currentFlow.trace.events.at(-1)?.id;
    const numbered = /^event-(\d+)$/.exec(previous ?? '');
    if (
      numbered &&
      newIds.some((id, i) => id !== `event-${Number(numbered[1]) + i + 1}`)
    )
      throw new Error('Continuation execution sequence is discontinuous');
    for (const [file, content] of Object.entries(
      next.trace.sourceFiles ?? {},
    )) {
      const current = currentFlow.trace.sourceFiles?.[file];
      if (current !== undefined && current !== content)
        throw new Error('Source file changed between prepared chunks: ' + file);
    }
    currentFlow.trace.events.push(...next.trace.events);
    currentFlow.steps.push(...next.steps);
    currentFlow.trace.sourceFiles = {
      ...currentFlow.trace.sourceFiles,
      ...next.trace.sourceFiles,
    };
    currentFlow.trace.diagnostics = [
      ...new Set([
        ...currentFlow.trace.diagnostics,
        ...(next.trace.diagnostics ?? []),
      ]),
    ];
    currentFlow.trace.truncated = next.trace.truncated;
    currentEvidence.complete = nextEvidence.complete;
    currentFlow.nextSessionId = next.nextSessionId;
    state.tailId = nextId;
    state.loadedIds.add(nextId);
    state.error = undefined;
    if (flow !== currentFlow) return false;
    $('next-chunk').hidden = !next.nextSessionId;
    if (next.nextSessionId)
      $('next-chunk').href = '/flow/' + next.nextSessionId;
    buildNodes(true);
    render();
    return true;
  })()
    .catch((error) => {
      state.error = error instanceof Error ? error.message : String(error);
      if (flow === currentFlow) {
        render();
      }
      throw error;
    })
    .finally(() => {
      state.loading = undefined;
    });
  return state.loading;
}
async function extendThrough(index) {
  while (flow?.nextSessionId && flow.steps.length < index) {
    if (!(await loadNextChunk())) return false;
  }
  return true;
}
function drawConnection(from, to) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('connections');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.width =
    Math.max($('canvas').clientWidth, $('canvas').scrollWidth) + 'px';
  svg.style.height = $('canvas').clientHeight + 'px';
  const path = document.createElementNS(svg.namespaceURI, 'path');
  const x1 = from.offsetLeft + from.offsetWidth / 2,
    x2 = to.offsetLeft + to.offsetWidth / 2;
  const y1 = from.offsetTop + from.offsetHeight,
    y2 = to.offsetTop + to.offsetHeight;
  path.setAttribute(
    'd',
    `M ${x1} ${y1} C ${x1 + (from === to ? 60 : 0)} ${y1 + 45}, ${x2 - (from === to ? 60 : 0)} ${y2 + 45}, ${x2} ${y2}`,
  );
  path.classList.add('connection-path');
  svg.append(path);
  $('canvas').append(svg);
}
function render() {
  if (!flow) return;
  const recording = flow.trace?.recording;
  const isMock =
    flow.trace?.simulation ||
    flow.trace?.events.some((e) =>
      ['mock', 'assumed', 'proposed'].includes(e.certainty),
    );
  $('evidence-mode').textContent = recording
    ? 'Recorded execution'
    : isMock
      ? 'Simulated values'
      : 'Static / unverified evidence';
  $('trace-order').textContent = recording
    ? 'Recorded runtime order'
    : isMock
      ? 'Ordered by simulated execution'
      : 'Graph traversal / supplied order';
  animation?.cancel();
  $('canvas')
    .querySelectorAll('.packet,.connections,.canvas-empty')
    .forEach((e) => e.remove());
  for (const node of nodes.values())
    node.classList.remove('active', 'destination');
  $('canvas').className = $('view-mode').value;
  $('timeline').value = cursor;
  $('progress').textContent = cursor + ' / ' + flow.steps.length;
  $('previous').disabled = cursor === 0;
  $('next').disabled = cursor === flow.steps.length && !flow.nextSessionId;
  $('play').disabled = !flow.steps.length;
  $('bookmark').disabled = $('breakpoint').disabled = !cursor;
  $('bookmark').setAttribute('aria-pressed', bookmarks.has(cursor));
  $('bookmark').textContent = bookmarks.has(cursor) ? '★' : '☆';
  $('breakpoint').setAttribute('aria-pressed', breakpoints.has(cursor));
  $('status').textContent = continuationStates.get(flow)?.error
    ? 'Continuation unavailable · ' + continuationStates.get(flow).error
    : cursor === flow.steps.length && cursor
      ? flow.nextSessionId
        ? 'More prepared steps available'
        : flow.trace?.truncated
          ? 'Trace incomplete · see coverage'
          : 'Replay complete'
      : recording
        ? 'Recorded execution · local session'
        : isMock
          ? 'Mock execution · local session'
          : 'Structural / unverified flow';
  $('coverage').textContent =
    recording?.coverage ??
    flow.trace?.simulation?.coverage ??
    'Structural/legacy flow: execution completeness is not established.';
  $('diagnostics').textContent = JSON.stringify(
    flow.trace
      ? {
          provider: flow.trace.provider,
          sourceHash: flow.trace.sourceHash,
          scenario: flow.trace.scenario,
          filesAnalyzed: flow.trace.filesAnalyzed,
          truncated: flow.trace.truncated,
          diagnostics: flow.trace.diagnostics,
        }
      : { note: 'Legacy agent-authored flow' },
    null,
    2,
  );
  filterList();
  for (const id of ['fields', 'frame-list', 'local-tree', 'object-tree'])
    $(id).replaceChildren();
  for (const id of [
    'operation',
    'origins',
    'stack',
    'locals',
    'objects',
    'certainty',
    'route',
  ])
    $(id).textContent = '';
  $('values-empty').hidden = Boolean(cursor);
  renderConsole();
  $('step-number').textContent = cursor
    ? 'STEP ' + String(cursor).padStart(2, '0')
    : 'NO STEP SELECTED';
  if (!cursor) {
    shownSource = '';
    $('snippet').replaceChildren();
    $('source-stack').replaceChildren();
    $('source').textContent = 'Select a step to inspect its source';
    $('source-line').textContent = '—';
    $('source-empty').hidden = false;
    $('packet-title').textContent = 'Ready to explore';
    $('event-kind').textContent = 'READY';
    $('playback-label').textContent = 'Ready when you are';
    $('active-path').textContent = 'Your execution, one step at a time';
    const empty = text('div', '', 'canvas-empty');
    empty.append(
      text('span', '▷', 'empty-icon'),
      text('strong', 'See your code in motion'),
      text('small', 'Press Play or choose a step from the execution trace'),
    );
    $('canvas').append(empty);
    return;
  }
  const state = replayState(flow.trace?.events ?? [], cursor);
  const event = state.event,
    step = flow.steps[cursor - 1];
  $('stack').textContent = JSON.stringify(state.stack, null, 2);
  $('locals').textContent = JSON.stringify(state.locals, null, 2);
  $('objects').textContent = JSON.stringify(state.objects, null, 2);
  state.stack.forEach((frame, i) => {
    const row = text('li', '', 'frame-item');
    row.append(
      text('span', String(i + 1), 'frame-depth'),
      text(
        'button',
        invocations.get(frame)?.symbolId ?? String(frame),
        'stack-link',
      ),
    );
    row.querySelector('button').onclick = () => inspectFrame(frame);
    $('frame-list').append(row);
  });
  fieldRows(
    $('local-tree'),
    frameLocals(state, event),
    precedingFrameLocals(state, event, flow.trace?.events[cursor - 2]),
  );
  fieldRows($('object-tree'), state.objects);
  $('certainty').textContent = event
    ? [event.certainty, event.note].filter(Boolean).join(' · ')
    : 'Agent-authored mock data';
  renderSource(state, event);
  $('packet-title').textContent = event?.label ?? step.dtoName;
  $('route').textContent = step.from + ' → ' + step.to;
  $('active-path').textContent = step.to;
  $('event-kind').textContent = event?.kind ?? 'FLOW';
  $('playback-label').textContent =
    (event?.source ? 'L' + event.source.line + ' · ' : '') +
    (event?.label ?? step.dtoName);
  const after = event?.after ?? step.dtoFields;
  let before = event?.before;
  if (before === undefined && event?.objectId)
    before = flow.trace.events
      .slice(0, cursor - 1)
      .findLast((e) => e.objectId === event.objectId)?.after;
  fieldRows($('fields'), after, before);
  $('operation').textContent = event
    ? [
        event.kind ? event.kind + ' · frame ' + event.callId : '',
        event.objectId ? 'Object: ' + event.objectId : '',
        event.inputs ? 'Inputs: ' + valueText(event.inputs) : '',
        Object.hasOwn(event, 'result')
          ? 'Result: ' + valueText(event.result)
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  $('origins').textContent = event?.origins
    ? Object.entries(event.origins)
        .map(([key, origin]) => key + ' ← ' + origin)
        .join('\n')
    : 'No origin metadata recorded';
  const from = nodes.get(step.from),
    to = nodes.get(step.to);
  from.classList.add('active');
  to.classList.add('active', 'destination');
  drawConnection(from, to);
  const packet = text('div', '', 'packet');
  packet.append(text('strong', step.dtoName));
  if (event?.objectId) packet.append(text('div', event.objectId));
  if (event?.inputs)
    packet.append(
      text('div', 'Inputs: ' + valueText(event.inputs), 'packet-inputs'),
    );
  fieldRows(packet, after, before);
  if (event && Object.hasOwn(event, 'result'))
    packet.append(
      text('div', 'Return: ' + valueText(event.result), 'field changed'),
    );
  $('canvas').append(packet);
  const x = (node) =>
    Math.max(
      12,
      node.offsetLeft + node.offsetWidth / 2 - packet.offsetWidth / 2,
    );
  const end =
    $('view-mode').value === 'focus'
      ? Math.max(12, ($('canvas').clientWidth - packet.offsetWidth) / 2)
      : x(to);
  packet.style.left = end + 'px';
  if ($('follow').checked) {
    if ($('view-mode').value === 'map')
      $('canvas').scrollLeft = Math.max(0, to.offsetLeft - 30);
    const row = rows[cursor - 1]?.button;
    if (row && !row.hidden) {
      const list = $('event-list');
      const top = row.offsetTop;
      if (
        top < list.scrollTop ||
        top + row.offsetHeight > list.scrollTop + list.clientHeight
      )
        list.scrollTop = Math.max(0, top - list.clientHeight / 2);
    }
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && packet.animate)
    animation = packet.animate(
      [
        { left: x(from) + 'px', opacity: 0.4 },
        { left: end + 'px', opacity: 1 },
      ],
      { duration: Number($('speed').value) * 0.65, easing: 'ease-in-out' },
    );
}
function seek(index) {
  if (!flow) return;
  pause();
  const version = navigationVersion;
  const requestedFlow = flow;
  if (index > flow.steps.length && flow.nextSessionId) {
    void extendThrough(index)
      .then((ready) => {
        if (ready && version === navigationVersion && flow === requestedFlow)
          seek(index);
      })
      .catch(() => {}); // loadNextChunk reports the error in the player.
    return;
  }
  cursor = Math.max(0, Math.min(flow.steps.length, index));
  render();
}
function tick(version) {
  if (version !== navigationVersion) return;
  if (cursor === flow.steps.length && flow.nextSessionId) {
    void extendThrough(cursor + 1)
      .then((ready) => {
        if (version !== navigationVersion) return;
        if (ready && timer !== undefined)
          timer = setTimeout(() => tick(version), Number($('speed').value));
        else pause();
      })
      .catch(() => {
        if (version === navigationVersion) pause();
      });
    return;
  }
  cursor = Math.min(cursor + 1, flow.steps.length);
  render();
  if (hasBreakpoint(cursor)) {
    pause();
    $('status').textContent = 'Breakpoint · step ' + cursor;
  } else if (cursor < flow.steps.length)
    timer = setTimeout(() => tick(version), Number($('speed').value));
  else if (flow.nextSessionId) {
    void extendThrough(cursor + 1)
      .then((ready) => {
        if (version !== navigationVersion) return;
        if (ready && timer !== undefined)
          timer = setTimeout(() => tick(version), Number($('speed').value));
        else pause();
      })
      .catch(() => {
        if (version === navigationVersion) pause();
      });
  } else pause();
}
function toggleBookmark() {
  if (!cursor) return;
  bookmarks.has(cursor) ? bookmarks.delete(cursor) : bookmarks.add(cursor);
  render();
}
function toggleBreakpoint(index = cursor) {
  if (!index) return;
  breakpoints.has(index) ? breakpoints.delete(index) : breakpoints.add(index);
  render();
}
$('play').onclick = () => {
  if (!flow?.steps.length) return;
  if (timer !== undefined) return pause();
  if (cursor === flow.steps.length && !flow.nextSessionId) cursor = 0;
  $('play').textContent = 'Pause';
  $('play').dataset.playing = 'true';
  const version = ++navigationVersion;
  timer = setTimeout(() => tick(version), 0);
};
$('next').onclick = () => seek(cursor + 1);
$('previous').onclick = () => seek(cursor - 1);
$('restart').onclick = () => seek(0);
// Stepping is computed from the preprocessed invocation snapshots only.
$('step-over').onclick = () => {
  pause();
  const version = navigationVersion;
  const requestedFlow = flow;
  const events = flow?.trace?.events;
  if (!events || !cursor) return seek(cursor + 1);
  const current = events[cursor - 1];
  const callId = current?.stack?.at(-1) ?? current.callId;
  void (async () => {
    let i = cursor;
    while (true) {
      for (; i < events.length; i++) {
        if (events[i].callId === callId || !events[i].stack?.includes(callId)) {
          if (version === navigationVersion && flow === requestedFlow)
            seek(i + 1);
          return;
        }
      }
      if (version !== navigationVersion || flow !== requestedFlow) return;
      if (!flow.nextSessionId || !(await extendThrough(events.length + 1)))
        return version === navigationVersion && flow === requestedFlow
          ? seek(events.length)
          : undefined;
    }
  })().catch(() => {});
};
$('step-out').onclick = () => {
  pause();
  const version = navigationVersion;
  const requestedFlow = flow;
  const events = flow?.trace?.events;
  const current = events?.[cursor - 1];
  if (!current) return;
  const callId = current.stack?.at(-1);
  if (!callId) return;
  void (async () => {
    let i = cursor;
    while (true) {
      for (; i < events.length; i++)
        if (!events[i].stack?.includes(callId)) {
          if (version === navigationVersion && flow === requestedFlow)
            seek(i + 1);
          return;
        }
      if (version !== navigationVersion || flow !== requestedFlow) return;
      if (!flow.nextSessionId || !(await extendThrough(events.length + 1)))
        return version === navigationVersion && flow === requestedFlow
          ? seek(events.length)
          : undefined;
    }
  })().catch(() => {});
};
$('timeline').oninput = () => seek(Number($('timeline').value));
const workspace = document.querySelector('.workspace');
const divider = $('workspace-divider');
let layout = { inspector: false, traceWidth: 220, console: false };
try {
  const saved = JSON.parse(localStorage.getItem('code-anime-layout') ?? '{}');
  if (typeof saved.inspector === 'boolean') layout.inspector = saved.inspector;
  if (typeof saved.console === 'boolean') layout.console = saved.console;
  if (Number.isFinite(saved.traceWidth)) layout.traceWidth = saved.traceWidth;
} catch {
  /* Storage can be disabled by the browser. */
}
function saveLayout() {
  try {
    localStorage.setItem('code-anime-layout', JSON.stringify(layout));
  } catch {
    /* Optional preference persistence. */
  }
}
function resizeTimeline(width) {
  const max = Math.max(
    170,
    Math.min(480, (workspace.clientWidth || innerWidth) * 0.45),
  );
  const bounded = Math.round(Math.max(170, Math.min(max, width)));
  workspace.style.setProperty('--trace-width', bounded + 'px');
  divider.setAttribute('aria-valuemax', String(Math.floor(max)));
  divider.setAttribute('aria-valuenow', String(bounded));
  return bounded;
}
function applyLayout() {
  workspace.classList.toggle('inspector-collapsed', !layout.inspector);
  $('toggle-inspector').setAttribute('aria-expanded', String(layout.inspector));
  resizeTimeline(layout.traceWidth);
}
$('toggle-inspector').onclick = () => {
  layout.inspector = !layout.inspector;
  if (layout.inspector) {
    workspace.classList.remove('source-focused');
    $('maximize-source').setAttribute('aria-pressed', 'false');
    $('maximize-source').textContent = 'Focus';
  }
  applyLayout();
  saveLayout();
  render();
};
$('maximize-source').onclick = () => {
  const focused = workspace.classList.toggle('source-focused');
  $('maximize-source').setAttribute('aria-pressed', String(focused));
  $('maximize-source').textContent = focused ? 'Restore' : 'Focus';
  render();
};
divider.onpointerdown = (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  divider.focus();
  divider.setPointerCapture(event.pointerId);
};
divider.onpointermove = (event) => {
  if (!divider.hasPointerCapture(event.pointerId)) return;
  layout.traceWidth = resizeTimeline(
    event.clientX - workspace.getBoundingClientRect().left,
  );
};
divider.onpointerup = (event) => {
  if (divider.hasPointerCapture(event.pointerId))
    divider.releasePointerCapture(event.pointerId);
  saveLayout();
  render();
};
divider.onkeydown = (event) => {
  const width = Number(divider.getAttribute('aria-valuenow'));
  const next = {
    ArrowLeft: width - 20,
    ArrowRight: width + 20,
    Home: 170,
    End: 480,
  }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  event.stopPropagation();
  layout.traceWidth = resizeTimeline(next);
  saveLayout();
  render();
};
$('console-panel').open = layout.console;
$('console-panel').addEventListener('toggle', () => {
  if (window.innerWidth <= 650) return;
  layout.console = $('console-panel').open;
  saveLayout();
});
window.addEventListener('resize', applyLayout);
applyLayout();
for (const button of document.querySelectorAll('.mobile-views button')) {
  button.onclick = () => {
    document.querySelector('main').dataset.mobileView =
      button.dataset.mobileView;
    for (const item of document.querySelectorAll('.mobile-views button'))
      item.setAttribute('aria-pressed', String(item === button));
    if (button.dataset.mobileView === 'console') $('console-panel').open = true;
    if (button.dataset.mobileView === 'state')
      activateTab(document.querySelector('[data-tab="state"]'));
  };
}
$('search').oninput = filterList;
$('kind-filter').onchange = filterList;
$('bookmark').onclick = toggleBookmark;
$('breakpoint').onclick = () => toggleBreakpoint();
$('bookmarks-only').onclick = () => {
  $('bookmarks-only').setAttribute(
    'aria-pressed',
    $('bookmarks-only').getAttribute('aria-pressed') !== 'true',
  );
  filterList();
};
$('view-mode').onchange = render;
$('toggle-flow').onclick = () => {
  const visible = document
    .querySelector('.center-column')
    .classList.toggle('show-flow');
  $('toggle-flow').setAttribute('aria-expanded', String(visible));
  $('toggle-flow').textContent = visible ? 'Hide diagram' : 'Show diagram';
  render();
};
$('follow').onchange = () => {
  if ($('follow').checked) {
    pinnedCallId = undefined;
    inspectedSourceEvent = undefined;
  } else pinnedCallId = inspectedSourceEvent?.callId;
  render();
};
$('center-view').onclick = () => {
  if (cursor) {
    const node = nodes.get(flow.steps[cursor - 1].to);
    $('canvas').scrollLeft = Math.max(
      0,
      node.offsetLeft + node.offsetWidth / 2 - $('canvas').clientWidth / 2,
    );
  }
};
$('changes-only').onchange = () =>
  $('fields').classList.toggle('changes-only', $('changes-only').checked);
$('help').onclick = () => {
  $('help-panel').hidden = !$('help-panel').hidden;
};
$('close-help').onclick = () => {
  $('help-panel').hidden = true;
  $('help').focus();
};
const tabs = [...document.querySelectorAll('[data-tab]')];
function activateTab(tab) {
  for (const candidate of tabs) {
    const active = candidate === tab;
    candidate.classList.toggle('active', active);
    candidate.setAttribute('aria-selected', active);
    candidate.tabIndex = active ? 0 : -1;
    $('panel-' + candidate.dataset.tab).hidden = !active;
  }
}
tabs.forEach((tab, i) => {
  tab.onclick = () => activateTab(tab);
  tab.onkeydown = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const index =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? tabs.length - 1
          : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    activateTab(tabs[index]);
    tabs[index].focus();
  };
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('help-panel').hidden) {
    e.preventDefault();
    $('close-help').click();
    return;
  }
  if (
    !flow ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    e.target.closest(
      'input,select,textarea,button,a,summary,[contenteditable=true]',
    )
  )
    return;
  const actions = {
    ' ': () => $('play').click(),
    ArrowLeft: () => seek(cursor - 1),
    ArrowRight: () => seek(cursor + 1),
    Home: () => seek(0),
    End: () => seek(flow.steps.length),
    '/': () => {
      if (window.matchMedia('(max-width: 650px)').matches)
        document.querySelector('button[data-mobile-view="trace"]').click();
      $('search').focus();
    },
    b: toggleBookmark,
  };
  const action = actions[e.key];
  if (action) {
    e.preventDefault();
    action();
  }
});
$('export').onclick = () => {
  if (!flow) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'code-anime-trace.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
window.addEventListener('resize', () => {
  if (flow) render();
});
async function load() {
  try {
    const response = await fetch(
      '/api/flow/' + location.pathname.split('/').at(-1),
    );
    if (!response.ok) throw new Error((await response.json()).error);
    flow = await response.json();
    originalFlow = flow;
    registerFlow(flow, location.pathname.split('/').at(-1));
    const baselineFlow = flow.baselineTrace
      ? registerFlow(
          {
            endpoint: flow.baselineTrace.target ?? flow.endpoint,
            nextSessionId: flow.baselineNextSessionId,
            trace: flow.baselineTrace,
            steps: traceSteps(flow.baselineTrace),
          },
          flow.baselineSessionId ?? flow.trace?.simulation?.baselineSessionId,
        )
      : undefined;
    $('title').textContent = flow.endpoint;
    $('title').title = flow.endpoint;
    $('variant').hidden = !flow.baselineTrace;
    $('variant').onchange = () => {
      pause();
      continuationStates.get(flow).cursor = cursor;
      bookmarks.clear();
      breakpoints.clear();
      sourceBreakpoints.clear();
      flow = $('variant').value === 'baseline' ? baselineFlow : originalFlow;
      cursor = continuationStates.get(flow).cursor;
      $('next-chunk').hidden = !flow.nextSessionId;
      if (flow.nextSessionId)
        $('next-chunk').href = '/flow/' + flow.nextSessionId;
      buildNodes();
      render();
    };
    const previous = (flow.trace?.recording ?? flow.trace?.simulation)
      ?.previousSessionId;
    if (previous) {
      $('previous-chunk').hidden = false;
      $('previous-chunk').href = '/flow/' + previous;
    }
    if (flow.nextSessionId) {
      $('next-chunk').hidden = false;
      $('next-chunk').href = '/flow/' + flow.nextSessionId;
    }
    buildNodes();
    render();
  } catch (error) {
    $('title').textContent = 'Flow unavailable';
    $('status').textContent = error.message;
    for (const control of document.querySelectorAll('button,input,select'))
      control.disabled = true;
  }
}
void load();
