declare module '../../../../public/source-highlighter.js' {
  export function prepareSourceHighlighting(
    lines: string[],
    fileName: string,
  ): ((lineNum: number) => { text: string; kind?: string }[] | undefined) | undefined;
}