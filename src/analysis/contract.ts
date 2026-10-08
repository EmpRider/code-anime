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
      from: i ? trace.events[i - 1]!.symbolId : event.symbolId,
      to: event.symbolId,
      dtoName: event.kind + ' · ' + event.label.slice(0, 120),
      dtoFields: { ...event.values, certainty: event.certainty },
    })),
  };
}
