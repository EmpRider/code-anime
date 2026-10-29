import { mkdtempSync, rmSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TraceEvent } from '../domain/trace.js';

const CHUNK_BYTES = 3 * 1024 * 1024;
type AnnotatedEvent = { event: TraceEvent; groupPath: string[] };

// Only accepted batches are visible to readers. Files belong to the server,
// never to the project being analyzed.
export class EventJournal {
  private readonly directory = mkdtempSync(
    join(tmpdir(), 'code-anime-events-'),
  );
  private batches = 0;
  count = 0;

  async append(
    events: TraceEvent[],
    groupPaths?: readonly (readonly string[])[],
  ) {
    if (groupPaths && groupPaths.length !== events.length)
      throw new Error('Group path count must match accepted event count');
    if (!events.length) return;
    const pages: string[] = [];
    let items: string[] = [];
    let bytes = 2; // JSON array brackets
    for (const [index, event] of events.entries()) {
      const path = groupPaths?.[index];
      if (path && path.length > 2000)
        throw new Error('One group path exceeds the trace chunk budget');
      const serialized = JSON.stringify(
        path ? { event, groupPath: path } : event,
      );
      const eventBytes = Buffer.byteLength(serialized);
      if (eventBytes + 2 > CHUNK_BYTES)
        throw new Error('One event snapshot exceeds the session budget');
      const separatorBytes = items.length ? 1 : 0;
      if (items.length && bytes + separatorBytes + eventBytes > CHUNK_BYTES) {
        pages.push(`[${items.join(',')}]`);
        items = [];
        bytes = 2;
      }
      bytes += (items.length ? 1 : 0) + eventBytes;
      items.push(serialized);
    }
    if (items.length) pages.push(`[${items.join(',')}]`);

    // Do not expose an append until all bounded files are written. If a later
    // write fails, remove every file attempted in this append before retrying.
    const attempted: string[] = [];
    try {
      for (const [index, page] of pages.entries()) {
        const path = join(this.directory, `${this.batches + index}.json`);
        attempted.push(path);
        await writeFile(path, page, { mode: 0o600 });
      }
    } catch (error) {
      await Promise.allSettled(
        attempted.map((path) => rm(path, { force: true })),
      );
      throw error;
    }
    this.batches += pages.length;
    this.count += events.length;
  }

  async *annotatedChunks(): AsyncGenerator<{
    events: TraceEvent[];
    groupPaths: string[][];
  }> {
    let events: TraceEvent[] = [];
    let groupPaths: string[][] = [];
    let size = 2;
    let groupIds = new Set<string>();
    for (let batch = 0; batch < this.batches; batch++) {
      const stored: Array<TraceEvent | AnnotatedEvent> = JSON.parse(
        await readFile(join(this.directory, `${batch}.json`), 'utf8'),
      );
      for (const entry of stored) {
        const annotated = 'event' in entry;
        const event = annotated ? entry.event : entry;
        const path = annotated ? entry.groupPath : [];
        const bytes = Buffer.byteLength(JSON.stringify(entry));
        const missing = path.filter((id) => !groupIds.has(id));
        if (
          events.length &&
          (events.length >= 2000 ||
            size + 1 + bytes > CHUNK_BYTES ||
            groupIds.size + missing.length > 2000)
        ) {
          yield { events, groupPaths };
          events = [];
          groupPaths = [];
          size = 2;
          groupIds = new Set();
        }
        for (const id of path) groupIds.add(id);
        if (groupIds.size > 2000)
          throw new Error('One group path exceeds the trace chunk budget');
        events.push(event);
        groupPaths.push(path);
        size += (events.length > 1 ? 1 : 0) + bytes;
      }
    }
    if (events.length) yield { events, groupPaths };
  }

  async *chunks(): AsyncGenerator<TraceEvent[]> {
    for await (const chunk of this.annotatedChunks()) yield chunk.events;
  }

  close() {
    rmSync(this.directory, { recursive: true, force: true });
  }
}
