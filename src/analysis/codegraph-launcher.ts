import { existsSync } from 'node:fs';
import { win32 } from 'node:path';

interface LaunchEnvironment {
  platform?: string;
  path?: string;
  node?: string;
  exists?: (path: string) => boolean;
}

/**
 * The npm CodeGraph Windows command is a .cmd wrapper. Node's child-process
 * APIs cannot spawn these wrappers directly on current Windows runtimes.
 * Invoke the package's own Node shim instead, preserving stdio for MCP.
 */
export function resolveCodeGraphLaunch(
  command: string,
  args: string[],
  environment: LaunchEnvironment = {},
) {
  const direct = { command, args };
  if ((environment.platform ?? process.platform) !== 'win32') return direct;

  const isBare = /^codegraph(?:\.cmd)?$/i.test(command);
  if (!isBare && !/\.cmd$/i.test(command)) return direct;
  const exists = environment.exists ?? existsSync;
  const candidates = isBare
    ? (environment.path ?? process.env.PATH ?? '')
        .split(';')
        .filter(Boolean)
        .map((folder) =>
          win32.join(folder.replace(/^"|"$/g, ''), 'codegraph.cmd'),
        )
    : [command];
  for (const candidate of candidates) {
    const wrapper = win32.resolve(candidate);
    if (!exists(wrapper)) continue;
    const shim = win32.join(
      win32.dirname(wrapper),
      'node_modules',
      '@colbymchenry',
      'codegraph',
      'npm-shim.js',
    );
    return exists(shim)
      ? {
          command: environment.node ?? process.execPath,
          args: [shim, ...args],
        }
      : direct;
  }
  return direct;
}
