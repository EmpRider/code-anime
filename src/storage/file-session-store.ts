import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  open,
  readdir,
  lstat,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
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
  persistentDirectory?: string | undefined;
}
export class FileSessionStore implements SessionStore {
  private closed = false;
  private queue: Promise<unknown> = Promise.resolve();
  private shutdown?: Promise<void>;
  private readonly index = new Map<
    string,
    { createdAt: string; previousSessionId?: string }
  >();
  private lockOwner: string | undefined;
  private constructor(
    private readonly directory: string,
    private readonly options: Options,
  ) {}

  static async open(root: string, options: Options): Promise<FileSessionStore> {
    if (options.persistentDirectory) {
      const directory = resolve(options.persistentDirectory);
      await mkdir(directory, { recursive: true, mode: 0o700 });
      if (!(await lstat(directory)).isDirectory())
        throw new Error(
          'Persistent session directory must be a real directory, not a symbolic link',
        );
      const lockPath = join(directory, '.code-anime.lock');
      let lock;
      try {
        lock = await open(lockPath, 'wx', 0o600);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST')
          throw new Error(
            `Session directory is locked: ${lockPath}. Close its Code Anime process first. After a crash, remove this lock only after confirming that process has stopped.`,
          );
        throw error;
      }
      const store = new FileSessionStore(directory, options);
      store.lockOwner = randomUUID();
      try {
        await lock.writeFile(
          JSON.stringify({
            pid: process.pid,
            startedAt: new Date().toISOString(),
            owner: store.lockOwner,
          }),
        );
        await lock.close();
        await store.recover();
        return store;
      } catch (error) {
        await lock.close().catch(() => {});
        await store.releaseLock();
        throw error;
      }
    }
    await mkdir(root, { recursive: true });
    const directory = await mkdtemp(join(root, 'code-anime-'));
    return new FileSessionStore(directory, options);
  }

  private async readSession(id: string): Promise<FlowSession> {
    const path = join(this.directory, id + '.json');
    const info = await lstat(path);
    if (!info.isFile() || info.size > this.options.maxSessionBytes)
      throw new Error(`Invalid or oversized stored session: ${id}`);
    // O_NOFOLLOW prevents a replaced session path from redirecting reads on
    // POSIX. On Windows it is unavailable, so also check file identity below.
    const handle = await open(
      path,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
    let contents: string;
    try {
      const opened = await handle.stat();
      if (
        !opened.isFile() ||
        opened.size > this.options.maxSessionBytes ||
        opened.dev !== info.dev ||
        opened.ino !== info.ino
      )
        throw new Error(`Invalid or oversized stored session: ${id}`);
      contents = await handle.readFile({ encoding: 'utf8' });
    } finally {
      await handle.close();
    }
    if (Buffer.byteLength(contents) > this.options.maxSessionBytes)
      throw new Error(`Oversized stored session: ${id}`);
    const raw = JSON.parse(contents) as FlowSession;
    if (
      raw.id !== id ||
      typeof raw.createdAt !== 'string' ||
      !Number.isFinite(Date.parse(raw.createdAt))
    )
      throw new Error(`Invalid stored session metadata: ${id}`);
    return { id, createdAt: raw.createdAt, flow: flowSchema.parse(raw.flow) };
  }

  private async quarantine(id: string, reason: unknown) {
    // Rename the directory entry itself (including a swapped-in symlink).
    // Never read or delete the target of an untrusted session path.
    const quarantine = join(this.directory, '.code-anime-corrupt');
    await mkdir(quarantine, { recursive: true, mode: 0o700 });
    try {
      await rename(
        join(this.directory, id + '.json'),
        join(quarantine, `${id}-${randomUUID()}.json`),
      );
      console.warn(
        `[code-anime] Quarantined invalid saved session ${id}: ${reason instanceof Error ? reason.message : String(reason)}`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    this.index.delete(id);
  }

  private async recover() {
    for (const entry of await readdir(this.directory, {
      withFileTypes: true,
    })) {
      if (!entry.isFile()) continue;
      const id = entry.name.replace(/\.json(?:\.tmp)?$/, '');
      if (!sessionIdSchema.safeParse(id).success) continue;
      if (entry.name === id + '.json.tmp') {
        await rm(join(this.directory, entry.name), { force: true });
        continue;
      }
      if (entry.name !== id + '.json') continue;
      try {
        const session = await this.readSession(id);
        this.index.set(id, {
          createdAt: session.createdAt,
          ...((session.flow.trace?.recording ?? session.flow.trace?.simulation)
            ?.previousSessionId
            ? {
                previousSessionId: (session.flow.trace?.recording ??
                  session.flow.trace?.simulation)!.previousSessionId!,
              }
            : {}),
        });
      } catch (error) {
        // Keep damaged files available for inspection without blocking valid
        // sessions from opening. Never deserialize or expose the bad content.
        await this.quarantine(id, error);
      }
    }
    await this.pruneExpired();
  }

  private async releaseLock() {
    if (!this.lockOwner) return;
    const lockPath = join(this.directory, '.code-anime.lock');
    try {
      const current = JSON.parse(await readFile(lockPath, 'utf8')) as {
        owner?: string;
      };
      if (current.owner === this.lockOwner) await rm(lockPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    this.lockOwner = undefined;
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
    await this.pruneExpired();
    if (this.index.size >= this.options.maxSessions)
      throw new Error(
        'Session limit reached; delete saved sessions or wait for expiry',
      );
    const target = join(this.directory, session.id + '.json');
    const temporary = target + '.tmp';
    try {
      await writeFile(temporary, data, {
        encoding: 'utf8',
        mode: 0o600,
        flag: 'wx',
      });
      await rename(temporary, target);
      const previousSessionId = (
        flow.trace?.recording ?? flow.trace?.simulation
      )?.previousSessionId;
      this.index.set(session.id, {
        createdAt: session.createdAt,
        ...(previousSessionId ? { previousSessionId } : {}),
      });
    } finally {
      await rm(temporary, { force: true });
    }
    return session;
  }

  async get(id: string): Promise<FlowSession | undefined> {
    sessionIdSchema.parse(id);
    if (this.closed || !this.index.has(id)) return undefined;
    const path = join(this.directory, id + '.json');
    try {
      const session = await this.readSession(id);
      if (Date.now() - Date.parse(session.createdAt) >= this.options.ttlMs) {
        await rm(path, { force: true });
        this.index.delete(id);
        return undefined;
      }
      return session;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.index.delete(id);
        return undefined;
      }
      // Another process may have edited a saved file after recovery. Remove
      // that session from the live index while keeping its bytes for diagnosis.
      await this.quarantine(id, error);
      return undefined;
    }
  }

  private async pruneExpired() {
    for (const [id, metadata] of this.index) {
      if (Date.now() - Date.parse(metadata.createdAt) >= this.options.ttlMs) {
        await rm(join(this.directory, id + '.json'), { force: true });
        this.index.delete(id);
      }
    }
  }

  private async sessions(): Promise<FlowSession[]> {
    const sessions: FlowSession[] = [];
    for (const id of this.index.keys()) {
      const session = await this.get(id);
      if (session) sessions.push(session);
    }
    return sessions;
  }

  async next(id: string): Promise<FlowSession | undefined> {
    sessionIdSchema.parse(id);
    if (this.closed) return undefined;
    for (const [candidate, metadata] of this.index) {
      if (metadata.previousSessionId !== id) continue;
      const session = await this.get(candidate);
      if (session) return session;
    }
    return undefined;
  }

  async list(): Promise<FlowSession[]> {
    return this.closed ? [] : this.sessions();
  }
  async delete(id: string): Promise<boolean> {
    sessionIdSchema.parse(id);
    if (!(await this.get(id))) return false;
    await rm(join(this.directory, id + '.json'), { force: true });
    this.index.delete(id);
    return true;
  }

  async latest(): Promise<FlowSession | undefined> {
    if (this.closed) return undefined;
    const candidates = [...this.index].sort((a, b) =>
      b[1].createdAt.localeCompare(a[1].createdAt),
    );
    for (const [id] of candidates) {
      const session = await this.get(id);
      if (session) return session;
    }
    return undefined;
  }

  close(): Promise<void> {
    this.closed = true;
    return (this.shutdown ??= (async () => {
      await this.queue;
      if (this.options.persistentDirectory) await this.releaseLock();
      else await rm(this.directory, { recursive: true, force: true });
      this.index.clear();
    })());
  }
}
