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
import { layoutControlFlow } from './diagram-control-layout.js';
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
      element('span', data.kind, 'diagram-kind'),
      element(
        'span',
        data.active ? `Current · ${data.certainty}` : data.certainty,
        'diagram-state',
      ),
    );
    const name = element('button', data.label, 'diagram-name');
    name.type = 'button';
    name.title = data.code ?? data.symbol;
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
  const button = (label, name, action) => {
    const node = element('button', label);
    node.type = 'button';
    node.title = name;
    node.setAttribute('aria-label', name);
    node.onclick = action;
    return node;
  };
  let direction = 'vertical';
  try {
    if (localStorage.getItem('code-anime-layout') === 'horizontal')
      direction = 'horizontal';
  } catch {}
  const orientation = button('', '', () => {
    direction = direction === 'vertical' ? 'horizontal' : 'vertical';
    try {
      localStorage.setItem('code-anime-layout', direction);
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
    button('Fit', 'Fit diagram', () => fit()),
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
  footer.append(pages, routingStatus, controls);
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
  graph.on('scale', () =>
    container.classList.toggle('diagram-overview', graph.zoom() < 0.6),
  );
  let signature = '',
    previousCursor = -1,
    disposed = false;
  let nodeCells = new Map(),
    groupCells = new Map(),
    edgeCells = [];
  const collapsed = new Set();
  const expanded = new Set();
  const selectedInvocations = new Map();
  const selectedVisits = new Map();
  let semantic;
  const openValues = new Set();
  const valueHeight = (id) => (openValues.has(id) ? 160 : 0);
  const onValues = (id) => {
    onPause?.();
    if (openValues.has(id)) openValues.delete(id);
    else openValues.add(id);
    render(options, false);
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
  function fit() {
    if (
      !disposed &&
      surface.clientWidth &&
      surface.clientHeight &&
      graph.getNodes().length
    ) {
      graph.resize(surface.clientWidth, surface.clientHeight);
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
    if (events.length && mode === 'map') {
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
    if (!scope && mode === 'map' && (signature === '' || oldMode !== mode)) {
      groups.replaceChildren();
      for (const name of new Set(entries.map((entry) => entry.className))) {
        const toggle = button(name, 'Toggle group ' + name, () => {
          if (collapsed.has(name)) collapsed.delete(name);
          else collapsed.add(name);
          signature = '';
          render(options);
        });
        toggle.setAttribute('aria-pressed', String(!collapsed.has(name)));
        groups.append(toggle);
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
    for (const card of cards) {
      const method = semantic.methods.find((item) => item.id === card.callId);
      if (card.expanded && method) {
        const layout = layoutControlFlow(method.items, {
          direction,
          maxWidth: Math.max(340, surface.clientWidth - 144),
          targetAspectRatio: Math.max(
            1.8,
            Math.min(
              2.4,
              surface.clientWidth / Math.max(1, surface.clientHeight),
            ),
          ),
          cursor: follow ? cursor : 0,
          visits: selectedVisits,
          extraHeight: (id) =>
            valueHeight(JSON.stringify(['control', card.id, id])),
        });
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
          const event = events[index - 1];
          innerCards.push({
            id: ids.get(item.id),
            parentId: card.id,
            index,
            event,
            symbol: event.symbolId,
            callId: card.callId,
            source: event.source,
            certainty: event.certainty,
            level: 'step',
            kind: event.kind,
            control: item.control,
            label: item.control ? item.node.title : event.label,
            x: item.x,
            layoutY: item.y,
            width: item.width,
            height: item.height,
            expandLabel: 'Go to source step ' + index,
            expandable: false,
            value: snapshot(event),
            active: cursor === index,
            visits: item.node.iterations,
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
        parent.addChild(cell);
        nodeCells.set(card.id, cell);
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
        parent.addChild(cell);
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
          kind: internal ? 'step-order' : 'call',
          callId: internal ? undefined : callId,
          index: internal ? undefined : (entry?.callSiteIndex ?? entry?.index),
          description: internal
            ? undefined
            : `Call ${callId}: ${entry?.parentSymbol ?? from} to ${entry?.symbol ?? to} · step ${entry?.callSiteIndex ?? entry?.index}`,
        });
        if (grouped && !internal)
          for (const item of returns.get(callId) ?? [])
            pending.push({
              source: stepNodes.get(item.index) ?? to,
              target: source,
              kind: 'return',
              callId,
              ...item,
            });
      }
      const unavailable = [];
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
        const sourceCard = nodeCells.get(item.source).getData();
        const targetCard = nodeCells.get(item.target).getData();
        const controlEdge =
          sourceCard.parentId && sourceCard.parentId === targetCard.parentId;
        const route = planner.route(
          {
            ...rectangles.get(item.source),
            ...(sourceCard.control === 'decision' ? { shape: 'diamond' } : {}),
            ...(controlEdge
              ? {
                  sides:
                    !vertical && item.kind === 'branch'
                      ? ['right', 'bottom']
                      : [item.sourceSide ?? (vertical ? 'bottom' : 'right')],
                  centered: true,
                }
              : {}),
          },
          item.kind === 'call' && nodeCells.get(item.target).getData().expanded
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
                          : [item.targetSide ?? (vertical ? 'top' : 'left')],
                      centered: true,
                    }
                  : {}),
              },
          item.label,
        );
        if (!route) {
          missingConnections++;
          unavailable.push(
            `${item.kind}: ${nodeCells.get(item.source).getData().symbol} to ${nodeCells.get(item.target).getData().symbol}`,
          );
          continue;
        }
        const { points, label } = route;
        const labelBox = label?.box;
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
            },
            attrs: {
              root: {
                'aria-label':
                  item.description ??
                  `${item.kind}: ${item.source} to ${item.target}`,
                'data-edge-kind': item.kind,
                'data-source-node': item.source,
                'data-target-node': item.target,
                'data-route': JSON.stringify(points),
                'data-label-box': labelBox ? JSON.stringify(labelBox) : '',
              },
              line: {
                stroke: '#64748b',
                strokeWidth: 1.5,
                strokeDasharray: item.kind === 'return' ? '5 7' : '',
                targetMarker: { name: 'block', width: 7, height: 6 },
              },
            },
            labels: labelBox
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
                        text: item.label,
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
      const active = isReturn
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
        isReturn ||
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
    observer.disconnect();
    container.removeEventListener('focusin', onFocus);
    graph.dispose();
    container.replaceChildren();
  }
  return { setFlow, render, zoom, fit, dispose, advance };
}
