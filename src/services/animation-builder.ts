import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { eventSchema, sourceSchema, type TraceEvent } from '../domain/trace.js';
import type { SessionStore } from '../domain/flow.js';
import { SimulationService } from './simulation-service.js';
import { EventJournal } from '../storage/event-journal.js';

const record = z.record(z.unknown());
export const operationSchema = z
  .object({
    kind: eventSchema.shape.kind,
    label: z.string().min(1).max(180),
    symbol: z.string().min(1).max(200).optional(),
    source: sourceSchema.optional(),
    line: z.number().int().positive().optional(),
    evidenceIds: z.array(z.string().uuid()).min(1).max(200).optional(),
    inputs: record.optional(),
    result: z.unknown().optional(),
    output: z.string().max(16000).optional(),
    set: record.optional(),
    unset: z.array(z.string()).optional(),
    assignTo: z.string().min(1).optional(),
    unwindTo: z.string().min(1).nullable().optional(),
    objectId: z.string().min(1).max(200).optional(),
    fields: record.optional(),
    unsetFields: z.array(z.string()).optional(),
    values: record.optional(),
    origins: z.record(z.string()).optional(),
    snippet: z.string().max(800).optional(),
    certainty: z
      .enum(['mock', 'assumed', 'unresolved', 'proposed'])
      .default('mock'),
    note: z.string().optional(),
  })
  .strict();
const beginSchema = z
  .object({
    action: z.literal('begin'),
    projectRoot: z.string().min(1),
    endpoint: z.string().min(1).max(200),
    evidenceIds: z.array(z.string().uuid()).min(1).max(200),
    scenario: record.default({}),
    baselineSessionId: z.string().uuid().optional(),
  })
  .strict();
const appendSchema = z
  .object({
    action: z.literal('append'),
    buildId: z.string().uuid(),
    batchId: z.string().min(1).max(80),
    expectedEventCount: z.number().int().nonnegative(),
    operations: z.array(operationSchema).min(1).max(100),
  })
  .strict();
const finishSchema = z
  .object({
    action: z.literal('finish'),
    buildId: z.string().uuid(),
    coverage: z.string().min(1).max(4000),
    complete: z.boolean(),
  })
  .strict();
export const builderSchema = z.discriminatedUnion('action', [
  beginSchema,
  appendSchema,
  finishSchema,
  z
    .object({ action: z.literal('status'), buildId: z.string().uuid() })
    .strict(),
  z
    .object({ action: z.literal('cancel'), buildId: z.string().uuid() })
    .strict(),
]);
type Operation = z.infer<typeof operationSchema>;
interface Frame {
  id: string;
  symbol: string;
  source?: z.infer<typeof sourceSchema> | undefined;
  evidenceIds: string[];
  locals: Record<string, unknown>;
}
interface Build {
  input: z.infer<typeof beginSchema>;
  id: string;
  createdAt: number;
  frames: Frame[];
  objects: Record<string, Record<string, unknown>>;
  events: EventJournal;
  calls: number;
  batches: Map<string, { hash: string; count: number }>;
  busy: boolean;
  result?: Record<string, unknown>;
  finishHash?: string;
}
const clone = <T>(value: T): T => structuredClone(value);
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const patch = (
  target: Record<string, unknown>,
  set?: Record<string, unknown>,
  unset?: string[],
) => {
  const entries = Object.fromEntries(Object.entries(target));
  for (const [key, value] of Object.entries(set ?? {}))
    Object.defineProperty(entries, key, {
      value: clone(value),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  for (const key of unset ?? []) delete entries[key];
  return entries;
};

// Generic trace assembly, not a source interpreter. No eval, shell, script files
// or per-project generators. AI supplies semantic values as MCP data.
export class AnimationBuilder {
  private readonly builds = new Map<string, Build>();
  constructor(
    private readonly simulation: SimulationService,
    private readonly store: SessionStore,
  ) {}
  private get(id: string) {
    const build = this.builds.get(id);
    if (!build || (!build.busy && Date.now() - build.createdAt > 3600000)) {
      build?.events.close();
      this.builds.delete(id);
      throw new Error('Build expired or not found; begin a new animation');
    }
    return build;
  }
  private status(b: Build) {
    return {
      buildId: b.id,
      status: b.result ? 'ready' : b.busy ? 'processing' : 'building',
      eventCount: b.events.count,
      stack: b.frames.map((f) => ({ callId: f.id, symbol: f.symbol })),
      nextAction:
        'Send the next operations batch directly through this tool; do not create scripts or payload files.',
      ...(b.result ?? {}),
    };
  }
  async run(raw: unknown): Promise<Record<string, unknown>> {
    if (Buffer.byteLength(JSON.stringify(raw)) > 1024 * 1024)
      throw new Error(
        'Batch exceeds 1 MiB; send fewer operations directly through MCP, not a payload file',
      );
    const p = builderSchema.parse(raw);
    if (p.action === 'begin') {
      for (const [id, b] of this.builds)
        if (!b.busy && Date.now() - b.createdAt > 3600000) {
          b.events.close();
          this.builds.delete(id);
        }
      if (this.builds.size >= 10)
        throw new Error(
          'Build limit reached; cancel or finish existing builds',
        );
      const { root } = await this.simulation.checkEvidence(
        p.projectRoot,
        p.evidenceIds,
      );
      if (this.builds.size >= 10) throw new Error('Build limit reached');
      const b: Build = {
        input: { ...p, projectRoot: root },
        id: randomUUID(),
        createdAt: Date.now(),
        frames: [],
        objects: {},
        events: new EventJournal(),
        calls: 0,
        batches: new Map(),
        busy: false,
      };
      this.builds.set(b.id, b);
      return this.status(b);
    }
    const b = this.get(p.buildId);
    if (p.action === 'status') return this.status(b);
    if (b.busy)
      throw new Error(
        'Build is processing a request; retry after checking status',
      );
    if (p.action === 'cancel') {
      b.events.close();
      this.builds.delete(b.id);
      return { cancelled: true, buildId: b.id };
    }
    if (p.action === 'append') {
      const digest = hash(p);
      const prior = b.batches.get(p.batchId);
      if (prior) {
        if (prior.hash !== digest)
          throw new Error('batchId was already used with different operations');
        return {
          ...this.status(b),
          acceptedEventCount: prior.count,
          replayedBatch: true,
        };
      }
      if (b.result) throw new Error('Animation is already finalized');
      if (p.expectedEventCount !== b.events.count)
        throw new Error(
          `Event count changed; expectedEventCount must be ${b.events.count}`,
        );
      b.busy = true;
      try {
        const evidenceIds = [
          ...new Set([
            ...b.input.evidenceIds,
            ...p.operations.flatMap((o) => o.evidenceIds ?? []),
          ]),
        ];
        if (evidenceIds.length > 200)
          throw new Error('Build exceeds evidence receipt limit');
        await this.simulation.checkEvidence(b.input.projectRoot, evidenceIds);
        const state = {
          frames: clone(b.frames),
          objects: clone(b.objects),
          calls: b.calls,
        };
        const events = p.operations.map((op, i) =>
          this.apply(state, op, b.events.count + i, evidenceIds),
        );
        await b.events.append(events);
        // Commit only after the whole batch validates. Retried batch IDs are idempotent.
        b.frames = state.frames;
        b.objects = state.objects;
        b.calls = state.calls;
        b.input.evidenceIds = evidenceIds;
        b.batches.set(p.batchId, { hash: digest, count: events.length });
      } finally {
        b.busy = false;
      }
      return { ...this.status(b), acceptedEventCount: p.operations.length };
    }
    if (b.result) {
      if (b.finishHash !== hash(p))
        throw new Error('Animation was finalized with different coverage');
      return this.status(b);
    }
    if (!b.events.count)
      throw new Error('Append execution steps before finishing');
    if (p.complete && b.frames.length)
      throw new Error(
        'Active call frames remain; append their returns or finish with complete:false and explain the boundary',
      );
    b.busy = true;
    const created: string[] = [];
    try {
      if (b.input.baselineSessionId) {
        let hasProposal = false;
        for await (const events of b.events.chunks()) {
          if (events.some((event) => event.certainty === 'proposed')) {
            hasProposal = true;
            break;
          }
        }
        if (!hasProposal)
          throw new Error('Mark changed plan events as proposed');
      }
      let result: Awaited<ReturnType<SimulationService['submit']>> | undefined;
      let chunks = 0;
      let processed = 0;
      for await (const events of b.events.chunks()) {
        processed += events.length;
        chunks++;
        result = await this.simulation.submit(
          {
            projectRoot: b.input.projectRoot,
            endpoint: b.input.endpoint,
            evidenceIds: b.input.evidenceIds,
            scenario: b.input.scenario,
            events,
            coverage: p.coverage,
            complete: processed === b.events.count && p.complete,
            ...(result ? { continuationOf: result.sessionId } : {}),
            ...(b.input.baselineSessionId && !result
              ? { baselineSessionId: b.input.baselineSessionId }
              : {}),
          },
          Boolean(b.input.baselineSessionId),
        );
        created.push(result.sessionId);
      }
      b.result = {
        ...result!,
        eventCount: b.events.count,
        chunks,
        status: 'ready',
      };
      b.finishHash = hash(p);
      b.events.close();
      return this.status(b);
    } catch (error) {
      for (const id of created) await this.store.delete?.(id);
      throw error;
    } finally {
      b.busy = false;
    }
  }
  private apply(
    state: {
      frames: Frame[];
      objects: Record<string, Record<string, unknown>>;
      calls: number;
    },
    op: Operation,
    index: number,
    defaultEvidence: string[],
  ): TraceEvent {
    const caller = state.frames.at(-1);
    if (op.kind === 'enter') {
      if (!op.symbol) throw new Error('Enter requires a symbol');
      state.frames.push({
        id: `call-${++state.calls}`,
        symbol: op.symbol,
        source: op.source,
        evidenceIds: op.evidenceIds ?? defaultEvidence,
        locals: clone(op.inputs ?? {}),
      });
    }
    const frame = state.frames.at(-1);
    if (!frame) throw new Error('Begin the flow with an enter operation');
    if (op.unwindTo !== undefined && op.kind !== 'throw')
      throw new Error('unwindTo is only valid for throw operations');
    if (
      op.unwindTo !== undefined &&
      op.unwindTo !== null &&
      !state.frames.some((f) => f.id === op.unwindTo)
    )
      throw new Error(
        'unwindTo must identify an active invocation or be null for an uncaught exception',
      );
    const source =
      op.source ??
      (op.line && frame.source
        ? { ...frame.source, line: op.line, endLine: op.line }
        : frame.source);
    if (!source && !['unresolved', 'proposed'].includes(op.certainty))
      throw new Error('Provide source on enter or this operation');
    if (source && source.endLine < source.line)
      throw new Error('Invalid source line range');
    if ((op.fields || op.unsetFields) && !op.objectId)
      throw new Error('Object field changes need objectId');
    const before = clone(
      op.objectId ? (state.objects[op.objectId] ?? {}) : frame.locals,
    );
    frame.locals = patch(frame.locals, op.set, op.unset);
    if (op.assignTo && !Object.hasOwn(op, 'result'))
      throw new Error('assignTo requires result (null is allowed)');
    if (op.kind === 'console' && op.output === undefined)
      throw new Error('Console events need the exact simulated output');
    if (op.assignTo && op.kind !== 'return')
      frame.locals = patch(frame.locals, { [op.assignTo]: op.result });
    if (op.objectId) {
      const object = patch(
        state.objects[op.objectId] ?? {},
        op.fields,
        op.unsetFields,
      );
      Object.defineProperty(state.objects, op.objectId, {
        value: object,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    let after = clone(op.objectId ? state.objects[op.objectId]! : frame.locals);
    let beforeSnapshot = before;
    if (op.kind === 'transform' && !op.set && !op.assignTo && !op.objectId) {
      if (!Object.hasOwn(op, 'result'))
        throw new Error('Transform needs result or a state change');
      beforeSnapshot = { ...(op.inputs ?? {}), result: null };
      after = { ...(op.inputs ?? {}), result: clone(op.result) };
    }
    const parent = state.frames.at(-2);
    if (op.kind === 'throw' && op.unwindTo !== undefined) {
      const retained =
        op.unwindTo === null
          ? 0
          : state.frames.findIndex((f) => f.id === op.unwindTo) + 1;
      state.frames.splice(retained);
    }
    if (op.kind === 'return') {
      state.frames.pop();
      if (op.assignTo) {
        if (!parent)
          throw new Error('Root return cannot assign to a caller frame');
        parent.locals = patch(parent.locals, { [op.assignTo]: op.result });
      }
    }
    const event: TraceEvent = {
      id: `event-${index + 1}`,
      kind: op.kind,
      symbolId: op.symbol ?? frame.symbol,
      label: op.label,
      callId: frame.id,
      ...(parent ? { parentCallId: parent.id } : {}),
      ...(source ? { source } : {}),
      evidenceIds: op.evidenceIds ?? frame.evidenceIds,
      values: {
        from:
          op.kind === 'enter' ? (caller?.symbol ?? frame.symbol) : frame.symbol,
        to:
          op.kind === 'return'
            ? (parent?.symbol ?? 'caller')
            : (op.symbol ?? frame.symbol),
        ...op.values,
      },
      before: beforeSnapshot,
      after,
      locals: Object.fromEntries(
        state.frames.map((f) => [f.id, clone(f.locals)]),
      ),
      objects: clone(state.objects),
      stack: state.frames.map((f) => f.id),
      certainty: op.certainty,
      ...(op.inputs ? { inputs: clone(op.inputs) } : {}),
      ...(Object.hasOwn(op, 'result') ? { result: clone(op.result) } : {}),
      ...(op.output !== undefined ? { output: op.output } : {}),
      ...(op.objectId ? { objectId: op.objectId } : {}),
      ...(op.origins ? { origins: op.origins } : {}),
      ...(op.snippet ? { snippet: op.snippet } : {}),
      ...(op.note ? { note: op.note } : {}),
    };
    return eventSchema.parse(event);
  }
  close() {
    for (const b of this.builds.values()) b.events.close();
    this.builds.clear();
  }
}
