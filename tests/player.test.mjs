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
  )
    // Exercise Windows line endings even when this test runs on Linux CI.
    .replace(/\r?\n/g, '\r\n')
    .replace(/^import .*;\r?\n/, '');
  const flow = {
    endpoint: '<img src=x onerror=alert(1)>',
    steps: [
      {
        from: 'a',
        to: 'a',
        dtoName: 'assign',
        dtoFields: { name: '  Alice  ', nested: { x: '<img src=x>' } },
      },
      {
        from: 'a',
        to: 'b',
        dtoName: 'enter',
        dtoFields: { name: 'Alice', nested: { x: '<img src=x>' } },
      },
    ],
    trace: {
      provider: 'test',
      diagnostics: ['test'],
      events: [
        {
          symbolId: 'a',
          label: 'A',
          callId: 'call-1',
          objectId: 'dto-1',
          after: { name: '  Alice  ', nested: { x: '<img src=x>' } },
          stack: ['a'],
          locals: { value: 1 },
          source: { file: 'a.ts', line: 1, endLine: 1 },
          snippet: 'const value=1;',
          certainty: 'mock',
        },
        {
          symbolId: 'b',
          label: '<script>bad</script>',
          callId: 'call-2',
          objectId: 'dto-1',
          before: { name: '  Alice  ' },
          after: { name: 'Alice', nested: { x: '<img src=x>' } },
          inputs: { receiver: '  Alice  ' },
          result: 'Alice',
          stack: ['a', 'b'],
          locals: { value: 2 },
          certainty: 'proposed',
        },
      ],
    },
  };
  flow.baselineTrace = structuredClone(flow.trace);
  flow.baselineTrace.events[1].locals = { value: 99 };
  flow.baselineTrace.events[1].values = {};
  flow.baselineTrace.events[0].values = {};
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
    assert.match(get('canvas').querySelector('.packet').textContent, /Alice/);
    assert.match(
      get('canvas').querySelector('.changed').textContent,
      /"  Alice  " → "Alice"/,
    );
    assert.equal(get('canvas').querySelectorAll('.packet').length, 1);
    assert.equal(get('canvas').querySelector('img'), null);
    assert.equal(get('canvas').querySelector('script'), null);
    get('previous').click();
    assert.match(get('locals').textContent, /"value": 1/);
    get('timeline').value = '2';
    get('timeline').dispatchEvent(new window.Event('input'));
    assert.match(get('stack').textContent, /"b"/);
    get('variant').value = 'baseline';
    get('variant').dispatchEvent(new window.Event('change'));
    get('next').click();
    get('next').click();
    assert.match(get('locals').textContent, /"value": 99/);
    get('variant').value = 'proposed';
    get('variant').dispatchEvent(new window.Event('change'));
    get('next').click();
    get('next').click();
    assert.match(get('locals').textContent, /"value": 2/);
    get('restart').click();
    assert.equal(get('progress').textContent, '0 / 2');
    assert.equal(get('locals').textContent, '');
  } finally {
    dom.window.close();
  }
});
