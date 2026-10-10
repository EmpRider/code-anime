import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { replayState } from '../public/replay.js';
import { prepareSourceHighlighting } from '../public/source-highlighter.js';
import { plainTerminalText } from '../public/terminal-text.js';
import {
  buildFlowOverview,
  describeFlowTransition,
} from '../public/flow-overview.js';

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
    .replace(/^import .*;\r?\n/gm, '');
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
    window.prepareSourceHighlighting = prepareSourceHighlighting;
    window.buildFlowOverview = buildFlowOverview;
    window.describeFlowTransition = describeFlowTransition;
    window.plainTerminalText = plainTerminalText;
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
    window.prepareSourceHighlighting = prepareSourceHighlighting;
    window.buildFlowOverview = buildFlowOverview;
    window.describeFlowTransition = describeFlowTransition;
    window.plainTerminalText = plainTerminalText;
    window.fetch = async () => ({ ok: true, json: async () => flow });
    window.matchMedia = () => ({ matches: true });
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.eval(source.replace(/^import .*;\r?\n/gm, ''));
    for (let i = 0; i < 20 && get('progress').textContent !== '0 / 3'; i++)
      await new Promise((r) => setTimeout(r, 5));
    const visibleRows = () => [
      ...get('event-list').querySelectorAll('.event-row'),
    ];
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

test('source-first playback follows nested calls, restores parent locals, and rewinds output', async () => {
  const [html, source] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/player.js', import.meta.url), 'utf8'),
  ]);
  const aSource =
    'class A {\n  method() {\n    new B().method2(10, 20);\n    const result = 30;\n    console.log(result);\n  }\n}';
  const bSource =
    'class B {\n  method2(a, b) {\n    const sum = a + b;\n    return sum;\n  }\n}';
  const event = (
    kind,
    symbolId,
    callId,
    stack,
    file,
    line,
    locals,
    extras = {},
  ) => ({
    kind,
    symbolId,
    callId,
    stack,
    source: { file, line, endLine: line },
    label: kind + ' ' + symbolId,
    locals,
    certainty: 'mock',
    values: {},
    ...extras,
  });
  const events = [
    event('enter', 'A.method', 'call-a', ['call-a'], 'A.ts', 2, {
      'call-a': { x: 10 },
    }),
    event('call', 'A.method', 'call-a', ['call-a'], 'A.ts', 3, {
      'call-a': { x: 10 },
    }),
    event(
      'enter',
      'B.method2',
      'call-b',
      ['call-a', 'call-b'],
      'B.ts',
      2,
      { 'call-a': { x: 10 }, 'call-b': { a: 10, b: 20 } },
      { parentCallId: 'call-a' },
    ),
    event(
      'assign',
      'B.method2',
      'call-b',
      ['call-a', 'call-b'],
      'B.ts',
      3,
      { 'call-a': { x: 10 }, 'call-b': { a: 10, b: 20, sum: 30 } },
      { after: { sum: 30 } },
    ),
    event(
      'return',
      'B.method2',
      'call-b',
      ['call-a'],
      'B.ts',
      4,
      { 'call-a': { x: 10 } },
      { result: 30 },
    ),
    event(
      'assign',
      'A.method',
      'call-a',
      ['call-a'],
      'A.ts',
      4,
      { 'call-a': { x: 10, result: 30 } },
      { after: { result: 30 } },
    ),
    event(
      'console',
      'A.method',
      'call-a',
      ['call-a'],
      'A.ts',
      5,
      { 'call-a': { x: 10, result: 30 } },
      { output: '30' },
    ),
    event('return', 'A.method', 'call-a', [], 'A.ts', 6, {}),
  ];
  const flow = {
    endpoint: 'A.method',
    trace: {
      events,
      sourceFiles: { 'A.ts': aSource, 'B.ts': bSource },
      diagnostics: [],
    },
    steps: events.map((e) => ({
      from: e.symbolId,
      to: e.symbolId,
      dtoName: e.label,
      dtoFields: e.after ?? {},
    })),
  };
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/flow/test',
    runScripts: 'outside-only',
  });
  try {
    const { window } = dom;
    const get = (id) => window.document.getElementById(id);
    window.replayState = replayState;
    window.prepareSourceHighlighting = prepareSourceHighlighting;
    window.buildFlowOverview = buildFlowOverview;
    window.describeFlowTransition = describeFlowTransition;
    window.plainTerminalText = plainTerminalText;
    window.fetch = async () => ({ ok: true, json: async () => flow });
    window.matchMedia = () => ({ matches: true });
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.eval(source.replace(/^import .*;\r?\n/gm, ''));
    for (let i = 0; i < 40 && get('progress').textContent !== '0 / 8'; i++)
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(get('view-mode').value, 'path');
    const preparedOverview = get('canvas').querySelector('.flow-overview');
    assert.ok(preparedOverview, 'the default view summarizes prepared calls');
    assert.match(preparedOverview.textContent, /B\.method2/);
    assert.equal(get('flow-panel').id, 'flow-panel');
    assert.equal(get('toggle-flow').getAttribute('aria-expanded'), 'true');
    get('toggle-flow').click();
    assert.equal(get('toggle-flow').getAttribute('aria-expanded'), 'false');
    get('toggle-flow').click();
    get('next').click();
    assert.equal(get('source').textContent, 'A.ts');
    assert.equal(
      get('canvas').querySelector('.flow-overview'),
      preparedOverview,
    );
    assert.equal(
      preparedOverview.querySelector('[aria-current="step"]').dataset
        .eventIndex,
      '1',
    );
    assert.equal(
      get('snippet').querySelector('.executing-line').dataset.line,
      '2',
    );
    get('next').click();
    get('step-over').click();
    assert.equal(get('progress').textContent, '6 / 8');
    assert.equal(get('source').textContent, 'A.ts');
    get('timeline').value = '3';
    get('timeline').dispatchEvent(new window.Event('input'));
    assert.equal(get('source').textContent, 'B.ts');
    assert.equal(
      get('canvas').querySelector('.flow-overview'),
      preparedOverview,
    );
    assert.equal(
      preparedOverview.querySelector('[aria-current="step"]').dataset
        .eventIndex,
      '3',
    );
    assert.equal(
      get('snippet').querySelector('.executing-line').dataset.line,
      '2',
    );
    assert.match(get('local-tree').textContent, /a: 10/);
    get('view-mode').value = 'map';
    get('view-mode').dispatchEvent(new window.Event('change'));
    assert.ok(get('canvas').querySelector('.packet'));
    get('view-mode').value = 'path';
    get('view-mode').dispatchEvent(new window.Event('change'));
    assert.equal(get('canvas').querySelector('.packet'), null);
    assert.equal(
      get('canvas').querySelector('[aria-current="step"]').dataset.eventIndex,
      '3',
    );
    assert.doesNotMatch(get('local-tree').textContent, /x: 10/);
    get('source-stack').querySelector('button').click();
    assert.equal(get('source').textContent, 'A.ts');
    assert.match(get('local-tree').textContent, /x: 10/);
    assert.doesNotMatch(get('local-tree').textContent, /a: 10/);
    get('follow').click();
    assert.equal(get('source').textContent, 'B.ts');
    get('next').click();
    assert.equal(
      get('snippet').querySelector('.executing-line').dataset.line,
      '3',
    );
    assert.match(
      get('local-tree').querySelector('.field.changed').textContent,
      /sum: ∅ → 30/,
      'callee assignment changes should be visible in its own frame',
    );
    get('breakpoint').click();
    assert.equal(
      get('snippet')
        .querySelector('.executing-line')
        .classList.contains('has-breakpoint'),
      true,
    );
    get('next').click();
    get('next').click();
    assert.equal(get('source').textContent, 'A.ts');
    assert.equal(
      get('snippet').querySelector('.executing-line').dataset.line,
      '4',
    );
    assert.match(get('local-tree').textContent, /result: .*30/);
    assert.match(
      get('local-tree').querySelector('.field.changed').textContent,
      /result: ∅ → 30/,
      'return assignment should compare parent state across the callee exit',
    );
    get('next').click();
    assert.equal(get('console-output').textContent, '30');
    get('previous').click();
    assert.equal(get('console-output').textContent, '');
    assert.equal(get('source').textContent, 'A.ts');
    assert.match(
      get('local-tree').querySelector('.field.changed').textContent,
      /result: ∅ → 30/,
    );
    get('previous').click();
    assert.equal(get('local-tree').querySelector('.field.changed'), null);
    get('next').click();
    // Re-rendering must retain the source editor with unchanged file and line.
    get('tab-state').click();
    assert.equal(
      get('snippet').querySelectorAll('.code-row').length,
      aSource.split('\n').length,
    );
    get('next').click();
    get('step-out').click();
    assert.equal(get('progress').textContent, '8 / 8');
    assert.equal(get('frame-list').children.length, 0);
    // Disclosure changes the view, never the shared replay cursor or timer.
    get('timeline').value = '7';
    get('timeline').dispatchEvent(new window.Event('input'));
    const disclosure = (callId) =>
      get('event-list').querySelector(`[data-call-id="${callId}"]`);
    const hasRow = (index) =>
      !!get('event-list').querySelector(`.event-row[data-index="${index}"]`);
    const pending = new Map();
    let serial = 0;
    window.setTimeout = (callback) => {
      pending.set(++serial, callback);
      return serial;
    };
    window.clearTimeout = (id) => pending.delete(id);
    get('play').click();
    assert.equal(pending.size, 1);
    disclosure('call-a').click();
    disclosure('call-b').click();
    assert.equal(hasRow(4), true);
    assert.equal(hasRow(6), true);
    disclosure('call-b').click();
    assert.equal(hasRow(4), false);
    assert.equal(hasRow(6), true, 'collapsing child retains parent details');
    disclosure('call-b').click();
    disclosure('call-a').click();
    assert.equal(hasRow(4), false, 'collapsed ancestor hides nested details');
    disclosure('call-a').click();
    assert.equal(hasRow(4), true, 'nested expansion preferences are retained');
    assert.equal(window.document.activeElement, disclosure('call-a'));
    assert.equal(get('progress').textContent, '7 / 8');
    assert.equal(get('console-output').textContent, '30');
    assert.equal(get('play').dataset.playing, 'true');
    assert.equal(pending.size, 1);
    get('play').click();
    disclosure('call-a').click();
    get('kind-filter').value = 'changes';
    get('kind-filter').dispatchEvent(new window.Event('change'));
    assert.equal(hasRow(4), true, 'explicit filters reveal collapsed matches');
    assert.equal(hasRow(6), true);
    get('kind-filter').value = 'all';
    get('kind-filter').dispatchEvent(new window.Event('change'));
    get('event-list').querySelector('.event-row[data-index="3"]').click();
    assert.equal(get('progress').textContent, '3 / 8');
    assert.equal(
      disclosure('call-b').getAttribute('aria-expanded'),
      'true',
      'selection does not toggle expansion',
    );
  } finally {
    dom.window.close();
  }
});

test('interleaved tasks compare local changes with the previous snapshot of the same invocation', async () => {
  const [html, source] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/player.js', import.meta.url), 'utf8'),
  ]);
  const events = [
    ['enter', 'call-a', ['call-a'], { 'call-a': { total: 0 } }, 'task-1'],
    ['enter', 'call-b', ['call-b'], { 'call-b': { total: 50 } }, 'task-2'],
    ['console', 'call-b', ['call-b'], undefined, 'task-2'],
    ['resume', 'call-a', ['call-a'], { 'call-a': { total: 2 } }, 'task-1'],
    ['resume', 'call-b', ['call-b'], { 'call-b': { total: 51 } }, 'task-2'],
  ].map(([kind, callId, stack, locals, task], index) => ({
    id: `event-${index + 1}`,
    kind,
    callId,
    symbolId: `main.py:${callId}`,
    label: `${kind} ${callId}`,
    stack,
    ...(locals ? { locals } : {}),
    ...(kind === 'console' ? { output: 'working\n' } : {}),
    values: { task },
    certainty: 'observed',
    ...(kind === 'console'
      ? {}
      : { source: { file: 'main.py', line: index + 1, endLine: index + 1 } }),
  }));
  const flow = {
    endpoint: 'main.py',
    trace: {
      events,
      sourceFiles: {
        'main.py': 'start_a\nstart_b\nprint_b\nresume_a\nresume_b',
      },
      diagnostics: [],
    },
    steps: events.map((event) => ({
      from: event.symbolId,
      to: event.symbolId,
      dtoName: event.label,
      dtoFields: {},
    })),
  };
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/flow/test',
    runScripts: 'outside-only',
  });
  try {
    const { window } = dom;
    const get = (id) => window.document.getElementById(id);
    window.replayState = replayState;
    window.prepareSourceHighlighting = prepareSourceHighlighting;
    window.buildFlowOverview = buildFlowOverview;
    window.describeFlowTransition = describeFlowTransition;
    window.plainTerminalText = plainTerminalText;
    window.fetch = async () => ({ ok: true, json: async () => flow });
    window.matchMedia = () => ({ matches: true });
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.eval(source.replace(/^import .*;\r?\n/gm, ''));
    for (let i = 0; i < 40 && get('progress').textContent !== '0 / 5'; i++)
      await new Promise((r) => setTimeout(r, 5));

    const seek = (position) => {
      get('timeline').value = String(position);
      get('timeline').dispatchEvent(new window.Event('input'));
    };
    seek(2);
    assert.equal(get('local-tree').querySelector('.field.changed'), null);
    seek(3);
    assert.equal(get('source-line').textContent, 'L2');
    assert.equal(
      get('snippet').querySelector('.executing-line'),
      null,
      'a source-less console event must not falsely highlight the previous line',
    );
    seek(4);
    assert.match(get('local-tree').textContent, /total: 0 → 2/);
    assert.equal(get('source').textContent, 'main.py');
    seek(5);
    assert.match(get('local-tree').textContent, /total: 50 → 51/);
    seek(4);
    assert.match(get('local-tree').textContent, /total: 0 → 2/);
    seek(1);
    assert.equal(get('local-tree').querySelector('.field.changed'), null);
  } finally {
    dom.window.close();
  }
});

test('unattributed process output preserves historical console and frame stepping', async () => {
  const [html, source] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/player.js', import.meta.url), 'utf8'),
  ]);
  const userEvent = (kind, callId, stack, task, line) => ({
    kind,
    callId,
    symbolId: `main.js:${callId}`,
    label: kind,
    stack,
    values: { task },
    source: { file: 'main.js', line, endLine: line },
    certainty: 'observed',
  });
  const output = (stream, content) => ({
    kind: 'console',
    callId: 'process-output',
    symbolId: 'process:output',
    label: `process ${stream}`,
    stack: [],
    values: { task: 'process-output', stream, attribution: 'unresolved' },
    output: content,
    certainty: 'observed',
  });
  const events = [
    userEvent('enter', 'parent', ['parent'], 'main', 1),
    userEvent('call', 'parent', ['parent'], 'main', 2),
    userEvent('enter', 'child', ['parent', 'child'], 'main', 3),
    output('stdout', 'start'),
    userEvent('enter', 'other', ['other'], 'other-task', 4),
    output('stderr', 'warn'),
    userEvent('assign', 'child', ['parent', 'child'], 'main', 5),
    userEvent('return', 'child', ['parent'], 'main', 6),
    userEvent('assign', 'parent', ['parent'], 'main', 7),
    output('stdout', 'end'),
    userEvent('return', 'parent', [], 'main', 8),
  ];
  const flow = {
    endpoint: 'main.js',
    trace: {
      events,
      recording: { language: 'javascript' },
      diagnostics: [],
      sourceFiles: {
        'main.js': Array.from({ length: 8 }, (_, i) => `line${i + 1}`).join(
          '\n',
        ),
      },
    },
    steps: events.map((event) => ({
      from: event.symbolId,
      to: event.symbolId,
      dtoName: event.label,
      dtoFields: {},
    })),
  };
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/flow/test',
    runScripts: 'outside-only',
  });
  try {
    const { window } = dom;
    const get = (id) => window.document.getElementById(id);
    window.replayState = replayState;
    window.prepareSourceHighlighting = prepareSourceHighlighting;
    window.buildFlowOverview = buildFlowOverview;
    window.describeFlowTransition = describeFlowTransition;
    window.plainTerminalText = plainTerminalText;
    let requests = 0;
    window.fetch = async () => {
      requests++;
      return { ok: true, json: async () => flow };
    };
    window.matchMedia = () => ({ matches: true });
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.eval(source.replace(/^import .*;\r?\n/gm, ''));
    for (let i = 0; i < 40 && get('progress').textContent !== '0 / 11'; i++)
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(get('progress').textContent, '0 / 11');
    const seek = (position) => {
      get('timeline').value = String(position);
      get('timeline').dispatchEvent(new window.Event('input'));
    };

    seek(2);
    get('step-over').click();
    assert.equal(get('progress').textContent, '9 / 11');
    assert.equal(get('console-output').textContent, 'startwarn');

    seek(3);
    get('step-out').click();
    assert.equal(get('progress').textContent, '8 / 11');
    assert.equal(get('console-output').textContent, 'startwarn');

    seek(4);
    assert.equal(get('snippet').querySelector('.executing-line'), null);
    assert.equal(get('console-output').textContent, 'start');
    get('step-over').click();
    assert.equal(get('progress').textContent, '5 / 11');
    seek(4);
    get('step-out').click();
    assert.equal(get('progress').textContent, '5 / 11');
    seek(6);
    get('step-out').click();
    assert.equal(get('progress').textContent, '7 / 11');

    seek(10);
    assert.equal(get('console-output').textContent, 'startwarnend');
    get('previous').click();
    assert.equal(get('console-output').textContent, 'startwarn');
    seek(3);
    assert.equal(get('console-output').textContent, '');
    assert.equal(requests, 1, 'replay and stepping use saved trace data');
  } finally {
    dom.window.close();
  }
});

test('console history exposes every prepared output event with bounded pages and reversible navigation', async () => {
  const [html, source] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/player.js', import.meta.url), 'utf8'),
  ]);
  const events = Array.from({ length: 655 }, (_, i) => ({
    id: `event-${i + 1}`,
    kind: 'console',
    symbolId: 'process:output',
    callId: 'process-output',
    label: 'process stdout',
    output: `event-${i + 1}\n`,
    stack: [],
    values: { task: 'process-output', attribution: 'unresolved' },
    certainty: 'observed',
  }));
  const flow = {
    endpoint: 'main.js',
    trace: { events, diagnostics: [], recording: { language: 'javascript' } },
    steps: events.map((event) => ({
      from: event.symbolId,
      to: event.symbolId,
      dtoName: event.label,
      dtoFields: {},
    })),
  };
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/flow/history',
    runScripts: 'outside-only',
  });
  try {
    const { window } = dom;
    const get = (id) => window.document.getElementById(id);
    window.replayState = replayState;
    window.prepareSourceHighlighting = prepareSourceHighlighting;
    window.buildFlowOverview = buildFlowOverview;
    window.describeFlowTransition = describeFlowTransition;
    window.plainTerminalText = plainTerminalText;
    let requests = 0;
    window.fetch = async () => {
      requests++;
      return { ok: true, json: async () => flow };
    };
    window.matchMedia = () => ({ matches: true });
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.eval(source.replace(/^import .*;\r?\n/gm, ''));
    for (let i = 0; i < 50 && get('progress').textContent !== '0 / 655'; i++)
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(get('progress').textContent, '0 / 655');
    const seek = (position) => {
      get('timeline').value = String(position);
      get('timeline').dispatchEvent(new window.Event('input'));
    };

    seek(300);
    assert.equal(get('console-history').hidden, true);
    assert.equal(
      get('console-output').textContent,
      events
        .slice(0, 300)
        .map((e) => e.output)
        .join(''),
    );
    seek(655);
    assert.equal(get('console-count').textContent, '655 events');
    assert.equal(get('console-history').hidden, false);
    assert.equal(get('console-range').textContent, '356–655 of 655 events');
    assert.equal(
      get('console-output').textContent,
      events
        .slice(355)
        .map((e) => e.output)
        .join(''),
    );
    assert.equal(get('console-newer').disabled, true);

    get('console-older').click();
    assert.equal(get('console-range').textContent, '56–355 of 655 events');
    assert.equal(
      get('console-output').textContent,
      events
        .slice(55, 355)
        .map((e) => e.output)
        .join(''),
    );
    get('console-older').click();
    assert.equal(get('console-range').textContent, '1–55 of 655 events');
    assert.equal(get('console-older').disabled, true);
    assert.equal(
      get('console-output').textContent,
      events
        .slice(0, 55)
        .map((e) => e.output)
        .join(''),
    );
    get('console-newer').click();
    assert.equal(get('console-range').textContent, '56–355 of 655 events');
    assert.equal(get('progress').textContent, '655 / 655');
    assert.equal(requests, 1, 'history browsing uses only prepared events');

    seek(400);
    assert.equal(get('console-range').textContent, '101–400 of 400 events');
    assert.equal(
      get('console-output').textContent,
      events
        .slice(100, 400)
        .map((e) => e.output)
        .join(''),
    );
    seek(0);
    assert.equal(get('console-history').hidden, true);
    assert.equal(get('console-output').textContent, '');
    seek(655);
    assert.equal(get('console-range').textContent, '356–655 of 655 events');
    assert.equal(requests, 1);
  } finally {
    dom.window.close();
  }
});
