import { expect, test } from '@playwright/test';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readConfig } from '../../src/config.js';
import type { TraceEvent } from '../../src/domain/trace.js';
import { startRuntime } from '../../src/runtime.js';
import { RecordingService } from '../../src/services/recording-service.js';

test('wide and deeply recursive recorded Python calls remain navigable across prepared continuations', async ({
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
    const recordedEvents: TraceEvent[] = [];
    let observedCalls = 0;
    let cursor = await runtime.store.get(result.sessionId!);
    while (cursor) {
      for (const event of cursor.flow.trace!.events) {
        recordedEvents.push(event);
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
    const recursiveEntries = recordedEvents.filter(
      (event) =>
        event.kind === 'enter' && event.symbolId.includes('deep_chain'),
    );
    expect(recursiveEntries).toHaveLength(47);
    expect(new Set(recursiveEntries.map((event) => event.callId)).size).toBe(
      47,
    );
    for (let i = 1; i < recursiveEntries.length; i++)
      expect(recursiveEntries[i]!.parentCallId).toBe(
        recursiveEntries[i - 1]!.callId,
      );
    expect(
      recursiveEntries.at(-1)!.stack.length - recursiveEntries[0]!.stack.length,
    ).toBe(46);
    const recursiveRoot = recursiveEntries[0]!;
    const recursiveLeaf = recursiveEntries.at(-1)!;
    const recursiveRootIndex = recordedEvents.findIndex(
      (event) => event === recursiveRoot,
    );
    const rootReturn = recordedEvents.find(
      (event) =>
        event.kind === 'return' && event.callId === recursiveRoot.callId,
    );
    const leafReturn = recordedEvents.find(
      (event) =>
        event.kind === 'return' && event.callId === recursiveLeaf.callId,
    );
    expect(rootReturn?.result).toBe(46);
    expect(leafReturn?.result).toBe(0);

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
    await expect(page.locator('#console-output')).toContainText('depth 46');

    await page.locator('#timeline').fill(String(recursiveRootIndex + 1));
    await expect(page.locator('#source')).toHaveText('performance_workers.py');
    await expect(page.locator('#snippet')).toContainText(
      'return 1 + deep_chain(depth - 1)',
    );
    await page.locator('#view-mode').selectOption('map');
    await page
      .getByRole('button', { name: `Inspect method ${recursiveRoot.symbolId}` })
      .click();
    const details = page.locator('#method-details');
    const rootDetails = details.locator(
      `details[data-invocation="${recursiveRoot.callId}"]`,
    );
    await expect(rootDetails).toBeVisible();
    for (const child of recursiveEntries.slice(1)) {
      const nested = details.locator(
        `details[data-invocation="${child.callId}"]`,
      );
      await nested.locator(':scope > summary').click();
      await expect(nested).toHaveAttribute('open', '');
    }
    const leafDetails = details.locator(
      `details[data-invocation="${recursiveLeaf.callId}"]`,
    );
    await expect(leafDetails).toContainText('Return: 0');
    await expect(rootDetails).toContainText('Return: 46');
    const innerDetails = details.locator(
      `details[data-invocation="${recursiveEntries[10]!.callId}"]`,
    );
    await innerDetails.locator(':scope > summary').click();
    await expect(leafDetails).toBeHidden();
    await innerDetails.locator(':scope > summary').click();
    await expect(leafDetails).toBeVisible();
    await expect(page.locator('#progress')).toHaveText(
      `${recursiveRootIndex + 1} / ${result.eventCount}`,
    );
    await page.locator('#view-mode').selectOption('path');

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
        `two-frame seek p95=${p95.toFixed(1)}ms, ` +
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
