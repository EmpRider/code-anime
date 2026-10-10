import { replayState } from './replay.js';
import { prepareSourceHighlighting } from './source-highlighter.js';
const $ = (id) => document.getElementById(id);
let flow, originalFlow, timer, animation;
let cursor = 0;
let renderedFlow;
let renderedCursor = -1;
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
const invocationPositions = new Map();
const invocationDetails = new Map();
const symbolInvocations = new Map();
let selectedMethod;
let renderedMethod;
const expandedCalls = new Set();
let shownSource = '';
let shownFirstLine = 1;
const sourceRows = new Map();
let highlightedSourceRow;
let sourceBreakpointVersion = 0;
let shownBreakpointVersion = -1;
let pinnedCallId;
let inspectedSourceEvent;
let lastConsoleText = '';
const sourceLines = new Map();
const sourceCache = new Map();
const sourceSyntaxCache = new Map();
const consoleEvents = [];
const frameSnapshots = new Map();
const frameSources = new Map();
const objectHistory = new Map();
let flowHasMock = false;
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
const FIELD_PAGE_SIZE = 60;
const fieldDisclosures = new Map();
const fieldPageCounts = new Map();
let inspectedFields;
// Trace values are JSON snapshots. Check only on demand so filtering a large
// object does not require constructing its entire DOM tree first.
function valueHasChanged(after, before) {
  const pending = [[after, before]];
  while (pending.length) {
    const [next, prior] = pending.pop();
    if (Object.is(next, prior)) continue;
    if (
      !next ||
      !prior ||
      typeof next !== 'object' ||
      typeof prior !== 'object' ||
      Array.isArray(next) !== Array.isArray(prior)
    ) {
      if (valueText(next) !== valueText(prior)) return true;
      continue;
    }
    const nextKeys = Object.keys(next);
    const priorKeys = Object.keys(prior);
    if (nextKeys.length !== priorKeys.length) return true;
    for (const key of nextKeys) {
      if (!Object.hasOwn(prior, key)) return true;
      pending.push([next[key], prior[key]]);
    }
  }
  return false;
}
function fieldRows(
  parent,
  after,
  before,
  prefix = '',
  depth = 0,
  root = parent.id || 'packet',
  segments = [],
) {
  const onlyChanged = root === 'fields' && $('changes-only').checked;
  const keys = [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ].filter(
    (key) =>
      !onlyChanged ||
      (before !== undefined && valueHasChanged(after?.[key], before?.[key])),
  );
  const pageKey = JSON.stringify([root, onlyChanged, ...segments]);
  let visible = 0;
  const more = text('button', '', 'value-more');
  more.type = 'button';
  const appendPage = (end) => {
    const fragment = document.createDocumentFragment();
    for (const key of keys.slice(visible, end)) {
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
        const childSegments = [...segments, key];
        const childKey = JSON.stringify([root, ...childSegments]);
        const defaultOpen = depth < 2 && Object.keys(sample).length <= 6;
        child.open = fieldDisclosures.get(childKey) ?? defaultOpen;
        if (onlyChanged) child.classList.add('has-changes');
        child.append(
          text('summary', path + (Array.isArray(sample) ? ' []' : ' {}')),
        );
        const load = () => {
          if (child.dataset.loaded) return;
          child.dataset.loaded = 'true';
          fieldRows(
            child,
            next ?? {},
            before === undefined ? undefined : (prior ?? {}),
            path,
            depth + 1,
            root,
            childSegments,
          );
          if (Object.keys(sample).length === 0)
            child.append(text('span', valueText(sample), 'field'));
        };
        if (child.open) load();
        child.addEventListener('toggle', () => {
          fieldDisclosures.set(childKey, child.open);
          if (child.open) load();
        });
        fragment.append(child);
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
        fragment.append(row);
      }
    }
    parent.insertBefore(fragment, more.parentNode === parent ? more : null);
    visible = end;
    fieldPageCounts.set(pageKey, visible);
    const remaining = keys.length - visible;
    if (remaining) {
      more.textContent = `Show ${Math.min(FIELD_PAGE_SIZE, remaining)} more (${remaining} remaining)`;
      more.setAttribute(
        'aria-label',
        `Show more fields under ${prefix || root}`,
      );
      if (more.parentNode !== parent) parent.append(more);
    } else {
      more.remove();
    }
  };
  more.onclick = () =>
    appendPage(Math.min(keys.length, visible + FIELD_PAGE_SIZE));
  appendPage(
    Math.min(
      keys.length,
      Math.max(FIELD_PAGE_SIZE, fieldPageCounts.get(pageKey) ?? 0),
    ),
  );
}
function renderInspectedFields() {
  $('fields').replaceChildren();
  if (inspectedFields)
    fieldRows($('fields'), inspectedFields.after, inspectedFields.before);
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
  invocationPositions.clear();
  invocationDetails.clear();
  symbolInvocations.clear();
  renderedMethod = undefined;
  if (!preserveInspection) selectedMethod = undefined;
  if (!preserveInspection) {
    expandedCalls.clear();
    fieldDisclosures.clear();
    fieldPageCounts.clear();
    pinnedCallId = undefined;
    inspectedSourceEvent = undefined;
    shownSource = '';
    lastConsoleText = '';
  }
  sourceLines.clear();
  sourceCache.clear();
  sourceSyntaxCache.clear();
  sourceBreakpointVersion++;
  consoleEvents.length = 0;
  frameSnapshots.clear();
  frameSources.clear();
  objectHistory.clear();
  flowHasMock = Boolean(
    flow.trace?.simulation ||
    flow.trace?.events.some((e) =>
      ['mock', 'assumed', 'proposed'].includes(e.certainty),
    ),
  );
  for (const [index, event] of (flow.trace?.events ?? []).entries())
    if (event.kind === 'enter') {
      if (invocations.has(event.callId)) continue;
      invocations.set(event.callId, event);
      invocationPositions.set(event.callId, index);
      invocationDetails.set(event.callId, []);
      if (!symbolInvocations.has(event.symbolId))
        symbolInvocations.set(event.symbolId, []);
      symbolInvocations.get(event.symbolId).push(event.callId);
    }
  flow.trace?.events.forEach((event, index) => {
    invocationDetails.get(event.callId)?.push({ index });
    if (event.kind === 'enter') {
      const parent = event.parentCallId ?? event.stack?.at(-2);
      if (parent && parent !== event.callId)
        invocationDetails.get(parent)?.push({ index, child: event.callId });
    }
    if (event.objectId && event.after !== undefined) {
      if (!objectHistory.has(event.objectId))
        objectHistory.set(event.objectId, []);
      objectHistory.get(event.objectId).push(index);
    }
    // Snapshot locations are indexed once per prepared trace (and rebuilt when
    // a continuation is loaded). Task scheduling can interleave unrelated
    // events, so the previous event is not necessarily this frame's history.
    for (const frame of event.stack ?? []) {
      const snapshot = event.locals?.[frame];
      if (snapshot === null || typeof snapshot !== 'object') continue;
      if (!frameSnapshots.has(frame)) frameSnapshots.set(frame, []);
      frameSnapshots.get(frame).push(index);
    }
    if (event.kind === 'console' && event.output !== undefined)
      consoleEvents.push({ index: index + 1, output: event.output });
    if (!event.source) return;
    if (!frameSources.has(event.callId)) frameSources.set(event.callId, []);
    frameSources.get(event.callId).push(index);
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
      const node = text('button', '', 'node');
      node.type = 'button';
      node.setAttribute('aria-label', 'Inspect method ' + name);
      node.onclick = () => {
        const events = flow.trace?.events ?? [];
        const active = events[cursor - 1]?.stack ?? [];
        const matches = symbolInvocations.get(name) ?? [];
        const invocationId =
          matches.findLast((id) => active.includes(id)) ??
          matches.findLast((id) => invocationPositions.get(id) < cursor) ??
          matches[0];
        if (!invocationId) return;
        selectedMethod =
          selectedMethod === invocationId ? undefined : invocationId;
        if (selectedMethod) expandedCalls.add(selectedMethod);
        filterRevision++;
        filterList();
        renderMethodDetails();
      };
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
let searchQuery;
let searchMatches = [];
let filterRevision = 0;
let cachedFilterKey = '';
let baseVisible = [];
const essentialKinds = new Set([
  'enter',
  'call',
  'return',
  'await',
  'yield',
  'resume',
  'console',
  'throw',
  'catch',
  'unresolved',
  'plan',
]);
const eventGroups = {
  changes: ['assign', 'mutate', 'transform'],
  calls: [
    'enter',
    'call',
    'return',
    'await',
    'yield',
    'resume',
    'throw',
    'catch',
  ],
  control: ['branch', 'loop'],
};
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
      filterRevision++;
      filterList();
      renderMethodDetails();
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
  listCursor = -1;
  filterRevision++;
  cachedFilterKey = '';
  searchQuery = undefined;
  flow.steps.forEach((step, index) => {
    const event = flow.trace?.events[index];
    rows.push({ event, step });
  });
  filterList();
}
function filterList() {
  const query = $('search').value.trim().toLowerCase();
  // Snapshot-heavy traces can be large. Materialize searchable text only
  // when a query is active, then reuse its matches during playback.
  if (query !== searchQuery) {
    searchQuery = query;
    searchMatches = query
      ? rows.map(({ event, step }) =>
          JSON.stringify([event, step]).toLowerCase().includes(query),
        )
      : [];
  }
  const kind = $('kind-filter').value;
  const onlyBookmarks =
    $('bookmarks-only').getAttribute('aria-pressed') === 'true';
  const filterKey = [query, kind, onlyBookmarks, filterRevision].join('\0');
  const filterChanged = filterKey !== cachedFilterKey;
  if (filterChanged) {
    cachedFilterKey = filterKey;
    // Playback changes only the selected step, not the prepared filter result.
    // Keep one sorted index and inject a collapsed selected step on demand.
    baseVisible = [];
    rows.forEach(({ event }, i) => {
      const collapsed =
        event &&
        !essentialKinds.has(event.kind) &&
        (!expandedCalls.has(event.callId) ||
          (invocations.get(event.callId)?.stack ?? []).some(
            (callId) => invocations.has(callId) && !expandedCalls.has(callId),
          ));
      const matches =
        kind === 'all' ||
        (kind === 'changes' && changed(event)) ||
        eventGroups[kind]?.includes(event?.kind) ||
        (kind === 'uncertain' &&
          ['assumed', 'unresolved', 'proposed'].includes(event?.certainty));
      if (
        matches &&
        (!query || searchMatches[i]) &&
        (!onlyBookmarks || bookmarks.has(i + 1)) &&
        !(collapsed && kind === 'all' && !query && !onlyBookmarks)
      )
        baseVisible.push(i);
    });
    // A changed filter must reposition the selected step even if the cursor
    // stayed still, and refresh rows even if the new page has the same IDs.
    listSignature = '';
  }
  const selected = cursor - 1;
  let low = 0;
  let high = baseVisible.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (baseVisible[middle] < selected) low = middle + 1;
    else high = middle;
  }
  const isListed = baseVisible[low] === selected;
  const insertSelected =
    cursor > 0 &&
    selected < rows.length &&
    kind === 'all' &&
    !query &&
    !onlyBookmarks &&
    !isListed;
  const count = baseVisible.length + Number(insertSelected);
  if (listCursor !== cursor || filterChanged) {
    if (isListed || insertSelected) listPage = Math.floor(low / LIST_PAGE_SIZE);
    listCursor = cursor;
  }
  const pages = Math.max(1, Math.ceil(count / LIST_PAGE_SIZE));
  listPage = Math.min(listPage, pages - 1);
  const page = [];
  const start = listPage * LIST_PAGE_SIZE;
  for (let i = start; i < Math.min(count, start + LIST_PAGE_SIZE); i++)
    page.push(
      insertSelected && i === low
        ? selected
        : baseVisible[i - Number(insertSelected && i > low)],
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
  $('trace-count').textContent = count + ' / ' + rows.length;
  $('no-events').hidden = count > 0;
}
function renderMethodDetails() {
  const panel = $('method-details');
  panel.hidden = !selectedMethod;
  for (const [name, node] of nodes)
    node.setAttribute(
      'aria-expanded',
      String(invocations.get(selectedMethod)?.symbolId === name),
    );
  if (!selectedMethod) {
    panel.replaceChildren();
    renderedMethod = undefined;
    return;
  }
  if (renderedMethod !== selectedMethod) {
    renderedMethod = selectedMethod;
    const symbol = invocations.get(selectedMethod)?.symbolId;
    const calls = symbolInvocations.get(symbol) ?? [];
    const header = text('div', '', 'method-details-heading');
    header.append(text('strong', symbol ?? '', 'method-details-title'));
    if (calls.length > 1) {
      const label = text('label', 'Invocation ', 'method-invocation-label');
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Select invocation of ' + symbol);
      for (const [index, callId] of calls.entries()) {
        const entry = invocations.get(callId);
        const location = entry.source
          ? ` · ${entry.source.file}:${entry.source.line}`
          : '';
        const option = text('option', `#${index + 1}${location} · ${callId}`);
        option.value = callId;
        select.append(option);
      }
      select.value = selectedMethod;
      select.onchange = () => {
        selectedMethod = select.value;
        expandedCalls.add(selectedMethod);
        renderMethodDetails();
        panel.querySelector('.method-invocation-label select')?.focus({
          preventScroll: true,
        });
      };
      label.append(select);
      header.append(label);
    }
    const branch = (callId, ancestors = new Set()) => {
      const entry = invocations.get(callId);
      const details = document.createElement('details');
      details.dataset.invocation = callId;
      details.append(text('summary', entry.symbolId + ' · ' + callId));
      const body = text('div', '', 'method-events');
      details.append(body);
      let loaded = 0;
      let initialized = false;
      const items = invocationDetails.get(callId) ?? [];
      const lineage = new Set([...ancestors, callId]);
      const appendPage = () => {
        const more = body.querySelector(':scope > .more-method-events');
        more?.remove();
        for (const item of items.slice(loaded, loaded + 50)) {
          if (item.child && !lineage.has(item.child)) {
            body.append(branch(item.child, lineage));
            continue;
          }
          const event = flow.trace.events[item.index];
          const row = text('button', '', 'method-event');
          row.dataset.eventIndex = item.index + 1;
          row.append(text('span', event.kind + ' · ' + event.label));
          if (event.source) {
            row.append(
              text('small', event.source.file + ':' + event.source.line),
            );
            const original = flow.trace.sourceFiles?.[event.source.file];
            if (original !== undefined) {
              if (!sourceCache.has(event.source.file))
                sourceCache.set(event.source.file, original.split(/\r?\n/));
              const line = sourceCache.get(event.source.file)[
                event.source.line - 1
              ];
              if (line !== undefined)
                row.append(text('pre', line, 'method-source'));
            }
          }
          const annotations = [];
          if (event.inputs)
            annotations.push('Inputs: ' + valueText(event.inputs));
          if (Object.hasOwn(event, 'result'))
            annotations.push('Return: ' + valueText(event.result));
          if (Object.hasOwn(event, 'after'))
            annotations.push('Values: ' + valueText(event.after));
          if (event.output !== undefined)
            annotations.push('Output: ' + event.output);
          if (annotations.length)
            row.append(text('pre', annotations.join('\n')));
          row.onclick = () => seek(item.index + 1);
          body.append(row);
        }
        loaded += 50;
        if (loaded < items.length) {
          const next =
            more ?? text('button', 'More prepared steps', 'more-method-events');
          next.onclick = () => {
            appendPage();
            renderMethodDetails();
          };
          body.append(next);
          if (more) next.focus({ preventScroll: true });
        } else if (more) {
          body.lastElementChild?.focus({ preventScroll: true });
        }
      };
      const populate = () => {
        if (details.open && !initialized) {
          initialized = true;
          appendPage();
        }
      };
      details.open = expandedCalls.has(callId);
      populate();
      details.ontoggle = () => {
        details.open ? expandedCalls.add(callId) : expandedCalls.delete(callId);
        populate();
        filterRevision++;
        filterList();
        renderMethodDetails();
      };
      return details;
    };
    panel.replaceChildren(header, branch(selectedMethod));
  }
  for (const details of panel.querySelectorAll('details'))
    if (details.open !== expandedCalls.has(details.dataset.invocation))
      details.open = expandedCalls.has(details.dataset.invocation);
  for (const row of panel.querySelectorAll('.method-event')) {
    if (Number(row.dataset.eventIndex) === cursor)
      row.setAttribute('aria-current', 'step');
    else row.removeAttribute('aria-current');
  }
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
  if (!event?.locals) return undefined;
  const frame = activeFrame(state, event);
  if (frame && Object.hasOwn(event.locals, frame)) {
    const snapshots = frameSnapshots.get(frame) ?? [];
    // Binary search the last earlier snapshot of this exact invocation.
    let low = 0;
    let high = snapshots.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (snapshots[middle] < cursor - 1) low = middle + 1;
      else high = middle;
    }
    if (low) return flow.trace.events[snapshots[low - 1]].locals[frame];
    return undefined;
  }
  // Older agent traces store one flat locals object per event.
  if (
    previousEvent?.locals &&
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
// Token spans decorate original text; do not generate or rewrite source code.
function codeText(tokens) {
  const container = text('span', '', 'code-text');
  for (const token of tokens) {
    if (token.kind)
      container.append(text('span', token.text, 'token-' + token.kind));
    else container.append(document.createTextNode(token.text));
  }
  return container;
}
// Indices are built once per loaded trace and stay ordered across continuation
// chunks. Binary search avoids copying/scanning the whole prefix on each step.
function precedingIndexedEvent(index, key, before) {
  const positions = index.get(key);
  if (!positions?.length) return undefined;
  let low = 0;
  let high = positions.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (positions[middle] < before) low = middle + 1;
    else high = middle;
  }
  return low ? flow.trace.events[positions[low - 1]] : undefined;
}
function renderSource(state, event) {
  const trace = flow.trace;
  if (!$('follow').checked && !pinnedCallId) pinnedCallId = event?.callId;
  const frameId = pinnedCallId ?? activeFrame(state, event);
  const selected = pinnedCallId
    ? precedingIndexedEvent(frameSources, frameId, cursor)
    : event;
  let sourceEvent = selected?.source
    ? selected
    : precedingIndexedEvent(frameSources, frameId, cursor);
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
  if (sourceCode !== undefined && !sourceCache.has(location.file))
    sourceCache.set(location.file, sourceCode.split(/\r?\n/));
  const lines = sourceCode === undefined ? [] : sourceCache.get(location.file);
  if (sourceCode !== undefined && !sourceSyntaxCache.has(location.file))
    sourceSyntaxCache.set(
      location.file,
      prepareSourceHighlighting(lines, location.file),
    );
  // Long files keep only the current source window in the DOM.
  let firstLine = 1;
  if (lines.length > 600) {
    const line = location?.line ?? 1;
    // Retain the existing window while the active line stays inside it.
    // Re-centering on every adjacent line rebuilt hundreds of DOM nodes per
    // playback step, making long files lag even with a virtualized timeline.
    const withinWindow =
      shownSource === sourceKey &&
      line >= shownFirstLine &&
      line <= shownFirstLine + 300;
    firstLine = withinWindow
      ? shownFirstLine
      : Math.min(Math.max(1, line - 150), Math.max(1, lines.length - 300));
  }
  const endLine =
    lines.length > 600 ? Math.min(lines.length, firstLine + 300) : lines.length;
  const needsBuild =
    sourceKey !== shownSource ||
    shownFirstLine !== firstLine ||
    !$('snippet').hasChildNodes();
  if (needsBuild) {
    shownSource = sourceKey;
    shownFirstLine = firstLine;
    sourceRows.clear();
    highlightedSourceRow = undefined;
    if (sourceCode !== undefined) {
      const fragment = document.createDocumentFragment();
      for (let i = firstLine; i <= endLine; i++) {
        const row = text('div', '', 'code-row');
        row.dataset.line = String(i);
        sourceRows.set(i, row);
        const gutter = text('button', String(i), 'code-gutter');
        const stepIndex = sourceLines.get(location.file + ':' + i);
        gutter.type = 'button';
        gutter.title = stepIndex
          ? 'Toggle breakpoint at line ' + i
          : 'No execution recorded on this line';
        gutter.disabled = !stepIndex;
        row.append(gutter, codeText(sourceSyntaxCache.get(location.file)(i)));
        fragment.append(row);
      }
      $('snippet').replaceChildren(fragment);
    } else $('snippet').textContent = sourceEvent?.snippet ?? '';
  }
  $('source-empty').hidden = Boolean(
    sourceCode !== undefined || sourceEvent?.snippet,
  );
  if (needsBuild || shownBreakpointVersion !== sourceBreakpointVersion) {
    shownBreakpointVersion = sourceBreakpointVersion;
    for (const [line, row] of sourceRows) {
      const key = location.file + ':' + line;
      const index = sourceLines.get(key);
      const gutter = row.querySelector('.code-gutter');
      gutter.disabled = !index;
      gutter.title = index
        ? 'Toggle breakpoint at line ' + line
        : 'No execution recorded on this line';
      gutter.onclick = index
        ? () => {
            sourceBreakpoints.has(key)
              ? sourceBreakpoints.delete(key)
              : sourceBreakpoints.add(key);
            sourceBreakpointVersion++;
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
  }
  highlightedSourceRow?.classList.remove('executing-line');
  highlightedSourceRow = undefined;
  const isExecuting =
    sourceEvent?.callId === event?.callId &&
    location?.file === event?.source?.file;
  const active =
    isExecuting && event?.source && sourceRows.get(event.source.line);
  if (active) {
    active.classList.add('executing-line');
    highlightedSourceRow = active;
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
  const positionChanged = renderedFlow !== flow || renderedCursor !== cursor;
  renderedFlow = flow;
  renderedCursor = cursor;
  const recording = flow.trace?.recording;
  const isMock = flowHasMock;
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
  if (positionChanged) {
    animation?.cancel();
    $('canvas').querySelector('.packet')?.remove();
  }
  $('canvas')
    .querySelectorAll('.connections,.canvas-empty')
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
  renderMethodDetails();
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
    inspectedFields = undefined;
    shownSource = '';
    sourceRows.clear();
    highlightedSourceRow = undefined;
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
    before = precedingIndexedEvent(
      objectHistory,
      event.objectId,
      cursor - 1,
    )?.after;
  inspectedFields = { after, before };
  renderInspectedFields();
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
  let packet = $('canvas').querySelector('.packet');
  if (!packet) {
    packet = text('div', '', 'packet');
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
  }
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
    const row = $('event-list').querySelector(
      `.event-row[data-index="${cursor}"]`,
    );
    if (row) {
      const list = $('event-list');
      const top =
        row.getBoundingClientRect().top -
        list.getBoundingClientRect().top +
        list.scrollTop;
      if (
        top < list.scrollTop ||
        top + row.offsetHeight > list.scrollTop + list.clientHeight
      )
        list.scrollTop = Math.max(0, top - list.clientHeight / 2);
    }
  }
  if (
    positionChanged &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches &&
    packet.animate
  )
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
  filterRevision++;
  render();
}
function toggleBreakpoint(index = cursor) {
  if (!index) return;
  breakpoints.has(index) ? breakpoints.delete(index) : breakpoints.add(index);
  sourceBreakpointVersion++;
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
  const suspended = ['await', 'yield'].includes(current?.kind);
  const callId = suspended
    ? current.callId
    : (current?.stack?.at(-1) ?? current.callId);
  const task = current?.values?.task;
  void (async () => {
    let i = cursor;
    while (true) {
      for (; i < events.length; i++) {
        if (task !== undefined && events[i].values?.task !== task) continue;
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
  const suspended = ['await', 'yield'].includes(current.kind);
  const callId = suspended ? current.callId : current.stack?.at(-1);
  const task = current.values?.task;
  if (!callId) return;
  void (async () => {
    let i = cursor;
    while (true) {
      for (; i < events.length; i++) {
        const next = events[i];
        if (task !== undefined && next.values?.task !== task) continue;
        if (
          !next.stack?.includes(callId) &&
          !(['await', 'yield'].includes(next.kind) && next.callId === callId)
        ) {
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
$('timeline').oninput = () => seek(Number($('timeline').value));
const workspace = document.querySelector('.workspace');
const divider = $('workspace-divider');
let layout = {
  inspector: false,
  traceWidth: 220,
  console: false,
  diagram: true,
  sourceShare: 55,
};
try {
  const saved = JSON.parse(localStorage.getItem('code-anime-layout') ?? '{}');
  if (typeof saved.inspector === 'boolean') layout.inspector = saved.inspector;
  if (typeof saved.console === 'boolean') layout.console = saved.console;
  if (typeof saved.diagram === 'boolean') layout.diagram = saved.diagram;
  if (Number.isFinite(saved.sourceShare))
    layout.sourceShare = Math.max(25, Math.min(75, saved.sourceShare));
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
  const center = document.querySelector('.center-column');
  center.classList.toggle('show-flow', layout.diagram);
  center.style.setProperty('--source-share', layout.sourceShare + 'fr');
  center.style.setProperty('--flow-share', 100 - layout.sourceShare + 'fr');
  $('source-flow-divider').setAttribute(
    'aria-valuenow',
    String(layout.sourceShare),
  );
  $('toggle-flow').setAttribute('aria-expanded', String(layout.diagram));
  $('toggle-flow').textContent = layout.diagram
    ? 'Hide diagram'
    : 'Show diagram';
}
function focusPanel(panel) {
  const focused = !workspace.classList.contains(panel + '-focused');
  workspace.classList.remove('source-focused', 'flow-focused');
  if (focused) workspace.classList.add(panel + '-focused');
  for (const name of ['source', 'flow']) {
    const active = focused && name === panel;
    $('maximize-' + name).setAttribute('aria-pressed', String(active));
    $('maximize-' + name).textContent = active ? 'Restore' : 'Focus';
  }
  render();
}
$('toggle-inspector').onclick = () => {
  layout.inspector = !layout.inspector;
  if (layout.inspector) {
    workspace.classList.remove('source-focused', 'flow-focused');
    $('maximize-flow').setAttribute('aria-pressed', 'false');
    $('maximize-flow').textContent = 'Focus';
    $('maximize-source').setAttribute('aria-pressed', 'false');
    $('maximize-source').textContent = 'Focus';
  }
  applyLayout();
  saveLayout();
  render();
};
$('maximize-source').onclick = () => {
  focusPanel('source');
};
$('maximize-flow').onclick = () => focusPanel('flow');
const sourceDivider = $('source-flow-divider');
sourceDivider.onpointerdown = (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  sourceDivider.focus();
  sourceDivider.setPointerCapture(event.pointerId);
};
sourceDivider.onpointermove = (event) => {
  if (!sourceDivider.hasPointerCapture(event.pointerId)) return;
  const bounds = document
    .querySelector('.center-column')
    .getBoundingClientRect();
  layout.sourceShare = Math.round(
    Math.max(
      25,
      Math.min(75, ((event.clientX - bounds.left) / bounds.width) * 100),
    ),
  );
  applyLayout();
};
sourceDivider.onpointerup = (event) => {
  if (sourceDivider.hasPointerCapture(event.pointerId))
    sourceDivider.releasePointerCapture(event.pointerId);
  saveLayout();
  render();
};
sourceDivider.onkeydown = (event) => {
  const next = {
    ArrowLeft: layout.sourceShare - 5,
    ArrowRight: layout.sourceShare + 5,
    Home: 25,
    End: 75,
  }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  event.stopPropagation();
  layout.sourceShare = Math.max(25, Math.min(75, next));
  applyLayout();
  saveLayout();
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
    // Reposition the existing packet after its previously hidden panel is laid out.
    if (button.dataset.mobileView === 'flow') render();
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
  layout.diagram = !layout.diagram;
  applyLayout();
  saveLayout();
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
$('changes-only').onchange = () => {
  $('fields').classList.toggle('changes-only', $('changes-only').checked);
  renderInspectedFields();
};
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
