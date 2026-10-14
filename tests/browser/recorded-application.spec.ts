import { expect, test } from '@playwright/test';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readConfig } from '../../src/config.js';
import type { TraceEvent } from '../../src/domain/trace.js';
import { startRuntime } from '../../src/runtime.js';
import { RecordingService } from '../../src/services/recording-service.js';

test('multi-module order processing preserves observed state and bounded painted replay', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const runtime = await startRuntime({ ...readConfig({}), port: 0 });
  const recorder = new RecordingService(
    runtime.store,
    runtime.baseUrl,
    realpath,
  );
  try {
    const started = await recorder.run({
      action: 'start',
      language: 'python',
      projectRoot: fileURLToPath(
        new URL('../fixtures/runtime/order_workflow/', import.meta.url),
      ),
      entry: 'main.py',
      args: ['200'],
      maxEvents: 60_000,
      maxTraceBytes: 64 * 1024 * 1024,
      timeoutMs: 120_000,
    });
    let result = started;
    await expect
      .poll(
        async () => {
          result = await recorder.run({
            action: 'status',
            jobId: started.jobId,
          });
          if (result.status === 'failed') throw new Error(result.error);
          return result.status;
        },
        { timeout: 140_000 },
      )
      .toBe('ready');
    expect(result.complete, JSON.stringify(result)).toBe(true);
    expect(result.eventCount).toBeGreaterThan(6_000);
    expect(result.chunks).toBeGreaterThan(2);

    const events: TraceEvent[] = [];
    let stored = await runtime.store.get(result.sessionId!);
    while (stored) {
      events.push(...stored.flow.trace!.events);
      stored = await runtime.store.next(stored.id);
    }
    expect(events).toHaveLength(result.eventCount);
    const entries = events.filter((event) => event.kind === 'enter');
    const reserveCalls = entries.filter((event) =>
      event.symbolId.endsWith('reserve'),
    );
    const captureCalls = entries.filter((event) =>
      event.symbolId.endsWith('capture'),
    );
    expect(reserveCalls).toHaveLength(400);
    expect(captureCalls).toHaveLength(200);
    expect(entries.every((event) => event.certainty === 'observed')).toBe(true);
    expect(new Set(reserveCalls.map((event) => event.callId)).size).toBe(400);
    const sourcePositions = ['inventory.py', 'ledger.py', 'orders.py'].map(
      (file) =>
        events.findIndex(
          (event) => event.kind === 'statement' && event.source?.file === file,
        ),
    );
    expect(Math.min(...sourcePositions)).toBeGreaterThanOrEqual(0);

    const expectedTotal = Array.from({ length: 200 }, (_, index) => {
      const subtotal = 5 + (index % 5) + 3 + (index % 7);
      return subtotal + Math.floor(subtotal / 10);
    }).reduce((sum, amount) => sum + amount, 0);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(result.url!);
    await expect(page.locator('#evidence-mode')).toHaveText(
      'Recorded execution',
    );

    // Continuations are prepared by the recorder. Fetch them once, then
    // require all remaining source navigation to use in-browser replay only.
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
    await page.locator('#timeline').fill(String(loaded));
    await expect(page.locator('#console-output')).toContainText(
      `settled 200 ${expectedTotal}`,
    );
    await expect(page.locator('#console-output')).toContainText(
      'inventory 700 700',
    );

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('HeapProfiler.enable');
    await cdp.send('HeapProfiler.collectGarbage');
    const metric = async () => {
      const { metrics } = await cdp.send('Performance.getMetrics');
      return (
        metrics.find((value) => value.name === 'JSHeapUsedSize')?.value ?? 0
      );
    };
    const heapBefore = await metric();
    const paint = { count: 0, durationMs: 0 };
    cdp.on('Tracing.dataCollected', ({ value }) => {
      for (const event of value) {
        if (event.name !== 'Paint') continue;
        paint.count++;
        paint.durationMs += Number(event.dur ?? 0) / 1000;
      }
    });
    const tracingFinished = new Promise<void>((resolve) =>
      cdp.once('Tracing.tracingComplete', () => resolve()),
    );
    await cdp.send('Tracing.start', {
      categories: 'devtools.timeline',
      transferMode: 'ReportEvents',
    });
    const additionalFlowRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/flow/'))
        additionalFlowRequests.push(request.url());
    });
    const positions = Array.from(
      { length: 30 },
      (_, index) => sourcePositions[index % sourcePositions.length]! + 1,
    );
    const durations = await page.evaluate(async (values) => {
      const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
      const samples: number[] = [];
      for (const position of values) {
        const start = performance.now();
        timeline.value = String(position);
        timeline.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        samples.push(performance.now() - start);
      }
      return samples.sort((left, right) => left - right);
    }, positions);
    await cdp.send('Tracing.end');
    await tracingFinished;
    await cdp.send('HeapProfiler.collectGarbage');
    const heapAfter = await metric();
    const p95 = durations[Math.floor(durations.length * 0.95)]!;
    console.log(
      `recorded order application: ${events.length} events, ${entries.length} observed entries, ` +
        `paint ${paint.count}/${paint.durationMs.toFixed(1)}ms, ` +
        `seek p95=${p95.toFixed(1)}ms, ` +
        `heap ${Math.round(heapBefore / 1024 / 1024)}→${Math.round(heapAfter / 1024 / 1024)} MiB`,
    );
    expect(p95).toBeLessThan(1_000);
    expect(paint.count).toBeGreaterThan(0);
    expect(heapAfter).toBeGreaterThan(0);
    expect(await page.locator('body *').count()).toBeLessThan(10_000);
    expect(additionalFlowRequests).toEqual([]);
    await expect(page.locator('#source')).toHaveText('orders.py');
    await expect(page.locator('#snippet .executing-line')).toHaveCount(1);
    await expect(page.locator('#progress')).toHaveText(
      `${positions.at(-1)} / ${events.length}`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  } finally {
    recorder.close();
    await runtime.close();
  }
});

test('growing application object graphs report budget-limited evidence without inventing completion', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const runtime = await startRuntime({ ...readConfig({}), port: 0 });
  const recorder = new RecordingService(
    runtime.store,
    runtime.baseUrl,
    realpath,
  );
  try {
    const started = await recorder.run({
      action: 'start',
      language: 'python',
      projectRoot: fileURLToPath(
        new URL('../fixtures/runtime/order_workflow/', import.meta.url),
      ),
      entry: 'main.py',
      args: ['450'],
      maxEvents: 60_000,
      maxTraceBytes: 64 * 1024 * 1024,
      timeoutMs: 120_000,
    });
    let result = started;
    await expect
      .poll(
        async () => {
          result = await recorder.run({
            action: 'status',
            jobId: started.jobId,
          });
          if (result.status === 'failed') throw new Error(result.error);
          return result.status;
        },
        { timeout: 140_000 },
      )
      .toBe('ready');
    expect(result.complete).toBe(false);
    expect(result.stopReason).toBe('Trace byte budget exceeded');
    expect(result.diagnostics).toContain('Trace byte budget exceeded');
    expect(result.eventCount).toBeGreaterThan(10_000);
    expect(result.chunks).toBeGreaterThan(3);

    await page.goto(result.url!);
    await expect(page.locator('#evidence-mode')).toHaveText(
      'Recorded execution',
    );
    let loaded = Number(await page.locator('#timeline').getAttribute('max'));
    while (loaded < result.eventCount) {
      await page.locator('#timeline').fill(String(loaded));
      await page.locator('#next').click();
      await expect
        .poll(() => page.locator('#timeline').getAttribute('max'))
        .not.toBe(String(loaded));
      loaded = Number(await page.locator('#timeline').getAttribute('max'));
    }
    expect(loaded).toBe(result.eventCount);
    await page.locator('#timeline').fill(String(loaded));
    await expect(page.locator('#progress')).toHaveText(
      `${result.eventCount} / ${result.eventCount}`,
    );
    await expect(page.locator('#console-output')).not.toContainText('settled');
    await page.locator('#previous').click();
    await expect(page.locator('#progress')).toHaveText(
      `${result.eventCount - 1} / ${result.eventCount}`,
    );
  } finally {
    recorder.close();
    await runtime.close();
  }
});
