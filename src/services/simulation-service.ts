import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  parseNodes,
  readNativeEvidence,
} from '../analysis/native-codegraph.js';
import { traceToFlow } from '../analysis/contract.js';
import {
  eventSchema,
  semanticGroupSchema,
  type Trace,
  type TraceEvent,
} from '../domain/trace.js';
import { flowSchema, type SessionStore } from '../domain/flow.js';
import {
  collectSourceFiles,
  collectSourceLocations,
  sourceBoundary,
} from './source-catalog.js';
import { checkInvocationIntegrity } from './invocation-integrity.js';
import type {
  AcceptedSceneInput,
  SceneCompletion,
  SourceLocation,
} from '../domain/scene-input.js';

export const evidenceRequestSchema = z
  .object({
    projectRoot: z.string().min(1),
    tool: z
      .enum(['explore', 'node', 'search', 'callees', 'files'])
      .default('explore'),
    arguments: z.record(z.unknown()).default({}),
    evidenceId: z.string().uuid().optional(),
    offset: z.number().int().min(0).default(0),
    limit: z.number().int().min(100).max(32000).default(16000),
  })
  .strict();
export const simulationSchema = z
  .object({
    projectRoot: z.string().min(1),
    endpoint: z.string().min(1).max(200),
    evidenceIds: z.array(z.string().uuid()).min(1).max(200),
    scenario: z.record(z.unknown()).default({}),
    events: z.array(eventSchema).min(1).max(2000).optional(),
    semanticGroups: z.array(semanticGroupSchema).max(2000).optional(),
    steps: flowSchema.shape.steps.optional(),
    complete: z.boolean().default(true),
    coverage: z.string().min(1).max(4000),
    continuationOf: z.string().uuid().optional(),
    baselineSessionId: z.string().uuid().optional(),
  })
  .strict()
  .refine(
    (p) => Boolean(p.events) !== Boolean(p.steps),
    'Supply events or steps, not both',
  );

interface Evidence {
  id: string;
  projectRoot: string;
  tool: string;
  text: string;
  hash: string;
  files: number;
  createdAt: number;
  readRanges: Array<[number, number]>;
  providerBoundary?: string;
  nodeSourceFiles?: string[];
  nodeDefinitions?: Array<{ name: string; file: string; line: number }>;
}
// Compare CodeGraph node locations without interpreting the source language.
// Paths can be absolute or relative to the indexed project.
function sourceIdentity(root: string, file: string) {
  const path = resolve(root, file);
  return process.platform === 'win32' ? path.toLowerCase() : path;
}
const hashSemanticDefinition = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

function sourceProvenanceIssues(
  root: string,
  events: TraceEvent[],
  evidence: Evidence[],
) {
  const receipts = new Map(evidence.map((item) => [item.id, item]));
  const issues: string[] = [];
  for (const event of events) {
    if (!event.source || !event.evidenceIds?.length) continue;
    if (event.certainty === 'unresolved') continue;
    const cited = event.evidenceIds.map((id) => receipts.get(id));
    const actual = sourceIdentity(root, event.source.file);
    // An exact matching CodeGraph definition is strong evidence about where
    // an invocation begins. Do not let a second, less structured receipt
    // suppress a contradiction found in the matching node definition.
    if (event.kind === 'enter') {
      const definitions = cited.flatMap((item) => item?.nodeDefinitions ?? []);
      const matching = definitions.filter(
        (definition) =>
          event.symbolId === definition.name ||
          event.symbolId ===
            `${definition.name}@${definition.file}:${definition.line}`,
      );
      if (matching.length) {
        if (
          !matching.some(
            (definition) =>
              sourceIdentity(root, definition.file) === actual &&
              event.source!.line >= definition.line,
          )
        )
          issues.push(
            `Entry event ${event.id} (${event.symbolId}) cites a CodeGraph definition at another file or a later declaration than ${event.source.file}:${event.source.line}; correct the source location or mark coverage incomplete.`,
          );
        continue;
      }
      // A node receipt for some other method in the same file does not
      // establish that this simulated invocation has a real definition.
      // Only enforce the symbol match when every cited receipt is structured
      // node evidence; broader search/callee receipts may support aliases.
      if (
        cited.length &&
        cited.every(
          (item) => item?.tool === 'node' && item.nodeDefinitions?.length,
        )
      ) {
        issues.push(
          `Entry event ${event.id} (${event.symbolId}) cites no matching CodeGraph method definition; retrieve node evidence for this symbol or mark coverage incomplete.`,
        );
        continue;
      }
    }
    // A file mismatch is conclusive only when *all* cited receipts contain
    // structured CodeGraph node locations. Other query types may carry valid
    // support not expressible as node locations.
    if (
      cited.some(
        (item) =>
          !item || item.tool !== 'node' || !item.nodeSourceFiles?.length,
      )
    )
      continue;
    if (
      cited.some((item) =>
        item!.nodeSourceFiles!.some(
          (file) => sourceIdentity(root, file) === actual,
        ),
      )
    )
      continue;
    issues.push(
      `Event ${event.id} cites CodeGraph node evidence for another file, not ${event.source.file}; retrieve node evidence for this source or mark coverage incomplete.`,
    );
  }
  return issues;
}
// Inspect CodeGraph's own result metadata, excluding fenced source snippets.
// A fully read MCP response can still represent only a subset of graph edges.
function providerBoundary(
  text: string,
  tool: string,
  args: Record<string, unknown>,
): string | undefined {
  let fenced = false;
  let confirmedCompleteCount = false;
  let reportedRelationships: number | undefined;
  const parsedEdges: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (
      tool === 'callees' &&
      /\b(?:distinct definitions|Aggregated results across)\b/i.test(line)
    )
      return 'Callee response combines multiple definitions; select a specific method and source file before claiming coverage';
    if (
      tool === 'callees' &&
      /^- .+? \([\w_]+\) - .+:\d+(?: — via .+)?\s*$/.test(line)
    )
      parsedEdges.push(line.trimEnd());
    const metadata = line.replace(/^\s*(?:>\s*)?(?:\*\*)?/, '').trim();
    const shown = metadata.match(
      /^(?:Showing|Displaying|Returned)\s+([\d,]+)\s+(?:of|out of)\s+([\d,]+)\b/i,
    );
    if (shown) {
      if (tool === 'callees')
        reportedRelationships = Number(shown[1]!.replaceAll(',', ''));
      if (
        Number(shown[1]!.replaceAll(',', '')) <
        Number(shown[2]!.replaceAll(',', ''))
      )
        return metadata.slice(0, 180);
      confirmedCompleteCount = true;
    }
    if (
      /^(?:\.\.\.|…)[ \t]*\+[ \t]*\d+[ \t]+(?:more|results?|symbols?|items?|files?|relationships?|callees?|matches?)\b/i.test(
        metadata,
      ) ||
      /^(?:(?:Warning|Note|CodeGraph|Results?|Response|Output)[\s:*-]+)?(?:truncated\b|truncation\b|\d+\s+(?:additional|more)\s+\w+\s+(?:omitted|not shown)\b)/i.test(
        metadata,
      )
    )
      return metadata.slice(0, 180);
  }
  if (tool === 'callees' && reportedRelationships !== undefined) {
    // CodeGraph's summary is not proof that the content actually contains
    // that many distinguishable edges. A partial or duplicated provider
    // response must remain visibly incomplete to the host AI.
    const uniqueEdges = new Set(parsedEdges);
    if (uniqueEdges.size < reportedRelationships)
      return `CodeGraph reported ${reportedRelationships} callee relationships but supplied only ${uniqueEdges.size} distinct parseable edges; source coverage is incomplete`;
  }
  // CodeGraph may return exactly the requested number of callees without
  // reporting the total. That is a possible undisclosed coverage boundary:
  // the agent must request a larger limit before claiming completeness.
  // Recognize the provider's documented relationship rows, not source code.
  const requested = args.limit;
  if (tool === 'callees' && !confirmedCompleteCount) {
    if (
      typeof requested !== 'number' ||
      !Number.isInteger(requested) ||
      requested <= 0
    ) {
      if (
        /^(?:No callees found|- \(no callees\)|\*\*Callees of .*\(0 found\))/m.test(
          text,
        )
      )
        return undefined;
      return 'Callee query has no explicit positive relationship limit or confirmed total; request a bounded, verifiable CodeGraph result';
    }
    let fenced = false;
    let count = 0;
    for (const line of text.split(/\r?\n/)) {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced;
        continue;
      }
      if (!fenced && /^- .+ \([\w_]+\) - .+:\d+(?:\s|$)/.test(line)) count++;
    }
    if (count >= requested)
      return `Reached requested callee limit ${requested} without a confirmed relationship total; additional relationships may exist`;
  }
  return undefined;
}
function recordRead(item: Evidence, start: number, end: number) {
  if (start >= end) return;
  const ranges = [...item.readRanges, [start, end] as [number, number]].sort(
    (a, b) => a[0] - b[0],
  );
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  item.readRanges = merged;
}
function nextUnreadOffset(item: Evidence) {
  let cursor = 0;
  for (const [start, end] of item.readRanges) {
    if (start > cursor) break;
    cursor = Math.max(cursor, end);
  }
  return cursor < item.text.length ? cursor : null;
}

// A complete *mock scenario* does not establish exhaustive source coverage.
// Only classify boundaries supported by concrete evidence; never infer that
// the absence of a truncation message means CodeGraph found every edge.
function assessCoverage(
  complete: boolean,
  evidence: Evidence[],
  events: TraceEvent[],
  sourceDiagnostics: string[],
  provenanceIssues: string[],
  legacySteps: boolean,
  ancestorProblems: string[],
): NonNullable<NonNullable<Trace['simulation']>['coverageAssessment']> {
  const provider = evidence
    .filter((item) => item.providerBoundary)
    .map(
      (item) =>
        `CodeGraph ${item.tool} receipt ${item.id}: ${item.providerBoundary}`,
    );
  const unresolved = [
    ...evidence
      .filter((item) => nextUnreadOffset(item) !== null)
      .map((item) => `Unread CodeGraph ${item.tool} receipt ${item.id}`),
    ...provenanceIssues,
    ...sourceDiagnostics,
    ...ancestorProblems,
    ...(legacySteps ? ['Legacy steps omit source and invocation detail'] : []),
    ...events
      .filter(
        (event) =>
          event.kind === 'unresolved' ||
          event.certainty === 'unresolved' ||
          !event.source,
      )
      .map((event) => `Unresolved or unlocated mock event ${event.id}`),
  ];
  if (provider.length)
    return {
      status: 'provider-truncated',
      reasons: [...new Set([...provider, ...unresolved])],
    };
  if (unresolved.length)
    return { status: 'unresolved', reasons: [...new Set(unresolved)] };
  if (!complete)
    return {
      status: 'partial',
      reasons: [
        'Mock scenario is not yet complete; remaining paths are unverified',
      ],
    };
  return {
    status: 'unknown',
    reasons: [
      'The submitted mock scenario is complete, but CodeGraph receipts cannot prove exhaustive source or relationship discovery',
    ],
  };
}
// Only evidence obtained from CodeGraph creates a receipt. No source-file reads.
export class SimulationService {
  private readonly evidence = new Map<string, Evidence>();
  private readonly controller = new AbortController();
  constructor(
    private readonly store: SessionStore,
    private readonly baseUrl: string,
    private readonly resolveRoot: (root: string) => Promise<string>,
    private readonly provider = readNativeEvidence,
  ) {}
  private prune() {
    for (const [id, item] of this.evidence)
      if (Date.now() - item.createdAt > 3600000) this.evidence.delete(id);
  }
  async read(raw: unknown) {
    const p = evidenceRequestSchema.parse(raw);
    const root = await this.resolveRoot(p.projectRoot);
    this.prune();
    let item = p.evidenceId ? this.evidence.get(p.evidenceId) : undefined;
    if (p.evidenceId && (!item || item.projectRoot !== root))
      throw new Error(
        'CodeGraph evidence expired or belongs to a different project; retrieve it again.',
      );
    if (!item) {
      if (this.evidence.size >= 200)
        throw new Error(
          'Evidence limit reached; complete the current flow or start a new server session.',
        );
      if (Buffer.byteLength(JSON.stringify(p.arguments)) > 32000)
        throw new Error('Evidence query is too large');
      const result = await this.provider(
        root,
        p.tool,
        p.arguments,
        this.controller.signal,
      );
      const boundary = providerBoundary(result.text, p.tool, p.arguments);
      const nodeDefinitions =
        p.tool === 'node'
          ? parseNodes(result.text).map(({ name, file, line }) => ({
              name,
              file,
              line,
            }))
          : undefined;
      item = {
        id: randomUUID(),
        projectRoot: root,
        tool: p.tool,
        text: result.text,
        hash: createHash('sha256').update(result.text).digest('hex'),
        files: result.files,
        createdAt: Date.now(),
        readRanges: [],
        ...(nodeDefinitions
          ? {
              nodeDefinitions,
              nodeSourceFiles: [
                ...new Set(nodeDefinitions.map((node) => node.file)),
              ],
            }
          : {}),
        ...(boundary ? { providerBoundary: boundary } : {}),
      };
      this.evidence.set(item.id, item);
    }
    const end = Math.min(item.text.length, p.offset + p.limit);
    recordRead(item, p.offset, end);
    return {
      evidenceId: item.id,
      projectRoot: root,
      tool: item.tool,
      text: item.text.slice(p.offset, end),
      sourceHash: item.hash,
      offset: p.offset,
      nextOffset: end < item.text.length ? end : null,
      nextUnreadOffset: nextUnreadOffset(item),
      totalCharacters: item.text.length,
      providerTruncated: Boolean(item.providerBoundary),
      ...(item.nodeSourceFiles?.length
        ? { nodeSourceFiles: item.nodeSourceFiles }
        : {}),
      ...(item.providerBoundary
        ? { providerBoundary: item.providerBoundary }
        : {}),
      guidance:
        'Read all relevant source pages and resolve helpers/DTOs through CodeGraph. Send compact steps directly to build_mock_animation; never create/run a script or write a payload file. The MCP server owns trace assembly, snapshots, chunking and persistence. Provider truncation must be resolved with node file offset/limit queries or reported as incomplete.',
    };
  }
  async checkEvidence(projectRoot: string, evidenceIds: string[]) {
    const root = await this.resolveRoot(projectRoot);
    this.prune();
    const evidence = evidenceIds.map((id) => {
      const item = this.evidence.get(id);
      if (!item || item.projectRoot !== root)
        throw new Error(
          'CodeGraph evidence is required for this project; retrieve current evidence before generating an animation.',
        );
      return item;
    });
    if (!evidence.some((e) => ['node', 'explore'].includes(e.tool)))
      throw new Error(
        'Retrieve CodeGraph source evidence using node or explore before simulation.',
      );
    return { root, evidence };
  }
  async validateSceneEvidence(
    projectRoot: string,
    evidenceIds: string[],
    records: readonly {
      source?: TraceEvent['source'] | null;
      evidenceIds?: readonly string[] | undefined;
      certainty: TraceEvent['certainty'];
    }[],
  ) {
    const { root, evidence } = await this.checkEvidence(
      projectRoot,
      evidenceIds,
    );
    const receipts = new Map(evidence.map((item) => [item.id, item]));
    for (const record of records) {
      const cited = (record.evidenceIds ?? []).map((id) => {
        const receipt = receipts.get(id);
        if (!receipt)
          throw new Error(
            `Scene uses an unsupplied CodeGraph evidence receipt: ${id}`,
          );
        return receipt;
      });
      if (!record.source) continue;
      const boundary = sourceBoundary(root, record.source.file);
      if (boundary)
        throw new Error(`Scene source ${record.source.file}: ${boundary}`);
      if (record.source.generated) {
        const generatedBoundary = sourceBoundary(
          root,
          record.source.generated.file,
        );
        if (generatedBoundary)
          throw new Error(`Generated scene source: ${generatedBoundary}`);
      }
      if (
        record.certainty !== 'unresolved' &&
        cited.length &&
        cited.every(
          (item) => item.tool === 'node' && item.nodeSourceFiles?.length,
        ) &&
        !cited.some((item) =>
          item.nodeSourceFiles?.some(
            (file) =>
              sourceIdentity(root, file) ===
              sourceIdentity(root, record.source!.file),
          ),
        )
      )
        throw new Error(
          `Scene source cites CodeGraph node evidence for another file: ${record.source.file}`,
        );
    }
  }
  async prepareSceneEvidence(
    projectRoot: string,
    evidenceIds: string[],
    events: TraceEvent[],
    records: readonly {
      source?: SourceLocation | null;
      evidenceIds: readonly string[];
      certainty: TraceEvent['certainty'];
    }[],
    completion: SceneCompletion,
    signal: AbortSignal,
  ): Promise<{
    files: Record<string, string>;
    provenance: AcceptedSceneInput['provenance'];
    status: AcceptedSceneInput['status'];
  }> {
    signal.throwIfAborted();
    const { root, evidence } = await this.checkEvidence(
      projectRoot,
      evidenceIds,
    );
    signal.throwIfAborted();
    await this.validateSceneEvidence(root, evidenceIds, [
      ...events,
      ...records,
    ]);
    signal.throwIfAborted();
    for (const event of events) {
      if (!event.evidenceIds?.length)
        throw new Error(
          `Event ${event.id} must reference supplied CodeGraph evidenceIds`,
        );
    }
    checkInvocationIntegrity([events], completion.complete);
    const provenanceIssues = sourceProvenanceIssues(root, events, evidence);
    const locations = [...events, ...records].flatMap((record) => {
      if (!record.source) return [];
      const generated = record.source.generated;
      return [
        record.source,
        ...(generated
          ? [
              {
                file: generated.file,
                line: generated.line,
                endLine: generated.line,
              },
            ]
          : []),
      ];
    });
    const captured = await collectSourceLocations(root, locations);
    signal.throwIfAborted();
    for (const location of locations) {
      const text = captured.files[location.file];
      if (text !== undefined && location.endLine > text.split(/\r?\n/).length)
        throw new Error(
          `Scene source range exceeds captured source lines: ${location.file}`,
        );
    }
    const measured = assessCoverage(
      completion.complete,
      evidence,
      events,
      captured.diagnostics,
      provenanceIssues,
      false,
      [],
    );
    const provider = evidence.some((item) => Boolean(item.providerBoundary));
    const unread = evidence.some((item) => nextUnreadOffset(item) !== null);
    if (completion.coverage.status === 'provider-truncated' && !provider)
      throw new Error(
        'Authored provider-truncated coverage has no observed provider boundary',
      );
    if (
      completion.complete &&
      (measured.status === 'provider-truncated' ||
        measured.status === 'unresolved')
    )
      throw new Error(
        `Cannot mark mock scene complete: ${measured.reasons.join('; ')}`,
      );
    const reasons = [...completion.coverage.reasons];
    for (const reason of measured.reasons)
      if (!reasons.includes(reason)) reasons.push(reason);
    return {
      files: captured.files,
      provenance: {
        provider: 'codegraph',
        simulationMode: 'ai-mock',
        receipts: evidence.map((item) => ({
          id: item.id,
          tool: item.tool,
          queryDigest: item.hash,
          ...(item.providerBoundary === undefined
            ? {}
            : { providerBoundary: item.providerBoundary }),
        })),
      },
      status: {
        complete: completion.complete,
        truncated: provider || unread,
        coverage: {
          status:
            measured.status === 'provider-truncated' ||
            measured.status === 'unresolved'
              ? measured.status
              : completion.coverage.status,
          reasons,
        },
        warnings: [...provenanceIssues],
        diagnostics: [
          'AI-simulated values from CodeGraph evidence; repository code and external effects were not executed.',
          'Evidence receipts verify retrieval and project identity, not the semantic correctness of AI calculations.',
          ...captured.diagnostics,
        ],
      },
    };
  }
  async validateSemanticGroupEvidence(
    projectRoot: string,
    groups: readonly {
      source?: { file: string; line: number; endLine: number } | undefined;
      evidenceIds?: string[] | undefined;
      certainty: 'mock' | 'assumed' | 'unresolved';
    }[],
    acceptedEvidenceIds?: readonly string[],
  ) {
    if (!groups.length) return;
    const root = await this.resolveRoot(projectRoot);
    this.prune();
    for (const group of groups) {
      if (group.certainty !== 'unresolved' && !group.source)
        throw new Error(
          'Resolved semantic groups need CodeGraph-cited source locations',
        );
      if (group.source && !group.evidenceIds?.length)
        throw new Error('Semantic group source requires CodeGraph evidenceIds');
      if (group.source) {
        const boundary = sourceBoundary(root, group.source.file);
        if (boundary)
          throw new Error(
            `Semantic group source ${group.source.file}: ${boundary}`,
          );
      }
      const cited = (group.evidenceIds ?? []).map((id) => {
        if (acceptedEvidenceIds && !acceptedEvidenceIds.includes(id))
          throw new Error(
            `Semantic group uses an unsupplied CodeGraph evidence receipt: ${id}`,
          );
        const receipt = this.evidence.get(id);
        if (!receipt || receipt.projectRoot !== root)
          throw new Error(
            'Semantic group CodeGraph evidence expired or belongs to another project',
          );
        return receipt;
      });
      if (!group.source || !cited.length) continue;
      const actual = sourceIdentity(root, group.source.file);
      if (
        cited.every(
          (item) => item.tool === 'node' && item.nodeSourceFiles?.length,
        ) &&
        !cited.some((item) =>
          item.nodeSourceFiles?.some(
            (file) => sourceIdentity(root, file) === actual,
          ),
        )
      )
        throw new Error(
          `Semantic group cites CodeGraph node evidence for another file, not ${group.source.file}`,
        );
    }
  }
  async submit(raw: unknown, comparisonValidated = false) {
    if (Buffer.byteLength(JSON.stringify(raw)) > 8 * 1024 * 1024)
      throw new Error(
        'Trace chunk exceeds 8 MiB; split it into smaller chunks',
      );
    const p = simulationSchema.parse(raw);
    // Legacy steps have no source locations, invocation identity, or stack
    // transitions. They can be replayed as mock snapshots, but their coverage
    // must never be represented as a complete source-grounded animation.
    const complete = p.complete && !p.steps;
    const { root, evidence } = await this.checkEvidence(
      p.projectRoot,
      p.evidenceIds,
    );
    await this.validateSemanticGroupEvidence(
      root,
      p.semanticGroups ?? [],
      p.evidenceIds,
    );
    if (complete) {
      const unread = evidence.find((item) => nextUnreadOffset(item) !== null);
      if (unread)
        throw new Error(
          `CodeGraph evidence ${unread.id} has unread pages beginning at offset ${nextUnreadOffset(unread)}; read the remaining evidence or finish with complete:false and explain the boundary`,
        );
      const bounded = evidence.find((item) => item.providerBoundary);
      if (bounded)
        throw new Error(
          `CodeGraph evidence ${bounded.id} reports incomplete provider results (${bounded.providerBoundary}). Fetch the missing CodeGraph source/relationships using a larger limit or narrower queries and cite the replacement evidence, or finish with complete:false.`,
        );
    }
    const sourceHash = createHash('sha256')
      .update(evidence.map((item) => item.hash).join('\n'))
      .digest('hex');
    const events: TraceEvent[] =
      p.events ??
      p.steps!.map((step, i) => ({
        id: `step-${i}`,
        kind: 'transform' as const,
        symbolId: step.to,
        label: step.dtoName,
        callId: 'legacy',
        values: step.dtoFields,
        after: step.dtoFields,
        stack: [],
        certainty: 'mock' as const,
        note: `Legacy snapshot ${step.from} → ${step.to}; source/stack detail was not supplied.`,
      }));
    if (
      complete &&
      events.some(
        (event) =>
          event.kind === 'unresolved' || event.certainty === 'unresolved',
      )
    )
      throw new Error(
        'Unresolved simulated behavior cannot be marked complete; finish with complete:false and describe the missing coverage',
      );
    const ids = new Set<string>();
    for (const event of events) {
      if (ids.has(event.id)) throw new Error(`Duplicate event ID: ${event.id}`);
      ids.add(event.id);
      if (p.events) {
        if (
          !event.evidenceIds?.length ||
          event.evidenceIds.some((id) => !p.evidenceIds.includes(id))
        )
          throw new Error(
            `Event ${event.id} must reference supplied CodeGraph evidenceIds`,
          );
        if (
          !['mock', 'assumed', 'unresolved', 'proposed'].includes(
            event.certainty,
          )
        )
          throw new Error(
            'AI simulation events must be labeled mock, assumed, unresolved or proposed',
          );
        if (
          !event.source &&
          (complete || !['unresolved', 'proposed'].includes(event.certainty))
        )
          throw new Error(
            `Event ${event.id} needs its source/call-site location`,
          );
        if (
          ['assign', 'mutate', 'transform'].includes(event.kind) &&
          (!event.before || !event.after)
        )
          throw new Error(`Event ${event.id} needs before and after snapshots`);
        if (event.kind === 'enter' && event.stack.at(-1) !== event.callId)
          throw new Error(
            `Enter event ${event.id} must push its invocation onto the stack`,
          );
        if (event.kind === 'return' && event.stack.includes(event.callId))
          throw new Error(
            `Return event ${event.id} must pop its invocation; snapshots describe state after the event`,
          );
        if (event.kind === 'catch' && event.stack.at(-1) !== event.callId)
          throw new Error(
            `Catch event ${event.id} must execute in its active handler invocation`,
          );
        if (!event.locals)
          throw new Error(
            `Event ${event.id} needs a complete local-state snapshot`,
          );
        if (event.source && event.source.endLine < event.source.line)
          throw new Error(`Event ${event.id} has an invalid source range`);
      }
    }
    const provenanceIssues = sourceProvenanceIssues(root, events, evidence);
    if (complete && provenanceIssues.length)
      throw new Error(provenanceIssues[0]);
    let previous: Trace | undefined;
    let firstSessionId: string | undefined;
    const ancestorSources = new Map<string, string>();
    const ancestorEvents: TraceEvent[][] = [];
    const ancestorCoverageProblems: string[] = [];
    const ancestorGroupDefinitions = new Map<string, string>();
    const ancestorGroupSources = new Map<
      string,
      { file: string; endLine: number }
    >();
    if (p.continuationOf) {
      previous = (await this.store.get(p.continuationOf))?.flow.trace;
      if (
        !previous?.simulation ||
        previous.projectRoot !== root ||
        previous.target !== p.endpoint
      )
        throw new Error(
          'Continuation needs an existing mock trace for the same project and target',
        );
      if (previous.simulation.complete)
        throw new Error('Cannot continue a completed trace');
      if (previous.sourceHash !== sourceHash)
        throw new Error(
          'Continuation CodeGraph evidence differs from the original source snapshot; start a new animation',
        );
      if (JSON.stringify(previous.scenario) !== JSON.stringify(p.scenario))
        throw new Error('Continuation must preserve scenario inputs');
      if (
        p.baselineSessionId &&
        p.baselineSessionId !== previous.simulation.baselineSessionId
      )
        throw new Error('Continuation must preserve its comparison baseline');
      let ancestor = await this.store.get(p.continuationOf);
      while (ancestor?.flow.trace) {
        const ancestorTrace = ancestor.flow.trace;
        ancestorEvents.push(ancestorTrace.events);
        for (const group of ancestorTrace.semanticGroups ?? []) {
          const { memberEventIds: _members, ...definition } = group;
          const fingerprint = hashSemanticDefinition(definition);
          const earlier = ancestorGroupDefinitions.get(group.id);
          if (earlier && earlier !== fingerprint)
            throw new Error(
              `Continuation changes semantic group definition ${group.id}`,
            );
          ancestorGroupDefinitions.set(group.id, fingerprint);
          if (group.source) ancestorGroupSources.set(group.id, group.source);
        }
        // Re-evaluate persistent earlier problems. Receipt pages can be read
        // after an earlier chunk was saved, so its old 'unread' classification
        // must not permanently poison the completed continuation.
        ancestorCoverageProblems.push(
          ...(ancestorTrace.simulation?.provenanceIssues ?? []),
          ...ancestorTrace.events
            .filter(
              (event) =>
                event.kind === 'unresolved' ||
                event.certainty === 'unresolved' ||
                !event.source,
            )
            .map((event) => `Unresolved or unlocated mock event ${event.id}`),
          ...ancestorTrace.events
            .filter(
              (event) =>
                event.source &&
                !Object.hasOwn(
                  ancestorTrace.sourceFiles ?? {},
                  event.source.file,
                ),
            )
            .map(
              (event) =>
                `Original source unavailable for mock event ${event.id}`,
            ),
        );
        if (complete && ancestorTrace.simulation?.provenanceIssues?.length)
          throw new Error(
            `Cannot mark mock animation complete: earlier continuation has unverified CodeGraph source provenance (${ancestorTrace.simulation.provenanceIssues[0]}). Start a new animation with matching node evidence or finish with complete:false.`,
          );
        if (
          complete &&
          ancestorTrace.events.some(
            (event) =>
              event.kind === 'unresolved' || event.certainty === 'unresolved',
          )
        )
          throw new Error(
            'An earlier mock continuation contains unresolved behavior; finish with complete:false and describe the missing coverage',
          );
        const unlocated = complete
          ? ancestorTrace.events.find((event) => !event.source)
          : undefined;
        if (unlocated)
          throw new Error(
            `Cannot mark mock animation complete: earlier event ${unlocated.id} lacks a source/call-site location. Rebuild with source-grounded events or finish with complete:false.`,
          );
        // Source availability is a property of the *whole* replay. Earlier
        // partial chunks may have fallen back to AI excerpts, and a later
        // chunk must not retroactively certify them as original source.
        if (complete) {
          const missing = ancestorTrace.events.find(
            (event) =>
              event.source &&
              !Object.hasOwn(
                ancestorTrace.sourceFiles ?? {},
                event.source.file,
              ),
          );
          if (missing?.source)
            throw new Error(
              `Cannot mark mock animation complete: earlier continuation lacks original source for ${missing.source.file}. Finish with complete:false and explain the coverage boundary.`,
            );
        }
        if (ancestorTrace.events.some((e) => ids.has(e.id)))
          throw new Error('Continuation event IDs must be unique');
        for (const [file, content] of Object.entries(
          ancestorTrace.sourceFiles ?? {},
        )) {
          const prior = ancestorSources.get(file);
          if (prior !== undefined && prior !== content)
            throw new Error(
              `Earlier continuation source snapshots disagree for ${file}`,
            );
          ancestorSources.set(file, content);
        }
        firstSessionId = ancestor.id;
        const parent = ancestor.flow.trace.simulation?.previousSessionId;
        ancestor = parent ? await this.store.get(parent) : undefined;
        if (parent && !ancestor)
          throw new Error('Earlier chunk expired; generate a new trace');
      }
    }
    for (const group of p.semanticGroups ?? []) {
      const earlier = ancestorGroupDefinitions.get(group.id);
      if (!earlier) continue;
      const { memberEventIds: _members, ...definition } = group;
      if (earlier !== hashSemanticDefinition(definition))
        throw new Error(
          `Continuation changes semantic group definition ${group.id}`,
        );
    }
    if (p.events)
      checkInvocationIntegrity([...ancestorEvents.reverse(), events], complete);
    let baseline: Trace | undefined;
    let baselineSessionId =
      p.baselineSessionId ?? previous?.simulation?.baselineSessionId;
    if (baselineSessionId) {
      const visited = new Set<string>();
      for (;;) {
        if (visited.has(baselineSessionId))
          throw new Error('Baseline contains a session cycle');
        visited.add(baselineSessionId);
        baseline = (await this.store.get(baselineSessionId))?.flow.trace;
        if (
          !baseline?.simulation ||
          baseline.projectRoot !== root ||
          baseline.target !== p.endpoint
        )
          throw new Error(
            'Plan comparison requires a mock execution baseline for the same project and target',
          );
        const parent: string | undefined =
          baseline.simulation.previousSessionId;
        if (!parent) break;
        baselineSessionId = parent;
      }
      if (
        !comparisonValidated &&
        !previous?.simulation?.baselineSessionId &&
        !events.some((e) => e.certainty === 'proposed')
      )
        throw new Error('Mark changed plan events as proposed');
    }
    const trace: Trace = {
      version: 2,
      provider: 'codegraph + ai-mock',
      projectRoot: root,
      sourceHash,
      target: p.endpoint,
      scenario: p.scenario,
      events,
      ...(p.semanticGroups?.length ? { semanticGroups: p.semanticGroups } : {}),
      diagnostics: [
        'AI-simulated values from CodeGraph evidence; repository code and external effects were not executed.',
        'Evidence receipts verify retrieval and project identity, not the semantic correctness of AI calculations.',
        ...evidence
          .filter((item) => nextUnreadOffset(item) !== null)
          .map(
            (item) =>
              `CodeGraph evidence ${item.id} has unread pages from offset ${nextUnreadOffset(item)}; source coverage is incomplete.`,
          ),
        ...evidence
          .filter((item) => item.providerBoundary)
          .map(
            (item) =>
              `CodeGraph evidence ${item.id} reports incomplete provider results (${item.providerBoundary}); source/relationship coverage is incomplete.`,
          ),
        ...(p.steps
          ? [
              'Incomplete coverage: legacy snapshot payload lacks source lines and invocation frames. Submit source-grounded events through build_mock_animation for a complete flow.',
            ]
          : []),
        ...provenanceIssues,
      ],
      truncated: !complete,
      filesAnalyzed: Math.max(...evidence.map((e) => e.files)),
      cacheHits: 0,
      simulation: {
        mode: 'ai-mock',
        complete,
        coverage: p.coverage,
        evidenceIds: p.evidenceIds,
        ...(provenanceIssues.length ? { provenanceIssues } : {}),
        ...(p.continuationOf ? { previousSessionId: p.continuationOf } : {}),
        ...(baselineSessionId ? { baselineSessionId } : {}),
      },
    };
    const sourceCatalog = await collectSourceFiles(root, events);
    // A CodeGraph receipt proves that source evidence was retrieved, but it
    // cannot substitute for a missing original file in a *complete* player
    // trace. Partial traces may still show supplied evidence excerpts.
    if (complete) {
      const missing = events.find(
        (event) =>
          event.source &&
          !Object.hasOwn(sourceCatalog.files, event.source.file),
      );
      if (missing?.source)
        throw new Error(
          `Cannot mark mock animation complete: original source unavailable for ${missing.source.file}. Submit complete:false with an explicit coverage boundary, or restore the source before building.`,
        );
    }
    for (const [file, content] of Object.entries(sourceCatalog.files)) {
      const prior = ancestorSources.get(file);
      if (prior !== undefined && prior !== content)
        throw new Error(
          `Source file ${file} changed between mock animation chunks; start a new animation`,
        );
    }
    trace.sourceFiles = sourceCatalog.files;
    trace.diagnostics.push(...sourceCatalog.diagnostics);
    if (complete)
      for (const [id, groupSource] of ancestorGroupSources) {
        const original =
          sourceCatalog.files[groupSource.file] ??
          ancestorSources.get(groupSource.file);
        if (!original)
          throw new Error(
            `Earlier semantic group ${id} lacks original source for ${groupSource.file}`,
          );
        if (groupSource.endLine > original.split(/\r?\n/).length)
          throw new Error(
            `Earlier semantic group ${id} exceeds original source lines for ${groupSource.file}`,
          );
      }
    for (const group of trace.semanticGroups ?? []) {
      if (!group.source) continue;
      const original =
        sourceCatalog.files[group.source.file] ??
        ancestorSources.get(group.source.file);
      if (!original) {
        if (complete && group.certainty !== 'unresolved')
          throw new Error(
            `Semantic group ${group.id} lacks original source for ${group.source.file}`,
          );
        trace.diagnostics.push(
          `Semantic group ${group.id} source ${group.source.file} is unavailable; grouping remains uncertain.`,
        );
      } else if (group.source.endLine > original.split(/\r?\n/).length)
        throw new Error(
          `Semantic group ${group.id} references lines beyond original source ${group.source.file}`,
        );
    }
    // A CodeGraph receipt proves evidence retrieval, not the accuracy of an
    // agent-supplied source position. Refuse bogus line highlighting when the
    // corresponding original source is available in the prepared snapshot.
    const sourceLineCounts = new Map<string, number>();
    for (const event of events) {
      if (!event.source) continue;
      const file = event.source.file;
      if (!Object.hasOwn(sourceCatalog.files, file)) continue;
      const content = sourceCatalog.files[file]!;
      let count = sourceLineCounts.get(file);
      if (count === undefined) {
        count = content.split(/\r?\n/).length;
        sourceLineCounts.set(file, count);
      }
      if (event.source.endLine > count)
        throw new Error(
          `Event ${event.id} references ${file}:${event.source.line}-${event.source.endLine} beyond its ${count} source lines; refresh CodeGraph evidence or correct the mock source location`,
        );
    }
    trace.simulation!.coverageAssessment = assessCoverage(
      complete,
      evidence,
      events,
      sourceCatalog.diagnostics,
      provenanceIssues,
      Boolean(p.steps),
      ancestorCoverageProblems,
    );
    const flow = traceToFlow(trace, p.endpoint);
    if (p.steps) flow.steps = p.steps;
    if (baseline) {
      flow.baselineTrace = baseline;
      flow.baselineSessionId = baselineSessionId;
    }
    const session = await this.store.create(flow);
    return {
      sessionId: session.id,
      url: this.baseUrl + '/flow/' + (firstSessionId ?? session.id),
      chunkUrl: this.baseUrl + '/flow/' + session.id,
      eventCount: events.length,
      complete,
      coverage: p.coverage,
      coverageAssessment: trace.simulation!.coverageAssessment,
      nextAction: p.steps
        ? 'Submit source-grounded events through build_mock_animation for a complete flow'
        : complete
          ? 'Present the player URL'
          : 'Submit the next chunk with continuationOf set to this sessionId, preserving scenario and call IDs',
    };
  }
  close() {
    this.controller.abort();
    this.evidence.clear();
  }
}
