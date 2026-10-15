import { readFile, realpath, stat } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import type { TraceEvent } from '../domain/trace.js';

const excludedDirectories = new Set([
  '.git',
  '.gradle',
  '.next',
  '.venv',
  '__pycache__',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'target',
  'vendor',
  'venv',
]);

function excludedSource(relativePath: string) {
  const segments = relativePath.toLowerCase().split(sep);
  const name = segments.at(-1) ?? '';
  return (
    segments.slice(0, -1).some((part) => excludedDirectories.has(part)) ||
    name === '.env' ||
    name.startsWith('.env.') ||
    ['.npmrc', '.pypirc', 'credentials.json', 'id_rsa', 'id_ed25519'].includes(
      name,
    ) ||
    /\.(?:pem|p12|pfx|key)$/.test(name)
  );
}

// Scope graph expansion before fetching additional definitions. Filesystem
// realpath checks below additionally guard against symlinks during snapshots.
export function sourceBoundary(projectRoot: string, sourcePath: string) {
  const candidate = isAbsolute(sourcePath)
    ? sourcePath
    : resolve(projectRoot, sourcePath);
  const inside = relative(resolve(projectRoot), candidate);
  if (inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside))
    return 'source is outside the selected project';
  if (excludedSource(inside))
    return 'dependency, generated, or sensitive source excluded';
  // CodeGraph paths may traverse a symlink within the project. Apply the
  // same canonical boundary used for source snapshots before graph expansion.
  // Virtual/stale provider paths remain eligible for unresolved evidence.
  try {
    const canonicalRoot = realpathSync(projectRoot);
    let ancestor = candidate;
    let canonicalSource: string;
    for (;;) {
      try {
        canonicalSource = realpathSync(ancestor);
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT' && code !== 'ENOTDIR') throw error;
        const parent = dirname(ancestor);
        if (parent === ancestor) return 'source path cannot be verified';
        ancestor = parent;
      }
    }
    // An existing ancestor may be a symlink into an excluded directory.
    // Preserve the unresolved child suffix so the target directory is checked
    // as a parent segment, rather than mistaken for a permitted filename.
    const canonicalCandidate = resolve(
      canonicalSource,
      relative(ancestor, candidate),
    );
    const canonicalInside = relative(canonicalRoot, canonicalCandidate);
    if (
      canonicalInside === '..' ||
      canonicalInside.startsWith('..' + sep) ||
      isAbsolute(canonicalInside)
    )
      return 'symlink resolves outside the selected project';
    if (excludedSource(canonicalInside))
      return 'symlink resolves to dependency, generated, or sensitive source';
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT' && code !== 'ENOTDIR')
      return 'source path cannot be verified';
  }
  return null;
}

// Capture source once, during preprocessing, so the player never rereads or
// reanalyzes changing project files. Only source paths referenced by the trace
// and located inside the indexed project may be included.
export async function collectSourceFiles(
  projectRoot: string,
  events: TraceEvent[],
) {
  // Source paths are arbitrary project filenames, including Object.prototype
  // names such as "constructor" and "__proto__". Never inherit dictionary keys.
  const files: Record<string, string> = Object.create(null);
  const diagnostics: string[] = [];
  const root = await realpath(projectRoot);
  const paths = [
    ...new Set(events.flatMap((e) => (e.source ? [e.source.file] : []))),
  ];
  let total = 0;
  for (const sourcePath of paths) {
    try {
      const boundary = sourceBoundary(root, sourcePath);
      if (boundary) throw new Error(boundary);
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
      if (excludedSource(inside))
        throw new Error('dependency, generated, or sensitive source excluded');
      const info = await stat(actual);
      if (!info.isFile() || info.size > 512 * 1024)
        throw new Error('source is not a regular file under 512 KiB');
      if (total + info.size > 2 * 1024 * 1024)
        throw new Error('source snapshot exceeds the 2 MiB session budget');
      const content = await readFile(actual, 'utf8');
      // The file can grow between stat() and readFile(). Apply budgets to the
      // bytes actually retained in the prepared session as well.
      const bytes = Buffer.byteLength(content);
      if (bytes > 512 * 1024 || total + bytes > 2 * 1024 * 1024)
        throw new Error('source snapshot exceeds the prepared-session budget');
      files[sourcePath] = content;
      total += bytes;
    } catch (error) {
      diagnostics.push(
        `Source unavailable for ${sourcePath}: ${error instanceof Error ? error.message : String(error)}. Showing evidence excerpt if available.`,
      );
    }
  }
  return { files, diagnostics };
}
