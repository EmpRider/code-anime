import { memo, useEffect, useMemo, useRef } from 'react';
import { useFlowStore } from '../../store/flow-store';
import { prepareSourceHighlighting } from '../../../../public/source-highlighter.js';

/** Source panel matching legacy player.js renderSource: full-height code view
 * with stateful syntax highlighting, clickable gutter line numbers that seek
 * to the first event visiting that line, and an initial preview at cursor=0. */
export const SourcePanel = memo(() => {
  const events = useFlowStore((s) => s.flow?.trace?.events);
  const cursor = useFlowStore((s) => s.cursor);
  const flow = useFlowStore((s) => s.flow);
  const setCursor = useFlowStore((s) => s.setCursor);
  const containerRef = useRef<HTMLDivElement>(null);

  const sourceFiles = flow?.trace?.sourceFiles as Record<string, string> | undefined;

  // Initial preview: at cursor=0 show first available source file
  const event = cursor > 0 ? events?.[cursor - 1] : undefined;
  const location = event?.source;
  const initialFile = useMemo(() => {
    if (!sourceFiles) return undefined;
    const keys = Object.keys(sourceFiles);
    return keys.length > 0 ? keys[0] : undefined;
  }, [sourceFiles]);

  const activeFile = location?.file ?? (cursor === 0 ? initialFile : undefined);
  const sourceCode = activeFile && sourceFiles ? sourceFiles[activeFile] : undefined;
  const lines = sourceCode ? sourceCode.split(/\r?\n/) : [];
  const activeLine = location?.line;

  // Build line->eventIndex map for click-to-seek
  const lineToEventIndex = useMemo(() => {
    const map = new Map<string, number>();
    if (!events || !activeFile) return map;
    for (let i = 0; i < events.length; i++) {
      const src = events[i]?.source;
      if (src?.file === activeFile) {
        const key = `${src.file}:${src.line}`;
        if (!map.has(key)) map.set(key, i + 1); // 1-indexed cursor
      }
    }
    return map;
  }, [events, activeFile]);

  // Syntax highlighting using legacy stateful lexer
  const highlightLine = useMemo(() => {
    if (!sourceCode || !activeFile) return undefined;
    try {
      return prepareSourceHighlighting(lines, activeFile);
    } catch {
      return undefined;
    }
  }, [sourceCode, activeFile, lines]);

  // Auto-scroll to active line
  useEffect(() => {
    if (containerRef.current && activeLine) {
      const lineHeight = 21.6; // 12px * 1.8
      const targetScroll = Math.max(0, (activeLine - 5) * lineHeight);
      containerRef.current.scrollTop = targetScroll;
    }
  }, [activeLine]);

  const handleLineClick = (lineNum: number) => {
    const key = `${activeFile}:${lineNum}`;
    const targetCursor = lineToEventIndex.get(key);
    if (targetCursor !== undefined) setCursor(targetCursor);
  };

  const tokenColors: Record<string, string> = {
    keyword: '#c792ea',
    string: '#c3e88d',
    comment: '#546e7a',
    number: '#f78c6c',
  };

  const renderTokens = (lineNum: number, lineText: string) => {
    if (!highlightLine) return lineText;
    try {
      const tokens = highlightLine(lineNum);
      if (!tokens || tokens.length === 0) return lineText;
      return tokens.map((token: { text: string; kind?: string }, i: number) =>
        token.kind ? (
          <span key={i} style={{ color: tokenColors[token.kind] ?? '#c7b9f6' }}>
            {token.text}
          </span>
        ) : (
          <span key={i}>{token.text}</span>
        ),
      );
    } catch {
      return lineText;
    }
  };

  return (
    <div className="source-panel" style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
      <div
        style={{
          font: '10px/1.5 monospace',
          color: '#8c95b0',
          padding: '12px 16px 0',
          overflowWrap: 'anywhere',
        }}
      >
        {activeFile ?? 'No source location supplied'}
      </div>
      <div
        ref={containerRef}
        style={{
          margin: '10px 16px 16px',
          color: '#c7b9f6',
          background: '#a18ce90b',
          borderLeft: '2px solid #9e86df',
          borderRadius: '0 4px 4px 0',
          padding: '8px 12px',
          fontSize: '12px',
          lineHeight: 1.8,
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          overflow: 'auto',
          flex: 1,
          minHeight: 0,
          whiteSpace: 'pre',
        }}
      >
        {lines.length === 0 ? (
          <span style={{ color: '#76819a', fontStyle: 'italic' }}>
            {event?.snippet ?? 'No source available'}
          </span>
        ) : (
          lines.map((line, i) => {
            const lineNum = i + 1;
            const isActive = lineNum === activeLine;
            const hasEvent = lineToEventIndex.has(`${activeFile}:${lineNum}`);
            return (
              <div
                key={i}
                style={{
                  background: isActive ? '#aa95ff18' : 'transparent',
                  borderLeft: isActive ? '2px solid #aa95ff' : '2px solid transparent',
                  marginLeft: '-2px',
                  paddingLeft: '8px',
                }}
              >
                <span
                  role={hasEvent ? 'button' : undefined}
                  tabIndex={hasEvent ? 0 : undefined}
                  onClick={() => handleLineClick(lineNum)}
                  onKeyDown={(e) => {
                    if (hasEvent && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleLineClick(lineNum);
                    }
                  }}
                  title={hasEvent ? `Seek to line ${lineNum}` : 'No simulated visit to this line'}
                  style={{
                    display: 'inline-block',
                    width: '36px',
                    color: hasEvent ? '#aa95ff' : '#6f7a96',
                    userSelect: 'none',
                    textAlign: 'right',
                    marginRight: '12px',
                    cursor: hasEvent ? 'pointer' : 'default',
                  }}
                >
                  {lineNum}
                </span>
                {renderTokens(lineNum, line)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

SourcePanel.displayName = 'SourcePanel';