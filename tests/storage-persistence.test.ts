import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { readConfig } from '../src/config.js';
import { flowSchema, type Flow } from '../src/domain/flow.js';
import { startRuntime } from '../src/runtime.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';

const sample = flowSchema.parse({
  endpoint: 'Application.run',
  steps: [
    {
      from: 'Application.run',
      to: 'Service.run',
      dtoName: 'Args',
      dtoFields: {},
    },
  ],
});
const options = { ttlMs: 60_000, maxSessionBytes: 50_000, maxSessions: 3 };

function continuation(
  previousSessionId: string,
  baselineSessionId?: string,
): Flow {
  return flowSchema.parse({
    ...sample,
    ...(baselineSessionId ? { baselineSessionId } : {}),
    trace: {
      version: 2,
      provider: 'codegraph-native',
      projectRoot: '/sample',
      sourceHash: 'same-source',
      target: 'Application.run',
      scenario: {},
      events: [],
      diagnostics: [],
      truncated: false,
      filesAnalyzed: 2,
      cacheHits: 0,
      simulation: {
        mode: 'ai-mock',
        complete: true,
        coverage: 'Complete example',
        evidenceIds: [],
        previousSessionId,
      },
    },
  });
}

async function withDirectory(action: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'code-anime-persist-test-'));
  try {
    await action(directory);
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}

test('persistent sessions and continuation index survive a normal close and restart', async () => {
  await withDirectory(async (directory) => {
    const config = { ...options, persistentDirectory: directory };
    const firstStore = await FileSessionStore.open(tmpdir(), config);
    let parent: string;
    let child: string;
    try {
      const root = await firstStore.create(sample);
      parent = root.id;
      child = (await firstStore.create(continuation(parent))).id;
    } finally {
      await firstStore.close();
      await firstStore.close();
    }
    assert.deepEqual(
      (await readdir(directory)).filter((s) => s.endsWith('.json')).length,
      2,
    );
    const restored = await FileSessionStore.open(tmpdir(), config);
    try {
      assert.deepEqual((await restored.get(parent))?.flow, sample);
      assert.equal((await restored.next(parent))?.id, child);
      assert.equal((await restored.latest())?.id, child);
      assert.equal((await restored.list()).length, 2);
      await restored.create(sample);
      assert.equal((await restored.list()).length, 3);
    } finally {
      await restored.close();
    }
  });
});

test('saved HTTP flow and independently continued comparison reopen across runtime restarts', async () => {
  await withDirectory(async (directory) => {
    const config = {
      ...readConfig({ CODE_ANIME_SESSION_DIR: directory }),
      port: 0,
    };
    const initial = await startRuntime(config);
    let firstId: string;
    let proposedNextId: string;
    let baselineNextId: string;
    try {
      const baseline = await initial.store.create(sample);
      baselineNextId = (await initial.store.create(continuation(baseline.id)))
        .id;
      const first = await initial.store.create({
        ...sample,
        baselineSessionId: baseline.id,
      });
      firstId = first.id;
      proposedNextId = (
        await initial.store.create(continuation(first.id, baseline.id))
      ).id;
    } finally {
      await initial.close();
    }
    const restored = await startRuntime(config);
    try {
      const response = await fetch(restored.baseUrl + '/api/flow/' + firstId);
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.nextSessionId, proposedNextId);
      assert.equal(data.baselineNextSessionId, baselineNextId);
      assert.equal(
        (await fetch(restored.baseUrl + '/flow/' + firstId)).status,
        200,
      );
      assert.equal(
        (await fetch(restored.baseUrl + '/api/flow/' + proposedNextId)).status,
        200,
      );
    } finally {
      await restored.close();
    }
  });
});

test('recovery quarantines corrupt and oversized sessions but keeps valid sessions', async () => {
  await withDirectory(async (directory) => {
    const config = { ...options, persistentDirectory: directory };
    const firstStore = await FileSessionStore.open(tmpdir(), config);
    const validId = (await firstStore.create(sample)).id;
    await firstStore.close();
    const corruptId = randomUUID();
    const oversizedId = randomUUID();
    const interruptedId = randomUUID();
    await writeFile(join(directory, corruptId + '.json'), '{unparseable');
    await writeFile(
      join(directory, oversizedId + '.json'),
      'x'.repeat(options.maxSessionBytes + 1),
    );
    await writeFile(join(directory, interruptedId + '.json.tmp'), 'unfinished');
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (message) => {
      warnings.push(String(message));
    };
    let store: FileSessionStore;
    try {
      store = await FileSessionStore.open(tmpdir(), config);
    } finally {
      console.warn = originalWarn;
    }
    try {
      assert.deepEqual((await store.get(validId))?.flow, sample);
      assert.equal((await store.list()).length, 1);
      assert.equal(await store.get(corruptId), undefined);
      assert.equal(await store.get(oversizedId), undefined);
      assert.equal(
        (await readdir(join(directory, '.code-anime-corrupt'))).length,
        2,
      );
      assert.equal(
        (await readdir(directory)).some((entry) => entry.endsWith('.json.tmp')),
        false,
      );
      assert.equal(warnings.length, 2);
    } finally {
      await store.close();
    }
  });
});

test('external changes to recovered session files are quarantined without affecting other sessions', async () => {
  await withDirectory(async (directory) => {
    const config = { ...options, persistentDirectory: directory };
    const initial = await FileSessionStore.open(tmpdir(), config);
    const damagedId = (await initial.create(sample)).id;
    const goodId = (await initial.create(sample)).id;
    await initial.close();

    const restored = await FileSessionStore.open(tmpdir(), config);
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (message) => {
      warnings.push(String(message));
    };
    try {
      await writeFile(
        join(directory, damagedId + '.json'),
        '{changed outside the server',
      );
      assert.equal(await restored.get(damagedId), undefined);
      assert.deepEqual((await restored.get(goodId))?.flow, sample);
      assert.deepEqual(
        (await restored.list()).map((s) => s.id),
        [goodId],
      );
      assert.equal(
        (await readdir(join(directory, '.code-anime-corrupt'))).length,
        1,
      );
      assert.equal(warnings.length, 1);
      assert.match(warnings[0]!, /Quarantined invalid saved session/);
    } finally {
      console.warn = originalWarn;
      await restored.close();
    }
  });
});

test('persistent TTL and max session count are enforced after recovery', async () => {
  await withDirectory(async (directory) => {
    const config = {
      ...options,
      persistentDirectory: directory,
      maxSessions: 2,
    };
    const original = await FileSessionStore.open(tmpdir(), config);
    const one = (await original.create(sample)).id;
    await original.create(sample);
    await original.close();
    const reopened = await FileSessionStore.open(tmpdir(), config);
    try {
      assert.equal((await reopened.list()).length, 2);
      await assert.rejects(reopened.create(sample), /Session limit/);
      assert.equal(await reopened.delete(one), true);
      await reopened.create(sample);
    } finally {
      await reopened.close();
    }
    const expired = await FileSessionStore.open(tmpdir(), {
      ...config,
      ttlMs: 1,
    });
    try {
      assert.equal((await expired.list()).length, 0);
      assert.equal(await expired.latest(), undefined);
      assert.deepEqual(
        (await readdir(directory)).filter((s) => s.endsWith('.json')),
        [],
      );
    } finally {
      await expired.close();
    }
  });
});

test('persistent directory allows only one owner and releases its own lock', async () => {
  await withDirectory(async (directory) => {
    const config = { ...options, persistentDirectory: directory };
    const owner = await FileSessionStore.open(tmpdir(), config);
    const lockPath = join(directory, '.code-anime.lock');
    try {
      await assert.rejects(
        FileSessionStore.open(tmpdir(), config),
        /directory is locked/,
      );
      const metadata = JSON.parse(await readFile(lockPath, 'utf8'));
      assert.equal(metadata.pid, process.pid);
      assert.equal(typeof metadata.owner, 'string');
    } finally {
      await owner.close();
    }
    const reopened = await FileSessionStore.open(tmpdir(), config);
    await reopened.close();
    await writeFile(
      lockPath,
      JSON.stringify({ pid: -1, owner: 'unconfirmed-stale-owner' }),
    );
    await assert.rejects(
      FileSessionStore.open(tmpdir(), config),
      /remove this lock only after confirming/,
    );
  });
});

test('ephemeral sessions remain isolated and disappear after close', async () => {
  await withDirectory(async (root) => {
    const first = await FileSessionStore.open(root, options);
    const second = await FileSessionStore.open(root, options);
    const saved = await first.create(sample);
    try {
      assert.equal(await second.get(saved.id), undefined);
    } finally {
      await first.close();
      await second.close();
    }
    assert.deepEqual(await readdir(root), []);
  });
});
