import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { SimulationService } from '../src/services/simulation-service.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import type { TraceEvent } from '../src/domain/trace.js';

async function fixture(
  evidenceText: string | ((args: Record<string, unknown>) => string),
) {
  const projectRoot = await mkdtemp(
    join(tmpdir(), 'code-anime-mock-coverage-'),
  );
  await writeFile(join(projectRoot, 'Service.kt'), 'fun run() = 1\n');
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessions: 12,
    maxSessionBytes: 1000000,
  });
  const service = new SimulationService(
    store,
    'http://localhost:3456',
    async (root) => root,
    async (_root, _tool, args) => ({
      text:
        typeof evidenceText === 'function' ? evidenceText(args) : evidenceText,
      files: 1,
      status: 'indexed',
    }),
  );
  const receipt = await service.read({
    projectRoot,
    tool: 'node',
    arguments: { symbol: 'Service.run' },
    limit: 100,
  });
  const event = (id: string, unresolved = false): TraceEvent => ({
    id,
    kind: unresolved ? ('unresolved' as const) : ('statement' as const),
    label: id,
    symbolId: 'Service.run',
    callId: 'mock-1',
    source: { file: 'Service.kt', line: 1, endLine: 1 },
    evidenceIds: [receipt.evidenceId],
    values: {},
    locals: { simulatedResult: 1 },
    stack: ['mock-1'],
    certainty: unresolved ? ('unresolved' as const) : ('mock' as const),
  });
  const payload = (events: ReturnType<typeof event>[], complete: boolean) => ({
    projectRoot,
    endpoint: 'Service.run',
    evidenceIds: [receipt.evidenceId],
    scenario: { input: 1 },
    events,
    coverage: 'Static source and a clearly simulated scenario',
    complete,
  });
  return {
    store,
    service,
    projectRoot,
    receipt,
    event,
    payload,
    close: async () => {
      service.close();
      await store.close();
      await rm(projectRoot, { recursive: true, force: true });
    },
  };
}

test('fully read CodeGraph evidence cannot certify a provider-truncated graph', async () => {
  const c = await fixture('**Callees**\nShowing 100 of 240 relationships\n');
  try {
    assert.equal(c.receipt.nextUnreadOffset, null);
    assert.equal(c.receipt.providerTruncated, true);
    assert.match(c.receipt.providerBoundary!, /Showing 100 of 240/);
    await assert.rejects(
      c.service.submit(c.payload([c.event('truncated')], true)),
      /incomplete provider results.*Showing 100 of 240/,
    );
    const partial = await c.service.submit(
      c.payload([c.event('partial')], false),
    );
    const trace = (await c.store.get(partial.sessionId))!.flow.trace!;
    assert.equal(trace.simulation?.complete, false);
    assert.equal(
      trace.simulation?.coverageAssessment?.status,
      'provider-truncated',
    );
    assert.match(
      trace.simulation?.coverageAssessment?.reasons.join(' ') ?? '',
      /Showing 100 of 240/,
    );
    assert.match(
      trace.diagnostics.join(' '),
      /relationship coverage is incomplete/,
    );
  } finally {
    await c.close();
  }
});

test('MCP callee receipts reject complete counts with missing or duplicated edges', async () => {
  const c = await fixture((args) =>
    'limit' in args
      ? 'Showing 3 of 3 relationships\n- helper (method) - Service.kt:1\n- helper (method) - Service.kt:1'
      : '**Service.run** (method)\n**Location:** Service.kt:1\n',
  );
  try {
    const callees = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { symbol: 'Service.run', limit: 10 },
    });
    assert.equal(callees.providerTruncated, true);
    assert.match(
      callees.providerBoundary!,
      /3 callee relationships.*1 distinct/,
    );
    await assert.rejects(
      c.service.submit({
        ...c.payload([c.event('known')], true),
        evidenceIds: [c.receipt.evidenceId, callees.evidenceId],
      }),
      /incomplete provider results.*3 callee relationships/,
    );
  } finally {
    await c.close();
  }
});

test('mixed-definition CodeGraph callee receipts cannot silently certify source coverage', async () => {
  const c = await fixture((args) =>
    'limit' in args
      ? 'Found 2 distinct definitions\n**Service.run** (method) — Service.kt:1\nShowing 1 of 1 relationships\n- helper (method) - Service.kt:1'
      : '**Service.run** (method)\n**Location:** Service.kt:1\n',
  );
  try {
    const callees = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { symbol: 'Service.run', limit: 10 },
    });
    assert.equal(callees.providerTruncated, true);
    assert.match(callees.providerBoundary!, /multiple definitions/);
  } finally {
    await c.close();
  }
});

test('CodeGraph snippets containing callee metadata words do not fabricate a coverage boundary', async () => {
  const c = await fixture((args) =>
    'limit' in args
      ? 'Showing 1 of 1 relationships\n- helper (method) - Service.kt:1\n```kotlin\n// Found 2 distinct definitions\n// - fake (method) - Service.kt:1\n```'
      : '**Service.run** (method)\n**Location:** Service.kt:1\n',
  );
  try {
    const callees = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { symbol: 'Service.run', limit: 10 },
    });
    assert.equal(callees.providerTruncated, false);
  } finally {
    await c.close();
  }
});

test('CodeGraph truncation can be resolved with a fuller replacement receipt', async () => {
  const c = await fixture((args) =>
    args.limit === 500
      ? '**Callees**\nShowing 240 of 240 relationships\n'
      : '**Callees**\nShowing 100 of 240 relationships\n',
  );
  try {
    const fuller = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'node',
      arguments: { symbol: 'Service.run', limit: 500 },
    });
    assert.equal(fuller.providerTruncated, false);
    assert.equal(fuller.nextUnreadOffset, null);
    const result = await c.service.submit({
      ...c.payload([c.event('rechecked')], true),
      evidenceIds: [fuller.evidenceId],
      events: [{ ...c.event('rechecked'), evidenceIds: [fuller.evidenceId] }],
    });
    assert.equal(result.complete, true);
  } finally {
    await c.close();
  }
});

test('source code containing provider-like words does not assert truncation', async () => {
  const c = await fixture(
    '**Service.run** (method)\n```kotlin\n// Showing 100 of 240\nval message = "truncated"\n```\n',
  );
  try {
    assert.equal(c.receipt.providerTruncated, false);
    const result = await c.service.submit(
      c.payload([c.event('fenced-source')], true),
    );
    assert.equal(result.complete, true);
    assert.equal(result.coverageAssessment.status, 'unknown');
    assert.match(
      result.coverageAssessment.reasons.join(' '),
      /cannot prove exhaustive source or relationship discovery/,
    );
  } finally {
    await c.close();
  }
});

test('a partial mock scenario is distinct from unresolved behavior and exhaustive coverage', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n',
  );
  try {
    const partial = await c.service.submit(
      c.payload([c.event('known-step')], false),
    );
    assert.equal(partial.coverageAssessment.status, 'partial');
    const unknown = await c.service.submit(
      c.payload([c.event('unknown-step', true)], false),
    );
    assert.equal(unknown.coverageAssessment.status, 'unresolved');
    const stored = (await c.store.get(unknown.sessionId))!.flow.trace!;
    assert.equal(stored.simulation?.coverageAssessment?.status, 'unresolved');
    assert.match(
      stored.simulation?.coverageAssessment?.reasons.join(' ') ?? '',
      /unknown-step/,
    );
  } finally {
    await c.close();
  }
});

test('reading an outstanding CodeGraph page clears stale coverage uncertainty on continuation', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n' + 'x'.repeat(180),
  );
  try {
    assert.equal(c.receipt.nextOffset, 100);
    const first = await c.service.submit(
      c.payload([c.event('before-page-read')], false),
    );
    assert.equal(first.coverageAssessment.status, 'unresolved');
    const nextPage = await c.service.read({
      projectRoot: c.projectRoot,
      evidenceId: c.receipt.evidenceId,
      offset: 100,
    });
    assert.equal(nextPage.nextUnreadOffset, null);
    const last = await c.service.submit({
      ...c.payload(
        [
          {
            ...c.event('after-page-read'),
            kind: 'return',
            stack: [],
          },
        ],
        true,
      ),
      continuationOf: first.sessionId,
    });
    assert.equal(last.complete, true);
    assert.equal(last.coverageAssessment.status, 'unknown');
  } finally {
    await c.close();
  }
});

test('structured CodeGraph node locations reject unrelated source provenance for a complete mock flow', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n```kotlin\nfun run() = 1\n```\n',
  );
  try {
    await writeFile(join(c.projectRoot, 'Other.kt'), 'fun unrelated() = 2\n');
    assert.deepEqual(c.receipt.nodeSourceFiles, ['Service.kt']);
    const unrelated = {
      ...c.event('unrelated'),
      source: { file: 'Other.kt', line: 1, endLine: 1 },
    };
    await assert.rejects(
      c.service.submit(c.payload([unrelated], true)),
      /node evidence for another file, not Other.kt/,
    );
    const partial = await c.service.submit(c.payload([unrelated], false));
    const trace = (await c.store.get(partial.sessionId))!.flow.trace!;
    assert.equal(trace.simulation?.complete, false);
    assert.match(trace.diagnostics.join(' '), /node evidence for another file/);
    assert.equal(trace.simulation?.provenanceIssues?.length, 1);

    // A later valid chunk cannot retroactively make the earlier claim true.
    await assert.rejects(
      c.service.submit({
        ...c.payload([c.event('later-valid')], true),
        continuationOf: partial.sessionId,
      }),
      /earlier continuation has unverified CodeGraph source provenance/,
    );
  } finally {
    await c.close();
  }
});

test('method entry cannot borrow a different CodeGraph definition in the same file', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n```kotlin\nfun run() = 1\n```\n',
  );
  try {
    const entry: TraceEvent = {
      ...c.event('unsupported-entry'),
      kind: 'enter',
      symbolId: 'Other.run',
      stack: ['mock-1'],
    };
    const exit: TraceEvent = {
      ...c.event('unsupported-return'),
      kind: 'return',
      symbolId: 'Other.run',
      stack: [],
    };
    await assert.rejects(
      c.service.submit(c.payload([entry, exit], true)),
      /no matching CodeGraph method definition/,
    );
    const partial = await c.service.submit(c.payload([entry, exit], false));
    const trace = (await c.store.get(partial.sessionId))!.flow.trace!;
    assert.equal(trace.simulation?.coverageAssessment?.status, 'unresolved');
    assert.match(
      trace.simulation?.provenanceIssues?.join(' ') ?? '',
      /no matching CodeGraph method definition/,
    );
  } finally {
    await c.close();
  }
});

test('node evidence covering the event source allows a clearly simulated flow', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n```kotlin\nfun run() = 1\n```\n',
  );
  try {
    const result = await c.service.submit(
      c.payload([c.event('node-grounded')], true),
    );
    assert.equal(result.complete, true);
  } finally {
    await c.close();
  }
});

test('entry events cannot borrow another definition in a mixed CodeGraph node response', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n' +
      '**Other.run** (method)\n**Location:** Other.kt:1\n',
  );
  try {
    await writeFile(join(c.projectRoot, 'Other.kt'), 'fun other() = 2\n');
    const mismatched = {
      ...c.event('wrong-definition'),
      kind: 'enter' as const,
      source: { file: 'Other.kt', line: 1, endLine: 1 },
    };
    await assert.rejects(
      c.service.submit(c.payload([mismatched], true)),
      /Entry event wrong-definition.*CodeGraph definition at another file/,
    );
    const partial = await c.service.submit(c.payload([mismatched], false));
    const trace = (await c.store.get(partial.sessionId))!.flow.trace!;
    assert.match(trace.simulation!.provenanceIssues![0]!, /another file/);
    await assert.rejects(
      c.service.submit({
        ...c.payload([c.event('subsequent')], true),
        continuationOf: partial.sessionId,
      }),
      /earlier continuation has unverified CodeGraph source provenance/,
    );
  } finally {
    await c.close();
  }
});

test('additional CodeGraph explore evidence cannot conceal contradictory method-entry provenance', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n' +
      '**Other.run** (method)\n**Location:** Other.kt:1\n',
  );
  try {
    await writeFile(join(c.projectRoot, 'Other.kt'), 'fun other() = 2\n');
    const explore = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'explore',
      arguments: { query: 'Service.run' },
    });
    const event = {
      ...c.event('mixed-receipts'),
      kind: 'enter' as const,
      source: { file: 'Other.kt', line: 1, endLine: 1 },
      evidenceIds: [c.receipt.evidenceId, explore.evidenceId],
    };
    const payload = {
      ...c.payload([event], true),
      evidenceIds: event.evidenceIds,
    };
    await assert.rejects(
      c.service.submit(payload),
      /Entry event mixed-receipts.*CodeGraph definition at another file/,
    );
    const partial = await c.service.submit({ ...payload, complete: false });
    const trace = (await c.store.get(partial.sessionId))!.flow.trace!;
    assert.match(trace.simulation!.provenanceIssues![0]!, /another file/);
  } finally {
    await c.close();
  }
});

test('entry cannot claim an original line before its matched CodeGraph definition', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:3\n',
  );
  try {
    await writeFile(
      join(c.projectRoot, 'Service.kt'),
      '// one\n// two\nfun run() = 1\n',
    );
    await assert.rejects(
      c.service.submit(
        c.payload(
          [
            {
              ...c.event('before-definition'),
              kind: 'enter',
              source: { file: 'Service.kt', line: 2, endLine: 2 },
            },
          ],
          true,
        ),
      ),
      /Entry event before-definition.*later declaration/,
    );
    const result = await c.service.submit(
      c.payload(
        [
          {
            ...c.event('at-definition'),
            kind: 'enter',
            source: { file: 'Service.kt', line: 3, endLine: 3 },
          },
          {
            ...c.event('return-after-definition'),
            kind: 'return',
            source: { file: 'Service.kt', line: 3, endLine: 3 },
            stack: [],
          },
        ],
        true,
      ),
    );
    assert.equal(result.complete, true);
  } finally {
    await c.close();
  }
});

test('a saturated CodeGraph callee limit cannot silently certify full coverage', async () => {
  const rows = [
    '- Helper.first (function) - Helpers.kt:5',
    '- Helper.second (function) - Helpers.kt:9',
    '- Helper.third (function) - Helpers.kt:15',
  ].join('\n');
  const c = await fixture(`**Callees of Service.run**\n${rows}\n`);
  try {
    await c.service.read({
      projectRoot: c.projectRoot,
      evidenceId: c.receipt.evidenceId,
      offset: 100,
      limit: 32000,
    });
    const limited = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { symbol: 'Service.run', limit: 3 },
    });
    assert.equal(limited.nextUnreadOffset, null);
    assert.equal(limited.providerTruncated, true);
    assert.match(limited.providerBoundary!, /requested callee limit 3/);
    await assert.rejects(
      c.service.submit({
        ...c.payload([c.event('limited')], true),
        evidenceIds: [c.receipt.evidenceId, limited.evidenceId],
      }),
      /incomplete provider results.*requested callee limit 3/,
    );

    // A larger provider request yielding fewer than the requested number of
    // relationships removes this particular uncertainty boundary.
    const expanded = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { symbol: 'Service.run', limit: 10 },
    });
    assert.equal(expanded.providerTruncated, false);
    const explicitlyComplete = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { symbol: 'Service.run', limit: 3, includeTotal: true },
    });
    // The fake provider does not honor includeTotal, so a saturated result
    // without a total must remain flagged independently of the request.
    assert.equal(explicitlyComplete.providerTruncated, true);
    const result = await c.service.submit({
      ...c.payload([c.event('expanded')], true),
      evidenceIds: [c.receipt.evidenceId, expanded.evidenceId],
    });
    assert.equal(result.complete, true);
  } finally {
    await c.close();
  }
});

test('an explicit complete CodeGraph relationship total is not a false limit boundary', async () => {
  const c = await fixture(
    '**Callees**\nShowing 3 of 3 relationships\n' +
      [
        '- One (function) - S.kt:2',
        '- Two (function) - S.kt:3',
        '- Three (function) - S.kt:4',
      ].join('\n'),
  );
  try {
    const receipt = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { limit: 3 },
    });
    assert.equal(receipt.providerTruncated, false);
  } finally {
    await c.close();
  }
});

test('callee evidence without an explicit limit must disclose its coverage uncertainty', async () => {
  const c = await fixture('**Callees**\n- Helper (function) - Helper.kt:3\n');
  try {
    const uncapped = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { symbol: 'Service.run' },
    });
    assert.equal(uncapped.providerTruncated, true);
    assert.match(
      uncapped.providerBoundary!,
      /no explicit positive relationship limit/,
    );
  } finally {
    await c.close();
  }
});

test('an explicitly empty CodeGraph callee result does not require a limit', async () => {
  const c = await fixture('No callees found\n');
  try {
    const receipt = await c.service.read({
      projectRoot: c.projectRoot,
      tool: 'callees',
      arguments: { symbol: 'Service.run' },
    });
    assert.equal(receipt.providerTruncated, false);
  } finally {
    await c.close();
  }
});

test('a complete mock flow requires every CodeGraph response page, including skipped gaps', async () => {
  const c = await fixture('source evidence '.repeat(19));
  try {
    assert.equal(c.receipt.nextUnreadOffset, 100);
    await assert.rejects(
      c.service.submit(c.payload([c.event('start')], true)),
      /unread pages beginning at offset 100/,
    );
    const partial = await c.service.submit(
      c.payload([c.event('partial')], false),
    );
    const incomplete = (await c.store.get(partial.sessionId))!.flow.trace!;
    assert.equal(incomplete.truncated, true);
    assert.match(incomplete.diagnostics.join(' '), /unread pages/);

    const lastPage = await c.service.read({
      projectRoot: c.projectRoot,
      evidenceId: c.receipt.evidenceId,
      offset: 200,
      limit: 200,
    });
    assert.equal(lastPage.nextUnreadOffset, 100);
    await assert.rejects(
      c.service.submit(c.payload([c.event('still-skipped')], true)),
      /unread pages beginning at offset 100/,
    );
    const middlePage = await c.service.read({
      projectRoot: c.projectRoot,
      evidenceId: c.receipt.evidenceId,
      offset: 100,
      limit: 100,
    });
    assert.equal(middlePage.nextUnreadOffset, null);
    const complete = await c.service.submit(
      c.payload([c.event('complete')], true),
    );
    assert.equal(complete.complete, true);
  } finally {
    await c.close();
  }
});

test('unresolved steps in any mock continuation prevent false completion', async () => {
  const c = await fixture('complete provider response');
  try {
    await assert.rejects(
      c.service.submit(c.payload([c.event('missing', true)], true)),
      /Unresolved simulated behavior cannot be marked complete/,
    );
    assert.deepEqual(await c.store.list(), []);
    const first = await c.service.submit(
      c.payload([c.event('missing', true)], false),
    );
    await assert.rejects(
      c.service.submit({
        ...c.payload([c.event('later')], true),
        continuationOf: first.sessionId,
      }),
      /earlier mock continuation contains unresolved behavior/,
    );
    const second = await c.service.submit({
      ...c.payload([c.event('later')], false),
      continuationOf: first.sessionId,
    });
    assert.equal(second.complete, false);
    assert.equal((await c.store.list()).length, 2);
  } finally {
    await c.close();
  }
});

test('legacy mock snapshots cannot claim complete source-grounded coverage', async () => {
  const c = await fixture('CodeGraph returned source evidence');
  try {
    const result = await c.service.submit({
      projectRoot: c.projectRoot,
      endpoint: 'Service.run',
      evidenceIds: [c.receipt.evidenceId],
      scenario: { input: 1 },
      steps: [
        {
          from: 'Service.run',
          to: 'Service.result',
          dtoName: 'Result',
          dtoFields: { value: 1 },
        },
      ],
      coverage: 'One mock result snapshot',
      complete: true,
    });
    const trace = (await c.store.get(result.sessionId))!.flow.trace!;
    assert.equal(result.complete, false);
    assert.equal(trace.simulation?.complete, false);
    assert.equal(trace.truncated, true);
    assert.match(
      trace.diagnostics.join(' '),
      /Incomplete coverage: legacy snapshot payload/,
    );
    assert.match(result.nextAction, /source-grounded events/);
  } finally {
    await c.close();
  }
});

test('missing original source requires an explicit incomplete mock coverage boundary', async () => {
  const c = await fixture('CodeGraph excerpt for a source unavailable locally');
  try {
    const simulated = {
      ...c.event('missing-source'),
      source: { file: 'Missing.kt', line: 1, endLine: 1 },
      snippet: 'fun run() = simulatedValue',
    };
    await assert.rejects(
      c.service.submit(c.payload([simulated], true)),
      /Cannot mark mock animation complete: original source unavailable for Missing.kt/,
    );
    assert.deepEqual(await c.store.list(), []);

    const partial = await c.service.submit(c.payload([simulated], false));
    const trace = (await c.store.get(partial.sessionId))!.flow.trace!;
    assert.equal(partial.complete, false);
    assert.equal(trace.truncated, true);
    assert.deepEqual(trace.sourceFiles, {});
    assert.match(
      trace.diagnostics.join(' '),
      /Source unavailable for Missing.kt/,
    );
    assert.equal(trace.events[0]?.snippet, simulated.snippet);
  } finally {
    await c.close();
  }
});

test('inherited object names cannot masquerade as original source files', async () => {
  const c = await fixture('CodeGraph excerpt for an unavailable source');
  try {
    const event = {
      ...c.event('missing-special-name'),
      source: { file: 'toString', line: 1, endLine: 1 },
    };
    await assert.rejects(
      c.service.submit(c.payload([event], true)),
      /original source unavailable for toString/,
    );
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('a real __proto__ source filename remains available in a persisted mock trace', async () => {
  const c = await fixture('CodeGraph source for a valid unusual filename');
  try {
    await writeFile(join(c.projectRoot, '__proto__'), 'fun proto() = 1\n');
    const event = {
      ...c.event('special-real-file'),
      source: { file: '__proto__', line: 1, endLine: 1 },
    };
    const result = await c.service.submit(c.payload([event], true));
    const stored = (await c.store.get(result.sessionId))!.flow.trace!;
    assert.equal(stored.simulation?.complete, true);
    assert.ok(Object.hasOwn(stored.sourceFiles ?? {}, '__proto__'));
    assert.equal(stored.sourceFiles?.['__proto__'], 'fun proto() = 1\n');
  } finally {
    await c.close();
  }
});

test('later chunks cannot declare complete coverage when an earlier chunk lacks original source', async () => {
  const c = await fixture('CodeGraph source and flow evidence');
  try {
    const missing = {
      ...c.event('missing-earlier-source'),
      source: { file: 'OtherModule.kt', line: 1, endLine: 1 },
      snippet: 'fun other() = mockValue',
    };
    const earlier = await c.service.submit(c.payload([missing], false));
    assert.equal(earlier.complete, false);
    await assert.rejects(
      c.service.submit({
        ...c.payload([c.event('final-step')], true),
        continuationOf: earlier.sessionId,
      }),
      /earlier continuation lacks original source for OtherModule.kt/,
    );
    assert.equal((await c.store.list()).length, 1);

    const later = await c.service.submit({
      ...c.payload([c.event('final-step')], false),
      continuationOf: earlier.sessionId,
    });
    assert.equal(later.complete, false);
    assert.equal((await c.store.list()).length, 2);
  } finally {
    await c.close();
  }
});

test('one-shot mock events reject invented stack transitions and parent relationships', async () => {
  const c = await fixture('CodeGraph source and flow evidence');
  try {
    const root = {
      ...c.event('enter-root'),
      kind: 'enter' as const,
      callId: 'root-1',
      stack: ['root-1'],
    };
    const child = {
      ...c.event('enter-child'),
      kind: 'enter' as const,
      callId: 'child-1',
      parentCallId: 'root-1',
      stack: ['root-1', 'child-1'],
    };
    await assert.rejects(
      c.service.submit(
        c.payload(
          [
            root,
            child,
            {
              ...c.event('skipped-return'),
              callId: 'root-1',
              stack: ['root-1'],
            },
          ],
          false,
        ),
      ),
      /skipped-return changes its stack without a call, return or throw/,
    );
    await assert.rejects(
      c.service.submit(
        c.payload([root, { ...child, parentCallId: 'invented-caller' }], false),
      ),
      /enter-child has an inconsistent parentCallId/,
    );
    await assert.rejects(
      c.service.submit(
        c.payload(
          [
            root,
            {
              ...c.event('unowned-call-site'),
              kind: 'call',
              callId: 'fake-call',
              stack: ['root-1'],
            },
          ],
          false,
        ),
      ),
      /unowned-call-site has an inconsistent call stack transition/,
    );
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});

test('continuation validates prior mock stack and prevents invocation ID reuse', async () => {
  const c = await fixture('CodeGraph source and flow evidence');
  try {
    const root: TraceEvent = {
      ...c.event('root-enter'),
      kind: 'enter',
      callId: 'root-1',
      stack: ['root-1'],
    };
    const first = await c.service.submit(c.payload([root], false));
    await assert.rejects(
      c.service.submit({
        ...c.payload(
          [
            {
              ...c.event('unmatched-child'),
              kind: 'statement',
              callId: 'child-1',
              stack: ['root-1', 'child-1'],
            },
          ],
          false,
        ),
        continuationOf: first.sessionId,
      }),
      /unmatched-child changes its stack without a call, return or throw/,
    );
    const finished = await c.service.submit({
      ...c.payload(
        [
          {
            ...c.event('root-return'),
            kind: 'return',
            callId: 'root-1',
            stack: [],
          },
        ],
        true,
      ),
      continuationOf: first.sessionId,
    });
    assert.equal(finished.complete, true);
    const closedPartial = await c.service.submit(
      c.payload(
        [
          root,
          {
            ...c.event('closed-partial-root'),
            kind: 'return',
            callId: 'root-1',
            stack: [],
          },
        ],
        false,
      ),
    );
    await assert.rejects(
      c.service.submit({
        ...c.payload(
          [
            {
              ...c.event('repeated-root'),
              kind: 'enter',
              callId: 'root-1',
              stack: ['root-1'],
            },
          ],
          false,
        ),
        continuationOf: closedPartial.sessionId,
      }),
      /repeated-root reuses invocation ID root-1/,
    );
    assert.equal((await c.store.list()).length, 3);
  } finally {
    await c.close();
  }
});

test('completed one-shot mock flows must close every explicitly opened root invocation', async () => {
  const c = await fixture('CodeGraph source and flow evidence');
  try {
    const enter = {
      ...c.event('open-root'),
      kind: 'enter' as const,
    };
    await assert.rejects(
      c.service.submit(c.payload([enter], true)),
      /Completed mock animation retains active invocations: mock-1/,
    );
    const partial = await c.service.submit(c.payload([enter], false));
    assert.equal(partial.complete, false);
    const closed = await c.service.submit({
      ...c.payload(
        [{ ...c.event('close-root'), kind: 'return' as const, stack: [] }],
        true,
      ),
      continuationOf: partial.sessionId,
    });
    assert.equal(closed.complete, true);
  } finally {
    await c.close();
  }
});

test('complete proposals require original source and matching CodeGraph provenance', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n',
  );
  try {
    await assert.rejects(
      c.service.submit(
        c.payload(
          [
            {
              ...c.event('unlocated-proposal'),
              certainty: 'proposed',
              source: undefined,
            },
          ],
          true,
        ),
      ),
      /unlocated-proposal needs its source\/call-site location/,
    );
    await writeFile(join(c.projectRoot, 'Other.kt'), 'fun other() = 2\n');
    await assert.rejects(
      c.service.submit(
        c.payload(
          [
            {
              ...c.event('misattributed-proposal'),
              certainty: 'proposed',
              source: { file: 'Other.kt', line: 1, endLine: 1 },
            },
          ],
          true,
        ),
      ),
      /misattributed-proposal cites CodeGraph node evidence for another file/,
    );
    const partial = await c.service.submit(
      c.payload(
        [
          {
            ...c.event('unlocated-partial-proposal'),
            certainty: 'proposed',
            source: undefined,
          },
        ],
        false,
      ),
    );
    assert.equal(partial.complete, false);
    await assert.rejects(
      c.service.submit({
        ...c.payload([c.event('later-sourced-proposal')], true),
        continuationOf: partial.sessionId,
      }),
      /earlier event unlocated-partial-proposal lacks a source\/call-site location/,
    );
  } finally {
    await c.close();
  }
});

test('one-shot mock groups accept existing local IDs and survive session storage without changing events', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n',
  );
  try {
    const event = c.event('one-shot-event');
    const group = {
      id: 'one-shot-decision',
      kind: 'decision',
      title: 'Mock decision',
      callId: 'mock-1',
      memberEventIds: [event.id],
      source: event.source,
      evidenceIds: [c.receipt.evidenceId],
      certainty: 'assumed',
    };
    const result = await c.service.submit({
      ...c.payload([event], true),
      semanticGroups: [group],
    });
    const trace = (await c.store.get(result.sessionId))!.flow.trace!;
    assert.deepEqual(trace.events, [event]);
    assert.deepEqual(trace.semanticGroups, [group]);
    await assert.rejects(
      c.service.submit({
        ...c.payload([{ ...event, id: 'bad-member-event' }], true),
        semanticGroups: [group],
      }),
      /Unknown local member event ID|semanticGroups/i,
    );
    assert.equal((await c.store.list()).length, 1);
  } finally {
    await c.close();
  }
});

test('one-shot continuation rejects changed group identity and unsupplied source receipts', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n',
  );
  try {
    const firstEvent = c.event('first-event');
    const group = {
      id: 'stable-group',
      kind: 'decision',
      title: 'Mock decision',
      callId: 'mock-1',
      memberEventIds: [firstEvent.id],
      source: firstEvent.source,
      evidenceIds: [c.receipt.evidenceId],
      certainty: 'assumed',
    };
    await assert.rejects(
      c.service.submit({
        ...c.payload([firstEvent], false),
        semanticGroups: [{ ...group, evidenceIds: [randomUUID()] }],
      }),
      /unsupplied CodeGraph evidence receipt/,
    );
    const first = await c.service.submit({
      ...c.payload([firstEvent], false),
      semanticGroups: [group],
    });
    const later = c.event('later-event');
    const next = {
      ...c.payload([later], true),
      continuationOf: first.sessionId,
      semanticGroups: [{ ...group, memberEventIds: [later.id] }],
    };
    await assert.rejects(
      c.service.submit({
        ...next,
        semanticGroups: [
          {
            ...group,
            memberEventIds: [later.id],
            title: 'Contradictory title',
          },
        ],
      }),
      /Continuation changes semantic group definition stable-group/,
    );
    const result = await c.service.submit(next);
    const trace = (await c.store.get(result.sessionId))!.flow.trace!;
    assert.deepEqual(trace.semanticGroups?.[0]?.memberEventIds, [
      'later-event',
    ]);
    assert.equal(trace.semanticGroups?.[0]?.id, 'stable-group');
    assert.equal(trace.simulation?.previousSessionId, first.sessionId);
  } finally {
    await c.close();
  }
});

test('semantic group source cannot borrow structured CodeGraph node evidence from another file', async () => {
  const c = await fixture(
    '**Service.run** (method)\n**Location:** Service.kt:1\n',
  );
  try {
    await writeFile(join(c.projectRoot, 'Other.kt'), 'fun other() = 2\n');
    const event = c.event('known-event');
    await assert.rejects(
      c.service.submit({
        ...c.payload([event], true),
        semanticGroups: [
          {
            id: 'false-source',
            kind: 'decision',
            title: 'Invented source',
            callId: 'mock-1',
            memberEventIds: [],
            source: { file: 'Other.kt', line: 1, endLine: 1 },
            evidenceIds: [c.receipt.evidenceId],
            certainty: 'mock',
          },
        ],
      }),
      /Semantic group cites CodeGraph node evidence for another file/,
    );
    assert.deepEqual(await c.store.list(), []);
  } finally {
    await c.close();
  }
});
