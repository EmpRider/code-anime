import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  collectSourceFiles,
  sourceBoundary,
} from '../src/services/source-catalog.js';
import type { TraceEvent } from '../src/domain/trace.js';

function event(file: string, index: number): TraceEvent {
  return {
    id: `synthetic-${index}`,
    kind: 'statement',
    symbolId: 'Example.run',
    label: 'Simulated statement',
    callId: 'simulation-1',
    source: { file, line: 1, endLine: 1 },
    values: {},
    stack: ['simulation-1'],
    certainty: 'mock',
  };
}

test('static source snapshots exclude generated, dependency, sensitive and out-of-root files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-sources-'));
  const external = await mkdtemp(join(tmpdir(), 'code-anime-external-'));
  try {
    await mkdir(join(root, 'src'));
    await mkdir(join(root, 'vendor'));
    await mkdir(join(root, 'build'));
    await mkdir(join(root, 'node_modules'));
    await writeFile(join(root, 'src', 'Main.kt'), 'fun run() = 1\n');
    await writeFile(join(root, 'vendor', 'Lib.kt'), 'external library');
    await writeFile(join(root, 'build', 'Generated.kt'), 'generated');
    await writeFile(join(root, 'node_modules', 'dependency.js'), 'dependency');
    await writeFile(join(root, '.env.local'), 'SECRET=never-snapshot');
    await writeFile(join(external, 'Outside.kt'), 'outside project');

    const paths = [
      'src/Main.kt',
      'vendor/Lib.kt',
      'build/Generated.kt',
      'node_modules/dependency.js',
      '.env.local',
      join(external, 'Outside.kt'),
    ];
    const result = await collectSourceFiles(root, paths.map(event));
    assert.deepEqual(Object.keys(result.files), ['src/Main.kt']);
    assert.equal(result.files['src/Main.kt'], 'fun run() = 1\n');
    assert.equal(result.diagnostics.length, paths.length - 1);
    assert.ok(result.diagnostics.some((note) => note.includes('outside')));
    assert.ok(result.diagnostics.every((note) => !note.includes('SECRET=')));
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(external, { recursive: true, force: true });
  }
});

test('CodeGraph source boundaries reject symlink aliases to external and excluded source', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-linked-'));
  const external = await mkdtemp(join(tmpdir(), 'code-anime-outside-'));
  try {
    await mkdir(join(root, 'vendor'));
    await mkdir(join(root, 'src'));
    await writeFile(join(external, 'Outside.kt'), 'outside project\n');
    await writeFile(join(root, 'vendor', 'Lib.kt'), 'excluded source\n');
    const linkType = process.platform === 'win32' ? 'junction' : 'dir';
    try {
      await symlink(external, join(root, 'external-link'), linkType);
      await symlink(join(root, 'vendor'), join(root, 'vendor-link'), linkType);
    } catch (error) {
      if (
        ['EPERM', 'EACCES', 'ENOTSUP'].includes(
          (error as NodeJS.ErrnoException).code ?? '',
        )
      ) {
        t.skip('The filesystem does not permit directory symlinks');
        return;
      }
      throw error;
    }
    assert.match(
      sourceBoundary(root, 'external-link/Outside.kt') ?? '',
      /outside the selected project/,
    );
    assert.match(
      sourceBoundary(root, 'vendor-link/Lib.kt') ?? '',
      /dependency, generated, or sensitive/,
    );
    assert.match(
      sourceBoundary(root, 'external-link/Missing.kt') ?? '',
      /outside the selected project/,
    );
    assert.match(
      sourceBoundary(root, 'vendor-link/Missing.kt') ?? '',
      /dependency, generated, or sensitive/,
    );
    assert.match(
      sourceBoundary(root, 'vendor-link/not-created/Nested.kt') ?? '',
      /dependency, generated, or sensitive/,
    );
    assert.match(
      sourceBoundary(root, 'external-link/not-created/Nested.kt') ?? '',
      /outside the selected project/,
    );
    assert.equal(sourceBoundary(root, 'src/Missing.kt'), null);
    const source = await collectSourceFiles(
      root,
      ['external-link/Outside.kt', 'vendor-link/Lib.kt'].map(event),
    );
    assert.deepEqual(Object.keys(source.files), []);
    assert.equal(source.diagnostics.length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(external, { recursive: true, force: true });
  }
});

test('static source snapshots enforce per-file and aggregate byte budgets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-source-budget-'));
  try {
    const paths = Array.from({ length: 6 }, (_, i) => `File${i}.kt`);
    for (const file of paths)
      await writeFile(join(root, file), 'x'.repeat(450_000));
    await writeFile(join(root, 'TooLarge.kt'), 'y'.repeat(512 * 1024 + 1));
    const result = await collectSourceFiles(
      root,
      [...paths, 'TooLarge.kt'].map(event),
    );
    assert.equal(Object.keys(result.files).length, 4);
    assert.equal(result.diagnostics.length, 3);
    assert.ok(
      result.diagnostics.every(
        (note) => note.includes('budget') || note.includes('512 KiB'),
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('source snapshots handle filenames that shadow JavaScript object properties', async () => {
  const root = await mkdtemp(join(tmpdir(), 'code-anime-source-keys-'));
  try {
    for (const file of ['__proto__', 'constructor', 'toString'])
      await writeFile(join(root, file), `inert source: ${file}\n`);
    const result = await collectSourceFiles(
      root,
      ['__proto__', 'constructor', 'toString', 'hasOwnProperty'].map(event),
    );
    for (const file of ['__proto__', 'constructor', 'toString']) {
      assert.ok(Object.hasOwn(result.files, file));
      assert.equal(result.files[file], `inert source: ${file}\n`);
    }
    assert.ok(!Object.hasOwn(result.files, 'hasOwnProperty'));
    assert.equal(result.diagnostics.length, 1);
    assert.deepEqual(Object.keys(result.files).length, 3);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
