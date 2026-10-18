# React Migration Audit: Old vs New UI Parity

**Date:** 2026-10-18
**Revision:** `1c91257` (player: arrow edge-routing avoids tooltip overlap, CSS white cards + colored dots + z-index isolation)
**Verdict:** ❌ **New UI is NOT equivalent.** Technology-only migration incomplete. Multiple legacy features missing or broken.

---

## Executive Summary

The new React client (`client/src/`) does **not** reproduce the legacy interface (`public/player.js`, ~3257 lines). Earlier claims of "fully fixed" or "complete" were incorrect. This audit documents every confirmed gap with source-level evidence.

**Key findings:**

- Graph nodes are invisible due to copied CSS rules that hide `.node` class
- Playback stalls at step 1/4; timer captures stale cursor via closure
- Inspector shows empty fields despite valid data in `step.dtoFields`
- 12+ controls render but have no event handlers
- Keyboard shortcuts I/O/U, `/`, Escape missing entirely
- No chunk continuation, search/filter, method stepping, or layout persistence
- Client TypeScript fails typecheck (`TS2352` errors)
- Browser test directory configured but does not exist

---

## 1. Confirmed Broken Behavior

### 1.1 Blank Graph Canvas

| Aspect | Detail |
|--------|--------|
| **Symptom** | React Flow nodes render in DOM but are invisible; only minimap visible |
| **Cause** | Copied legacy CSS rule `#canvas.path .node { display: none !important; }` hides all nodes with class `node` |
| **Legacy intent** | Hide DOM nodes when Cytoscape handles rendering in focus/map views |
| **React impact** | MethodNode uses `className="node"` → hidden in all views |
| **Evidence** | [client/src/index.css:500-502](../client/src/index.css#L500-L502), [public/styles.css:2139-2168](../public/styles.css#L2139-L2168) |
| **Fix** | Remove or scope the rule; React Flow manages its own visibility |

### 1.2 Playback Stalls at Step 1

| Aspect | Detail |
|--------|--------|
| **Symptom** | Clicking Play advances to step 1, button shows "Pause", but playback never continues |
| **Cause** | `tick()` callback captures `cursor` from render-time closure; `setTimeout` re-invokes with stale value |
| **Legacy behavior** | Uses mutable module-level `cursor` variable; `tick` reads current value each call |
| **Evidence** | [client/src/hooks/use-playback.ts:23-44](../client/src/hooks/use-playback.ts#L23-L44), [public/player.js:2608-2642](../public/player.js#L2608-L2642) |
| **Fix** | Use ref for cursor or pass next-cursor explicitly to avoid stale closure |

### 1.3 Space Key Does Not Start Playback

| Aspect | Detail |
|--------|--------|
| **Symptom** | Pressing Space toggles playback state label but timer never starts |
| **Cause** | Same stale-closure bug as §1.2; state updates but tick loop uses captured cursor=0 |
| **Browser verification** | Script returned `{cursor:"0", play:"Pause"}` after Space press |
| **Evidence** | [client/src/App.tsx:24](../client/src/App.tsx#L24) (keyboard handler delegates to same broken hook) |

### 1.4 Inspector Shows Empty Fields

| Aspect | Detail |
|--------|--------|
| **Symptom** | Selecting LoginRequest step shows empty Fields panel despite `step.dtoFields` containing data |
| **Cause** | Inspector reads only `event.after`; ignores fallback to `step.dtoFields` when event lacks after-snapshot |
| **Legacy behavior** | Falls back: `const after = event?.after ?? step.dtoFields;` |
| **Evidence** | [client/src/components/inspector/inspector.tsx:61](../client/src/components/inspector/inspector.tsx#L61), [public/player.js:2465](../public/player.js#L2465) |
| **Fix** | Add `?? flow.steps[cursor - 1]?.dtoFields` fallback |

### 1.5 Session Errors Silently Swallowed

| Aspect | Detail |
|--------|--------|
| **Symptom** | Expired/missing session returns 404; UI stays on "Loading your flow…" forever |
| **Cause** | Error stored in Zustand but never rendered; no error boundary or status display |
| **Legacy behavior** | Catches fetch error, sets title to "Flow unavailable", disables all controls, shows error in status |
| **Evidence** | [client/src/App.tsx:91](../client/src/App.tsx#L91), [public/player.js:3249-3254](../public/player.js#L3249-L3254) |

### 1.6 Client TypeCheck Fails

| Aspect | Detail |
|--------|--------|
| **Symptom** | `tsc --noEmit` reports two `TS2352` conversion errors |
| **Location** | [client/src/components/inspector/inspector.tsx:13-14](../client/src/components/inspector/inspector.tsx#L13-L14) |
| **Impact** | CI `npm run check` would fail if client were integrated |

---

## 2. Controls Rendered But Not Connected

These controls appear in the UI but have **no onClick handlers or keyboard bindings**:

| Control | Location | Legacy Equivalent |
|---------|----------|-------------------|
| Step Into (↘) | [playback-controls.tsx:55-61](../client/src/components/controls/playback-controls.tsx#L55-L61) | [player.js:2714-2760](../public/player.js#L2714-L2760) — invocation-aware stepping |
| Step Over (↷) | [playback-controls.tsx:62-68](../client/src/components/controls/playback-controls.tsx#L62-L68) | [player.js:2762-2800](../public/player.js#L2762-L2800) |
| Step Out (⇡) | [playback-controls.tsx:69-77](../client/src/components/controls/playback-controls.tsx#L69-L77) | [player.js:2802-2826](../public/player.js#L2802-L2826) |
| Search input | [timeline.tsx:19](../client/src/components/timeline/timeline.tsx#L19) | [player.js:3070](../public/player.js#L3070) — `filterList` text search |
| Kind filter dropdown | [timeline.tsx:22-29](../client/src/components/timeline/timeline.tsx#L22-L29) | [player.js:3071](../public/player.js#L3071) — event kind filtering |
| Focus button | [App.tsx:225-230](../client/src/App.tsx#L225-L230) | [player.js:2935-2944](../public/player.js#L2935-L2944) — panel focus/maximize |
| Execution view selector | [App.tsx:231-240](../client/src/App.tsx#L231-L240) | [player.js:2262](../public/player.js#L2262) — path/focus/map switching |
| Center active flow | [App.tsx:241-246](../client/src/App.tsx#L241-L246) | [player.js:512-530](../public/player.js#L512-L530) — fit-view/center |
| Follow checkbox | [App.tsx:247-252](../client/src/App.tsx#L247-L252) | [player.js:2870-2873](../public/player.js#L2870-L2873) — auto-follow toggle |
| Help button (?) | [App.tsx:155](../client/src/App.tsx#L155) | [player.js:3112-3120](../public/player.js#L3112-L3120) — opens help panel |
| Changes only checkbox | [inspector.tsx:53](../client/src/components/inspector/inspector.tsx#L53) | [player.js:2474](../public/player.js#L2474) — filters to changed fields |
| Mobile view buttons | [App.tsx:178-184](../client/src/App.tsx#L178-L184) | [player.js:2850-2873](../public/player.js#L2850-L2873) — Code/Flow/Steps/State/Console |

### Missing Keyboard Shortcuts

| Key | Legacy Action | React Status |
|-----|---------------|--------------|
| `I` | Step into method | ❌ Not bound |
| `O` | Step over method | ❌ Not bound |
| `U` | Step out of method | ❌ Not bound |
| `/` | Focus search | ❌ Not bound |
| `Escape` | Close help panel | ❌ Not bound |
| `Home` | Restart (cursor=0) | ⚠️ Selects step 1 instead of 0 |
| `←` | Previous step | ⚠️ Cannot return to cursor=0 |
| `B` | Toggle bookmark | ✅ Bound |
| `Space` | Play/pause | ⚠️ Toggles state but timer broken (§1.3) |

Legacy keyboard handler: [player.js:3149-3186](../public/player.js#L3149-L3186)

---

## 3. Missing Legacy Features

### 3.1 Execution Path Overview

| Feature | Legacy | React |
|---------|--------|-------|
| Transition overview with event meaning | ✅ `buildFlowOverview()`, paginated cards | ❌ Replaced by flat symbol graph |
| Certainty labels (static/mock/assumed) | ✅ Per-event badges | ❌ Generic labels only |
| Pagination (prev/next overview pages) | ✅ `OVERVIEW_PAGE_SIZE = 6` | ❌ None |
| Cursor navigation within overview | ✅ Click card → seek to step | ❌ None |

Legacy: [public/flow-overview.js](../public/flow-overview.js), [player.js:398-416](../public/player.js#L398-L416)

### 3.2 Call Hierarchy & Method Inspection

| Feature | Legacy | React |
|---------|--------|-------|
| Expand/collapse nested calls | ✅ `expandedCalls` set, tree rendering | ❌ Flat timeline |
| Distinguish repeated invocations | ✅ `invocationPositions`, `symbolInvocations` maps | ❌ Merged by symbolId |
| Parent call tracking | ✅ `parentInvocationId()` | ❌ None |
| Method detail panel | ✅ Expandable inputs/returns/source/stack | ❌ Empty, permanently hidden |
| Click node → select invocation | ✅ [player.js:474-489](../public/player.js#L474-L489) | ❌ Nodes non-interactive |

### 3.3 Project/Symbol Grouping

| Feature | Legacy | React |
|---------|--------|-------|
| Directory/file/class grouping | ✅ `symbolFileMap`, `getOrCreateGroup()` | ❌ Equally spaced vertical list |
| Visual group containers | ✅ Grouped DOM structure | ❌ Single column layout |

Legacy: [player.js:498-505](../public/player.js#L498-L505)

### 3.4 Timeline Tools

| Feature | Legacy | React |
|---------|--------|-------|
| Text search across steps/files/values | ✅ `filterList()` with query | ❌ Input inert |
| Event kind filter | ✅ Dropdown → `filterList()` | ❌ Dropdown inert |
| Bookmarks-only view | ✅ Toggle in filter bar | ❌ Missing |
| Event pagination | ✅ Virtualized list with pages | ❌ Full render |
| Double-click row → breakpoint | ✅ Source-line breakpoints | ❌ Index-based only |

### 3.5 Breakpoints

| Feature | Legacy | React |
|---------|--------|-------|
| Step index breakpoints | ✅ `breakpoints` Set | ✅ Present |
| Source-line breakpoints | ✅ `sourceBreakpoints` Set, double-click | ❌ Missing |
| Breakpoint feedback ("Breakpoint · step N") | ✅ Status message | ❌ Silent pause |
| Row visual indicator | ✅ `.breakpoint` class | ✅ Class applied |

Legacy: [player.js:2650-2659](../public/player.js#L2650-L2659)

### 3.6 Source Panel

| Feature | Legacy | React |
|---------|--------|-------|
| Syntax highlighting | ✅ `prepareSourceHighlighting()` | ❌ Plain text |
| Initial source preview (step 0) | ✅ Shows target file before first step | ❌ "No source available" |
| Source page navigation (earlier/later) | ✅ Paginated line ranges | ❌ Fixed-height scroll |
| Stack frame navigation | ✅ Clickable stack links → inspect frame | ❌ None |
| Line-to-event navigation | ✅ Click source line → seek to event | ❌ None |
| Inline mock values | ✅ Hover/click shows values at source location | ❌ None |
| Source values panel | ✅ Expandable per-line values | ❌ Missing |

Legacy: [public/source-highlighter.js](../public/source-highlighter.js), [player.js:1092-1400](../public/player.js#L1092-L1400)

### 3.7 Inspector Structure

| Feature | Legacy | React |
|---------|--------|-------|
| Tab names | Values / State / Context | Fields / Locals / Objects |
| Clickable stack frames | ✅ Frame list → inspect specific frame | ❌ Flat JSON dump |
| Frame-specific locals | ✅ `frameLocals(state, event)` | ❌ All locals merged |
| Nested expandable values | ✅ Tree with expand/collapse | ❌ `JSON.stringify` |
| Before/after diff highlighting | ✅ `.changed` class on modified fields | ❌ No diff |
| Object history navigation | ✅ `objectHistory` map, prev/next | ❌ Current snapshot only |
| Inputs/Results/Origins sections | ✅ Dedicated panels | ❌ Missing |
| Certainty + note display | ✅ Combined badge | ⚠️ Partial |

Legacy tabs: [index.html:356-386](../public/index.html#L356-L386)
React tabs: [inspector.tsx](../client/src/components/inspector/inspector.tsx)

### 3.8 Console Panel

| Feature | Legacy | React |
|---------|--------|-------|
| Collapsible `<details>` | ✅ Default collapsed | ❌ Always visible |
| Event count badge | ✅ "N events" | ❌ Missing |
| Older/Newer pagination | ✅ `CONSOLE_PAGE_SIZE = 300` | ❌ All lines rendered |
| Normalized terminal output | ✅ `preparePlainTerminalOutput()` | ❌ Raw `String(ev.output)` |
| Auto-scroll on cursor advance | ✅ | ✅ Present |

Legacy: [player.js:1494-1545](../public/player.js#L1494-L1545), [public/terminal-text.js](../public/terminal-text.js)

### 3.9 Chunk Continuation

| Feature | Legacy | React |
|---------|--------|-------|
| Load next prepared chunk during playback | ✅ `extendThrough()` async | ❌ Stops at initial session |
| Previous/Next session links | ✅ Header navigation | ❌ Missing |
| Baseline variant switching | ✅ `<select id="variant">` | ❌ No selector |
| Continuation validation (schema, cycle detection) | ✅ Comprehensive checks | ❌ None |

Legacy: [player.js:1548-1608](../public/player.js#L1548-L1608), [player.js:3232-3246](../public/player.js#L3232-L3246)

### 3.10 Evidence & Completeness Indicators

| Feature | Legacy | React |
|---------|--------|-------|
| Static vs Mock badge | ✅ `mock-badge` element | ⚠️ Generic label |
| Coverage summary | ✅ `coverageAssessment.status` + reasons | ❌ Missing |
| Diagnostics panel | ✅ JSON-formatted diagnostics | ❌ Missing |
| Truncated warning | ✅ "Trace incomplete · see coverage" | ❌ Can show "Replay complete" incorrectly |
| Unresolved/proposed indicators | ✅ Per-symbol styling | ❌ None |

Legacy: [player.js:2293-2320](../public/player.js#L2293-L2320)

### 3.11 Layout Preferences

| Feature | Legacy | React |
|---------|--------|-------|
| Resize trace panel divider | ✅ Pointer drag, clamped 170-480px | ❌ Divider removed |
| Resize source/flow divider | ✅ Pointer drag, 25-75% range | ❌ Divider removed |
| Persist layout to localStorage | ✅ `saveLayout()` on every change | ❌ Temporary state only |
| Panel collapse toggles | ✅ Timeline, Inspector, Diagram | ⚠️ Partial (Inspector only) |
| Focus/maximize panels | ✅ Source-focus, Flow-focus modes | ❌ Buttons unwired |
| Keyboard resize (arrow keys on divider) | ✅ Accessibility support | ❌ Missing |

Legacy: [player.js:2875-2984](../public/player.js#L2875-L2984)

### 3.12 Accessibility

| Feature | Legacy | React |
|---------|--------|-------|
| Inspector tab ARIA semantics | ✅ `role="tablist"`, `aria-selected` | ⚠️ Basic |
| Named regions (`aria-label`) | ✅ All panels labeled | ⚠️ Some missing |
| Focus restoration after panel toggle | ✅ Returns to appropriate control | ❌ Lost |
| Step change announcements | ✅ `aria-live="polite"` status | ⚠️ Partial |
| Reduced-motion preference | ✅ Respects `prefers-reduced-motion` | ❌ Framer Motion ignores |
| Screen-reader-only navigation announcements | ✅ `#navigation-announcement` | ✅ Element present but unused |

---

## 4. Visual Differences (Not Technology-Only)

These are **design changes**, not incidental technology artifacts:

| Area | Legacy | React | Verdict |
|------|--------|-------|---------|
| Inspector default state | Collapsed | Expanded | Changed default |
| Node card style | White gradient, colored status dots | Dark gradient, accent border glow | Redesigned |
| Zoom controls | Custom +/- buttons, fit-view | React Flow Controls widget, MiniMap, attribution | Different component |
| Inspector tab styling | Underline active, horizontal layout | Pill-style, different spacing | Restyled |
| Source panel height | Flexible, fills available space | Fixed `maxHeight: 400px` | Constrained |
| Console panel | Collapsible details, dark terminal aesthetic | Always-visible, lighter background | Restructured |
| Export filename | `code-anime-trace.json` | Unknown (handler exists but untested) | Verify |
| Empty states | Rich messaging, actionable suggestions | Minimal text | Reduced |
| Packet animation | CSS keyframes, cubic-bezier bounce | Framer Motion, linear interpolation | Different feel |

---

## 5. Build & Verification Gaps

| Gap | Impact |
|-----|--------|
| Root `npm run build` does not compile React client | Client ships unbuilt or requires separate command |
| Root `npm run typecheck` excludes `client/` | TS errors undetected in CI |
| Root `npm run test` excludes client tests | No automated parity verification |
| `tests/browser/` directory does not exist | Playwright config references missing dir; `npm run test:browser` fails |
| Server serves `public/index.html` (legacy); React runs on separate Vite port | No unified deployment path |
| React build outputs to `public/` | Would overwrite legacy entrypoint without cutover plan |
| No integration between root and client package.json | Two independent dependency trees |

Evidence:

- [package.json:19-32](../package.json#L19-L32) — scripts exclude client
- [tsconfig.check.json](../tsconfig.check.json) — includes only `src/`, `scripts/`, `tests/`
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) — runs `npm run check` which skips client
- [playwright.config.ts:4](../playwright.config.ts#L4) — `testDir: './tests/browser'` (does not exist)
- [client/package.json](../client/package.json) — independent dependencies, no link to root

---

## 6. Baseline Warning

The legacy stylesheet (`public/styles.css`) contains **uncommitted layout regressions**:

- Grid template columns changed: removed 8px divider track
- Divider elements set to `display: none`
- Flow panel measured at **8px wide** during this audit

These defects exist in the working tree (`M public/styles.css`) and are **not** caused by the React migration. Any visual comparison against the current legacy UI must account for these pre-existing issues. The intended legacy behavior should be verified against the last clean commit, not the current modified state.

---

## 7. Acceptance Checklist

Before declaring migration complete, each item must pass:

- [ ] Graph nodes visible in all three view modes (path/focus/map)
- [ ] Playback runs through all steps without stalling
- [ ] Space key starts/stops playback correctly
- [ ] Inspector displays fields from both `event.after` and `step.dtoFields`
- [ ] Session load errors displayed to user
- [ ] Client typecheck passes (`cd client && npx tsc --noEmit`)
- [ ] Step Into/Over/Out functional with invocation awareness
- [ ] Search and kind filter operational
- [ ] Source panel shows syntax-highlighted code with navigation
- [ ] Console panel collapsible with pagination
- [ ] Chunk continuation loads next session during playback
- [ ] Layout preferences persist across reloads
- [ ] All keyboard shortcuts bound (I/O/U, /, Escape, Home, End, B, Space, arrows)
- [ ] Help panel opens/closes
- [ ] Mobile view buttons switch content
- [ ] Breakpoints include source-line support
- [ ] Evidence/coverage/diagnostics displayed
- [ ] Baseline variant switching available when applicable
- [ ] Reduced-motion preference respected
- [ ] Browser tests exist and pass
- [ ] Unified build produces deployable artifact
- [ ] Visual appearance matches legacy (white cards, colored dots, panel proportions)

---

## Appendix: File Reference Map

| Legacy File | Lines | React Replacement | Status |
|-------------|-------|-------------------|--------|
| `public/player.js` | ~3257 | Multiple components | ❌ Incomplete |
| `public/replay.js` | 12 | `hooks/use-playback.ts` (partial) | ⚠️ Replay logic differs |
| `public/flow-overview.js` | ~400 | None | ❌ Missing |
| `public/source-highlighter.js` | ~300 | None | ❌ Missing |
| `public/terminal-text.js` | ~80 | None | ❌ Missing |
| `public/styles.css` | ~2400 | `client/src/index.css` (copied + Tailwind) | ⚠️ Conflicting rules |
| `public/index.html` | ~540 | `client/src/App.tsx` + components | ❌ Structure differs |

---

*This document was generated from a read-only audit. No code was modified during comparison.*