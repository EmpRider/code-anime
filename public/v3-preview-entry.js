import './v3-preview.css';
import {
  selectReadyVariant,
  validateFlowSceneDocument,
} from './v3-scene-adapter.js';
import { createV3SceneLayout } from './v3-scene-geometry.js';
import { renderV3Scene } from './v3-scene-diagram.js';

const preview = document.querySelector('#v3-preview');
const input = document.querySelector('#v3-file');
const status = document.querySelector('#v3-status');
const variantSelect = document.querySelector('#v3-variant');
const orientationSelect = document.querySelector('#v3-orientation');
const groupControls = document.querySelector('#v3-group-controls');
const groupChoices = document.querySelector('#v3-group-choices');
const cursorInput = document.querySelector('#v3-cursor');
const cursorValue = document.querySelector('#v3-cursor-value');
const canvas = document.querySelector('.v3-preview-canvas');
const scene = document.querySelector('#v3-scene');
const emptyState = document.querySelector('#v3-empty-state');
const counts = {
  nodes: document.querySelector('#v3-nodes'),
  edges: document.querySelector('#v3-edges'),
  groups: document.querySelector('#v3-groups'),
};

let documentData = null;
let layout = null;
let graphHandle = null;
let layoutAbort = null;
let geometry = null;
let loadRevision = 0;
let paintRevision = 0;
let viewportKey = '';
let collapsedGroupIds = new Set();

function disposeScene() {
  ++paintRevision;
  layoutAbort?.abort();
  layoutAbort = null;
  graphHandle?.dispose();
  graphHandle = null;
  geometry = null;
  scene.replaceChildren();
}

function showUnavailable(message) {
  preview.dataset.v3State = 'layout-unavailable';
  status.textContent = `V3 graph unavailable: ${message}`;
  emptyState.querySelector('h2').textContent = 'Graph unavailable';
  emptyState.querySelector('p').textContent = message;
}

function clear(state, message) {
  disposeScene();
  layout?.dispose();
  layout = null;
  documentData = null;
  preview.dataset.v3State = state;
  status.textContent = message;
  variantSelect.replaceChildren();
  variantSelect.disabled = true;
  groupChoices.textContent = 'No groups in selected variant.';
  groupControls.disabled = true;
  cursorInput.disabled = true;
  cursorInput.max = '0';
  cursorInput.value = '0';
  cursorValue.textContent = '0 / 0';
  collapsedGroupIds = new Set();
  for (const count of Object.values(counts)) count.textContent = '—';
}

function selectedVariant() {
  const variant = selectReadyVariant(documentData, variantSelect.value);
  if (variant?.availability !== 'ready')
    throw new Error('Selected variant is not ready');
  return variant;
}

function selectedFrame(variant) {
  const cursor = Number(cursorInput.value);
  return cursor === 0
    ? variant.playback.initial
    : variant.playback.frames[cursor - 1];
}

function presentationState(variant, viewport) {
  const frame = selectedFrame(variant);
  return {
    variantId: variantSelect.value,
    orientation: orientationSelect.value,
    viewport,
    collapsedGroupIds: [...collapsedGroupIds],
    activeNodeIds: frame.activeNodeIds ?? [],
    activeEdgeIds: frame.activeEdgeIds ?? [],
  };
}

async function paint(variant, currentGeometry, state, revision) {
  const mounted = await renderV3Scene(scene, variant, currentGeometry, state);
  if (revision !== paintRevision) {
    mounted.dispose();
    return;
  }
  graphHandle = mounted;
  mounted.graph.zoomToFit({ padding: 28, maxScale: 1 });
  preview.dataset.v3State = 'ready';
  status.textContent = `Rendered ${currentGeometry.nodes.length} nodes, ${currentGeometry.edges.length} edges and ${currentGeometry.groups.length} groups from the selected V3 variant. ${currentGeometry.hiddenEdgeIds.length} edges hidden inside collapsed groups.`;
}

async function relayout() {
  if (!documentData || !layout) return;
  disposeScene();
  const revision = paintRevision;
  const variant = selectedVariant();
  const viewport = { width: canvas.clientWidth, height: canvas.clientHeight };
  viewportKey = `${viewport.width}x${viewport.height}`;
  const state = presentationState(variant, viewport);
  layoutAbort = new AbortController();
  cursorInput.disabled = true;
  preview.dataset.v3State = 'layout-loading';
  status.textContent = `Computing ${orientationSelect.value} V3 graph using the local ELK Worker…`;
  try {
    const result = await layout.layout(variant, {
      presentationState: state,
      signal: layoutAbort.signal,
    });
    if (revision !== paintRevision) return;
    geometry = result;
    await paint(variant, result, state, revision);
  } catch (error) {
    if (revision === paintRevision)
      showUnavailable(error?.message ?? 'unknown layout error');
  } finally {
    if (revision === paintRevision) {
      layoutAbort = null;
      cursorInput.disabled = false;
    }
  }
}

async function repaintFrame() {
  if (!geometry || !documentData) return;
  graphHandle?.dispose();
  graphHandle = null;
  const revision = ++paintRevision;
  try {
    const variant = selectedVariant();
    await paint(
      variant,
      geometry,
      presentationState(variant, {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      }),
      revision,
    );
  } catch (error) {
    if (revision === paintRevision)
      showUnavailable(error?.message ?? 'unknown rendering error');
  }
}

function displayVariant() {
  const variant = selectedVariant();
  counts.nodes.textContent = String(variant.graph.nodes.length);
  counts.edges.textContent = String(variant.graph.edges.length);
  counts.groups.textContent = String(variant.graph.groups.length);
  collapsedGroupIds = new Set();
  groupChoices.replaceChildren();
  for (const group of variant.graph.groups) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.v3GroupId = group.id;
    label.append(checkbox, document.createTextNode(group.label));
    groupChoices.append(label);
  }
  if (!variant.graph.groups.length)
    groupChoices.textContent = 'No groups in selected variant.';
  groupControls.disabled = !variant.graph.groups.length;
  cursorInput.max = String(variant.playback.frames.length);
  cursorInput.value = '0';
  cursorValue.textContent = `0 / ${variant.playback.frames.length}`;
  void relayout();
}

input.addEventListener('change', async () => {
  const revision = ++loadRevision;
  const file = input.files?.[0];
  if (!file) {
    clear('idle', 'Choose a local V3 JSON fixture to validate.');
    return;
  }
  clear('loading', 'Validating local V3 JSON…');
  try {
    const validated = validateFlowSceneDocument(await file.text());
    if (revision !== loadRevision) return;
    documentData = validated;
    layout = createV3SceneLayout();
    for (const id of validated.comparison.variantOrder) {
      const option = document.createElement('option');
      option.value = id;
      const ready = validated.variantsById[id].availability === 'ready';
      option.textContent = `${id}${ready ? '' : ' (unavailable)'}`;
      option.disabled = !ready;
      variantSelect.append(option);
    }
    variantSelect.value = validated.comparison.defaultVariantId;
    variantSelect.disabled = false;
    displayVariant();
  } catch (error) {
    if (revision !== loadRevision) return;
    clear('invalid', `Invalid V3 document: ${error?.message ?? 'read failed'}`);
  }
});

variantSelect.addEventListener('change', () => {
  if (documentData) displayVariant();
});
orientationSelect.addEventListener('change', () => {
  if (documentData) void relayout();
});
groupChoices.addEventListener('change', (event) => {
  const id = event.target?.dataset?.v3GroupId;
  if (!id || !documentData) return;
  if (event.target.checked) collapsedGroupIds.add(id);
  else collapsedGroupIds.delete(id);
  void relayout();
});
cursorInput.addEventListener('input', () => {
  if (!documentData) return;
  cursorValue.textContent = `${cursorInput.value} / ${cursorInput.max}`;
  void repaintFrame(); // Prepared frame highlighting never asks ELK to relayout.
});

if (typeof ResizeObserver === 'function') {
  new ResizeObserver(() => {
    if (!documentData) return;
    const next = `${canvas.clientWidth}x${canvas.clientHeight}`;
    if (next !== viewportKey) void relayout();
  }).observe(canvas);
}
