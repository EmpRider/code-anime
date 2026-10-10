import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareSourceHighlighting } from '../public/source-highlighter.js';

function tokensFor(file, lines) {
  const decorate = prepareSourceHighlighting(lines, file);
  return lines.map((line, index) => {
    const tokens = decorate(index + 1);
    assert.equal(
      tokens.map((token) => token.text).join(''),
      line,
      `source text was changed in ${file}:${index + 1}`,
    );
    return tokens;
  });
}

test('Kotlin escaped quotes do not turn comments inside strings into comments', () => {
  const [tokens, next] = tokensFor('sample.kt', [
    'val text = "escaped \\" // still string" // real comment',
    'val result = 42',
  ]);
  assert.deepEqual(
    tokens
      .filter((token) => token.kind === 'comment')
      .map((token) => token.text),
    ['// real comment'],
  );
  assert.deepEqual(
    tokens
      .filter((token) => token.kind === 'string')
      .map((token) => token.text),
    ['"escaped \\" // still string"'],
  );
  assert.equal(next.find((token) => token.text === 'val')?.kind, 'keyword');
  assert.equal(next.find((token) => token.text === '42')?.kind, 'number');
});

test('Python escaped triple quotes keep lexical state across source windows', () => {
  const lines = [
    'def example():',
    '    text = """open',
    '    \\""" # still inside string',
    '    return # also inside string',
    '    """ # outside',
    '    return 1',
  ];
  const tokens = tokensFor('example.py', lines);
  assert.deepEqual(
    tokens[3].filter((token) => token.kind).map((token) => token.kind),
    ['string'],
  );
  assert.equal(
    tokens[4].find((token) => token.text === '# outside')?.kind,
    'comment',
  );
  assert.equal(
    tokens[5].find((token) => token.text === 'return')?.kind,
    'keyword',
  );
});

test('Rust raw strings with hashes keep quotes and comment markers literal', () => {
  const tokens = tokensFor('sample.rs', [
    'fn main() {',
    '  let text = r##"open // literal',
    '  "# not closed; /* still string',
    '  close"##; // real comment',
    '  let result = 5;',
    '}',
  ]);
  assert.equal(tokens[0].find((token) => token.text === 'fn')?.kind, 'keyword');
  for (const row of [tokens[1], tokens[2]]) {
    assert.equal(row.filter((token) => token.kind === 'comment').length, 0);
    assert.ok(row.some((token) => token.kind === 'string'));
  }
  assert.equal(
    tokens[3].find((token) => token.text === '// real comment')?.kind,
    'comment',
  );
  assert.equal(
    tokens[4].find((token) => token.text === 'let')?.kind,
    'keyword',
  );
});

test('Rust raw strings that end on the opening line restore normal code coloring', () => {
  const tokens = tokensFor('sample.rs', [
    'let a = r#"// literal"#; let b = 5; // outside',
    'let c = r"/* literal */"; let d = 7;',
  ]);
  assert.equal(
    tokens[0].find((token) => token.text === '// outside')?.kind,
    'comment',
  );
  assert.equal(tokens[0].find((token) => token.text === '5')?.kind, 'number');
  assert.equal(tokens[1].find((token) => token.text === '7')?.kind, 'number');
  assert.equal(tokens[1].filter((token) => token.kind === 'comment').length, 0);
});

test('JS/TS template interpolations highlight real code and preserve multiline state', () => {
  const tokens = tokensFor('sample.ts', [
    'const msg = `hello ${',
    '  { data: { count: 3 } }.data.count + (true ? 2 : 1)',
    '} world ${`nested ${false ? 4 : 5}`}!`;',
    'const after = 6; // real comment',
  ]);
  assert.equal(
    tokens[1].find((token) => token.text === 'true')?.kind,
    'keyword',
  );
  assert.equal(tokens[1].find((token) => token.text === '3')?.kind, 'number');
  assert.equal(
    tokens[2].find((token) => token.text === 'false')?.kind,
    'keyword',
  );
  assert.equal(tokens[2].find((token) => token.text === '5')?.kind, 'number');
  assert.equal(tokens[3].find((token) => token.text === '6')?.kind, 'number');
  assert.equal(
    tokens[3].find((token) => token.text === '// real comment')?.kind,
    'comment',
  );
});

test('escaped template interpolation stays literal while later interpolation is code', () => {
  const [tokens] = tokensFor('sample.js', [
    'const value = `escaped \\${notCode} and ${true ? 1 : 2}`; // actual comment',
  ]);
  assert.ok(
    tokens.some(
      (token) => token.kind === 'string' && token.text.includes('\\${notCode}'),
    ),
  );
  assert.equal(tokens.find((token) => token.text === 'true')?.kind, 'keyword');
  assert.equal(
    tokens.find((token) => token.text === '// actual comment')?.kind,
    'comment',
  );
});

test('empty source windows do not crash the highlighter', () => {
  assert.deepEqual(prepareSourceHighlighting([], 'sample.ts')(1), []);
});

test('JS comments and template strings remain in context across virtualized lines', () => {
  const lines = [
    '/* starts',
    ...Array.from({ length: 700 }, () => 'const ignored = "inside comment";'),
    '*/ const template = `a // not a comment',
    'next ${value}`; // actual comment',
  ];
  const tokens = tokensFor('sample.ts', lines);
  assert.equal(tokens[700][0]?.kind, 'comment');
  assert.equal(
    tokens[701].find((token) => token.text === 'const')?.kind,
    'keyword',
  );
  assert.equal(
    tokens[702].find((token) => token.text === '// actual comment')?.kind,
    'comment',
  );
});
