import { validateFlowSceneDocument } from '../../public/v3-scene-adapter.js';

// Construction types for the existing 3.0.0 contract; CA028 remains its validator.
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };
export type Certainty =
  'static' | 'mock' | 'assumed' | 'unresolved' | 'proposed';
export type NodeKind =
  | 'entry'
  | 'statement'
  | 'decision'
  | 'branch'
  | 'loop'
  | 'iteration'
  | 'try'
  | 'catch'
  | 'finally'
  | 'switch'
  | 'case'
  | 'lambda'
  | 'call'
  | 'return'
  | 'throw'
  | 'await'
  | 'yield'
  | 'console'
  | 'unresolved';
export type EdgeKind =
  | 'sequence'
  | 'branch-true'
  | 'branch-false'
  | 'case'
  | 'loop-body'
  | 'loop-back'
  | 'loop-exit'
  | 'exception'
  | 'finally'
  | 'call'
  | 'return'
  | 'await'
  | 'resume'
  | 'unresolved';
export type GroupKind =
  | 'decision'
  | 'branch'
  | 'loop'
  | 'iteration'
  | 'try'
  | 'catch'
  | 'finally'
  | 'switch'
  | 'case'
  | 'lambda'
  | 'sequence'
  | 'unresolved';
export type SourceRange = {
  fileId: string;
  line: number;
  endLine: number;
  generated?: { fileId: string; line: number };
};
export type SceneNode = {
  id: string;
  kind: NodeKind;
  label: string;
  eventIds: string[];
  order: number;
  callId: string;
  taskId: string;
  groupPathIds: string[];
  sourceRef: SourceRange | null;
  certainty: Certainty;
  evidenceIds: string[];
  note: string | null;
};
export type SceneEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  kind: EdgeKind;
  label: string;
  certainty: Certainty;
  evidenceIds: string[];
  executionStatus: 'simulated-taken' | 'alternative' | 'unresolved';
  callTransition: { fromCallId: string; toCallId: string } | null;
};
export type SceneGroup = {
  id: string;
  kind: GroupKind;
  label: string;
  parentGroupId: string | null;
  memberNodeIds: string[];
  order: number;
  callId: string;
  taskId: string;
  arm: { id: string; label: string } | null;
  iteration: number | null;
  sourceRef: SourceRange | null;
  certainty: Certainty;
  evidenceIds: string[];
};
export type TokenSpan = {
  startUtf16: number;
  endUtf16: number;
  kind:
    | 'keyword'
    | 'identifier'
    | 'type'
    | 'function'
    | 'string'
    | 'number'
    | 'comment'
    | 'operator'
    | 'punctuation'
    | 'other';
};
export type SceneSourceFile = {
  id: string;
  path: string;
  text: string;
  languageHint: string | null;
  tokenSpans: TokenSpan[];
};
export type SceneFrame = {
  id: string;
  eventId: string;
  step: number;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  callId: string;
  taskId: string;
  sourceRef: SourceRange | null;
  valueSnapshotId: string;
  stackSnapshotId: string;
  consoleThrough: number;
};
export type SceneNavigation = {
  cursor: number;
  previousCursor: number | null;
  nextCursor: number | null;
  intoCursor: number | null;
  overCursor: number | null;
  outCursor: number | null;
};
export type ReadyVariant = {
  availability: 'ready';
  artifact: {
    id: string;
    sessionId: string;
    revision: string;
    createdAt: string;
    sourceHash: string;
    projectRoot: string;
    target: string;
    producer: 'code-anime-mcp';
  };
  scenario: { entrypoint: string; description: string; mockInputLabel: string };
  provenance: {
    provider: 'codegraph';
    simulationMode: 'ai-mock';
    receipts: Array<{
      id: string;
      tool: string;
      queryDigest: string;
      providerBoundary?: string;
    }>;
  };
  status: {
    complete: boolean;
    truncated: boolean;
    coverage: {
      status: 'unknown' | 'partial' | 'unresolved' | 'provider-truncated';
      reasons: string[];
    };
    warnings: string[];
    diagnostics: string[];
  };
  graph: { nodes: SceneNode[]; edges: SceneEdge[]; groups: SceneGroup[] };
  source: { files: SceneSourceFile[] };
  playback: {
    initial: {
      valueSnapshotId: string;
      stackSnapshotId: string;
      consoleThrough: number;
    };
    frames: SceneFrame[];
    navigationByCursor: SceneNavigation[];
    valueSnapshots: Array<{
      id: string;
      variables: Record<string, JsonValue>;
      objects: Record<string, JsonValue>;
      result?: JsonValue;
    }>;
    stackSnapshots: Array<{
      id: string;
      frames: Array<{ callId: string; label: string }>;
    }>;
    consoleEntries: Array<{
      id: string;
      text: string;
      certainty: Certainty;
      sourceStep: number;
    }>;
    sourceVisits: Array<{
      fileId: string;
      line: number;
      callId: string | null;
      stepIds: number[];
    }>;
    invocations: Array<{
      callId: string;
      symbolId: string;
      parentCallId: string | null;
      entryStep: number;
      stepIds: number[];
    }>;
  };
};
export type UnavailableVariant = {
  availability: 'unavailable';
  reason: string;
};
export type VariantId = 'proposed' | 'baseline';
export type FlowSceneDocument = {
  schemaVersion: '3.0.0';
  comparison: { defaultVariantId: VariantId; variantOrder: VariantId[] };
  variantsById: {
    proposed: ReadyVariant;
    baseline?: ReadyVariant | UnavailableVariant;
  };
};

export function validateSceneDocument(raw: unknown): FlowSceneDocument {
  return validateFlowSceneDocument(raw);
}
