import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plainTerminalText } from '../public/terminal-text.js';

test('terminal control formatting is hidden without modifying recorded output', () => {
  const recorded = '\x1b[33m30\x1b[39m \x1b[33m6\x1b[39m\n';
  assert.equal(plainTerminalText(recorded), '30 6\n');
  assert.ok(recorded.includes('\x1b[33m'));
  assert.equal(
    plainTerminalText('\x1b]0;title\x07ready\x1b]0;done\x1b\\'),
    'ready',
  );
  assert.equal(plainTerminalText('line 1\nline 2'), 'line 1\nline 2');
});
