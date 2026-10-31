import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import {
  eventSchema,
  semanticGroupSchema,
  sourceSchema,
  type SemanticGroup,
  type TraceEvent,
} from '../domain/trace.js';
import type { SessionStore } from '../domain/flow.js';
import { SimulationService } from './simulation-service.js';
import { EventJournal } from '../storage/event-journal.js';
import type {
  AuthoredNode,
  AuthoredEdge,
  AuthoredGroup,
  SceneBegin,
  SceneIdentity,
  SceneCompletion,
  PreparedScene,
  AcceptedSceneInput,
  SourceLocation,
} from '../domain/scene-input.js';
import {
  detachSceneJson,
  parseSceneAppend,
  parseSceneEvent,
  parseScenePreparation,
} from './scene-ingress.js';

const record = z.record(z.unknown());
const groupFields = semanticGroupSchema.innerType().shape;
export const groupDefinitionSchema = z
  .object({
    key: groupFields.id,
    parentKey: groupFields.id.optional(),
    kind: groupFields.kind,
    title: groupFields.title,
    source: groupFields.source,
    evidenceIds: groupFields.evidenceIds,
    certainty: groupFields.certainty,
    arm: groupFields.arm,
    iteration: groupFields.iteration,
  })
  .strict();
export const operationSchema = z
  .object({
    kind: eventSchema.shape.kind,
    taskId: z.string().min(1).max(100).optional(),
    label: z.string().min(1).max(180),
    symbol: z.string().min(1).max(200).optional(),
    source: sourceSchema.optional(),
    line: z.number().int().positive().optional(),
    evidenceIds: z.array(z.string().uuid()).min(1).max(200).optional(),
    inputs: record.optional(),
    result: z.unknown().optional(),
    output: z.string().max(16000).optional(),
    set: record.optional(),
    unset: z.array(z.string()).optional(),
    assignTo: z.string().min(1).optional(),
    unwindTo: z.string().min(1).nullable().optional(),
    objectId: z.string().min(1).max(200).optional(),
    fields: record.optional(),
    unsetFields: z.array(z.string()).optional(),
    values: record.optional(),
    origins: z.record(z.string()).optional(),
    snippet: z.string().max(800).optional(),
    certainty: z
      .enum(['mock', 'assumed', 'unresolved', 'proposed'])
      .default('mock'),
    note: z.string().optional(),
    groupPath: z.array(groupFields.id).max(2000).optional(),
  })
  .strict();
const beginSchema = z
  .object({
    action: z.literal('begin'),
    projectRoot: z.string().min(1),
    endpoint: z.string().min(1).max(200),
    evidenceIds: z.array(z.string().uuid()).min(1).max(200),
    scenario: record.default({}),
    baselineSessionId: z.string().uuid().optional(),
  })
  .strict();
const appendSchema = z
  .object({
    action: z.literal('append'),
    buildId: z.string().uuid(),
    batchId: z.string().min(1).max(80),
    expectedEventCount: z.number().int().nonnegative(),
    operations: z.array(operationSchema).min(1).max(100),
    groupDefinitions: z.array(groupDefinitionSchema).max(2000).optional(),
  })
  .strict();
const finishSchema = z
  .object({
    action: z.literal('finish'),
    buildId: z.string().uuid(),
    coverage: z.string().min(1).max(4000),
    complete: z.boolean(),
  })
  .strict();
export const builderSchema = z.discriminatedUnion('action', [
  beginSchema,
  appendSchema,
  finishSchema,
  z
    .object({ action: z.literal('status'), buildId: z.string().uuid() })
    .strict(),
  z
    .object({ action: z.literal('cancel'), buildId: z.string().uuid() })
    .strict(),
]);
type Operation = z.infer<typeof operationSchema>;
type GroupDefinition = z.infer<typeof groupDefinitionSchema>;
interface GroupState {
  input: GroupDefinition;
  id: string;
  callId?: string;
  taskId?: string;
}
interface Frame {
  id: string;
  symbol: string;
  source?: z.infer<typeof sourceSchema> | undefined;
  evidenceIds: string[];
  locals: Record<string, unknown>;
}
interface Build {
  input: z.infer<typeof beginSchema>;
  id: string;
  createdAt: number;
  frames: Frame[];
  taskFrames: Map<string, Frame[]>;
  objects: Record<string, Record<string, unknown>>;
  events: EventJournal;
  calls: number;
  batches: Map<string, { hash: string; count: number }>;
  groupDefinitions: Map<string, GroupState>;
  groupCounter: number;
  groupBytes: number;
  busy: boolean;
  result?: Record<string, unknown>;
  finishHash?: string;
}
interface SceneGraphState {
  nodes: Map<string, AuthoredNode>;
  edges: Map<string, AuthoredEdge>;
  groups: Map<string, AuthoredGroup>;
  nodeIds: Map<string, string>;
  edgeIds: Map<string, string>;
  groupIds: Map<string, string>;
  callIds: Map<string, { id: string; taskId: string }>;
  enteredCalls: Set<string>;
  eventKeys: Set<string>;
  nodeEvents: Map<string, string[]>;
  activeEdges: Map<string, readonly string[]>;
}
interface SceneBuild {
  id: string;
  input: SceneBegin;
  createdAt: number;
  events: EventJournal;
  batches: Map<string, { hash: string; count: number }>;
  graph: SceneGraphState;
  state: {
    frames: Frame[];
    taskFrames: Map<string, Frame[]>;
    objects: Record<string, Record<string, unknown>>;
    calls: number;
  };
  busy: boolean;
  prepared?: { completionKey: string; envelope: PreparedScene };
}
const clone = <T>(value: T): T => structuredClone(value);
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const patch = (
  target: Record<string, unknown>,
  set?: Record<string, unknown>,
  unset?: string[],
) => {
  const entries = Object.fromEntries(Object.entries(target));
  for (const [key, value] of Object.entries(set ?? {}))
    Object.defineProperty(entries, key, {
      value: clone(value),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  for (const key of unset ?? []) delete entries[key];
  return entries;
};

// Generic trace assembly, not a source interpreter. No eval, shell, script files
// or per-project generators. AI supplies semantic values as MCP data.
export class AnimationBuilder {
  private readonly builds = new Map<string, Build>();
  private readonly sceneBuilds = new Map<string, SceneBuild>();
  constructor(
    private readonly simulation: SimulationService,
    private readonly store: SessionStore,
  ) {}
  async beginScene(input: SceneBegin): Promise<{ buildId: string }> {
    const parsed = beginSchema
      .omit({ action: true })
      .extend({
        // Detachment validates all metadata; a custom predicate preserves own special keys.
        scenario: z.custom<SceneBegin['scenario']>(
          (value) =>
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            ['entrypoint', 'description', 'mockInputLabel'].every(
              (key) =>
                Object.hasOwn(value, key) &&
                typeof (value as Record<string, unknown>)[key] === 'string',
            ),
          {
            message:
              'scenario requires own string entrypoint, description, and mockInputLabel',
          },
        ),
      })
      .parse(detachSceneJson(input));
    const { root } = await this.simulation.checkEvidence(
      parsed.projectRoot,
      parsed.evidenceIds,
    );
    for (const [id, build] of this.sceneBuilds) {
      if (!build.busy && Date.now() - build.createdAt > 3600000) {
        build.events.close();
        this.sceneBuilds.delete(id);
      }
    }
    if (this.sceneBuilds.size >= 10)
      throw new Error('Build limit reached; close existing candidate builds');
    const { baselineSessionId, ...rest } = parsed;
    const build: SceneBuild = {
      id: randomUUID(),
      createdAt: Date.now(),
      input: clone({
        ...rest,
        projectRoot: root,
        ...(baselineSessionId === undefined ? {} : { baselineSessionId }),
      }),
      events: new EventJournal(),
      batches: new Map(),
      busy: false,
      state: {
        frames: [],
        taskFrames: new Map(),
        objects: Object.create(null),
        calls: 0,
      },
      graph: {
        nodes: new Map(),
        edges: new Map(),
        groups: new Map(),
        nodeIds: new Map(),
        edgeIds: new Map(),
        groupIds: new Map(),
        callIds: new Map(),
        enteredCalls: new Set(),
        eventKeys: new Set(),
        nodeEvents: new Map(),
        activeEdges: new Map(),
      },
    };
    this.sceneBuilds.set(build.id, build);
    return { buildId: build.id };
  }
  private getScene(buildId: string): SceneBuild {
    const build = this.sceneBuilds.get(buildId);
    if (!build || (!build.busy && Date.now() - build.createdAt > 3600000)) {
      build?.events.close();
      this.sceneBuilds.delete(buildId);
      throw new Error('Candidate build expired or not found');
    }
    return build;
  }
  async appendScene(raw: unknown): Promise<{
    buildId: string;
    acceptedEventCount: number;
    replayedBatch: boolean;
  }> {
    const detached = detachSceneJson(raw);
    if (Buffer.byteLength(JSON.stringify(detached)) > 1024 * 1024)
      throw new Error('Batch exceeds 1 MiB');
    const p = parseSceneAppend(detached);
    const build = this.getScene(p.buildId);
    if (build.busy) throw new Error('Candidate build is processing a request');
    if (build.prepared)
      throw new Error('Candidate build is finalized; append is prohibited');
    const digest = hash(p);
    const prior = build.batches.get(p.batchId);
    if (prior) {
      if (prior.hash !== digest)
        throw new Error('batchId was already used with different operations');
      return {
        buildId: build.id,
        acceptedEventCount: prior.count,
        replayedBatch: true,
      };
    }
    if (p.expectedEventCount !== build.events.count)
      throw new Error(
        `Event count changed; expectedEventCount must be ${build.events.count}`,
      );
    build.busy = true;
    try {
      const graph = clone(build.graph);
      const state = clone(build.state);
      const declare = <T extends { key: string }>(
        declarations: readonly T[],
        records: Map<string, T>,
        ids: Map<string, string>,
        kind: string,
      ) => {
        const seen = new Set<string>();
        for (const declaration of declarations) {
          if (seen.has(declaration.key))
            throw new Error(`Duplicate ${kind} key: ${declaration.key}`);
          seen.add(declaration.key);
          const previous = records.get(declaration.key);
          if (previous) {
            if (hash(previous) !== hash(declaration))
              throw new Error(
                `Conflicting ${kind} definition: ${declaration.key}`,
              );
          } else {
            records.set(declaration.key, clone(declaration));
            ids.set(declaration.key, `${kind}:${build.id}:${ids.size + 1}`);
          }
        }
      };
      declare(p.nodes, graph.nodes, graph.nodeIds, 'node');
      declare(p.edges, graph.edges, graph.edgeIds, 'edge');
      declare(p.groups, graph.groups, graph.groupIds, 'group');
      for (const record of [
        ...graph.nodes.values(),
        ...graph.groups.values(),
      ]) {
        const owner = graph.callIds.get(record.callKey);
        if (owner && owner.taskId !== record.taskId)
          throw new Error(
            `Conflicting task ownership for call ${record.callKey}`,
          );
        if (!owner)
          graph.callIds.set(record.callKey, {
            id: `call:${build.id}:${graph.callIds.size + 1}`,
            taskId: record.taskId,
          });
      }
      this.validateSceneGraph(graph);
      const evidenceIds = [
        ...new Set([
          ...build.input.evidenceIds,
          ...p.operations.flatMap((operation) => operation.evidenceIds ?? []),
          ...[
            ...graph.nodes.values(),
            ...graph.edges.values(),
            ...graph.groups.values(),
          ].flatMap((record) => record.evidenceIds),
        ]),
      ];
      if (evidenceIds.length > 200)
        throw new Error('Build exceeds evidence receipt limit');
      await this.simulation.validateSceneEvidence(
        build.input.projectRoot,
        evidenceIds,
        [...graph.nodes.values(), ...graph.groups.values()],
      );
      const events: TraceEvent[] = [];
      for (const authored of p.operations) {
        const {
          key,
          nodeKey,
          callKey,
          parentCallKey,
          activeEdgeKeys,
          ...operation
        } = authored;
        if (graph.eventKeys.has(key))
          throw new Error(`Duplicate operation key: ${key}`);
        const node = graph.nodes.get(nodeKey);
        if (!node) throw new Error(`Unknown node key: ${nodeKey}`);
        const owner = graph.callIds.get(callKey);
        if (
          !owner ||
          node.callKey !== callKey ||
          node.taskId !== (operation.taskId ?? 'main')
        )
          throw new Error(
            `Operation ${key} conflicts with node call/task ownership`,
          );
        const active = activeEdgeKeys.map((edgeKey) => {
          const edge = graph.edges.get(edgeKey);
          if (!edge) throw new Error(`Unknown active edge key: ${edgeKey}`);
          if (edge.executionStatus !== 'simulated-taken')
            throw new Error(
              `Alternative or unresolved edge cannot be active: ${edgeKey}`,
            );
          return graph.edgeIds.get(edgeKey)!;
        });
        if (new Set(active).size !== active.length)
          throw new Error('Duplicate active edge key');
        if (operation.kind === 'enter') {
          if (graph.enteredCalls.has(callKey))
            throw new Error(`Call key already entered: ${callKey}`);
          graph.enteredCalls.add(callKey);
        }
        if (operation.unwindTo !== undefined && operation.unwindTo !== null) {
          const unwind = graph.callIds.get(operation.unwindTo);
          if (!unwind)
            throw new Error(`Unknown unwind call key: ${operation.unwindTo}`);
          operation.unwindTo = unwind.id;
        }
        const event = this.apply(
          state,
          operation,
          build.events.count + events.length,
          build.input.evidenceIds,
          owner.id,
        );
        if (event.callId !== owner.id)
          throw new Error(`Operation ${key} uses an inactive call key`);
        if (
          parentCallKey !== undefined &&
          (!graph.callIds.has(parentCallKey) ||
            event.parentCallId !== graph.callIds.get(parentCallKey)!.id)
        )
          throw new Error(
            `Operation ${key} has conflicting parent call ownership`,
          );
        graph.eventKeys.add(key);
        graph.nodeEvents.set(nodeKey, [
          ...(graph.nodeEvents.get(nodeKey) ?? []),
          event.id,
        ]);
        graph.activeEdges.set(event.id, active);
        events.push(event);
      }
      await this.simulation.validateSceneEvidence(
        build.input.projectRoot,
        evidenceIds,
        events,
      );
      await build.events.append(events);
      // Only the journal's successful append makes cloned state and author mappings visible.
      build.state = state;
      build.graph = graph;
      build.input.evidenceIds = evidenceIds;
      build.batches.set(p.batchId, { hash: digest, count: events.length });
      return {
        buildId: build.id,
        acceptedEventCount: events.length,
        replayedBatch: false,
      };
    } finally {
      build.busy = false;
    }
  }
  async prepareScene(
    buildId: string,
    identity: SceneIdentity,
    completion: SceneCompletion,
    signal: AbortSignal,
  ): Promise<PreparedScene> {
    signal.throwIfAborted();
    const parsed = parseScenePreparation(identity, completion);
    const build = this.getScene(buildId);
    if (build.busy) throw new Error('Candidate build is processing a request');
    if (
      parsed.identity.projectRoot !== build.input.projectRoot ||
      parsed.identity.target !== build.input.endpoint
    )
      throw new Error(
        'Preparation identity projectRoot/target conflicts with accepted build bindings',
      );
    const completionKey = hash(parsed.completion);
    if (build.prepared) {
      if (build.prepared.completionKey !== completionKey)
        throw new Error(
          'Candidate build was prepared with different completion data',
        );
      return clone(build.prepared.envelope);
    }
    build.busy = true;
    try {
      const begun = clone(build.input);
      const graph = clone(build.graph);
      this.validateSceneGraph(graph);
      const events: TraceEvent[] = [];
      for await (const chunk of build.events.chunks()) {
        signal.throwIfAborted();
        events.push(...chunk.map((event) => parseSceneEvent(event)));
      }
      if (!events.length)
        throw new Error('Candidate preparation requires accepted mock events');
      const captured = await this.simulation.prepareSceneEvidence(
        begun.projectRoot,
        begun.evidenceIds,
        events,
        [
          ...graph.nodes.values(),
          ...graph.edges.values(),
          ...graph.groups.values(),
        ],
        parsed.completion,
        signal,
      );
      signal.throwIfAborted();
      const pairs = Object.entries(captured.files).sort(([left], [right]) =>
        left < right ? -1 : left > right ? 1 : 0,
      );
      const sources: AcceptedSceneInput['sources'] = pairs.map(
        ([path, text], index) => ({
          id: `source:${build.id}:${index + 1}`,
          path,
          text,
          languageHint: null,
        }),
      );
      const fileIds = new Map(sources.map((file) => [file.path, file.id]));
      const requireFile = (path: string) => {
        const id = fileIds.get(path);
        if (id === undefined)
          throw new Error(
            `Scene source cannot be represented without captured file: ${path}`,
          );
        return id;
      };
      const sourceRef = (location: SourceLocation | null) =>
        location === null
          ? null
          : {
              fileId: requireFile(location.file),
              line: location.line,
              endLine: location.endLine,
              ...(location.generated
                ? {
                    generated: {
                      fileId: requireFile(location.generated.file),
                      line: location.generated.line,
                    },
                  }
                : {}),
            };
      const input: AcceptedSceneInput = {
        artifact: { ...parsed.identity, sourceHash: hash(pairs) },
        scenario: {
          entrypoint: begun.scenario.entrypoint,
          description: begun.scenario.description,
          mockInputLabel: begun.scenario.mockInputLabel,
        },
        provenance: captured.provenance,
        status: captured.status,
        graph: {
          nodes: [...graph.nodes.values()].map(
            ({ key, callKey, groupPathKeys, source, ...node }) => ({
              ...node,
              id: graph.nodeIds.get(key)!,
              eventIds: [...(graph.nodeEvents.get(key) ?? [])],
              callId: graph.callIds.get(callKey)!.id,
              groupPathIds: groupPathKeys.map((groupKey) =>
                graph.groupIds.get(groupKey)!,
              ),
              sourceRef: sourceRef(source),
            }),
          ),
          edges: [...graph.edges.values()].map(
            ({ key, fromNodeKey, toNodeKey, callTransition, ...edge }) => ({
              ...edge,
              id: graph.edgeIds.get(key)!,
              fromNodeId: graph.nodeIds.get(fromNodeKey)!,
              toNodeId: graph.nodeIds.get(toNodeKey)!,
              callTransition:
                callTransition === null
                  ? null
                  : {
                      fromCallId: graph.callIds.get(callTransition.fromCallKey)!
                        .id,
                      toCallId: graph.callIds.get(callTransition.toCallKey)!.id,
                    },
            }),
          ),
          groups: [...graph.groups.values()].map(
            ({
              key,
              parentGroupKey,
              memberNodeKeys,
              callKey,
              source,
              ...group
            }) => ({
              ...group,
              id: graph.groupIds.get(key)!,
              parentGroupId:
                parentGroupKey === null
                  ? null
                  : graph.groupIds.get(parentGroupKey)!,
              memberNodeIds: memberNodeKeys.map((nodeKey) =>
                graph.nodeIds.get(nodeKey)!,
              ),
              callId: graph.callIds.get(callKey)!.id,
              sourceRef: sourceRef(source),
            }),
          ),
        },
        sources,
        events,
        activeEdgeIdsByEventId: clone(graph.activeEdges),
      };
      const envelope: PreparedScene = {
        input,
        ...(begun.baselineSessionId === undefined
          ? {}
          : { baselineSessionId: begun.baselineSessionId }),
      };
      // Private ownership, not Object.freeze(Map), protects the first successful snapshot.
      const retained = clone(envelope);
      const returned = clone(retained);
      signal.throwIfAborted();
      build.prepared = { completionKey, envelope: retained };
      return returned;
    } finally {
      build.busy = false;
    }
  }
  private validateSceneGraph(graph: SceneGraphState) {
    const directOwners = new Map<string, string>();
    for (const group of graph.groups.values()) {
      const ancestry = new Set<string>([group.key]);
      let parentKey = group.parentGroupKey;
      while (parentKey !== null) {
        if (ancestry.has(parentKey)) throw new Error('Cyclic group ancestry');
        ancestry.add(parentKey);
        const parent = graph.groups.get(parentKey);
        if (!parent) throw new Error(`Unknown parent group: ${parentKey}`);
        if (parent.callKey !== group.callKey || parent.taskId !== group.taskId)
          throw new Error('Group parent has conflicting call/task ownership');
        parentKey = parent.parentGroupKey;
      }
      for (const member of group.memberNodeKeys) {
        const node = graph.nodes.get(member);
        if (!node) throw new Error(`Unknown group member node: ${member}`);
        if (directOwners.has(member))
          throw new Error(`Conflicting direct group membership: ${member}`);
        if (node.callKey !== group.callKey || node.taskId !== group.taskId)
          throw new Error('Group member has conflicting call/task ownership');
        directOwners.set(member, group.key);
      }
    }
    for (const node of graph.nodes.values()) {
      if (directOwners.get(node.key) !== node.groupPathKeys.at(-1))
        throw new Error(`Contradictory direct group membership: ${node.key}`);
      const seen = new Set<string>();
      for (const [index, groupKey] of node.groupPathKeys.entries()) {
        const group = graph.groups.get(groupKey);
        if (!group || seen.has(groupKey))
          throw new Error(`Unknown or repeated group: ${groupKey}`);
        if (group.parentGroupKey !== (node.groupPathKeys[index - 1] ?? null))
          throw new Error(`Contradictory group ancestry: ${node.key}`);
        seen.add(groupKey);
      }
    }
    for (const edge of graph.edges.values()) {
      const from = graph.nodes.get(edge.fromNodeKey);
      const to = graph.nodes.get(edge.toNodeKey);
      if (!from || !to) throw new Error(`Unknown edge endpoint: ${edge.key}`);
      if (edge.callTransition !== null) {
        if (
          !['call', 'return'].includes(edge.kind) ||
          edge.callTransition.fromCallKey !== from.callKey ||
          edge.callTransition.toCallKey !== to.callKey
        )
          throw new Error(`Invalid call transition: ${edge.key}`);
      } else if (from.callKey !== to.callKey) {
        throw new Error(
          `Cross-call edge requires an explicit call/return transition: ${edge.key}`,
        );
      }
    }
  }
  private get(id: string) {
    const build = this.builds.get(id);
    if (!build || (!build.busy && Date.now() - build.createdAt > 3600000)) {
      build?.events.close();
      this.builds.delete(id);
      throw new Error('Build expired or not found; begin a new animation');
    }
    return build;
  }
  private status(b: Build) {
    return {
      buildId: b.id,
      status: b.result ? 'ready' : b.busy ? 'processing' : 'building',
      eventCount: b.events.count,
      stack: b.frames.map((f) => ({ callId: f.id, symbol: f.symbol })),
      activeTasks: Object.fromEntries(
        [...b.taskFrames]
          .filter(([, frames]) => frames.length)
          .map(([id, frames]) => [
            id,
            frames.map((frame) => ({ callId: frame.id, symbol: frame.symbol })),
          ]),
      ),
      nextAction:
        'Send the next operations batch directly through this tool; do not create scripts or payload files.',
      ...(b.result ?? {}),
    };
  }
  async run(raw: unknown): Promise<Record<string, unknown>> {
    if (Buffer.byteLength(JSON.stringify(raw)) > 1024 * 1024)
      throw new Error(
        'Batch exceeds 1 MiB; send fewer operations directly through MCP, not a payload file',
      );
    const p = builderSchema.parse(raw);
    if (p.action === 'begin') {
      for (const [id, b] of this.builds)
        if (!b.busy && Date.now() - b.createdAt > 3600000) {
          b.events.close();
          this.builds.delete(id);
        }
      // Validate a new scenario before releasing any retained finalized handle.
      // Failed evidence checks must not invalidate existing idempotent requests.
      const { root } = await this.simulation.checkEvidence(
        p.projectRoot,
        p.evidenceIds,
      );
      // Completed sessions are persisted in SessionStore. Keep their build
      // handles for idempotent status/finish calls until another scenario
      // needs capacity; then release the oldest finalized handle.
      if (this.builds.size >= 10)
        for (const [id, b] of this.builds) {
          if (b.busy || !b.result) continue;
          b.events.close();
          this.builds.delete(id);
          if (this.builds.size < 10) break;
        }
      if (this.builds.size >= 10)
        throw new Error(
          'Build limit reached; cancel or finish existing builds',
        );
      const b: Build = {
        input: { ...p, projectRoot: root },
        id: randomUUID(),
        createdAt: Date.now(),
        frames: [],
        taskFrames: new Map(),
        objects: Object.create(null) as Record<string, Record<string, unknown>>,
        events: new EventJournal(),
        calls: 0,
        batches: new Map(),
        groupDefinitions: new Map(),
        groupCounter: 0,
        groupBytes: 0,
        busy: false,
      };
      this.builds.set(b.id, b);
      return this.status(b);
    }
    const b = this.get(p.buildId);
    if (p.action === 'status') return this.status(b);
    if (b.busy)
      throw new Error(
        'Build is processing a request; retry after checking status',
      );
    if (p.action === 'cancel') {
      b.events.close();
      this.builds.delete(b.id);
      return { cancelled: true, buildId: b.id };
    }
    if (p.action === 'append') {
      const digest = hash(p);
      const prior = b.batches.get(p.batchId);
      if (prior) {
        if (prior.hash !== digest)
          throw new Error('batchId was already used with different operations');
        return {
          ...this.status(b),
          acceptedEventCount: prior.count,
          replayedBatch: true,
        };
      }
      if (b.result) throw new Error('Animation is already finalized');
      if (p.expectedEventCount !== b.events.count)
        throw new Error(
          `Event count changed; expectedEventCount must be ${b.events.count}`,
        );
      b.busy = true;
      try {
        const evidenceIds = [
          ...new Set([
            ...b.input.evidenceIds,
            ...p.operations.flatMap((o) => o.evidenceIds ?? []),
            ...(p.groupDefinitions ?? []).flatMap((g) => g.evidenceIds ?? []),
          ]),
        ];
        if (evidenceIds.length > 200)
          throw new Error('Build exceeds evidence receipt limit');
        await this.simulation.checkEvidence(b.input.projectRoot, evidenceIds);
        await this.simulation.validateSemanticGroupEvidence(
          b.input.projectRoot,
          p.groupDefinitions ?? [],
        );
        const state = {
          frames: clone(b.frames),
          taskFrames: clone(b.taskFrames),
          objects: Object.assign(
            Object.create(null),
            clone(b.objects),
          ) as Record<string, Record<string, unknown>>,
          calls: b.calls,
        };
        const groups = clone(b.groupDefinitions);
        let groupCounter = b.groupCounter;
        let groupBytes = b.groupBytes;
        const newKeys = new Set<string>();
        for (const definition of p.groupDefinitions ?? []) {
          if (newKeys.has(definition.key))
            throw new Error(
              `Duplicate group definition key: ${definition.key}`,
            );
          newKeys.add(definition.key);
          const { key: _key, parentKey, ...fields } = definition;
          const validation = semanticGroupSchema.safeParse({
            ...fields,
            id: definition.key,
            callId: 'pending',
            ...(parentKey ? { parentGroupId: parentKey } : {}),
            memberEventIds: [],
          });
          if (!validation.success)
            throw new Error(
              `Invalid group definition ${definition.key}: ${validation.error.issues[0]?.message}`,
            );
          const prior = groups.get(definition.key);
          if (prior) {
            if (hash(prior.input) !== hash(definition))
              throw new Error(
                `Group definition ${definition.key} changed after declaration`,
              );
            continue;
          }
          const bytes = Buffer.byteLength(JSON.stringify(definition));
          groupBytes += bytes;
          if (groupBytes > 8 * 1024 * 1024)
            throw new Error(
              'Semantic group definition bytes exceed the 8 MiB build budget',
            );
          groups.set(definition.key, {
            input: definition,
            id: `group-${b.id}-${++groupCounter}`,
          });
        }
        for (const key of newKeys) {
          const seen = new Set<string>();
          let cursor: string | undefined = key;
          while (cursor) {
            if (seen.has(cursor))
              throw new Error(`Semantic group parent cycle: ${key}`);
            seen.add(cursor);
            const item = groups.get(cursor);
            if (!item)
              throw new Error(`Unknown semantic group parent: ${cursor}`);
            cursor = item.input.parentKey;
          }
        }
        const events: TraceEvent[] = [];
        const paths: string[][] = [];
        for (const [index, op] of p.operations.entries()) {
          const event = this.apply(
            state,
            op,
            b.events.count + index,
            evidenceIds,
          );
          events.push(event);
          const ids: string[] = [];
          const seen = new Set<string>();
          for (const [depth, key] of (op.groupPath ?? []).entries()) {
            if (seen.has(key))
              throw new Error(`Repeated semantic group in groupPath: ${key}`);
            seen.add(key);
            const group = groups.get(key);
            if (!group)
              throw new Error(`Unknown semantic group in groupPath: ${key}`);
            if (group.input.parentKey !== op.groupPath?.[depth - 1])
              throw new Error(`groupPath parent chain disagrees at ${key}`);
            if (group.callId && group.callId !== event.callId)
              throw new Error(
                `Semantic group ${key} cannot cross call ownership`,
              );
            if (group.taskId && group.taskId !== (event.taskId ?? 'main'))
              throw new Error(
                `Semantic group ${key} cannot cross task ownership`,
              );
            group.callId = event.callId;
            group.taskId = event.taskId ?? 'main';
            ids.push(group.id);
          }
          const innermost = op.groupPath?.at(-1);
          const memberGroup = innermost ? groups.get(innermost)! : undefined;
          if (
            memberGroup?.input.source &&
            event.source &&
            event.source.file !== memberGroup.input.source.file
          )
            throw new Error(
              `Semantic group ${innermost} source file differs from its member event`,
            );
          paths.push(ids);
        }
        await b.events.append(
          events,
          paths.some((path) => path.length) ? paths : undefined,
        );
        // Commit only after the whole batch validates. Retried batch IDs are idempotent.
        b.frames = state.frames;
        b.taskFrames = state.taskFrames;
        b.objects = state.objects;
        b.calls = state.calls;
        b.groupDefinitions = groups;
        b.groupCounter = groupCounter;
        b.groupBytes = groupBytes;
        b.input.evidenceIds = evidenceIds;
        b.batches.set(p.batchId, { hash: digest, count: events.length });
      } finally {
        b.busy = false;
      }
      return { ...this.status(b), acceptedEventCount: p.operations.length };
    }
    if (b.result) {
      if (b.finishHash !== hash(p))
        throw new Error('Animation was finalized with different coverage');
      return this.status(b);
    }
    if (!b.events.count)
      throw new Error('Append execution steps before finishing');
    if (
      p.complete &&
      (b.frames.length ||
        [...b.taskFrames.values()].some((frames) => frames.length))
    )
      throw new Error(
        'Active call frames remain in one or more mock tasks; append their returns or finish with complete:false and explain the boundary',
      );
    b.busy = true;
    const created: string[] = [];
    try {
      if (b.input.baselineSessionId) {
        let hasProposal = false;
        for await (const events of b.events.chunks()) {
          if (events.some((event) => event.certainty === 'proposed')) {
            hasProposal = true;
            break;
          }
        }
        if (!hasProposal)
          throw new Error('Mark changed plan events as proposed');
      }
      let result: Awaited<ReturnType<SimulationService['submit']>> | undefined;
      let chunks = 0;
      let processed = 0;
      const byId = new Map(
        [...b.groupDefinitions.values()].map((group) => [group.id, group]),
      );
      for await (const { events, groupPaths } of b.events.annotatedChunks()) {
        processed += events.length;
        chunks++;
        const memberships = new Map<string, string[]>();
        for (const [index, path] of groupPaths.entries()) {
          for (const id of path)
            if (!memberships.has(id)) memberships.set(id, []);
          const last = path.at(-1);
          if (last) memberships.get(last)!.push(events[index]!.id);
        }
        const semanticGroups: SemanticGroup[] = [...memberships].map(
          ([id, memberEventIds]) => {
            const group = byId.get(id)!;
            const { key: _key, parentKey, ...fields } = group.input;
            const parentGroupId = parentKey
              ? b.groupDefinitions.get(parentKey)?.id
              : undefined;
            return {
              id,
              ...fields,
              callId: group.callId!,
              ...(group.taskId !== 'main' ? { taskId: group.taskId } : {}),
              ...(parentGroupId ? { parentGroupId } : {}),
              memberEventIds,
            };
          },
        );
        result = await this.simulation.submit(
          {
            projectRoot: b.input.projectRoot,
            endpoint: b.input.endpoint,
            evidenceIds: b.input.evidenceIds,
            scenario: b.input.scenario,
            events,
            ...(semanticGroups.length ? { semanticGroups } : {}),
            coverage: p.coverage,
            complete: processed === b.events.count && p.complete,
            ...(result ? { continuationOf: result.sessionId } : {}),
            ...(b.input.baselineSessionId && !result
              ? { baselineSessionId: b.input.baselineSessionId }
              : {}),
          },
          Boolean(b.input.baselineSessionId),
        );
        created.push(result.sessionId);
      }
      b.result = {
        ...result!,
        eventCount: b.events.count,
        chunks,
        status: 'ready',
      };
      b.finishHash = hash(p);
      b.events.close();
      return this.status(b);
    } catch (error) {
      for (const id of created) await this.store.delete?.(id);
      throw error;
    } finally {
      b.busy = false;
    }
  }
  private apply(
    state: {
      frames: Frame[];
      taskFrames: Map<string, Frame[]>;
      objects: Record<string, Record<string, unknown>>;
      calls: number;
    },
    op: Operation,
    index: number,
    defaultEvidence: string[],
    sceneCallId?: string,
  ): TraceEvent {
    const task = op.taskId ?? 'main';
    let frames = task === 'main' ? state.frames : state.taskFrames.get(task);
    if (!frames) {
      if (op.kind !== 'enter')
        throw new Error(`Task ${task} must begin with an enter operation`);
      frames = [];
      state.taskFrames.set(task, frames);
    }
    const caller = frames.at(-1);
    if (op.kind === 'enter') {
      if (!op.symbol) throw new Error('Enter requires a symbol');
      state.calls++;
      frames.push({
        id: sceneCallId ?? `call-${state.calls}`,
        symbol: op.symbol,
        source: op.source,
        evidenceIds: op.evidenceIds ?? defaultEvidence,
        locals: clone(op.inputs ?? {}),
      });
    }
    const frame = frames.at(-1);
    if (!frame) throw new Error('Begin the flow with an enter operation');
    if (op.unwindTo !== undefined && op.kind !== 'throw')
      throw new Error('unwindTo is only valid for throw operations');
    if (op.kind === 'unresolved' && op.certainty !== 'unresolved')
      throw new Error('Unresolved events must use certainty: unresolved');
    if (op.certainty === 'unresolved' && !op.note?.trim())
      throw new Error(
        'Unresolved events must explain missing source evidence or semantics in note',
      );
    if (
      op.unwindTo !== undefined &&
      op.unwindTo !== null &&
      !frames.some((f) => f.id === op.unwindTo)
    )
      throw new Error(
        'unwindTo must identify an active invocation or be null for an uncaught exception',
      );
    const source =
      op.source ??
      (op.line && frame.source
        ? { ...frame.source, line: op.line, endLine: op.line }
        : frame.source);
    if (!source && !['unresolved', 'proposed'].includes(op.certainty))
      throw new Error('Provide source on enter or this operation');
    if (source && source.endLine < source.line)
      throw new Error('Invalid source line range');
    if ((op.fields || op.unsetFields) && !op.objectId)
      throw new Error('Object field changes need objectId');
    // Object IDs are supplied by the agent. Treat them as opaque keys, including
    // "constructor", "toString", and "__proto__", never inherited properties.
    const before = clone(
      op.objectId && Object.hasOwn(state.objects, op.objectId)
        ? state.objects[op.objectId]!
        : op.objectId
          ? {}
          : frame.locals,
    );
    frame.locals = patch(frame.locals, op.set, op.unset);
    if (op.assignTo && !Object.hasOwn(op, 'result'))
      throw new Error('assignTo requires result (null is allowed)');
    if (op.kind === 'console' && op.output === undefined)
      throw new Error('Console events need the exact simulated output');
    if (op.assignTo && op.kind !== 'return')
      frame.locals = patch(frame.locals, { [op.assignTo]: op.result });
    if (op.objectId) {
      const object = patch(
        Object.hasOwn(state.objects, op.objectId)
          ? state.objects[op.objectId]!
          : {},
        op.fields,
        op.unsetFields,
      );
      Object.defineProperty(state.objects, op.objectId, {
        value: object,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    let after = clone(op.objectId ? state.objects[op.objectId]! : frame.locals);
    let beforeSnapshot = before;
    if (op.kind === 'transform' && !op.set && !op.assignTo && !op.objectId) {
      if (!Object.hasOwn(op, 'result'))
        throw new Error('Transform needs result or a state change');
      beforeSnapshot = { ...(op.inputs ?? {}), result: null };
      after = { ...(op.inputs ?? {}), result: clone(op.result) };
    }
    const parent = frames.at(-2);
    if (op.kind === 'throw' && op.unwindTo !== undefined) {
      const retained =
        op.unwindTo === null
          ? 0
          : frames.findIndex((f) => f.id === op.unwindTo) + 1;
      frames.splice(retained);
    }
    if (op.kind === 'return') {
      frames.pop();
      if (op.assignTo) {
        if (!parent)
          throw new Error('Root return cannot assign to a caller frame');
        // The assignment happens in the surviving caller, so the return
        // event's value diff must compare that frame before and after binding.
        // The callee's returned value remains available separately as result.
        beforeSnapshot = clone(parent.locals);
        parent.locals = patch(parent.locals, { [op.assignTo]: op.result });
        after = clone(parent.locals);
      }
    }
    const event: TraceEvent = {
      id: `event-${index + 1}`,
      kind: op.kind,
      symbolId: op.symbol ?? frame.symbol,
      label: op.label,
      callId: frame.id,
      ...(op.taskId ? { taskId: op.taskId } : {}),
      ...(parent ? { parentCallId: parent.id } : {}),
      ...(source ? { source } : {}),
      evidenceIds: op.evidenceIds ?? frame.evidenceIds,
      values: {
        from:
          op.kind === 'enter' ? (caller?.symbol ?? frame.symbol) : frame.symbol,
        to:
          op.kind === 'return'
            ? (parent?.symbol ?? 'caller')
            : (op.symbol ?? frame.symbol),
        ...op.values,
        ...(op.kind === 'return' && op.assignTo
          ? { assignedTo: op.assignTo, assignedInCallId: parent!.id }
          : {}),
      },
      before: beforeSnapshot,
      after,
      locals: Object.fromEntries(
        [...state.frames, ...[...state.taskFrames.values()].flat()].map((f) => [
          f.id,
          clone(f.locals),
        ]),
      ),
      objects: clone(state.objects),
      stack: frames.map((f) => f.id),
      certainty: op.certainty,
      ...(op.inputs ? { inputs: clone(op.inputs) } : {}),
      ...(Object.hasOwn(op, 'result') ? { result: clone(op.result) } : {}),
      ...(op.output !== undefined ? { output: op.output } : {}),
      ...(op.objectId ? { objectId: op.objectId } : {}),
      ...(op.origins ? { origins: op.origins } : {}),
      ...(op.snippet ? { snippet: op.snippet } : {}),
      ...(op.note ? { note: op.note } : {}),
    };
    return sceneCallId !== undefined
      ? parseSceneEvent(event)
      : eventSchema.parse(event);
  }
  close() {
    for (const b of this.sceneBuilds.values()) b.events.close();
    this.sceneBuilds.clear();
    for (const b of this.builds.values()) b.events.close();
    this.builds.clear();
  }
}
