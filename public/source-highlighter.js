// Small stateful lexer for source decoration. It never changes source text.
// Track states for every line so virtual source windows start in the correct
// multiline string/comment, even when preceding lines are not rendered.
const pythonKeywords = new Set(
  'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(
    ' ',
  ),
);
const codeKeywords = new Set(
  'abstract as assert async await boolean break case catch class const continue default do else enum export extends false final finally for from fun function if implements import in inline instanceof int interface internal is let long native new null object override package permits private protected public record return sealed short static strictfp super suspend switch synchronized this throw throws transient true try type typeof val var void volatile when while yield'.split(
    ' ',
  ),
);
const goKeywords = new Set(
  'break case chan const continue default defer else fallthrough false for func go goto if import interface iota map nil package range return select struct switch true type var'.split(
    ' ',
  ),
);
const javaKeywords = new Set(
  'abstract assert boolean break byte case catch char class const continue default do double else enum extends false final finally float for goto if implements import instanceof int interface long native new null package permits private protected public record return sealed short static strictfp super switch synchronized this throw throws transient true try var void volatile while yield'.split(
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
  if (/\.java$/i.test(file)) return 'java';
  if (/\.go$/i.test(file)) return 'go';
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
    // Kotlin triple-quoted, Go backtick and Rust raw strings are literal. Regular strings
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

function scanPythonFormattedRemainder(line, from, delimiter) {
  let position = from;
  while (position < line.length) {
    // Python backslashes protect quotes, even for raw prefixes, but cannot
    // escape a replacement field: f"\\{value}" still evaluates {value}.
    if (
      line[position] === '\\' &&
      (line[position + 1] === delimiter[0] || line[position + 1] === '\\')
    ) {
      position = Math.min(line.length, position + 2);
    } else if (line.startsWith(delimiter, position)) {
      return { position: position + delimiter.length, closed: true };
    } else if (
      line.startsWith('{{', position) ||
      line.startsWith('}}', position)
    ) {
      position += 2;
    } else if (line[position] === '{') {
      return { position: position + 1, interpolating: true };
    } else {
      position++;
    }
  }
  return { position, closed: false };
}

function scanJavaScriptRegExp(line, from) {
  let position = from;
  let inClass = false;
  while (position < line.length) {
    if (line[position] === '\\') {
      position = Math.min(line.length, position + 2);
    } else if (line[position] === '[' && !inClass) {
      inClass = true;
      position++;
    } else if (line[position] === ']' && inClass) {
      inClass = false;
      position++;
    } else if (line[position] === '/' && !inClass) {
      position++;
      while (position < line.length && /[a-z]/i.test(line[position]))
        position++;
      return position;
    } else {
      position++;
    }
  }
  return null;
}

const javascriptPrefixKeywords = new Set(
  'await case delete in instanceof new return throw typeof void yield'.split(
    ' ',
  ),
);
const javascriptControlKeywords = new Set(
  'if while for with switch catch'.split(' '),
);
const javascriptBlockKeywords = new Set('else try finally do'.split(' '));
const javascriptExpressionEnd = '].';

function scanLine(line, dialect, previous, decorate) {
  let { mode, delimiter, depth, raw } = previous;
  let regexpAllowed = previous.regexpAllowed ?? true;
  let javascriptPrevious = previous.javascriptPrevious ?? '';
  const javascriptParens = [...(previous.javascriptParens ?? [])];
  const javascriptBraces = [...(previous.javascriptBraces ?? [])];
  // Copy the interpolation stack so saved line-start states stay immutable.
  const templates = (previous.templates ?? []).map((frame) => ({ ...frame }));
  const pythonFormats = (previous.pythonFormats ?? []).map((frame) => ({
    ...frame,
  }));
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
      const format = dialect === 'python' ? pythonFormats.at(-1) : undefined;
      if (format && format.depth === null) {
        const rest = scanPythonFormattedRemainder(
          line,
          position,
          format.delimiter,
        );
        position = rest.position;
        highlight(start, position, 'string');
        if (rest.closed) {
          pythonFormats.pop();
          mode = 'code';
        } else if (rest.interpolating) {
          format.depth = 0;
          mode = 'code';
        } else if (format.delimiter.length === 1 && !/\\$/.test(line)) {
          // A single-quoted f-string cannot continue over a bare newline.
          pythonFormats.pop();
          mode = 'code';
        }
        continue;
      }
      if (dialect === 'javascript' && delimiter === '`') {
        const rest = scanTemplateRemainder(line, position);
        position = rest.position;
        highlight(start, position, 'string');
        if (rest.closed) {
          templates.pop();
          mode = 'code';
          regexpAllowed = false;
        } else if (rest.interpolating) {
          templates[templates.length - 1].depth = 0;
          mode = 'code';
          regexpAllowed = true;
        }
        continue;
      }
      const rest = scanStringRemainder(line, position, delimiter, raw);
      position = rest.position;
      if (rest.closed) mode = 'code';
      if (rest.closed && dialect === 'javascript') regexpAllowed = false;
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
    const pythonExpression =
      dialect === 'python'
        ? pythonFormats[pythonFormats.length - 1]
        : undefined;
    if (pythonExpression && pythonExpression.depth !== null) {
      if (line[position] === '{') {
        pythonExpression.depth++;
        position++;
        continue;
      }
      if (line[position] === '}') {
        if (pythonExpression.depth > 0) {
          pythonExpression.depth--;
        } else {
          pythonExpression.depth = null;
          mode = 'string';
          delimiter = pythonExpression.delimiter;
          position++;
          highlight(start, position, 'string');
          continue;
        }
        position++;
        continue;
      }
    }
    if (interpolation && interpolation.depth !== null) {
      if (line[position] === '{') {
        interpolation.depth++;
        javascriptBraces.push('expression');
        regexpAllowed = true;
        javascriptPrevious = '{';
        position++;
        continue;
      }
      if (line[position] === '}') {
        if (interpolation.depth > 0) {
          interpolation.depth--;
          javascriptBraces.pop();
          regexpAllowed = false;
          javascriptPrevious = '}';
        } else {
          mode = 'string';
          delimiter = '`';
          position++;
          highlight(start, position, 'string');
          regexpAllowed = false;
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
    const pythonPrefix =
      dialect === 'python' &&
      !isIdentifierCharacter(line[position - 1]) &&
      /[rRbBuUfF]/.test(line[position])
        ? /^(?:[fF][rR]?|[rR][fFbB]?|[bB][rR]?|[uU])(?=["'])/.exec(
            line.slice(position),
          )
        : null;
    const regexpEnd =
      dialect === 'javascript' &&
      line[position] === '/' &&
      regexpAllowed &&
      !line.startsWith('//', position) &&
      !line.startsWith('/*', position)
        ? scanJavaScriptRegExp(line, position + 1)
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
    } else if (regexpEnd !== null) {
      position = regexpEnd;
      highlight(start, position, 'string');
      regexpAllowed = false;
    } else if (dialect === 'javascript' && line[position] === '`') {
      templates.push({ depth: null });
      const rest = scanTemplateRemainder(line, position + 1);
      position = rest.position;
      highlight(start, position, 'string');
      if (rest.closed) {
        templates.pop();
        regexpAllowed = false;
      } else if (rest.interpolating) {
        templates[templates.length - 1].depth = 0;
        regexpAllowed = true;
      } else {
        mode = 'string';
        delimiter = '`';
      }
    } else if (
      pythonPrefix ||
      line[position] === '"' ||
      line[position] === "'" ||
      (dialect !== 'python' && line[position] === '\x60')
    ) {
      const quotePosition = position + (pythonPrefix?.[0].length ?? 0);
      delimiter = line[quotePosition];
      if (
        (dialect === 'python' ||
          ((dialect === 'kotlin' || dialect === 'java') &&
            delimiter === '"')) &&
        line.startsWith(delimiter.repeat(3), quotePosition)
      ) {
        delimiter = delimiter.repeat(3);
      }
      mode = 'string';
      raw =
        (dialect === 'kotlin' && delimiter === '"""') ||
        (dialect === 'go' && delimiter === '`');
      position = quotePosition + delimiter.length;
      if (pythonPrefix && /f/i.test(pythonPrefix[0])) {
        const format = { delimiter, depth: null };
        pythonFormats.push(format);
        const rest = scanPythonFormattedRemainder(line, position, delimiter);
        position = rest.position;
        highlight(start, position, 'string');
        if (rest.closed) {
          pythonFormats.pop();
          mode = 'code';
        } else if (rest.interpolating) {
          format.depth = 0;
          mode = 'code';
        } else if (delimiter.length === 1 && !/\\$/.test(line)) {
          pythonFormats.pop();
          mode = 'code';
        }
        continue;
      }
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
      if (dialect === 'javascript') regexpAllowed = false;
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
            : dialect === 'java'
              ? javaKeywords
              : dialect === 'go'
                ? goKeywords
                : codeKeywords
        ).has(word)
      )
        highlight(start, position, 'keyword');
      if (dialect === 'javascript')
        regexpAllowed = javascriptPrefixKeywords.has(word);
      if (dialect === 'javascript') javascriptPrevious = word;
    } else if (
      /[0-9]/.test(line[position]) &&
      !isIdentifierCharacter(line[position - 1])
    ) {
      position++;
      while (position < line.length && /[0-9_.]/.test(line[position]))
        position++;
      highlight(start, position, 'number');
      if (dialect === 'javascript') {
        regexpAllowed = false;
        javascriptPrevious = 'number';
      }
    } else {
      if (dialect === 'javascript' && !/\s/.test(line[position])) {
        const symbol = line[position];
        if (
          (symbol === '+' || symbol === '-') &&
          line[position + 1] === symbol
        ) {
          // A prefix update expects an operand; a postfix update finishes one.
          javascriptPrevious = regexpAllowed
            ? 'prefix-update'
            : 'postfix-update';
          position += 2;
          continue;
        }
        if (symbol === '=' && line[position + 1] === '>') {
          regexpAllowed = true;
          javascriptPrevious = '=>';
          position += 2;
          continue;
        }
        if (symbol === '(') {
          javascriptParens.push(
            javascriptControlKeywords.has(javascriptPrevious),
          );
          regexpAllowed = true;
        } else if (symbol === ')') {
          regexpAllowed = javascriptParens.pop() === true;
        } else if (symbol === '{') {
          const isBlock =
            javascriptPrevious === '' ||
            javascriptPrevious === 'control-close' ||
            javascriptPrevious === ')' ||
            javascriptPrevious === '=>' ||
            javascriptPrevious === ';' ||
            javascriptPrevious === '}' ||
            javascriptBlockKeywords.has(javascriptPrevious) ||
            (!regexpAllowed &&
              javascriptPrevious !== ']' &&
              javascriptPrevious !== '.');
          javascriptBraces.push(isBlock ? 'block' : 'expression');
          regexpAllowed = true;
        } else if (symbol === '}') {
          regexpAllowed = javascriptBraces.pop() === 'block';
        } else {
          regexpAllowed = !javascriptExpressionEnd.includes(symbol);
        }
        javascriptPrevious =
          symbol === ')' && regexpAllowed ? 'control-close' : symbol;
      }
      position++;
    }
  }
  if (tokens && plainStart < line.length)
    tokens.push({ text: line.slice(plainStart) });
  return {
    state: {
      mode,
      delimiter,
      depth,
      raw,
      templates,
      pythonFormats,
      regexpAllowed,
      javascriptPrevious,
      javascriptParens,
      javascriptBraces,
    },
    tokens,
  };
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
    pythonFormats: [],
    regexpAllowed: true,
    javascriptPrevious: '',
    javascriptParens: [],
    javascriptBraces: [],
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
