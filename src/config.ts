import { tmpdir } from 'node:os';
import { z } from 'zod';

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    port: z.coerce
      .number()
      .int()
      .min(0)
      .max(65535)
      .parse(env.CODE_ANIME_PORT ?? 0),
    tempRoot: env.CODE_ANIME_TEMP_DIR ?? tmpdir(),
    persistentDirectory: env.CODE_ANIME_SESSION_DIR || undefined,
    ttlMs: z.coerce
      .number()
      .int()
      .positive()
      .parse(env.CODE_ANIME_TTL_MS ?? 3600000),
    maxSessionBytes: 10 * 1024 * 1024,
    maxSessions: 100,
  };
}
export type Config = ReturnType<typeof readConfig>;
