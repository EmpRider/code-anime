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

test('Python f-string expressions color real code while escaped braces remain literal', () => {
  const tokens = tokensFor('sample.py', [
    'label = f"literal {{ return }} and {True if enabled else False}" # outside',
    'raw = rf"value {amount + 1} and \\" # inside string" # after',
    'ordinary = "{False if ignored else True}"',
  ]);
  assert.equal(
    tokens[0].find((token) => token.text === 'True')?.kind,
    'keyword',
  );
  assert.equal(tokens[0].find((token) => token.text === 'if')?.kind, 'keyword');
  assert.ok(
    tokens[0].some(
      (token) => token.kind === 'string' && token.text.includes('{{ return }}'),
    ),
  );
  assert.equal(
    tokens[0].find((token) => token.text === '# outside')?.kind,
    'comment',
  );
  assert.equal(tokens[1].find((token) => token.text === '1')?.kind, 'number');
  assert.equal(
    tokens[1].find((token) => token.text === '# after')?.kind,
    'comment',
  );
  assert.equal(tokens[2].filter((token) => token.kind === 'keyword').length, 0);
});

test('Python backslashes do not escape f-string replacement fields', () => {
  const [tokens] = tokensFor('sample.py', [
    'message = rf"before \\{True} after" # real comment',
  ]);
  assert.equal(tokens.find((token) => token.text === 'True')?.kind, 'keyword');
  assert.equal(
    tokens.find((token) => token.text === '# real comment')?.kind,
    'comment',
  );
});

test('Python nested f-strings and multiline expressions keep state across virtual windows', () => {
  const lines = [
    'value = f"""header {',
    ...Array.from({ length: 400 }, () => '  # expression comment'),
    '  {"nested": 3}["nested"] + (True if valid else False)',
    '} and {f\'inner {2}\'} footer""" # outside',
    'return 42',
  ];
  const decorate = prepareSourceHighlighting(lines, 'sample.py');
  for (const lineNumber of [1, 200, 402, 403, 404]) {
    assert.equal(
      decorate(lineNumber)
        .map((token) => token.text)
        .join(''),
      lines[lineNumber - 1],
    );
  }
  assert.equal(
    decorate(402).find((token) => token.text === 'True')?.kind,
    'keyword',
  );
  assert.equal(
    decorate(402).find((token) => token.text === '3')?.kind,
    'number',
  );
  assert.equal(
    decorate(403).find((token) => token.text === '2')?.kind,
    'number',
  );
  assert.equal(
    decorate(403).find((token) => token.text === '# outside')?.kind,
    'comment',
  );
  assert.equal(
    decorate(404).find((token) => token.text === 'return')?.kind,
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

test('Java text blocks preserve comments as literal text and restore following statements', () => {
  const tokens = tokensFor('Demo.java', [
    'record Result(double value) {}',
    'String source = """',
    '  // inside text block, not a comment',
    '  escaped \\""" remains in the string',
    '  """; // actual comment',
    'double result = 2.5;',
    'let = 4; // invalid Java, but still original source',
  ]);
  assert.equal(
    tokens[0].find((token) => token.text === 'record')?.kind,
    'keyword',
  );
  assert.equal(
    tokens[0].find((token) => token.text === 'double')?.kind,
    'keyword',
  );
  assert.equal(tokens[2].filter((token) => token.kind === 'comment').length, 0);
  assert.equal(tokens[3].filter((token) => token.kind === 'comment').length, 0);
  assert.equal(
    tokens[4].find((token) => token.text === '// actual comment')?.kind,
    'comment',
  );
  assert.equal(
    tokens[5].find((token) => token.text === 'double')?.kind,
    'keyword',
  );
  assert.equal(tokens[5].find((token) => token.text === '2.5')?.kind, 'number');
  assert.equal(
    tokens[6].find((token) => token.text === 'let')?.kind,
    undefined,
  );
});

test('Go raw strings keep code-like text literal across source windows', () => {
  const tokens = tokensFor('main.go', [
    'package main',
    'func run() {',
    '  text := `before // literal',
    '  /* still literal */ and \\ slash',
    '  after`; defer println(text) // real comment',
    '  var value = nil',
    '}',
  ]);
  assert.equal(
    tokens[0].find((token) => token.text === 'package')?.kind,
    'keyword',
  );
  assert.equal(
    tokens[1].find((token) => token.text === 'func')?.kind,
    'keyword',
  );
  assert.equal(tokens[3].filter((token) => token.kind === 'comment').length, 0);
  assert.equal(
    tokens[4].find((token) => token.text === 'defer')?.kind,
    'keyword',
  );
  assert.equal(
    tokens[4].find((token) => token.text === '// real comment')?.kind,
    'comment',
  );
  assert.equal(
    tokens[5].find((token) => token.text === 'nil')?.kind,
    'keyword',
  );
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
