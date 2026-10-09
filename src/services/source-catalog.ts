import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import type { TraceEvent } from '../domain/trace.js';

// Capture source once, during preprocessing, so the player never rereads or
// reanalyzes changing project files. Only source paths referenced by the trace
// and located inside the indexed project may be included.
export async function collectSourceFiles(
  projectRoot: string,
  events: TraceEvent[],
) {
  const files: Record<string, string> = {};
  const diagnostics: string[] = [];
  const root = await realpath(projectRoot);
  const paths = [
    ...new Set(events.flatMap((e) => (e.source ? [e.source.file] : []))),
  ];
  let total = 0;
  for (const sourcePath of paths) {
    try {
      const candidate = isAbsolute(sourcePath)
        ? sourcePath
        : resolve(root, sourcePath);
      const actual = await realpath(candidate);
      const inside = relative(root, actual);
      if (
        inside === '..' ||
        inside.startsWith('..' + sep) ||
        isAbsolute(inside)
      )
        throw new Error('source is outside the indexed project');
      if (
        inside
          .split(sep)
          .some((part) => ['node_modules', '.git'].includes(part))
      )
        throw new Error('dependency or metadata source excluded');
      const info = await stat(actual);
      if (!info.isFile() || info.size > 512 * 1024)
        throw new Error('source is not a regular file under 512 KiB');
      if (total + info.size > 2 * 1024 * 1024)
        throw new Error('source snapshot exceeds the 2 MiB session budget');
      const content = await readFile(actual, 'utf8');
      files[sourcePath] = content;
      total += Buffer.byteLength(content);
    } catch (error) {
      diagnostics.push(
        `Source unavailable for ${sourcePath}: ${error instanceof Error ? error.message : String(error)}. Showing evidence excerpt if available.`,
      );
    }
  }
  return { files, diagnostics };
}
