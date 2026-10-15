import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const forbiddenArtifacts = ['src/services/recording-service.ts'];
const forbiddenNames = [
  /\brecord_execution\b/,
  /\bRecordingService\b/,
  /\bnode-recorder\b/,
  /\bpython-recorder\b/,
  /\binspector-stderr\b/,
  /\btrace\.recording\b/,
  /\bcertainty\s*:\s*['"]observed['"]/,
];

async function* files(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (entry.isFile()) yield path;
  }
}

for (const artifact of forbiddenArtifacts) {
  const parts = artifact.split('/');
  const parent = join(root, ...parts.slice(0, -1));
  assert.ok(
    !(
      await readdir(parent).catch((error) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      })
    ).includes(parts.at(-1)),
    `Runtime recorder is forbidden: ${artifact}`,
  );
}
// Git leaves an empty directory behind when recorder files are deleted.
// Require the tracked/runtime asset directory to remain empty if present.
const recorderFiles = await readdir(join(root, 'src/recording')).catch(
  (error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  },
);
assert.deepEqual(recorderFiles, [], 'Runtime recorder assets are forbidden');

for (const directory of ['src', 'public']) {
  for await (const path of files(join(root, directory))) {
    if (!/\.(?:ts|js|mjs|py|html)$/.test(path)) continue;
    const content = await readFile(path, 'utf8');
    for (const pattern of forbiddenNames) {
      assert.ok(
        !pattern.test(content),
        `Static/mock scope violation in ${relative(root, path)}: ${pattern}`,
      );
    }
  }
}

const rules = await readFile(join(root, 'AGENTS.md'), 'utf8');
const skill = await readFile(join(root, 'skills/code-anime/SKILL.md'), 'utf8');
assert.match(rules, /static code-analysis and AI mock-data/i);
assert.match(
  rules,
  /never execute, import, evaluate, compile-and-run, or instrument/i,
);
assert.match(skill, /static CodeGraph \+ AI-generated MOCK values only/);
console.log('Static/mock-only scope guard passed.');
