import { mkdtempSync, rmSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TraceEvent } from '../domain/trace.js';

const CHUNK_BYTES = 3 * 1024 * 1024;

// Only accepted batches are visible to readers. Files belong to the server,
// never to the project being analyzed.
export class EventJournal {
  private readonly directory = mkdtempSync(
    join(tmpdir(), 'code-anime-events-'),
  );
  private batches = 0;
  count = 0;

  async append(events: TraceEvent[]) {
    if (!events.length) return;
    const pages: string[] = [];
    let items: string[] = [];
    let bytes = 2; // JSON array brackets
    for (const event of events) {
      const serialized = JSON.stringify(event);
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

  async *chunks(): AsyncGenerator<TraceEvent[]> {
    let chunk: TraceEvent[] = [];
    let size = 2;
    for (let batch = 0; batch < this.batches; batch++) {
      const events: TraceEvent[] = JSON.parse(
        await readFile(join(this.directory, `${batch}.json`), 'utf8'),
      );
      for (const event of events) {
        const bytes = Buffer.byteLength(JSON.stringify(event));
        if (
          chunk.length &&
          (chunk.length >= 2000 || size + 1 + bytes > CHUNK_BYTES)
        ) {
          yield chunk;
          chunk = [];
          size = 2;
        }
        chunk.push(event);
        size += (chunk.length > 1 ? 1 : 0) + bytes;
      }
    }
    if (chunk.length) yield chunk;
  }

  close() {
    rmSync(this.directory, { recursive: true, force: true });
  }
}
