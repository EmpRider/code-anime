// Temporary CI-only formatter diagnostic, removed after the scoped fix.
import { readFile } from 'node:fs/promises';
import prettier from 'prettier';

const paths = [
  'public/diagram-label-placement.js',
  'public/diagram.css',
  'public/diagram.js',
  'tests/diagram-elk-layout.test.mjs',
  'tests/diagram-label-placement.test.mjs',
];

function changes(oldText, newText) {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const edits = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    let best = null;
    for (let di = 0; di <= 70 && i + di < a.length; di++) {
      for (let dj = 0; dj <= 70 && j + dj < b.length; dj++) {
        if (a[i + di] !== b[j + dj]) continue;
        const cost = di + dj;
        if (!best || cost < best.cost) best = { di, dj, cost };
      }
    }
    const di = best ? best.di : a.length - i;
    const dj = best ? best.dj : b.length - j;
    edits.push({ line: i + 1, old: a.slice(i, i + di), new: b.slice(j, j + dj) });
    i += di;
    j += dj;
  }
  return edits;
}

for (const path of paths) {
  const text = await readFile(path, 'utf8');
  const config = (await prettier.resolveConfig(path)) ?? {};
  const formatted = await prettier.format(text, { ...config, filepath: path });
  if (text !== formatted)
    console.log('FORMAT_DIFF_JSON ' + JSON.stringify({ path, changes: changes(text, formatted) }));
}
