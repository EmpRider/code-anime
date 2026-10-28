import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import prettier from 'prettier';

test('T1a temporary formatter diagnostics only', async () => {
  const file = 'public/semantic-flow-model.js';
  const current = await readFile(file, 'utf8');
  const config = await prettier.resolveConfig(file);
  const formatted = await prettier.format(current, { ...config, filepath: file });
  assert.ok(formatted.includes('export function buildSemanticFlow'));
  const encoded = Buffer.from(formatted, 'utf8').toString('base64');
  console.log('T1A_FORMAT_BASE64_BEGIN');
  for (let i = 0; i < encoded.length; i += 1000) console.log('T1A_FORMAT_CHUNK=' + encoded.slice(i, i + 1000));
  console.log('T1A_FORMAT_BASE64_END');
});
