import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const fixture = await readFile(
  new URL('./fixtures/v3/proposed-baseline.json', import.meta.url),
  'utf8',
);
const htmlUrl = new URL('../public/v3-preview.html', import.meta.url);

test('a mounted ready graph hides the placeholder without hiding layout errors', async () => {
  const dom = new JSDOM(await readFile(htmlUrl, 'utf8'));
  const style = dom.window.document.createElement('style');
  style.textContent = await readFile(
    new URL('../public/v3-preview.css', import.meta.url),
    'utf8',
  );
  dom.window.document.head.append(style);
  const root = dom.window.document.querySelector('#v3-preview');
  const placeholder = dom.window.document.querySelector('#v3-empty-state');
  root.dataset.v3State = 'ready';
  assert.equal(dom.window.getComputedStyle(placeholder).display, 'none');
  root.dataset.v3State = 'layout-unavailable';
  assert.notEqual(dom.window.getComputedStyle(placeholder).display, 'none');
  dom.window.close();
});

async function mount() {
  const html = await readFile(htmlUrl, 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/v3-preview.html' });
  globalThis.document = dom.window.document;
  const canvas = dom.window.document.querySelector('.v3-preview-canvas');
  Object.defineProperties(canvas, {
    clientWidth: { value: 900 },
    clientHeight: { value: 600 },
  });
  await import(`../public/v3-preview/preview.js?test=${Math.random()}`);
  const main = dom.window.document.querySelector('#v3-preview');
  const input = dom.window.document.querySelector('#v3-file');
  const variant = dom.window.document.querySelector('#v3-variant');
  const status = dom.window.document.querySelector('#v3-status');

  async function upload(contents) {
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [{ text: async () => contents }],
    });
    input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await new Promise((resolve) => setImmediate(resolve));
  }

  return { dom, main, variant, status, upload };
}

test('a valid synthetic V3 document exposes graph controls, but fails closed when Worker is unavailable', async () => {
  const ui = await mount();
  await ui.upload(fixture);
  assert.equal(ui.main.dataset.v3State, 'layout-unavailable');
  assert.match(ui.status.textContent, /worker unavailable/i);
  assert.equal(ui.main.querySelector('#v3-nodes').textContent, '2');
  assert.equal(ui.main.querySelector('#v3-edges').textContent, '1');
  assert.equal(ui.main.querySelector('#v3-groups').textContent, '0');
  assert.equal(ui.main.querySelector('.v3-preview-canvas svg'), null);
  const orientation = ui.main.querySelector('#v3-orientation');
  assert.equal(orientation.value, 'horizontal');
  orientation.value = 'vertical';
  orientation.dispatchEvent(new ui.dom.window.Event('change'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(orientation.value, 'vertical');
  assert.equal(ui.variant.disabled, false);
  ui.variant.value = 'baseline';
  ui.variant.dispatchEvent(new ui.dom.window.Event('change'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(ui.main.querySelector('#v3-nodes').textContent, '1');
  assert.equal(ui.main.querySelector('#v3-edges').textContent, '0');
  ui.dom.window.close();
});

test('malformed JSON fails closed and clears a previously loaded variant', async () => {
  const ui = await mount();
  await ui.upload(fixture);
  await ui.upload('{invalid');
  assert.equal(ui.main.dataset.v3State, 'invalid');
  assert.match(ui.status.textContent, /invalid/i);
  assert.equal(ui.main.querySelector('#v3-nodes').textContent, '—');
  assert.equal(ui.main.querySelector('#v3-edges').textContent, '—');
  assert.equal(ui.variant.disabled, true);
  assert.equal(ui.variant.options.length, 0);
  ui.dom.window.close();
});

test('a forged semantic edge is rejected by the V3 adapter, not painted', async () => {
  const ui = await mount();
  const tampered = JSON.parse(fixture);
  tampered.variantsById.proposed.graph.edges.push({
    ...tampered.variantsById.proposed.graph.edges[0],
    id: 'edge:forged',
    toNodeId: 'node:missing',
  });
  await ui.upload(JSON.stringify(tampered));
  assert.equal(ui.main.dataset.v3State, 'invalid');
  assert.equal(ui.main.querySelector('#v3-edges').textContent, '—');
  assert.equal(
    ui.main.querySelector('.v3-preview-canvas').querySelector('svg'),
    null,
  );
  ui.dom.window.close();
});
