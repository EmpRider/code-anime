import { mkdtempSync, rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TraceEvent } from '../domain/trace.js';

const CHUNK_BYTES = 3 * 1024 * 1024;

// Only accepted batches are visible to readers. Files belong to the server,
// never to the project being analyzed.
export class EventJournal {
  private readonly directory = mkdtempSync(join(tmpdir(), 'code-anime-events-'));
  private batches = 0;
  count = 0;

  async append(events: TraceEvent[]) {
    for (const event of events)
      if (Buffer.byteLength(JSON.stringify(event)) > CHUNK_BYTES)
        throw new Error('One event snapshot exceeds the session budget');
    await writeFile(join(this.directory, `${this.batches}.json`), JSON.stringify(events), { mode: 0o600 });
    this.batches++;
    this.count += events.length;
  }

  async *chunks(): AsyncGenerator<TraceEvent[]> {
    let chunk: TraceEvent[] = [];
    let size = 0;
    for (let batch = 0; batch < this.batches; batch++) {
      const events: TraceEvent[] = JSON.parse(await readFile(join(this.directory, `${batch}.json`), 'utf8'));
      for (const event of events) {
        const bytes = Buffer.byteLength(JSON.stringify(event));
        if (chunk.length && (chunk.length >= 2000 || size + bytes > CHUNK_BYTES)) {
          yield chunk;
          chunk = [];
          size = 0;
        }
        chunk.push(event);
        size += bytes;
      }
    }
    if (chunk.length) yield chunk;
  }

  close() {
    rmSync(this.directory, { recursive: true, force: true });
  }
}
