import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { replayState } from '../public/replay.js';

const sources = {
  'A.ts':
    'class A {\n  m() {\n    B.m2(10, 20);\n    const result = 30;\n    console.log(result);\n  }\n}',
  'B.ts':
    'class B {\n  m2(a, b) {\n    const sum = a + b;\n    return sum;\n  }\n}',
};
const event = (id, kind, symbolId, callId, stack, file, line, other = {}) => ({
  id: 'event-' + id,
  kind,
  symbolId,
  callId,
  stack,
  source: { file, line, endLine: line },
  label: kind + ' ' + symbolId,
  certainty: 'mock',
  values: {},
  locals: Object.fromEntries(stack.map((call) => [call, { value: id }])),
  ...other,
});
const allEvents = [
  event(1, 'enter', 'A.m', 'call-a', ['call-a'], 'A.ts', 2),
  event(2, 'call', 'A.m', 'call-a', ['call-a'], 'A.ts', 3),
  event(3, 'enter', 'B.m2', 'call-b', ['call-a', 'call-b'], 'B.ts', 2, {
    parentCallId: 'call-a',
  }),
  event(4, 'assign', 'B.m2', 'call-b', ['call-a', 'call-b'], 'B.ts', 3, {
    after: { sum: 30 },
  }),
  event(5, 'return', 'B.m2', 'call-b', ['call-a'], 'B.ts', 4, { result: 30 }),
  event(6, 'assign', 'A.m', 'call-a', ['call-a'], 'A.ts', 4, {
    after: { result: 30 },
  }),
  event(7, 'console', 'A.m', 'call-a', ['call-a'], 'A.ts', 5, { output: '30' }),
  event(8, 'return', 'A.m', 'call-a', [], 'A.ts', 6),
];
function chunk(events, previousSessionId, nextSessionId) {
  return {
    endpoint: 'A.m',
    ...(nextSessionId ? { nextSessionId } : {}),
    steps: events.map((e) => ({
      from: e.symbolId,
      to: e.symbolId,
      dtoName: e.label,
      dtoFields: e.after ?? {},
    })),
    trace: {
      version: 2,
      provider: 'codegraph + ai-mock',
      projectRoot: 'workspace',
      target: 'A.m',
      sourceHash: 'same-evidence',
      scenario: { args: [10, 20] },
      sourceFiles: sources,
      events,
      diagnostics: [],
      truncated: Boolean(nextSessionId),
      simulation: {
        mode: 'ai-mock',
        complete: !nextSessionId,
        coverage: 'Full mock execution',
        ...(previousSessionId ? { previousSessionId } : {}),
      },
    },
  };
}
const initial = () => chunk(allEvents.slice(0, 4), undefined, 'chunk-two');
const continuation = () => chunk(allEvents.slice(4), 'chunk-one');
async function waitFor(check, message) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await delay(5);
  }
  assert.fail(message ?? 'Timed out waiting for player to update');
}
async function createPlayer(loadContinuation, first = initial()) {
  const [html, js] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/player.js', import.meta.url), 'utf8'),
  ]);
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/flow/chunk-one',
    runScripts: 'outside-only',
  });
  const { window } = dom;
  const get = (id) => window.document.getElementById(id);
  let continuationRequests = 0;
  window.replayState = replayState;
  window.matchMedia = () => ({ matches: true });
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.fetch = async (url) => {
    if (url === '/api/flow/chunk-one')
      return { ok: true, json: async () => first };
    assert.match(url, /^\/api\/flow\/(chunk-(two|three)|baseline-two)$/);
    continuationRequests++;
    return {
      ok: true,
      json: () => (loadContinuation ? loadContinuation(url) : continuation()),
    };
  };
  window.eval(js.replace(/^import .*;\r?\n/, ''));
  await waitFor(
    () => get('progress').textContent === '0 / ' + first.steps.length,
    'initial chunk did not load',
  );
  return { dom, window, get, requests: () => continuationRequests };
}
function moveTo(window, get, index) {
  get('timeline').value = String(index);
  get('timeline').dispatchEvent(new window.Event('input'));
}

test('source, stepping and console remain synchronized across prepared session boundaries', async () => {
  const { dom, window, get, requests } = await createPlayer();
  try {
    moveTo(window, get, 2);
    get('step-over').click();
    await waitFor(
      () => get('progress').textContent === '6 / 8',
      'step-over did not cross chunk',
    );
    assert.equal(get('source').textContent, 'A.ts');
    assert.equal(
      get('snippet').querySelector('.executing-line').dataset.line,
      '4',
    );
    assert.equal(get('console-output').textContent, '');
    assert.equal(requests(), 1);
    get('next').click();
    assert.equal(get('console-output').textContent, '30');
    get('previous').click();
    assert.equal(get('console-output').textContent, '');
    moveTo(window, get, 3);
    get('step-out').click();
    await waitFor(
      () => get('progress').textContent === '5 / 8',
      'step-out skipped return',
    );
    assert.equal(get('source').textContent, 'B.ts');
    assert.equal(get('frame-list').children.length, 1);
    moveTo(window, get, 8);
    assert.equal(get('status').textContent, 'Replay complete');
    assert.equal(get('frame-list').children.length, 0);
    assert.equal(requests(), 1, 'prepared sessions should only be loaded once');
  } finally {
    dom.window.close();
  }
});

test('step-over traverses multiple prepared chunks and backward navigation restores state', async () => {
  const first = chunk(allEvents.slice(0, 2), undefined, 'chunk-two');
  const { dom, window, get, requests } = await createPlayer(
    async (url) =>
      url.endsWith('chunk-two')
        ? chunk(allEvents.slice(2, 4), 'chunk-one', 'chunk-three')
        : chunk(allEvents.slice(4), 'chunk-two'),
    first,
  );
  try {
    moveTo(window, get, 2);
    get('step-over').click();
    await waitFor(() => get('progress').textContent === '6 / 8');
    assert.equal(requests(), 2);
    assert.equal(get('source').textContent, 'A.ts');
    moveTo(window, get, 3);
    assert.equal(get('source').textContent, 'B.ts');
    assert.equal(get('frame-list').children.length, 2);
    moveTo(window, get, 7);
    assert.equal(get('console-output').textContent, '30');
    moveTo(window, get, 2);
    assert.equal(get('source').textContent, 'A.ts');
    assert.equal(get('console-output').textContent, '');
    assert.equal(get('frame-list').children.length, 1);
    assert.equal(requests(), 2);
  } finally {
    dom.window.close();
  }
});

test('pausing while a chunk loads cannot resume stale playback', async () => {
  let resolveChunk;
  const deferred = new Promise((resolve) => {
    resolveChunk = resolve;
  });
  const { dom, window, get, requests } = await createPlayer(() => deferred);
  try {
    const callbacks = new Map();
    let serial = 0;
    window.setTimeout = (cb) => {
      callbacks.set(++serial, cb);
      return serial;
    };
    window.clearTimeout = (id) => callbacks.delete(id);
    const advance = () => {
      assert.ok(callbacks.size, 'expected a playback timer');
      const [id, callback] = callbacks.entries().next().value;
      callbacks.delete(id);
      callback();
    };
    moveTo(window, get, 4);
    assert.equal(
      get('next').disabled,
      false,
      'Next must be available at a chunk boundary',
    );
    get('play').click();
    advance();
    await waitFor(() => requests() === 1);
    get('play').click(); // Pause while the continuation request is outstanding.
    resolveChunk(continuation());
    await waitFor(
      () => get('progress').textContent === '4 / 8',
      'chunk did not append',
    );
    assert.equal(get('play').textContent, 'Play');
    assert.equal(
      callbacks.size,
      0,
      'paused playback must not schedule a stale tick',
    );
    get('play').click();
    advance();
    assert.equal(get('progress').textContent, '5 / 8');
    get('play').click();
    assert.equal(callbacks.size, 0);
  } finally {
    dom.window.close();
  }
});

test('disabling source following retains inspection without a false executing line', async () => {
  const { dom, window, get } = await createPlayer(undefined, chunk(allEvents));
  try {
    moveTo(window, get, 2);
    get('follow').click();
    assert.equal(get('follow').checked, false);
    get('next').click();
    assert.equal(get('source').textContent, 'A.ts');
    assert.equal(get('snippet').querySelector('.executing-line'), null);
    get('follow').click();
    assert.equal(get('source').textContent, 'B.ts');
    assert.equal(
      get('snippet').querySelector('.executing-line').dataset.line,
      '2',
    );
    get('follow').click();
    moveTo(window, get, 6);
    assert.equal(
      get('source').textContent,
      'B.ts',
      'returning must not dismiss source inspection',
    );
    assert.equal(get('snippet').querySelector('.executing-line'), null);
    get('follow').click();
    assert.equal(get('source').textContent, 'A.ts');
    assert.equal(
      get('snippet').querySelector('.executing-line').dataset.line,
      '4',
    );
  } finally {
    dom.window.close();
  }
});

test('stepping uses the active invocation after entry, return and exception unwind', async () => {
  const unwind = [
    event(1, 'enter', 'A.m', 'call-a', ['call-a'], 'A.ts', 2),
    event(2, 'call', 'A.m', 'call-a', ['call-a'], 'A.ts', 3),
    event(3, 'enter', 'B.m2', 'call-b', ['call-a', 'call-b'], 'B.ts', 2),
    event(4, 'assign', 'B.m2', 'call-b', ['call-a', 'call-b'], 'B.ts', 3),
    event(5, 'throw', 'B.m2', 'call-b', ['call-a'], 'B.ts', 4),
    event(6, 'assign', 'A.m', 'call-a', ['call-a'], 'A.ts', 4),
    event(7, 'return', 'A.m', 'call-a', [], 'A.ts', 6),
  ];
  const { dom, window, get } = await createPlayer(undefined, chunk(unwind));
  try {
    moveTo(window, get, 3);
    get('step-over').click();
    assert.equal(
      get('progress').textContent,
      '4 / 7',
      'entry should step to the first statement',
    );
    get('step-out').click();
    assert.equal(
      get('progress').textContent,
      '5 / 7',
      'exception unwind should leave the invocation',
    );
    get('step-over').click();
    assert.equal(
      get('progress').textContent,
      '6 / 7',
      'stepping after unwind should use the caller',
    );
    moveTo(window, get, 3);
    get('step-out').click();
    get('step-out').click();
    assert.equal(
      get('progress').textContent,
      '7 / 7',
      'second step-out should exit the caller',
    );
  } finally {
    dom.window.close();
  }
});

test('stepping after a normal return follows the surviving caller frame', async () => {
  const { dom, window, get } = await createPlayer(undefined, chunk(allEvents));
  try {
    moveTo(window, get, 5);
    get('step-over').click();
    assert.equal(get('progress').textContent, '6 / 8');
    assert.equal(get('source').textContent, 'A.ts');
    moveTo(window, get, 5);
    get('step-out').click();
    assert.equal(get('progress').textContent, '8 / 8');
    assert.equal(get('frame-list').children.length, 0);
  } finally {
    dom.window.close();
  }
});

test('source breakpoints stop repeated lines including iterations in later chunks', async () => {
  const events = [
    event(1, 'enter', 'A.m', 'call-a', ['call-a'], 'A.ts', 2),
    event(2, 'loop', 'A.m', 'call-a', ['call-a'], 'A.ts', 3),
    event(3, 'loop', 'A.m', 'call-a', ['call-a'], 'A.ts', 3),
    event(4, 'return', 'A.m', 'call-a', [], 'A.ts', 6),
  ];
  const { dom, window, get } = await createPlayer(
    async () => chunk(events.slice(2), 'chunk-one'),
    chunk(events.slice(0, 2), undefined, 'chunk-two'),
  );
  try {
    const callbacks = new Map();
    let serial = 0;
    window.setTimeout = (cb) => {
      callbacks.set(++serial, cb);
      return serial;
    };
    window.clearTimeout = (id) => callbacks.delete(id);
    const advance = () => {
      const [id, callback] = callbacks.entries().next().value;
      callbacks.delete(id);
      callback();
    };
    moveTo(window, get, 1);
    get('snippet').querySelector('[data-line="3"] .code-gutter').click();
    get('play').click();
    advance();
    assert.equal(get('status').textContent, 'Breakpoint · step 2');
    assert.equal(callbacks.size, 0);
    get('play').click();
    advance();
    await waitFor(() => get('progress').textContent === '2 / 4');
    await waitFor(() => callbacks.size === 1);
    advance();
    assert.equal(get('status').textContent, 'Breakpoint · step 3');
    assert.equal(callbacks.size, 0);
    const gutter = get('snippet').querySelector('[data-line="3"] .code-gutter');
    assert.equal(gutter.getAttribute('aria-pressed'), 'true');
    gutter.click();
    assert.equal(gutter.getAttribute('aria-pressed'), 'false');
    moveTo(window, get, 2);
    get('play').click();
    advance();
    assert.equal(get('play').textContent, 'Pause');
    get('play').click();
  } finally {
    dom.window.close();
  }
});

test('long timelines bound rendered rows while retaining paging, seeking and full-trace search', async () => {
  const events = Array.from({ length: 2000 }, (_, i) =>
    event(
      i + 1,
      i === 0 ? 'enter' : 'call',
      'A.m',
      'call-a',
      ['call-a'],
      'A.ts',
      3,
      { label: i === 1999 ? 'Unique final event' : `Call ${i}` },
    ),
  );
  const { dom, window, get } = await createPlayer(undefined, chunk(events));
  const visibleRows = () => [
    ...get('event-list').querySelectorAll('.event-row'),
  ];
  try {
    assert.equal(visibleRows().length, 150);
    assert.equal(get('trace-count').textContent, '2000 / 2000');
    get('event-list').querySelector('.event-pages button:nth-child(2)').click();
    assert.equal(visibleRows()[0].dataset.index, '151');
    moveTo(window, get, 170);
    const preserved = visibleRows()[0];
    moveTo(window, get, 171);
    assert.equal(
      visibleRows()[0],
      preserved,
      'stepping within a page should reuse its rows',
    );
    moveTo(window, get, 2000);
    assert.ok(visibleRows().length <= 150);
    assert.equal(
      get('event-list').querySelector('[aria-current="step"]').dataset.index,
      '2000',
    );
    get('search').value = 'Unique final event';
    get('search').dispatchEvent(new window.Event('input'));
    assert.equal(visibleRows().length, 1);
    assert.equal(visibleRows()[0].dataset.index, '2000');
  } finally {
    dom.window.close();
  }
});

test('switching to baseline during a pending continuation keeps its timeline isolated', async () => {
  let resolveChunk;
  const deferred = new Promise((resolve) => {
    resolveChunk = resolve;
  });
  const first = initial();
  first.baselineTrace = chunk(allEvents.slice(0, 2)).trace;
  const { dom, window, get, requests } = await createPlayer(
    () => deferred,
    first,
  );
  const switchVariant = (value) => {
    get('variant').value = value;
    get('variant').dispatchEvent(new window.Event('change'));
  };
  try {
    moveTo(window, get, 4);
    get('next').click();
    await waitFor(() => requests() === 1);
    switchVariant('baseline');
    resolveChunk(continuation());
    await delay(20);
    assert.equal(get('progress').textContent, '0 / 2');
    assert.equal(get('next-chunk').hidden, true);
    moveTo(window, get, 2);
    assert.equal(get('next').disabled, true);
    assert.equal(get('status').textContent, 'Replay complete');
    assert.equal(get('play').textContent, 'Play');
    switchVariant('proposed');
    assert.equal(get('progress').textContent, '4 / 8');
    assert.equal(get('next-chunk').hidden, true);
    moveTo(window, get, 4);
    get('next').click();
    await waitFor(() => get('progress').textContent === '5 / 8');
    assert.equal(requests(), 1);
  } finally {
    dom.window.close();
  }
});

test('both comparison variants load independently and restore their own positions', async () => {
  let resolveProposed;
  const proposed = new Promise((resolve) => {
    resolveProposed = resolve;
  });
  const first = initial();
  first.baselineTrace = chunk(
    allEvents.slice(0, 4),
    undefined,
    'baseline-two',
  ).trace;
  first.baselineSessionId = 'baseline-one';
  first.baselineNextSessionId = 'baseline-two';
  const { dom, window, get, requests } = await createPlayer(
    (url) =>
      url.endsWith('baseline-two')
        ? chunk(allEvents.slice(4), 'baseline-one')
        : proposed,
    first,
  );
  const switchTo = (value) => {
    get('variant').value = value;
    get('variant').dispatchEvent(new window.Event('change'));
  };
  try {
    moveTo(window, get, 4);
    get('next').click();
    switchTo('baseline');
    moveTo(window, get, 4);
    get('next').click();
    await waitFor(() => get('progress').textContent === '5 / 8');
    assert.equal(
      requests(),
      2,
      'baseline loading must not wait for the proposed request',
    );
    moveTo(window, get, 7);
    assert.match(get('console-output').textContent, /30/);
    resolveProposed(continuation());
    await delay(20);
    assert.equal(get('progress').textContent, '7 / 8');
    switchTo('proposed');
    assert.equal(get('progress').textContent, '4 / 8');
    switchTo('baseline');
    assert.equal(get('progress').textContent, '7 / 8');
    moveTo(window, get, 3);
    assert.equal(get('source').textContent, 'B.ts');
    assert.doesNotMatch(get('console-output').textContent, /30/);
    assert.equal(get('frame-list').children.length, 2);
    assert.equal(requests(), 2);
  } finally {
    dom.window.close();
  }
});

test('baseline continuation validates ancestry and source consistency independently', async (t) => {
  for (const problem of ['ancestry', 'source'])
    await t.test(problem, async () => {
      const first = initial();
      first.baselineTrace = chunk(allEvents.slice(0, 4)).trace;
      first.baselineSessionId = 'baseline-one';
      first.baselineNextSessionId = 'baseline-two';
      const bad = chunk(
        allEvents.slice(4),
        problem === 'ancestry' ? 'wrong' : 'baseline-one',
      );
      if (problem === 'source')
        bad.trace.sourceFiles = { ...sources, 'A.ts': 'changed' };
      const { dom, window, get } = await createPlayer(
        (url) => (url.endsWith('baseline-two') ? bad : continuation()),
        first,
      );
      try {
        get('variant').value = 'baseline';
        get('variant').dispatchEvent(new window.Event('change'));
        moveTo(window, get, 4);
        get('next').click();
        await waitFor(() =>
          get('status').textContent.includes('Continuation unavailable'),
        );
        assert.equal(get('progress').textContent, '4 / 4');
        get('variant').value = 'proposed';
        get('variant').dispatchEvent(new window.Event('change'));
        moveTo(window, get, 4);
        get('next').click();
        await waitFor(() => get('progress').textContent === '5 / 8');
        assert.doesNotMatch(get('status').textContent, /unavailable/);
      } finally {
        dom.window.close();
      }
    });
});

test('invalid continuation links and repeated event IDs are reported without corrupting playback', async (t) => {
  const cases = [
    [
      'wrong parent',
      (next) => {
        next.trace.simulation.previousSessionId = 'unrelated';
      },
    ],
    [
      'cycle',
      (next) => {
        next.nextSessionId = 'chunk-two';
      },
    ],
    [
      'duplicate',
      (next) => {
        next.trace.events[1].id = next.trace.events[0].id;
      },
    ],
    [
      'missing sequence',
      (next) => {
        next.trace.events[0].id = 'event-100';
      },
    ],
    [
      'different evidence',
      (next) => {
        next.trace.sourceHash = 'unexpected-hash';
      },
    ],
  ];
  for (const [label, corrupt] of cases) {
    await t.test(label, async () => {
      const next = continuation();
      corrupt(next);
      const { dom, window, get } = await createPlayer(async () => next);
      try {
        moveTo(window, get, 4);
        get('next').click();
        await waitFor(
          () => get('status').textContent.includes('Continuation unavailable'),
          label,
        );
        assert.equal(get('progress').textContent, '4 / 4');
        assert.equal(get('source').textContent, 'B.ts');
      } finally {
        dom.window.close();
      }
    });
  }
});
