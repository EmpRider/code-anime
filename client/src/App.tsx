import { useCallback, useEffect, useRef, useState } from 'react';
import { FlowGraph, type FlowGraphHandle } from './components/graph/flow-graph';
import { PlaybackControls } from './components/controls/playback-controls';
import { Timeline } from './components/timeline/timeline';
import { Inspector } from './components/inspector/inspector';
import { ConsolePanel } from './components/panels/console-panel';
import { SourcePanel } from './components/panels/source-panel';
import { useFlowStore, type ViewMode } from './store/flow-store';
import { useStepping } from './hooks/use-stepping';
import { fetchFlow, createTestSession } from './api/flow-api';

export default function App() {
  const { flow, cursor, error, viewMode, followActive, traceWidth, sourceShare, inspectorCollapsed, timelineCollapsed, diagramVisible, consoleVisible, setCursor, setPlaybackState, toggleBookmark, toggleBreakpoint, setFlow, setError, setViewMode, setFollowActive, setTraceWidth, setSourceShare, toggleInspector, toggleTimeline, toggleDiagram, loadLayout } = useFlowStore();
  const [helpVisible, setHelpVisible] = useState(false);
  const [mobileView, setMobileView] = useState<'code' | 'flow' | 'trace' | 'state' | 'console'>('code');
  const [focused, setFocused] = useState(false);
  const graphRef = useRef<FlowGraphHandle>(null);
  const traceDividerRef = useRef<HTMLDivElement>(null);
  const sourceDividerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadLayout(); }, [loadLayout]);

  // Resize handlers matching legacy player.js:2902-2912 (trace) and 2970-2993 (source/flow)
  const handleTraceResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const divider = traceDividerRef.current;
    const workspace = workspaceRef.current;
    if (!divider || !workspace) return;
    divider.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      if (!divider.hasPointerCapture(ev.pointerId)) return;
      const rect = workspace.getBoundingClientRect();
      const width = ev.clientX - rect.left;
      const max = Math.max(170, Math.min(480, rect.width * 0.45));
      const bounded = Math.round(Math.max(170, Math.min(max, width)));
      setTraceWidth(bounded);
    };
    const onUp = (ev: PointerEvent) => {
      divider.releasePointerCapture(ev.pointerId);
      divider.removeEventListener('pointermove', onMove);
      divider.removeEventListener('pointerup', onUp);
    };
    divider.addEventListener('pointermove', onMove);
    divider.addEventListener('pointerup', onUp);
  }, [setTraceWidth]);

  const handleSourceResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const divider = sourceDividerRef.current;
    if (!divider) return;
    divider.setPointerCapture(e.pointerId);
    const center = divider.parentElement;
    if (!center) return;
    const onMove = (ev: PointerEvent) => {
      if (!divider.hasPointerCapture(ev.pointerId)) return;
      const rect = center.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSourceShare(Math.round(Math.max(25, Math.min(75, pct))));
    };
    const onUp = (ev: PointerEvent) => {
      divider.releasePointerCapture(ev.pointerId);
      divider.removeEventListener('pointermove', onMove);
      divider.removeEventListener('pointerup', onUp);
    };
    divider.addEventListener('pointermove', onMove);
    divider.addEventListener('pointerup', onUp);
  }, [setSourceShare]);

  const { stepInto, stepOver, stepOut } = useStepping();

  // Keyboard shortcuts matching legacy player.js:3149-3186
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && helpVisible) {
      e.preventDefault();
      setHelpVisible(false);
      return;
    }
    if (!flow) return;
    const target = e.target as HTMLElement;
    if (target.closest('input,select,textarea,button,a,summary,[contenteditable=true]')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const total = flow.steps.length;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        setPlaybackState(useFlowStore.getState().playbackState === 'playing' ? 'paused' : 'playing');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setCursor(Math.max(0, cursor - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setCursor(Math.min(total, cursor + 1));
        break;
      case 'Home':
        e.preventDefault();
        setCursor(0);
        break;
      case 'End':
        e.preventDefault();
        setCursor(total);
        break;
      case 'i':
      case 'I':
        e.preventDefault();
        stepInto();
        break;
      case 'o':
      case 'O':
        e.preventDefault();
        stepOver();
        break;
      case 'u':
      case 'U':
        e.preventDefault();
        stepOut();
        break;
      case '/':
        e.preventDefault();
        document.getElementById('search')?.focus();
        break;
      case 'b':
      case 'B':
        e.preventDefault();
        toggleBookmark(cursor);
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        toggleBreakpoint(cursor);
        break;
      case '?':
        e.preventDefault();
        setHelpVisible(v => !v);
        break;
    }
  }, [flow, cursor, helpVisible, setCursor, setPlaybackState, toggleBookmark, toggleBreakpoint, stepInto, stepOver, stepOut]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Export trace as JSON download
  const handleExport = useCallback(() => {
    if (!flow) return;
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-${flow.endpoint || 'flow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [flow]);

  useEffect(() => {
    async function init() {
      try {
        const sessionId = window.location.pathname.split('/').at(-1);
        if (!sessionId || sessionId === '') {
          const { sessionId: newId } = await createTestSession();
          window.history.replaceState({}, '', `/flow/${newId}`);
          const data = await fetchFlow(newId);
          setFlow(data);
        } else {
          const data = await fetchFlow(sessionId);
          setFlow(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flow');
      }
    }
    init();
  }, [setFlow, setError]);

  if (!flow) {
    return (
      <>
        <header className="app-header">
          <a className="brand" href="/" aria-label="Code Anime home">
            <span className="brand-icon">▸</span>code<span>anime</span>
          </a>
          <div style={{ flex: 1, textAlign: 'center', color: '#8c94ac' }}>
            {error ? 'Flow unavailable' : 'Loading your flow…'}
          </div>
        </header>
        {error && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#f85149' }}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '0.5rem' }}>Retry</button>
          </div>
        )}
      </>
    );
  }

  const symbolCount = new Set(flow.steps.flatMap(s => [s.from, s.to])).size;
  const changeCount = flow.trace?.events?.filter(e => e.kind === 'mutate' || e.kind === 'assign' || e.kind === 'transform').length ?? 0;
  // Evidence mode badge text matching legacy player.js:2286-2291
  const isMock = flow.trace?.simulation != null;
  const evidenceMode = isMock ? 'Mock execution · local session' : 'Structural / unverified flow';
  // Coverage summary matching legacy player.js:2293-2306
  const coverageAssessment = flow.trace?.simulation?.coverageAssessment;
  const coverageSummaryMap: Record<string, string> = {
    unknown: 'Source coverage unverified',
    partial: 'Scenario partial · source coverage unverified',
    unresolved: 'Unresolved source/behavior boundaries',
    'provider-truncated': 'CodeGraph reported incomplete results',
  };
  const coverageText = flow.trace?.simulation
    ? [
        flow.trace.simulation.coverage,
        coverageSummaryMap[coverageAssessment?.status ?? 'unknown'],
        ...(coverageAssessment?.reasons ?? []),
      ].join(' · ')
    : 'Structural/legacy flow: execution completeness is not established.';
  // Diagnostics payload matching legacy player.js:2307-2320
  const diagnosticsPayload = flow.trace
    ? {
        provider: flow.trace.provider,
        sourceHash: flow.trace.sourceHash,
        scenario: flow.trace.scenario,
        filesAnalyzed: flow.trace.filesAnalyzed,
        truncated: flow.trace.truncated,
        coverageAssessment,
        diagnostics: flow.trace.diagnostics,
      }
    : { note: 'Legacy agent-authored flow' };

  return (
    <>
      <header className="app-header">
        <a className="brand" href="/" aria-label="Code Anime home">
          <span className="brand-icon">▸</span>code<span>anime</span>
        </a>
        <section className="session-header" aria-label="Current execution session">
          <div className="session-heading">
            <h1 id="title">{flow.endpoint || 'Untitled flow'}</h1>
            <span id="evidence-mode" className="mock-badge">{evidenceMode}</span>
          </div>
          <div className="session-stats" aria-label="Trace summary">
            <div><strong id="stat-events">{flow.steps.length}</strong><span>steps</span></div>
            <div><strong id="stat-symbols">{symbolCount}</strong><span>symbols</span></div>
            <div><strong id="stat-changes">{changeCount}</strong><span>changes</span></div>
          </div>
          <div id="coverage" className="session-coverage">{coverageText}</div>
          {flow.trace?.truncated && (
            <div className="truncated-warning">Trace incomplete · see coverage</div>
          )}
          <details className="session-diagnostics">
            <summary>Diagnostics</summary>
            <pre>{JSON.stringify(diagnosticsPayload, null, 2)}</pre>
          </details>
        </section>
        <div className="header-actions">
          <button
            id="toggle-timeline"
            className="quiet-button"
            type="button"
            aria-expanded={!timelineCollapsed}
            aria-controls="timeline-panel"
            title="Show or hide execution steps"
            onClick={toggleTimeline}
          >
            {timelineCollapsed ? 'Show steps' : 'Hide steps'}
          </button>
          <button
            id="toggle-inspector"
            className="quiet-button"
            aria-expanded={!inspectorCollapsed}
            aria-controls="step-inspector"
            onClick={toggleInspector}
          >
            Inspector
          </button>
          <button
            id="toggle-flow"
            className="quiet-button"
            aria-expanded={diagramVisible}
            onClick={toggleDiagram}
          >
            {diagramVisible ? 'Hide diagram' : 'Show diagram'}
          </button>
          <span className="local-badge"><i></i> Local session</span>
          <button
            id="help"
            className="icon-button"
            aria-label="Show keyboard shortcuts"
            aria-controls="help-panel"
            aria-expanded={helpVisible}
            title="Keyboard shortcuts"
            onClick={() => setHelpVisible(v => !v)}
          >
            ?
          </button>
          <button
            id="export"
            className="quiet-button"
            aria-label="Export trace as JSON"
            title="Download the current trace as JSON"
            onClick={handleExport}
          >
            <span aria-hidden="true">↓</span>
            <span className="export-label">Export trace</span>
          </button>
        </div>
      </header>

      <main data-mobile-view={mobileView}>
        <nav className="mobile-views" aria-label="Workspace views">
          {(['code', 'flow', 'trace', 'state', 'console'] as const).map((view) => (
            <button
              key={view}
              data-mobile-view={view}
              aria-pressed={mobileView === view}
              onClick={() => setMobileView(view)}
            >
              {view === 'trace' ? 'Steps' : view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </nav>
        <section
          id="help-panel"
          hidden={!helpVisible}
          className="help-panel"
          role="region"
          aria-label="Keyboard shortcuts"
        >
          <strong>Keyboard shortcuts</strong>
          <span><kbd>Space</kbd> Play / pause</span>
          <span><kbd>←</kbd> <kbd>→</kbd> Step</span>
          <span><kbd>I</kbd> Step into</span>
          <span><kbd>O</kbd> Step over</span>
          <span><kbd>U</kbd> Step out</span>
          <span><kbd>Home</kbd> Restart</span>
          <span><kbd>End</kbd> Last step</span>
          <span><kbd>/</kbd> Search</span>
          <span><kbd>B</kbd> Bookmark</span>
          <button id="close-help" aria-label="Close shortcuts" onClick={() => setHelpVisible(false)}>×</button>
        </section>
        <div
          ref={workspaceRef}
          className={`workspace${inspectorCollapsed ? ' inspector-collapsed' : ''}${timelineCollapsed ? ' timeline-collapsed' : ''}`}
          style={{ '--trace-width': `${traceWidth}px` } as React.CSSProperties}
        >
          <Timeline />
          <div
            ref={traceDividerRef}
            className="trace-divider"
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={traceWidth}
            aria-valuemin={170}
            aria-valuemax={480}
            tabIndex={0}
            onPointerDown={handleTraceResize}
          />
          <section
            className={`center-column${diagramVisible ? ' show-flow' : ''}`}
            aria-label="Animation and source"
            style={{ '--source-share': `${sourceShare}fr`, '--flow-share': `${100 - sourceShare}fr` } as React.CSSProperties}
          >
            <section id="flow-panel" className="panel flow-panel" hidden={!diagramVisible}>
              <div className="panel-heading">
                <div className="heading-with-dot">
                  <span className="tiny-dot violet"></span>
                  <h2>Simulated flow</h2>
                  <span id="event-kind" className="kind-badge">READY</span>
                </div>
                <div className="flow-actions">
                  <button
                    id="inspect-source"
                    className="quiet-button"
                    type="button"
                    hidden
                    title="Inspect available source evidence"
                  >
                    Source info
                  </button>
                  <button
                    id="maximize-flow"
                    className="quiet-button"
                    aria-pressed={focused ? 'true' : 'false'}
                    title="Focus execution flow"
                    onClick={() => setFocused((v) => !v)}
                  >
                    Focus
                  </button>
                  <select
                    id="view-mode"
                    aria-label="Execution view"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  >
                    <option value="path">Execution path</option>
                    <option value="focus">Focus view</option>
                    <option value="map">Full map</option>
                  </select>
                  <button
                    id="center-view"
                    className="icon-button"
                    aria-label="Center active flow"
                    title="Center active flow"
                    onClick={() => graphRef.current?.fitView()}
                  >
                    ⌖
                  </button>
                </div>
              </div>
              <div className="flow-context">
                <span id="active-path">Your mock scenario, one step at a time</span>
                <label className="follow-label">
                  <input
                    id="follow"
                    type="checkbox"
                    checked={followActive}
                    onChange={(e) => setFollowActive(e.target.checked)}
                  />Follow
                </label>
              </div>
              <section id="canvas" className={`path${focused ? ' focused' : ''}`} aria-label="Animated flow diagram">
                <FlowGraph ref={graphRef} />
              </section>
              <section id="method-details" aria-label="Expanded method execution" hidden></section>
              <div className="flow-legend">
                <span><i className="legend-node"></i>Active symbol</span>
                <span><i className="legend-change"></i>Changed value</span>
                <span><i className="legend-assumed"></i>Assumed / unresolved</span>
              </div>
            </section>
            <div
              ref={sourceDividerRef}
              className="source-flow-divider"
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={sourceShare}
              aria-valuemin={25}
              aria-valuemax={75}
              tabIndex={0}
              onPointerDown={handleSourceResize}
            />
            <SourcePanel />
            <ConsolePanel hidden={!consoleVisible} />
          </section>
          <Inspector />
        </div>
      </main>

      <PlaybackControls />
    </>
  );
}