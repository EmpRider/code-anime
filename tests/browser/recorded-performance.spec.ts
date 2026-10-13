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
  // Nested disclosure performs actual browser scrolling and layout across
  // 47 frames. Leave headroom on shared Linux CI runners while measuring
  // seeking against the separate strict latency budget below.
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
    await test.step('load the recorded session', async () => {
      await page.goto(result.url!);
      await expect(page.locator('#evidence-mode')).toHaveText(
        'Recorded execution',
      );
    });

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
      await test.step(`expand recorded invocation ${child.callId}`, async () => {
        const nested = details.locator(
          `details[data-invocation="${child.callId}"]`,
        );
        // Deep nesting must also work for keyboard users. Keyboard activation
        // avoids expensive pointer scrolling/retries for each of 46 levels.
        await nested.locator(':scope > summary').press('Enter');
        await expect(nested).toHaveAttribute('open', '');
      });
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

test('recorded high-volume calls and console history keep painted replay bounded', async ({
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
        new URL('../fixtures/runtime/', import.meta.url),
      ),
      entry: 'performance_stress_main.py',
      maxEvents: 50_000,
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
    expect(result.complete).toBe(true);
    expect(result.eventCount).toBeGreaterThan(8_500);
    expect(result.chunks).toBeGreaterThan(3);

    const events: TraceEvent[] = [];
    let session = await runtime.store.get(result.sessionId!);
    while (session) {
      events.push(...session.flow.trace!.events);
      session = await runtime.store.next(session.id);
    }
    expect(events).toHaveLength(result.eventCount);
    const processCalls = events.filter(
      (event) => event.kind === 'enter' && event.symbolId.endsWith('process'),
    );
    const calculateCalls = events.filter(
      (event) => event.kind === 'enter' && event.symbolId.endsWith('calculate'),
    );
    const consoleEvents = events.filter((event) => event.kind === 'console');
    expect(processCalls).toHaveLength(480);
    expect(calculateCalls).toHaveLength(480);
    expect(consoleEvents.length).toBeGreaterThanOrEqual(480);
    expect(events.every((event) => event.certainty === 'observed')).toBe(true);
    expect(
      events.find(
        (event) =>
          event.kind === 'console' && event.output?.includes('complete'),
      )?.output,
    ).toContain('complete 346800');

    await page.setViewportSize({ width: 1440, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
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
    await expect(page.locator('#console-output')).toContainText('item 479:');
    await page.locator('#console-panel > summary').click();
    await expect(page.locator('#console-history')).toBeVisible();
    while (await page.locator('#console-older').isEnabled())
      await page.locator('#console-older').click();
    await expect(page.locator('#console-output')).toContainText('item 0:');
    while (await page.locator('#console-newer').isEnabled())
      await page.locator('#console-newer').click();
    await expect(page.locator('#console-output')).toContainText('item 479:');
    await expect(page.locator('#progress')).toHaveText(
      `${loaded} / ${result.eventCount}`,
    );

    // A recorded worker is invoked hundreds of times. Inspecting one exact
    // invocation must not materialize every invocation's source/step tree.
    await page.locator('#view-mode').selectOption('map');
    await page
      .getByRole('button', {
        name: `Inspect method ${processCalls[0]!.symbolId}`,
      })
      .click();
    const invocationSelector = page.locator(
      '#method-details .method-invocation-label select',
    );
    await expect(invocationSelector.locator('option')).toHaveCount(480);
    await invocationSelector.selectOption(processCalls.at(-1)!.callId);
    const selected = page.locator(
      `#method-details details[data-invocation="${processCalls.at(-1)!.callId}"]`,
    );
    await expect(selected).toBeVisible();
    const summary = selected.locator(':scope > summary');
    for (let i = 0; i < 8; i++) {
      await summary.press('Enter');
      if (i % 2) await expect(selected).toHaveAttribute('open', '');
      else await expect(selected).not.toHaveAttribute('open', '');
    }
    await expect(page.locator('#progress')).toHaveText(
      `${loaded} / ${result.eventCount}`,
    );

    await page.locator('#view-mode').selectOption('path');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('HeapProfiler.enable');
    const metrics = async () => {
      const { metrics: items } = await cdp.send('Performance.getMetrics');
      return Object.fromEntries(
        items.map((metric: { name: string; value: number }) => [
          metric.name,
          metric.value,
        ]),
      ) as Record<string, number>;
    };
    // Detached nodes can remain in the browser's heap until a normal GC cycle.
    // Compare live retained nodes after collection, not incidental GC timing.
    await cdp.send('HeapProfiler.collectGarbage');
    const before = await metrics();
    const initialDom = await cdp.send('Memory.getDOMCounters');
    const paint = { count: 0, durationMs: 0 };
    cdp.on('Tracing.dataCollected', ({ value }) => {
      for (const event of value) {
        if (event.name !== 'Paint') continue;
        paint.count++;
        paint.durationMs += Number(event.dur ?? 0) / 1000;
      }
    });
    const finishedTracing = new Promise<void>((resolve) =>
      cdp.once('Tracing.tracingComplete', () => resolve()),
    );
    await cdp.send('Tracing.start', {
      categories: 'devtools.timeline',
      transferMode: 'ReportEvents',
    });
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/flow/')) requests.push(request.url());
    });
    const positions = Array.from({ length: 36 }, (_, i) =>
      i % 2 === 0 ? 200 + i * 31 : loaded - 200 - i * 29,
    );
    const samples = await page.evaluate(async (values) => {
      const input = document.querySelector<HTMLInputElement>('#timeline')!;
      const durations: number[] = [];
      for (const value of values) {
        const start = performance.now();
        input.value = String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        durations.push(performance.now() - start);
      }
      return durations.sort((a, b) => a - b);
    }, positions);
    await cdp.send('Tracing.end');
    await finishedTracing;
    await cdp.send('HeapProfiler.collectGarbage');
    const after = await metrics();
    const finalDom = await cdp.send('Memory.getDOMCounters');
    const p95 = samples[Math.floor(samples.length * 0.95)]!;
    const layoutBefore = before.LayoutCount ?? 0;
    const layoutAfter = after.LayoutCount ?? 0;
    const heapBefore = before.JSHeapUsedSize ?? 0;
    const heapAfter = after.JSHeapUsedSize ?? 0;
    console.log(
      `recorded stress: ${events.length} events, ${processCalls.length + calculateCalls.length} worker calls, ` +
        `${consoleEvents.length} console events, seek p95=${p95.toFixed(1)}ms, ` +
        `paint ${paint.count} events/${paint.durationMs.toFixed(1)}ms, ` +
        `layout +${(layoutAfter - layoutBefore).toFixed(0)}, ` +
        `heap ${Math.round(heapBefore / 1024 / 1024)}→${Math.round(heapAfter / 1024 / 1024)} MiB, ` +
        `DOM nodes ${initialDom.nodes}→${finalDom.nodes}`,
    );
    expect(p95).toBeLessThan(800);
    expect(paint.count).toBeGreaterThan(0);
    expect(layoutAfter).toBeGreaterThanOrEqual(layoutBefore);
    expect(finalDom.nodes).toBeLessThan(initialDom.nodes + 3000);
    expect(await page.locator('body *').count()).toBeLessThan(10_000);
    await expect(page.locator('#progress')).toHaveText(
      `${positions.at(-1)} / ${result.eventCount}`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#progress')).toHaveText(
      `${positions.at(-1)} / ${result.eventCount}`,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    recorder.close();
    await runtime.close();
  }
});
