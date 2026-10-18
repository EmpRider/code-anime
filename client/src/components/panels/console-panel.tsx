import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFlowStore } from '../../store/flow-store';

const CONSOLE_PAGE_SIZE = 300;
// Strip ANSI escape sequences and control chars except newline/tab
const stripAnsi = (s: string) =>
  s.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?\x07|[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

/** Console panel matching legacy player.js renderConsole() exactly:
 * collapsible <details>, event count badge, paginated older/newer nav,
 * plain-text normalized output, auto-scroll on newest page. */
export const ConsolePanel = memo(({ hidden }: { hidden?: boolean }) => {
  if (hidden) return null;
  const events = useFlowStore((s) => s.flow?.trace?.events);
  const cursor = useFlowStore((s) => s.cursor);
  const preRef = useRef<HTMLPreElement>(null);
  const [pageBack, setPageBack] = useState(0);

  // Binary search for visible event count up to cursor (matches legacy lo calculation)
  const visibleCount = useMemo(() => {
    if (!events) return 0;
    let lo = 0, hi = events.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      const idx = (events[mid] as { index?: number }).index ?? mid;
      if (idx <= cursor) lo = mid + 1; else hi = mid;
    }
    return lo;
  }, [events, cursor]);

  // Reset pagination when cursor moves past current page range
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(visibleCount / CONSOLE_PAGE_SIZE) - 1);
    if (pageBack > maxPage) setPageBack(maxPage);
  }, [visibleCount, pageBack]);

  const end = Math.max(0, visibleCount - pageBack * CONSOLE_PAGE_SIZE);
  const start = Math.max(0, end - CONSOLE_PAGE_SIZE);

  const displayText = useMemo(() => {
    if (!events || start >= end) return '';
    const parts: string[] = [];
    for (let i = start; i < end && i < events.length; i++) {
      const ev = events[i];
      if ((ev as { kind?: string }).kind === 'console') {
        const out = (ev as { output?: unknown }).output;
        if (out !== undefined) parts.push(stripAnsi(String(out)));
      }
    }
    return parts.join('');
  }, [events, start, end]);

  // Auto-scroll only when viewing the newest page
  useEffect(() => {
    if (pageBack === 0 && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [displayText, pageBack]);

  const showNav = visibleCount > CONSOLE_PAGE_SIZE;
  const rangeLabel = visibleCount > 0 ? `${start + 1}–${end} of ${visibleCount} events` : '';

  return (
    <section className="panel console-panel" aria-label="Console output">
      <details id="console-panel">
        <summary>
          Console
          <span id="console-count" className="count-badge">{visibleCount} events</span>
        </summary>
        <nav
          id="console-history"
          className="console-history"
          aria-label="Console output history"
          hidden={!showNav}
        >
          <button
            id="console-older"
            type="button"
            disabled={start === 0}
            onClick={() => setPageBack((p) => p + 1)}
          >Older</button>
          <span id="console-range" role="status" aria-live="polite">{rangeLabel}</span>
          <button
            id="console-newer"
            type="button"
            disabled={pageBack === 0}
            onClick={() => setPageBack((p) => Math.max(0, p - 1))}
          >Newer</button>
        </nav>
        <pre id="console-output" ref={preRef} role="log" aria-live="off">{displayText}</pre>
      </details>
    </section>
  );
});

ConsolePanel.displayName = 'ConsolePanel';