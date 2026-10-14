import { test } from 'node:test';
import assert from 'node:assert/strict';
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
