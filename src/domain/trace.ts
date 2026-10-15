import { z } from 'zod';
// Zod's ordinary record parser skips the "__proto__" key to defend against
// prototype mutation. Source paths are arbitrary filenames, so validate this
// dictionary explicitly and preserve every *own* key on serialization.
const sourceFilesSchema = z.custom<Record<string, string>>(
  (value) =>
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null) &&
    Object.values(value).every((content) => typeof content === 'string'),
  { message: 'Source snapshots must map filenames to source text' },
);
// Mock object IDs are agent-defined and may be legitimate keys that JavaScript
// normally inherits (including __proto__). Retain every own key when validating
// snapshots, just as we do for arbitrary source filenames above.
const objectSnapshotsSchema = z.custom<Record<string, Record<string, unknown>>>(
  (value) =>
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null) &&
    Object.values(value).every(
      (fields) =>
        fields !== null &&
        typeof fields === 'object' &&
        !Array.isArray(fields) &&
        (Object.getPrototypeOf(fields) === Object.prototype ||
          Object.getPrototypeOf(fields) === null),
    ),
  { message: 'Mock objects must map object IDs to field dictionaries' },
);
export const sourceSchema = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  endLine: z.number().int().positive(),
  // Preserve provided generated-source provenance when available.
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
  // Logical AI-simulated task. Omitted values belong to the default task.
  taskId: z.string().min(1).max(100).optional(),
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
  objects: objectSnapshotsSchema.optional(),
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
  // Exact on-disk source snapshots captured while the session is prepared.
  // Keys match event.source.file, independent of the source language.
  sourceFiles: sourceFilesSchema.optional(),
  diagnostics: z.array(z.string()),
  truncated: z.boolean(),
  filesAnalyzed: z.number(),
  cacheHits: z.number(),
  simulation: z
    .object({
      mode: z.literal('ai-mock'),
      complete: z.boolean(),
      coverage: z.string(),
      evidenceIds: z.array(z.string().uuid()),
      // Scenario completion and exhaustive CodeGraph coverage are separate.
      // No amount of receipt paging alone can prove all graph edges were found.
      coverageAssessment: z
        .object({
          status: z.enum([
            'unknown',
            'partial',
            'unresolved',
            'provider-truncated',
          ]),
          reasons: z.array(z.string()),
        })
        .optional(),
      // File-level contradictions from structured CodeGraph node locations.
      // Retained across continuations so later chunks cannot certify them.
      provenanceIssues: z.array(z.string()).optional(),
      previousSessionId: z.string().uuid().optional(),
      baselineSessionId: z.string().uuid().optional(),
    })
    .optional(),
});
export type Trace = z.infer<typeof traceSchema>;
export type TraceEvent = z.infer<typeof eventSchema>;
