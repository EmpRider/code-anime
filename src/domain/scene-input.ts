import type { z } from 'zod';
import type { operationSchema } from '../services/animation-builder.js';
import type { TraceEvent } from './trace.js';
import type { ReadyVariant } from './flow-scene.js';

type Node = ReadyVariant['graph']['nodes'][number];
type Edge = ReadyVariant['graph']['edges'][number];
type Group = ReadyVariant['graph']['groups'][number];
type SourceFile = ReadyVariant['source']['files'][number];
export type SourceLocation = NonNullable<TraceEvent['source']>;
export type StateOperation = Omit<z.infer<typeof operationSchema>, 'groupPath'>;
export type AuthoredNode = Omit<
  Node,
  'id' | 'eventIds' | 'callId' | 'groupPathIds' | 'sourceRef'
> & {
  key: string;
  callKey: string;
  groupPathKeys: string[];
  source: SourceLocation | null;
};
export type AuthoredEdge = Omit<
  Edge,
  'id' | 'fromNodeId' | 'toNodeId' | 'callTransition'
> & {
  key: string;
  fromNodeKey: string;
  toNodeKey: string;
  callTransition: { fromCallKey: string; toCallKey: string } | null;
};
export type AuthoredGroup = Omit<
  Group,
  'id' | 'parentGroupId' | 'memberNodeIds' | 'callId' | 'sourceRef'
> & {
  key: string;
  parentGroupKey: string | null;
  memberNodeKeys: string[];
  callKey: string;
  source: SourceLocation | null;
};
export type AuthoredOperation = StateOperation & {
  key: string;
  nodeKey: string;
  callKey: string;
  parentCallKey?: string;
  activeEdgeKeys: string[];
};
export type SceneBegin = {
  projectRoot: string;
  endpoint: string;
  evidenceIds: string[];
  scenario: Record<string, unknown>;
  baselineSessionId?: string;
};
export type SceneAppend = {
  action: 'append';
  buildId: string;
  batchId: string;
  expectedEventCount: number;
  operations: AuthoredOperation[];
  nodes: AuthoredNode[];
  edges: AuthoredEdge[];
  groups: AuthoredGroup[];
};
export type AcceptedSceneInput = Pick<
  ReadyVariant,
  'artifact' | 'scenario' | 'provenance' | 'status' | 'graph'
> & {
  sources: Array<Omit<SourceFile, 'tokenSpans'>>;
  events: TraceEvent[];
  activeEdgeIdsByEventId: ReadonlyMap<string, readonly string[]>;
};
