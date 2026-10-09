import { rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
rmSync('dist', { recursive: true, force: true });
execFileSync(
  process.execPath,
  ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'],
  { stdio: 'inherit' },
);
mkdirSync('dist/recording', { recursive: true });
copyFileSync('src/recording/python-recorder.py', 'dist/recording/python-recorder.py');
