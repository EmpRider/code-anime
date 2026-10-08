import { z } from 'zod';

// Keep the legacy tool payload stable; all external inputs cross this boundary.
export const flowSchema = z
  .object({
    endpoint: z.string().trim().min(1).max(200),
    steps: z
      .array(
        z
          .object({
            from: z.string().trim().min(1).max(200),
            to: z.string().trim().min(1).max(200),
            dtoName: z.string().trim().min(1).max(200),
            dtoFields: z.record(z.unknown()),
          })
          .strict(),
      )
      .min(1)
      .max(2000),
  })
  .strict();
export type Flow = z.infer<typeof flowSchema>;
export const sessionIdSchema = z.string().uuid();
export interface FlowSession {
  id: string;
  createdAt: string;
  flow: Flow;
}
export interface SessionStore {
  create(flow: Flow): Promise<FlowSession>;
  get(id: string): Promise<FlowSession | undefined>;
  latest(): Promise<FlowSession | undefined>;
  close(): Promise<void>;
}
