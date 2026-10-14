import { replayState } from './replay.js';
import { prepareSourceHighlighting } from './source-highlighter.js';
import {
  buildFlowOverview,
  buildMethodGroups,
  describeFlowTransition,
  parentInvocationId,
} from './flow-overview.js';
import { preparePlainTerminalOutput } from './terminal-text.js';
const $ = (id) => document.getElementById(id);
let flow, originalFlow, timer, animation;
let cursor = 0;
let renderedFlow;
let renderedCursor = -1;
let renderedConnection;
let traceRevision = 0;
let renderedInspectorRevision = -1;
let inspectedFrame;
let inspectedState;
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
let shownSourceVisitRevision = -1;
let manualSourceWindow;
const sourceRows = new Map();
let highlightedSourceRow;
let sourceStackCalls;
let inspectorStackCalls;
let sourceBreakpointVersion = 0;
let shownBreakpointVersion = -1;
let pinnedCallId;
let inspectedSourceEvent;
let revealInspectedSource = false;
let lastConsoleText = '';
let consolePageBack = 0;
const CONSOLE_PAGE_SIZE = 300;
const sourceLines = new Map();
const sourceLineVisits = new Map();
const sourceCache = new Map();
const sourceSyntaxCache = new Map();
const consoleEvents = [];
const frameSnapshots = new Map();
const frameSources = new Map();
const objectHistory = new Map();
let overviewItems = [];
let methodMap = { invocations: [], classCount: 0 };
let methodMapPositions = new Map();
let methodMapPage = 0;
let methodMapExpanded = true;
const METHOD_MAP_PAGE_SIZE = 10;
let overviewRenderedMethodMapPage = -1;
let overviewPage = 0;
let overviewRenderedPage = -1;
let overviewLastCursor = -1;
const OVERVIEW_PAGE_SIZE = 6;
let overviewRenderedPageSize = OVERVIEW_PAGE_SIZE;
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
// Stack rows are rebuilt when an invocation enters or returns. When a
// keyboard user is inspecting one of those rows, move focus to the same
// invocation or its closest surviving caller rather than losing focus with
// the detached DOM node. Other focused controls are never disturbed.
function replaceStackControls(container, previous, current, fragment) {
  const buttons = [...container.querySelectorAll('button.stack-link')];
  const focusedIndex = buttons.indexOf(document.activeElement);
  let nextIndex = -1;
  if (focusedIndex >= 0) {
    for (let index = focusedIndex; index >= 0; index--) {
      nextIndex = current.indexOf(previous?.[index]);
      if (nextIndex >= 0) break;
    }
  }
  if (fragment) container.replaceChildren(fragment);
  else container.replaceChildren();
  if (focusedIndex >= 0) {
    const target =
      container.querySelectorAll('button.stack-link')[nextIndex] ?? $('play');
    target.focus({ preventScroll: true });
  }
}
function setStatus(value) {
  // Status is a live region. Writing the same text for every render can
  // repeatedly announce it when a user steps or resizes the workspace.
  if ($('status').textContent !== value) $('status').textContent = value;
}
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
  traceRevision++;
  nodes.clear();
  invocations.clear();
  invocationPositions.clear();
  invocationDetails.clear();
  symbolInvocations.clear();
  renderedMethod = undefined;
  if (!preserveInspection) selectedMethod = undefined;
  if (!preserveInspection) {
    overviewPage = 0;
    overviewLastCursor = -1;
    methodMapPage = 0;
    methodMapExpanded = true;
    expandedCalls.clear();
    fieldDisclosures.clear();
    fieldPageCounts.clear();
    pinnedCallId = undefined;
    inspectedSourceEvent = undefined;
    shownSource = '';
    manualSourceWindow = undefined;
    lastConsoleText = '';
    consolePageBack = 0;
  }
  sourceLines.clear();
  sourceLineVisits.clear();
  // Continuations are checked for source-content equality before they are
  // appended. Keep prepared lines and lexical context for those files;
  // replaying a new chunk must not re-tokenize multi-megabyte sources.
  if (!preserveInspection) {
    sourceCache.clear();
    sourceSyntaxCache.clear();
  }
  sourceStackCalls = undefined;
  inspectorStackCalls = undefined;
  sourceBreakpointVersion++;
  consoleEvents.length = 0;
  const preparedOutput = preparePlainTerminalOutput(flow.trace?.events);
  frameSnapshots.clear();
  frameSources.clear();
  objectHistory.clear();
  flowHasMock = Boolean(
    flow.trace?.simulation ||
    flow.trace?.events.some((e) =>
      ['mock', 'assumed', 'proposed'].includes(e.certainty),
    ),
  );
  overviewItems = buildFlowOverview(flow.trace?.events, preparedOutput);
  methodMap = buildMethodGroups(flow.trace?.events);
  methodMapPositions = new Map(
    methodMap.invocations.map((entry, index) => [entry.callId, index]),
  );
  // Legacy agent-authored flows have ordered handoffs but no recorded runtime
  // events. Present that known structure immediately, with explicit evidence
  // labels, instead of hiding every node in an empty Focus view at step zero.
  if (!overviewItems.length && !flow.trace?.events?.length)
    overviewItems = flow.steps.map((step, index) => ({
      startIndex: index + 1,
      index: index + 1,
      kind: 'structural',
      label: `${step.from} → ${step.to}: ${step.dtoName}`,
      from: step.from,
      to: step.to,
      operation: step.dtoName,
      certainty: 'unverified',
      depth: 0,
    }));
  overviewRenderedPage = -1;
  // The Focus diagram remains available for a trace without overview events.
  if (!overviewItems.length && $('view-mode').value === 'path')
    $('view-mode').value = 'focus';
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
      const parent = parentInvocationId(event);
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
    if (event.kind === 'console' && event.output !== undefined) {
      consoleEvents.push({
        index: index + 1,
        display: preparedOutput[index],
      });
    }
    if (!event.source) return;
    if (!frameSources.has(event.callId)) frameSources.set(event.callId, []);
    frameSources.get(event.callId).push(index);
    const key = event.source.file + ':' + event.source.line;
    if (!sourceLines.has(key)) sourceLines.set(key, index + 1);
    if (!sourceLineVisits.has(key)) sourceLineVisits.set(key, []);
    sourceLineVisits.get(key).push(index + 1);
  });
  clearConnection();
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
function replaceEventListControls(container, fragment) {
  const focused = document.activeElement;
  const ownsFocus = focused && container.contains(focused);
  const focusedIndex = focused?.classList?.contains('event-row')
    ? Number(focused.dataset.index)
    : undefined;
  const focusedCall = focused?.classList?.contains('call-disclosure')
    ? focused.dataset.callId
    : undefined;
  const focusedPageAction = focused?.closest?.('.event-pages')
    ? focused.textContent
    : undefined;
  container.replaceChildren(fragment);
  if (!ownsFocus) return;

  const buttons = [...container.querySelectorAll('button')];
  let target = buttons.find(
    (button) =>
      (focusedIndex &&
        button.classList.contains('event-row') &&
        Number(button.dataset.index) === focusedIndex) ||
      (focusedCall &&
        button.classList.contains('call-disclosure') &&
        button.dataset.callId === focusedCall) ||
      (focusedPageAction &&
        button.closest('.event-pages') &&
        button.textContent === focusedPageAction &&
        !button.disabled),
  );
  if (!target && focusedPageAction)
    target = buttons.find(
      (button) => button.closest('.event-pages') && !button.disabled,
    );
  if (!target) {
    const visibleRows = buttons.filter((button) =>
      button.classList.contains('event-row'),
    );
    target = focusedIndex
      ? visibleRows.reduce(
          (nearest, row) =>
            !nearest ||
            Math.abs(Number(row.dataset.index) - focusedIndex) <
              Math.abs(Number(nearest.dataset.index) - focusedIndex)
              ? row
              : nearest,
          undefined,
        )
      : visibleRows[0];
  }
  (target ?? $('search')).focus({ preventScroll: true });
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
    replaceEventListControls($('event-list'), fragment);
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
          // A final page may end with a nested <details> branch. The details
          // element itself cannot receive keyboard focus; its summary can.
          const last = body.lastElementChild;
          const focusTarget = last?.matches('details')
            ? last.querySelector(':scope > summary')
            : last;
          focusTarget?.focus({ preventScroll: true });
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
      // Native <details> toggle events are dispatched asynchronously. Capture
      // user activation immediately so another pending toggle cannot render
      // against stale disclosure state and close a newly opened child.
      details
        .querySelector(':scope > summary')
        .addEventListener('click', () => {
          if (details.open) expandedCalls.delete(callId);
          else expandedCalls.add(callId);
        });
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
  revealInspectedSource = true;
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
// The source editor navigates the same prepared replay as the timeline. Loop
// lines can be visited repeatedly, including by different call frames; visit
// order must be based on recorded sequence numbers, never source line order.
function adjacentSourceVisit(key, backward = false) {
  const visits = sourceLineVisits.get(key);
  if (!visits?.length) return;
  let low = 0;
  let high = visits.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (visits[middle] < cursor || (!backward && visits[middle] === cursor))
      low = middle + 1;
    else high = middle;
  }
  return backward
    ? (visits[low - 1] ?? visits.at(-1))
    : (visits[low] ?? visits[0]);
}
function renderSource(state, event, initial = false) {
  const trace = flow.trace;
  if (!initial && !$('follow').checked && !pinnedCallId)
    pinnedCallId = event?.callId;
  const frameId = pinnedCallId ?? activeFrame(state, event);
  const selected = pinnedCallId
    ? precedingIndexedEvent(frameSources, frameId, cursor)
    : event;
  let sourceEvent = initial
    ? event
    : selected?.source
      ? selected
      : precedingIndexedEvent(frameSources, frameId, cursor);
  if (!$('follow').checked && !sourceEvent) sourceEvent = inspectedSourceEvent;
  if (sourceEvent && !initial) inspectedSourceEvent = sourceEvent;
  const location = sourceEvent?.source;
  const sourceCode = location ? trace?.sourceFiles?.[location.file] : undefined;
  $('source').textContent = location?.file ?? 'No source location recorded';
  $('source').title = location?.generated
    ? `Original source mapped from V8 location ${location.generated.file}:${location.generated.line}; source-map content verified against the project file`
    : '';
  $('source-line').textContent =
    location && !initial ? 'L' + location.line : '—';
  // A captured file is immutable within a trace (including continuations).
  // Use its path as the display key instead of copying up to 2 MiB of source
  // into a new string every time playback or inspection calls renderSource.
  // Excerpt-only events still depend on their snippet text.
  const sourceKey =
    sourceCode === undefined
      ? 'excerpt:' + (location?.file ?? '') + ':' + (sourceEvent?.snippet ?? '')
      : 'file:' + location.file;
  if (
    $('follow').checked ||
    revealInspectedSource ||
    manualSourceWindow?.key !== sourceKey
  )
    manualSourceWindow = undefined;
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
  if (manualSourceWindow) firstLine = manualSourceWindow.first;
  const endLine =
    lines.length > 600 ? Math.min(lines.length, firstLine + 300) : lines.length;
  $('source-pages').hidden = lines.length <= 600;
  $('source-range').textContent = `${firstLine}–${endLine} of ${lines.length}`;
  $('source-earlier').disabled = firstLine === 1;
  $('source-later').disabled = endLine === lines.length;
  const browseSource = (direction) => {
    $('follow').checked = false;
    pinnedCallId = sourceEvent?.callId;
    manualSourceWindow = {
      key: sourceKey,
      first: Math.max(
        1,
        Math.min(lines.length - 300, firstLine + direction * 301),
      ),
    };
    render();
    const control = $(direction < 0 ? 'source-earlier' : 'source-later');
    (control.disabled ? $('source-resume') : control).focus({
      preventScroll: true,
    });
  };
  $('source-earlier').onclick = () => browseSource(-1);
  $('source-later').onclick = () => browseSource(1);
  $('source-resume').onclick = () => {
    $('follow').checked = true;
    $('follow').dispatchEvent(new Event('change'));
  };
  const needsBuild =
    sourceKey !== shownSource ||
    shownFirstLine !== firstLine ||
    !$('snippet').hasChildNodes();
  let focusedSourceGutter;
  let focusedSourceJump;
  if (needsBuild) {
    const focused = document.activeElement;
    if ($('snippet').contains(focused) && focused?.matches('.code-gutter'))
      focusedSourceGutter = {
        line: Number(focused.parentElement.dataset.line),
        sameSource: sourceKey === shownSource,
      };
    if ($('snippet').contains(focused) && focused?.matches('.code-jump'))
      focusedSourceJump = {
        line: Number(focused.parentElement.dataset.line),
        sameSource: sourceKey === shownSource,
      };
    if (sourceKey !== shownSource) $('snippet').scrollLeft = 0;
    // A manual inspection must not inherit an unrelated viewport when the
    // source file or a large file's virtualized source window changes.
    // Automatic following handles its own active line.
    if (
      !$('follow').checked &&
      (sourceKey !== shownSource || shownFirstLine !== firstLine)
    )
      $('snippet').scrollTop = 0;
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
        gutter.setAttribute(
          'aria-label',
          stepIndex
            ? 'Set breakpoint at line ' + i
            : 'Line ' + i + ': no recorded execution',
        );
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
  if (needsBuild || shownSourceVisitRevision !== traceRevision) {
    shownSourceVisitRevision = traceRevision;
    // New prepared continuations can add visits to lines in a source window
    // already on screen. Refresh only those row controls, leaving the source
    // tokens and editor scroll position intact.
    for (const [line, row] of sourceRows) {
      const key = location.file + ':' + line;
      const visits = sourceLineVisits.get(key);
      if (!visits?.length) continue;
      let jump = row.querySelector('.code-jump');
      if (!jump) {
        // Keep the source and its syntax tokens as selectable source text.
        // This small action occupies the existing source indent instead of
        // turning the user's original statement into a button.
        jump = text('button', '', 'code-jump');
        jump.type = 'button';
        row.insertBefore(jump, row.querySelector('.code-text'));
      }
      jump.title = `Next recorded execution of line ${line} (${visits.length} loaded visit${visits.length === 1 ? '' : 's'})`;
      jump.setAttribute('aria-label', jump.title);
      jump.setAttribute(
        'aria-description',
        'Shift+Enter or Shift+Space jumps to the previous recorded visit; Shift+click works with a pointer.',
      );
      const navigate = (backward) => {
        const position = adjacentSourceVisit(key, backward);
        if (position === undefined) return;
        // Use the selected event's original frame and source location.
        $('follow').checked = true;
        pinnedCallId = undefined;
        manualSourceWindow = undefined;
        seek(position);
      };
      jump.onclick = (event) => navigate(event.shiftKey);
      jump.onkeydown = (event) => {
        if (!event.shiftKey || (event.key !== 'Enter' && event.key !== ' '))
          return;
        event.preventDefault();
        navigate(true);
      };
    }
  }
  if (needsBuild || shownBreakpointVersion !== sourceBreakpointVersion) {
    shownBreakpointVersion = sourceBreakpointVersion;
    // A line may run several times (for example, inside a loop). The gutter
    // represents every event breakpoint on that source line, not just the
    // first event stored in sourceLines.
    const eventBreakpointSources = new Set(
      [...breakpoints].map((step) =>
        sourceLocationKey(flow?.trace?.events[step - 1]?.source),
      ),
    );
    for (const [line, row] of sourceRows) {
      const key = location.file + ':' + line;
      const index = sourceLines.get(key);
      const gutter = row.querySelector('.code-gutter');
      const marked =
        sourceBreakpoints.has(key) || eventBreakpointSources.has(key);
      gutter.disabled = !index;
      gutter.title = index
        ? 'Toggle breakpoint at line ' + line
        : 'No execution recorded on this line';
      gutter.setAttribute(
        'aria-label',
        !index
          ? `Line ${line}: no recorded execution`
          : marked
            ? `Remove breakpoint at line ${line}`
            : `Set breakpoint at line ${line}`,
      );
      gutter.onclick = index
        ? () => {
            if (marked) {
              sourceBreakpoints.delete(key);
              for (const step of breakpoints) {
                if (
                  sourceLocationKey(flow?.trace?.events[step - 1]?.source) ===
                  key
                )
                  breakpoints.delete(step);
              }
            } else sourceBreakpoints.add(key);
            sourceBreakpointVersion++;
            render();
          }
        : null;
      row.classList.toggle('has-breakpoint', marked);
      gutter.setAttribute('aria-pressed', String(marked));
    }
  }
  const isExecuting =
    !initial &&
    sourceEvent?.callId === event?.callId &&
    location?.file === event?.source?.file;
  const active =
    isExecuting && event?.source && sourceRows.get(event.source.line);
  if (highlightedSourceRow !== active) {
    highlightedSourceRow?.classList.remove('executing-line');
    highlightedSourceRow?.removeAttribute('aria-current');
    highlightedSourceRow = undefined;
  }
  if (active) {
    active.classList.add('executing-line');
    active.setAttribute('aria-current', 'location');
    highlightedSourceRow = active;
  }
  // Explicit stack navigation reveals the selected method's source even when
  // automatic following is off. Subsequent playback leaves that viewport alone.
  const revealRow = revealInspectedSource
    ? sourceRows.get(location?.line)
    : undefined;
  revealInspectedSource = false;
  const scrollRow = $('follow').checked ? active : revealRow;
  if (scrollRow) {
    const editor = $('snippet');
    const rowBounds = scrollRow.getBoundingClientRect();
    const editorBounds = editor.getBoundingClientRect();
    // Scroll only when the target line is outside the visible editor area.
    if (rowBounds.top < editorBounds.top)
      editor.scrollTop += rowBounds.top - editorBounds.top;
    else if (rowBounds.bottom > editorBounds.bottom)
      editor.scrollTop += rowBounds.bottom - editorBounds.bottom;
  }
  if (focusedSourceGutter) {
    const originalGutter = focusedSourceGutter.sameSource
      ? sourceRows.get(focusedSourceGutter.line)?.querySelector('.code-gutter')
      : null;
    const activeGutter = active?.querySelector('.code-gutter');
    // A virtual-window change may retain the same line; a cross-file jump
    // should follow the executing line. Never focus a disabled gutter.
    const target = [originalGutter, activeGutter].find(
      (button) => button && !button.disabled,
    );
    (target ?? $('follow')).focus({ preventScroll: true });
  }
  if (focusedSourceJump) {
    const target = focusedSourceJump.sameSource
      ? sourceRows.get(focusedSourceJump.line)?.querySelector('.code-jump')
      : undefined;
    (target ?? active?.querySelector('.code-jump') ?? $('follow')).focus({
      preventScroll: true,
    });
  }
  if (
    sourceStackCalls?.length !== state.stack.length ||
    state.stack.some((callId, index) => sourceStackCalls[index] !== callId)
  ) {
    const previous = sourceStackCalls;
    sourceStackCalls = [...state.stack];
    const fragment = document.createDocumentFragment();
    for (const callId of state.stack) {
      const frame = invocations.get(callId);
      const button = text('button', frame?.symbolId ?? callId, 'stack-link');
      button.title = frame?.source?.file ?? callId;
      button.onclick = () => inspectFrame(callId);
      fragment.append(button);
    }
    replaceStackControls(
      $('source-stack'),
      previous,
      sourceStackCalls,
      fragment,
    );
  }
  for (const [index, button] of [
    ...$('source-stack').querySelectorAll('button'),
  ].entries())
    button.classList.toggle(
      'selected',
      (pinnedCallId ?? event?.callId) === sourceStackCalls[index],
    );
}
function renderConsole() {
  const history = $('console-history');
  const older = $('console-older');
  const newer = $('console-newer');
  // Capture focus before disabling a boundary button or hiding the history
  // navigation; either action can drop keyboard focus to the document body.
  const focusedHistoryButton = [older, newer].find(
    (button) => button === document.activeElement,
  );
  let lo = 0,
    hi = consoleEvents.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (consoleEvents[mid].index <= cursor) lo = mid + 1;
    else hi = mid;
  }
  const maxPage = Math.max(0, Math.ceil(lo / CONSOLE_PAGE_SIZE) - 1);
  consolePageBack = Math.min(consolePageBack, maxPage);
  const end = Math.max(0, lo - consolePageBack * CONSOLE_PAGE_SIZE);
  const start = Math.max(0, end - CONSOLE_PAGE_SIZE);
  const value = consoleEvents
    .slice(start, end)
    .map((e) => e.display)
    .join(flow.trace?.recording ? '' : '\n');
  if (value !== lastConsoleText) {
    $('console-output').textContent = value;
    lastConsoleText = value;
  }
  $('console-count').textContent = lo + ' events';
  history.hidden = lo <= CONSOLE_PAGE_SIZE;
  $('console-range').textContent = `${start + 1}–${end} of ${lo} events`;
  older.disabled = start === 0;
  newer.disabled = consolePageBack === 0;
  if (focusedHistoryButton) {
    if (history.hidden)
      $('console-panel').querySelector('summary')?.focus({
        preventScroll: true,
      });
    else if (focusedHistoryButton.disabled)
      (focusedHistoryButton === older ? newer : older).focus({
        preventScroll: true,
      });
  }
}
$('console-older').onclick = () => {
  consolePageBack++;
  renderConsole();
};
$('console-newer').onclick = () => {
  consolePageBack = Math.max(0, consolePageBack - 1);
  renderConsole();
};
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
    sourceAvailabilityCache.delete(currentFlow.trace);
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
function clearConnection() {
  renderedConnection?.svg.remove();
  renderedConnection = undefined;
}
function drawConnection(from, to) {
  const canvas = $('canvas');
  if (
    !renderedConnection ||
    renderedConnection.from !== from ||
    renderedConnection.to !== to ||
    !renderedConnection.svg.isConnected
  ) {
    clearConnection();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('connections');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.classList.add('connection-path');
    svg.append(path);
    canvas.append(svg);
    renderedConnection = { from, to, svg, path, geometry: '' };
  }
  const x1 = from.offsetLeft + from.offsetWidth / 2,
    x2 = to.offsetLeft + to.offsetWidth / 2;
  const y1 = from.offsetTop + from.offsetHeight,
    y2 = to.offsetTop + to.offsetHeight;
  // Include panel dimensions: resizing can change the overlay even when the
  // two node positions remain fixed. Do not rebuild it on inspector updates.
  const width = Math.max(
    canvas.clientWidth,
    from.offsetLeft + from.offsetWidth,
    to.offsetLeft + to.offsetWidth,
  );
  const height = canvas.clientHeight;
  const geometry = [x1, y1, x2, y2, width, height].join(':');
  if (renderedConnection.geometry === geometry) return;
  renderedConnection.geometry = geometry;
  renderedConnection.svg.style.width = width + 'px';
  renderedConnection.svg.style.height = height + 'px';
  renderedConnection.path.setAttribute(
    'd',
    `M ${x1} ${y1} C ${x1 + (from === to ? 60 : 0)} ${y1 + 45}, ${x2 - (from === to ? 60 : 0)} ${y2 + 45}, ${x2} ${y2}`,
  );
}
function activeOverviewPosition() {
  if (!cursor) return -1;
  let low = 0;
  let high = overviewItems.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (overviewItems[middle].startIndex <= cursor) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}
function overviewPageSize() {
  if (window.innerWidth < 1101 || window.innerHeight < 800)
    return OVERVIEW_PAGE_SIZE;
  return Math.max(
    OVERVIEW_PAGE_SIZE,
    Math.min(24, Math.floor(($('canvas').clientHeight - 82) / 36)),
  );
}
function activeMethodMapPosition() {
  if (!cursor) return -1;
  const entries = methodMap.invocations;
  // An interleaved task can resume an invocation entered many pages earlier.
  // Follow its observed event identity, not the last entry in event order.
  const activeCallId = flow.trace?.events?.[cursor - 1]?.callId;
  const activePosition = methodMapPositions.get(activeCallId);
  if (activePosition !== undefined && entries[activePosition]?.index <= cursor)
    return activePosition;
  let low = 0;
  let high = entries.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (entries[middle].index <= cursor) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}
function renderMethodMap(panel) {
  if (!methodMap.invocations.length) return;
  const section = text('section', '', 'overview-method-map');
  section.setAttribute('aria-label', 'Prepared method call map');
  const toggle = text('button', '', 'overview-method-toggle');
  toggle.type = 'button';
  toggle.dataset.methodMapAction = 'toggle';
  toggle.setAttribute('aria-expanded', String(methodMapExpanded));
  toggle.setAttribute('aria-controls', 'overview-method-groups');
  toggle.append(
    text('span', methodMapExpanded ? '▾' : '▸', 'method-map-chevron'),
    text('strong', 'Class / method map'),
    text(
      'span',
      `${methodMap.classCount} groups · ${methodMap.invocations.length} calls`,
      'method-map-count',
    ),
  );
  toggle.onclick = () => {
    methodMapExpanded = !methodMapExpanded;
    overviewRenderedPage = -1;
    renderFlowOverview();
    $('canvas').querySelector('.overview-method-toggle')?.focus({
      preventScroll: true,
    });
  };
  section.append(toggle);
  const container = text('div', '', 'overview-method-content');
  container.id = 'overview-method-groups';
  container.hidden = !methodMapExpanded;
  if (methodMapExpanded) {
    const start = methodMapPage * METHOD_MAP_PAGE_SIZE;
    const entries = methodMap.invocations.slice(
      start,
      start + METHOD_MAP_PAGE_SIZE,
    );
    const groups = new Map();
    for (const entry of entries) {
      if (!groups.has(entry.className)) groups.set(entry.className, []);
      groups.get(entry.className).push(entry);
    }
    const cards = text('div', '', 'method-map-groups');
    for (const [className, methods] of groups) {
      const group = text('section', '', 'method-map-group');
      group.setAttribute('aria-label', `${className} methods`);
      group.append(text('strong', `◇ ${className}`, 'method-map-class'));
      for (const item of methods) {
        const method = text('button', '', 'method-map-call');
        method.type = 'button';
        method.dataset.callId = item.callId;
        method.dataset.eventIndex = String(item.index);
        method.append(
          text(
            'span',
            `↳ ${item.methodName}${item.methodName === '<module>' ? '' : '()'}`,
            'method-map-name',
          ),
        );
        if (item.parentKnown)
          method.append(
            text('small', `← ${item.parentSymbol}`, 'method-map-parent'),
          );
        else if (item.parentCallId)
          method.append(
            text('small', 'Parent unavailable', 'method-map-parent'),
          );
        else method.append(text('small', 'Entry point', 'method-map-parent'));
        method.title = `${item.symbol} · ${item.callId} · ${item.certainty}`;
        method.setAttribute(
          'aria-label',
          `Inspect ${item.symbol} invocation ${item.callId} (${item.certainty})`,
        );
        method.onclick = () => {
          selectedMethod = item.callId;
          expandedCalls.add(item.callId);
          renderedMethod = undefined;
          seek(item.index);
          renderMethodDetails();
        };
        group.append(method);
      }
      cards.append(group);
    }
    container.append(cards);
    const pageCount = Math.ceil(
      methodMap.invocations.length / METHOD_MAP_PAGE_SIZE,
    );
    if (pageCount > 1) {
      const footer = text('div', '', 'method-map-pages');
      const previous = text('button', '←', 'quiet-button');
      previous.dataset.methodMapAction = 'previous';
      previous.disabled = methodMapPage === 0;
      const next = text('button', '→', 'quiet-button');
      next.dataset.methodMapAction = 'next';
      next.disabled = methodMapPage === pageCount - 1;
      const changePage = (delta) => {
        methodMapPage += delta;
        overviewRenderedPage = -1;
        renderFlowOverview();
        const controls = [
          ...$('canvas').querySelectorAll('.method-map-pages button'),
        ];
        const preferred = delta > 0 ? controls.at(-1) : controls[0];
        (preferred?.disabled
          ? controls.find((button) => !button.disabled)
          : preferred
        )?.focus({ preventScroll: true });
      };
      previous.onclick = () => changePage(-1);
      next.onclick = () => changePage(1);
      footer.append(
        previous,
        text('span', `${methodMapPage + 1} / ${pageCount}`),
        next,
      );
      container.append(footer);
    }
  }
  section.append(container);
  panel.append(section);
}
function renderFlowOverview() {
  if (!overviewItems.length) return false;
  const pageSize = overviewPageSize();
  if (pageSize !== overviewRenderedPageSize) {
    overviewPage = Math.floor(
      (overviewPage * overviewRenderedPageSize) / pageSize,
    );
    overviewRenderedPageSize = pageSize;
    overviewRenderedPage = -1;
  }
  const activePosition = activeOverviewPosition();
  const activeMethod = activeMethodMapPosition();
  const maxPage = Math.ceil(overviewItems.length / pageSize) - 1;
  if (overviewLastCursor !== cursor && $('follow').checked) {
    overviewPage =
      activePosition >= 0 ? Math.floor(activePosition / pageSize) : 0;
    methodMapPage =
      activeMethod >= 0 ? Math.floor(activeMethod / METHOD_MAP_PAGE_SIZE) : 0;
  }
  methodMapPage = Math.min(
    methodMapPage,
    Math.max(
      0,
      Math.ceil(methodMap.invocations.length / METHOD_MAP_PAGE_SIZE) - 1,
    ),
  );
  overviewLastCursor = cursor;
  overviewPage = Math.min(overviewPage, maxPage);
  let panel = $('canvas').querySelector('.flow-overview');
  if (
    !panel ||
    overviewRenderedPage !== overviewPage ||
    overviewRenderedMethodMapPage !== methodMapPage
  ) {
    const focusedControl = panel?.contains(document.activeElement)
      ? document.activeElement
      : null;
    const focusedPosition = focusedControl?.dataset.overviewPosition;
    const focusedCallId = focusedControl?.dataset.callId;
    const focusedPageAction = focusedControl?.dataset.overviewPage;
    const focusedMethodAction = focusedControl?.dataset.methodMapAction;
    panel?.remove();
    panel = text('section', '', 'flow-overview');
    panel.setAttribute('aria-label', 'Prepared execution overview');
    const heading = text('div', '', 'overview-heading');
    const structural = overviewItems[0]?.kind === 'structural';
    const sparseStructural = structural && overviewItems.length <= 6;
    panel.classList.toggle('overview-sparse', sparseStructural);
    heading.append(
      text(
        'strong',
        structural ? 'Structural path · unverified' : 'Execution path',
      ),
      text(
        'span',
        `${overviewItems.length} transitions · ${structural ? 'no runtime observations' : 'select to inspect'}`,
      ),
    );
    panel.append(heading);
    renderMethodMap(panel);
    const list = text('div', '', 'overview-list');
    const start = overviewPage * pageSize;
    for (const [offset, item] of overviewItems
      .slice(start, start + pageSize)
      .entries()) {
      const entry = text('div', '', 'overview-entry');
      const button = text('button', '', 'overview-step');
      button.type = 'button';
      button.dataset.overviewPosition = String(start + offset);
      button.dataset.eventIndex = String(item.index);
      button.style.setProperty(
        '--overview-depth',
        String(Math.min(5, item.depth ?? 0)),
      );
      if (sparseStructural && item.from && item.to) {
        const route = text('span', '', 'overview-route');
        route.append(
          text('span', item.from, 'overview-route-symbol'),
          text('span', '→', 'overview-route-arrow'),
          text('span', item.to, 'overview-route-symbol'),
        );
        const description = text('span', '', 'overview-route-content');
        description.append(route);
        if (item.operation)
          description.append(
            text('span', item.operation, 'overview-operation'),
          );
        button.append(
          text('span', String(item.index), 'overview-index'),
          description,
          text('span', item.certainty ?? 'unverified', 'overview-evidence'),
        );
      } else {
        button.append(
          text('span', String(item.index), 'overview-index'),
          text('span', describeFlowTransition(item), 'overview-description'),
          text('span', item.certainty ?? 'unverified', 'overview-evidence'),
        );
      }
      button.title = describeFlowTransition(item);
      button.onclick = () => seek(item.index);
      entry.append(button);
      // The method inspector already owns the nested, paged execution tree.
      // Open it directly from the overview without changing playback position.
      if (item.kind === 'enter' && invocations.has(item.callId)) {
        const disclosure = text('button', '', 'overview-disclosure');
        const expanded = selectedMethod === item.callId;
        disclosure.type = 'button';
        disclosure.dataset.callId = item.callId;
        disclosure.textContent = expanded ? '▾' : '▸';
        disclosure.setAttribute('aria-controls', 'method-details');
        disclosure.setAttribute('aria-expanded', String(expanded));
        disclosure.setAttribute(
          'aria-label',
          (expanded ? 'Close details for ' : 'Inspect ') +
            item.symbol +
            ' invocation',
        );
        disclosure.onclick = () => {
          selectedMethod =
            selectedMethod === item.callId ? undefined : item.callId;
          if (selectedMethod) expandedCalls.add(selectedMethod);
          filterRevision++;
          filterList();
          renderMethodDetails();
          overviewRenderedPage = -1;
          renderFlowOverview();
          $('canvas')
            .querySelector(
              `.overview-disclosure[data-call-id="${item.callId}"]`,
            )
            ?.focus({ preventScroll: true });
        };
        entry.append(disclosure);
      }
      list.append(entry);
    }
    panel.append(list);
    if (maxPage > 0) {
      const footer = text('div', '', 'overview-pages');
      const previous = text('button', '← Earlier', 'quiet-button');
      previous.dataset.overviewPage = 'previous';
      previous.disabled = overviewPage === 0;
      const movePage = (delta) => {
        overviewPage += delta;
        renderFlowOverview();
        const buttons = [
          ...$('canvas').querySelectorAll('.overview-pages button'),
        ];
        const preferred = delta < 0 ? buttons[0] : buttons.at(-1);
        const focusTarget = preferred?.disabled
          ? buttons.find((button) => !button.disabled)
          : preferred;
        focusTarget?.focus({ preventScroll: true });
      };
      previous.onclick = () => movePage(-1);
      const next = text('button', 'Later →', 'quiet-button');
      next.dataset.overviewPage = 'next';
      next.disabled = overviewPage === maxPage;
      next.onclick = () => movePage(1);
      footer.append(
        previous,
        text('span', `${overviewPage + 1} / ${maxPage + 1}`),
        next,
      );
      panel.append(footer);
    }
    $('canvas').append(panel);
    // Following, seeking, or resizing can replace the page while a keyboard
    // user is inspecting its controls. Restore the same control if available;
    // otherwise move to the active transition on the newly visible page.
    if (focusedControl) {
      const focusedMethod =
        focusedCallId &&
        [...panel.querySelectorAll('.method-map-call')].find(
          (button) => button.dataset.callId === focusedCallId,
        );
      const focusedMethodControl =
        focusedMethodAction &&
        [...panel.querySelectorAll('[data-method-map-action]')].find(
          (button) =>
            button.dataset.methodMapAction === focusedMethodAction &&
            !button.disabled,
        );
      const visibleSteps = [...panel.querySelectorAll('.overview-step')];
      const focusedStep = visibleSteps.find(
        (button) => button.dataset.overviewPosition === focusedPosition,
      );
      const focusedDisclosure = [
        ...panel.querySelectorAll('.overview-disclosure'),
      ].find((button) => button.dataset.callId === focusedCallId);
      const pageControls = [
        ...panel.querySelectorAll('.overview-pages button:not(:disabled)'),
      ];
      const focusedPage = pageControls.find(
        (button) => button.dataset.overviewPage === focusedPageAction,
      );
      const activeStep = visibleSteps.find(
        (button) => Number(button.dataset.overviewPosition) === activePosition,
      );
      const nearestStep = visibleSteps.reduce((closest, button) => {
        if (!closest) return button;
        return Math.abs(
          Number(button.dataset.overviewPosition) - focusedPosition,
        ) < Math.abs(Number(closest.dataset.overviewPosition) - focusedPosition)
          ? button
          : closest;
      }, null);
      (
        focusedMethod ??
        focusedMethodControl ??
        focusedStep ??
        focusedDisclosure ??
        focusedPage ??
        activeStep ??
        (focusedPageAction ? pageControls[0] : null) ??
        nearestStep
      )?.focus({ preventScroll: true });
    }
    overviewRenderedPage = overviewPage;
    overviewRenderedMethodMapPage = methodMapPage;
  }
  // Only the active-row state changes during normal replay. Reuse the DOM and
  // let the source editor, stack, and console follow the same replay cursor.
  for (const button of panel.querySelectorAll('.overview-step')) {
    const isCurrent =
      Number(button.dataset.overviewPosition) === activePosition;
    button.classList.toggle('current', isCurrent);
    if (isCurrent) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
  const activeCallId = flow.trace?.events[cursor - 1]?.callId;
  for (const button of panel.querySelectorAll('.method-map-call')) {
    const current = cursor > 0 && button.dataset.callId === activeCallId;
    button.classList.toggle('current', current);
    if (current) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
  // Selecting a card changes the inspected invocation even if the overview
  // stays on the same page. Keep its disclosure state in sync without
  // rebuilding the step list or changing the shared replay position.
  for (const button of panel.querySelectorAll('.overview-disclosure')) {
    const expanded = selectedMethod === button.dataset.callId;
    button.textContent = expanded ? '▾' : '▸';
    button.setAttribute('aria-expanded', String(expanded));
    const item = invocations.get(button.dataset.callId);
    button.setAttribute(
      'aria-label',
      `${expanded ? 'Close details for ' : 'Inspect '}${item?.symbolId ?? 'method'} invocation`,
    );
  }
  return true;
}
function followSelectedEventRow() {
  if (!$('follow').checked) return;
  const list = $('event-list');
  const row = list.querySelector(`.event-row[data-index="${cursor}"]`);
  if (!row) return;
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
function render() {
  if (!flow) return;
  refreshSourcePresentation();
  const positionChanged = renderedFlow !== flow || renderedCursor !== cursor;
  const inspectorChanged =
    positionChanged || renderedInspectorRevision !== traceRevision;
  renderedFlow = flow;
  renderedCursor = cursor;
  renderedInspectorRevision = traceRevision;
  const recording = flow.trace?.recording;
  const isMock = flowHasMock;
  const evidenceLabel = recording
    ? 'Recorded execution'
    : isMock
      ? 'Simulated values'
      : 'Static / unverified evidence';
  $('evidence-mode').textContent = evidenceLabel;
  $('evidence-mode').title = evidenceLabel;
  $('trace-order').textContent = recording
    ? 'Recorded runtime order'
    : isMock
      ? 'Ordered by simulated execution'
      : 'Graph traversal / supplied order';
  if (positionChanged) {
    animation?.cancel();
    $('canvas').querySelector('.packet')?.remove();
  }
  $('canvas').querySelector('.canvas-empty')?.remove();
  const pathView = $('view-mode').value === 'path' && overviewItems.length;
  if (!cursor || pathView) clearConnection();
  if (!pathView) $('canvas').querySelector('.flow-overview')?.remove();
  if (pathView) $('canvas').querySelector('.packet')?.remove();
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
  $('breakpoint').setAttribute('aria-pressed', String(hasBreakpoint(cursor)));
  setStatus(
    continuationStates.get(flow)?.error
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
            : 'Structural / unverified flow',
  );
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
  if (inspectorChanged && !cursor) {
    for (const id of ['fields', 'local-tree', 'object-tree'])
      $(id).replaceChildren();
    inspectedFrame = undefined;
    inspectedState = undefined;
  }
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
    replaceStackControls($('source-stack'), sourceStackCalls, [], undefined);
    replaceStackControls($('frame-list'), inspectorStackCalls, [], undefined);
    sourceStackCalls = [];
    inspectorStackCalls = [];
    const sources = flow.trace?.sourceFiles;
    const observedSource = flow.trace?.events.find(
      (entry) =>
        entry.source?.file &&
        Object.prototype.hasOwnProperty.call(sources ?? {}, entry.source.file),
    )?.source;
    const initialFile =
      observedSource?.file ??
      (Object.prototype.hasOwnProperty.call(sources ?? {}, flow.trace?.target)
        ? flow.trace.target
        : Object.keys(sources ?? {})[0]);
    if (initialFile) {
      renderSource(
        { stack: [] },
        { source: observedSource ?? { file: initialFile, line: 1 } },
        true,
      );
    } else {
      shownSource = '';
      sourceRows.clear();
      highlightedSourceRow = undefined;
      $('snippet').replaceChildren();
      $('source').textContent = 'Select a step to inspect its source';
      $('source-line').textContent = '—';
      $('source-pages').hidden = true;
      $('source-empty').hidden = false;
    }
    $('packet-title').textContent = 'Ready to explore';
    $('event-kind').textContent = 'READY';
    $('playback-label').textContent = 'Ready when you are';
    $('active-path').textContent = 'Your execution, one step at a time';
    if (pathView) renderFlowOverview();
    else if (!nodes.size) {
      const empty = text('div', '', 'canvas-empty');
      empty.append(
        text('span', '▷', 'empty-icon'),
        text('strong', 'See your code in motion'),
        text('small', 'Press Play or choose a step from the execution trace'),
      );
      $('canvas').append(empty);
    }
    return;
  }
  // Layout and inspection-only changes do not alter an immutable snapshot.
  // Keep the prepared snapshot to avoid cloning large state trees on resize.
  if (inspectorChanged || !inspectedState)
    inspectedState = replayState(flow.trace?.events ?? [], cursor);
  const state = inspectedState;
  const event = state.event,
    step = flow.steps[cursor - 1];
  const currentFrame = activeFrame(state, event);
  $('stack').textContent = JSON.stringify(state.stack, null, 2);
  $('locals').textContent = JSON.stringify(state.locals, null, 2);
  $('objects').textContent = JSON.stringify(state.objects, null, 2);
  if (
    inspectorStackCalls?.length !== state.stack.length ||
    state.stack.some((callId, index) => inspectorStackCalls[index] !== callId)
  ) {
    const previous = inspectorStackCalls;
    inspectorStackCalls = [...state.stack];
    const fragment = document.createDocumentFragment();
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
      fragment.append(row);
    });
    replaceStackControls(
      $('frame-list'),
      previous,
      inspectorStackCalls,
      fragment,
    );
  }
  if (inspectorChanged || inspectedFrame !== currentFrame) {
    inspectedFrame = currentFrame;
    $('local-tree').replaceChildren();
    fieldRows(
      $('local-tree'),
      frameLocals(state, event),
      precedingFrameLocals(state, event, flow.trace?.events[cursor - 2]),
    );
  }
  if (inspectorChanged) {
    $('object-tree').replaceChildren();
    fieldRows($('object-tree'), state.objects);
  }
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
  if (inspectorChanged) renderInspectedFields();
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
  followSelectedEventRow();
  if (pathView) {
    renderFlowOverview();
    return;
  }
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
function announceSelectedStep() {
  if (!cursor) {
    $('navigation-announcement').textContent =
      `Restarted. Step 0 of ${flow.steps.length}.`;
    return;
  }
  const event = flow.trace?.events[cursor - 1];
  const label = (
    event?.label ??
    flow.steps[cursor - 1]?.dtoName ??
    'Execution event'
  ).slice(0, 120);
  const location = event?.source
    ? ` ${event.source.file} line ${event.source.line}.`
    : '';
  $('navigation-announcement').textContent =
    `Step ${cursor} of ${flow.steps.length}: ${label}.${location} ${event?.certainty ?? 'unverified'} evidence.`;
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
  const nextCursor = Math.max(0, Math.min(flow.steps.length, index));
  const moved = nextCursor !== cursor;
  if (nextCursor !== cursor) consolePageBack = 0;
  cursor = nextCursor;
  render();
  if (moved) announceSelectedStep();
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
  consolePageBack = 0;
  render();
  if (hasBreakpoint(cursor)) {
    pause();
    setStatus('Breakpoint · step ' + cursor);
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
  if (hasBreakpoint(index)) {
    breakpoints.delete(index);
    sourceBreakpoints.delete(
      sourceLocationKey(flow?.trace?.events[index - 1]?.source),
    );
  } else breakpoints.add(index);
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
// An entering/resuming recorder frame can carry only its callers in `stack`.
// The event's own invocation is still active until its exit/unwind. Returns
// and throws can already have popped that frame, so step from the surviving
// caller instead. This matches the same invocation IDs used by the method map.
function steppingInvocation(event) {
  if (!event) return undefined;
  if (event.kind === 'console' && !event.stack?.length) return undefined;
  // A completed frame can still be present in a recorder's exit snapshot.
  // Use recorded parentage, regardless of whether the stack was popped yet.
  // An exception notification is different: a caught throw can continue in
  // the same frame, so only unwind when that frame is actually absent.
  if (
    ['return', 'unresolved'].includes(event.kind) ||
    (event.kind === 'throw' && !event.stack?.includes(event.callId))
  )
    return parentInvocationId(event);
  return invocations.has(event.callId) ? event.callId : event.stack?.at(-1);
}
// Stepping is computed from the preprocessed invocation snapshots only.
// Step Into follows the next observed event in the selected invocation or the
// entry of its direct child. Unrelated asynchronous calls can be interleaved
// between those events, even on the same thread or scheduler task.
$('step-into').onclick = () => {
  pause();
  const version = navigationVersion;
  const requestedFlow = flow;
  const events = flow?.trace?.events;
  if (!events || !cursor) return seek(cursor + 1);
  // A completed return belongs to its surviving caller; a caller-only entry
  // stack still belongs to the entering invocation itself.
  const callId = steppingInvocation(events[cursor - 1]);
  if (!callId) return seek(cursor + 1);
  void (async () => {
    let i = cursor;
    while (true) {
      for (; i < events.length; i++) {
        const next = events[i];
        // Step Into follows one recorded event in this frame, or the entry
        // of a directly invoked child. Sibling tasks (even if they have the
        // same scheduler labels) do not represent progress in this frame.
        if (
          next.callId !== callId &&
          !(next.kind === 'enter' && parentInvocationId(next) === callId)
        )
          continue;
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
$('step-over').onclick = () => {
  pause();
  const version = navigationVersion;
  const requestedFlow = flow;
  const events = flow?.trace?.events;
  if (!events || !cursor) return seek(cursor + 1);
  const current = events[cursor - 1];
  // Unattributed process output has no frame to step over. Keep navigation in
  // the global event timeline instead of skipping intervening user execution.
  if (current.kind === 'console' && !current.stack?.length)
    return seek(cursor + 1);
  const callId = steppingInvocation(current);
  if (!callId) return seek(cursor + 1);
  void (async () => {
    let i = cursor;
    while (true) {
      for (; i < events.length; i++) {
        // Shared task/thread labels do not establish invocation identity.
        // Sibling callbacks can run while this invocation is suspended.
        if (events[i].callId !== callId) continue;
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
$('step-out').onclick = () => {
  pause();
  const version = navigationVersion;
  const requestedFlow = flow;
  const events = flow?.trace?.events;
  const current = events?.[cursor - 1];
  if (!current) return;
  const callId = steppingInvocation(current);
  // Pipe output has no observed invocation to step out of. Advance to the next
  // recorded event instead of leaving Step Out unresponsive at this position.
  if (!callId) {
    if (current.kind === 'console') return seek(cursor + 1);
    return;
  }
  void (async () => {
    let i = cursor;
    while (true) {
      for (; i < events.length; i++) {
        const next = events[i];
        // Only the invocation's own terminal event proves it has exited.
        // A different call with the same task/thread may be an interleaved
        // sibling, rather than a return to our caller.
        if (next.callId !== callId) continue;
        if (
          next.kind === 'return' ||
          next.kind === 'unresolved' ||
          (next.kind === 'throw' && !next.stack?.includes(callId))
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
const sourceAvailabilityCache = new WeakMap();
let mobileViewChosen = false;
function traceHasSourceEvidence(trace) {
  if (!trace) return false;
  if (!sourceAvailabilityCache.has(trace)) {
    const available =
      Object.values(trace.sourceFiles ?? {}).some(
        (content) => typeof content === 'string',
      ) ||
      (trace.events ?? []).some(
        (event) =>
          typeof event.snippet === 'string' && event.snippet.length > 0,
      );
    sourceAvailabilityCache.set(trace, available);
  }
  return sourceAvailabilityCache.get(trace);
}
function selectMobileView(view, userSelected = true) {
  if (userSelected) mobileViewChosen = true;
  document.querySelector('main').dataset.mobileView = view;
  for (const button of document.querySelectorAll('.mobile-views button'))
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.mobileView === view),
    );
  if (view === 'console') $('console-panel').open = true;
  if (view === 'state')
    activateTab(document.querySelector('[data-tab="state"]'));
  if (view === 'flow' && userSelected) render();
}
function refreshSourcePresentation() {
  const available = traceHasSourceEvidence(flow?.trace);
  document
    .querySelector('.center-column')
    .classList.toggle('source-unavailable', !available);
  $('inspect-source').hidden = available;
  // The first mobile view should display useful evidence. Explicit navigation
  // wins, even if a continuation or scenario changes source availability.
  if (
    !available &&
    !mobileViewChosen &&
    document.querySelector('main').dataset.mobileView === 'code'
  )
    selectMobileView('flow', false);
}
let layout = {
  inspector: false,
  timeline: true,
  traceWidth: 220,
  console: false,
  diagram: true,
  sourceShare: 55,
};
try {
  const saved = JSON.parse(localStorage.getItem('code-anime-layout') ?? '{}');
  if (typeof saved.inspector === 'boolean') layout.inspector = saved.inspector;
  if (typeof saved.timeline === 'boolean') layout.timeline = saved.timeline;
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
  workspace.classList.toggle('timeline-collapsed', !layout.timeline);
  $('toggle-timeline').setAttribute('aria-expanded', String(layout.timeline));
  $('toggle-timeline').textContent = layout.timeline
    ? 'Hide steps'
    : 'Show steps';
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
$('toggle-timeline').onclick = () => {
  layout.timeline = !layout.timeline;
  applyLayout();
  saveLayout();
  render();
};
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
$('inspect-source').onclick = () => focusPanel('source');
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
const consoleDetails = $('console-panel');
consoleDetails.open = layout.console;
// A native details toggle is queued asynchronously. Save a user click before
// navigation can interrupt that event, including keyboard-activated clicks.
consoleDetails.querySelector('summary').addEventListener('click', () => {
  if (window.innerWidth <= 650) return;
  layout.console = !consoleDetails.open;
  saveLayout();
});
let consoleIsMobile = window.innerWidth <= 650;
window.addEventListener('resize', () => {
  applyLayout();
  const mobile = window.innerWidth <= 650;
  if (mobile === consoleIsMobile) return;
  consoleIsMobile = mobile;
  // Mobile console navigation is temporary; only summary clicks save a
  // desktop preference. Queued native toggle events must not overwrite it.
  consoleDetails.open = mobile
    ? document.querySelector('main').dataset.mobileView === 'console' ||
      layout.console
    : layout.console;
});
applyLayout();
for (const button of document.querySelectorAll('.mobile-views button')) {
  button.onclick = () => selectMobileView(button.dataset.mobileView);
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
$('view-mode').onchange = () => {
  if ($('view-mode').value === 'path') overviewLastCursor = -1;
  render();
};
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
    overviewLastCursor = -1;
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
function setHelpVisible(visible) {
  $('help-panel').hidden = !visible;
  $('help').setAttribute('aria-expanded', String(visible));
}
$('help').onclick = () => {
  setHelpVisible($('help-panel').hidden);
};
$('close-help').onclick = () => {
  setHelpVisible(false);
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
    i: () => $('step-into').click(),
    o: () => $('step-over').click(),
    u: () => $('step-out').click(),
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
    setStatus(error.message);
    for (const control of document.querySelectorAll('button,input,select'))
      control.disabled = true;
  }
}
void load();
