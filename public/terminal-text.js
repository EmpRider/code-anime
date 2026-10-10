// Keep the captured stream untouched in its trace. The plain-text console and
// flow summaries hide terminal escape sequences that have no visual meaning
// in a browser <pre> element.
export function plainTerminalText(value) {
  return String(value).replace(
    /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\))/g,
    '',
  );
}
