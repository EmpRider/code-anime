// Small stateful lexer for source decoration. It never changes source text.
// Track states for every line so virtual source windows start in the correct
// multiline string/comment, even when preceding lines are not rendered.
const pythonKeywords = new Set(
  'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(
    ' ',
  ),
);
const codeKeywords = new Set(
  'abstract as async await boolean break case catch class const continue default do else enum export extends false final finally for from fun function if implements import in inline int interface internal is let long new null object override package private protected public return sealed short static super suspend switch synchronized this throw throws true try type typeof val var void when while yield'.split(
    ' ',
  ),
);
const rustKeywords = new Set(
  'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while'.split(
    ' ',
  ),
);

function language(file) {
  if (/\.(?:py|pyi|pyw)$/i.test(file)) return 'python';
  if (/\.(?:kt|kts)$/i.test(file)) return 'kotlin';
  if (/\.rs$/i.test(file)) return 'rust';
  if (/\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/i.test(file)) return 'javascript';
  return 'other';
}

function isIdentifierCharacter(character) {
  return /[A-Za-z0-9_$]/.test(character ?? '');
}

function scanStringRemainder(line, from, delimiter, raw) {
  let position = from;
  while (position < line.length) {
    // Kotlin triple-quoted and Rust raw strings are literal. Regular strings
    // (including Python triple-quoted ones) can escape quote delimiters.
    if (!raw && line[position] === '\\')
      position = Math.min(line.length, position + 2);
    else if (line.startsWith(delimiter, position))
      return { position: position + delimiter.length, closed: true };
    else position++;
  }
  return { position, closed: false };
}

function scanTemplateRemainder(line, from) {
  let position = from;
  while (position < line.length) {
    if (line[position] === '\\') {
      position = Math.min(line.length, position + 2);
    } else if (line.startsWith('${', position)) {
      return { position: position + 2, interpolating: true, closed: false };
    } else if (line[position] === '`') {
      return { position: position + 1, interpolating: false, closed: true };
    } else {
      position++;
    }
  }
  return { position, interpolating: false, closed: false };
}

function scanLine(line, dialect, previous, decorate) {
  let { mode, delimiter, depth, raw } = previous;
  // Copy the interpolation stack so saved line-start states stay immutable.
  const templates = (previous.templates ?? []).map((frame) => ({ ...frame }));
  const tokens = decorate ? [] : undefined;
  let plainStart = 0;
  let position = 0;
  const highlight = (start, end, kind) => {
    if (!tokens || end <= start) return;
    if (start > plainStart)
      tokens.push({ text: line.slice(plainStart, start) });
    tokens.push({ text: line.slice(start, end), kind });
    plainStart = end;
  };
  const canNestComments = dialect === 'kotlin' || dialect === 'rust';

  while (position < line.length) {
    if (mode === 'comment') {
      const start = position;
      while (position < line.length) {
        if (canNestComments && line.startsWith('/*', position)) {
          depth++;
          position += 2;
        } else if (line.startsWith('*/', position)) {
          depth--;
          position += 2;
          if (!depth) {
            mode = 'code';
            break;
          }
        } else position++;
      }
      highlight(start, position, 'comment');
      continue;
    }
    if (mode === 'string') {
      const start = position;
      if (dialect === 'javascript' && delimiter === '`') {
        const rest = scanTemplateRemainder(line, position);
        position = rest.position;
        highlight(start, position, 'string');
        if (rest.closed) {
          templates.pop();
          mode = 'code';
        } else if (rest.interpolating) {
          templates[templates.length - 1].depth = 0;
          mode = 'code';
        }
        continue;
      }
      const rest = scanStringRemainder(line, position, delimiter, raw);
      position = rest.position;
      if (rest.closed) mode = 'code';
      highlight(start, position, 'string');
      // Normal quoted strings cannot continue after a bare line break.
      // Triple-quoted, raw and template strings can span any number of lines.
      if (
        !rest.closed &&
        !raw &&
        delimiter.length === 1 &&
        delimiter !== '\x60' &&
        !/\\$/.test(line)
      ) {
        mode = 'code';
      }
      if (mode === 'code') raw = false;
      continue;
    }

    const start = position;
    const interpolation =
      dialect === 'javascript' ? templates[templates.length - 1] : undefined;
    if (interpolation && interpolation.depth !== null) {
      if (line[position] === '{') {
        interpolation.depth++;
        position++;
        continue;
      }
      if (line[position] === '}') {
        if (interpolation.depth > 0) {
          interpolation.depth--;
        } else {
          mode = 'string';
          delimiter = '`';
          position++;
          highlight(start, position, 'string');
          continue;
        }
        position++;
        continue;
      }
    }
    const rustRaw =
      dialect === 'rust' &&
      (line[position] === 'r' ||
        (line[position] === 'b' && line[position + 1] === 'r'))
        ? /^(?:b?r)(#*)"/.exec(line.slice(position))
        : null;
    if (rustRaw) {
      delimiter = '"' + rustRaw[1];
      raw = true;
      mode = 'string';
      const rest = scanStringRemainder(
        line,
        position + rustRaw[0].length,
        delimiter,
        raw,
      );
      position = rest.position;
      if (rest.closed) {
        mode = 'code';
        raw = false;
      }
      highlight(start, position, 'string');
    } else if (dialect === 'python' && line[position] === '#') {
      position = line.length;
      highlight(start, position, 'comment');
    } else if (dialect !== 'python' && line.startsWith('//', position)) {
      position = line.length;
      highlight(start, position, 'comment');
    } else if (dialect !== 'python' && line.startsWith('/*', position)) {
      mode = 'comment';
      depth = 1;
      position += 2;
      // Consume the opening delimiter as part of the next comment token.
      const rest = scanCommentRemainder(line, position, depth, canNestComments);
      position = rest.position;
      depth = rest.depth;
      if (!depth) mode = 'code';
      highlight(start, position, 'comment');
    } else if (dialect === 'javascript' && line[position] === '`') {
      templates.push({ depth: null });
      const rest = scanTemplateRemainder(line, position + 1);
      position = rest.position;
      highlight(start, position, 'string');
      if (rest.closed) templates.pop();
      else if (rest.interpolating) templates[templates.length - 1].depth = 0;
      else {
        mode = 'string';
        delimiter = '`';
      }
    } else if (
      line[position] === '"' ||
      line[position] === "'" ||
      (dialect !== 'python' && line[position] === '\x60')
    ) {
      delimiter = line[position];
      if (
        (dialect === 'python' || (dialect === 'kotlin' && delimiter === '"')) &&
        line.startsWith(delimiter.repeat(3), position)
      ) {
        delimiter = delimiter.repeat(3);
      }
      mode = 'string';
      raw = dialect === 'kotlin' && delimiter === '"""';
      position += delimiter.length;
      // A string begins here; scan its remainder in this same line.
      const rest = scanStringRemainder(line, position, delimiter, raw);
      position = rest.position;
      if (rest.closed) mode = 'code';
      highlight(start, position, 'string');
      if (
        !rest.closed &&
        !raw &&
        delimiter.length === 1 &&
        delimiter !== '\x60' &&
        !/\\$/.test(line)
      )
        mode = 'code';
      if (mode === 'code') raw = false;
    } else if (/[A-Za-z_$]/.test(line[position])) {
      position++;
      while (position < line.length && isIdentifierCharacter(line[position]))
        position++;
      const word = line.slice(start, position);
      if (
        (dialect === 'python'
          ? pythonKeywords
          : dialect === 'rust'
            ? rustKeywords
            : codeKeywords
        ).has(word)
      )
        highlight(start, position, 'keyword');
    } else if (
      /[0-9]/.test(line[position]) &&
      !isIdentifierCharacter(line[position - 1])
    ) {
      position++;
      while (position < line.length && /[0-9_.]/.test(line[position]))
        position++;
      highlight(start, position, 'number');
    } else position++;
  }
  if (tokens && plainStart < line.length)
    tokens.push({ text: line.slice(plainStart) });
  return { state: { mode, delimiter, depth, raw, templates }, tokens };
}

function scanCommentRemainder(line, start, originalDepth, canNest) {
  let position = start;
  let depth = originalDepth;
  while (position < line.length) {
    if (canNest && line.startsWith('/*', position)) {
      depth++;
      position += 2;
    } else if (line.startsWith('*/', position)) {
      depth--;
      position += 2;
      if (!depth) break;
    } else position++;
  }
  return { position, depth };
}

export function prepareSourceHighlighting(lines, file) {
  const dialect = language(file);
  const starts = [];
  const initial = {
    mode: 'code',
    delimiter: '',
    depth: 0,
    raw: false,
    templates: [],
  };
  let state = initial;
  for (const line of lines) {
    starts.push(state);
    state = scanLine(line, dialect, state, false).state;
  }
  return (lineNumber) =>
    scanLine(
      lines[lineNumber - 1] ?? '',
      dialect,
      starts[lineNumber - 1] ?? initial,
      true,
    ).tokens;
}
