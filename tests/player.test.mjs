import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { replayState } from '../public/replay.js';

test('player renders evidence safely and Previous/seek restore local state', async () => {
  const html = await readFile(
    new URL('../public/index.html', import.meta.url),
    'utf8',
  );
  const code = (
    await readFile(new URL('../public/player.js', import.meta.url), 'utf8')
  ).replace(/^import .*;\n/, '');
  const flow = {
    endpoint: '<img src=x onerror=alert(1)>',
    steps: [
      { from: 'a', to: 'a', dtoName: 'assign', dtoFields: { after: 1 } },
      { from: 'a', to: 'b', dtoName: 'enter', dtoFields: { after: 2 } },
    ],
    trace: {
      provider: 'test',
      diagnostics: ['test'],
      events: [
        {
          symbolId: 'a',
          label: 'A',
          stack: ['a'],
          locals: { value: 1 },
          source: { file: 'a.ts', line: 1, endLine: 1 },
          snippet: 'const value=1;',
          certainty: 'mock',
        },
        {
          symbolId: 'b',
          label: '<script>bad</script>',
          stack: ['a', 'b'],
          locals: { value: 2 },
          certainty: 'proposed',
        },
      ],
    },
  };
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/flow/test',
    runScripts: 'outside-only',
  });
  try {
    const { window } = dom;
    window.replayState = replayState;
    window.fetch = async () => ({ ok: true, json: async () => flow });
    window.matchMedia = () => ({ matches: true });
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.eval(code);
    for (
      let i = 0;
      i < 20 &&
      window.document.getElementById('progress').textContent !== '0 / 2';
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    const get = (id) => window.document.getElementById(id);
    assert.equal(get('title').textContent, flow.endpoint);
    assert.equal(get('title').querySelector('img'), null);
    get('next').click();
    assert.match(get('locals').textContent, /"value": 1/);
    get('next').click();
    assert.match(get('locals').textContent, /"value": 2/);
    assert.equal(get('canvas').querySelector('script'), null);
    get('previous').click();
    assert.match(get('locals').textContent, /"value": 1/);
    get('timeline').value = '2';
    get('timeline').dispatchEvent(new window.Event('input'));
    assert.match(get('stack').textContent, /"b"/);
    get('restart').click();
    assert.equal(get('progress').textContent, '0 / 2');
    assert.equal(get('locals').textContent, '');
  } finally {
    dom.window.close();
  }
});
