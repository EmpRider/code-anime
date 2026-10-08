import type { Flow } from '../domain/flow.js';
import type { Trace } from '../domain/trace.js';

export interface AnalysisInput {
  provider?: 'codegraph' | undefined;
  projectRoot: string;
  target: string;
  scenario?: Record<string, unknown> | undefined;
  maxDepth?: number | undefined;
  maxEvents?: number | undefined;
}

export function traceToFlow(trace: Trace, endpoint: string): Flow {
  return {
    endpoint: endpoint.slice(0, 200),
    trace,
    steps: trace.events.map((event, i) => ({
      from:
        typeof event.values.from === 'string'
          ? event.values.from
          : event.kind === 'enter'
            ? event.symbolId
            : i
              ? trace.events[i - 1]!.symbolId
              : event.symbolId,
      to:
        typeof event.values.to === 'string' ? event.values.to : event.symbolId,
      dtoName: event.kind + ' · ' + event.label.slice(0, 120),
      dtoFields: { ...event.values, certainty: event.certainty },
    })),
  };
}

export class CandidateError extends Error {
  constructor(
    public readonly candidates: Array<{
      id: string;
      name: string;
      file: string;
      line: number;
    }>,
  ) {
    super('Select an unambiguous CodeGraph target using its candidate ID');
  }
}
