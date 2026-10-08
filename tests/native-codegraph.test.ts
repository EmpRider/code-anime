import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { traceToFlow } from '../src/analysis/contract.js';
import type { Trace } from '../src/domain/trace.js';
import { parseNodes } from '../src/analysis/native-codegraph.js';
import { VisualizationService } from '../src/services/visualization-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';

test('native adapter reads CodeGraph symbol metadata without interpreting source', () => {
  const text =
    '**generate** (method)\r\n\r\n**Location:** src/Generator.kt:3\r\n\r\n```kotlin\r\n3\tfun generate() = unknown()\r\n```';
  const nodes = parseNodes(text);
  assert.equal(nodes[0]?.file, 'src/Generator.kt');
  assert.equal(nodes[0]?.line, 3);
  assert.match(nodes[0]?.snippet ?? '', /unknown/);
  assert.deepEqual(parseNodes('Symbol "x" not found in the codebase'), []);
  assert.deepEqual(
    parseNodes('**x** (method)\n**Location:** file.kt:3 — stale'),
    [],
  );
});

test('replay steps retain indexed edge endpoints across sibling graph branches', () => {
  const trace: Trace = {
    version: 2,
    provider: 'codegraph-native',
    projectRoot: '/project',
    sourceHash: 'evidence',
    target: 'root',
    scenario: {},
    diagnostics: [],
    truncated: false,
    filesAnalyzed: 1,
    cacheHits: 0,
    events: ['first', 'second'].map((name, i) => ({
      id: String(i),
      kind: 'call',
      symbolId: name,
      label: name,
      callId: name,
      values: { from: 'root', to: name },
      stack: ['root'],
      certainty: 'static',
    })),
  };
  assert.deepEqual(
    traceToFlow(trace, 'root').steps.map((step) => [step.from, step.to]),
    [
      ['root', 'first'],
      ['root', 'second'],
    ],
  );
});

const executable = process.env.CODE_ANIME_TEST_CODEGRAPH;
test(
  'real CodeGraph: missing index stops, indexed Kotlin produces provider-only replay and refinement',
  { skip: !executable },
  async () => {
    const previous = process.env.CODE_ANIME_CODEGRAPH_COMMAND;
    const previousConfig = process.env.CODE_ANIME_CODEGRAPH_CONFIG;
    process.env.CODE_ANIME_CODEGRAPH_COMMAND = executable!;
    delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
    const directory = await mkdtemp(join(tmpdir(), 'code-anime-kotlin-'));
    const store = await FileSessionStore.open(tmpdir(), {
      ttlMs: 60000,
      maxSessionBytes: 1000000,
      maxSessions: 20,
    });
    const service = new VisualizationService(store, 'http://127.0.0.1:1234');
    try {
      await assert.rejects(
        service.start({ projectRoot: directory, target: 'Generator.generate' }),
        /index|initialize/i,
      );
      assert.deepEqual(await service.manage('list'), {
        sessions: [],
        jobs: [],
      });
      await mkdir(join(directory, 'src'));
      await writeFile(
        join(directory, 'src', 'Generator.kt'),
        'class Generator {\n fun generate(input: String): String { return normalize(input) }\n fun normalize(input: String): String { return input.trim() }\n}\nclass Other {\n fun normalize(input: String): String { return input }\n}\n',
      );
      execFileSync(executable!, ['init', directory], {
        env: { ...process.env, CODEGRAPH_TELEMETRY: '0' },
        timeout: 60000,
        stdio: 'pipe',
      });
      const wait = async (id: string) => {
        for (let i = 0; i < 600; i++) {
          const status = service.status(id);
          if (!['queued', 'running'].includes(status.status)) return status;
          await new Promise((r) => setTimeout(r, 50));
        }
        throw new Error('Job timed out');
      };
      const job = await service.start({
        projectRoot: directory,
        target: 'Generator.generate',
        scenario: { input: '  ACH  ' },
      });
      const ready = await wait(job.jobId);
      assert.equal(ready.status, 'ready', JSON.stringify(ready));
      assert.equal(ready.provider, 'codegraph-native');
      const trace = (await store.get(String(ready.sessionId)))!.flow.trace!;
      assert.ok(
        trace.events.some((e) => e.label === 'normalize' && e.kind === 'call'),
      );
      assert.ok(trace.events.some((e) => e.snippet?.includes('input.trim()')));
      assert.ok(
        trace.events.every((e) => e.certainty === 'static'),
        JSON.stringify(trace.events),
      );
      assert.ok(!trace.events.some((e) => Object.hasOwn(e.values, 'result')));
      const refine = await service.refine(String(ready.sessionId), {
        input: 'different',
      });
      assert.equal((await wait(refine.jobId)).status, 'ready');
      const ambiguous = await service.start({
        projectRoot: directory,
        target: 'normalize',
      });
      const candidates = await wait(ambiguous.jobId);
      assert.equal(candidates.status, 'needs_selection');
      assert.equal((candidates.candidates as unknown[]).length, 2);
    } finally {
      service.close();
      await store.close();
      await rm(directory, { recursive: true, force: true });
      if (previous === undefined)
        delete process.env.CODE_ANIME_CODEGRAPH_COMMAND;
      else process.env.CODE_ANIME_CODEGRAPH_COMMAND = previous;
      if (previousConfig === undefined)
        delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
      else process.env.CODE_ANIME_CODEGRAPH_CONFIG = previousConfig;
    }
  },
);
