import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import prettier from 'prettier';

test('temporary docs recovery emits repository-native formatted documents', async () => {
  const files = [
    'docs/implementation-handoff-2026-10-28.md',
    'docs/code-anime-elk-reviewed-implementation-plan-2026-10-27.md',
    'docs/elk-implementation-tasks.md',
  ];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const current = await readFile(file, 'utf8');
    const config = await prettier.resolveConfig(file);
    const formatted = await prettier.format(current, { ...config, filepath: file });
    assert.ok(formatted.includes('Code Anime') || formatted.includes('ELK'));
    const encoded = Buffer.from(formatted, 'utf8').toString('base64');
    console.log('DOCS_FORMAT_BEGIN_' + i);
    for (let j = 0; j < encoded.length; j += 950) {
      console.log('DOCS_FORMAT_CHUNK_' + i + '=' + encoded.slice(j, j + 950));
    }
    console.log('DOCS_FORMAT_END_' + i);
  }
});
