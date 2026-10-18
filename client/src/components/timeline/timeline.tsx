import { useState, useMemo } from 'react';
import { useFlowStore } from '../../store/flow-store';

export function Timeline() {
  const { flow, cursor, setCursor, bookmarks, toggleBookmark, breakpoints, toggleBreakpoint } = useFlowStore();
  const [searchText, setSearchText] = useState('');
  const [selectedKind, setSelectedKind] = useState('');

  if (!flow) return null;

  const events = flow.trace?.events ?? [];
  const steps = flow.steps;

  // Match legacy player.js filterList(): JSON.stringify([event, step]).toLowerCase().includes(query)
  const filteredIndices = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return steps.reduce<number[]>((acc, step, i) => {
      const event = events[i];
      const kind = event?.kind ?? 'flow';
      const matchesKind = !selectedKind || kind === selectedKind;
      const matchesSearch = !query || JSON.stringify([event, step]).toLowerCase().includes(query);
      if (matchesKind && matchesSearch) acc.push(i);
      return acc;
    }, []);
  }, [steps, events, searchText, selectedKind]);

  return (
    <div className="panel trace-panel">
      <div className="panel-heading">
        <h2>Execution Trace</h2>
        <span className="count-badge">{filteredIndices.length}/{steps.length} steps</span>
      </div>
      <div className="trace-search">
        <span>🔍</span>
        <input
          id="search"
          type="text"
          placeholder="Filter events..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <div className="trace-filters">
        <select value={selectedKind} onChange={(e) => setSelectedKind(e.target.value)}>
          <option value="">All kinds</option>
          <option value="enter">enter</option>
          <option value="assign">assign</option>
          <option value="mutate">mutate</option>
          <option value="transform">transform</option>
          <option value="console">console</option>
        </select>
      </div>
      <div className="event-list">
        {filteredIndices.map((i) => {
          const step = steps[i];
          const event = events[i];
          const index = i + 1;
          const isCurrent = cursor === index;
          const isBookmarked = bookmarks.has(index);
          const isBreakpoint = breakpoints.has(index);
          const kind = event?.kind ?? 'flow';
          const label = event?.label ?? step.dtoName;

          return (
            <button
              key={i}
              className={`event-row${isCurrent ? ' current' : ''}${isBookmarked ? ' bookmarked' : ''}${isBreakpoint ? ' breakpoint' : ''}`}
              data-index={index}
              data-kind={kind}
              onClick={() => setCursor(index)}
            >
              <span className="event-index">{index}</span>
              <span>
                <span className="event-label">{label}</span>
                <span className="event-meta">
                  <span className="event-type">{kind}</span>
                  <span>{step.from} → {step.to}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="trace-footer">
        <button className="quiet-button" onClick={() => toggleBookmark(cursor)} disabled={!cursor}>
          {bookmarks.has(cursor) ? '★' : '☆'} Bookmark
        </button>
        <button className="quiet-button" onClick={() => toggleBreakpoint(cursor)} disabled={!cursor}>
          ● Breakpoint
        </button>
      </div>
    </div>
  );
}