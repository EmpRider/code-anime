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

test('studio search, bookmarks, keyboard tabs and breakpoints preserve replay state', async () => {
  const [html, source] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/player.js', import.meta.url), 'utf8'),
  ]);
  const events = [
    {
      kind: 'enter',
      symbolId: 'normalize',
      callId: 'call-1',
      label: 'Enter normalize',
      stack: ['normalize'],
      locals: { name: '  Alice  ' },
      source: { file: 'Example.kt', line: 1, endLine: 1 },
      snippet: 'fun normalize(name: String)',
      certainty: 'mock',
      values: {},
    },
    {
      kind: 'transform',
      symbolId: 'normalize',
      callId: 'call-1',
      label: 'Trim whitespace',
      stack: ['normalize'],
      locals: { name: 'Alice' },
      before: { name: '  Alice  ' },
      after: { name: 'Alice' },
      result: 'Alice',
      source: { file: 'Example.kt', line: 2, endLine: 2 },
      snippet: 'name.trim()',
      certainty: 'mock',
      values: {},
    },
    {
      kind: 'return',
      symbolId: 'normalize',
      callId: 'call-1',
      label: 'Return result',
      stack: [],
      locals: {},
      result: 'Alice',
      certainty: 'mock',
      values: {},
    },
  ];
  const flow = {
    endpoint: 'Normalize input',
    trace: { events, diagnostics: [] },
    steps: events.map((e) => ({
      from: 'normalize',
      to: 'normalize',
      dtoName: e.label,
      dtoFields: e.after ?? e.locals,
    })),
  };
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/flow/test',
    runScripts: 'outside-only',
  });
  try {
    const { window } = dom,
      get = (id) => window.document.getElementById(id);
    window.replayState = replayState;
    window.fetch = async () => ({ ok: true, json: async () => flow });
    window.matchMedia = () => ({ matches: true });
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.eval(source.replace(/^import .*;\r?\n/, ''));
    for (let i = 0; i < 20 && get('progress').textContent !== '0 / 3'; i++)
      await new Promise((r) => setTimeout(r, 5));
    const visibleRows = () =>
      [...get('event-list').children].filter((e) => !e.hidden);
    get('search').value = 'trim';
    get('search').dispatchEvent(new window.Event('input'));
    assert.equal(visibleRows().length, 1);
    visibleRows()[0].click();
    assert.equal(get('progress').textContent, '2 / 3');
    assert.equal(get('source-line').textContent, 'L2');
    assert.equal(get('snippet').textContent, 'name.trim()');
    assert.match(get('local-tree').textContent, /Alice/);
    get('bookmark').click();
    get('breakpoint').click();
    assert.equal(get('breakpoint').getAttribute('aria-pressed'), 'true');
    get('search').value = '';
    get('search').dispatchEvent(new window.Event('input'));
    get('bookmarks-only').click();
    assert.deepEqual(
      visibleRows().map((e) => e.dataset.index),
      ['2'],
    );
    get('bookmarks-only').click();
    get('kind-filter').value = 'changes';
    get('kind-filter').dispatchEvent(new window.Event('change'));
    assert.deepEqual(
      visibleRows().map((e) => e.dataset.index),
      ['2'],
    );
    get('tab-state').click();
    assert.equal(get('panel-state').hidden, false);
    assert.equal(get('panel-values').hidden, true);
    get('tab-state').dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    assert.equal(get('tab-context').getAttribute('aria-selected'), 'true');
    assert.equal(
      get('progress').textContent,
      '2 / 3',
      'tab arrows must not step playback',
    );
    get('search').dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    assert.equal(
      get('progress').textContent,
      '2 / 3',
      'text editing keys must not change replay',
    );
    get('kind-filter').value = 'all';
    get('kind-filter').dispatchEvent(new window.Event('change'));
    get('restart').click();
    // Deterministic timer queue exercises autoplay stop/resume without wall-clock sleeps.
    const pending = new Map();
    let serial = 0;
    window.setTimeout = (callback) => {
      pending.set(++serial, callback);
      return serial;
    };
    window.clearTimeout = (id) => pending.delete(id);
    const tick = () => {
      const [id, callback] = pending.entries().next().value;
      pending.delete(id);
      callback();
    };
    get('play').click();
    tick();
    tick();
    assert.equal(get('progress').textContent, '2 / 3');
    assert.equal(get('status').textContent, 'Breakpoint · step 2');
    assert.equal(get('play').textContent, 'Play');
    assert.equal(pending.size, 0);
    get('play').click();
    tick();
    assert.equal(get('progress').textContent, '3 / 3');
    assert.equal(get('frame-list').children.length, 0);
    assert.equal(pending.size, 0);
    get('previous').click();
    assert.match(get('locals').textContent, /Alice/);
    assert.equal(get('frame-list').children.length, 1);
    get('view-mode').value = 'map';
    get('view-mode').dispatchEvent(new window.Event('change'));
    assert.equal(get('canvas').className, 'map');
    assert.equal(get('canvas').querySelectorAll('.packet').length, 1);
    get('search').value = 'nothing matches';
    get('search').dispatchEvent(new window.Event('input'));
    assert.equal(get('no-events').hidden, false);
  } finally {
    dom.window.close();
  }
});
