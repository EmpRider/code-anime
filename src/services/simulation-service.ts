import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { readNativeEvidence } from '../analysis/native-codegraph.js';
import { traceToFlow } from '../analysis/contract.js';
import { eventSchema, type Trace, type TraceEvent } from '../domain/trace.js';
import { flowSchema, type SessionStore } from '../domain/flow.js';

export const evidenceRequestSchema = z
  .object({
    projectRoot: z.string().min(1),
    tool: z
      .enum(['explore', 'node', 'search', 'callees', 'files'])
      .default('explore'),
    arguments: z.record(z.unknown()).default({}),
    evidenceId: z.string().uuid().optional(),
    offset: z.number().int().min(0).default(0),
    limit: z.number().int().min(100).max(32000).default(16000),
  })
  .strict();
export const simulationSchema = z
  .object({
    projectRoot: z.string().min(1),
    endpoint: z.string().min(1).max(200),
    evidenceIds: z.array(z.string().uuid()).min(1).max(200),
    scenario: z.record(z.unknown()).default({}),
    events: z.array(eventSchema).min(1).max(2000).optional(),
    steps: flowSchema.shape.steps.optional(),
    complete: z.boolean().default(true),
    coverage: z.string().min(1).max(4000),
    continuationOf: z.string().uuid().optional(),
    baselineSessionId: z.string().uuid().optional(),
  })
  .strict()
  .refine(
    (p) => Boolean(p.events) !== Boolean(p.steps),
    'Supply events or steps, not both',
  );

interface Evidence {
  id: string;
  projectRoot: string;
  tool: string;
  text: string;
  hash: string;
  files: number;
  createdAt: number;
}
// Only evidence obtained from CodeGraph creates a receipt. No source-file reads.
export class SimulationService {
  private readonly evidence = new Map<string, Evidence>();
  private readonly controller = new AbortController();
  constructor(
    private readonly store: SessionStore,
    private readonly baseUrl: string,
    private readonly resolveRoot: (root: string) => Promise<string>,
    private readonly provider = readNativeEvidence,
  ) {}
  private prune() {
    for (const [id, item] of this.evidence)
      if (Date.now() - item.createdAt > 3600000) this.evidence.delete(id);
  }
  async read(raw: unknown) {
    const p = evidenceRequestSchema.parse(raw);
    const root = await this.resolveRoot(p.projectRoot);
    this.prune();
    let item = p.evidenceId ? this.evidence.get(p.evidenceId) : undefined;
    if (p.evidenceId && (!item || item.projectRoot !== root))
      throw new Error(
        'CodeGraph evidence expired or belongs to a different project; retrieve it again.',
      );
    if (!item) {
      if (this.evidence.size >= 200)
        throw new Error(
          'Evidence limit reached; complete the current flow or start a new server session.',
        );
      if (Buffer.byteLength(JSON.stringify(p.arguments)) > 32000)
        throw new Error('Evidence query is too large');
      const result = await this.provider(
        root,
        p.tool,
        p.arguments,
        this.controller.signal,
      );
      item = {
        id: randomUUID(),
        projectRoot: root,
        tool: p.tool,
        text: result.text,
        hash: createHash('sha256').update(result.text).digest('hex'),
        files: result.files,
        createdAt: Date.now(),
      };
      this.evidence.set(item.id, item);
    }
    const end = Math.min(item.text.length, p.offset + p.limit);
    return {
      evidenceId: item.id,
      projectRoot: root,
      tool: item.tool,
      text: item.text.slice(p.offset, end),
      sourceHash: item.hash,
      offset: p.offset,
      nextOffset: end < item.text.length ? end : null,
      totalCharacters: item.text.length,
      guidance:
        'Read all relevant source pages and resolve helpers/DTOs through CodeGraph. Then author a statement-level mock trace. Provider truncation must be resolved with node file offset/limit queries or reported as incomplete.',
    };
  }
  async submit(raw: unknown) {
    if (Buffer.byteLength(JSON.stringify(raw)) > 8 * 1024 * 1024)
      throw new Error(
        'Trace chunk exceeds 8 MiB; split it into smaller chunks',
      );
    const p = simulationSchema.parse(raw);
    const root = await this.resolveRoot(p.projectRoot);
    this.prune();
    const evidence = p.evidenceIds.map((id) => {
      const item = this.evidence.get(id);
      if (!item || item.projectRoot !== root)
        throw new Error(
          'CodeGraph evidence is required for this project; retrieve current evidence before generating an animation.',
        );
      return item;
    });
    if (!evidence.some((e) => ['node', 'explore'].includes(e.tool)))
      throw new Error(
        'Retrieve CodeGraph source evidence using node or explore before simulation.',
      );
    const events: TraceEvent[] =
      p.events ??
      p.steps!.map((step, i) => ({
        id: `step-${i}`,
        kind: 'transform' as const,
        symbolId: step.to,
        label: step.dtoName,
        callId: 'legacy',
        values: step.dtoFields,
        after: step.dtoFields,
        stack: [],
        certainty: 'mock' as const,
        note: `Legacy snapshot ${step.from} → ${step.to}; source/stack detail was not supplied.`,
      }));
    const ids = new Set<string>();
    for (const event of events) {
      if (ids.has(event.id)) throw new Error(`Duplicate event ID: ${event.id}`);
      ids.add(event.id);
      if (p.events) {
        if (
          !event.evidenceIds?.length ||
          event.evidenceIds.some((id) => !p.evidenceIds.includes(id))
        )
          throw new Error(
            `Event ${event.id} must reference supplied CodeGraph evidenceIds`,
          );
        if (
          !['mock', 'assumed', 'unresolved', 'proposed'].includes(
            event.certainty,
          )
        )
          throw new Error(
            'AI simulation events must be labeled mock, assumed, unresolved or proposed',
          );
        if (
          !event.source &&
          !['unresolved', 'proposed'].includes(event.certainty)
        )
          throw new Error(
            `Event ${event.id} needs its source/call-site location`,
          );
        if (
          ['assign', 'mutate', 'transform'].includes(event.kind) &&
          (!event.before || !event.after)
        )
          throw new Error(`Event ${event.id} needs before and after snapshots`);
        if (event.kind === 'enter' && event.stack.at(-1) !== event.callId)
          throw new Error(
            `Enter event ${event.id} must push its invocation onto the stack`,
          );
        if (event.kind === 'return' && event.stack.includes(event.callId))
          throw new Error(
            `Return event ${event.id} must pop its invocation; snapshots describe state after the event`,
          );
        if (!event.locals)
          throw new Error(
            `Event ${event.id} needs a complete local-state snapshot`,
          );
        if (event.source && event.source.endLine < event.source.line)
          throw new Error(`Event ${event.id} has an invalid source range`);
      }
    }
    let previous: Trace | undefined;
    let firstSessionId: string | undefined;
    if (p.continuationOf) {
      previous = (await this.store.get(p.continuationOf))?.flow.trace;
      if (
        !previous?.simulation ||
        previous.projectRoot !== root ||
        previous.target !== p.endpoint
      )
        throw new Error(
          'Continuation needs an existing mock trace for the same project and target',
        );
      if (previous.simulation.complete)
        throw new Error('Cannot continue a completed trace');
      if (JSON.stringify(previous.scenario) !== JSON.stringify(p.scenario))
        throw new Error('Continuation must preserve scenario inputs');
      let ancestor = await this.store.get(p.continuationOf);
      while (ancestor?.flow.trace) {
        if (ancestor.flow.trace.events.some((e) => ids.has(e.id)))
          throw new Error('Continuation event IDs must be unique');
        firstSessionId = ancestor.id;
        const parent = ancestor.flow.trace.simulation?.previousSessionId;
        ancestor = parent ? await this.store.get(parent) : undefined;
        if (parent && !ancestor)
          throw new Error('Earlier chunk expired; generate a new trace');
      }
    }
    let baseline: Trace | undefined;
    if (p.baselineSessionId) {
      baseline = (await this.store.get(p.baselineSessionId))?.flow.trace;
      if (!baseline?.simulation || baseline.projectRoot !== root)
        throw new Error(
          'Plan comparison requires a mock execution baseline for the same project',
        );
      if (!events.some((e) => e.certainty === 'proposed'))
        throw new Error('Mark changed plan events as proposed');
    }
    const trace: Trace = {
      version: 2,
      provider: 'codegraph + ai-mock',
      projectRoot: root,
      sourceHash: createHash('sha256')
        .update(evidence.map((e) => e.hash).join('\n'))
        .digest('hex'),
      target: p.endpoint,
      scenario: p.scenario,
      events,
      diagnostics: [
        'AI-simulated values from CodeGraph evidence; repository code and external effects were not executed.',
        'Evidence receipts verify retrieval and project identity, not the semantic correctness of AI calculations.',
        ...(p.steps
          ? [
              'Legacy snapshot payload: source lines and invocation frames unavailable.',
            ]
          : []),
      ],
      truncated: !p.complete,
      filesAnalyzed: Math.max(...evidence.map((e) => e.files)),
      cacheHits: 0,
      simulation: {
        mode: 'ai-mock',
        complete: p.complete,
        coverage: p.coverage,
        evidenceIds: p.evidenceIds,
        ...(p.continuationOf ? { previousSessionId: p.continuationOf } : {}),
        ...(p.baselineSessionId
          ? { baselineSessionId: p.baselineSessionId }
          : {}),
      },
    };
    const flow = traceToFlow(trace, p.endpoint);
    if (p.steps) flow.steps = p.steps;
    if (baseline) flow.baselineTrace = baseline;
    const session = await this.store.create(flow);
    return {
      sessionId: session.id,
      url: this.baseUrl + '/flow/' + (firstSessionId ?? session.id),
      chunkUrl: this.baseUrl + '/flow/' + session.id,
      eventCount: events.length,
      complete: p.complete,
      coverage: p.coverage,
      nextAction: p.complete
        ? 'Present the player URL'
        : 'Submit the next chunk with continuationOf set to this sessionId, preserving scenario and call IDs',
    };
  }
  close() {
    this.controller.abort();
    this.evidence.clear();
  }
}
