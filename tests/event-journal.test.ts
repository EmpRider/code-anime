import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { EventJournal } from '../src/storage/event-journal.js';
import type { TraceEvent } from '../src/domain/trace.js';

test('journal rejects an oversized batch without exposing a partial append', async () => {
  const journal = new EventJournal();
  const event: TraceEvent = {
    id: 'event-1',
    kind: 'enter',
    symbolId: 'main',
    label: 'Enter',
    values: {},
    certainty: 'mock',
    callId: 'call-1',
    stack: ['call-1'],
  };
  try {
    await journal.append([event]);
    await assert.rejects(
      journal.append([
        { ...event, id: 'event-2' },
        {
          ...event,
          id: 'event-3',
          values: { huge: 'x'.repeat(3 * 1024 * 1024) },
        },
      ]),
      /snapshot exceeds/,
    );
    assert.equal(journal.count, 1);
    await journal.append([{ ...event, id: 'event-2' }]);
    const ids: string[] = [];
    for await (const events of journal.chunks())
      ids.push(...events.map((e) => e.id));
    assert.deepEqual(ids, ['event-1', 'event-2']);
  } finally {
    journal.close();
  }
});

test('journal bounds every persisted batch and replay chunk by serialized UTF-8 bytes', async () => {
  const journal = new EventJournal();
  const event: TraceEvent = {
    id: 'event-1',
    kind: 'statement',
    symbolId: 'Workflow.run',
    label: 'Mock source step',
    values: {},
    callId: 'call-1',
    stack: ['call-1'],
    certainty: 'mock',
  };
  const events = Array.from({ length: 9 }, (_, i) => ({
    ...event,
    id: `event-${i + 1}`,
    values: { text: '🟠'.repeat(210_000) },
  }));
  try {
    await journal.append(events);
    assert.equal(journal.count, events.length);
    const directory = (journal as unknown as { directory: string }).directory;
    const files = (await readdir(directory)).sort(
      (a, b) => Number.parseInt(a) - Number.parseInt(b),
    );
    assert.ok(files.length >= 3, 'large append should produce bounded files');
    const diskIds: string[] = [];
    for (const file of files) {
      const path = `${directory}/${file}`;
      assert.ok((await stat(path)).size <= 3 * 1024 * 1024);
      diskIds.push(
        ...(JSON.parse(await readFile(path, 'utf8')) as TraceEvent[]).map(
          (entry) => entry.id,
        ),
      );
    }
    assert.deepEqual(
      diskIds,
      events.map((entry) => entry.id),
    );
    const replayIds: string[] = [];
    for await (const chunk of journal.chunks()) {
      assert.ok(Buffer.byteLength(JSON.stringify(chunk)) <= 3 * 1024 * 1024);
      replayIds.push(...chunk.map((entry) => entry.id));
    }
    assert.deepEqual(replayIds, diskIds);
  } finally {
    journal.close();
  }
});
