import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  plainTerminalText,
  preparePlainTerminalOutput,
} from '../public/terminal-text.js';

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

function output(value, stream = 'stdout') {
  return { kind: 'console', output: value, values: { stream } };
}

test('ANSI CSI and OSC sequences are decoded across event boundaries per stream', () => {
  const events = [
    output('before\x1b[3'),
    output('error\n', 'stderr'),
    output('1mred'),
    output('\x1b[0m after\n'),
    output('title\x1b]0;split'),
    output(' title\x1b'),
    output('\\ready\x1b]0;done'),
    output('\x07!'),
  ];
  const originals = events.map((event) => event.output);
  assert.deepEqual(preparePlainTerminalOutput(events), [
    'before',
    'error\n',
    'red',
    ' after\n',
    'title',
    '',
    'ready',
    '!',
  ]);
  assert.deepEqual(
    events.map((event) => event.output),
    originals,
  );
});

test('only complete control sequences are hidden; plain, invalid and unfinished text stays at its event', () => {
  const events = [
    output('plain\n', 'stdout'),
    output('A\x1b[1', 'stderr'),
    output('B\x1b]unclosed', 'stdout'),
    output('x\x1bPx\x1b[31\ny', 'other'),
  ];
  assert.deepEqual(
    preparePlainTerminalOutput(events),
    events.map((e) => e.output),
  );
  assert.equal(plainTerminalText('unchanged🙂\n'), 'unchanged🙂\n');
});

test('output decoding crosses console-history and stored-continuation boundaries', () => {
  const events = Array.from({ length: 299 }, (_, i) => output(`row-${i}\n`));
  events.push(output('before\x1b[3'));
  events.push(output('2mcolored'));
  events.push(output('\x1b[0m after'));
  const result = preparePlainTerminalOutput(events);
  assert.equal(result[299], 'before');
  assert.equal(result[300], 'colored');
  assert.equal(result[301], ' after');
  assert.equal(result.slice(299, 302).join(''), 'beforecolored after');
  assert.equal(result.slice(300).join(''), 'colored after');
  assert.equal(
    preparePlainTerminalOutput(events.slice(0, 300))[299],
    'before\x1b[3',
    'unfinished first chunk remains visible until a continuation is loaded',
  );
});
