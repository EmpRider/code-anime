import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { eventSchema, type Trace, type TraceEvent } from '../domain/trace.js';
import type { SessionStore } from '../domain/flow.js';
import { traceToFlow } from '../analysis/contract.js';
import { EventJournal } from '../storage/event-journal.js';

const startSchema = z
  .object({
    action: z.literal('start'),
    language: z.enum(['python', 'javascript']),
    projectRoot: z.string().min(1),
    entry: z.string().min(1),
    args: z.array(z.string().max(4096)).max(100).default([]),
    timeoutMs: z.number().int().min(100).max(300000).default(15000),
    maxEvents: z.number().int().min(10).max(100000).default(10000),
    maxTraceBytes: z
      .number()
      .int()
      .min(4096)
      .max(64 * 1024 * 1024)
      .default(16 * 1024 * 1024),
  })
  .strict();
interface RecordingJob {
  id: string;
  status: 'running' | 'saving' | 'ready' | 'failed';
  eventCount: number;
  bytes: number;
  createdAt: number;
  child?: ChildProcess;
  stopReason?: string;
  result?: {
    sessionId: string;
    url: string;
    chunks: number;
    complete: boolean;
    diagnostics: string[];
  };
  error?: string;
}

// Runtime capture is separate from AI simulation. It uses the same event model,
// journal, session store and player, but never promotes simulated values.
export class RecordingService {
  private readonly jobs = new Map<string, RecordingJob>();
  private closed = false;
  constructor(
    private readonly store: SessionStore,
    private readonly baseUrl: string,
    private readonly checkRoot: (root: string) => Promise<string>,
  ) {}

  async run(raw: unknown) {
    if (this.closed) throw new Error('Recorder is closed');
    if ((raw as { action?: string })?.action !== 'start') {
      const p = z
        .object({
          action: z.enum(['status', 'cancel']),
          jobId: z.string().uuid(),
        })
        .strict()
        .parse(raw);
      const job = this.jobs.get(p.jobId);
      if (!job) throw new Error('Recording job not found');
      if (p.action === 'cancel' && job.status === 'running')
        this.stop(job, 'Recording cancelled');
      return this.status(job);
    }
    const input = startSchema.parse(raw);
    input.projectRoot = await this.checkRoot(input.projectRoot);
    const entry = await realpath(resolve(input.projectRoot, input.entry));
    const within = relative(input.projectRoot, entry);
    if (within === '..' || within.startsWith('..' + sep) || isAbsolute(within))
      throw new Error('Entry must be inside projectRoot');
    const extensions =
      input.language === 'python' ? ['.py'] : ['.js', '.mjs', '.cjs'];
    if (
      !extensions.some((ext) => entry.endsWith(ext)) ||
      !(await stat(entry)).isFile()
    )
      throw new Error(
        `Entry must be a ${input.language} source file (${extensions.join(', ')})`,
      );
    if (this.closed) throw new Error('Recorder is closed');
    for (const [id, job] of this.jobs)
      if (
        Date.now() - job.createdAt > 3600000 &&
        ['ready', 'failed'].includes(job.status)
      )
        this.jobs.delete(id);
    if (this.jobs.size >= 100) throw new Error('Recording job limit reached');
    if (
      [...this.jobs.values()].filter((j) =>
        ['running', 'saving'].includes(j.status),
      ).length >= 2
    )
      throw new Error('Two recordings are already active');
    const job: RecordingJob = {
      id: randomUUID(),
      status: 'running',
      eventCount: 0,
      bytes: 0,
      createdAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    void this.capture(job, input, entry).catch((error) => {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
    });
    return this.status(job);
  }

  private status(job: RecordingJob) {
    return {
      jobId: job.id,
      status: job.status,
      eventCount: job.eventCount,
      bytes: job.bytes,
      ...(job.stopReason ? { stopReason: job.stopReason } : {}),
      ...(job.result ?? {}),
      ...(job.error ? { error: job.error } : {}),
    };
  }

  private stop(job: RecordingJob, reason: string) {
    if (job.stopReason) return;
    job.stopReason = reason;
    const child = job.child;
    if (!child?.pid || child.exitCode !== null || child.signalCode !== null)
      return;
    if (process.platform === 'win32') {
      const killer = spawn(
        'taskkill',
        ['/PID', String(child.pid), '/T', '/F'],
        { windowsHide: true, stdio: 'ignore' },
      );
      killer.on('error', () => child.kill());
      killer.on('exit', (code) => {
        if (code !== 0) child.kill();
      });
    } else {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    }
  }

  private async capture(
    job: RecordingJob,
    input: z.infer<typeof startSchema>,
    entry: string,
  ) {
    const events: TraceEvent[] = [];
    const sourceFiles: Record<string, string> = {};
    let completion:
      { complete: boolean; reason: string; coverage: string } | undefined;
    let pending = '';
    let stderr = '';
    let sourceBytes = 0;
    const python = input.language === 'python';
    const child = spawn(
      python
        ? process.env.CODE_ANIME_PYTHON_COMMAND ||
            (process.platform === 'win32' ? 'python' : 'python3')
        : process.execPath,
      [
        ...(python ? ['-B', '-u'] : []),
        fileURLToPath(
          new URL(
            python
              ? '../recording/python-recorder.py'
              : '../recording/node-recorder.mjs',
            import.meta.url,
          ),
        ),
        input.projectRoot,
        entry,
        String(input.maxEvents),
        String(input.maxTraceBytes),
        ...input.args,
      ],
      {
        cwd: input.projectRoot,
        windowsHide: true,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    job.child = child;
    const timeout = setTimeout(
      () => this.stop(job, `Recording exceeded ${input.timeoutMs} ms`),
      input.timeoutMs,
    );
    const receive = (line: string) => {
      if (job.stopReason) return;
      try {
        const message = JSON.parse(line);
        if (completion)
          throw new Error('Recorder emitted data after completion');
        if (message.type === 'event') {
          const event = eventSchema.parse(message.event);
          if (
            event.certainty !== 'observed' ||
            event.id !== 'event-' + (events.length + 1)
          )
            throw new Error('Invalid observed event sequence');
          if (events.length >= input.maxEvents)
            throw new Error('Event budget exceeded');
          events.push(event);
          job.eventCount = events.length;
        } else if (message.type === 'source') {
          const source = z
            .object({ file: z.string(), content: z.string() })
            .parse(message);
          sourceBytes += Buffer.byteLength(source.content);
          if (sourceBytes > 2 * 1024 * 1024)
            throw new Error('Source budget exceeded');
          Object.defineProperty(sourceFiles, source.file, {
            value: source.content,
            enumerable: true,
            configurable: true,
          });
        } else if (message.type === 'done') {
          completion = z
            .object({
              complete: z.boolean(),
              reason: z.string(),
              coverage: z.string(),
            })
            .parse(message);
        } else throw new Error('Unrecognized recorder output');
      } catch (error) {
        this.stop(
          job,
          'Recorder protocol error: ' +
            (error instanceof Error ? error.message : String(error)),
        );
      }
    };
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data: string) => {
      job.bytes += Buffer.byteLength(data);
      // Allow the bounded final completion message after the configured limit.
      if (job.bytes > input.maxTraceBytes + 8192) {
        this.stop(job, 'Trace byte budget exceeded');
        return;
      }
      pending += data;
      let newline: number;
      while ((newline = pending.indexOf('\n')) >= 0) {
        const line = pending.slice(0, newline);
        pending = pending.slice(newline + 1);
        receive(line);
      }
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data: string) => {
      stderr = (stderr + data).slice(0, 4096);
    });
    let code: number | null;
    try {
      code = await new Promise<number | null>((accept, reject) => {
        child.once('error', reject);
        child.once('close', accept);
      });
    } finally {
      clearTimeout(timeout);
    }
    if (this.closed) return;
    // A failed startup may write diagnostics before the debugger observes any
    // user-code frame. Pipe output alone is not evidence of an executed trace.
    // Keep the original failure diagnostic instead of saving an output-only
    // session that looks like a replayable application execution.
    if (!events.some((event) => event.kind !== 'console'))
      throw new Error(
        job.stopReason ||
          completion?.reason ||
          stderr ||
          `${input.language} recorder produced no events`,
      );
    job.status = 'saving';
    const complete = Boolean(
      completion?.complete && !job.stopReason && code === 0 && !pending,
    );
    const diagnostics = [
      completion?.coverage ||
        `Partial ${input.language} recording; missing completion metadata. Values are bounded snapshots.`,
      ...(job.stopReason ? [job.stopReason] : []),
      ...(completion?.reason ? [completion.reason] : []),
      ...(!completion ? ['Recorder terminated before completion'] : []),
      ...(stderr ? ['Recorder stderr: ' + stderr] : []),
    ];
    const trace: Trace = {
      version: 2,
      provider: python ? 'python-sys.settrace' : 'node-v8-inspector',
      projectRoot: input.projectRoot,
      target: input.entry,
      scenario: { args: input.args },
      sourceHash: createHash('sha256')
        .update(JSON.stringify(sourceFiles))
        .digest('hex'),
      events: [],
      sourceFiles,
      diagnostics,
      truncated: !complete,
      filesAnalyzed: Object.keys(sourceFiles).length,
      cacheHits: 0,
      recording: {
        mode: 'runtime',
        language: input.language,
        runId: job.id,
        complete,
        coverage: diagnostics.join('\n'),
      },
    };
    const journal = new EventJournal();
    const created: string[] = [];
    try {
      // Reuse the same bounded storage chunker as simulated executions.
      for (let i = 0; i < events.length; i += 100)
        await journal.append(events.slice(i, i + 100));
      let processed = 0;
      for await (const chunk of journal.chunks()) {
        if (this.closed) throw new Error('Recorder closed before saving');
        processed += chunk.length;
        const previousSessionId = created.at(-1);
        const session = await this.store.create(
          traceToFlow(
            {
              ...trace,
              events: chunk,
              truncated: processed < events.length || !complete,
              recording: {
                ...trace.recording!,
                complete: processed === events.length && complete,
                ...(previousSessionId ? { previousSessionId } : {}),
              },
            },
            trace.target,
          ),
        );
        created.push(session.id);
      }
      job.result = {
        sessionId: created[0]!,
        url: this.baseUrl + '/flow/' + created[0],
        chunks: created.length,
        complete,
        diagnostics,
      };
      job.status = 'ready';
    } catch (error) {
      for (const id of created) await this.store.delete?.(id);
      throw error;
    } finally {
      journal.close();
    }
  }

  close() {
    this.closed = true;
    for (const job of this.jobs.values())
      if (job.status === 'running') this.stop(job, 'Recorder closed');
  }
}
