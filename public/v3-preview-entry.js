import {
  selectReadyVariant,
  validateFlowSceneDocument,
} from './v3-scene-adapter.js';

const preview = document.querySelector('#v3-preview');
const input = document.querySelector('#v3-file');
const status = document.querySelector('#v3-status');
const variantSelect = document.querySelector('#v3-variant');
const counts = {
  nodes: document.querySelector('#v3-nodes'),
  edges: document.querySelector('#v3-edges'),
  groups: document.querySelector('#v3-groups'),
};

let documentData = null;
let loadRevision = 0;

function clear(state, message) {
  documentData = null;
  preview.dataset.v3State = state;
  status.textContent = message;
  variantSelect.replaceChildren();
  variantSelect.disabled = true;
  for (const count of Object.values(counts)) count.textContent = '—';
}

function displayVariant() {
  const variant = selectReadyVariant(documentData, variantSelect.value);
  if (variant?.availability !== 'ready') {
    clear('invalid', 'Invalid V3 document: selected variant is not ready.');
    return;
  }
  counts.nodes.textContent = String(variant.graph.nodes.length);
  counts.edges.textContent = String(variant.graph.edges.length);
  counts.groups.textContent = String(variant.graph.groups.length);
  preview.dataset.v3State = 'scaffold-only';
  status.textContent =
    'V3 document validated. Graph rendering is not connected.';
}

input.addEventListener('change', async () => {
  const revision = ++loadRevision;
  const file = input.files?.[0];
  if (!file) {
    clear('idle', 'Choose a local V3 JSON fixture to validate.');
    return;
  }
  clear('loading', 'Validating V3 JSON…');
  try {
    const raw = await file.text();
    const validated = validateFlowSceneDocument(raw);
    if (revision !== loadRevision) return;

    documentData = validated;
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
