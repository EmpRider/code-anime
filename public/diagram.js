import { Config, Graph, Shape } from '@antv/x6';
import dagre from 'dagre';
import {
  buildMethodGroups,
  groupFunctionInvocations,
} from './flow-overview.js';
import { plainTerminalText } from './terminal-text.js';
import { createDrilldown } from './diagram-drilldown.js';
import { preparedReturns } from './diagram-returns.js';
import { createRoutePlanner } from './diagram-routing.js';
import { buildSemanticFlow } from './semantic-flow-model.js';
import { prepareControlFlow } from './diagram-control-layout.js';
import { createControlLayout } from './diagram-elk-layout.js';
import { reserveRouteLabel } from './diagram-label-placement.js';
import './vendor/x6.css';
import './diagram.css';

Config.autoInsertCSS = false;

const WIDTH = 260;
const HEIGHT = 116;
const STEP_GAP = 64;
const PAGE_SIZE = 3;
const element = (tag, value, className) => {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
};
const snapshot = (event) => {
  if (event?.output !== undefined) return plainTerminalText(event.output);
  const value =
    event && Object.hasOwn(event, 'result')
      ? event.result
      : (event?.after ?? event?.inputs);
  return value === undefined
    ? 'No value snapshot'
    : JSON.stringify(value, null, 2);
};

Shape.HTML.register({
  shape: 'code-anime-card',
  width: WIDTH,
  height: HEIGHT,
  effect: ['data'],
  html(cell) {
    const data = cell.getData();
    if (data.placeholder) {
      const note = element('div', data.label, 'diagram-path-note');
      note.dataset.nodeId = data.id;
      note.dataset.parentId = data.parentId;
      return note;
    }
    const card = element(
      'article',
      '',
      'diagram-card' + (data.active ? ' is-active' : ''),
    );
    card.dataset.nodeId = data.id;
    card.dataset.controlType = data.control ?? data.kind;
    if (data.unresolved) card.dataset.sourceOwnership = 'unresolved';
    if (data.control) card.classList.add('diagram-control');
    card.translate = false;
    card.dataset.step = data.index;
    card.dataset.callId = data.callId ?? '';
    if (data.parentId) card.dataset.parentId = data.parentId;
    if (data.expanded && !data.parentId)
      card.classList.add('diagram-expanded-method');
    if (data.active) card.setAttribute('aria-current', 'step');
    const header = element('div', '', 'diagram-card-header');
    header.append(
      element('span', String(data.index).padStart(2, '0'), 'diagram-step'),
      element('span', data.simulated ?? data.kind, 'diagram-kind'),
      element(
        'span',
        data.active ? `Current · ${data.certainty}` : data.certainty,
        'diagram-state',
      ),
    );
    if (data.simulated) {
      const identity = header.querySelector('.diagram-kind');
      identity.title = data.simulated;
      Object.assign(identity.style, {
        minWidth: '0',
        flex: '1',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textTransform: 'none',
      });
      header.querySelector('.diagram-step').style.flexShrink = '0';
      header.querySelector('.diagram-state').style.flexShrink = '0';
    }
    const name = element('button', data.label, 'diagram-name');
    name.type = 'button';
    name.title = data.code ?? data.symbol;
    if (data.simulated) name.style.whiteSpace = 'nowrap';
    name.setAttribute(
      'aria-label',
      data.expandLabel ?? 'Expand method ' + data.symbol,
    );
    name.onclick = () => data.onExpand(data);
    if (data.expandable !== false)
      name.setAttribute('aria-expanded', String(Boolean(data.expanded)));
    const source = data.source
      ? `${data.source.file}:${data.source.line}`
      : (data.group ?? 'Prepared flow');
    const location = element('div', source, 'diagram-location');
    location.title = source;
    const value = element('details', '', 'diagram-values');
    value.open = Boolean(data.valuesOpen);
    const summary = element(
      'summary',
      'Values · prepared',
      'diagram-values-summary',
    );
    summary.setAttribute('aria-label', 'Toggle values for ' + data.label);
    if (data.kind === 'function' && data.inputs === undefined)
      summary.textContent = 'Inputs unavailable · values';
    if (data.inputs !== undefined) {
      summary.textContent = 'Inputs + values · simulated';
      summary.title = 'Inputs: ' + JSON.stringify(data.inputs);
    }
    value.append(
      summary,
      element(
        'pre',
        data.inputs === undefined
          ? data.value
          : 'Inputs (simulated)\n' +
              JSON.stringify(data.inputs, null, 2) +
              '\n\nCurrent value (prepared)\n' +
              data.value,
        'diagram-value',
      ),
    );
    summary.onclick = (event) => {
      event.preventDefault();
      data.onValues(data.id);
    };
    const seek = element(
      'button',
      'Go to step ' + data.index + ' ›',
      'diagram-seek',
    );
    seek.type = 'button';
    seek.title = 'Go to source step ' + data.index;
    seek.onclick = () => data.onSeek(data.index);
    const actions = element('div', '', 'diagram-card-actions');
    actions.append(seek);
    if (data.callId) {
      const inspect = element('button', 'Inspect', 'diagram-inspect');
      inspect.type = 'button';
      inspect.title = 'Inspect method ' + data.symbol;
      inspect.setAttribute('aria-label', 'Inspect method ' + data.symbol);
      inspect.onclick = () => data.onSelect(data.symbol, data.callId);
      actions.append(inspect);
    }
    const cue = element(
      'span',
      data.level === 'step'
        ? 'View source step'
        : data.inline
          ? data.expanded
            ? '− Collapse steps'
            : '+ Expand steps'
          : 'Open details',
      'diagram-action-cue',
    );
    cue.setAttribute('aria-hidden', 'true');
    name.append(cue);
    card.append(header, name, location);
    if (data.control === 'decision') {
      card.append(
        element(
          'strong',
          typeof data.event?.values?.condition === 'boolean'
            ? `Condition ${data.event.values.condition}`
            : 'Outcome unknown',
          'diagram-condition',
        ),
      );
    }
    if (data.visits?.length) {
      const picker = element('select', '', 'diagram-visit');
      picker.setAttribute('aria-label', 'Visit for ' + data.label);
      data.visits.forEach((visit, index) => {
        const option = element('option', visit.label);
        option.value = String(index);
        picker.append(option);
      });
      picker.value = String(data.visit);
      picker.onchange = () => data.onVisit(Number(picker.value));
      card.append(picker);
    }
    if (data.invocations?.length > 1) {
      const picker = element('select', '', 'diagram-invocation');
      picker.setAttribute('aria-label', 'Invocation of ' + data.symbol);
      for (const invocation of data.invocations) {
        const option = element(
          'option',
          `${invocation.callId} · step ${invocation.index} · from ${invocation.parentSymbol ?? 'entry'}`,
        );
        option.value = invocation.callId;
        picker.append(option);
      }
      picker.value = data.callId;
      picker.onchange = () => data.onInvocation(picker.value);
      card.append(picker);
    }
    if (
      data.kind === 'function' ||
      data.inputs !== undefined ||
      (data.value !== '{}' && data.value !== 'No value snapshot')
    )
      card.append(value);
    card.append(actions);
    return card;
  },
});

Shape.HTML.register({
  shape: 'code-anime-control-region',
  effect: ['data'],
  html(cell) {
    const data = cell.getData();
    const rail = element('div', '', 'diagram-control-region');
    rail.dataset.controlType = data.type;
    rail.dataset.selected = String(data.selected);
    if (data.type === 'unresolved') rail.dataset.status = 'unknown';
    rail.setAttribute(
      'aria-label',
      `${data.label} · ${data.selected === false ? 'not selected' : data.type === 'unresolved' ? 'unknown source ownership' : 'prepared source scope'}`,
    );
    rail.append(element('span', data.label));
    return rail;
  },
});

Shape.HTML.register({
  shape: 'code-anime-group',
  effect: ['data'],
  html(cell) {
    const data = cell.getData();
    const box = element(
      'section',
      '',
      `diagram-boundary diagram-boundary-${data.kind}${data.active ? ' is-active' : ''}`,
    );
    box.dataset.groupId = data.id;
    box.dataset.groupKind = data.kind;
    box.setAttribute('aria-label', `${data.kind}: ${data.label}`);
    const label = element(
      'div',
      `${data.kind === 'file' ? 'File' : 'Class / owner'} · ${data.label}`,
      'diagram-boundary-label',
    );
    label.title = label.textContent;
    box.append(label);
    return box;
  },
});

export function createDiagram(container, { onSelect, onSeek, onPause }) {
  container.className = 'diagram-canvas';
  const heading = element('div', '', 'diagram-heading');
  const title = element('strong', 'Execution path');
  const subtitle = element('span', 'Prepared steps · not runtime execution');
  heading.append(title, subtitle);
  const legend = element(
    'span',
    '◇ Decision · ↻ Loop · ! Recovery · ↩ Return',
    'diagram-control-legend',
  );
  heading.append(legend);
  const surface = element('div', '', 'diagram-surface');
  surface.setAttribute(
    'aria-label',
    'Interactive execution diagram. Arrow keys pan; plus and minus zoom.',
  );
  surface.tabIndex = 0;
  const footer = element('div', '', 'diagram-footer');
  const pages = element('div', '', 'diagram-pages');
  const controls = element('div', '', 'diagram-controls');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Diagram navigation controls');
  const button = (label, name, action) => {
    const node = element('button', label);
    node.type = 'button';
    node.title = name;
    node.setAttribute('aria-label', name);
    node.onclick = action;
    return node;
  };
  const orientationKey = 'code-anime-diagram-orientation';
  let direction = 'vertical';
  try {
    const savedDirection = localStorage.getItem(orientationKey);
    if (savedDirection === 'vertical' || savedDirection === 'horizontal') {
      direction = savedDirection;
    } else if (savedDirection === null) {
      // Only a raw legacy orientation can migrate. The player owns JSON
      // panel preferences under code-anime-layout; never modify that key.
      const legacyDirection = localStorage.getItem('code-anime-layout');
      if (legacyDirection === 'vertical' || legacyDirection === 'horizontal') {
        direction = legacyDirection;
        try {
          localStorage.setItem(orientationKey, direction);
        } catch {
          // Orientation still works in memory when storage is unavailable.
        }
      }
    }
  } catch {
    // Storage reads are optional; keep the default orientation.
  }
  const orientation = button('', '', () => {
    direction = direction === 'vertical' ? 'horizontal' : 'vertical';
    try {
      localStorage.setItem(orientationKey, direction);
    } catch {}
    updateOrientation();
    signature = '';
    render(options);
  });
  orientation.className = 'diagram-orientation';
  const layoutIcon = element('span', '', 'diagram-layout-icon');
  layoutIcon.setAttribute('aria-hidden', 'true');
  orientation.append(layoutIcon);
  function updateOrientation() {
    const name =
      direction === 'vertical' ? 'Horizontal layout' : 'Vertical layout';
    orientation.title = name;
    orientation.setAttribute('aria-label', name);
    layoutIcon.style.transform =
      direction === 'vertical' ? '' : 'rotate(90deg)';
    container.dataset.direction = direction;
  }
  updateOrientation();
  controls.append(
    orientation,
    button('−', 'Zoom out', () => zoom(-0.15)),
    button('Fit', 'Fit diagram', () => fit({ full: true })),
    button('+', 'Zoom in', () => zoom(0.15)),
  );
  const panButtons = element('div', '', 'diagram-pan-buttons');
  panButtons.setAttribute('role', 'group');
  panButtons.setAttribute('aria-label', 'Pan diagram');
  for (const [label, dx, dy] of [
    ['Left', 80, 0],
    ['Right', -80, 0],
    ['Up', 0, 80],
    ['Down', 0, -80],
  ])
    panButtons.append(
      button(label, 'Pan ' + label.toLowerCase(), () => pan(dx, dy)),
    );
  controls.prepend(panButtons);
  const routingStatus = element('details', '', 'diagram-routing-status');
  routingStatus.hidden = true;
  const layoutStatus = element('div', '', 'diagram-layout-status');
  layoutStatus.setAttribute('role', 'status');
  layoutStatus.setAttribute('aria-live', 'polite');
  layoutStatus.hidden = true;
  footer.append(pages, layoutStatus, routingStatus, controls);
  container.replaceChildren(heading, surface, footer);
  const graph = new Graph({
    container: surface,
    async: false,
    autoResize: false,
    panning: true,
    mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'] },
    interacting: false,
    preventDefaultMouseDown: false,
    background: { color: 'transparent' },
  });
  let flow,
    events = [],
    entries = [],
    returns = new Map(),
    options = {},
    page = 0,
    manualPage = false;
  let selectedId;
  const selection = element('div', '', 'diagram-selection');
  selection.hidden = true;
  heading.append(selection);
  function selectNode(id) {
    selectedId = id;
    const data = nodeCells.get(id)?.getData();
    selection.hidden = !data;
    if (!data) {
      selectedId = undefined;
      selection.replaceChildren();
      return;
    }
    highlightSelection();
    selection.replaceChildren(
      element('span', data.label),
      button('Read', 'Read selected node', () => {
        graph.zoomTo(1);
        graph.centerCell(nodeCells.get(id));
      }),
      button(
        data.level === 'step' ? 'Source' : 'Expand / collapse',
        'Open selected node',
        () => onExpand(nodeCells.get(id).getData()),
      ),
      button('Values', 'Toggle selected node values', () => onValues(id)),
      button('Inspect', 'Inspect selected node', () =>
        onSelect(data.symbol, data.callId),
      ),
      button('Close', 'Close selected node actions', () => {
        selectNode(undefined);
        highlightSelection();
        surface.focus({ preventScroll: true });
      }),
    );
  }
  function highlightSelection() {
    const callId = nodeCells.get(selectedId)?.getData().callId;
    for (const edge of edgeCells) {
      const paired = Boolean(callId) && edge.getData().callId === callId;
      edge.attr('root/data-selected-pair', paired ? 'true' : 'false');
      edge.attr(
        'line/strokeWidth',
        paired ? 3.5 : edge.attr('line/stroke') === '#4f46e5' ? 2.5 : 1.5,
      );
    }
  }
  graph.on('node:click', ({ node }) => {
    if (nodeCells.has(node.id)) selectNode(node.id);
  });
  const onFocus = (event) => {
    const card = event.target.closest('.diagram-card');
    if (
      card &&
      event.target.matches(':focus-visible') &&
      selectedId !== card.dataset.nodeId
    )
      selectNode(card.dataset.nodeId);
  };
  container.addEventListener('focusin', onFocus);
  function pan(dx, dy) {
    const position = graph.translate();
    graph.translate(position.tx + dx, position.ty + dy);
  }
  surface.addEventListener('keydown', (event) => {
    if (event.target !== surface) return;
    const moves = {
      ArrowLeft: [80, 0],
      ArrowRight: [-80, 0],
      ArrowUp: [0, 80],
      ArrowDown: [0, -80],
    };
    if (moves[event.key]) {
      event.preventDefault();
      event.stopPropagation();
      pan(...moves[event.key]);
    } else if (['+', '=', '-'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      zoom(event.key === '-' ? -0.15 : 0.15);
    }
  });
  let viewportRevision = 0;
  graph.on('translate', () => ++viewportRevision);
  graph.on('scale', () => {
    ++viewportRevision;
    container.classList.toggle('diagram-overview', graph.zoom() < 0.6);
  });
  let signature = '',
    previousCursor = -1,
    disposed = false;
  let renderedTraceRevision = 0;
  const controlLayout = createControlLayout();
  const geometryCache = new Map();
  const geometryFailures = new Map();
  let wantedGeometry = new Map();
  let runningGeometry;
  let traceRevision = 0;
  let pendingFit = false;
  let pendingFitRevision = 0;
  let pendingFitFull = false;
  function showGeometryStatus() {
    const failures = [...wantedGeometry.keys()].filter((key) =>
      geometryFailures.has(key),
    );
    const pending = [...wantedGeometry.keys()].filter(
      (key) => !geometryCache.has(key) && !geometryFailures.has(key),
    );
    layoutStatus.hidden = !pending.length && !failures.length;
    const previousSnapshot =
      (pending.length || failures.length) &&
      nodeCells.size > 0 &&
      renderedTraceRevision !== traceRevision;
    layoutStatus.textContent = failures.length
      ? `ELK Worker layout failed: ${geometryFailures.get(failures[0])}. Prepared playback remains available; no route was invented.${previousSnapshot ? ' Previous trace layout shown; not current prepared evidence.' : ''}`
      : pending.length
        ? `ELK Worker layout pending for ${pending.length} expanded method${pending.length === 1 ? '' : 's'}. ${previousSnapshot ? 'Previous trace layout shown; not current prepared evidence until replacement finishes.' : 'Existing diagram retained.'}`
        : '';
    container.dataset.layoutState = previousSnapshot
      ? 'stale'
      : pending.length
        ? 'pending'
        : failures.length
          ? 'failed'
          : 'ready';
  }
  function requestGeometry(wanted, fitLayout) {
    const keys = [...wanted.keys()];
    if (runningGeometry && !wanted.has(runningGeometry.key))
      runningGeometry.abort.abort();
    wantedGeometry = wanted;
    const unfinished = keys.some(
      (key) => !geometryCache.has(key) && !geometryFailures.has(key),
    );
    if (unfinished) {
      if (fitLayout && !pendingFit) {
        pendingFit = true;
        pendingFitFull = false;
        pendingFitRevision = viewportRevision;
      }
    } else if (!runningGeometry) pendingFit = false;
    showGeometryStatus();
    if (runningGeometry) return;
    const key = keys.find(
      (id) => !geometryCache.has(id) && !geometryFailures.has(id),
    );
    if (!key) return;
    const {
      prepared,
      direction: layoutDirection,
      extraHeights,
    } = wanted.get(key);
    const abort = new AbortController();
    const revision = traceRevision;
    runningGeometry = { key, abort };
    controlLayout
      .layout(prepared, {
        direction: layoutDirection,
        extraHeight: (id) => extraHeights.get(id) ?? 0,
        signal: abort.signal,
      })
      .then(
        (geometry) => {
          if (
            !disposed &&
            revision === traceRevision &&
            wantedGeometry.has(key)
          )
            geometryCache.set(key, geometry);
        },
        (error) => {
          if (
            !disposed &&
            !abort.signal.aborted &&
            revision === traceRevision &&
            wantedGeometry.has(key)
          )
            geometryFailures.set(key, error.message);
        },
      )
      .finally(() => {
        if (disposed || runningGeometry?.key !== key) return;
        runningGeometry = undefined;
        showGeometryStatus();
        const remaining = [...wantedGeometry.keys()].some(
          (id) => !geometryCache.has(id) && !geometryFailures.has(id),
        );
        if (remaining) requestGeometry(wantedGeometry, pendingFit);
        else {
          const shouldFit =
            pendingFit && pendingFitRevision === viewportRevision;
          const fullFit = pendingFitFull;
          pendingFit = false;
          render(options, false);
          if (shouldFit && !disposed) fit({ full: fullFit });
        }
      });
  }
  let nodeCells = new Map(),
    groupCells = new Map(),
    edgeCells = [];
  const collapsed = new Set();
  const expanded = new Set();
  const selectedInvocations = new Map();
  const selectedVisits = new Map();
  let semantic;
  const openValues = new Set();
  let valuesRevision = 0;
  const valueHeight = (id) => (openValues.has(id) ? 160 : 0);
  function keepValuesReachable(id) {
    const cell = nodeCells.get(id);
    const summary =
      cell &&
      graph
        .findViewByCell(cell)
        ?.container.querySelector('.diagram-values-summary');
    if (!summary) return;
    const bounds = summary.getBoundingClientRect();
    const viewport = surface.getBoundingClientRect();
    const pad = 12;
    const left = viewport.left + pad;
    const right = viewport.right - pad;
    const top = viewport.top + pad;
    let bottom = viewport.bottom - pad;
    const dock = document
      .querySelector('.playback-dock')
      ?.getBoundingClientRect();
    if (
      dock &&
      dock.top < bottom &&
      dock.bottom > top &&
      dock.left < right &&
      dock.right > left
    )
      bottom = Math.min(bottom, dock.top - pad);
    if (bottom <= top || right <= left) return;
    const dx =
      bounds.left < left
        ? left - bounds.left
        : bounds.right > right
          ? right - bounds.right
          : 0;
    const dy =
      bounds.top < top
        ? top - bounds.top
        : bounds.bottom > bottom
          ? bottom - bounds.bottom
          : 0;
    if (dx || dy) pan(dx, dy);
  }
  const onValues = (id) => {
    onPause?.();
    pendingFit = false;
    pendingFitFull = false;
    const opening = !openValues.has(id);
    if (opening) openValues.add(id);
    else openValues.delete(id);
    const revision = ++valuesRevision;
    render(options, false);
    // Closing a card must never move the camera. Invalidate pending opening
    // adjustments when a user toggles the same card again before the next frame.
    if (opening)
      requestAnimationFrame(() => {
        if (!disposed && revision === valuesRevision && openValues.has(id))
          keepValuesReachable(id);
      });
  };
  let drilldown,
    scope = null,
    trail = [];
  const navigation = element('div', '', 'diagram-navigation');
  heading.append(navigation);
  function changeScope(nextScope, reset = false) {
    onPause?.();
    if (reset) trail = [];
    else trail.push(scope);
    scope = nextScope;
    page = 0;
    manualPage = false;
    signature = '';
    render(options);
    navigation.querySelector('button')?.focus({ preventScroll: true });
  }
  function onExpand(card) {
    if (card.level === 'class') changeScope({ kind: 'class', id: card.owner });
    else if (card.level === 'step') onSeek(card.index);
    else if (card.callId && events.length) {
      if (options.mode === 'map' && !scope) {
        onPause?.();
        const anchorId = nodeCells.has(card.id) ? card.id : card.callId;
        const anchorBox = (id) =>
          [...container.querySelectorAll('.diagram-card')]
            .find((node) => node.dataset.nodeId === id)
            ?.getBoundingClientRect();
        const before = anchorBox(anchorId);
        if (expanded.has(card.id)) expanded.delete(card.id);
        else expanded.add(card.id);
        signature = '';
        render(options, false);
        const cell = nodeCells.get(anchorId) ?? nodeCells.get(card.callId);
        if (cell && before) {
          const after = anchorBox(cell.id);
          if (after) pan(before.x - after.x, before.y - after.y);
          selectNode(cell.id);
        }
      } else changeScope({ kind: 'method', id: card.callId });
    } else onSeek(card.index);
  }
  function advance(cursor, direction = 1) {
    return direction < 0
      ? drilldown.previous(cursor, scope)
      : drilldown.next(cursor, scope);
  }
  const groups = element('div', '', 'diagram-groups');
  heading.append(groups);
  function fit({ full = false } = {}) {
    if (
      !disposed &&
      surface.clientWidth &&
      surface.clientHeight &&
      graph.getNodes().length
    ) {
      graph.resize(surface.clientWidth, surface.clientHeight);
      // Explicit Fit includes the full map; automatic refits keep readable focus.
      if (full) {
        graph.zoomToFit({ padding: 24, maxScale: 1 });
        if (
          [...wantedGeometry.keys()].some(
            (key) => !geometryCache.has(key) && !geometryFailures.has(key),
          )
        ) {
          pendingFit = true;
          pendingFitFull = true;
          pendingFitRevision = viewportRevision;
        }
        return;
      }
      graph.zoomToFit({ padding: 24, minScale: 0.9, maxScale: 1 });
      if (graph.zoom() <= 0.9) {
        const focus =
          [...nodeCells.values()].find(
            (cell) => cell.getData().control === 'loop',
          ) ?? [...nodeCells.values()][0];
        if (focus) {
          graph.centerCell(focus);
          const parent = nodeCells.get(focus.getData().parentId);
          if (parent) {
            const box = parent.getBBox();
            const focused = focus.getBBox();
            if (box.width * graph.zoom() <= surface.clientWidth - 48)
              pan((focused.center.x - box.center.x) * graph.zoom(), 0);
          }
        }
      }
    }
  }
  function zoom(delta) {
    graph.zoomTo(Math.max(0.25, Math.min(1.6, graph.zoom() + delta)));
  }
  let measured = false;
  const observer = new ResizeObserver(() => {
    if (disposed || !surface.clientWidth || !surface.clientHeight) return;
    graph.resize(surface.clientWidth, surface.clientHeight);
    const initial = !measured;
    measured = true;
    render(options, initial);
  });
  observer.observe(surface);
  function setFlow(value, preserveScope = false) {
    traceRevision++;
    geometryCache.clear();
    geometryFailures.clear();
    wantedGeometry = new Map();
    pendingFit = false;
    pendingFitFull = false;
    runningGeometry?.abort.abort();
    ++valuesRevision;
    flow = value;
    events = value.trace?.events ?? [];
    drilldown = createDrilldown(events, value.trace?.sourceFiles);
    semantic = buildSemanticFlow(value);
    if (!preserveScope) {
      scope = null;
      trail = [];
      expanded.clear();
      openValues.clear();
      selectedInvocations.clear();
      selectedVisits.clear();
      selectedId = undefined;
      selection.hidden = true;
      selection.replaceChildren();
    }
    entries = buildMethodGroups(events).invocations;
    returns = preparedReturns(events, entries);
    if (!entries.length) {
      const symbols = [
        ...new Set(value.steps.flatMap((step) => [step.from, step.to])),
      ];
      entries = symbols.map((symbol) => ({
        callId: symbol,
        symbol,
        methodName: symbol.split(/[.:]/).at(-1),
        className: 'Prepared structure',
        index:
          value.steps.findIndex(
            (step) => step.from === symbol || step.to === symbol,
          ) + 1,
        certainty: 'unverified',
      }));
    }
    signature = '';
    previousCursor = -1;
    page = 0;
    manualPage = false;
    collapsed.clear();
  }
  function render(next = {}, fitLayout = true) {
    if (!flow || disposed) return;
    const focused = document.activeElement;
    const focusedCard = focused?.closest('.diagram-card');
    const focusSelector = container.contains(focused)
      ? focusedCard
        ? `.diagram-card[data-node-id="${CSS.escape(focusedCard.dataset.nodeId)}"] ${focused.hasAttribute('aria-label') ? `[aria-label="${CSS.escape(focused.getAttribute('aria-label'))}"]` : '.' + focused.className}`
        : focused.hasAttribute('aria-label')
          ? `button[aria-label="${CSS.escape(focused.getAttribute('aria-label'))}"]`
          : undefined
      : undefined;
    const oldMode = options.mode;
    options = {
      mode: 'map',
      cursor: 0,
      follow: true,
      reducedMotion: false,
      duration: 500,
      ...next,
    };
    const { mode, cursor, follow, reducedMotion, duration } = options;
    if (oldMode && oldMode !== mode) {
      scope = null;
      trail = [];
      signature = '';
    }
    surface.dataset.motion = reducedMotion ? 'reduced' : 'full';
    surface.style.setProperty(
      '--diagram-duration',
      `${Math.max(100, duration)}ms`,
    );
    if (cursor !== previousCursor || oldMode !== mode) manualPage = false;
    const current = events[Math.max(0, cursor - 1)];
    const activeId =
      entries.find((entry) => entry.callSiteIndex === cursor)?.callId ??
      current?.callId ??
      flow.steps[Math.max(0, cursor - 1)]?.to;
    const vertical = direction === 'vertical';
    let cards = [],
      links = [];
    const entryById = new Map(entries.map((entry) => [entry.callId, entry]));
    const functionGraph = groupFunctionInvocations(entries, events);
    const activeFunctionId = functionGraph.byCall.get(activeId);
    navigation.replaceChildren();
    if (events.length && mode === 'map' && !scope) {
      if (expanded.size)
        navigation.append(
          button('Collapse methods', 'Collapse expanded methods', () => {
            onPause?.();
            expanded.clear();
            signature = '';
            render(options);
          }),
        );
    } else if (events.length) {
      if (mode !== 'map')
        navigation.append(
          button('Classes', 'Show class-level diagram', () =>
            changeScope({ kind: 'classes' }, true),
          ),
        );
      if (scope) {
        navigation.append(
          button('↑ Collapse', 'Collapse diagram level', () => {
            onPause?.();
            scope = trail.pop() ?? null;
            page = 0;
            manualPage = false;
            signature = '';
            render(options);
            navigation.querySelector('button')?.focus({ preventScroll: true });
          }),
        );
        navigation.append(
          button('All steps', 'Show all prepared steps', () =>
            changeScope(null, true),
          ),
        );
      }
    }
    let scopedCards;
    let pathCount;
    if (scope) {
      const items =
        scope.kind === 'classes'
          ? drilldown.classes
          : scope.kind === 'class'
            ? drilldown.methods(scope.id)
            : drilldown.flowSteps(scope.id);
      scopedCards = items.map((item) => ({
        ...item,
        level: item.kind,
        kind: item.kind === 'step' ? item.event.kind : item.kind,
        expandLabel:
          item.kind === 'class'
            ? 'Expand class ' + item.owner
            : item.kind === 'step'
              ? 'Go to source step ' + item.index
              : 'Expand method ' + item.symbol,
        expandable: item.kind !== 'step',
        value:
          item.kind === 'class'
            ? `${item.count} method invocations`
            : snapshot(item.event),
        active:
          cursor > 0 &&
          (item.kind === 'class'
            ? item.owner === drilldown.owner(activeId)
            : item.kind === 'method'
              ? scope.kind === 'class'
                ? activeId === item.callId
                : drilldown.contains(activeId, item.callId)
              : item.index === cursor),
      }));
      if (follow && !manualPage) {
        const active = scopedCards.findIndex((card) => card.active);
        if (active >= 0) page = Math.floor(active / PAGE_SIZE);
      }
      page = Math.max(
        0,
        Math.min(page, Math.ceil(scopedCards.length / PAGE_SIZE) - 1),
      );
      cards = scopedCards.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
      links = cards.slice(1).map((card, index) => [cards[index].id, card.id]);
      title.textContent =
        scope.kind === 'classes'
          ? 'Classes / modules'
          : scope.kind === 'class'
            ? scope.id
            : (entryById.get(scope.id)?.symbol ?? scope.id) + ' · ' + scope.id;
      subtitle.textContent =
        scope.kind === 'classes'
          ? 'Class-level playback · expand a class'
          : scope.kind === 'class'
            ? 'Method-level playback · expand an invocation'
            : 'Source-step playback · expand nested calls';
      subtitle.textContent +=
        ' · arrows: ' +
        (scope.kind === 'method'
          ? 'prepared step order'
          : 'first appearance order, not calls');
      if (cursor > 0 && !scopedCards.some((card) => card.active))
        subtitle.textContent += ' · cursor outside this scope';
    } else {
      title.textContent = 'Execution path';
      subtitle.textContent = 'Prepared steps · not runtime execution';
      cards = functionGraph.functions
        .filter((item) => !collapsed.has(item.invocations[0].className))
        .map((item) => {
          const active = cursor > 0 && item.id === activeFunctionId;
          if (active && follow && cursor !== previousCursor)
            selectedInvocations.set(item.id, activeId);
          const entry =
            item.invocations.find(
              (invocation) =>
                invocation.callId === selectedInvocations.get(item.id),
            ) ?? item.invocations[0];
          const event = events[entry.index - 1];
          const currentInvocation = active && entry.callId === activeId;
          return {
            id: item.id,
            invocations: item.invocations,
            onInvocation: (callId) => {
              onPause?.();
              selectedInvocations.set(item.id, callId);
              onSeek(entryById.get(callId).index);
              render(options, false);
            },
            index: currentInvocation ? cursor : entry.index,
            symbol: entry.symbol,
            label: entry.methodName,
            callId: entry.callId,
            group: entry.className,
            file: event?.source?.file ?? 'Source unavailable',
            source:
              active && current?.callId === entry.callId
                ? current.source
                : event?.source,
            kind: 'function',
            certainty: currentInvocation ? current?.certainty : entry.certainty,
            value: snapshot(currentInvocation ? current : event),
            inputs: event?.inputs ?? events[entry.callSiteIndex - 1]?.inputs,
            expanded: expanded.has(item.id),
            steps: expanded.has(item.id)
              ? drilldown
                  .steps(entry.callId)
                  .filter(
                    (step) =>
                      step.kind === 'step' &&
                      (step.event.kind !== 'enter' ||
                        step.certainty === 'unresolved'),
                  )
              : [],
            cursor,
            active,
          };
        });
      const ids = new Set(cards.map((card) => card.id));
      links = functionGraph.relationships
        .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
        .map((edge) => [edge.source, edge.target, edge.callId]);
    }
    if (scope) groups.replaceChildren();
    else if (mode === 'map' && (signature === '' || oldMode !== mode)) {
      groups.replaceChildren();
      for (const name of new Set(entries.map((entry) => entry.className))) {
        const toggle = button(name, 'Toggle group ' + name, () => {
          if (collapsed.has(name)) collapsed.delete(name);
          else collapsed.add(name);
          signature = '';
          render(options);
        });
        toggle.setAttribute('aria-pressed', String(!collapsed.has(name)));
        groups.append(
          toggle,
          button('›', 'Open class ' + name + ' details', () =>
            changeScope({ kind: 'class', id: name }),
          ),
        );
      }
    }
    const grouped = mode === 'map' && !scope;
    const boundaries = new Map();
    const parents = new Map();
    if (grouped) {
      const ids = new Set(cards.map((card) => card.id));
      const groupId = (kind, file, owner = '') => {
        const key = JSON.stringify([kind, file, owner]);
        if (!boundaries.has(key)) {
          let id = 'group:' + boundaries.size;
          while (ids.has(id)) id += ':';
          ids.add(id);
          boundaries.set(key, {
            id,
            kind,
            label: kind === 'file' ? file : owner,
            members: [],
          });
        }
        return boundaries.get(key);
      };
      for (const card of cards) {
        const file = groupId('file', card.file);
        file.members.push(card.id);
        if (card.group === 'Functions' || card.group === card.file) {
          parents.set(card.id, file.id);
        } else {
          const owner = groupId('owner', card.file, card.group);
          owner.parent = file.id;
          owner.members.push(card.id);
          parents.set(card.id, owner.id);
        }
      }
    }
    const innerCards = [];
    const innerLinks = [];
    const usedIds = new Set([
      ...cards.map((card) => card.id),
      ...[...boundaries.values()].map((boundary) => boundary.id),
    ]);
    const controlRegions = [];
    const controlEdges = [];
    const wanted = new Map();
    let waitingForGeometry = false;
    for (const card of cards) {
      const method = semantic.methods.find((item) => item.id === card.callId);
      if (card.expanded && method) {
        const prepared = prepareControlFlow(method.items, {
          cursor: follow ? cursor : 0,
          visits: selectedVisits,
          methodCallId: card.callId,
        });
        const extraHeights = new Map();
        for (const item of prepared.cards) {
          const height = valueHeight(
            JSON.stringify(['control', card.id, item.id]),
          );
          // shortcut: T4 measures repeated visits by shared node.id;
          // grow all matching visits instead of clipping an open Values card.
          extraHeights.set(
            item.node.id,
            Math.max(extraHeights.get(item.node.id) ?? 0, height),
          );
        }
        const layoutKey = JSON.stringify([
          traceRevision,
          card.id,
          prepared.topologyKey,
          direction,
          surface.clientWidth,
          [...extraHeights],
        ]);
        wanted.set(layoutKey, { prepared, direction, extraHeights });
        const layout = geometryCache.get(layoutKey);
        if (!layout) {
          if (!geometryFailures.has(layoutKey)) waitingForGeometry = true;
          continue;
        }
        card.controlLayout = layout;
        card.width = Math.max(WIDTH, layout.width + 32);
        const ids = new Map(
          layout.cards.map((item) => [
            item.id,
            JSON.stringify(['control', card.id, item.id]),
          ]),
        );
        for (const item of layout.cards) {
          if (item.placeholder) {
            innerCards.push({
              id: ids.get(item.id),
              parentId: card.id,
              placeholder: true,
              label: item.node.title,
              x: item.x,
              layoutY: item.y,
              width: item.width,
              height: item.height,
            });
            continue;
          }
          const index = item.index ?? item.node.indices[0];
          const event = events[index - 1] ?? item.event;
          const step = card.steps.find((step) => step.index === index);
          innerCards.push({
            id: ids.get(item.id),
            parentId: card.id,
            parentRegionId: item.parentRegionId
              ? JSON.stringify([card.id, item.parentRegionId])
              : undefined,
            index,
            event,
            symbol: event?.symbolId ?? 'Unknown prepared source',
            callId: card.callId,
            source: event?.source,
            certainty: event?.certainty ?? 'unresolved',
            level: 'step',
            kind: event?.kind ?? 'unresolved',
            control: item.control,
            label: item.control
              ? item.node.title
              : (step?.label ?? event?.label ?? 'Unresolved prepared event'),
            code: step?.code,
            simulated: item.control ? undefined : `Simulated: ${event.label}`,
            x: item.x,
            layoutY: item.y,
            width: item.width,
            height: item.height,
            expandLabel: 'Go to source step ' + index,
            expandable: false,
            value: snapshot(event),
            unresolved: item.unresolved || !events[index - 1],
            active: cursor === index,
            visits: item.control === 'loop' ? item.node.iterations : undefined,
            visit: item.visit,
            onVisit: (visit) => {
              onPause?.();
              selectedVisits.set(item.node.id, visit);
              onSeek(item.node.iterations[visit].indices[0]);
              signature = '';
              render(options, false);
            },
          });
        }
        controlEdges.push(
          ...layout.edges.map((edge) => ({
            ...edge,
            source: ids.get(edge.source),
            target: ids.get(edge.target),
          })),
        );
        controlRegions.push(
          ...layout.regions.map((region) => ({
            ...region,
            id: JSON.stringify([card.id, region.id]),
            parentId: card.id,
            parentRegionId: region.parentRegionId
              ? JSON.stringify([card.id, region.parentRegionId])
              : undefined,
          })),
        );
        continue;
      }
      card.columns = Math.min(card.steps?.length || 1, vertical ? 2 : 4);
      card.width = card.expanded
        ? card.columns * (WIDTH + STEP_GAP) - STEP_GAP + 32
        : WIDTH;
      if (!card.expanded) continue;
      let previous;
      for (const [offset, step] of card.steps.entries()) {
        let id = JSON.stringify(['inline', card.id, step.id]);
        while (usedIds.has(id)) id += ':';
        usedIds.add(id);
        const inner = {
          ...step,
          id,
          parentId: card.id,
          row: Math.floor(offset / card.columns),
          column:
            Math.floor(offset / card.columns) % 2
              ? card.columns - 1 - (offset % card.columns)
              : offset % card.columns,
          level: 'step',
          kind: step.event.kind,
          label:
            step.event.kind === 'call'
              ? step.label || step.event.label || 'Call'
              : step.event.label || step.event.kind,
          expandLabel: 'Go to source step ' + step.index,
          expandable: false,
          value: snapshot(step.event),
          active: cursor > 0 && step.index === cursor,
        };
        innerCards.push(inner);
        if (previous) innerLinks.push([previous, id]);
        previous = id;
      }
    }
    requestGeometry(wanted, fitLayout);
    if (
      waitingForGeometry ||
      [...wanted.keys()].some((key) => geometryFailures.has(key))
    ) {
      // Keep the last complete geometry, but never freeze current cursor styling.
      if (renderedTraceRevision === traceRevision) {
        const activeCards = new Set();
        for (const [id, cell] of nodeCells) {
          const data = cell.getData();
          const active =
            data.level === 'step'
              ? data.index === cursor
              : data.kind === 'function'
                ? id === activeFunctionId && cursor > 0
                : data.active;
          if (active) activeCards.add(id);
          if (active !== data.active) cell.setData({ ...data, active });
        }
        for (const edge of edgeCells) {
          const data = edge.getData();
          const active =
            data.status === 'prepared' &&
            (data.kind === 'return'
              ? data.index === cursor
              : data.kind === 'call' && grouped
                ? cursor > 0 &&
                  current?.kind !== 'return' &&
                  data.callId === activeId
                : data.kind !== 'first-appearance' &&
                  activeCards.has(edge.getTargetCellId()));
          edge.attr('line/stroke', active ? '#4f46e5' : '#64748b');
          edge.attr('line/strokeWidth', active ? 2.5 : 1.5);
        }
        previousCursor = cursor;
      }
      if (focusSelector && !focused.isConnected) {
        const replacement = container.querySelector(focusSelector);
        (replacement && !replacement.disabled
          ? replacement
          : controls.querySelector('button[aria-label="Fit diagram"]')
        ).focus({ preventScroll: true });
      }
      return;
    }
    for (const card of cards) {
      card.headerHeight =
        HEIGHT + valueHeight(card.id) + (card.invocations?.length > 1 ? 36 : 0);
      const children = innerCards.filter((child) => child.parentId === card.id);
      if (card.controlLayout) {
        for (const child of children) {
          child.offsetY = card.headerHeight + 16 + child.layoutY;
        }
        card.height = card.headerHeight + 16 + card.controlLayout.height + 32;
        continue;
      }
      const rows = [];
      for (const child of children) {
        child.height = HEIGHT + valueHeight(child.id);
        rows[child.row] = Math.max(rows[child.row] ?? 0, child.height);
      }
      for (const child of children)
        child.offsetY =
          card.headerHeight +
          16 +
          rows
            .slice(0, child.row)
            .reduce((sum, height) => sum + height + STEP_GAP, 0);
      card.height =
        card.headerHeight +
        (children.length
          ? rows.reduce((sum, height) => sum + height + STEP_GAP, 16)
          : 0);
    }
    const diagramCards = [...cards, ...innerCards];
    for (const card of diagramCards) {
      card.inline = grouped;
      card.valuesOpen = openValues.has(card.id);
      card.onValues = onValues;
    }
    const key = JSON.stringify([
      mode,
      vertical,
      vertical ? null : surface.clientWidth,
      diagramCards.map((card) => [
        card.id,
        card.width,
        card.height,
        card.expanded,
      ]),
      [...boundaries.values()],
      links,
    ]);
    const rebuild = key !== signature;
    if (rebuild) {
      signature = key;
      graph.clearCells();
      nodeCells = new Map();
      groupCells = new Map();
      edgeCells = [];
      const layout = new dagre.graphlib.Graph({ compound: grouped })
        .setGraph({
          rankdir: vertical ? 'TB' : 'LR',
          align: 'UL',
          ranksep: grouped ? 64 : 40,
          nodesep: grouped ? 28 : 24,
          marginx: 20,
          marginy: 20,
        })
        .setDefaultEdgeLabel(() => ({}));
      for (const card of cards)
        layout.setNode(card.id, { width: card.width, height: card.height });
      for (const boundary of boundaries.values())
        layout.setNode(boundary.id, {});
      for (const boundary of boundaries.values())
        if (boundary.parent) layout.setParent(boundary.id, boundary.parent);
      for (const [id, parent] of parents) layout.setParent(id, parent);
      for (const [from, to, callId] of links) {
        const labels = grouped
          ? (returns.get(callId) ?? []).map((item) => item.label)
          : [];
        layout.setEdge(
          from,
          to,
          labels.length
            ? {
                width:
                  Math.max(
                    ...labels.flatMap((label) =>
                      label.split('\n').map((line) => line.length * 6),
                    ),
                  ) + 16,
                height: 40,
                labelpos: 'c',
              }
            : {},
        );
      }
      dagre.layout(layout);
      if (grouped && !vertical) {
        const files = [...boundaries.values()]
          .filter((boundary) => boundary.kind === 'file')
          .sort((a, b) => layout.node(a.id).x - layout.node(b.id).x);
        let right = 20,
          rowHeight = 0,
          rowTop;
        const top = Math.min(
          ...files.map((file) => {
            const point = layout.node(file.id);
            return point.y - point.height / 2;
          }),
        );
        rowTop = top;
        for (const file of files) {
          const point = layout.node(file.id);
          if (right > 20 && right + point.width > surface.clientWidth - 40) {
            right = 20;
            rowTop += rowHeight + 64;
            rowHeight = 0;
          }
          const shift = rowTop - (point.y - point.height / 2);
          const dx = right - (point.x - point.width / 2);
          right += point.width + 64;
          rowHeight = Math.max(rowHeight, point.height);
          for (const id of [
            file.id,
            ...file.members,
            ...[...boundaries.values()]
              .filter((owner) => owner.parent === file.id)
              .map((owner) => owner.id),
          ]) {
            layout.node(id).y += shift;
            layout.node(id).x += dx;
          }
        }
      }
      for (const boundary of boundaries.values()) {
        const point = layout.node(boundary.id);
        const cell = graph.addNode({
          id: boundary.id,
          shape: 'code-anime-group',
          x: point.x - point.width / 2,
          y: point.y - point.height / 2 - (boundary.kind === 'file' ? 20 : 0),
          width: point.width,
          height: point.height + (boundary.kind === 'file' ? 20 : 0),
          zIndex: boundary.kind === 'file' ? -3 : -2,
          data: {
            ...boundary,
            active:
              cursor > 0 &&
              boundary.members.includes(grouped ? activeFunctionId : activeId),
          },
        });
        groupCells.set(boundary.id, cell);
      }
      for (const boundary of boundaries.values())
        if (boundary.parent)
          groupCells.get(boundary.parent).addChild(groupCells.get(boundary.id));
      for (const card of cards) {
        const point = layout.node(card.id);
        const cell = graph.addNode({
          id: card.id,
          shape: 'code-anime-card',
          x: point.x - card.width / 2,
          y: point.y - card.height / 2,
          width: card.width,
          height: card.height,
          zIndex: card.expanded ? 0 : 2,
          data: { ...card, onSelect, onSeek, onExpand },
        });
        nodeCells.set(card.id, cell);
        if (parents.has(card.id))
          groupCells.get(parents.get(card.id)).addChild(cell);
      }
      for (const region of controlRegions) {
        const parent = nodeCells.get(region.parentId);
        const position = parent.position();
        const cell = graph.addNode({
          id: region.id,
          shape: 'code-anime-control-region',
          x: position.x + 16 + region.x,
          y: position.y + parent.getData().headerHeight + 16 + region.y,
          width: region.width,
          height: Math.max(1, region.height),
          zIndex: 1,
          data: region,
        });
        const owner = region.parentRegionId
          ? graph.getCellById(region.parentRegionId)
          : parent;
        if (!owner)
          throw new Error(
            `Missing source-proven parent region for ${region.id}`,
          );
        owner.addChild(cell);
      }
      for (const card of innerCards) {
        const parent = nodeCells.get(card.parentId);
        const position = parent.position();
        const cell = graph.addNode({
          id: card.id,
          shape: 'code-anime-card',
          x: position.x + 16 + (card.x ?? card.column * (WIDTH + STEP_GAP)),
          y: position.y + card.offsetY,
          width: card.width ?? WIDTH,
          height: card.height,
          zIndex: 2,
          data: { ...card, onSelect, onSeek, onExpand },
        });
        const owner = card.parentRegionId
          ? graph.getCellById(card.parentRegionId)
          : parent;
        if (!owner)
          throw new Error(`Missing source-proven parent region for ${card.id}`);
        owner.addChild(cell);
        nodeCells.set(card.id, cell);
      }
      const stepNodes = new Map(
        innerCards
          .filter((card) => card.level === 'step')
          .map((card) => [card.index, card.id]),
      );
      const bounds = (id) => {
        const box = nodeCells.get(id).getBBox();
        return {
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
          width: box.width,
          height: box.height,
        };
      };
      const obstacles = diagramCards.map((card) => {
        const box = nodeCells.get(card.id).getBBox();
        return {
          id: card.id,
          x: box.x,
          y: box.y,
          width: box.width,
          height:
            card.expanded && !card.parentId ? card.headerHeight : box.height,
        };
      });
      // Group interiors are traversable, but their title strips are not.
      for (const [id, cell] of groupCells) {
        const box = cell.getBBox();
        obstacles.push({
          id,
          x: box.x,
          y: box.y,
          width: box.width,
          height: 28,
        });
      }
      for (const region of controlRegions) {
        const cell = graph.getCellById(region.id);
        const label = graph
          .findViewByCell(cell)
          ?.container.querySelector('.diagram-control-region > span');
        if (!label) continue;
        const box = cell.getBBox();
        obstacles.push({
          id: region.id + '-label',
          x: box.x + label.offsetLeft,
          y: box.y + label.offsetTop,
          width: label.offsetWidth,
          height: label.offsetHeight,
        });
      }
      const rectangles = new Map(obstacles.map((box) => [box.id, box]));
      const planner = createRoutePlanner(obstacles);
      const pending = controlEdges.map((edge) => ({
        ...edge,
        kind: edge.kind ?? 'step-order',
      }));
      for (const [from, to, invocationId] of [...innerLinks, ...links]) {
        const internal = Boolean(nodeCells.get(to).getData().parentId);
        const callId = invocationId ?? to;
        const entry = entryById.get(callId);
        const realCall = grouped && !internal;
        const firstAppearance =
          !grouped && !internal && scope?.kind !== 'method';
        // Expanded methods show selected prepared visits; other calls remain in the picker/trace.
        if (
          grouped &&
          !internal &&
          nodeCells.get(from).getData().expanded &&
          entry?.callSiteIndex &&
          !stepNodes.has(entry.callSiteIndex)
        )
          continue;
        const source =
          grouped && !internal
            ? (stepNodes.get(entry?.callSiteIndex) ?? from)
            : from;
        const target =
          grouped && !internal ? (stepNodes.get(entry?.index) ?? to) : to;
        pending.push({
          source,
          target,
          kind: realCall
            ? 'call'
            : firstAppearance
              ? 'first-appearance'
              : 'step-order',
          callId: realCall ? callId : undefined,
          index: realCall ? (entry?.callSiteIndex ?? entry?.index) : undefined,
          label: firstAppearance
            ? 'First appearance order—not a call'
            : undefined,
          description: realCall
            ? `Call ${callId}: ${entry?.parentSymbol ?? from} to ${entry?.symbol ?? to} · step ${entry?.callSiteIndex ?? entry?.index}`
            : firstAppearance
              ? `First appearance order—not a call: ${from} to ${to}`
              : undefined,
          fallback:
            realCall &&
            (!stepNodes.has(entry?.callSiteIndex) ||
              !stepNodes.has(entry?.index))
              ? 'Exact call/entry card unavailable; connected to method overview'
              : undefined,
        });
        if (grouped && !internal)
          for (const item of returns.get(callId) ?? [])
            pending.push({
              source: stepNodes.get(item.index) ?? to,
              target: source,
              kind: 'return',
              callId,
              fallback:
                !stepNodes.has(item.index) ||
                !stepNodes.has(entry?.callSiteIndex)
                  ? 'Exact return/call card unavailable; connected to method overview'
                  : undefined,
              ...item,
            });
      }
      const unavailable = [];
      const reservedEdgeLabels = [];
      let missingConnections = 0;
      const endpoint = (id, point) => {
        const center = bounds(id);
        return {
          cell: id,
          anchor: {
            name: 'center',
            args: { dx: point.x - center.x, dy: point.y - center.y },
          },
          connectionPoint: { name: 'anchor' },
        };
      };
      for (const item of pending) {
        const sourceCell = nodeCells.get(item.source);
        const targetCell = nodeCells.get(item.target);
        if (!sourceCell || !targetCell) {
          missingConnections++;
          unavailable.push(
            `${item.kind}: missing prepared endpoint; no route drawn`,
          );
          continue;
        }
        const sourceCard = sourceCell.getData();
        const targetCard = targetCell.getData();
        const controlEdge =
          sourceCard.parentId && sourceCard.parentId === targetCard.parentId;
        const origin = nodeCells.get(sourceCard.parentId)?.position();
        const parentData = nodeCells.get(sourceCard.parentId)?.getData();
        const nativePoints = item.points?.map((point) => ({
          x: point.x + origin.x + 16,
          y: point.y + origin.y + parentData.headerHeight + 16,
        }));
        const route = nativePoints
          ? nativePoints.length >= 2
            ? { points: nativePoints }
            : null
          : planner.route(
              {
                ...rectangles.get(item.source),
                ...(sourceCard.control === 'decision'
                  ? { shape: 'diamond' }
                  : {}),
                ...(controlEdge
                  ? {
                      sides:
                        !vertical && item.kind === 'branch'
                          ? ['right', 'bottom']
                          : [
                              item.sourceSide ??
                                (vertical ? 'bottom' : 'right'),
                            ],
                      centered: true,
                    }
                  : {}),
              },
              item.kind === 'call' &&
                nodeCells.get(item.target).getData().expanded
                ? {
                    ...rectangles.get(item.target),
                    height: HEIGHT,
                    sides: ['left', 'right'],
                  }
                : {
                    ...rectangles.get(item.target),
                    ...(targetCard.control === 'decision'
                      ? { shape: 'diamond' }
                      : {}),
                    ...(controlEdge
                      ? {
                          sides:
                            !vertical && item.kind === 'branch'
                              ? ['left', 'top']
                              : [
                                  item.targetSide ??
                                    (vertical ? 'top' : 'left'),
                                ],
                          centered: true,
                        }
                      : {}),
                  },
              item.label,
            );
        if (!route) {
          missingConnections++;
          unavailable.push(
            `${item.kind} (${item.status ?? 'unavailable'}): ${sourceCard.symbol ?? item.source} to ${targetCard.symbol ?? item.target}; no route drawn`,
          );
          continue;
        }
        const { points, label } = route;
        const status =
          item.status ?? (item.inactive ? 'not-selected' : 'prepared');
        const fallback = item.fallback;
        const edgeLabel =
          item.label ??
          (item.kind === 'branch'
            ? 'BRANCH'
            : item.kind === 'catch'
              ? 'EXCEPTION'
              : item.kind === 'finally'
                ? 'FINALLY'
                : item.kind === 'loopback'
                  ? 'LOOP'
                  : undefined);
        // Native ELK routes have no label reservation. Never overlay their
        // text on a control node or another label at an arbitrary midpoint.
        const labelBox =
          label?.box ??
          (edgeLabel
            ? reserveRouteLabel(
                points,
                edgeLabel,
                obstacles,
                reservedEdgeLabels,
              )
            : null);
        if (label?.box) reservedEdgeLabels.push(label.box);
        edgeCells.push(
          graph.addEdge({
            source: endpoint(item.source, points[0]),
            target: endpoint(item.target, points.at(-1)),
            vertices: points.slice(1, -1),
            connector: {
              name: 'jumpover',
              args: { size: 6, type: 'arc', radius: 8 },
            },
            zIndex: 1,
            data: {
              kind: item.kind,
              index: item.index,
              callId: item.callId,
              inactive: item.inactive,
              status,
            },
            attrs: {
              root: {
                'aria-label': `${item.description ?? `${edgeLabel ?? item.kind}: ${item.source} to ${item.target}`} · ${status}${fallback ? ` · ${fallback}` : ''}`,
                'data-edge-kind': item.kind,
                'data-edge-status': status,
                'data-fallback': fallback ?? '',
                'data-source-node': item.source,
                'data-target-node': item.target,
                'data-route': JSON.stringify(points),
                'data-label-box': labelBox ? JSON.stringify(labelBox) : '',
              },
              line: {
                stroke: '#64748b',
                strokeWidth: 1.5,
                strokeDasharray:
                  status === 'unknown'
                    ? '8 4 2 4'
                    : status === 'possible'
                      ? '4 4'
                      : status === 'not-selected'
                        ? '2 6'
                        : item.kind === 'return' ||
                            item.kind === 'first-appearance'
                          ? '5 7'
                          : '',
                targetMarker: { name: 'block', width: 7, height: 6 },
              },
            },
            labels:
              edgeLabel && labelBox
                ? [
                    {
                      position: {
                        distance: 0,
                        offset: {
                          x: labelBox.x + labelBox.width / 2 - points[0].x,
                          y: labelBox.y + labelBox.height / 2 - points[0].y,
                        },
                      },
                      attrs: {
                        label: {
                          text: edgeLabel,
                          fontSize: 10,
                          fill: 'var(--diagram-ink)',
                        },
                        body: {
                          fill: 'var(--diagram-card)',
                          stroke: 'var(--diagram-border)',
                          rx: 3,
                          ry: 3,
                        },
                      },
                    },
                  ]
                : [],
          }),
        );
      }
      routingStatus.replaceChildren();
      routingStatus.hidden = unavailable.length === 0;
      if (unavailable.length) {
        const summary = element(
          'summary',
          `${missingConnections} connections not drawn`,
        );
        summary.setAttribute('aria-live', 'polite');
        const list = element('ul');
        for (const text of unavailable) list.append(element('li', text));
        routingStatus.append(
          summary,
          element(
            'p',
            'Collapse unrelated methods or filter owners to free routing space. Inspect a method for its prepared return value.',
          ),
          list,
        );
      }
      if (selectedId) selectNode(selectedId);
      if (fitLayout) fit();
      renderedTraceRevision = traceRevision;
      showGeometryStatus();
    } else if (cursor !== previousCursor) {
      for (const card of diagramCards)
        nodeCells
          .get(card.id)
          ?.setData({ ...card, onSelect, onSeek, onExpand });
    }
    for (const boundary of boundaries.values())
      groupCells.get(boundary.id)?.setData({
        ...boundary,
        active:
          cursor > 0 &&
          boundary.members.includes(grouped ? activeFunctionId : activeId),
      });
    const activeCard =
      innerCards.find((card) => card.active && card.level === 'step') ??
      cards.find((card) => card.active);
    const activeCards = new Set(
      diagramCards.filter((card) => card.active).map((card) => card.id),
    );
    for (const edge of edgeCells) {
      const isReturn = edge.getData().kind === 'return';
      const firstAppearance = edge.getData().kind === 'first-appearance';
      const active =
        edge.getData().status !== 'prepared' || firstAppearance
          ? false
          : isReturn
            ? edge.getData().index === cursor
            : grouped && edge.getData().kind === 'call'
              ? cursor > 0 &&
                current?.kind !== 'return' &&
                edge.getData().callId === activeId
              : activeCards.has(edge.getTargetCellId());
      edge.attr('line/stroke', active ? '#4f46e5' : '#64748b');
      edge.attr('line/strokeWidth', active ? 2.5 : 1.5);
      edge.attr(
        'line/class',
        active && (isReturn || !grouped) && !reducedMotion
          ? 'diagram-edge-active'
          : '',
      );
      edge.attr(
        'line/strokeDasharray',
        edge.getData().status === 'unknown'
          ? '8 4 2 4'
          : edge.getData().status === 'possible'
            ? '4 4'
            : edge.getData().status === 'not-selected'
              ? '2 6'
              : isReturn ||
                  firstAppearance ||
                  edge.getData().inactive ||
                  (!grouped && active && !reducedMotion)
                ? '5 7'
                : '',
      );
    }
    highlightSelection();
    if (!rebuild && follow && cursor !== previousCursor && activeCard) {
      if (scope) fit();
      else {
        const cell = nodeCells.get(activeCard.id);
        const bounds = graph.localToClient(cell.getBBox());
        const viewport = surface.getBoundingClientRect();
        const toolbar = controls.getBoundingClientRect();
        const covered =
          bounds.x + bounds.width > toolbar.left &&
          bounds.x < toolbar.right &&
          bounds.y + bounds.height > toolbar.top;
        if (
          covered ||
          bounds.x < viewport.left + 12 ||
          bounds.y < viewport.top + 12 ||
          bounds.x + bounds.width > viewport.right - 12 ||
          bounds.y + bounds.height > viewport.bottom - 12
        ) {
          graph.centerCell(cell);
          const centered = graph.localToClient(cell.getBBox());
          if (
            centered.x + centered.width > toolbar.left &&
            centered.x < toolbar.right
          )
            pan(
              0,
              Math.min(0, toolbar.top - 12 - centered.y - centered.height),
            );
        }
      }
    }
    previousCursor = cursor;
    if (rebuild || !pages.childNodes.length) {
      pages.replaceChildren();
      if (scope) {
        const count = scopedCards?.length ?? pathCount ?? flow.steps.length;
        const move = (delta) => {
          page += delta;
          manualPage = true;
          render(options);
        };
        const prev = button('‹', 'Previous diagram page', () => move(-1));
        const nextPage = button('›', 'Next diagram page', () => move(1));
        prev.disabled = page === 0;
        nextPage.disabled = (page + 1) * PAGE_SIZE >= count;
        pages.append(
          prev,
          element(
            'span',
            count
              ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, count)} / ${count}`
              : 'No steps',
          ),
          nextPage,
        );
      } else
        pages.append(element('span', `${cards.length} visible · drag to pan`));
    }
    if (focusSelector && !focused.isConnected) {
      const replacement = container.querySelector(focusSelector);
      (replacement && !replacement.disabled
        ? replacement
        : controls.querySelector('button[aria-label="Fit diagram"]')
      ).focus({ preventScroll: true });
    }
  }
  function dispose() {
    disposed = true;
    runningGeometry?.abort.abort();
    controlLayout.dispose();
    observer.disconnect();
    container.removeEventListener('focusin', onFocus);
    graph.dispose();
    container.replaceChildren();
  }
  return { setFlow, render, zoom, fit, dispose, advance };
}
