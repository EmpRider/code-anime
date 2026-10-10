import { z } from 'zod';
export const sourceSchema = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  endLine: z.number().int().positive(),
  // When a verified source map rewrites V8's generated location, retain the
  // debugger-observed generated position for provenance and troubleshooting.
  generated: z
    .object({ file: z.string(), line: z.number().int().positive() })
    .optional(),
});
export const eventSchema = z.object({
  id: z.string(),
  kind: z.enum([
    'enter',
    'statement',
    'call',
    'return',
    'assign',
    'transform',
    'mutate',
    'branch',
    'loop',
    'await',
    'yield',
    'resume',
    'throw',
    'catch',
    'console',
    'unresolved',
    'plan',
  ]),
  symbolId: z.string(),
  label: z.string(),
  callId: z.string(),
  parentCallId: z.string().optional(),
  source: sourceSchema.optional(),
  values: z.record(z.unknown()),
  evidenceIds: z.array(z.string().uuid()).optional(),
  inputs: z.record(z.unknown()).optional(),
  result: z.unknown().optional(),
  output: z.string().optional(),
  before: z.record(z.unknown()).optional(),
  after: z.record(z.unknown()).optional(),
  objectId: z.string().optional(),
  origins: z.record(z.string()).optional(),
  objects: z.record(z.record(z.unknown())).optional(),
  locals: z.record(z.unknown()).optional(),
  snippet: z.string().max(800).optional(),
  stack: z.array(z.string()),
  certainty: z.enum([
    'observed',
    'static',
    'mock',
    'assumed',
    'unresolved',
    'proposed',
  ]),
  note: z.string().optional(),
});
export const traceSchema = z
  .object({
    version: z.literal(2),
    provider: z.string(),
    projectRoot: z.string(),
    sourceHash: z.string(),
    target: z.string(),
    scenario: z.record(z.unknown()),
    events: z.array(eventSchema).max(2000),
    // Exact on-disk source snapshots captured while the session is prepared.
    // Keys match event.source.file, independent of the source language.
    sourceFiles: z.record(z.string()).optional(),
    diagnostics: z.array(z.string()),
    truncated: z.boolean(),
    filesAnalyzed: z.number(),
    cacheHits: z.number(),
    recording: z
      .object({
        mode: z.literal('runtime'),
        language: z.string(),
        runId: z.string().uuid(),
        complete: z.boolean(),
        coverage: z.string(),
        previousSessionId: z.string().uuid().optional(),
      })
      .optional(),
    simulation: z
      .object({
        mode: z.literal('ai-mock'),
        complete: z.boolean(),
        coverage: z.string(),
        evidenceIds: z.array(z.string().uuid()),
        previousSessionId: z.string().uuid().optional(),
        baselineSessionId: z.string().uuid().optional(),
      })
      .optional(),
  })
  .superRefine((trace, context) => {
    if (trace.recording && trace.simulation)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A trace cannot be both runtime-recorded and AI-simulated',
      });
    if (
      trace.recording &&
      trace.events.some((event) => event.certainty !== 'observed')
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Runtime recordings may contain only observed events',
      });
  });
export type Trace = z.infer<typeof traceSchema>;
export type TraceEvent = z.infer<typeof eventSchema>;
