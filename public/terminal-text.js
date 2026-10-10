// Keep the captured stream untouched in its trace. The plain-text console and
// flow summaries hide terminal escape sequences that have no visual meaning
// in a browser <pre> element.
const terminalControls =
  /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\))/g;

export function plainTerminalText(value) {
  return String(value).replace(terminalControls, '');
}

// Scan complete prepared output separately for each terminal stream. A control
// sequence can start in one event and finish in another (even across stored
// continuation sessions). Only recognized, complete sequences are removed.
// Malformed or unterminated sequences stay at their original event positions.
// The trace's original event.output fields are never changed.
export function preparePlainTerminalOutput(events = []) {
  const display = new Array(events.length);
  const streams = new Map();
  for (const [index, event] of events.entries()) {
    if (event?.kind !== 'console' || event.output === undefined) continue;
    const stream = event.values?.stream ?? 'console';
    if (!streams.has(stream)) streams.set(stream, []);
    streams.get(stream).push({ index, output: String(event.output) });
  }

  for (const entries of streams.values()) {
    const joined = entries.map((entry) => entry.output).join('');
    const control = new RegExp(terminalControls.source, 'g');
    let next = control.exec(joined);
    let offset = 0;
    let hiddenThrough = 0;
    for (const entry of entries) {
      const end = offset + entry.output.length;
      let position = Math.max(offset, hiddenThrough);
      let visible = '';
      while (next && next.index < end) {
        if (next.index > position)
          visible += joined.slice(position, next.index);
        hiddenThrough = next.index + next[0].length;
        position = Math.max(position, hiddenThrough);
        next = control.exec(joined);
      }
      if (position < end) visible += joined.slice(position, end);
      display[entry.index] = visible;
      offset = end;
    }
  }
  return display;
}
