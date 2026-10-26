import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { replayState } from '../public/replay.js';
import { prepareSourceHighlighting } from '../public/source-highlighter.js';
import { preparePlainTerminalOutput } from '../public/terminal-text.js';
import {
  buildFlowOverview,
  buildMethodGroups,
  describeFlowTransition,
  parentInvocationId,
} from '../public/flow-overview.js';

const html = await readFile(
  new URL('../public/index.html', import.meta.url),
  'utf8',
);
const source = await readFile(
  new URL('../public/player.js', import.meta.url),
  'utf8',
);

test('player cleanup isolates strict remounts, pending loads and keyboard listeners', async () => {
  const dom = new JSDOM('<div id="host"></div>', {
    url: 'http://localhost/flow/test',
    runScripts: 'outside-only',
  });
  const { window } = dom;
  const host = window.document.getElementById('host');
  const markup = html.split('<body>')[1].split('</body>')[0];
  const pending = [];
  Object.assign(window, {
    replayState,
    prepareSourceHighlighting,
    preparePlainTerminalOutput,
    buildFlowOverview,
    buildMethodGroups,
    describeFlowTransition,
    parentInvocationId,
  });
  window.fetch = () => new Promise((resolve) => pending.push(resolve));
  window.matchMedia = () => ({ matches: true });
  window.HTMLElement.prototype.scrollIntoView = () => {};
  const scrolls = [];
  window.HTMLElement.prototype.scrollTo = (options) => scrolls.push(options);
  window.eval(
    source
      .replace(/^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];\r?\n/gm, '')
      .replace('export function mountPlayer', 'function mountPlayer'),
  );
  const response = (endpoint) => ({
    ok: true,
    json: async () => ({
      endpoint,
      steps: [
        { from: 'a', to: 'b', dtoName: 'Value', dtoFields: { count: 1 } },
        { from: 'b', to: 'c', dtoName: 'Done', dtoFields: {} },
      ],
    }),
  });
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  try {
    host.innerHTML = markup;
    const disposeFirst = window.mountPlayer(host);
    disposeFirst();
    host.innerHTML = markup;
    const disposeSecond = window.mountPlayer(host);
    pending[1]({
      ok: false,
      json: async () => ({ error: 'Temporary failure' }),
    });
    await flush();
    assert.equal(host.querySelector('#title').textContent, 'Flow unavailable');
    assert.equal(host.querySelector('#help').disabled, false);
    assert.equal(
      host.querySelector('[data-mobile-view="flow"]').disabled,
      false,
    );
    assert.equal(host.querySelector('#play').disabled, true);
    assert.equal(host.querySelector('#retry-load').hidden, false);
    host.querySelector('#retry-load').click();
    pending[2](response('Current session'));
    await flush();
    assert.equal(host.querySelector('#retry-load').hidden, true);
    assert.equal(host.querySelector('#play').disabled, false);
    pending[0](response('Stale session'));
    await flush();
    assert.equal(host.querySelector('#title').textContent, 'Current session');
    window.document.body.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    assert.equal(host.querySelector('#progress').textContent, '1 / 2');
    assert.ok(scrolls.length > 0);
    assert.ok(scrolls.every(({ behavior }) => behavior === 'instant'));
    assert.equal(new URL(window.location.href).searchParams.get('view'), 'map');
    assert.equal(new URL(window.location.href).searchParams.get('step'), '1');
    disposeSecond();
    window.history.replaceState(null, '', '?view=map&step=999');
    host.innerHTML = markup;
    const disposeThird = window.mountPlayer(host);
    pending[3](response('Restored session'));
    await flush();
    assert.match(host.querySelector('#play').textContent, /Play/);
    disposeThird();
    window.history.replaceState(null, '', '?view=invalid&step=NaN');
    host.innerHTML = markup;
    const disposeFourth = window.mountPlayer(host);
    pending[4](response('Validated session'));
    await flush();
    assert.equal(host.querySelector('#progress').textContent, '0 / 2');
    disposeFourth();
    assert.equal(host.children.length, 0);
    window.document.body.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    window.dispatchEvent(new window.Event('resize'));
    await flush();
    assert.equal(host.children.length, 0);
  } finally {
    dom.window.close();
  }
});
