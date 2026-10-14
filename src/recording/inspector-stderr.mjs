/** Separate known Node Inspector notices from verbatim application stderr. */
export function createInspectorStderrHandler({
  onListening,
  onShutdown,
  onOutput,
}) {
  let url;
  let attached = false;
  let startupHelpSeen = false;
  let endingHelpPending = false;
  return (text) => {
    const line = text.replace(/\r?\n$/, '');
    const followsEnding = endingHelpPending;
    endingHelpPending = false;
    const help =
      line === 'For help, see: https://nodejs.org/en/docs/inspector' ||
      line ===
        'For help, see: https://nodejs.org/learn/getting-started/debugging';
    if (url && help && (!startupHelpSeen || followsEnding)) {
      startupHelpSeen = true;
      return;
    }
    const shutdown = 'Waiting for the debugger to disconnect...';
    if (url && line.endsWith(shutdown)) {
      const prefix = line.slice(0, -shutdown.length);
      if (prefix) onOutput(prefix);
      onShutdown();
      return;
    }
    if (url && line.endsWith(`Debugger ending on ${url}`)) {
      const prefix = line.slice(0, -`Debugger ending on ${url}`.length);
      if (prefix) onOutput(prefix);
      // Node sometimes emits one more help line after its ending banner.
      // Only the immediately following exact line belongs to that sequence.
      endingHelpPending = true;
      return;
    }
    const listening = line.match(/^Debugger listening on (ws:\/\/\S+)$/);
    if (listening && !url) {
      url = listening[1];
      onListening(url);
    } else if (url && !attached && line === 'Debugger attached.') {
      attached = true;
    } else {
      onOutput(text);
    }
  };
}
