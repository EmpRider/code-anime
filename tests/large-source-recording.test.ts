import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { RecordingService } from '../src/services/recording-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import type { TraceEvent } from '../src/domain/trace.js';

// These are substantial, executable project files, not artificial event arrays.
// Keep the generated sources outside the user's workspace and remove them.
function largeSource(body: string, comment: string, targetBytes: number) {
  const filler = `${comment} ${'source-window-padding '.repeat(46)}\n`;
  let content = body;
  while (Buffer.byteLength(content) < targetBytes) content += filler;
  return content;
}

async function recordLargeProject(language: 'python' | 'javascript') {
  const python = language === 'python';
  const ext = python ? 'py' : 'cjs';
  const root = await mkdtemp(join(tmpdir(), 'code-anime-large-source-'));
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 120000,
    maxSessionBytes: 10 * 1024 * 1024,
    maxSessions: 100,
  });
  const service = new RecordingService(
    store,
    'http://127.0.0.1:3456',
    realpath,
  );
  const code = python
    ? {
        main: [
          'from helpers.first import increment',
          'from helpers.second import double',
          'value = 0',
          'for i in range(550):',
          '    value = double(increment(value))',
          '    value = value % 1000',
          'print("final", value)',
          '',
        ].join('\n'),
        first: 'def increment(value):\n    return value + 1\n',
        second: 'def double(value):\n    return value * 2\n',
      }
    : {
        main: [
          "const { increment } = require('./helpers/first.cjs');",
          "const { double } = require('./helpers/second.cjs');",
          'let value = 0;',
          'for (let i = 0; i < 550; i++) {',
          '  value = double(increment(value));',
          '  value %= 1000;',
          '}',
          "console.log('final', value);",
          '',
        ].join('\n'),
        first:
          'exports.increment = function increment(value) { return value + 1; };\n',
        second:
          'exports.double = function double(value) { return value * 2; };\n',
      };
  const files: Record<string, string> = {
    [`main.${ext}`]: largeSource(code.main, python ? '#' : '//', 760_000),
    [`helpers/first.${ext}`]: largeSource(
      code.first,
      python ? '#' : '//',
      760_000,
    ),
    [`helpers/second.${ext}`]: largeSource(
      code.second,
      python ? '#' : '//',
      760_000,
    ),
  };
  try {
    for (const [file, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, file)), { recursive: true });
      await writeFile(join(root, file), content);
    }
    const started = await service.run({
      action: 'start',
      language,
      projectRoot: root,
      entry: `main.${ext}`,
      timeoutMs: 60000,
      maxEvents: 12000,
      maxTraceBytes: 24 * 1024 * 1024,
    });
    let result = started;
    const deadline = Date.now() + 65000;
    while (result.status === 'running' || result.status === 'saving') {
      assert.ok(Date.now() < deadline, 'Recorder did not finish');
      await new Promise((resolve) => setTimeout(resolve, 40));
      result = await service.run({ action: 'status', jobId: started.jobId });
    }
    assert.equal(result.status, 'ready', JSON.stringify(result));
    assert.equal(result.complete, true, JSON.stringify(result));
    const sessionId = result.sessionId;
    const chunkCount = result.chunks;
    assert.ok(sessionId, 'Recorder returned a saved session');
    assert.ok(
      chunkCount && chunkCount > 1,
      `Real execution must span stored chunks: ${JSON.stringify(result)}`,
    );
    const events: TraceEvent[] = [];
    let cursor = await store.get(sessionId);
    const expectedHash = cursor?.flow.trace?.sourceHash;
    let chunks = 0;
    while (cursor) {
      chunks++;
      assert.equal(cursor.flow.trace?.sourceHash, expectedHash);
      for (const [file, source] of Object.entries(files))
        assert.equal(
          cursor.flow.trace?.sourceFiles?.[file],
          source,
          `Exact ${file} snapshot in chunk ${chunks}`,
        );
      events.push(...cursor.flow.trace!.events);
      cursor = await store.next(cursor.id);
    }
    assert.equal(chunks, chunkCount);
    assert.equal(events.length, result.eventCount);
    assert.ok(events.every((event) => event.certainty === 'observed'));
    assert.ok(events.some((event) => event.symbolId.includes('increment')));
    assert.ok(events.some((event) => event.symbolId.includes('double')));
    assert.ok(events.some((event) => event.source?.file === `main.${ext}`));
    let expected = 0;
    for (let i = 0; i < 550; i++) expected = ((expected + 1) * 2) % 1000;
    assert.equal(
      events
        .filter((event) => event.kind === 'console')
        .map((event) => event.output)
        .join(''),
      `final ${expected}\n`,
    );
  } finally {
    service.close();
    await store.close();
    await rm(root, { recursive: true, force: true });
  }
}

test('Python records cross-module execution with 2.2 MiB of original sources', async () => {
  await recordLargeProject('python');
});

test('JavaScript records cross-module execution with 2.2 MiB of original sources', async () => {
  await recordLargeProject('javascript');
});
