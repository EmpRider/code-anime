import { z } from 'zod';
export const sourceSchema = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  endLine: z.number().int().positive(),
});
export const eventSchema = z.object({
  id: z.string(),
  kind: z.enum([
    'enter',
    'call',
    'return',
    'assign',
    'mutate',
    'branch',
    'loop',
    'await',
    'throw',
    'unresolved',
    'plan',
  ]),
  symbolId: z.string(),
  label: z.string(),
  callId: z.string(),
  parentCallId: z.string().optional(),
  source: sourceSchema.optional(),
  values: z.record(z.unknown()),
  locals: z.record(z.unknown()).optional(),
  snippet: z.string().max(800).optional(),
  stack: z.array(z.string()),
  certainty: z.enum(['static', 'mock', 'assumed', 'unresolved', 'proposed']),
  note: z.string().optional(),
});
export const traceSchema = z.object({
  version: z.literal(2),
  provider: z.string(),
  projectRoot: z.string(),
  sourceHash: z.string(),
  target: z.string(),
  scenario: z.record(z.unknown()),
  events: z.array(eventSchema).max(2000),
  diagnostics: z.array(z.string()),
  truncated: z.boolean(),
  filesAnalyzed: z.number(),
  cacheHits: z.number(),
});
export type Trace = z.infer<typeof traceSchema>;
export type TraceEvent = z.infer<typeof eventSchema>;
