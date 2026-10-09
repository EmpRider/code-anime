import { analyzeWithCodeGraph } from '../analysis/codegraph-provider.js';
import { randomUUID } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { z } from 'zod';
import { verifyNativeCodeGraph } from '../analysis/native-codegraph.js';
import {
  traceToFlow,
  type AnalysisInput,
  CandidateError,
} from '../analysis/contract.js';
import { traceSchema, type TraceEvent } from '../domain/trace.js';
import type { Flow, SessionStore } from '../domain/flow.js';

export const analyzeSchema = z
  .object({
    provider: z.literal('codegraph').optional(),
    projectRoot: z.string().min(1),
    target: z.string().min(1).max(200),
    scenario: z.record(z.unknown()).optional(),
    maxDepth: z.number().int().min(1).max(30).optional(),
    maxEvents: z.number().int().min(10).max(2000).optional(),
  })
  .strict();
interface Job {
  id: string;
  status: string;
  stage: string;
  files: number;
  controller: AbortController;
  input: AnalysisInput;
  result?: Record<string, unknown>;
  createdAt: number;
}
export class VisualizationService {
  private readonly jobs = new Map<string, Job>();
  private readonly queue: Job[] = [];
  private running = 0;
  private closed = false;
  constructor(
    private readonly store: SessionStore,
    private readonly baseUrl: string,
    private readonly allowedRoot?: string,
  ) {}
  async root(requested: string) {
    const root = await realpath(resolve(requested));
    if (!this.allowedRoot) return root;
    const allowed = await realpath(resolve(this.allowedRoot));
    const path = relative(allowed, root);
    if (
      path === '..' ||
      path.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) ||
      isAbsolute(path)
    )
      throw new Error(
        'projectRoot must be inside configured CODE_ANIME_PROJECT_ROOT',
      );
    return root;
  }
  capabilities() {
    return {
      version: '0.4.1',
      languages: [],
      languageSupport: 'Determined by the configured CodeGraph provider',
      analysis: 'CodeGraph evidence only; no built-in source analysis',
      codeGraphRequired: true,
      codeGraphConfigured: true,
      codeGraphMode: process.env.CODE_ANIME_CODEGRAPH_CONFIG
        ? 'normalized-bridge'
        : 'native-cli',
      codeGraphReady: 'Verified against the active project on submission',
      projectRoot: this.allowedRoot ? resolve(this.allowedRoot) : null,
      projectRootPolicy: this.allowedRoot ? 'restricted' : 'per-request',
      providers: [
        'normalized-export',
        'codegraph-native',
        ...(process.env.CODE_ANIME_CODEGRAPH_CONFIG
          ? ['codegraph-bridge']
          : []),
      ],
      codeGraph: process.env.CODE_ANIME_CODEGRAPH_CONFIG
        ? 'Configured normalized MCP bridge'
        : 'Launch installed codegraph serve --mcp --path <active project> automatically; no bridge config required.',
      limits: {
        maxDepth: 30,
        providerTimeoutMs: 60000,
        events: 2000,
        concurrentJobs: 2,
      },
      tools: 10,
      workflow:
        'read_codegraph_evidence → build_mock_animation begin/append/finish → localhost URL',
      simulation:
        'Host AI supplies semantic steps directly via MCP; server owns IDs, call stack, state snapshots, chunking, files and rendering. Never create or execute helper scripts or payload files.',
      continuation:
        'Server automatically splits builds into stored chunks at finish',
      scriptFilesRequired: false,
      builderLimits: {
        operationsPerBatch: 100,
        eventsPerBuild: 20000,
        snapshotBytes: 40 * 1024 * 1024,
      },
    };
  }
  async start(raw: unknown) {
    const input = analyzeSchema.parse(raw);
    input.provider = 'codegraph';
    if (Buffer.byteLength(JSON.stringify(input.scenario ?? {})) > 256 * 1024)
      throw new Error('Scenario exceeds 256 KiB');
    input.projectRoot = await this.root(input.projectRoot);
    if (!process.env.CODE_ANIME_CODEGRAPH_CONFIG)
      await verifyNativeCodeGraph(input);
    if (this.closed) throw new Error('Service closed');
    for (const [id, job] of this.jobs)
      if (
        Date.now() - job.createdAt > 3600000 &&
        !['queued', 'running'].includes(job.status)
      )
        this.jobs.delete(id);
    if (this.jobs.size >= 100)
      throw new Error('Job limit reached; delete completed jobs');
    const job: Job = {
      id: randomUUID(),
      status: 'queued',
      stage: 'queued',
      files: 0,
      controller: new AbortController(),
      input,
      createdAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    this.queue.push(job);
    setImmediate(() => this.pump());
    return { jobId: job.id, status: job.status };
  }
  private pump() {
    while (!this.closed && this.running < 2 && this.queue.length) {
      const job = this.queue.shift()!;
      if (job.controller.signal.aborted) continue;
      this.running++;
      void this.run(job).finally(() => {
        this.running--;
        this.pump();
      });
    }
  }
  private async run(job: Job) {
    job.status = 'running';
    try {
      const config = process.env.CODE_ANIME_CODEGRAPH_CONFIG;
      job.stage = 'provider';
      const flow = await analyzeWithCodeGraph(
        config,
        job.input,
        job.controller.signal,
      );
      flow.trace!.projectRoot = await this.root(flow.trace!.projectRoot);
      if (flow.trace!.projectRoot !== job.input.projectRoot)
        throw new Error('CodeGraph returned evidence for a different project');
      if (job.controller.signal.aborted) throw new Error('Analysis cancelled');
      const session = await this.store.create(flow);
      if (job.controller.signal.aborted) {
        await this.store.delete?.(session.id);
        throw new Error('Analysis cancelled');
      }
      job.result = this.summary(session.id, flow);
      job.status = 'ready';
      job.stage = 'complete';
    } catch (error) {
      job.status = job.controller.signal.aborted
        ? 'cancelled'
        : error instanceof CandidateError
          ? 'needs_selection'
          : 'failed';
      job.result = {
        error:
          error instanceof Error ? error.message : 'CodeGraph analysis failed',
        ...(error instanceof CandidateError
          ? { candidates: error.candidates }
          : {}),
      };
    }
  }
  status(id: string): {
    jobId: string;
    status: string;
    stage: string;
    filesAnalyzed: number;
    [key: string]: unknown;
  } {
    const job = this.jobs.get(id);
    if (!job) throw new Error('Job not found or expired');
    return {
      jobId: id,
      status: job.status,
      stage: job.stage,
      filesAnalyzed: job.files,
      ...job.result,
    };
  }
  private summary(id: string, flow: Flow) {
    return {
      sessionId: id,
      url: this.baseUrl + '/flow/' + id,
      eventCount: flow.trace?.events.length ?? flow.steps.length,
      provider: flow.trace?.provider ?? 'agent-authored',
      truncated: flow.trace?.truncated ?? false,
      unresolved:
        flow.trace?.events.filter((e) => e.certainty === 'unresolved').length ??
        0,
      diagnostics: flow.trace?.diagnostics ?? [],
      mode: flow.trace?.simulation ? 'ai-mock' : 'structural-evidence',
      nextAction: flow.trace?.simulation
        ? 'Replay mock scenario'
        : 'Retrieve full CodeGraph evidence and generate a mock trace before presenting execution',
      sourceHash: flow.trace?.sourceHash,
    };
  }
  async inspect(id: string, offset: number, limit: number) {
    const session = await this.store.get(id);
    if (!session) throw new Error('Session expired or not found');
    const events = session.flow.trace?.events ?? session.flow.steps;
    return {
      ...this.summary(id, session.flow),
      events: events.slice(offset, offset + limit),
      nextOffset: offset + limit < events.length ? offset + limit : null,
    };
  }
  async refine(
    id: string,
    scenario: Record<string, unknown>,
    maxDepth?: number,
  ) {
    const job = [...this.jobs.values()].find((j) => j.result?.sessionId === id);
    if (!job)
      throw new Error(
        'Refinement needs an analysis job from this process; imported/legacy sessions cannot be re-analyzed',
      );
    if (!(await this.store.get(id)))
      throw new Error('Session expired or not found');
    return this.start({
      ...job.input,
      scenario: { ...job.input.scenario, ...scenario },
      ...(maxDepth ? { maxDepth } : {}),
    });
  }
  async plan(
    id: string,
    changes: Array<{ from: string; to: string; description: string }>,
  ) {
    const session = await this.store.get(id);
    if (!session?.flow.trace)
      throw new Error('Change plans require an analyzed trace baseline');
    const trace = structuredClone(session.flow.trace);
    if (trace.events.length + changes.length > 2000)
      throw new Error('Plan exceeds event limit');
    for (const [i, change] of changes.entries())
      trace.events.push({
        id: 'plan-' + i,
        kind: 'plan',
        symbolId: change.to,
        label: change.description,
        callId: 'proposal',
        values: {
          from: change.from,
          to: change.to,
          description: change.description,
        },
        stack: [],
        certainty: 'proposed',
        note: 'Proposed change; not implemented code',
      });
    trace.provider += ' + proposed overlay';
    trace.diagnostics.push(
      'Plan edges are user/agent proposals, not proven dependency impacts.',
    );
    const flow = traceToFlow(trace, 'Plan: ' + session.flow.endpoint);
    const result = await this.store.create(flow);
    return this.summary(result.id, flow);
  }
  async importTrace(file: string) {
    const path = await realpath(resolve(file));
    await this.root(path);
    if ((await stat(path)).size > 10 * 1024 * 1024)
      throw new Error('Export exceeds 10 MiB');
    const trace = traceSchema.parse(JSON.parse(await readFile(path, 'utf8')));
    trace.projectRoot = await this.root(trace.projectRoot);
    if (!trace.events.length) throw new Error('Export needs trace events');
    trace.provider = 'normalized-export: ' + trace.provider;
    trace.diagnostics.push(
      'Imported evidence was supplied by the export producer; source hashes were not independently verified.',
    );
    const flow = traceToFlow(trace, trace.target);
    const session = await this.store.create(flow);
    return this.summary(session.id, flow);
  }
  async manage(action: string, id?: string) {
    if (action === 'list')
      return {
        sessions: ((await this.store.list?.()) ?? []).map((s) =>
          this.summary(s.id, s.flow),
        ),
        jobs: [...this.jobs.values()].map((j) => ({
          jobId: j.id,
          status: j.status,
        })),
      };
    if (!id) throw new Error('id is required');
    if (action === 'cancel') {
      const job = this.jobs.get(id);
      if (!job) throw new Error('Job not found');
      job.controller.abort();
      if (job.status === 'queued') job.status = 'cancelled';
      return { jobId: id, status: job.status };
    }
    if (action === 'delete_job') {
      const job = this.jobs.get(id);
      if (job && ['queued', 'running'].includes(job.status))
        throw new Error('Cancel running job first');
      return { deleted: this.jobs.delete(id) };
    }
    if (action === 'delete')
      return { deleted: (await this.store.delete?.(id)) ?? false };
    throw new Error('Unknown action');
  }
  close() {
    this.closed = true;
    for (const job of this.jobs.values()) job.controller.abort();
    this.queue.length = 0;
  }
}
