import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { RecordingService } from '../src/services/recording-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';

type Language = 'python' | 'javascript';

function padSource(source: string, language: Language, bytes: number) {
  const filler = `${language === 'python' ? '#' : '//'} ${'original-source '.repeat(55)}\n`;
  while (Buffer.byteLength(source) < bytes) source += filler;
  return source;
}

async function withProject(
  language: Language,
  files: Record<string, string>,
  check: (fixture: {
    root: string;
    store: FileSessionStore;
    service: RecordingService;
  }) => Promise<void>,
  maxSessions = 100,
) {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-boundary-'));
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 120000,
    maxSessionBytes: 10 * 1024 * 1024,
    maxSessions,
  });
  const service = new RecordingService(
    store,
    'http://127.0.0.1:3456',
    realpath,
  );
  try {
    for (const [file, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, file)), { recursive: true });
      await writeFile(join(root, file), content);
    }
    await check({ root, store, service });
  } finally {
    service.close();
    await store.close();
    await rm(root, { recursive: true, force: true });
  }
}

async function record(
  fixture: { root: string; service: RecordingService },
  language: Language,
) {
  const entry = language === 'python' ? 'main.py' : 'main.cjs';
  const started = await fixture.service.run({
    action: 'start',
    language,
    projectRoot: fixture.root,
    entry,
    timeoutMs: 60000,
    maxEvents: 12000,
    maxTraceBytes: 24 * 1024 * 1024,
  });
  const deadline = Date.now() + 65000;
  let result = started;
  while (['running', 'saving'].includes(result.status)) {
    assert.ok(
      Date.now() < deadline,
      `Recording did not stop: ${JSON.stringify(result)}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 40));
    result = await fixture.service.run({
      action: 'status',
      jobId: started.jobId,
    });
  }
  return result;
}

for (const language of ['python', 'javascript'] as const) {
  const python = language === 'python';
  const ext = python ? 'py' : 'cjs';

  test(`${language}: source above 2 MiB before the first observed event fails without a session`, async () => {
    const main = padSource(
      python ? 'print("unreachable")\n' : 'console.log("unreachable");\n',
      language,
      2 * 1024 * 1024 + 1000,
    );
    await withProject(language, { [`main.${ext}`]: main }, async (fixture) => {
      const result = await record(fixture, language);
      assert.equal(result.status, 'failed', JSON.stringify(result));
      assert.match(result.error ?? '', /2 MiB|source.*budget/i);
      assert.equal(result.eventCount, 0);
      assert.deepEqual(await fixture.store.list(), []);
    });
  });

  test(`${language}: aggregate source boundary preserves observed events and reports incomplete coverage`, async () => {
    const files = python
      ? {
          'main.py': padSource(
            'from helpers.first import increment\nfrom helpers.second import double\nprint(double(increment(4)))\n',
            language,
            1_500_000,
          ),
          'helpers/first.py': padSource(
            'def increment(value):\n    return value + 1\n',
            language,
            1_500_000,
          ),
          'helpers/second.py': padSource(
            'def double(value):\n    return value * 2\n',
            language,
            1_500_000,
          ),
        }
      : {
          'main.cjs': padSource(
            "const { increment } = require('./helpers/first.cjs');\nconst { double } = require('./helpers/second.cjs');\nconsole.log(double(increment(4)));\n",
            language,
            1_500_000,
          ),
          'helpers/first.cjs': padSource(
            'exports.increment = function increment(value) { return value + 1; };\n',
            language,
            1_500_000,
          ),
          'helpers/second.cjs': padSource(
            'exports.double = function double(value) { return value * 2; };\n',
            language,
            1_500_000,
          ),
        };
    await withProject(language, files, async (fixture) => {
      const result = await record(fixture, language);
      assert.equal(result.status, 'ready', JSON.stringify(result));
      assert.equal(result.complete, false);
      assert.ok(result.eventCount > 0);
      assert.match(
        result.diagnostics?.join(' ') ?? '',
        /4 MiB|source.*budget/i,
      );
      const session = await fixture.store.get(result.sessionId!);
      assert.ok(session);
      assert.equal(session.flow.trace?.truncated, true);
      assert.equal(session.flow.trace?.recording?.complete, false);
      assert.ok(
        session.flow.trace?.events.every(
          (event) => event.certainty === 'observed',
        ),
      );
      assert.ok(Object.keys(session.flow.trace?.sourceFiles ?? {}).length > 0);
    });
  });

  test(`${language}: failed continuation save rolls back previously stored sessions`, async () => {
    const main = python
      ? 'total = 0\nfor i in range(1400):\n    total += i\nprint(total)\n'
      : 'let total = 0;\nfor (let i = 0; i < 1400; i++) { total += i; }\nconsole.log(total);\n';
    await withProject(
      language,
      { [`main.${ext}`]: main },
      async (fixture) => {
        const result = await record(fixture, language);
        assert.equal(result.status, 'failed', JSON.stringify(result));
        assert.match(result.error ?? '', /Session limit reached/);
        assert.ok(
          result.eventCount > 200,
          'Capture enough events for multiple saved chunks',
        );
        assert.deepEqual(
          await fixture.store.list(),
          [],
          'Rollback orphaned continuation',
        );
      },
      1,
    );
  });
}
