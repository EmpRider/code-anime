import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  sourceLexicalStates,
  tokenizeSourceLine,
} from '../public/source-lexer.js';

function tokenizeFile(lines, file) {
  let state = null;
  return lines.map((line) => {
    const next = tokenizeSourceLine(line, file, state);
    assert.equal(
      next.segments.map((segment) => segment.value).join(''),
      line,
      'Lexical highlighting must preserve source bytes',
    );
    state = next.state;
    return next.segments;
  });
}

test('Python triple-quoted strings hide inner keywords and comments', () => {
  const lines = [
    'message = """hello',
    'def fake(): # literal markup <script>alert(1)</script>',
    'end""" # real comment',
    'return 10 // 2 # floor division',
  ];
  const result = tokenizeFile(lines, 'example.py');
  assert.deepEqual(result[1], [{ value: lines[1], kind: 'string' }]);
  assert.deepEqual(result[2], [
    { value: 'end"""', kind: 'string' },
    { value: ' ', kind: null },
    { value: '# real comment', kind: 'comment' },
  ]);
  assert.deepEqual(
    result[3].filter((segment) => segment.kind === 'comment'),
    [{ value: '# floor division', kind: 'comment' }],
  );
  assert.deepEqual(
    result[3].filter((segment) => segment.kind === 'keyword'),
    [{ value: 'return', kind: 'keyword' }],
  );
});

test('JavaScript block comments and template literals keep multiline context', () => {
  const lines = [
    '/* begin',
    'class Example {} // literal comment text',
    'end */ const value = `first // literal',
    'second ${value} /* literal */',
    'done`; // actual comment',
  ];
  const result = tokenizeFile(lines, 'app.ts');
  assert.deepEqual(result[1], [{ value: lines[1], kind: 'comment' }]);
  assert.deepEqual(
    result[2].filter((segment) => segment.kind === 'comment'),
    [{ value: 'end */', kind: 'comment' }],
  );
  assert.deepEqual(result[3], [{ value: lines[3], kind: 'string' }]);
  assert.deepEqual(
    result[4].filter((segment) => segment.kind === 'comment'),
    [{ value: '// actual comment', kind: 'comment' }],
  );
});

test('Kotlin raw strings keep comment-like text as literals', () => {
  const lines = [
    'val description = """begin',
    '/* inside */',
    'end""" // outside',
  ];
  const result = tokenizeFile(lines, 'demo.kt');
  assert.deepEqual(result[1], [{ value: '/* inside */', kind: 'string' }]);
  assert.deepEqual(
    result[2].filter((segment) => segment.kind === 'comment'),
    [{ value: '// outside', kind: 'comment' }],
  );
});

test('lexical state persists when a long source file renders its middle window', () => {
  const lines = Array.from({ length: 1400 }, (_, index) => 'line ' + index);
  lines[2] = 'doc = """begin';
  lines[1250] = 'end""" # outside';
  const states = sourceLexicalStates(lines, 'large.py');
  assert.equal(states[1100], '"""');
  assert.equal(states[1250], '"""');
  assert.equal(states[1251], null);
  assert.deepEqual(
    tokenizeSourceLine('return # still literal', 'large.py', states[1100])
      .segments,
    [{ value: 'return # still literal', kind: 'string' }],
  );
});
