import { prepareSourceHighlighting } from '../../public/source-highlighter.js';
import type { ReadyVariant, TokenSpan } from '../domain/flow-scene.js';
import type { AcceptedSceneInput } from '../domain/scene-input.js';

/** Decorate captured text without normalizing separators or interpreting source. */
export function prepareSceneSource(
  files: AcceptedSceneInput['sources'],
): ReadyVariant['source'] {
  return {
    files: files.map((file) => {
      const lines: string[] = [];
      const starts: number[] = [];
      let start = 0;
      for (const separator of file.text.matchAll(/\r\n|\r|\n/g)) {
        starts.push(start);
        lines.push(file.text.slice(start, separator.index));
        start = separator.index + separator[0].length;
      }
      starts.push(start);
      lines.push(file.text.slice(start));

      const highlight = prepareSourceHighlighting(lines, file.path);
      const tokenSpans: TokenSpan[] = [];
      for (let index = 0; index < lines.length; index++) {
        let offset = starts[index]!;
        for (const segment of highlight(index + 1)) {
          const end = offset + segment.text.length;
          if (segment.kind !== undefined && end > offset) {
            tokenSpans.push({
              startUtf16: offset,
              endUtf16: end,
              kind: segment.kind,
            });
          }
          offset = end;
        }
      }
      return {
        id: file.id,
        path: file.path,
        text: file.text,
        languageHint: file.languageHint,
        tokenSpans,
      };
    }),
  };
}
