import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { RecordingService } from '../src/services/recording-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import type { TraceEvent } from '../src/domain/trace.js';
import { traceSchema } from '../src/domain/trace.js';

async function fixture(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-python-'));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), content);
  }
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessionBytes: 10 * 1024 * 1024,
    maxSessions: 100,
  });
  const service = new RecordingService(
    store,
    'http://127.0.0.1:3456',
    realpath,
  );
  return {
    root,
    store,
    service,
    async close() {
      service.close();
      await store.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}
async function wait(service: RecordingService, jobId: string) {
  for (let i = 0; i < 1000; i++) {
    const result = await service.run({ action: 'status', jobId });
    if (result.status === 'failed') throw new Error(result.error);
    if (result.status === 'ready') return result;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Recording did not finish');
}
async function allEvents(store: FileSessionStore, sessionId: string) {
  let current = await store.get(sessionId);
  const events: TraceEvent[] = [];
  let chunks = 0;
  while (current) {
    chunks++;
    events.push(...current.flow.trace!.events);
    current = await store.next(current.id);
  }
  return { events, chunks };
}

function localValue(event: TraceEvent, callId: string, name: string) {
  const frame = event.locals?.[callId];
  return frame && typeof frame === 'object'
    ? (frame as Record<string, unknown>)[name]
    : undefined;
}

test('records actual nested calls, loop states, executed branches, returns and console across files', async () => {
  const main = [
    'from helpers import add',
    'total = 0',
    'for i in range(1, 6):',
    '    total = add(total, i)',
    'if total == 15:',
    '    print(total)',
    'else:',
    '    print("WRONG BRANCH")',
  ].join('\n');
  const f = await fixture({
    'main.py': main,
    'helpers.py': 'def add(a, b):\n    result = a + b\n    return result\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true);
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.ok(events.every((event) => event.certainty === 'observed'));
    const calls = events.filter(
      (e) => e.kind === 'enter' && e.symbolId.endsWith(':add'),
    );
    assert.equal(calls.length, 5);
    assert.equal(new Set(calls.map((e) => e.callId)).size, 5);
    assert.deepEqual(
      calls.map((e) => e.inputs),
      [
        { a: 0, b: 1 },
        { a: 1, b: 2 },
        { a: 3, b: 3 },
        { a: 6, b: 4 },
        { a: 10, b: 5 },
      ],
    );
    assert.deepEqual(
      events
        .filter((e) => e.kind === 'return' && e.symbolId.endsWith(':add'))
        .map((e) => e.result),
      [1, 3, 6, 10, 15],
    );
    assert.equal(
      events
        .filter((e) => e.kind === 'console')
        .map((e) => e.output)
        .join(''),
      '15\n',
    );
    assert.equal(
      events.some((e) => e.source?.file === 'main.py' && e.source.line === 8),
      false,
    );
    const loops = events.filter(
      (e) =>
        e.kind === 'statement' &&
        e.source?.file === 'main.py' &&
        e.source.line === 4,
    );
    assert.deepEqual(
      loops.map((e) => (e.locals![e.callId] as { total: number }).total),
      [0, 1, 3, 6, 10],
    );
    assert.deepEqual(events.at(-1)!.stack, []);
    assert.equal(
      (await f.store.get(result.sessionId!))!.flow.trace!.sourceFiles![
        'main.py'
      ],
      main,
    );
    const trace = (await f.store.get(result.sessionId!))!.flow.trace!;
    assert.equal(
      traceSchema.safeParse({
        ...trace,
        simulation: {
          mode: 'ai-mock',
          complete: true,
          coverage: 'mock',
          evidenceIds: [],
        },
      }).success,
      false,
    );
    assert.equal(
      traceSchema.safeParse({
        ...trace,
        events: [{ ...trace.events[0], certainty: 'mock' }],
      }).success,
      false,
    );
  } finally {
    await f.close();
  }
});

test('records observed JavaScript calls, source steps, loop values and output across user files', async () => {
  const main = [
    "const { add } = require('./helper.cjs');",
    'const answer = add(10, 20);',
    'let total = 0;',
    'for (let i = 0; i < 4; i++) total += i;',
    'console.log(answer, total);',
  ].join('\n');
  const f = await fixture({
    'main.cjs': main,
    'helper.cjs':
      'exports.add = function add(a, b) {\n  const sum = a + b;\n  return sum;\n};\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
      maxEvents: 1000,
      maxTraceBytes: 2 * 1024 * 1024,
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.ok(events.length > 5);
    assert.ok(events.every((event) => event.certainty === 'observed'));
    const add = events.find(
      (event) => event.kind === 'enter' && event.symbolId === 'helper.cjs:add',
    );
    assert.ok(add, 'Captured user-defined function call');
    assert.equal(add.inputs?.a, 10);
    assert.equal(add.inputs?.b, 20);
    assert.ok(add.parentCallId);
    const addReturn = events.find(
      (event) => event.kind === 'return' && event.callId === add.callId,
    );
    assert.ok(addReturn, 'Capture the return value supplied by V8');
    assert.equal(addReturn.result, 30);
    assert.equal(addReturn.parentCallId, add.parentCallId);
    const lineVisits = events.filter(
      (event) =>
        event.kind === 'statement' &&
        event.source?.file === 'main.cjs' &&
        event.source.line === 4,
    );
    const iterations = lineVisits.map((event) => {
      const current = event.locals?.[event.callId] as { i?: number };
      return current?.i;
    });
    for (const i of [0, 1, 2, 3])
      assert.ok(iterations.includes(i), `Missing iteration i=${i}`);
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      '30 6\n',
    );
    const saved = (await f.store.get(result.sessionId!))!.flow.trace!;
    assert.equal(saved.recording?.language, 'javascript');
    assert.equal(saved.provider, 'node-v8-inspector');
    assert.equal(saved.sourceFiles?.['main.cjs'], main);
    assert.match(saved.sourceFiles?.['helper.cjs'] ?? '', /function add/);
  } finally {
    await f.close();
  }
});

test('JavaScript recording maps verified external and inline source maps to original TypeScript', async () => {
  const original = [
    'function add(a: number, b: number): number {',
    '  const sum = a + b;',
    '  return sum;',
    '}',
    'console.log(add(10, 20));',
  ].join('\n');
  const built = ts.transpileModule(original, {
    fileName: 'entry.ts',
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      sourceMap: true,
      inlineSources: true,
    },
  });
  const map = JSON.parse(built.sourceMapText!);
  map.sources = ['../src/entry.ts'];
  const mapped = JSON.stringify(map);
  for (const mode of ['external', 'inline'] as const) {
    const compiled = built.outputText.replace(
      /\/\/# sourceMappingURL=entry\.js\.map/,
      mode === 'external'
        ? '//# sourceMappingURL=entry.cjs.map'
        : '//# sourceMappingURL=data:application/json;base64,' +
            Buffer.from(mapped).toString('base64'),
    );
    const f = await fixture({
      'src/entry.ts': original,
      'dist/entry.cjs': compiled,
      ...(mode === 'external' ? { 'dist/entry.cjs.map': mapped } : {}),
    });
    try {
      const job = await f.service.run({
        action: 'start',
        language: 'javascript',
        projectRoot: f.root,
        entry: 'dist/entry.cjs',
      });
      const result = await wait(f.service, job.jobId);
      assert.equal(result.complete, true, `${mode}: ${JSON.stringify(result)}`);
      const { events } = await allEvents(f.store, result.sessionId!);
      const statement = events.find(
        (event) =>
          event.kind === 'statement' &&
          event.symbolId === 'src/entry.ts:add' &&
          event.source?.line === 2,
      );
      assert.ok(statement, `${mode}: mapped TypeScript calculation`);
      assert.equal(statement.source?.generated?.file, 'dist/entry.cjs');
      assert.ok(statement.source?.generated?.line);
      assert.equal(
        events.find(
          (event) =>
            event.kind === 'return' && event.symbolId === 'src/entry.ts:add',
        )?.result,
        30,
      );
      assert.equal(
        events
          .filter((event) => event.kind === 'console')
          .map((e) => e.output)
          .join(''),
        '30\n',
      );
      const trace = (await f.store.get(result.sessionId!))!.flow.trace!;
      assert.equal(trace.sourceFiles?.['src/entry.ts'], original);
      assert.equal(trace.sourceFiles?.['dist/entry.cjs'], undefined);
      assert.equal(trace.recording?.complete, true);
    } finally {
      await f.close();
    }
  }
});

test('JavaScript recorder rejects stale source-map claims and preserves compiled source', async () => {
  const original = 'const value: number = 2;\nconsole.log(value);';
  const built = ts.transpileModule(original, {
    fileName: 'entry.ts',
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      sourceMap: true,
      inlineSources: true,
    },
  });
  const compiled = built.outputText.replace(
    'sourceMappingURL=entry.js.map',
    'sourceMappingURL=entry.cjs.map',
  );
  const map = JSON.parse(built.sourceMapText!);
  map.sources = ['src/entry.ts'];
  const f = await fixture({
    'src/entry.ts': original + '\n// changed after compilation',
    'entry.cjs': compiled,
    'entry.cjs.map': JSON.stringify(map),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'entry.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const trace = (await f.store.get(result.sessionId!))!.flow.trace!;
    assert.equal(trace.sourceFiles?.['entry.cjs'], compiled);
    assert.equal(trace.sourceFiles?.['src/entry.ts'], undefined);
    assert.ok(trace.events.every((e) => !e.source?.generated));
  } finally {
    await f.close();
  }
});

test('JavaScript stderr preserves trailing fragments, spacing and application notices', async () => {
  const messages = [
    'alpha  \r\n',
    'For help, see: application docs\n',
    'For help, see: https://nodejs.org/learn/getting-started/debugging\n',
    'Debugger ending on ws://example.invalid/not-the-inspector\n',
    'Debugger attached. application notice\n',
    'final fragment  ',
  ];
  const f = await fixture({
    'main.cjs': [
      'function write() {',
      ...messages.map(
        (message) => `  process.stderr.write(${JSON.stringify(message)});`,
      ),
      '}',
      'write();',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      messages.join(''),
    );
    assert.ok(
      !result.diagnostics?.some((diagnostic) =>
        diagnostic.includes('final fragment'),
      ),
      'Normal stderr output is evidence, not a recording failure reason',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript process output is preserved without inventing its originating invocation', async () => {
  const f = await fixture({
    'main.cjs': [
      'async function first() {',
      "  process.stdout.write('FIRST');",
      '  await new Promise((resolve) => setTimeout(resolve, 20));',
      "  process.stderr.write('ERR');",
      '}',
      'async function second() {',
      '  await new Promise((resolve) => setTimeout(resolve, 5));',
      "  process.stdout.write('SECOND');",
      '}',
      'async function last() {',
      '  await Promise.all([first(), second()]);',
      "  process.stdout.write('END');",
      '}',
      'last();',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const output = events.filter((event) => event.kind === 'console');
    assert.equal(
      output
        .filter((event) => event.values.stream === 'stdout')
        .map((event) => event.output)
        .join(''),
      'FIRSTSECONDEND',
    );
    assert.equal(
      output
        .filter((event) => event.values.stream === 'stderr')
        .map((event) => event.output)
        .join(''),
      'ERR',
    );
    assert.ok(output.length >= 2);
    assert.ok(
      output.every(
        (event) =>
          event.certainty === 'observed' &&
          event.symbolId === 'process:output' &&
          event.callId === 'process-output' &&
          event.source === undefined &&
          event.locals === undefined &&
          event.stack.length === 0 &&
          event.values.attribution === 'unresolved',
      ),
    );
    assert.ok(
      events.some(
        (event) =>
          event.kind === 'enter' && event.symbolId === 'main.cjs:first',
      ),
    );
    assert.ok(
      events.some(
        (event) =>
          event.kind === 'enter' && event.symbolId === 'main.cjs:second',
      ),
    );
  } finally {
    await f.close();
  }
});

test('JavaScript startup syntax errors retain stderr diagnostics even without a trace frame', async () => {
  const f = await fixture({
    'main.cjs': 'function invalid( {\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    await assert.rejects(
      wait(f.service, job.jobId),
      (error: Error) =>
        /SyntaxError/.test(error.message) &&
        /main\.cjs/.test(error.message) &&
        /exited with code/.test(error.message),
      'An error before any user frame must include the Node.js diagnostic',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript return snapshots preserve sparse arrays and bounded values', async () => {
  const f = await fixture({
    'main.cjs': [
      'function dense() { return [1, null, 3]; }',
      'function sparse() { const a = new Array(4); a[2] = 9; return a; }',
      'function empty() { return new Array(3); }',
      'function object() { return { ok: true, nested: { count: 4 } }; }',
      'function explicitUndefined() { return undefined; }',
      'function explicitNull() { return null; }',
      'function longArray() { return Array.from({ length: 42 }, (_, i) => i); }',
      'let getterReads = 0;',
      "function extras() { const a = new Array(4); a[2] = 9; a.note = 'observed'; Object.defineProperty(a, 'lazy', { enumerable: true, get() { getterReads++; return 42; } }); return a; }",
      'function nestedSparse() { return { inside: new Array(2) }; }',
      'dense(); sparse(); empty(); object(); explicitUndefined(); explicitNull(); longArray(); extras(); nestedSparse();',
      'console.log("DONE", getterReads);',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const returned = (symbol: string) => {
      const found = events.find(
        (event) =>
          event.kind === 'return' && event.symbolId === 'main.cjs:' + symbol,
      );
      assert.ok(found, 'Missing observed return from ' + symbol);
      return found.result;
    };
    assert.deepEqual(returned('dense'), [1, null, 3]);
    assert.deepEqual(returned('sparse'), {
      $type: 'Array',
      length: 4,
      elements: { '2': 9 },
    });
    assert.deepEqual(returned('empty'), {
      $type: 'Array',
      length: 3,
      elements: {},
    });
    assert.deepEqual(returned('object'), {
      ok: true,
      nested: { count: 4 },
    });
    assert.deepEqual(returned('explicitUndefined'), { $type: 'undefined' });
    assert.equal(returned('explicitNull'), null);
    assert.deepEqual(returned('longArray'), {
      $type: 'Array',
      length: 42,
      elements: Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => [i, i]),
      ),
      $unavailable: '2 additional properties omitted',
    });
    assert.deepEqual(returned('extras'), {
      $type: 'Array',
      length: 4,
      elements: { '2': 9 },
      properties: {
        note: 'observed',
        lazy: { $unavailable: 'Accessor not evaluated' },
      },
    });
    assert.deepEqual(returned('nestedSparse'), {
      inside: { $type: 'Array', length: 2, elements: {} },
    });
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((e) => e.output)
        .join(''),
      'DONE 0\n',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript Promise snapshots report only V8-observed settlement at inspection time', async () => {
  const f = await fixture({
    'main.cjs': [
      'function fulfilled() { return Promise.resolve(19); }',
      'function pending() { return new Promise(() => {}); }',
      'fulfilled(); pending();',
      "console.log('DONE');",
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const returned = (symbol: string) => {
      const found = events.find(
        (event) =>
          event.kind === 'return' && event.symbolId === `main.cjs:${symbol}`,
      );
      assert.ok(found, `Missing observed return for ${symbol}`);
      return found.result;
    };
    assert.deepEqual(returned('fulfilled'), {
      $type: 'Promise',
      $state: 'fulfilled',
      $result: 19,
    });
    assert.deepEqual(returned('pending'), {
      $type: 'Promise',
      $state: 'pending',
      $unavailable: 'Settlement after this snapshot was not observed',
    });
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'DONE\n',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript return snapshots identify native objects without inventing their internal state', async () => {
  const f = await fixture({
    'main.cjs': [
      "function dateValue() { return new Date('2020-01-02T03:04:05.000Z'); }",
      "function mapValue() { const value = new Map([['a', 5]]); value.label = 'user'; return value; }",
      'function setValue() { return new Set([2, 4]); }',
      'function regexpValue() { return /a+/gi; }',
      "function errorValue() { return new TypeError('bad input'); }",
      'function bytesValue() { return new Uint8Array([3, 7]); }',
      'class Example { constructor() { this.count = 2; } }',
      'function instanceValue() { return new Example(); }',
      'dateValue(); mapValue(); setValue(); regexpValue(); errorValue(); bytesValue(); instanceValue();',
      "console.log('DONE');",
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const returned = (symbol: string) => {
      const event = events.find(
        (item) =>
          item.kind === 'return' && item.symbolId === `main.cjs:${symbol}`,
      );
      assert.ok(event, `Missing observed return for ${symbol}`);
      return event.result as Record<string, unknown>;
    };
    for (const [method, type] of [
      ['dateValue', 'Date'],
      ['mapValue', 'Map'],
      ['setValue', 'Set'],
      ['regexpValue', 'RegExp'],
      ['errorValue', 'TypeError'],
      ['bytesValue', 'Uint8Array'],
      ['instanceValue', 'Example'],
    ] as const) {
      assert.equal(returned(method).$type, type);
    }
    assert.deepEqual(returned('mapValue').properties, { label: 'user' });
    assert.deepEqual(returned('instanceValue').properties, { count: 2 });
    assert.match(String(returned('mapValue').$unavailable), /internal/i);
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'DONE\n',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript recording retains repeated loop visits with identical visible locals', async () => {
  const f = await fixture({
    'main.cjs':
      'for (const value of [7, 7, 7, 7]) process.stdout.write(String(value));\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const visits = events.filter(
      (event) =>
        event.kind === 'statement' &&
        event.source?.file === 'main.cjs' &&
        event.source.line === 1,
    );
    assert.ok(
      visits.length >= 4,
      'Each executed loop body needs its own source event',
    );
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      '7777',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript call sites with identical visible state still trace each user invocation', async () => {
  const f = await fixture({
    'main.cjs': [
      'function visit(value) {',
      '  process.stdout.write(String(value));',
      '}',
      'for (const value of [7, 7, 7, 7]) visit(value);',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const invocations = events.filter(
      (event) => event.kind === 'enter' && event.symbolId === 'main.cjs:visit',
    );
    assert.equal(invocations.length, 4, JSON.stringify(invocations));
    assert.equal(new Set(invocations.map((event) => event.callId)).size, 4);
    assert.ok(invocations.every((event) => event.inputs?.value === 7));
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      '7777',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript recording follows more than 30 nested user calls through an ES module', async () => {
  const f = await fixture({
    'main.mjs': [
      'import { descend } from "./helper.mjs";',
      'console.log(descend(36));',
    ].join('\n'),
    'helper.mjs': [
      'export function descend(n) {',
      '  if (n === 0) return 0;',
      '  return descend(n - 1) + 1;',
      '}',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.mjs',
      maxEvents: 3000,
      maxTraceBytes: 8 * 1024 * 1024,
      timeoutMs: 20000,
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const descents = events.filter(
      (event) =>
        event.kind === 'enter' && event.symbolId === 'helper.mjs:descend',
    );
    assert.equal(descents.length, 37, 'Every recursive invocation is recorded');
    assert.equal(new Set(descents.map((event) => event.callId)).size, 37);
    assert.ok(descents.some((event) => event.inputs?.n === 0));
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      '36\n',
    );
    const returns = events.filter(
      (event) =>
        event.kind === 'return' && event.symbolId === 'helper.mjs:descend',
    );
    assert.deepEqual(
      returns.map((event) => event.result),
      Array.from({ length: 37 }, (_, index) => index),
      'Every recursive return must use its debugger-observed result',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript execution budget produces an explicitly incomplete saved trace', async () => {
  const f = await fixture({
    'main.cjs': 'let n = 0;\nwhile (n < 1000) {\n  n++;\n}\nconsole.log(n);\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
      maxEvents: 30,
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, false);
    assert.equal(result.eventCount, 30);
    assert.match(result.diagnostics!.join(' '), /event budget/);
    const saved = (await f.store.get(result.sessionId!))!.flow.trace!;
    assert.equal(saved.truncated, true);
    assert.ok(saved.events.every((event) => event.certainty === 'observed'));
  } finally {
    await f.close();
  }
});

test('cancelling JavaScript recording preserves observed partial events', async () => {
  const f = await fixture({
    'main.cjs': 'let n = 0;\nwhile (true) {\n  n++;\n}\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
      timeoutMs: 15000,
      maxEvents: 100000,
    });
    let observed = 0;
    for (let i = 0; i < 300; i++) {
      const state = await f.service.run({ action: 'status', jobId: job.jobId });
      if (state.status === 'failed') throw new Error(state.error);
      observed = state.eventCount;
      if (observed >= 3) break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.ok(observed >= 3, 'Capture initial events before cancellation');
    await f.service.run({ action: 'cancel', jobId: job.jobId });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, false);
    assert.match(result.diagnostics!.join(' '), /cancelled/);
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.ok(events.length >= 3);
    assert.ok(events.every((event) => event.certainty === 'observed'));
  } finally {
    await f.close();
  }
});

test('JavaScript async callbacks retain observed events and console output', async () => {
  const f = await fixture({
    'main.cjs': [
      'function onTimer() {',
      '  const answer = 42;',
      '  console.log(answer);',
      '}',
      'setTimeout(onTimer, 1);',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.ok(
      events.some(
        (event) =>
          event.kind === 'enter' && event.symbolId === 'main.cjs:onTimer',
      ),
    );
    assert.ok(
      events.some(
        (event) => event.kind === 'statement' && event.source?.line === 3,
      ),
    );
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      '42\n',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript async functions retain invocation identity across awaits', async () => {
  const f = await fixture({
    'main.mjs': [
      'async function worker(label) {',
      '  const name = label;',
      '  await Promise.resolve();',
      '  const result = name + "!";',
      '  console.log(result);',
      '}',
      'await Promise.all([worker("A"), worker("B")]);',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.mjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const workers = events.filter(
      (event) => event.kind === 'enter' && event.symbolId === 'main.mjs:worker',
    );
    assert.equal(workers.length, 2, JSON.stringify(workers));
    assert.deepEqual(
      workers.map((event) => event.inputs?.label),
      ['A', 'B'],
      JSON.stringify(
        events.map((event) => ({
          kind: event.kind,
          symbol: event.symbolId,
          callId: event.callId,
          line: event.source?.line,
          label: event.inputs?.label,
          value: localValue(event, event.callId, 'label'),
        })),
      ),
    );
    for (const worker of workers) {
      const steps = events.filter(
        (event) => event.kind === 'statement' && event.callId === worker.callId,
      );
      assert.ok(steps.some((event) => event.source?.line === 4));
      assert.ok(steps.some((event) => event.source?.line === 5));
    }
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'A!\nB!\n',
    );
  } finally {
    await f.close();
  }
});

test('concurrent JavaScript invocations retain identity across repeated awaits', async () => {
  const f = await fixture({
    'main.mjs': [
      'async function worker(label) {',
      '  let value = label;',
      '  await Promise.resolve();',
      '  value += "1";',
      '  await Promise.resolve();',
      '  value += "2";',
      '  console.log(value);',
      '}',
      'await Promise.all([worker("A"), worker("B")]);',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.mjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const workers = events.filter(
      (event) => event.kind === 'enter' && event.symbolId === 'main.mjs:worker',
    );
    assert.deepEqual(
      workers.map((event) => event.inputs?.label),
      ['A', 'B'],
    );
    assert.equal(new Set(workers.map((event) => event.callId)).size, 2);
    for (const worker of workers) {
      const steps = events.filter(
        (event) => event.kind === 'statement' && event.callId === worker.callId,
      );
      assert.ok(steps.some((event) => event.source?.line === 4));
      assert.ok(steps.some((event) => event.source?.line === 6));
      assert.ok(steps.some((event) => event.source?.line === 7));
      assert.ok(
        steps.every(
          (event) =>
            localValue(event, worker.callId, 'label') === worker.inputs?.label,
        ),
      );
      assert.equal(
        events.filter(
          (event) => event.kind === 'resume' && event.callId === worker.callId,
        ).length,
        2,
      );
    }
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'A12\nB12\n',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript awaits inside loops preserve each invocation and iteration', async () => {
  const f = await fixture({
    'main.mjs': [
      'async function worker(label) {',
      '  let value = label;',
      '  for (let i = 0; i < 3; i++) {',
      '    await Promise.resolve();',
      '    value += i;',
      '  }',
      '  console.log(value);',
      '}',
      'await Promise.all([worker("A"), worker("B")]);',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.mjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const workers = events.filter(
      (event) => event.kind === 'enter' && event.symbolId === 'main.mjs:worker',
    );
    assert.equal(
      workers.length,
      2,
      JSON.stringify(
        events.map((e) => [e.kind, e.callId, e.source?.line, e.inputs?.label]),
      ),
    );
    for (const worker of workers) {
      const iterations = events.filter(
        (event) =>
          event.kind === 'statement' &&
          event.callId === worker.callId &&
          event.source?.line === 5,
      );
      assert.deepEqual(
        iterations.map((event) => localValue(event, worker.callId, 'i')),
        [0, 1, 2],
      );
      assert.ok(
        iterations.every(
          (event) =>
            localValue(event, worker.callId, 'label') === worker.inputs?.label,
        ),
      );
      assert.equal(
        events.filter(
          (event) => event.kind === 'resume' && event.callId === worker.callId,
        ).length,
        3,
      );
    }
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'A012\nB012\n',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript nested and recursive async calls retain independent invocation IDs', async () => {
  const f = await fixture({
    'main.mjs': [
      'async function descend(n) {',
      '  if (n === 0) return 0;',
      '  await Promise.resolve();',
      '  const next = await descend(n - 1);',
      '  return next + 1;',
      '}',
      'console.log(await descend(4));',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.mjs',
      maxEvents: 3000,
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const enters = events.filter(
      (event) =>
        event.kind === 'enter' && event.symbolId === 'main.mjs:descend',
    );
    assert.deepEqual(
      enters.map((event) => event.inputs?.n),
      [4, 3, 2, 1, 0],
      JSON.stringify(
        events.map((e) => [e.kind, e.callId, e.source?.line, e.inputs?.n]),
      ),
    );
    assert.equal(new Set(enters.map((event) => event.callId)).size, 5);
    for (const enter of enters.filter((event) => Number(event.inputs?.n) > 0)) {
      assert.ok(
        events.some(
          (event) =>
            event.kind === 'statement' &&
            event.callId === enter.callId &&
            event.source?.line === 5,
        ),
        `Missing resumed frame for n=${enter.inputs?.n}`,
      );
    }
    assert.deepEqual(
      events
        .filter(
          (event) =>
            event.kind === 'return' && event.symbolId === 'main.mjs:descend',
        )
        .map((event) => (event.result as { $type: string }).$type),
      Array(5).fill('Promise'),
      'V8 reports async Promise returns; fulfillment values stay unresolved',
    );
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      '4\n',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript concurrent same-argument calls stay distinct through nested awaited calls', async () => {
  const f = await fixture({
    'main.mjs': [
      'async function inner(label) {',
      '  await Promise.resolve();',
      '  const result = label + "!";',
      '  return result;',
      '}',
      'async function outer(label) {',
      '  const result = await inner(label);',
      '  console.log(result);',
      '}',
      'await Promise.all([outer("same"), outer("same")]);',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.mjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const outerCalls = events.filter(
      (event) => event.kind === 'enter' && event.symbolId === 'main.mjs:outer',
    );
    const innerCalls = events.filter(
      (event) => event.kind === 'enter' && event.symbolId === 'main.mjs:inner',
    );
    assert.deepEqual(
      innerCalls.map((event) => event.parentCallId),
      outerCalls.map((event) => event.callId),
    );
    for (const outer of outerCalls) {
      assert.equal(
        events.filter(
          (event) => event.kind === 'await' && event.callId === outer.callId,
        ).length,
        1,
      );
      assert.equal(
        events.filter(
          (event) => event.kind === 'resume' && event.callId === outer.callId,
        ).length,
        1,
      );
    }
    for (const symbol of ['outer', 'inner']) {
      const enters = events.filter(
        (event) =>
          event.kind === 'enter' && event.symbolId === `main.mjs:${symbol}`,
      );
      assert.equal(
        enters.length,
        2,
        JSON.stringify(
          events.map((e) => [e.kind, e.symbolId, e.callId, e.source?.line]),
        ),
      );
      assert.equal(new Set(enters.map((event) => event.callId)).size, 2);
      assert.ok(enters.every((event) => event.inputs?.label === 'same'));
      for (const enter of enters) {
        assert.ok(
          events.some(
            (event) =>
              event.kind === 'statement' &&
              event.callId === enter.callId &&
              event.source?.line === (symbol === 'outer' ? 8 : 4),
          ),
          JSON.stringify(
            events.map((e) => [
              e.kind,
              e.symbolId,
              e.callId,
              e.source?.line,
              e.inputs?.label,
              localValue(e, e.callId, 'label'),
            ]),
          ),
        );
      }
    }
    assert.deepEqual(
      events
        .filter(
          (event) =>
            event.kind === 'return' && event.symbolId === 'main.mjs:inner',
        )
        .map((event) => (event.result as { $type: string }).$type),
      ['Promise', 'Promise'],
    );
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'same!\nsame!\n',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript uncaught errors preserve the observed throw and remain incomplete', async () => {
  const f = await fixture({
    'main.cjs': 'function fail() {\n  throw new Error("BOOM");\n}\nfail();\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, false);
    assert.match(result.diagnostics!.join(' '), /exited with code/);
    assert.match(result.diagnostics!.join(' '), /Error: BOOM/);
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.ok(
      events.some(
        (event) => event.kind === 'enter' && event.symbolId === 'main.cjs:fail',
      ),
    );
    assert.ok(events.every((event) => event.kind !== 'return'));
    const thrown = events.filter((event) => event.kind === 'throw');
    assert.equal(thrown.length, 1);
    assert.equal(thrown[0]!.symbolId, 'main.cjs:fail');
    assert.equal(thrown[0]!.source?.line, 2);
    assert.match(JSON.stringify(thrown[0]!.result), /BOOM/);
    assert.ok(
      events.some(
        (event) =>
          event.kind === 'console' && event.values?.stream === 'stderr',
      ),
    );
  } finally {
    await f.close();
  }
});

test('JavaScript caught exception records the observed throw and still follows the catch handler', async () => {
  const f = await fixture({
    'main.cjs': [
      'function fail() {',
      '  throw new Error("CAUGHT_BY_USER");',
      '}',
      'try {',
      '  fail();',
      '} catch (error) {',
      '  console.log(error.message);',
      '}',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const thrown = events.filter(
      (event) => event.kind === 'throw' && event.symbolId === 'main.cjs:fail',
    );
    assert.equal(thrown.length, 1, 'Capture the actual exception once');
    assert.equal(thrown[0]!.source?.line, 2);
    assert.equal(thrown[0]!.certainty, 'observed');
    assert.match(JSON.stringify(thrown[0]!.result), /CAUGHT_BY_USER/);
    const handled = events.filter((event) => event.kind === 'catch');
    assert.equal(handled.length, 1, 'Handler entry is an observed event');
    assert.equal(handled[0]!.source?.file, 'main.cjs');
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'CAUGHT_BY_USER\n',
    );
    assert.ok(
      events.every(
        (event) =>
          event.kind !== 'return' || event.symbolId !== 'main.cjs:fail',
      ),
      'A throwing function must not be recorded as returning normally',
    );
  } finally {
    await f.close();
  }
});

test('JavaScript return interrupted by a throwing finally is not recorded as a completed return', async () => {
  const f = await fixture({
    'main.cjs': [
      'function calculate() {',
      '  try { return 12; }',
      '  finally { throw new Error("OVERRIDE"); }',
      '}',
      'try { calculate(); } catch (error) { console.log(error.message); }',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const invocation = events.find(
      (event) =>
        event.kind === 'enter' && event.symbolId === 'main.cjs:calculate',
    );
    assert.ok(invocation);
    assert.ok(
      events.some(
        (event) => event.kind === 'throw' && event.callId === invocation.callId,
      ),
    );
    assert.equal(
      events.some(
        (event) =>
          event.kind === 'return' && event.callId === invocation.callId,
      ),
      false,
    );
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'OVERRIDE\n',
    );
  } finally {
    await f.close();
  }
});

test('nested JavaScript catch handlers retain independent observed handler entries', async () => {
  const f = await fixture({
    'main.cjs': [
      'function processErrors() {',
      '  try {',
      '    throw new Error("OUTER");',
      '  } catch (outer) {',
      '    try {',
      '      throw new Error("INNER");',
      '    } catch (inner) {',
      '      console.log(outer.message, inner.message);',
      '    }',
      '  }',
      '}',
      'processErrors();',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    const handlers = events.filter(
      (event) =>
        event.kind === 'catch' && event.symbolId === 'main.cjs:processErrors',
    );
    assert.equal(handlers.length, 2, JSON.stringify(handlers));
    assert.ok(handlers[0]!.source!.line < handlers[1]!.source!.line);
    const thrown = events.filter(
      (event) =>
        event.kind === 'throw' && event.symbolId === 'main.cjs:processErrors',
    );
    assert.equal(thrown.length, 2);
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      'OUTER INNER\n',
    );
  } finally {
    await f.close();
  }
});

test('reentering one JavaScript catch handler records each loop iteration', async () => {
  const f = await fixture({
    'main.cjs': [
      'for (let i = 0; i < 3; i++) {',
      '  try {',
      '    throw new Error(String(i));',
      '  } catch (error) {',
      '    console.log(error.message);',
      '  }',
      '}',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'javascript',
      projectRoot: f.root,
      entry: 'main.cjs',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true, JSON.stringify(result));
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.equal(events.filter((event) => event.kind === 'catch').length, 3);
    assert.equal(events.filter((event) => event.kind === 'throw').length, 3);
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      '0\n1\n2\n',
    );
  } finally {
    await f.close();
  }
});

test('deep recursion exceeds 30 invocations and large recordings use linked storage chunks', async () => {
  const f = await fixture({
    'main.py':
      'def recurse(n):\n    if n:\n        return recurse(n - 1) + 1\n    return 0\nprint(recurse(40))\nfor i in range(1100):\n    x = i\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true);
    const { events, chunks } = await allEvents(f.store, result.sessionId!);
    assert.ok(chunks > 1);
    assert.equal(chunks, result.chunks);
    assert.ok(Math.max(...events.map((e) => e.stack.length)) > 30);
    assert.equal(
      events
        .filter((e) => e.kind === 'console')
        .map((e) => e.output)
        .join(''),
      '40\n',
    );
    assert.equal(events.at(-1)!.id, 'event-' + events.length);
    const first = (await f.store.get(result.sessionId!))!;
    const next = (await f.store.next(first.id))!;
    assert.equal(
      first.flow.trace!.recording!.runId,
      next.flow.trace!.recording!.runId,
    );
    assert.equal(next.flow.trace!.recording!.previousSessionId, first.id);
  } finally {
    await f.close();
  }
});

test('infinite execution preserves valid partial events at the configured budget', async () => {
  const f = await fixture({ 'main.py': 'i = 0\nwhile True:\n    i += 1\n' });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
      maxEvents: 100,
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, false);
    assert.equal(result.eventCount, 100);
    assert.match(result.diagnostics!.join(' '), /event budget/);
    assert.equal(
      (await f.store.get(result.sessionId!))!.flow.trace!.truncated,
      true,
    );
  } finally {
    await f.close();
  }
});

test('timeout and explicit cancellation stop blocked execution and retain partial evidence', async () => {
  const f = await fixture({
    'main.py': 'import time\nx = 1\ntime.sleep(30)\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
      timeoutMs: 2500,
    });
    const timed = await wait(f.service, job.jobId);
    assert.equal(timed.complete, false);
    assert.match(timed.diagnostics!.join(' '), /exceeded 2500 ms/);
    const second = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    for (let i = 0; i < 200; i++) {
      if (
        (await f.service.run({ action: 'status', jobId: second.jobId }))
          .eventCount >= 3
      )
        break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await f.service.run({ action: 'cancel', jobId: second.jobId });
    const cancelled = await wait(f.service, second.jobId);
    assert.equal(cancelled.complete, false);
    assert.match(cancelled.diagnostics!.join(' '), /cancelled/);
  } finally {
    await f.close();
  }
});

test('caught and unhandled exceptions do not invent normal returns; generators retain invocation identity across yields', async () => {
  const f = await fixture({
    'main.py':
      'def fail():\n    try:\n        raise ValueError("bad")\n    finally:\n        x = 1\ntry:\n    fail()\nexcept ValueError:\n    print("caught")\n',
    'generator.py':
      'def gen():\n    yield 1\n    yield 2\n    return "done"\nprint(list(gen()))\n',
    'dynamic.py': 'x = 1\nexec("print(42)")\n',
    'uncaught.py': 'def fail():\n    raise ValueError("bad")\nfail()\n',
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true);
    const { events } = await allEvents(f.store, result.sessionId!);
    assert.equal(
      events.some((e) => e.kind === 'return' && e.symbolId.endsWith(':fail')),
      false,
    );
    assert.ok(events.some((e) => e.note?.includes('unwound')));
    assert.equal(
      events
        .filter((e) => e.kind === 'console')
        .map((e) => e.output)
        .join(''),
      'caught\n',
    );
    const generator = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'generator.py',
    });
    const generated = await wait(f.service, generator.jobId);
    assert.equal(generated.complete, true);
    const { events: generatorEvents } = await allEvents(
      f.store,
      generated.sessionId!,
    );
    const entered = generatorEvents.filter(
      (e) => e.kind === 'enter' && e.symbolId.endsWith(':gen'),
    );
    const yielded = generatorEvents.filter(
      (e) => e.kind === 'yield' && e.symbolId.endsWith(':gen'),
    );
    const resumed = generatorEvents.filter(
      (e) => e.kind === 'resume' && e.symbolId.endsWith(':gen'),
    );
    assert.equal(entered.length, 1);
    assert.deepEqual(
      yielded.map((e) => e.result),
      [1, 2],
    );
    assert.equal(resumed.length, 2);
    assert.ok(
      [...yielded, ...resumed].every((e) => e.callId === entered[0]!.callId),
    );
    assert.deepEqual(
      generatorEvents
        .filter((e) => e.kind === 'return' && e.symbolId.endsWith(':gen'))
        .map((e) => e.result),
      ['done'],
    );
    assert.ok(yielded.every((e) => !e.stack.includes(e.callId)));
    for (const [entry, reason] of [
      ['dynamic.py', /Dynamically compiled/],
      ['uncaught.py', /terminated with ValueError/],
    ] as const) {
      const started = await f.service.run({
        action: 'start',
        language: 'python',
        projectRoot: f.root,
        entry,
      });
      const boundary = await wait(f.service, started.jobId);
      assert.equal(boundary.complete, false);
      assert.match(boundary.diagnostics!.join(' '), reason);
    }
    await assert.rejects(
      f.service.run({
        action: 'start',
        language: 'python',
        projectRoot: f.root,
        entry: '../outside.py',
      }),
    );
  } finally {
    await f.close();
  }
});

test('records coroutine suspension and independent asyncio task interleaving without fictitious returns', async () => {
  const f = await fixture({
    'main.py': [
      'import asyncio',
      'async def worker(name):',
      '    total = 0',
      '    for i in range(2):',
      '        total += 1',
      '        await asyncio.sleep(0)',
      '    print(name, total)',
      '    return total',
      'async def main():',
      '    results = await asyncio.gather(worker("A"), worker("B"))',
      '    print(sum(results))',
      'asyncio.run(main())',
    ].join('\n'),
  });
  try {
    const job = await f.service.run({
      action: 'start',
      language: 'python',
      projectRoot: f.root,
      entry: 'main.py',
    });
    const result = await wait(f.service, job.jobId);
    assert.equal(result.complete, true);
    const { events } = await allEvents(f.store, result.sessionId!);
    const workers = events.filter(
      (e) => e.kind === 'enter' && e.symbolId.endsWith(':worker'),
    );
    assert.equal(workers.length, 2);
    assert.equal(new Set(workers.map((e) => e.values.task)).size, 2);
    assert.ok(workers.every((e) => e.values.task !== 'main'));
    for (const worker of workers) {
      const own = events.filter((e) => e.callId === worker.callId);
      assert.equal(own.filter((e) => e.kind === 'return').length, 1);
      assert.ok(own.filter((e) => e.kind === 'await').length >= 2);
      assert.ok(own.filter((e) => e.kind === 'resume').length >= 2);
      assert.ok(own.every((e) => e.values.task === worker.values.task));
      assert.ok(
        own
          .filter((e) => e.kind === 'await')
          .every((e) => !e.stack.includes(e.callId)),
      );
    }
    assert.equal(
      events.filter(
        (e) => e.kind === 'return' && e.symbolId.endsWith(':worker'),
      ).length,
      2,
    );
    assert.equal(
      events
        .filter((e) => e.kind === 'console')
        .map((e) => e.output)
        .join(''),
      'A 2\nB 2\n4\n',
    );
  } finally {
    await f.close();
  }
});

test('async cancellation and propagated awaited exceptions never become normal returns', async () => {
  const f = await fixture({
    'cancel.py': [
      'import asyncio',
      'async def worker():',
      '    try:',
      '        await asyncio.sleep(10)',
      '    finally:',
      '        print("cleanup")',
      'async def main():',
      '    task = asyncio.create_task(worker())',
      '    await asyncio.sleep(0)',
      '    task.cancel()',
      '    try:',
      '        await task',
      '    except asyncio.CancelledError:',
      '        print("cancelled")',
      'asyncio.run(main())',
    ].join('\n'),
    'exception.py': [
      'import asyncio',
      'async def worker():',
      '    await asyncio.sleep(0)',
      '    raise ValueError("bad")',
      'async def main():',
      '    try:',
      '        await worker()',
      '    except ValueError:',
      '        print("caught")',
      'asyncio.run(main())',
    ].join('\n'),
  });
  try {
    for (const [entry, expected] of [
      ['cancel.py', 'cleanup\ncancelled\n'],
      ['exception.py', 'caught\n'],
    ] as const) {
      const job = await f.service.run({
        action: 'start',
        language: 'python',
        projectRoot: f.root,
        entry,
      });
      const result = await wait(f.service, job.jobId);
      assert.equal(result.complete, true);
      const { events } = await allEvents(f.store, result.sessionId!);
      const worker = events.filter((e) => e.symbolId.endsWith(':worker'));
      const invocation = worker.find((e) => e.kind === 'enter');
      assert.ok(invocation);
      assert.ok(worker.some((e) => e.kind === 'await'));
      assert.ok(worker.some((e) => e.kind === 'resume'));
      assert.ok(worker.some((e) => e.kind === 'throw'));
      assert.ok(worker.every((e) => e.callId === invocation.callId));
      assert.equal(worker.filter((e) => e.kind === 'return').length, 0);
      assert.equal(
        events
          .filter((e) => e.kind === 'console')
          .map((e) => e.output)
          .join(''),
        expected,
      );
    }
  } finally {
    await f.close();
  }
});
