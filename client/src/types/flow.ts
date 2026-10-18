/** Client-side mirror of src/domain/trace.ts + src/domain/flow.ts.
 * The server returns this shape from GET /api/flow/:id (see src/web/app.ts).
 * Kept in sync manually because the client cannot import Node-side zod schemas. */

export type EventKind =
  | 'enter'
  | 'statement'
  | 'call'
  | 'return'
  | 'assign'
  | 'transform'
  | 'mutate'
  | 'branch'
  | 'loop'
  | 'await'
  | 'yield'
  | 'resume'
  | 'throw'
  | 'catch'
  | 'console'
  | 'unresolved'
  | 'plan';

export type Certainty = 'static' | 'mock' | 'assumed' | 'unresolved' | 'proposed';

export interface SourceLocation {
  file: string;
  line: number;
  endLine: number;
  generated?: { file: string; line: number };
}

export interface TraceEvent {
  id: string;
  kind: EventKind;
  symbolId: string;
  label: string;
  callId: string;
  taskId?: string;
  parentCallId?: string;
  source?: SourceLocation;
  values: Record<string, unknown>;
  evidenceIds?: string[];
  inputs?: Record<string, unknown>;
  result?: unknown;
  output?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  objectId?: string;
  origins?: Record<string, string>;
  objects?: Record<string, Record<string, unknown>>;
  locals?: Record<string, unknown>;
  snippet?: string;
  stack: string[];
  certainty: Certainty;
  note?: string;
}

export interface Trace {
  version: 2;
  provider: string;
  projectRoot: string;
  sourceHash: string;
  target: string;
  scenario: Record<string, unknown>;
  events: TraceEvent[];
  sourceFiles?: Record<string, string>;
  diagnostics: string[];
  truncated: boolean;
  filesAnalyzed: number;
  cacheHits: number;
  simulation?: {
    mode: 'ai-mock';
    complete: boolean;
    coverage: string;
    evidenceIds: string[];
    coverageAssessment?: { status: string; reasons: string[] };
    provenanceIssues?: string[];
    previousSessionId?: string;
    baselineSessionId?: string;
  };
}

export interface FlowStep {
  from: string;
  to: string;
  dtoName: string;
  dtoFields: Record<string, unknown>;
}

export interface FlowData {
  trace?: Trace;
  baselineTrace?: Trace;
  baselineSessionId?: string;
  endpoint: string;
  steps: FlowStep[];
  nextSessionId?: string;
  baselineNextSessionId?: string;
}

export type ViewMode = 'path' | 'focus' | 'map';