export declare function plainTerminalText(value: unknown): string;
export declare function preparePlainTerminalOutput(
  events: Array<{
    kind?: string;
    output?: unknown;
    values?: { stream?: string };
  }>,
): Array<string | undefined>;
