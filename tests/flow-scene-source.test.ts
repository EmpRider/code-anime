import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AcceptedSceneInput } from '../src/domain/scene-input.js';
import type { SceneSourceFile } from '../src/domain/flow-scene.js';
import { prepareSceneSource } from '../src/services/flow-scene-source.js';

function file(
  path: string,
  text: string,
): AcceptedSceneInput['sources'][number] {
  return { id: `file:${path}`, path, text, languageHint: null };
}

function decorated(file: SceneSourceFile) {
  return file.tokenSpans
    .filter((span) =>
      ['keyword', 'number', 'string', 'comment'].includes(span.kind),
    )
    .map((span) => ({
      ...span,
      text: file.text.slice(span.startUtf16, span.endUtf16),
    }));
}

function assertSafeSpans(file: SceneSourceFile) {
  let previousEnd = 0;
  for (const span of file.tokenSpans) {
    assert.ok(Number.isSafeInteger(span.startUtf16));
    assert.ok(Number.isSafeInteger(span.endUtf16));
    assert.ok(span.startUtf16 >= previousEnd);
    assert.ok(span.startUtf16 < span.endUtf16);
    assert.ok(span.endUtf16 <= file.text.length);
    for (const boundary of [span.startUtf16, span.endUtf16]) {
      const left = file.text.charCodeAt(boundary - 1);
      const right = file.text.charCodeAt(boundary);
      assert.equal(
        left >= 0xd800 && left <= 0xdbff && right >= 0xdc00 && right <= 0xdfff,
        false,
      );
    }
    previousEnd = span.endUtf16;
  }
}

test('mixed CRLF LF and CR source keeps exact text and whole-text UTF-16 token offsets', () => {
  const sources = [
    file('main.ts', 'const face = "🙂";\r\nreturn 2;\n// note\rlet x = 3;'),
  ];
  const before = structuredClone(sources);
  const result = prepareSceneSource(sources);
  assert.equal(result.files.length, 1);
  const prepared = result.files[0]!;
  assert.equal(
    prepared.text,
    'const face = "🙂";\r\nreturn 2;\n// note\rlet x = 3;',
  );
  assert.equal(prepared.id, 'file:main.ts');
  assert.equal(prepared.path, 'main.ts');
  assert.equal(prepared.languageHint, null);
  assert.deepEqual(decorated(prepared), [
    { startUtf16: 0, endUtf16: 5, kind: 'keyword', text: 'const' },
    { startUtf16: 13, endUtf16: 17, kind: 'string', text: '"🙂"' },
    { startUtf16: 20, endUtf16: 26, kind: 'keyword', text: 'return' },
    { startUtf16: 27, endUtf16: 28, kind: 'number', text: '2' },
    { startUtf16: 30, endUtf16: 37, kind: 'comment', text: '// note' },
    { startUtf16: 38, endUtf16: 41, kind: 'keyword', text: 'let' },
    { startUtf16: 46, endUtf16: 47, kind: 'number', text: '3' },
  ]);
  assertSafeSpans(prepared);
  assert.deepEqual(sources, before);
});

test('multiline display-lexer state survives line splitting and astral text', () => {
  const prepared = prepareSceneSource([
    file('main.ts', '/* open\r\nstill 🙂 */\nconst n = 1;\n'),
  ]).files[0]!;
  assert.equal(prepared.text, '/* open\r\nstill 🙂 */\nconst n = 1;\n');
  assert.deepEqual(decorated(prepared), [
    { startUtf16: 0, endUtf16: 7, kind: 'comment', text: '/* open' },
    { startUtf16: 9, endUtf16: 20, kind: 'comment', text: 'still 🙂 */' },
    { startUtf16: 21, endUtf16: 26, kind: 'keyword', text: 'const' },
    { startUtf16: 31, endUtf16: 32, kind: 'number', text: '1' },
  ]);
  assertSafeSpans(prepared);
});

test('empty files trailing separators and plain astral characters remain unchanged', () => {
  const result = prepareSceneSource([
    file('empty.ts', ''),
    file('newline.ts', '\r\n\n\r'),
    file('unicode.ts', '🙂 const x = "🧪";\n'),
  ]);
  assert.deepEqual(
    result.files.map((item) => item.text),
    ['', '\r\n\n\r', '🙂 const x = "🧪";\n'],
  );
  assert.deepEqual(result.files[0]!.tokenSpans, []);
  assert.deepEqual(decorated(result.files[1]!), []);
  assert.deepEqual(decorated(result.files[2]!), [
    { startUtf16: 3, endUtf16: 8, kind: 'keyword', text: 'const' },
    { startUtf16: 13, endUtf16: 17, kind: 'string', text: '"🧪"' },
  ]);
  for (const prepared of result.files) assertSafeSpans(prepared);
});

test('the reused display lexer selects each file language without changing identities', () => {
  const result = prepareSceneSource([
    file('workflow.py', 'def f():\n    return True'),
    file('Workflow.kt', 'val x = 7'),
    file('Workflow.java', 'int n = 2;'),
    file('workflow.ts', 'const n = 1'),
  ]);
  assert.deepEqual(
    result.files.map((item) => [item.id, item.path]),
    [
      ['file:workflow.py', 'workflow.py'],
      ['file:Workflow.kt', 'Workflow.kt'],
      ['file:Workflow.java', 'Workflow.java'],
      ['file:workflow.ts', 'workflow.ts'],
    ],
  );
  assert.deepEqual(
    result.files.map((item) =>
      decorated(item).map((span) => [span.kind, span.text]),
    ),
    [
      [
        ['keyword', 'def'],
        ['keyword', 'return'],
        ['keyword', 'True'],
      ],
      [
        ['keyword', 'val'],
        ['number', '7'],
      ],
      [
        ['keyword', 'int'],
        ['number', '2'],
      ],
      [
        ['keyword', 'const'],
        ['number', '1'],
      ],
    ],
  );
});

test('opaque filenames and source snapshots remain detached from caller mutation', () => {
  const sources = [
    file('__proto__', 'const n = 1'),
    file('constructor', 'return 2'),
  ];
  const before = structuredClone(sources);
  const result = prepareSceneSource(sources);
  assert.deepEqual(sources, before);
  assert.deepEqual(
    result.files.map((item) => item.path),
    ['__proto__', 'constructor'],
  );
  sources[0]!.text = 'changed';
  sources[1]!.path = 'changed';
  assert.equal(result.files[0]!.text, 'const n = 1');
  assert.equal(result.files[1]!.path, 'constructor');
  Reflect.set(result.files[0]!, 'text', 'output changed');
  assert.equal(sources[0]!.text, 'changed');
});
