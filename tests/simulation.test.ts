import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { SimulationService } from '../src/services/simulation-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import type { TraceEvent } from '../src/domain/trace.js';

const code = `class Service {
 fun run(input: String, count: Int): String {
  val name = input.trim()
  val limit = minOf(count, 2)
  var output = ""
  for (i in 0 until limit) output += normalize(name)
  return if (output.isEmpty()) "empty" else output
 }
 fun normalize(name: String) = name.lowercase()
}`;

test('CodeGraph receipts gate full mock state, continuation and proposed comparison', async () => {
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessions: 20,
    maxSessionBytes: 1000000,
  });
  let requests = 0;
  const service = new SimulationService(
    store,
    'http://localhost:1',
    async (root) => root,
    async () => {
      requests++;
      return { text: code, files: 1, status: 'indexed' };
    },
  );
  try {
    const evidence = await service.read({
      projectRoot: '/project',
      tool: 'node',
      arguments: { symbol: 'Service.run' },
      limit: 100,
    });
    let source = evidence.text;
    let offset = evidence.nextOffset;
    while (offset !== null) {
      const page = await service.read({
        projectRoot: '/project',
        evidenceId: evidence.evidenceId,
        offset,
        limit: 100,
      });
      source += page.text;
      offset = page.nextOffset;
    }
    assert.equal(source, code);
    assert.equal(requests, 1, 'paging must preserve one provider snapshot');
    const event = (id: string, overrides: Partial<TraceEvent>): TraceEvent => ({
      id,
      kind: 'enter',
      symbolId: 'Service.run',
      label: id,
      callId: 'run-1',
      evidenceIds: [evidence.evidenceId],
      source: { file: 'Service.kt', line: 3, endLine: 3 },
      values: {},
      locals: { input: '  ALICE  ', count: 2 },
      stack: ['run-1'],
      certainty: 'mock',
      ...overrides,
    });
    const events: TraceEvent[] = [
      event('trim', {
        kind: 'transform',
        inputs: { receiver: '  ALICE  ' },
        result: 'ALICE',
        before: { result: null },
        after: { result: 'ALICE' },
      }),
      event('assign', {
        kind: 'assign',
        before: { name: null },
        after: { name: 'ALICE' },
        locals: { name: 'ALICE', count: 2 },
      }),
      event('min', {
        kind: 'transform',
        inputs: { a: 2, b: 2 },
        result: 2,
        before: { limit: null },
        after: { limit: 2 },
      }),
      event('loop-0', {
        kind: 'loop',
        values: { iteration: 0 },
        locals: { i: 0, name: 'ALICE', output: '' },
      }),
      event('call-1', {
        kind: 'call',
        callId: 'normalize-1',
        parentCallId: 'run-1',
        symbolId: 'Service.normalize',
        inputs: { name: 'ALICE' },
        stack: ['run-1', 'normalize-1'],
      }),
      event('return-1', {
        kind: 'return',
        callId: 'normalize-1',
        parentCallId: 'run-1',
        result: 'alice',
        stack: ['run-1'],
      }),
      event('update-1', {
        kind: 'mutate',
        objectId: 'output-1',
        before: { text: '' },
        after: { text: 'alice' },
        locals: { output: 'alice', i: 0 },
      }),
      event('loop-1', {
        kind: 'loop',
        values: { iteration: 1 },
        locals: { i: 1, name: 'ALICE', output: 'alice' },
      }),
      event('call-2', {
        kind: 'call',
        callId: 'normalize-2',
        parentCallId: 'run-1',
        symbolId: 'Service.normalize',
        inputs: { name: 'ALICE' },
        stack: ['run-1', 'normalize-2'],
      }),
      event('return-2', {
        kind: 'return',
        callId: 'normalize-2',
        parentCallId: 'run-1',
        result: 'alice',
        stack: ['run-1'],
      }),
      event('update-2', {
        kind: 'mutate',
        objectId: 'output-1',
        before: { text: 'alice' },
        after: { text: 'alicealice' },
        locals: { output: 'alicealice', i: 1 },
        origins: { text: 'normalize-1 + normalize-2' },
      }),
      event('branch', {
        kind: 'branch',
        values: { condition: 'output.isEmpty()', result: false },
        locals: { output: 'alicealice' },
      }),
      event('return', {
        kind: 'return',
        result: 'alicealice',
        locals: { output: 'alicealice' },
        stack: [],
      }),
    ];
    const payload = {
      projectRoot: '/project',
      endpoint: 'Service.run',
      scenario: { input: '  ALICE  ', count: 2 },
      evidenceIds: [evidence.evidenceId],
      events,
      coverage: 'trim, min, two helper invocations and return',
    };
    await assert.rejects(
      service.submit({ ...payload, evidenceIds: [randomUUID()] }),
      /CodeGraph evidence is required/,
    );
    await assert.rejects(
      service.submit({ ...payload, projectRoot: '/other' }),
      /CodeGraph evidence is required/,
    );
    await assert.rejects(
      service.submit({ ...payload, events: [events[0], events[0]] }),
      /Duplicate event/,
    );
    await assert.rejects(
      service.submit({
        ...payload,
        events: [{ ...events[0], before: undefined }],
      }),
      /before and after/,
    );
    const first = await service.submit({
      ...payload,
      events: events.slice(0, 7),
      complete: false,
    });
    const last = await service.submit({
      ...payload,
      events: events.slice(7),
      continuationOf: first.sessionId,
    });
    assert.equal(last.url, first.url);
    const flow = (await store.get(last.sessionId))!.flow;
    assert.equal(flow.trace!.events.at(-1)?.result, 'alicealice');
    assert.equal(flow.trace!.simulation?.previousSessionId, first.sessionId);
    assert.equal(flow.steps[3]?.dtoFields.text, 'alicealice');
    await assert.rejects(
      service.submit({
        ...payload,
        events: [events[0]],
        continuationOf: first.sessionId,
      }),
      /event IDs/,
    );
    const full = await service.submit(payload);
    const proposal = await service.submit({
      ...payload,
      baselineSessionId: full.sessionId,
      events: [
        event('proposed-return', {
          kind: 'return',
          result: 'ALICEALICE',
          certainty: 'proposed',
          stack: [],
        }),
      ],
      coverage: 'Proposed uppercase output',
    });
    assert.equal(
      (await store.get(proposal.sessionId))!.flow.baselineTrace?.events.at(-1)
        ?.result,
      'alicealice',
    );
    const alternative = await service.submit({
      ...payload,
      scenario: { input: '  ALICE  ', count: 0 },
      events: [
        event('empty-branch', {
          kind: 'branch',
          values: { condition: 'output.isEmpty()', result: true },
          locals: { output: '' },
        }),
        event('empty-return', {
          kind: 'return',
          result: 'empty',
          stack: [],
          locals: { output: '' },
        }),
      ],
    });
    assert.equal(
      (await store.get(alternative.sessionId))!.flow.trace!.events.at(-1)
        ?.result,
      'empty',
    );
    assert.equal(
      (await store.get(full.sessionId))!.flow.trace!.events.at(-1)?.result,
      'alicealice',
    );
  } finally {
    service.close();
    await store.close();
  }
});

test('missing CodeGraph blocks evidence retrieval and creates no animation', async () => {
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessions: 2,
    maxSessionBytes: 1000000,
  });
  const service = new SimulationService(
    store,
    'http://localhost',
    async (root) => root,
    async () => {
      throw new Error('CodeGraph is required; installation missing');
    },
  );
  try {
    await assert.rejects(
      service.read({ projectRoot: '/project', arguments: { query: 'login' } }),
      /CodeGraph is required/,
    );
    assert.deepEqual(await store.list(), []);
  } finally {
    service.close();
    await store.close();
  }
});
