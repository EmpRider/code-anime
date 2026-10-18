import { create } from 'zustand';
import type { FlowData, TraceEvent } from '../types/flow';

export type ViewMode = 'path' | 'focus' | 'map';
export type PlaybackState = 'idle' | 'playing' | 'paused';

interface FlowStore {
  // Data
  flow: FlowData | null;
  cursor: number;
  error: string | null;

  // Playback
  playbackState: PlaybackState;
  speed: number;

  // View
  viewMode: ViewMode;
  followActive: boolean;

  // Layout (persisted to localStorage, matches legacy player.js saveLayout)
  traceWidth: number;
  sourceShare: number;
  inspectorCollapsed: boolean;
  timelineCollapsed: boolean;
  diagramVisible: boolean;
  consoleVisible: boolean;

  // Bookmarks & breakpoints
  bookmarks: Set<number>;
  breakpoints: Set<number>;

  // Actions
  setFlow: (flow: FlowData) => void;
  setError: (error: string | null) => void;
  setCursor: (cursor: number) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setSpeed: (speed: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setFollowActive: (follow: boolean) => void;
  setTraceWidth: (width: number) => void;
  setSourceShare: (share: number) => void;
  toggleInspector: () => void;
  toggleTimeline: () => void;
  toggleDiagram: () => void;
  toggleConsole: () => void;
  loadLayout: () => void;
  toggleBookmark: (index: number) => void;
  toggleBreakpoint: (index: number) => void;
  hasBreakpoint: (index: number) => boolean;

  // Derived
  currentEvent: () => TraceEvent | undefined;
  totalSteps: () => number;
}

const LAYOUT_KEY = 'code-anime-layout';

function loadLayoutState(): Partial<Pick<FlowStore, 'traceWidth' | 'sourceShare' | 'inspectorCollapsed' | 'timelineCollapsed' | 'diagramVisible' | 'consoleVisible'>> {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? '{}');
    const out: Record<string, unknown> = {};
    if (Number.isFinite(saved.traceWidth)) out.traceWidth = Math.max(170, Math.min(480, saved.traceWidth));
    if (Number.isFinite(saved.sourceShare)) out.sourceShare = Math.max(25, Math.min(75, saved.sourceShare));
    if (typeof saved.inspector === 'boolean') out.inspectorCollapsed = !saved.inspector;
    if (typeof saved.timeline === 'boolean') out.timelineCollapsed = !saved.timeline;
    if (typeof saved.diagram === 'boolean') out.diagramVisible = saved.diagram;
    if (typeof saved.console === 'boolean') out.consoleVisible = saved.console;
    return out as Partial<Pick<FlowStore, 'traceWidth' | 'sourceShare' | 'inspectorCollapsed' | 'timelineCollapsed' | 'diagramVisible' | 'consoleVisible'>>;
  } catch {
    return {};
  }
}

function saveLayout(state: FlowStore) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({
      traceWidth: state.traceWidth,
      sourceShare: state.sourceShare,
      inspector: !state.inspectorCollapsed,
      timeline: !state.timelineCollapsed,
      diagram: state.diagramVisible,
      console: state.consoleVisible,
    }));
  } catch { /* Optional preference persistence. */ }
}

const initialLayout = loadLayoutState();

export const useFlowStore = create<FlowStore>((set, get) => ({
  flow: null,
  cursor: 0,
  error: null,
  playbackState: 'idle',
  speed: 900,
  viewMode: 'path',
  followActive: true,
  traceWidth: initialLayout.traceWidth ?? 220,
  sourceShare: initialLayout.sourceShare ?? 55,
  inspectorCollapsed: initialLayout.inspectorCollapsed ?? true,
  timelineCollapsed: initialLayout.timelineCollapsed ?? false,
  diagramVisible: initialLayout.diagramVisible ?? true,
  consoleVisible: initialLayout.consoleVisible ?? false,
  bookmarks: new Set(),
  breakpoints: new Set(),

  setFlow: (flow) => set({ flow, cursor: 0, error: null }),
  setError: (error) => set({ error }),
  setCursor: (cursor) => set({ cursor }),
  setPlaybackState: (playbackState) => set({ playbackState }),
  setSpeed: (speed) => set({ speed }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFollowActive: (followActive) => set({ followActive }),
  setTraceWidth: (traceWidth) => {
    set({ traceWidth });
    saveLayout(get());
  },
  setSourceShare: (sourceShare) => {
    set({ sourceShare });
    saveLayout(get());
  },
  toggleInspector: () => {
    set((s) => ({ inspectorCollapsed: !s.inspectorCollapsed }));
    saveLayout(get());
  },
  toggleTimeline: () => {
    set((s) => ({ timelineCollapsed: !s.timelineCollapsed }));
    saveLayout(get());
  },
  toggleDiagram: () => {
    set((s) => ({ diagramVisible: !s.diagramVisible }));
    saveLayout(get());
  },
  toggleConsole: () => {
    set((s) => ({ consoleVisible: !s.consoleVisible }));
    saveLayout(get());
  },
  loadLayout: () => {
    const loaded = loadLayoutState();
    set((s) => ({
      traceWidth: loaded.traceWidth ?? s.traceWidth,
      sourceShare: loaded.sourceShare ?? s.sourceShare,
      inspectorCollapsed: loaded.inspectorCollapsed ?? s.inspectorCollapsed,
      timelineCollapsed: loaded.timelineCollapsed ?? s.timelineCollapsed,
      diagramVisible: loaded.diagramVisible ?? s.diagramVisible,
      consoleVisible: loaded.consoleVisible ?? s.consoleVisible,
    }));
  },

  toggleBookmark: (index) =>
    set((state) => {
      const next = new Set(state.bookmarks);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return { bookmarks: next };
    }),

  toggleBreakpoint: (index) =>
    set((state) => {
      const next = new Set(state.breakpoints);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return { breakpoints: next };
    }),

  hasBreakpoint: (index) => get().breakpoints.has(index),

  currentEvent: () => {
    const { flow, cursor } = get();
    if (!flow?.trace?.events || cursor < 1 || cursor > flow.trace.events.length)
      return undefined;
    return flow.trace.events[cursor - 1];
  },

  totalSteps: () => {
    const { flow } = get();
    return flow?.trace?.events?.length ?? flow?.steps?.length ?? 0;
  },
}));