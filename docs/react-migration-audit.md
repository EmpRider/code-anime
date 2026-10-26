# React Migration Audit: Old vs New UI Parity

**Date:** 2026-10-18
**Revision:** `1c91257` (player: arrow edge-routing avoids tooltip overlap, CSS white cards + colored dots + z-index isolation)
**Original verdict (2026-10-18):** ❌ **New UI was NOT equivalent.** The findings below describe the independent React implementation at that revision.

## React frontend retired — 2026-10-24

The owner requested removal of the React frontend. `/flow/:id` now serves the vanilla player directly from `public/index.html`. React source, generated bundles, component-only tests, and client install/build/typecheck wiring are removed. Vite remains a root development dependency solely for the X6 diagram bundle. Browser functional coverage now targets the production vanilla route; cross-framework pixel comparison is obsolete. The sections below are historical, not the current architecture.

## Shared-player UX corrections — 2026-10-24

- Method expansion preserves zoom and the clicked card's screen position. Resize observation no longer forces Fit after every layout change; Fit remains explicit. Values preserve the viewport.
- Selected-node actions remain unscaled, replace the subtitle rather than covering the canvas, and provide Read, Source/Expand, Values, Inspect, and Close. Low-zoom cards hide secondary actions. Filtering or removing a selected node clears stale actions.
- Canvas focus enables arrow-key panning and plus/minus zoom without advancing playback. A Pan disclosure provides click/tap alternatives. Coarse-pointer controls use 44px targets; playback padding respects safe-area insets. Node focus rings are inset and node titles include visible action cues.
- Inactive arrows now measure at least 5.32:1 contrast against diagram surfaces. Selected invocation call/return pairs receive matching heavier strokes; solid/dashed semantics remain. Routing warnings use keyboard/touch-accessible details with qualified method names, distinct missing-connection/hidden-label counts, and recovery guidance.
- Shared player load failures retain Help and mobile navigation, disable flow-dependent controls, and offer Retry. Successful retries restore controls. URL `view` and `step` restore validated/clamped state without autoplay; replay uses `replaceState`, not extra history entries. Both shared HTML shells include skip navigation, translation protection for displayed code/values, and Maximize/Restore terminology.
- Targeted desktop/mobile grouped-map, congested-routing disclosure, Retry/deep-link/skip-navigation checks pass, including coarse-pointer emulation. Lifecycle regression covers retry, stale loads, invalid URL input, clamping, and remount cleanup. Screenshots inspected. Selection-overlay obstruction and focus-induced click movement were corrected; independent review reported no remaining concrete defects. Final gates: 173 unit tests passed, 2 real-CodeGraph tests skipped; all 25 browser tests passed. Scope guard, typecheck, build, installed-package smoke, edited-source formatting, and whitespace checks passed. The complete browser suite includes retained React-host parity checks, without editing React-specific source.
- URL persistence intentionally covers view and step only; filters, inline expansion, and the viewport remain local UI state. Repository-wide formatting still fails on unrelated/worktree/generated files; edited-source formatting passes.
- React-specific source remains outside this change. Dense Fit views still require Read/zoom; physical devices and Firefox/Safari remain unchecked.

## Obstacle-aware arrow lanes — 2026-10-24

- Replaced container-level edge waypoints with a shared orthogonal router for calls, prepared returns, and step order. Routes avoid leaf cards, expanded values, method headers, group title strips, and reserved return labels. Each edge reserves its own ports and segments; expanded row/column gutters increased to 64px. Exact call/entry/return endpoints remain unchanged.
- Perpendicular crossings use X6 jump gaps; shared collinear segments are forbidden. Routing has a bounded search and reports congestion rather than drawing an unsafe fallback. A label without a clear placement is omitted from the canvas with a routing detail; its prepared value remains in Inspector. This is not a guarantee that every arbitrary graph is planar or routable.
- Geometry regression covers horizontal/vertical layouts, expanded values, shared segments, card/label clearance, determinism, and explicit routing failure. Desktop/mobile browser regression also samples rendered SVG paths against cards and preserves endpoint and viewport checks.
- Live synthetic 101-event/four-file demo: all 13 methods expanded on desktop produced 124 arrows and 12 return labels without routing warnings; sampled card/label collisions were zero, including an open Values disclosure. Mobile checkout/callee expansion produced 71 arrows with zero sampled card/label collisions and no routing warnings. Screenshots inspected. Fit makes dense graphs small; zoom/pan remains necessary.
- Verification: 173 unit tests passed, 2 real-CodeGraph tests skipped; all 21 browser tests passed. Scope guard, typecheck, build, and installed-package checks passed. The new browser test initially failed strict typechecking for unchecked array indexing; corrected before the final run. Independent routing review reported no defects.
- Limits: fixed routing grid/search budget; large maps may be slow or report congestion. Existing repository-wide formatting and Firefox/Safari/physical-device gaps remain; no release-wide CI clearance claimed.

## Expanded call-site endpoints — 2026-10-23

- Full map call arrows attach to the caller's exact prepared call-step node when expanded, and the callee's entry-step node when expanded. Return arrows originate at the explicit return step and point back to that call site. Collapsing either side restores that invocation's method endpoint; file/owner boundaries remain grouping only.
- Verification: 172 unit tests and all 21 browser tests passed; 2 real-CodeGraph tests skipped. Build, typecheck, scope guard, changed-source formatting, and installed-package checks passed.
- Call-site pairing reuses the existing adjacent call/entry ancestry, task, and thread checks. Unmatched evidence falls back to invocation-level connections rather than guessing a source step. Expanded edges render above group backgrounds, below node cards.
- Desktop/mobile checks assert source/target node identities and collapsed fallback. Live synthetic checkout verified six outgoing call-step anchors at steps 8, 25, 35, 51, 68, and 78; expanding the standard-category callee connects step 25 to entry 26, with return 30 back to 25. Screenshots inspected. Dense expanded routes can still cross other routes/cards; this change corrects endpoint identity, not global obstacle routing.

## Value toggle viewport preservation — 2026-10-23

- Value expansion/collapse no longer automatically fits the rebuilt layout. Existing zoom and pan remain unchanged; explicit Fit and other layout navigation retain their behavior.
- Desktop/mobile regression captures the complete viewport transform after zoom/pan and checks it through both toggles. Both checks failed before the fix and passed afterward. Build, typecheck, all 21 browser tests passed. Unit/package checks were not repeated for this three-line rendering fix.

## Node value disclosures — 2026-10-23

- Removed the duplicate top current-context preview at the owner's request. Existing source, current-node/group highlights, playback cursor, and Inspector remain available.
- Node values are collapsed by default behind native Values disclosures. Open values use indented JSON with wrapping and a bounded scrollable area; opening does not change the playback cursor. Method and nested step heights participate in layout, preventing disclosures from covering the next row. Disclosure state survives playback and resets for a new flow.
- Desktop/mobile regressions cover removed preview, formatted JSON, reversible values, keyboard activation, node resizing, nested row containment, and collapse. Screenshots inspected. The previous standalone demo session expired; fresh synthetic browser sessions provide the interaction evidence.
- Verification: 171 unit tests and all 21 browser tests passed; 2 real-CodeGraph tests skipped. Build, typecheck, scope guard, changed-source formatting, and installed-package checks passed. Existing repository-wide formatting and cross-browser verification gaps remain.

## Return label and clearance correction — 2026-10-23

- Return labels now name the method on the first line and show its value plus evidence on the second, e.g. `findCoupon returns` / `1000 (simulated)`. Mock certainty is displayed as simulated; assumed/unverified distinctions remain. No units are inferred.
- Replaced axis-only return offsets with perpendicular segment offsets and bounded corner joins, fixing nearly coincident steep call/return lines. Card-border anchoring remains. Dagre reserves estimated label space to avoid hiding longer labels behind adjacent cards.
- Verification: return-helper regression (including steep-line clearance and duplicate points), build, typecheck, and all 21 browser tests passed. Fanout screenshots and live recursive demo inspected. Full unit/package suites were not repeated for this follow-up. Arbitrary dense-graph crossings remain possible.

## Prepared return arrows — 2026-10-23

- Full map now draws dashed reverse arrows from callee to caller for explicit prepared return events. Solid arrows retain call ancestry; inner method arrows retain prepared step order. Return labels include evidence and the supplied value; absent results say `value unavailable`, distinct from null, false, and zero. Missing return events, exceptions, and unresolved events do not invent return arrows.
- Reverse routes are offset from call routes with endpoints clamped to card borders. Recursive frames retain invocation identity. The exact return cursor highlights its arrow; seeking backward restores inactive styling. Owner filtering and inline collapse preserve the corresponding visible relationships. Execution path and Focus view remain unchanged.
- Verification: 171 unit tests passed, 2 real-CodeGraph tests skipped; all 21 desktop/mobile browser tests passed. Build, typecheck, static/mock scope guard, changed-source formatting, and installed-package checks passed. Desktop/mobile screenshots inspected. Live 101-event recursive demo shows 12 call arrows and 12 prepared return arrows, including the checkout return at step 97.
- Dense maps still require zoom/pan; offset routing does not guarantee collision-free crossings or labels. Values are prepared simulation, never observed runtime results. Existing repository-wide formatting, Firefox/Safari, and physical-device verification gaps remain; no release-wide CI clearance claimed.

## Separated call arrows — 2026-10-23

- Full map retains Dagre's individual edge waypoints and boundary attachment points rather than replacing every call with a shared Manhattan route. Fan-out arrows no longer merge into the same trunk. Internal step arrows and other view modes retain their routing.
- Desktop/mobile three-callee regressions check distinct paths near their origins and arrowhead markers. Build, typecheck, all 21 browser tests, and changed-file formatting passed; desktop/mobile screenshots inspected. General dense-graph crossing avoidance is not guaranteed. Unit/package suites were not repeated for this routing-only change.

## Compact flow workspace — 2026-10-23

- Reduced all diagram cards from 232×146 to 210×112, with compact padding/metadata/actions and omitted empty-object or missing-value placeholder rows. Nonempty values, evidence, source, expand/seek/inspect controls remain available.
- Expanded methods now wrap ordered step cards into connected serpentine rows (up to four columns on wide surfaces, two on narrow surfaces), rather than unbounded single columns. Every prepared event remains available; directional arrows and step numbers establish order. Nested invocations retain identity and existing file/owner boundaries.
- Context uses wrapping inline facts/values instead of five stacked rows; flow context, legend, and diagram footer use smaller padding. Desktop regression requires the diagram surface to occupy over 70% of the focused flow panel. No controls or mock disclosure removed.
- Follow keeps the user's zoom and pans only when the active card leaves the viewport. It no longer fits the entire graph on every step. Explicit Fit remains available.
- Worktree verification: build, typecheck, 19 browser tests passed; desktop/mobile screenshots inspected. Browser checks required temporary `dotfiles: allow` on test asset responses because the worktree lives under `.claude`; both allowances were restored before handoff. Integration verification in the normal checkout also passed: build, typecheck, targeted desktop/mobile checks, all 19 browser tests, and changed-file formatting, with no serving-policy changes. Live 101-event demo retained all 44 expanded checkout steps and measured 74% chart viewport in the focused panel. Dense graphs still require zoom/pan; no new dependencies or event caps. Unit/package suites were not repeated for this compact-layout change.

## Nested flowchart correction — 2026-10-23

- Replaced the inline source-code list with real X6 child cards and directional edges inside each expanded method. Cards show prepared operation labels, event kinds, certainty, source locations, and mock values; source text remains in the source panel. Outer invocation arrows retain call semantics; inner arrows explicitly indicate prepared step order, not unexplored branches.
- File/owner groups and other invocations remain in the same Full map. Nested-call cards toggle the corresponding invocation's subgraph; collapse removes child nodes and edges without changing the shared cursor. All supplied steps remain available; large expanded graphs require zoom/pan.
- Desktop/mobile targeted checks pass: child-node containment, additional step edges, operation labels instead of a code list, seek/context synchronization, nested toggling, and restored outer arrows after collapse. Fixed follow centering hiding neighboring method controls: expanded maps fit the entire prepared diagram.
- Verification: 19 browser tests, 170 unit tests passed; 2 real-CodeGraph tests skipped. Build, typecheck, scope guard, package check passed. Live synthetic recursive demo verified child nodes, step arrows, nested expansion and shared cursor highlighting; screenshots inspected at Fit and readable zoom. Large expanded maps remain small at Fit; zoom/pan is required.

## Inline Full map expansion — 2026-10-23 (superseded by flowchart correction)

- Full map method buttons now toggle prepared source steps **inside the existing invocation card**, within its file/owner group. Other invocations and call arrows remain visible; expansion does not change the replay cursor or navigate to another diagram. Nested-call rows toggle the corresponding invocation card in place. Multiple methods may remain expanded; **Collapse methods** closes them together. Long step lists scroll rather than truncate.
- Full map no longer exposes the separate Classes drill-down action. Execution path and Focus view retain their existing hierarchical navigation. Continuation preserves inline expansion; a new flow resets it.
- The title, description, and controls share a wrapping compact toolbar. Reduced context padding removes the oversized Ready message without hiding source or mock values.
- Desktop/mobile grouped-map checks cover compact dimensions, inline expansion, nested toggling, cursor synchronization, unchanged surrounding groups/arrows, and collapse. Screenshots inspected. Dense maps still require zoom to read individual cards.
- Verification: 19 browser tests and 170 unit tests passed; 2 real-CodeGraph tests skipped. Build, typecheck, scope guard, package check, and changed-file formatting passed. Live 101-event demo retained all 13 invocations, four file groups, and 12 call edges after inline expansion. Existing large-chunk warning remains.

## Grouped Full map — 2026-10-23

- Full map now nests method invocations inside labeled **file → class/owner** boundaries using compound Dagre layout and X6 parent nodes. Free functions retain a Functions owner; grouping is source/symbol evidence, not proof of runtime class instances. Arrows retain supplied invocation ancestry, not arbitrary sequential links.
- The active method, owner, and file highlight together. Owner filters, drill-down, pan/zoom/fit, and prepared playback remain available. Execution path and Focus view retain their layout logic and animations.
- An always-visible, unscaled current-context panel shows cursor/total, event kind and certainty, file/line, owner, symbol and invocation ID, original source line, prepared locals/inputs, after-values, object snapshots, and return values when provided. Missing snapshots are explicit; values are labeled mock, never runtime observations. Previous/seek restores the corresponding snapshot.
- Fixed mobile group boxes collapsing to label height: page-level body grid styles no longer affect X6 foreignObject bodies. Desktop/mobile regressions check nested bounds, call edges, active ancestors, visible context, reverse navigation, filters, and isolation from other view modes. The live 101-event/four-file demo shows four file groups, four owner groups, 13 invocation cards and 12 call edges without page errors.
- Verification: **170 unit tests passed, 2 real-CodeGraph integration tests skipped; 19 browser tests passed**. Build, typecheck, static/mock scope guard, package check, changed-source formatting, and retained accent palette checks passed. Fixed a browser assertion race by waiting for resize-driven node geometry to settle without weakening its bounds checks. Desktop/mobile screenshots inspected.
- Dense graphs still need zoom/pan to read every card; Fit prioritizes showing the whole map. The current-context panel stays readable independently of graph scale. Large object snapshots scroll within the panel. Existing repository-wide formatting and cross-browser verification gaps remain.

## Hierarchical drill-down — 2026-10-23

- **Classes** opens owner groups; clicking a class opens its method invocations. Clicking a method opens prepared source-step cards and direct child calls. Recursive invocations keep separate IDs; nested expansion and **Collapse** preserve the shared replay cursor. This navigates into a level, not an inline expanding group container.
- Next, Previous, keyboard arrows, and Play follow the displayed detail level: class transitions, invocation transitions, or source steps with collapsed descendants. Breakpoints interrupt skipped ranges. Explicit Step Into/Over/Out and timeline seeking retain their existing behavior. Events outside the selected scope remain in the global replay; the heading identifies an outside-scope cursor.
- Original source text, repeated loop visits, mock values, console output, and source highlighting use prepared data only. Partial frames remain inspectable; aggregated evidence labels retain unresolved/assumed distinctions. Changing the main view mode exits drill-down.
- Fixed missing class/method-level arrows and changed orientation after expansion/collapse: all drill-down levels now connect cards in displayed order. Labels distinguish first-appearance order from call ancestry. Paginated follow fits the entire page rather than centering one node and clipping its neighbors; desktop/mobile regressions assert edge counts and node direction across expansion and collapse.
- Fixed continuation losing the expanded scope: chunks mutate the event array in place, so the player now explicitly preserves scope when rebuilding after validated continuation. Comparison switches reset scope instead.
- Verification: **170 unit tests passed, 2 real-CodeGraph tests skipped; 17 browser tests passed**. New desktop/mobile regressions cover class/method/source navigation, recursion identity, reverse stepping, breakpoint interception, source/console synchronization, and scope retention through continuation. Build, typecheck, static/mock scope guard, package check, and changed-source formatting passed. Desktop/mobile screenshots inspected; the live 101-event synthetic recursive demo also passed a drill-down smoke check.
- Not release-wide clearance: the previously reported repository-wide formatting failure remains unresolved; Firefox, Safari, physical mobile devices, and dense-map performance remain unverified. Large-client-chunk warning remains. React is still the compatibility host.

## Diagram redesign — 2026-10-22

The owner subsequently requested a complete redesign of **Execution path, Focus view, and Full map**, superseding historical pixel matching for the diagram itself. All three now use vanilla JavaScript with AntV X6 in `public/diagram.js`, shared by the standalone HTML entrypoint and React compatibility host. Source walkthrough, inspector, console, stepping, breakpoints, variants, and continuation still use the existing player. React has **not** been removed.

- Execution path shows paginated ordered event cards; pagination does not truncate the trace.
- Focus view shows the current invocation, caller, and direct children. Full map shows invocation ancestry with owner visibility filters, not visual group containers.
- Cards include source locations, simulated values, method inspection, and seek controls. Pan, zoom, fit, active-edge dash animation, and reduced-motion handling use prepared data only.
- Fixed keyboard focus loss when cards, page controls, or owner filters rebuild; active cards now use the current event's source and certainty.
- Fixed invisible mobile diagrams: X6's inline zero width from initialization in a hidden tab no longer overrides the responsive surface width. Browser comparisons now assert cards are actually inside the viewport, not merely present in the DOM.
- Fixed X6's CSP-blocked inline stylesheet injection: the build emits the installed library's core CSS as a static asset and disables automatic injection. CSP remains unchanged. This also resolved the desktop/mobile pixel differences without changing screenshot tolerance; a browser regression checks CSP console errors.
- Final verification: unit tests **165 passed, 2 skipped**; full browser suite **13 passed**, including desktop/mobile pixel comparisons and visible-card assertions. Build, typecheck, static/mock scope guard, final package check (including standalone diagram assets), and changed-source formatting checks passed. Desktop and mobile screenshots inspected. Firefox, Safari, real mobile devices, and dense-map performance remain unverified.
- Repository `format:check` fails across **291 files**, including existing worktrees, source, vendor files, and generated bundles. No aggregate CI-green claim. Build also reports a large-client-chunk warning.

The earlier parity results below describe the pre-redesign compatibility player. Current static-versus-React screenshots compare two hosts of the new renderer, **not** the new design against historical screenshots.

## Recheck — 2026-10-22

The deployed React entrypoint now mounts the existing player through `client/src/parity-player.tsx`, using the body of `public/legacy.html`, `public/styles.css`, and `mountPlayer()` from `public/player.js`. The unfinished independent components are retained, including pre-existing working-tree edits, but are not the deployed UI. This is a **React-hosted compatibility migration**, not a completed React-native component rewrite.

| Audit area                                                    | Current disposition                                                                                                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| §1 playback, Space, inspector fallback, session errors        | Shared legacy implementation; existing behavior tests pass. Client typecheck passes.                                                                                                                                                             |
| §2 controls and shortcuts                                     | Original controls, IDs, handlers and keyboard bindings reused, not independently reimplemented.                                                                                                                                                  |
| §3.1–3.5 overview, hierarchy, grouping, timeline, breakpoints | Original invocation-aware implementation reused, including pagination and source-line breakpoints.                                                                                                                                               |
| §3.6–3.8 source, inspector, console                           | Original highlighting, source paging, frame inspection, nested values, history, terminal normalization and pagination reused.                                                                                                                    |
| §3.9 continuation and baseline                                | Original validation and variant isolation reused; continuation regression suite passes.                                                                                                                                                          |
| §3.10 evidence                                                | Original certainty, coverage, diagnostics and incomplete-trace messaging reused.                                                                                                                                                                 |
| §3.11 layout                                                  | Original preference format retained. Restored visible divider tracks; fixed the pre-existing 8px center-column regression.                                                                                                                       |
| §3.12 accessibility                                           | Original tabs, named regions, focus restoration, announcements and reduced-motion behavior reused.                                                                                                                                               |
| §4 visual differences                                         | Same markup and stylesheet, including white method cards, colored dots, custom zoom controls and collapsed inspector/console defaults. React wrappers use `display: contents`.                                                                   |
| §5 deployment                                                 | Root build compiles server and client; `/flow/:id` serves `public/react/index.html`; Vite uses `/react/` assets and no longer overwrites the legacy entrypoint. CI/release jobs install client dependencies. Root typecheck includes the client. |

Verification: `npm run build` and `npm run typecheck` pass. `npm test`: **164 passed, 2 skipped, 0 failed**. `npm run test:browser -- --repeat-each=2`: **10 passed, 0 failed** on local Chromium (Edge). Visual comparisons cover five settled states at each of 1440×900 and 375×812: initial, selected values, execution path, focus, and map. They require identical dimensions and at most 6/255 difference per color channel at every pixel, with no masked regions; this accommodates measured Chromium border/shadow rasterization noise, not geometry differences. Functional assertions cover playback, invocation-aware stepping, shortcuts, search/filter, changed values, bookmarks, breakpoints, console normalization, help focus restoration, persistent dividers, long-source paging, export, and missing sessions. Added remount/stale-request/listener cleanup and reduced-motion scroll regression coverage. Manual HTTP/browser smoke: playback reaches the final step, graph nodes render, no browser console errors. Repeated screenshot runs exposed rasterization instability in rounded borders and shadows; both repeated runs pass with the documented channel tolerance. Disabling CSS minification did not resolve it, so production minification remains enabled. JavaScript scrolling now honors reduced motion.

Repository gates update (2026-10-22): after the user restored `AGENTS.md`, its static-only prohibition was made explicit to satisfy the existing scope guard. The package verifier clears npm's inherited `npm_config_allow_scripts` environment option for nested npm commands, resolving npm 11's `EALLOWSCRIPTS` failure without changing global settings or removing `--ignore-scripts`. `npm run check:scope` and `npm run package:check` now pass; the latter verifies the installed CLI, MCP handshake, player assets and flow API. Repository-wide formatting still has previously reported source/config/vendor/generated/worktree issues; it was not rerun for these focused fixes. No claim of a green aggregate `npm run check` or a fully React-native rewrite.

### Second cross-check — 2026-10-22

Current verification: `npm test` **165 passed, 2 skipped, 0 failed**; `npm run typecheck` and `npm run build` pass; expanded `npm run test:browser` **12 passed, 0 failed**, followed by `npm run test:browser -- --repeat-each=2` **24 passed, 0 failed**. The two skipped tests require real CodeGraph integration. Seven added browser cases cover automatic continuation and chunk navigation, comparison variant isolation and previous links, coverage/diagnostics/incomplete status, source-gutter breakpoints, 350-event console pagination, End/Left navigation to cursor zero, and explicit `dtoFields` fallback. Existing desktop/mobile pixel comparisons and controls tests still pass. Divider appearance now has explicit computed-style assertions as well.

- **Fixed:** switching comparison variants retained the proposed run's previous-session link. Both session links now derive from the selected flow in `render()`, including removing stale `href` values. A regression test failed before the fix and passes afterward for baselines both with and without a previous chunk.
- **Fixed:** both desktop resize dividers had lost their background and corner radius. Restored the historical styling.
- **Historical baseline checked:** `public/legacy.html`'s body matches `1c91257:public/index.html` exactly. After restoring the dividers, the shared stylesheet matched `1c91257` after formatting/property-order normalization, apart from the layout-neutral React `display: contents` wrappers. The additional zoom-containment fix below is an intentional deviation from the historical bug.
- **Fixed:** viewport-fixed graph zoom controls covered the console's **Newer** pagination button and could sit over the inspector. The flow panel now establishes the controls' containing block; zoom controls retain their styling but stay inside their own panel. The new browser pagination test reproduced the blocked click before the fix.
- **Production smoke checked:** the built server and React assets render `examples/login-flow.json`, playback reaches `4 / 4`, the inspector displays `dtoFields` fallback values, and no browser page errors occur. Screenshot inspected.
- **Parity limit:** screenshot comparisons use the same current player and stylesheet through separate legacy/React entrypoints. They verify adapter equivalence, not an independent historical behavior oracle. The historical markup/CSS comparison and explicit behavioral assertions provide separate checks. Screenshots cover settled states, not frame-by-frame animation equivalence. Browser verification is Chromium/Edge only; Firefox, Safari, and real mobile devices were not checked.

The original checklist and findings below remain historical evidence, not the status of the currently deployed adapter.

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

| Aspect            | Detail                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Symptom**       | React Flow nodes render in DOM but are invisible; only minimap visible                                                             |
| **Cause**         | Copied legacy CSS rule `#canvas.path .node { display: none !important; }` hides all nodes with class `node`                        |
| **Legacy intent** | Hide DOM nodes when Cytoscape handles rendering in focus/map views                                                                 |
| **React impact**  | MethodNode uses `className="node"` → hidden in all views                                                                           |
| **Evidence**      | [client/src/index.css:500-502](../client/src/index.css#L500-L502), [public/styles.css:2139-2168](../public/styles.css#L2139-L2168) |
| **Fix**           | Remove or scope the rule; React Flow manages its own visibility                                                                    |

### 1.2 Playback Stalls at Step 1

| Aspect              | Detail                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Symptom**         | Clicking Play advances to step 1, button shows "Pause", but playback never continues                                                                 |
| **Cause**           | `tick()` callback captures `cursor` from render-time closure; `setTimeout` re-invokes with stale value                                               |
| **Legacy behavior** | Uses mutable module-level `cursor` variable; `tick` reads current value each call                                                                    |
| **Evidence**        | [client/src/hooks/use-playback.ts:23-44](../client/src/hooks/use-playback.ts#L23-L44), [public/player.js:2608-2642](../public/player.js#L2608-L2642) |
| **Fix**             | Use ref for cursor or pass next-cursor explicitly to avoid stale closure                                                                             |

### 1.3 Space Key Does Not Start Playback

| Aspect                   | Detail                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **Symptom**              | Pressing Space toggles playback state label but timer never starts                                  |
| **Cause**                | Same stale-closure bug as §1.2; state updates but tick loop uses captured cursor=0                  |
| **Browser verification** | Script returned `{cursor:"0", play:"Pause"}` after Space press                                      |
| **Evidence**             | [client/src/App.tsx:24](../client/src/App.tsx#L24) (keyboard handler delegates to same broken hook) |

### 1.4 Inspector Shows Empty Fields

| Aspect              | Detail                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Symptom**         | Selecting LoginRequest step shows empty Fields panel despite `step.dtoFields` containing data                                                                |
| **Cause**           | Inspector reads only `event.after`; ignores fallback to `step.dtoFields` when event lacks after-snapshot                                                     |
| **Legacy behavior** | Falls back: `const after = event?.after ?? step.dtoFields;`                                                                                                  |
| **Evidence**        | [client/src/components/inspector/inspector.tsx:61](../client/src/components/inspector/inspector.tsx#L61), [public/player.js:2465](../public/player.js#L2465) |
| **Fix**             | Add `?? flow.steps[cursor - 1]?.dtoFields` fallback                                                                                                          |

### 1.5 Session Errors Silently Swallowed

| Aspect              | Detail                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Symptom**         | Expired/missing session returns 404; UI stays on "Loading your flow…" forever                                     |
| **Cause**           | Error stored in Zustand but never rendered; no error boundary or status display                                   |
| **Legacy behavior** | Catches fetch error, sets title to "Flow unavailable", disables all controls, shows error in status               |
| **Evidence**        | [client/src/App.tsx:91](../client/src/App.tsx#L91), [public/player.js:3249-3254](../public/player.js#L3249-L3254) |

### 1.6 Client TypeCheck Fails

| Aspect       | Detail                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| **Symptom**  | `tsc --noEmit` reports two `TS2352` conversion errors                                                           |
| **Location** | [client/src/components/inspector/inspector.tsx:13-14](../client/src/components/inspector/inspector.tsx#L13-L14) |
| **Impact**   | CI `npm run check` would fail if client were integrated                                                         |

---

## 2. Controls Rendered But Not Connected

These controls appear in the UI but have **no onClick handlers or keyboard bindings**:

| Control                 | Location                                                                                       | Legacy Equivalent                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Step Into (↘)           | [playback-controls.tsx:55-61](../client/src/components/controls/playback-controls.tsx#L55-L61) | [player.js:2714-2760](../public/player.js#L2714-L2760) — invocation-aware stepping     |
| Step Over (↷)           | [playback-controls.tsx:62-68](../client/src/components/controls/playback-controls.tsx#L62-L68) | [player.js:2762-2800](../public/player.js#L2762-L2800)                                 |
| Step Out (⇡)            | [playback-controls.tsx:69-77](../client/src/components/controls/playback-controls.tsx#L69-L77) | [player.js:2802-2826](../public/player.js#L2802-L2826)                                 |
| Search input            | [timeline.tsx:19](../client/src/components/timeline/timeline.tsx#L19)                          | [player.js:3070](../public/player.js#L3070) — `filterList` text search                 |
| Kind filter dropdown    | [timeline.tsx:22-29](../client/src/components/timeline/timeline.tsx#L22-L29)                   | [player.js:3071](../public/player.js#L3071) — event kind filtering                     |
| Focus button            | [App.tsx:225-230](../client/src/App.tsx#L225-L230)                                             | [player.js:2935-2944](../public/player.js#L2935-L2944) — panel focus/maximize          |
| Execution view selector | [App.tsx:231-240](../client/src/App.tsx#L231-L240)                                             | [player.js:2262](../public/player.js#L2262) — path/focus/map switching                 |
| Center active flow      | [App.tsx:241-246](../client/src/App.tsx#L241-L246)                                             | [player.js:512-530](../public/player.js#L512-L530) — fit-view/center                   |
| Follow checkbox         | [App.tsx:247-252](../client/src/App.tsx#L247-L252)                                             | [player.js:2870-2873](../public/player.js#L2870-L2873) — auto-follow toggle            |
| Help button (?)         | [App.tsx:155](../client/src/App.tsx#L155)                                                      | [player.js:3112-3120](../public/player.js#L3112-L3120) — opens help panel              |
| Changes only checkbox   | [inspector.tsx:53](../client/src/components/inspector/inspector.tsx#L53)                       | [player.js:2474](../public/player.js#L2474) — filters to changed fields                |
| Mobile view buttons     | [App.tsx:178-184](../client/src/App.tsx#L178-L184)                                             | [player.js:2850-2873](../public/player.js#L2850-L2873) — Code/Flow/Steps/State/Console |

### Missing Keyboard Shortcuts

| Key      | Legacy Action      | React Status                             |
| -------- | ------------------ | ---------------------------------------- |
| `I`      | Step into method   | ❌ Not bound                             |
| `O`      | Step over method   | ❌ Not bound                             |
| `U`      | Step out of method | ❌ Not bound                             |
| `/`      | Focus search       | ❌ Not bound                             |
| `Escape` | Close help panel   | ❌ Not bound                             |
| `Home`   | Restart (cursor=0) | ⚠️ Selects step 1 instead of 0           |
| `←`      | Previous step      | ⚠️ Cannot return to cursor=0             |
| `B`      | Toggle bookmark    | ✅ Bound                                 |
| `Space`  | Play/pause         | ⚠️ Toggles state but timer broken (§1.3) |

Legacy keyboard handler: [player.js:3149-3186](../public/player.js#L3149-L3186)

---

## 3. Missing Legacy Features

### 3.1 Execution Path Overview

| Feature                                | Legacy                                    | React                            |
| -------------------------------------- | ----------------------------------------- | -------------------------------- |
| Transition overview with event meaning | ✅ `buildFlowOverview()`, paginated cards | ❌ Replaced by flat symbol graph |
| Certainty labels (static/mock/assumed) | ✅ Per-event badges                       | ❌ Generic labels only           |
| Pagination (prev/next overview pages)  | ✅ `OVERVIEW_PAGE_SIZE = 6`               | ❌ None                          |
| Cursor navigation within overview      | ✅ Click card → seek to step              | ❌ None                          |

Legacy: [public/flow-overview.js](../public/flow-overview.js), [player.js:398-416](../public/player.js#L398-L416)

### 3.2 Call Hierarchy & Method Inspection

| Feature                          | Legacy                                                | React                        |
| -------------------------------- | ----------------------------------------------------- | ---------------------------- |
| Expand/collapse nested calls     | ✅ `expandedCalls` set, tree rendering                | ❌ Flat timeline             |
| Distinguish repeated invocations | ✅ `invocationPositions`, `symbolInvocations` maps    | ❌ Merged by symbolId        |
| Parent call tracking             | ✅ `parentInvocationId()`                             | ❌ None                      |
| Method detail panel              | ✅ Expandable inputs/returns/source/stack             | ❌ Empty, permanently hidden |
| Click node → select invocation   | ✅ [player.js:474-489](../public/player.js#L474-L489) | ❌ Nodes non-interactive     |

### 3.3 Project/Symbol Grouping

| Feature                       | Legacy                                   | React                           |
| ----------------------------- | ---------------------------------------- | ------------------------------- |
| Directory/file/class grouping | ✅ `symbolFileMap`, `getOrCreateGroup()` | ❌ Equally spaced vertical list |
| Visual group containers       | ✅ Grouped DOM structure                 | ❌ Single column layout         |

Legacy: [player.js:498-505](../public/player.js#L498-L505)

### 3.4 Timeline Tools

| Feature                               | Legacy                         | React               |
| ------------------------------------- | ------------------------------ | ------------------- |
| Text search across steps/files/values | ✅ `filterList()` with query   | ❌ Input inert      |
| Event kind filter                     | ✅ Dropdown → `filterList()`   | ❌ Dropdown inert   |
| Bookmarks-only view                   | ✅ Toggle in filter bar        | ❌ Missing          |
| Event pagination                      | ✅ Virtualized list with pages | ❌ Full render      |
| Double-click row → breakpoint         | ✅ Source-line breakpoints     | ❌ Index-based only |

### 3.5 Breakpoints

| Feature                                     | Legacy                                   | React            |
| ------------------------------------------- | ---------------------------------------- | ---------------- |
| Step index breakpoints                      | ✅ `breakpoints` Set                     | ✅ Present       |
| Source-line breakpoints                     | ✅ `sourceBreakpoints` Set, double-click | ❌ Missing       |
| Breakpoint feedback ("Breakpoint · step N") | ✅ Status message                        | ❌ Silent pause  |
| Row visual indicator                        | ✅ `.breakpoint` class                   | ✅ Class applied |

Legacy: [player.js:2650-2659](../public/player.js#L2650-L2659)

### 3.6 Source Panel

| Feature                                | Legacy                                         | React                    |
| -------------------------------------- | ---------------------------------------------- | ------------------------ |
| Syntax highlighting                    | ✅ `prepareSourceHighlighting()`               | ❌ Plain text            |
| Initial source preview (step 0)        | ✅ Shows target file before first step         | ❌ "No source available" |
| Source page navigation (earlier/later) | ✅ Paginated line ranges                       | ❌ Fixed-height scroll   |
| Stack frame navigation                 | ✅ Clickable stack links → inspect frame       | ❌ None                  |
| Line-to-event navigation               | ✅ Click source line → seek to event           | ❌ None                  |
| Inline mock values                     | ✅ Hover/click shows values at source location | ❌ None                  |
| Source values panel                    | ✅ Expandable per-line values                  | ❌ Missing               |

Legacy: [public/source-highlighter.js](../public/source-highlighter.js), [player.js:1092-1400](../public/player.js#L1092-L1400)

### 3.7 Inspector Structure

| Feature                         | Legacy                                 | React                     |
| ------------------------------- | -------------------------------------- | ------------------------- |
| Tab names                       | Values / State / Context               | Fields / Locals / Objects |
| Clickable stack frames          | ✅ Frame list → inspect specific frame | ❌ Flat JSON dump         |
| Frame-specific locals           | ✅ `frameLocals(state, event)`         | ❌ All locals merged      |
| Nested expandable values        | ✅ Tree with expand/collapse           | ❌ `JSON.stringify`       |
| Before/after diff highlighting  | ✅ `.changed` class on modified fields | ❌ No diff                |
| Object history navigation       | ✅ `objectHistory` map, prev/next      | ❌ Current snapshot only  |
| Inputs/Results/Origins sections | ✅ Dedicated panels                    | ❌ Missing                |
| Certainty + note display        | ✅ Combined badge                      | ⚠️ Partial                |

Legacy tabs: [index.html:356-386](../public/index.html#L356-L386)
React tabs: [inspector.tsx](../client/src/components/inspector/inspector.tsx)

### 3.8 Console Panel

| Feature                       | Legacy                            | React                      |
| ----------------------------- | --------------------------------- | -------------------------- |
| Collapsible `<details>`       | ✅ Default collapsed              | ❌ Always visible          |
| Event count badge             | ✅ "N events"                     | ❌ Missing                 |
| Older/Newer pagination        | ✅ `CONSOLE_PAGE_SIZE = 300`      | ❌ All lines rendered      |
| Normalized terminal output    | ✅ `preparePlainTerminalOutput()` | ❌ Raw `String(ev.output)` |
| Auto-scroll on cursor advance | ✅                                | ✅ Present                 |

Legacy: [player.js:1494-1545](../public/player.js#L1494-L1545), [public/terminal-text.js](../public/terminal-text.js)

### 3.9 Chunk Continuation

| Feature                                           | Legacy                     | React                       |
| ------------------------------------------------- | -------------------------- | --------------------------- |
| Load next prepared chunk during playback          | ✅ `extendThrough()` async | ❌ Stops at initial session |
| Previous/Next session links                       | ✅ Header navigation       | ❌ Missing                  |
| Baseline variant switching                        | ✅ `<select id="variant">` | ❌ No selector              |
| Continuation validation (schema, cycle detection) | ✅ Comprehensive checks    | ❌ None                     |

Legacy: [player.js:1548-1608](../public/player.js#L1548-L1608), [player.js:3232-3246](../public/player.js#L3232-L3246)

### 3.10 Evidence & Completeness Indicators

| Feature                        | Legacy                                   | React                                     |
| ------------------------------ | ---------------------------------------- | ----------------------------------------- |
| Static vs Mock badge           | ✅ `mock-badge` element                  | ⚠️ Generic label                          |
| Coverage summary               | ✅ `coverageAssessment.status` + reasons | ❌ Missing                                |
| Diagnostics panel              | ✅ JSON-formatted diagnostics            | ❌ Missing                                |
| Truncated warning              | ✅ "Trace incomplete · see coverage"     | ❌ Can show "Replay complete" incorrectly |
| Unresolved/proposed indicators | ✅ Per-symbol styling                    | ❌ None                                   |

Legacy: [player.js:2293-2320](../public/player.js#L2293-L2320)

### 3.11 Layout Preferences

| Feature                                 | Legacy                             | React                       |
| --------------------------------------- | ---------------------------------- | --------------------------- |
| Resize trace panel divider              | ✅ Pointer drag, clamped 170-480px | ❌ Divider removed          |
| Resize source/flow divider              | ✅ Pointer drag, 25-75% range      | ❌ Divider removed          |
| Persist layout to localStorage          | ✅ `saveLayout()` on every change  | ❌ Temporary state only     |
| Panel collapse toggles                  | ✅ Timeline, Inspector, Diagram    | ⚠️ Partial (Inspector only) |
| Focus/maximize panels                   | ✅ Source-focus, Flow-focus modes  | ❌ Buttons unwired          |
| Keyboard resize (arrow keys on divider) | ✅ Accessibility support           | ❌ Missing                  |

Legacy: [player.js:2875-2984](../public/player.js#L2875-L2984)

### 3.12 Accessibility

| Feature                                     | Legacy                               | React                         |
| ------------------------------------------- | ------------------------------------ | ----------------------------- |
| Inspector tab ARIA semantics                | ✅ `role="tablist"`, `aria-selected` | ⚠️ Basic                      |
| Named regions (`aria-label`)                | ✅ All panels labeled                | ⚠️ Some missing               |
| Focus restoration after panel toggle        | ✅ Returns to appropriate control    | ❌ Lost                       |
| Step change announcements                   | ✅ `aria-live="polite"` status       | ⚠️ Partial                    |
| Reduced-motion preference                   | ✅ Respects `prefers-reduced-motion` | ❌ Framer Motion ignores      |
| Screen-reader-only navigation announcements | ✅ `#navigation-announcement`        | ✅ Element present but unused |

---

## 4. Visual Differences (Not Technology-Only)

These are **design changes**, not incidental technology artifacts:

| Area                    | Legacy                                       | React                                            | Verdict             |
| ----------------------- | -------------------------------------------- | ------------------------------------------------ | ------------------- |
| Inspector default state | Collapsed                                    | Expanded                                         | Changed default     |
| Node card style         | White gradient, colored status dots          | Dark gradient, accent border glow                | Redesigned          |
| Zoom controls           | Custom +/- buttons, fit-view                 | React Flow Controls widget, MiniMap, attribution | Different component |
| Inspector tab styling   | Underline active, horizontal layout          | Pill-style, different spacing                    | Restyled            |
| Source panel height     | Flexible, fills available space              | Fixed `maxHeight: 400px`                         | Constrained         |
| Console panel           | Collapsible details, dark terminal aesthetic | Always-visible, lighter background               | Restructured        |
| Export filename         | `code-anime-trace.json`                      | Unknown (handler exists but untested)            | Verify              |
| Empty states            | Rich messaging, actionable suggestions       | Minimal text                                     | Reduced             |
| Packet animation        | CSS keyframes, cubic-bezier bounce           | Framer Motion, linear interpolation              | Different feel      |

---

## 5. Build & Verification Gaps (Historical)

These describe revision `1c91257`, not the deployed compatibility adapter. See the current recheck above for build, routing, typecheck, and test status.

| Gap                                                                          | Impact                                                                 |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Root `npm run build` does not compile React client                           | Client ships unbuilt or requires separate command                      |
| Root `npm run typecheck` excludes `client/`                                  | TS errors undetected in CI                                             |
| Root `npm run test` excludes client tests                                    | No automated parity verification                                       |
| `tests/browser/` directory does not exist                                    | Playwright config references missing dir; `npm run test:browser` fails |
| Server serves `public/index.html` (legacy); React runs on separate Vite port | No unified deployment path                                             |
| React build outputs to `public/`                                             | Would overwrite legacy entrypoint without cutover plan                 |
| No integration between root and client package.json                          | Two independent dependency trees                                       |

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

## 7. Original Acceptance Checklist (Historical)

The unchecked boxes below preserve the original audit of the independent React components. They are not the current adapter status; see the recheck above. A future React-native replacement must independently pass each item:

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

| Legacy File                    | Lines | React Replacement                          | Status                  |
| ------------------------------ | ----- | ------------------------------------------ | ----------------------- |
| `public/player.js`             | ~3257 | Multiple components                        | ❌ Incomplete           |
| `public/replay.js`             | 12    | `hooks/use-playback.ts` (partial)          | ⚠️ Replay logic differs |
| `public/flow-overview.js`      | ~400  | None                                       | ❌ Missing              |
| `public/source-highlighter.js` | ~300  | None                                       | ❌ Missing              |
| `public/terminal-text.js`      | ~80   | None                                       | ❌ Missing              |
| `public/styles.css`            | ~2400 | `client/src/index.css` (copied + Tailwind) | ⚠️ Conflicting rules    |
| `public/index.html`            | ~540  | `client/src/App.tsx` + components          | ❌ Structure differs    |

---

_The original 2026-10-18 audit was read-only. The 2026-10-22 rechecks include the implementation fixes and verification described above._
