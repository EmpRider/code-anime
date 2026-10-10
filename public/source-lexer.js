// Syntax colors decorate original source text without changing execution evidence.
// The lexer carries quoted/comment state across virtualized source editor windows.
const pythonKeywords = /\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/y;
const commonKeywords = /\b(?:class|function|fun|const|let|var|public|private|protected|static|return|if|else|for|while|new|async|await|throw|throws|import|export|void|int|String|number|boolean|true|false|null|undefined|interface|type|extends|implements|package|object|val|when|suspend|try|catch|finally)\b/y;
const numberToken = /\b\d+(?:\.\d+)?\b/y;

export function tokenizeSourceLine(line, file = '', initialState = null) {
  const python = /\.(?:py|pyw|pyi)$/i.test(file);
  const tripleQuotes = python || /\.(?:kt|kts|java|scala)$/i.test(file);
  const keywords = python ? pythonKeywords : commonKeywords;
  const segments = [];
  const append = (start, end, kind) => {
    if (end <= start) return;
    const value = line.slice(start, end);
    const previous = segments.at(-1);
    if (previous?.kind === kind) previous.value += value;
    else segments.push({ value, kind });
  };
  let state = initialState;
  let position = 0;
  let plainStart = 0;

  while (position < line.length) {
    if (state) {
      const start = position;
      if (state === '/*') {
        const closing = line.indexOf('*/', position);
        position = closing < 0 ? line.length : closing + 2;
        append(start, position, 'comment');
        if (closing >= 0) state = null;
      } else {
        let closing = -1;
        for (let i = position; i <= line.length - state.length; i++) {
          if (line[i] === '\\') {
            i++;
            continue;
          }
          if (line.startsWith(state, i)) {
            closing = i;
            break;
          }
        }
        position = closing < 0 ? line.length : closing + state.length;
        append(start, position, 'string');
        if (closing >= 0) state = null;
        else if (state.length === 1 && state.charCodeAt(0) !== 96) {
          // Single-quoted strings continue only across an escaped newline.
          let trailingSlashes = 0;
          for (let i = line.length - 1; line[i] === '\\'; i--)
            trailingSlashes++;
          if (trailingSlashes % 2 === 0) state = null;
        }
      }
      plainStart = position;
      continue;
    }

    const char = line[position];
    if (python ? char === '#' : line.startsWith('//', position)) {
      append(plainStart, position, null);
      append(position, line.length, 'comment');
      position = line.length;
      plainStart = position;
      break;
    }
    if (!python && line.startsWith('/*', position)) {
      append(plainStart, position, null);
      state = '/*';
      plainStart = position;
      continue;
    }
    if (char === '"' || char === "'" || (!python && char.charCodeAt(0) === 96)) {
      append(plainStart, position, null);
      state =
        tripleQuotes && line.startsWith(char.repeat(3), position)
          ? char.repeat(3)
          : char;
      const opening = position;
      position += state.length;
      append(opening, position, 'string');
      plainStart = position;
      continue;
    }

    keywords.lastIndex = position;
    numberToken.lastIndex = position;
    const keyword = keywords.exec(line);
    const number = keyword ? null : numberToken.exec(line);
    const match = keyword ?? number;
    if (match) {
      append(plainStart, position, null);
      append(
        position,
        position + match[0].length,
        keyword ? 'keyword' : 'number',
      );
      position += match[0].length;
      plainStart = position;
      continue;
    }
    position++;
  }
  append(plainStart, line.length, null);
  return { segments, state };
}

export function sourceLexicalStates(lines, file) {
  const states = [];
  let state = null;
  for (const line of lines) {
    states.push(state);
    state = tokenizeSourceLine(line, file, state).state;
  }
  return states;
}
