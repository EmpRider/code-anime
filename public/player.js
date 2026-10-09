import { replayState } from './replay.js';
const $ = (id) => document.getElementById(id);
let flow, originalFlow, timer, animation;
let cursor = 0;
const nodes = new Map();
const bookmarks = new Set();
const breakpoints = new Set();
const rows = [];
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
function buildNodes() {
  nodes.clear();
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
function buildList() {
  rows.length = 0;
  const fragment = document.createDocumentFragment();
  flow.steps.forEach((step, index) => {
    const event = flow.trace?.events[index];
    const button = text('button', '', 'event-row');
    button.dataset.kind = event?.kind ?? 'flow';
    button.dataset.index = index + 1;
    button.append(
      text('span', String(index + 1).padStart(2, '0'), 'event-index'),
    );
    const description = text('span', '', 'event-description');
    description.append(
      text('span', event?.label ?? step.dtoName, 'event-label'),
    );
    const meta = text('span', '', 'event-meta');
    meta.append(text('span', event?.kind ?? 'flow', 'event-type'));
    if (event?.source) meta.append(text('span', 'L' + event.source.line));
    description.append(meta);
    button.append(description);
    button.onclick = () => seek(index + 1);
    button.ondblclick = () => toggleBreakpoint(index + 1);
    button.title = 'Select step. Double-click to toggle a playback breakpoint.';
    rows.push({
      button,
      event,
      search: JSON.stringify([event, step]).toLowerCase(),
    });
    fragment.append(button);
  });
  $('event-list').replaceChildren(fragment);
  filterList();
}
function filterList() {
  const query = $('search').value.trim().toLowerCase();
  const kind = $('kind-filter').value;
  const onlyBookmarks =
    $('bookmarks-only').getAttribute('aria-pressed') === 'true';
  const groups = {
    changes: ['assign', 'mutate', 'transform'],
    calls: ['enter', 'call', 'return', 'await', 'throw'],
    control: ['branch', 'loop'],
  };
  let count = 0;
  rows.forEach(({ button, event, search }, i) => {
    const matches =
      kind === 'all' ||
      (kind === 'changes' && changed(event)) ||
      groups[kind]?.includes(event?.kind) ||
      (kind === 'uncertain' &&
        ['assumed', 'unresolved', 'proposed'].includes(event?.certainty));
    button.hidden =
      !matches ||
      !search.includes(query) ||
      (onlyBookmarks && !bookmarks.has(i + 1));
    if (!button.hidden) count++;
    button.classList.toggle('bookmarked', bookmarks.has(i + 1));
    button.classList.toggle('breakpoint', breakpoints.has(i + 1));
    button.classList.toggle('current', cursor === i + 1);
    if (cursor === i + 1) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  $('trace-count').textContent = count + ' / ' + rows.length;
  $('no-events').hidden = count > 0;
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
  $('next').disabled = cursor === flow.steps.length;
  $('play').disabled = !flow.steps.length;
  $('bookmark').disabled = $('breakpoint').disabled = !cursor;
  $('bookmark').setAttribute('aria-pressed', bookmarks.has(cursor));
  $('bookmark').textContent = bookmarks.has(cursor) ? '★' : '☆';
  $('breakpoint').setAttribute('aria-pressed', breakpoints.has(cursor));
  $('status').textContent =
    cursor === flow.steps.length && cursor
      ? flow.trace?.truncated
        ? 'Chunk complete · flow continues'
        : 'Replay complete'
      : 'Mock execution · local session';
  $('coverage').textContent =
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
    'source',
    'snippet',
    'certainty',
    'route',
  ])
    $(id).textContent = '';
  $('values-empty').hidden = Boolean(cursor);
  $('source-empty').hidden = false;
  $('source-line').textContent = '—';
  $('step-number').textContent = cursor
    ? 'STEP ' + String(cursor).padStart(2, '0')
    : 'NO STEP SELECTED';
  if (!cursor) {
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
      text('span', typeof frame === 'string' ? frame : valueText(frame)),
    );
    $('frame-list').append(row);
  });
  fieldRows($('local-tree'), state.locals);
  fieldRows($('object-tree'), state.objects);
  $('certainty').textContent = event
    ? [event.certainty, event.note].filter(Boolean).join(' · ')
    : 'Agent-authored mock data';
  $('source').textContent = event?.source
    ? event.source.file
    : 'No source location recorded';
  $('source-line').textContent = event?.source
    ? 'L' +
      event.source.line +
      (event.source.endLine > event.source.line
        ? '–' + event.source.endLine
        : '')
    : '—';
  $('snippet').textContent = event?.snippet ?? '';
  $('source-empty').hidden = Boolean(event?.snippet);
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
  cursor = Math.max(0, Math.min(flow.steps.length, index));
  render();
}
function tick() {
  cursor = Math.min(cursor + 1, flow.steps.length);
  render();
  if (breakpoints.has(cursor)) {
    pause();
    $('status').textContent = 'Breakpoint · step ' + cursor;
  } else if (cursor < flow.steps.length)
    timer = setTimeout(tick, Number($('speed').value));
  else pause();
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
  if (cursor === flow.steps.length) cursor = 0;
  $('play').textContent = 'Pause';
  $('play').dataset.playing = 'true';
  timer = setTimeout(tick, 0);
};
$('next').onclick = () => seek(cursor + 1);
$('previous').onclick = () => seek(cursor - 1);
$('restart').onclick = () => seek(0);
$('timeline').oninput = () => seek(Number($('timeline').value));
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
    '/': () => $('search').focus(),
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
    $('title').textContent = flow.endpoint;
    $('title').title = flow.endpoint;
    $('variant').hidden = !flow.baselineTrace;
    $('variant').onchange = () => {
      pause();
      cursor = 0;
      bookmarks.clear();
      breakpoints.clear();
      flow =
        $('variant').value === 'baseline'
          ? {
              ...originalFlow,
              trace: originalFlow.baselineTrace,
              steps: traceSteps(originalFlow.baselineTrace),
            }
          : originalFlow;
      buildNodes();
      render();
    };
    const previous = flow.trace?.simulation?.previousSessionId;
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
