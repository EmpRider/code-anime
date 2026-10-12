import { expect, test } from '@playwright/test';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readConfig } from '../../src/config.js';
import { startRuntime } from '../../src/runtime.js';
import { RecordingService } from '../../src/services/recording-service.js';

test('large recorded Python call tree remains navigable after loading prepared continuations', async ({
  page,
}) => {
  test.setTimeout(150_000);
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
        new URL('../fixtures/runtime/', import.meta.url),
      ),
      entry: 'performance_main.py',
      maxEvents: 50_000,
      maxTraceBytes: 32 * 1024 * 1024,
      timeoutMs: 60_000,
    });
    let result = started;
    await expect
      .poll(
        async () => {
          result = await recorder.run({
            action: 'status',
            jobId: started.jobId,
          });
          return result.status;
        },
        { timeout: 70_000 },
      )
      .toBe('ready');
    expect(result.complete).toBe(true);
    expect(result.eventCount).toBeGreaterThan(2_000);
    expect(result.chunks).toBeGreaterThan(1);

    const symbols = new Set<string>();
    let observedCalls = 0;
    let cursor = await runtime.store.get(result.sessionId!);
    while (cursor) {
      for (const event of cursor.flow.trace!.events) {
        if (event.kind !== 'enter') continue;
        expect(event.certainty).toBe('observed');
        symbols.add(event.symbolId);
        observedCalls++;
      }
      cursor = await runtime.store.next(cursor.id);
    }
    expect(observedCalls).toBeGreaterThan(400);
    expect([...symbols].some((symbol) => symbol.includes('calculate'))).toBe(
      true,
    );
    expect([...symbols].some((symbol) => symbol.includes('process'))).toBe(
      true,
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(result.url!);
    await expect(page.locator('#evidence-mode')).toHaveText(
      'Recorded execution',
    );

    // Loading prepared chunks is allowed. Afterward, seeking and disclosure
    // must use the same in-browser replay data without additional requests.
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
    await expect(page.locator('#console-output')).toContainText(
      'complete 87000',
    );

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const metrics = async () => {
      const { metrics: items } = await cdp.send('Performance.getMetrics');
      return Object.fromEntries(
        items.map((metric: { name: string; value: number }) => [
          metric.name,
          metric.value,
        ]),
      ) as Record<string, number>;
    };
    const before = await metrics();
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/flow/')) requests.push(request.url());
    });
    const positions = Array.from({ length: 24 }, (_, index) =>
      index % 2 === 0 ? 100 + index * 13 : loaded - 100 - index * 17,
    );
    const samples = await page.evaluate(async (values) => {
      const input = document.querySelector<HTMLInputElement>('#timeline')!;
      const measurements: number[] = [];
      for (const value of values) {
        const start = performance.now();
        input.value = String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        // A single animation-frame callback executes before paint. Two
        // callbacks give the first updated frame an opportunity to paint.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        measurements.push(performance.now() - start);
      }
      return measurements.sort((a, b) => a - b);
    }, positions);
    const after = await metrics();
    const p95 = samples[Math.floor(samples.length * 0.95)]!;
    const heapBefore = before.JSHeapUsedSize ?? NaN;
    const heapAfter = after.JSHeapUsedSize ?? NaN;
    const layoutBefore = before.LayoutCount ?? NaN;
    const layoutAfter = after.LayoutCount ?? NaN;
    console.log(
      `recorded performance: ${result.eventCount} events, ${observedCalls} observed calls, ` +
        `paint-inclusive seek p95=${p95.toFixed(1)}ms, ` +
        `JS heap ${Math.round(heapBefore / 1024 / 1024)}→${Math.round(heapAfter / 1024 / 1024)} MiB, ` +
        `layouts +${(layoutAfter - layoutBefore).toFixed(0)}`,
    );
    expect(p95).toBeLessThan(800);
    expect(heapAfter).toBeGreaterThan(0);
    expect(layoutAfter).toBeGreaterThanOrEqual(layoutBefore);
    expect(await page.locator('body *').count()).toBeLessThan(10_000);
    await expect(page.locator('#progress')).toHaveText(
      `${positions.at(-1)} / ${result.eventCount}`,
    );
    await page.locator('#previous').click();
    await expect(page.locator('#progress')).toHaveText(
      `${positions.at(-1)! - 1} / ${result.eventCount}`,
    );
    await page.locator('#next').click();
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    recorder.close();
    await runtime.close();
  }
});
