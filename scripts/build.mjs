import { rmSync, writeFileSync } from 'node:fs';
import { content as x6CSS } from '@antv/x6/es/style/raw.js';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { build } from 'vite';
const root = resolve(import.meta.dirname, '..');
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
