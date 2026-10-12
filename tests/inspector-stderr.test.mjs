import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInspectorStderrHandler } from '../src/recording/inspector-stderr.mjs';

const url = 'ws://127.0.0.1:7427/recording';
const help =
  'For help, see: https://nodejs.org/learn/getting-started/debugging\r\n';
function fixture() {
  const output = [],
    listening = [];
  let shutdowns = 0;
  const line = createInspectorStderrHandler({
    onListening: (value) => listening.push(value),
    onShutdown: () => shutdowns++,
    onOutput: (text) => output.push(text),
  });
  return { line, output, listening, shutdowns: () => shutdowns };
}

test('Node ending banner and its second help notice never become application output', () => {
  const f = fixture();
  for (const text of [
    `Debugger listening on ${url}\r\n`,
    help,
    'Debugger attached.\r\n',
    'actual error  \r\n',
    'Waiting for the debugger to disconnect...\r\n',
    `Debugger ending on ${url}\r\n`,
    help,
  ])
    f.line(text);
  assert.deepEqual(f.output, ['actual error  \r\n']);
  assert.deepEqual(f.listening, [url]);
  assert.equal(f.shutdowns(), 1);
});

test('application help text survives except for the immediate known ending sequence', () => {
  const f = fixture();
  f.line(`Debugger listening on ${url}\n`);
  f.line('Debugger attached.\n');
  f.line(help); // Delayed startup help.
  f.line(help); // Application text identical to the startup message.
  f.line(`Debugger ending on ${url}\n`);
  f.line(help);
  f.line(help); // Only one notice is consumed.
  f.line(`Debugger ending on ${url}\n`);
  f.line('application line\n');
  f.line(help); // No longer immediately follows an ending banner.
  f.line('unterminated  \r');
  assert.deepEqual(f.output, [
    help,
    help,
    'application line\n',
    help,
    'unterminated  \r',
  ]);
});

test('unknown banners, old help URLs, and prefixes preserve application bytes', () => {
  const f = fixture();
  f.line(help); // No Inspector URL has been announced.
  f.line(`Debugger listening on ${url}\n`);
  f.line('For help, see: https://nodejs.org/en/docs/inspector\n');
  f.line('Debugger ending on ws://127.0.0.1:1234/other\n');
  f.line(help);
  f.line('fragment  Waiting for the debugger to disconnect...\r\n');
  f.line(`tail\rDebugger ending on ${url}\n`);
  f.line(help);
  assert.deepEqual(f.output, [
    help,
    'Debugger ending on ws://127.0.0.1:1234/other\n',
    help,
    'fragment  ',
    'tail\r',
  ]);
});
