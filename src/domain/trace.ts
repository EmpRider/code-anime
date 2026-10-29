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
const groupIdSchema = z.string().min(1).max(200);
export const semanticGroupSchema = z
  .object({
    id: groupIdSchema,
    kind: z.enum([
      'decision',
      'branch',
      'loop',
      'iteration',
      'try',
      'catch',
      'finally',
      'switch',
      'case',
      'lambda',
      'sequence',
      'unresolved',
    ]),
    title: z.string().trim().min(1).max(800),
    callId: groupIdSchema,
    taskId: z.string().min(1).max(100).optional(),
    parentGroupId: groupIdSchema.optional(),
    memberEventIds: z.array(groupIdSchema).max(2000),
    source: sourceSchema
      .extend({
        file: z.string().min(1).max(4096),
        line: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        endLine: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        generated: z
          .object({
            file: z.string().min(1).max(4096),
            line: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
          })
          .optional(),
      })
      .optional(),
    evidenceIds: z.array(z.string().uuid()).max(200).optional(),
    // Receipts establish retrieval, never the truth of a simulated arm.
    certainty: z.enum(['mock', 'assumed', 'unresolved']),
    arm: z
      .object({ id: groupIdSchema, label: z.string().max(800) })
      .strict()
      .optional(),
    iteration: z
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER)
      .optional(),
  })
  .strict()
  .superRefine((group, ctx) => {
    if (group.arm && group.kind !== 'branch' && group.kind !== 'case')
      ctx.addIssue({
        code: 'custom',
        path: ['arm'],
        message: 'Only branch/case groups have arms',
      });
    if ((group.kind === 'iteration') !== (group.iteration !== undefined))
      ctx.addIssue({
        code: 'custom',
        path: ['iteration'],
        message: 'Iteration index is required only for iteration groups',
      });
    if (group.source && group.source.endLine < group.source.line)
      ctx.addIssue({
        code: 'custom',
        path: ['source'],
        message: 'Invalid semantic group source range',
      });
  });
export type SemanticGroup = z.infer<typeof semanticGroupSchema>;

export const traceSchema = z
  .object({
    version: z.literal(2),
    provider: z.string(),
    projectRoot: z.string(),
    sourceHash: z.string(),
    target: z.string(),
    scenario: z.record(z.unknown()),
    events: z.array(eventSchema).max(2000),
    // Continuations repeat parent definitions and contain only local event IDs.
    semanticGroups: z.array(semanticGroupSchema).max(2000).optional(),
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
  })
  .superRefine((trace, ctx) => {
    if (!trace.semanticGroups) return;
    const groups = new Map<string, SemanticGroup>();
    const events = new Map(trace.events.map((event) => [event.id, event]));
    const evidence = trace.simulation
      ? new Set(trace.simulation.evidenceIds)
      : undefined;
    const lineCounts = new Map<string, number>();
    const siblingArmMembers = new Map<string, Set<string>>();
    const issue = (index: number, field: string, message: string) =>
      ctx.addIssue({
        code: 'custom',
        path: ['semanticGroups', index, field],
        message,
      });
    if (events.size !== trace.events.length)
      ctx.addIssue({
        code: 'custom',
        path: ['events'],
        message: 'Semantic groups require unique event IDs',
      });
    for (const [index, group] of trace.semanticGroups.entries()) {
      if (groups.has(group.id))
        issue(index, 'id', 'Duplicate semantic group ID');
      groups.set(group.id, group);
    }
    for (const [index, group] of trace.semanticGroups.entries()) {
      const members = new Set<string>();
      let siblingMembers: Set<string> | undefined;
      if (
        group.parentGroupId &&
        (group.kind === 'branch' || group.kind === 'case')
      ) {
        siblingMembers = siblingArmMembers.get(group.parentGroupId);
        if (!siblingMembers) {
          siblingMembers = new Set();
          siblingArmMembers.set(group.parentGroupId, siblingMembers);
        }
      }
      for (const id of group.memberEventIds) {
        if (members.has(id))
          issue(index, 'memberEventIds', 'Duplicate member event ID');
        members.add(id);
        if (siblingMembers?.has(id))
          issue(
            index,
            'memberEventIds',
            'Sibling arms cannot share member events',
          );
        const event = events.get(id);
        if (!event)
          issue(index, 'memberEventIds', 'Unknown local member event ID');
        else {
          if (
            event.callId !== group.callId ||
            (event.taskId ?? 'main') !== (group.taskId ?? 'main')
          )
            issue(
              index,
              'memberEventIds',
              'Member invocation/task does not match group',
            );
          // A CodeGraph group location may identify its header, not its body.
          if (
            group.source &&
            event.source &&
            group.source.file !== event.source.file
          )
            issue(index, 'source', 'Member source file does not match group');
        }
      }
      for (const id of members) siblingMembers?.add(id);
      for (const id of group.evidenceIds ?? [])
        if (evidence && !evidence.has(id))
          issue(index, 'evidenceIds', 'Unknown trace evidence receipt');
      if (
        group.source &&
        trace.sourceFiles &&
        Object.hasOwn(trace.sourceFiles, group.source.file)
      ) {
        let count = lineCounts.get(group.source.file);
        if (count === undefined) {
          count =
            trace.sourceFiles[group.source.file]!.split(/\r\n|\r|\n/).length;
          lineCounts.set(group.source.file, count);
        }
        if (group.source.endLine > count)
          issue(index, 'source', 'Group range exceeds source snapshot');
      }
      const seen = new Set([group.id]);
      let current = group;
      while (current.parentGroupId) {
        const parent = groups.get(current.parentGroupId);
        if (!parent) {
          issue(index, 'parentGroupId', 'Unknown local parent group');
          break;
        }
        if (seen.has(parent.id)) {
          issue(index, 'parentGroupId', 'Semantic group parent cycle');
          break;
        }
        if (
          parent.callId !== group.callId ||
          (parent.taskId ?? 'main') !== (group.taskId ?? 'main')
        ) {
          issue(
            index,
            'parentGroupId',
            'Parent invocation/task does not match group',
          );
          break;
        }
        seen.add(parent.id);
        current = parent;
      }
    }
  });
export type Trace = z.infer<typeof traceSchema>;
export type TraceEvent = z.infer<typeof eventSchema>;
