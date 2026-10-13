import { expect, test } from '@playwright/test';
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readConfig } from '../../src/config.js';
import { startRuntime } from '../../src/runtime.js';
import { RecordingService } from '../../src/services/recording-service.js';
import type { TraceEvent } from '../../src/domain/trace.js';

function largeSource(body: string) {
  const line = `# ${'real-source-line '.repeat(57)}\n`;
  while (Buffer.byteLength(body) < 760_000) body += line;
  return body;
}

test('recorded large Python modules navigate exact source with bounded editor rows', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const root = await mkdtemp(
    join(tmpdir(), 'code-anime-browser-large-source-'),
  );
  const runtime = await startRuntime({ ...readConfig({}), port: 0 });
  const service = new RecordingService(
    runtime.store,
    runtime.baseUrl,
    realpath,
  );
  try {
    await mkdir(join(root, 'workers'));
    await writeFile(
      join(root, 'main.py'),
      largeSource(
        [
          'from workers.first import increment',
          'from workers.second import double',
          'value = 0',
          'for i in range(550):',
          '    value = double(increment(value))',
          '    value = value % 1000',
          'print("large result", value)',
          '',
        ].join('\n'),
      ),
    );
    await writeFile(
      join(root, 'workers', 'first.py'),
      largeSource('def increment(value):\n    return value + 1\n'),
    );
    await writeFile(
      join(root, 'workers', 'second.py'),
      largeSource('def double(value):\n    return value * 2\n'),
    );
    const started = await service.run({
      action: 'start',
      language: 'python',
      projectRoot: root,
      entry: 'main.py',
      timeoutMs: 60_000,
      maxEvents: 12_000,
      maxTraceBytes: 24 * 1024 * 1024,
    });
    let result = started;
    await expect
      .poll(
        async () => {
          result = await service.run({
            action: 'status',
            jobId: started.jobId,
          });
          return result.status;
        },
        { timeout: 65_000 },
      )
      .toBe('ready');
    expect(result.complete).toBe(true);
    expect(result.chunks).toBeGreaterThan(1);

    const events: TraceEvent[] = [];
    let chunk = await runtime.store.get(result.sessionId!);
    while (chunk) {
      events.push(...chunk.flow.trace!.events);
      chunk = await runtime.store.next(chunk.id);
    }
    const first = events.findIndex(
      (e) => e.kind === 'statement' && e.source?.file === 'workers/first.py',
    );
    const second = events.findIndex(
      (e) => e.kind === 'statement' && e.source?.file === 'workers/second.py',
    );
    const main = events.findIndex(
      (e) =>
        e.kind === 'statement' &&
        e.source?.file === 'main.py' &&
        e.source.line === 7,
    );
    expect(Math.min(first, second, main)).toBeGreaterThan(-1);

    await page.goto(result.url!);
    await expect(page.locator('#evidence-mode')).toHaveText(
      'Recorded execution',
    );
    await expect(page.locator('#source')).toHaveText('main.py');
    await expect(page.locator('#source-line')).toHaveText('—');
    await expect(page.locator('#snippet')).toContainText(
      'from workers.first import increment',
    );
    await expect(page.locator('#snippet .executing-line')).toHaveCount(0);
    expect(
      await page.locator('#snippet .code-row').count(),
    ).toBeLessThanOrEqual(301);
    await expect(page.locator('#source-empty')).toBeHidden();
    await page
      .locator('#snippet .code-row')
      .first()
      .evaluate((row) => {
        row.setAttribute('data-initial-source-marker', 'persisted');
      });
    await page.locator('#follow').uncheck();
    await expect(page.locator('#snippet .code-row').first()).toHaveAttribute(
      'data-initial-source-marker',
      'persisted',
    );
    await page.locator('#follow').check();
    // Fetch every prepared continuation; seeking afterward must stay entirely client-side.
    let loaded = Number(await page.locator('#timeline').getAttribute('max'));
    while (loaded < result.eventCount) {
      await page.locator('#timeline').fill(String(loaded));
      await page.locator('#next').click();
      await expect
        .poll(() => page.locator('#timeline').getAttribute('max'))
        .not.toBe(String(loaded));
      loaded = Number(await page.locator('#timeline').getAttribute('max'));
    }
    expect(loaded).toBe(events.length);
    let extraFlowRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/flow/')) extraFlowRequests++;
    });
    for (const eventIndex of [first, second, main, first, main]) {
      const event = events[eventIndex]!;
      await page.locator('#timeline').fill(String(eventIndex + 1));
      await expect(page.locator('#source')).toHaveText(event.source!.file);
      await expect(page.locator('#source-line')).toHaveText(
        `L${event.source!.line}`,
      );
      await expect(page.locator('#snippet .executing-line')).toHaveCount(1);
      expect(
        await page.locator('#snippet .code-row').count(),
      ).toBeLessThanOrEqual(301);
      await expect(page.locator('#source-empty')).toBeHidden();
    }
    let expected = 0;
    for (let i = 0; i < 550; i++) expected = ((expected + 1) * 2) % 1000;
    await page.locator('#timeline').fill(String(events.length));
    await expect(page.locator('#console-output')).toContainText(
      `large result ${expected}`,
    );
    await page.locator('#timeline').fill('0');
    await expect(page.locator('#source')).toHaveText('main.py');
    await expect(page.locator('#source-line')).toHaveText('—');
    await expect(page.locator('#snippet .executing-line')).toHaveCount(0);
    await expect(page.locator('#source-empty')).toBeHidden();
    expect(extraFlowRequests).toBe(0);
  } finally {
    service.close();
    await runtime.close();
    await rm(root, { recursive: true, force: true });
  }
});
