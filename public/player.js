import { replayState } from './replay.js';
const $ = (id) => document.getElementById(id);
let flow;
let originalFlow;
let cursor = 0;
let timer;
let packet;
let animation;
const nodes = new Map();
function pause() {
  clearTimeout(timer);
  timer = undefined;
  $('play').textContent = 'Play';
}
function valueText(value) {
  return value === undefined ? '∅' : JSON.stringify(value);
}
function fieldRows(parent, after, before, prefix = '') {
  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  for (const key of keys) {
    const next = after?.[key];
    const prior = before?.[key];
    const path = prefix ? prefix + '.' + key : key;
    if (
      next &&
      typeof next === 'object' &&
      (prior === undefined ||
        (prior !== null &&
          typeof prior === 'object' &&
          Array.isArray(next) === Array.isArray(prior)))
    ) {
      const child = document.createElement('div');
      child.className = 'object-fields';
      const title = document.createElement('strong');
      title.textContent = path + (Array.isArray(next ?? prior) ? ' []' : ' {}');
      child.append(title);
      fieldRows(
        child,
        next && typeof next === 'object' ? next : {},
        prior && typeof prior === 'object' ? prior : {},
        path,
      );
      parent.append(child);
    } else {
      const row = document.createElement('div');
      row.className = 'field';
      const changed =
        before !== undefined && valueText(prior) !== valueText(next);
      if (changed) row.classList.add('changed');
      row.textContent =
        path +
        ': ' +
        (changed ? valueText(prior) + ' → ' : '') +
        valueText(next);
      parent.append(row);
    }
  }
}
function buildNodes() {
  nodes.clear();
  $('canvas').replaceChildren();
  const labels = new Map(
    flow.trace?.events.map((e) => [e.symbolId, e.symbolId]) ?? [],
  );
  for (const step of flow.steps)
    for (const name of [step.from, step.to]) {
      if (nodes.has(name)) continue;
      const node = document.createElement('div');
      node.className = 'node';
      node.textContent = labels.get(name) ?? name;
      node.title = name;
      if (
        flow.trace?.events.some(
          (e) => e.symbolId === name && e.certainty === 'proposed',
        )
      )
        node.classList.add('proposed');
      nodes.set(name, node);
      $('canvas').append(node);
    }
  $('timeline').max = flow.steps.length;
}
function traceSteps(trace) {
  return trace.events.map((e, i) => ({
    from:
      e.values.from ??
      (e.kind === 'enter'
        ? e.symbolId
        : (trace.events[i - 1]?.symbolId ?? e.symbolId)),
    to: e.values.to ?? e.symbolId,
    dtoName: e.kind + ' · ' + e.label,
    dtoFields: e.after ?? e.values,
  }));
}
function render() {
  animation?.cancel();
  packet?.remove();
  for (const node of nodes.values()) node.classList.remove('active');
  $('timeline').value = cursor;
  $('progress').textContent = cursor + ' / ' + flow.steps.length;
  $('previous').disabled = cursor === 0;
  $('next').disabled = cursor === flow.steps.length;
  $('status').textContent =
    cursor === flow.steps.length
      ? flow.trace?.truncated
        ? 'This chunk ends here. Continue to the next chunk; this flow is incomplete.'
        : 'Replay complete.'
      : '';
  $('coverage').textContent =
    flow.trace?.simulation?.coverage ??
    'Structural/legacy flow: execution completeness is not established.';
  if (!cursor) {
    $('packet-title').textContent = 'Select a step';
    $('route').textContent = '';
    $('fields').replaceChildren();
    $('operation').textContent = '';
    $('origins').textContent = '';
    for (const id of ['stack', 'locals', 'source', 'snippet', 'certainty'])
      $(id).textContent = '';
    return;
  }
  const state = replayState(flow.trace?.events ?? [], cursor);
  $('stack').textContent = JSON.stringify(state.stack, null, 2);
  $('locals').textContent = JSON.stringify(state.locals, null, 2);
  const event = state.event;
  $('certainty').textContent = event
    ? event.certainty + ' · ' + (event.note ?? '')
    : 'Agent-authored mock data';
  $('source').textContent = event?.source
    ? event.source.file + ':' + event.source.line + '–' + event.source.endLine
    : '';
  $('snippet').textContent = event?.snippet ?? '';
  const step = flow.steps[cursor - 1];
  $('packet-title').textContent = step.dtoName;
  $('route').textContent = step.from + ' → ' + step.to;
  const after = event?.after ?? step.dtoFields;
  let before = event?.before;
  if (before === undefined && event?.objectId) {
    before = flow.trace.events
      .slice(0, cursor - 1)
      .findLast((e) => e.objectId === event.objectId)?.after;
  }
  $('fields').replaceChildren();
  fieldRows($('fields'), after, before);
  $('operation').textContent = event
    ? [
        event.kind + ' · frame ' + event.callId,
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
    : '';
  const from = nodes.get(step.from);
  const to = nodes.get(step.to);
  from.classList.add('active');
  to.classList.add('active');
  packet = document.createElement('div');
  packet.className = 'packet';
  const heading = document.createElement('strong');
  heading.textContent = step.dtoName;
  packet.append(heading);
  if (event?.objectId) {
    const identity = document.createElement('div');
    identity.textContent = event.objectId;
    packet.append(identity);
  }
  if (event?.inputs) {
    const input = document.createElement('div');
    input.className = 'packet-inputs';
    input.textContent = 'Inputs: ' + valueText(event.inputs);
    packet.append(input);
  }
  fieldRows(packet, after, before);
  if (event && Object.hasOwn(event, 'result')) {
    const result = document.createElement('div');
    result.className = 'field changed';
    result.textContent = 'Return: ' + valueText(event.result);
    packet.append(result);
  }
  const canvas = $('canvas');
  canvas.append(packet);
  to.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  canvas.style.minHeight = Math.max(360, packet.offsetHeight + 180) + 'px';
  const x = (node) =>
    Math.max(
      0,
      node.offsetLeft + node.offsetWidth / 2 - packet.offsetWidth / 2,
    );
  packet.style.left = x(to) + 'px';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    animation = packet.animate(
      [{ left: x(from) + 'px' }, { left: x(to) + 'px' }],
      { duration: Number($('speed').value) * 0.7, easing: 'ease-in-out' },
    );
}
function next() {
  if (cursor < flow.steps.length) {
    cursor++;
    render();
  }
}
function tick() {
  next();
  if (cursor < flow.steps.length)
    timer = setTimeout(tick, Number($('speed').value));
  else pause();
}
$('play').onclick = () => {
  if (!flow) return;
  if (timer) {
    pause();
    return;
  }
  if (cursor === flow.steps.length) cursor = 0;
  $('play').textContent = 'Pause';
  timer = setTimeout(tick, 0);
};
$('next').onclick = () => {
  pause();
  next();
};
$('previous').onclick = () => {
  pause();
  cursor = Math.max(0, cursor - 1);
  render();
};
$('restart').onclick = () => {
  pause();
  cursor = 0;
  render();
};
$('timeline').oninput = () => {
  pause();
  cursor = Number($('timeline').value);
  render();
};
async function load() {
  try {
    const id = location.pathname.split('/').at(-1);
    const response = await fetch('/api/flow/' + id);
    if (!response.ok) throw new Error((await response.json()).error);
    flow = await response.json();
    $('title').textContent = flow.endpoint;
    $('diagnostics').textContent = flow.trace
      ? JSON.stringify(
          {
            provider: flow.trace.provider,
            sourceHash: flow.trace.sourceHash,
            scenario: flow.trace.scenario,
            filesAnalyzed: flow.trace.filesAnalyzed,
            cacheHits: flow.trace.cacheHits,
            truncated: flow.trace.truncated,
            diagnostics: flow.trace.diagnostics,
          },
          null,
          2,
        )
      : 'Legacy agent-authored flow; not verified source analysis';
    originalFlow = flow;
    $('variant').hidden = !flow.baselineTrace;
    $('variant').onchange = () => {
      pause();
      cursor = 0;
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
    for (const control of document.querySelectorAll('button, input, select'))
      control.disabled = true;
  }
}
void load();
