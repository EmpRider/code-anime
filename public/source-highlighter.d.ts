export type SourceHighlightSegment = {
  text: string;
  kind?: 'keyword' | 'string' | 'number' | 'comment';
};

/** Display-only lexer; the returned accessor uses one-based line numbers. */
export declare function prepareSourceHighlighting(
  lines: readonly string[],
  file: string,
): (lineNumber: number) => SourceHighlightSegment[];
