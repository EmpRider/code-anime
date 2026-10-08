import { randomUUID } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import {
  flowSchema,
  sessionIdSchema,
  type Flow,
  type FlowSession,
  type SessionStore,
} from '../domain/flow.js';

interface Options {
  ttlMs: number;
  maxSessionBytes: number;
  maxSessions: number;
}
export class FileSessionStore implements SessionStore {
  private closed = false;
  private queue: Promise<unknown> = Promise.resolve();
  private constructor(
    private readonly directory: string,
    private readonly options: Options,
  ) {}

  static async open(root: string, options: Options): Promise<FileSessionStore> {
    await mkdir(root, { recursive: true });
    const directory = await mkdtemp(join(root, 'code-anime-'));
    return new FileSessionStore(directory, options);
  }

  create(flow: Flow): Promise<FlowSession> {
    // Serialize writes so concurrent requests cannot race the session quota.
    const pending = this.queue.then(() => this.write(flow));
    this.queue = pending.catch(() => undefined);
    return pending;
  }

  private async write(input: Flow): Promise<FlowSession> {
    if (this.closed) throw new Error('Session store is closed');
    const flow = flowSchema.parse(input);
    const session = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      flow,
    };
    const data = JSON.stringify(session);
    if (Buffer.byteLength(data) > this.options.maxSessionBytes)
      throw new Error('Flow exceeds session size limit');
    const sessions = await this.sessions();
    if (sessions.length >= this.options.maxSessions)
      throw new Error('Session limit reached; restart or wait for expiry');
    const target = join(this.directory, session.id + '.json');
    const temporary = target + '.tmp';
    try {
      await writeFile(temporary, data, {
        encoding: 'utf8',
        mode: 0o600,
        flag: 'wx',
      });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
    return session;
  }

  async get(id: string): Promise<FlowSession | undefined> {
    sessionIdSchema.parse(id);
    if (this.closed) return undefined;
    const path = join(this.directory, id + '.json');
    try {
      const session = JSON.parse(await readFile(path, 'utf8')) as FlowSession;
      if (Date.now() - Date.parse(session.createdAt) >= this.options.ttlMs) {
        await rm(path, { force: true });
        return undefined;
      }
      return session;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }

  private async sessions(): Promise<FlowSession[]> {
    const entries = await readdir(this.directory);
    const sessions = await Promise.all(
      entries
        .filter((name) => name.endsWith('.json'))
        .map((name) => this.get(name.slice(0, -5))),
    );
    return sessions.filter((session): session is FlowSession =>
      Boolean(session),
    );
  }

  async list(): Promise<FlowSession[]> {
    return this.closed ? [] : this.sessions();
  }
  async delete(id: string): Promise<boolean> {
    sessionIdSchema.parse(id);
    if (!(await this.get(id))) return false;
    await rm(join(this.directory, id + '.json'), { force: true });
    return true;
  }

  async latest(): Promise<FlowSession | undefined> {
    if (this.closed) return undefined;
    const sessions = await this.sessions();
    return sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  async close(): Promise<void> {
    this.closed = true;
    await this.queue;
    await rm(this.directory, { recursive: true, force: true });
  }
}
