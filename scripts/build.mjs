import { createHash } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { content as x6CSS } from '@antv/x6/es/style/raw.js';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { build } from 'vite';
const root = resolve(import.meta.dirname, '..');
// Preserve official GWT Worker bytes; do not rebundle JavaScript.
const worker = readFileSync(
  resolve(root, 'node_modules/elkjs/lib/elk-worker.min.js'),
);
if (
  createHash('sha256').update(worker).digest('hex') !==
  'e4f5c51c6f2fd564bb64e52e81c4a85a316ef2f24f8b90e1db5eb886c765b030'
)
  throw new Error('elkjs@0.12.0 original Worker digest mismatch');
writeFileSync(resolve(root, 'public/vendor/elk-worker.min.js'), worker);
writeFileSync(
  resolve(root, 'public/vendor/elkjs/LICENSE.md'),
  readFileSync(resolve(root, 'node_modules/elkjs/LICENSE.md')),
);
// Serve X6 styles as an external asset without weakening the player's CSP.
writeFileSync(resolve(root, 'public/vendor/x6.css'), x6CSS);
await build({
  configFile: false,
  root,
  publicDir: false,
  build: {
    outDir: resolve(root, 'public/diagram'),
    emptyOutDir: true,
    lib: {
      entry: {
        diagram: resolve(root, 'public/diagram.js'),
      },
      formats: ['es'],
      fileName: (_format, name) => name + '.js',
      cssFileName: 'diagram',
    },
  },
});
rmSync(resolve(root, 'dist'), { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    resolve(root, 'node_modules/typescript/bin/tsc'),
    '-p',
    resolve(root, 'tsconfig.json'),
  ],
  { stdio: 'inherit', cwd: root },
);
