import { test } from 'node:test';
import assert from 'node:assert/strict';
import { win32 } from 'node:path';
import { resolveCodeGraphLaunch } from '../src/analysis/codegraph-launcher.js';

test('Windows npm-installed CodeGraph uses the Node shim with MCP stdio intact', () => {
  const folder = 'C:\\Users\\Example Person\\AppData\\Roaming\\npm';
  const wrapper = win32.join(folder, 'codegraph.cmd');
  const shim = win32.join(
    folder,
    'node_modules',
    '@colbymchenry',
    'codegraph',
    'npm-shim.js',
  );
  const exists = (path: string) => path === wrapper || path === shim;
  assert.deepEqual(
    resolveCodeGraphLaunch('codegraph', ['--custom'], {
      platform: 'win32',
      path: `C:\\Unrelated;${folder}`,
      node: 'C:\\node\\node.exe',
      exists,
    }),
    { command: 'C:\\node\\node.exe', args: [shim, '--custom'] },
  );
  assert.deepEqual(
    resolveCodeGraphLaunch(wrapper, [], { platform: 'win32', exists }),
    { command: process.execPath, args: [shim] },
  );
});

test('CodeGraph command overrides and unknown Windows wrappers remain unchanged', () => {
  const unchanged = { command: 'my-graph.exe', args: ['--option'] };
  assert.deepEqual(
    resolveCodeGraphLaunch(unchanged.command, unchanged.args, {
      platform: 'win32',
    }),
    unchanged,
  );
  assert.deepEqual(
    resolveCodeGraphLaunch('codegraph', ['serve'], {
      platform: 'linux',
    }),
    { command: 'codegraph', args: ['serve'] },
  );
  const wrapper = 'C:\\Tools\\codegraph.cmd';
  assert.deepEqual(
    resolveCodeGraphLaunch(wrapper, ['serve'], {
      platform: 'win32',
      exists: (path) => path === wrapper,
    }),
    { command: wrapper, args: ['serve'] },
  );
});
