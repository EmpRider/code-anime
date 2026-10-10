# Execution visualizer acceptance audit

Checkpoint: 2026-10-10, branch `codex/execution-visualizer-improvements`.
Multilingual source highlighting, a persisted branching-tree performance
fixture, and a recorded five-iteration Python loop are covered by tests.

Authority: the original 37 numbered requirements in the attached
`pasted-text-1.txt`. This checklist tracks the original scope; it does not redefine
completion around existing tests. **The overall implementation is incomplete.**

Evidence labels below distinguish tested behavior from inspection and missing
verification. A test of one scenario does not prove all languages, inputs, or
execution paths. Previous test results are checkpoint evidence, not promises
about future changes.

## Requirement checklist

1. **Remove the 30-step limit — implemented, bounded verification.**
   `src/analysis/native-codegraph.ts` defaults to unlimited call depth and reports
   event/provider boundaries. `tests/native-codegraph.test.ts` covers more than
   30 calls; `tests/recording.test.ts` covers recursion, linked chunks, timeout,
   cancellation, and infinite execution. Runtime recursion still obeys Python's
   runtime limit. These tests do not prove arbitrary unbounded execution.
2. **Focus on user code — implemented for the recorded Python scope.**
   The runtime fixture crosses user files and excludes dependency internals.
   `tests/recording.test.ts` verifies user-file events. Broad framework callback
   coverage and generated infrastructure filtering remain unverified.
3. **Understand entry through completion — partial.**
   Recording tests exercise calls, locals, returns, loops, branches, exceptions,
   generators, and asyncio. Evidence labels distinguish observed recordings from
   CodeGraph structure and AI simulation. Representative end-to-end scenarios
   across all advertised provider languages remain unverified.
4. **Preprocess before playback — implemented.**
   `src/services/animation-builder.ts` and `recording-service.ts` persist prepared
   data. `public/player.js` fetches saved flow/continuation data during replay.
   Recorded nested disclosure and paginated method inspection browser tests
   verify no requests during those interactions. Other UI controls still need
   request-level coverage.
5. **Shared execution model — implemented, bounded verification.**
   `src/domain/trace.ts` carries invocation, stack, source, values, output, and
   evidence data. Async task identity is carried in event values. Array order
   supplies sequence; immutable snapshots support backward navigation.
   `tests/replay.test.mjs` and player tests verify historical state restoration.
6. **High-level default view — implemented for tested scenarios, visual acceptance open.**
   The default Execution Path summarizes prepared enter, call, return, throw,
   and console events in compact paged rows. Adjacent caller-call and callee-entry
   events are represented by one row, active from the original call site, with
   the real input values and return transfer. Unpaired calls remain visible.
   A/B browser tests verify paging, shared seeking and exact source following;
   recorded Python nested calls verify observed return values. Consecutive
   console fragments now merge only on a known shared source line before a
   newline, keeping separate statements individually seekable. Returning to
   cursor zero restores the first overview page when Follow is enabled.
   Broader flow quality and visual comparison with VisualJS remain open.
7. **Expandable methods — implemented, bounded verification.**
   Timeline invocation disclosure and clickable diagram method buttons share
   one nested recorded-event inspector. Browser tests cover source lines,
   annotation separation, and event selection; a 45-level simulated recursion
   verifies that deeply nested user calls remain inspectable. Broader visual
   review and real deeply recursive frontend recordings remain open.
8. **Independent nested expansion — implemented, bounded verification.**
   `expandedCalls` preserves invocation-specific state and cursor position.
   A recorded `outer -> middle -> add` scenario verifies independent collapse,
   re-expansion, return propagation, and continuing playback. The simulated
   45-level diagram fixture checks retained nested expansion beyond 30 calls.
9. **Synchronize detail levels — implemented, bounded verification.**
   Disclosure and inspector derive from the same cursor. Browser tests verify
   position preservation while a recorded nested trace is playing, including
   diagram selection and source navigation. The default path shares the cursor,
   follow state and method inspector. Task/thread identity now prevents
   mismatched adjacent async calls from being paired or merging console output;
   broader multi-task browser scenarios remain.
10. **VisualJS interaction reference — unverified.**
    A direct visual/interaction comparison is still required. Existing layout
    tests do not establish fidelity to the requested source execution experience.
11. **Live source editor — partial.**
    `renderSource()` displays captured source, line numbers, active arrow,
    breakpoint controls, and source-follow navigation. Python lexical coloring
    now distinguishes floor division and comments. Stateful lexical preparation
    preserves multiline Python strings, Kotlin nested comments and raw strings,
    Rust raw strings and escaped quotes, and JavaScript/TypeScript multiline
    comments across virtualized source windows. Interpolated JavaScript/TypeScript
    template literals now distinguish embedded code across lines, including
    nested templates and escaped interpolation markers. Single-line Rust raw
    literals restore code highlighting after closing hashes. Browser regressions
    verify exact original text, inert HTML-like source and active-line continuity.
    Complete language-specific grammar, source maps, and broad original-source
    provenance remain incomplete or unverified.
12. **Follow method execution — implemented, bounded verification.**
    Player and recording browser tests cover source transitions, returning caller
    state, and disabling follow. Source windows retain DOM nodes on adjacent
    steps. Deep cross-file source-follow acceptance needs explicit coverage.
13. **Animate loops — implemented for tested recordings.**
    `tests/recording.test.ts` checks repeated line visits and loop values.
    The browser test recording `five-iterations.py` verifies five visits to the
    original loop-body line, the exact historical `i` and `sum` values,
    reverse navigation, and final console output `15` from observed execution.
    Runtime event snapshots here describe values _before_ executing each line;
    the updated sum appears on the following event. Broader loop semantics
    across supported languages remain unverified.
14. **Playback/debugger controls — implemented, bounded verification.**
    Player tests cover reverse, seek, step-over/out, breakpoints, continuation,
    and async invocation semantics. Browser tests cover playback controls.
    Reverse restores snapshots without running the program again.
15. **Reduce wasted viewport — partial.**
    CSS makes headers smaller, inspector collapsible, and console compact.
    Desktop source and diagram are side by side with a persisted resize handle.
    Viewport allocations and visual quality still need broader measurement.
16. **Content-first progressive disclosure — partial.**
    Inspector, console, and method details are disclosed on demand. The desktop
    source/flow arrangement is implemented. Default overview clarity and visual
    acceptance remain open; DOM geometry alone cannot prove them.
17. **Compact application structure — partial.**
    Resizable timeline, source, inspector, and console exist. Playback is in a
    bottom dock, with separate header regions. Resizable source/flow panes are
    implemented; toolbar density and secondary-control organization still need
    review.
18. **Default side-by-side layout — implemented for tested desktops.**
    Source and diagram display side by side by default at desktop widths.
    Pointer/keyboard resizing, per-pane focus, persisted preferences, and mobile
    switching have browser geometry regressions. Visual acceptance remains open.
19. **Visual style — partially inspected, not accepted.**
    Existing typography and restrained colors are retained. Contrast, active
    line readability, and compactness require rendered inspection. There is no
    evidence here establishing a second supported theme.
20. **Meaningful animation — partial.**
    `render()` animates value packets and honors reduced motion. An identity
    regression verifies unchanged packets on non-navigation updates. Connection
    rebuilds and broader timing/visual quality remain unverified.
21. **No flicker/layout jumps — partial.**
    Source-window reuse, cached lexical state and cached timeline filtering
    reduce DOM work; source-window browser regressions protect source node
    identity during adjacent steps. Inspector,
    packet, and connection updates still need scrutiny for unnecessary rebuilds.
22. **Immediate disclosure — implemented, incomplete scale evidence.**
    Disclosure uses prepared data; tests verify no request and cursor retention.
    Deep simulated recursion (45 invocations) and keyboard pagination (100 events)
    pass. A persisted 1,502-event fixture now tests 300 sibling invocations,
    paged nested disclosure, position retention and no extra HTTP flow requests.
    A five-session synthetic persisted chain now exercises 1,500 distinct
    invocations and 7,503 events; the final invocation remains inspectable
    after loading all prepared chunks. Real-world larger branching-tree
    performance remains unverified.
23. **Contextual variable inspection — implemented, bounded verification.**
    Collapsible inspector shows locals, arguments, object changes, and returns.
    Player tests check historical values and per-invocation async differences.
    Large/deep values now use lazy nested disclosure and 60-field progressive
    pages in the state, change, and flow-packet inspectors, with expanded paths
    and page counts restored across
    historical seeks. Changes-only mode can find a modified property past the
    initial page without creating unrelated rows. A JSDOM regression covers
    1,500 wide fields, 900 nested levels, safe HTML-like values, and zero fresh
    requests during navigation. Real-browser rendering and accessibility remain
    unverified for large objects.
24. **User navigation control — implemented, bounded verification.**
    Timeline rows, stack buttons, follow toggle, and source breakpoints provide
    navigation. The recorded nested browser scenario verifies diagram selection,
    source-location navigation, and playback cursor synchronization.
25. **Keyboard/accessibility — partial.**
    Keyboard shortcuts, native disclosure buttons, focus styles, and reduced
    motion exist. Browser tests cover disclosure focus, invocation-selector
    focus preservation, pagination focus, mobile controls, and keyboard resizing.
    Screen-reader behavior and all focus paths remain unverified.
26. **Responsive workspace — partial.**
    Browser tests cover 1440x900, 820x1180, and 390x844, panel switching, playback
    visibility, and page overflow. Desktop side-by-side flow and a dedicated
    mobile Flow view pass geometry and replay checks. Mobile diagram method
    disclosure and broader visual accessibility still need verification.
27. **Large-codebase performance — partial.**
    Cached source lines, event indices, bounded timeline rows, and continuation
    exist. The 20,000-event synthetic browser test verifies seek/filter/disclosure
    and source reuse. Its synchronous handler timings exclude paint and network.
    A separate 45-level simulated recursion verifies nested visibility after
    collapse/reopen; proportional indentation avoids collapsing its usable width.
    The persisted 300-child/1,502-event browser fixture measures seek performance
    and checks paged expansion without restarting analysis. A separate browser
    fixture persists and loads five linked sessions with 1,500 invocations and
    7,503 events, verifying final-method inspection, reverse seeks, console
    restoration, and exactly one retrieval per prepared session. These synthetic
    tests exclude browser paint, broad real-project behavior, and heap profiling.
    Measure memory, many methods, larger trees, long stacks, large objects,
    large output,
    multiple files, and real stored continuation chains before accepting this.
    Value-tree DOM creation is now bounded to visible pages and explicitly
    expanded branches; the large-value regression verifies lazy construction,
    filtering, and replay state. Paint, heap, and real-project profiling are
    still required.
28. **No repeated AI processing — implemented by architecture.**
    Player HTTP requests retrieve stored flows. Backend analysis is separate.
    Extend request assertions to all ordinary controls for behavioral acceptance.
29. **Existing language compatibility — partial.**
    Shared frontend and CodeGraph-backed simulation remain language-independent.
    Observed recording is Python-only. The optional real CodeGraph integration
    test passed against an indexed Kotlin fixture on Windows with the default
    npm CLI PATH launcher. It verifies structural relationships, ambiguous
    overload handling, index prerequisites, and refinements. Structural analysis
    does not establish recorded Kotlin execution semantics. Establish the
    supported-language inventory and broader representative evidence.
30. **Single execution state — implemented, bounded verification.**
    `replayState()` and the cursor drive stack, locals, source, console, and flow.
    Continuation tests check historical state and scenario isolation. Recorded
    nested browser tests cover flow, source, output, return, and cursor together.
31. **Source separate from annotations — implemented.**
    Source rows use captured file text and text nodes; inspector/packet annotations
    are separate. Browser regression verifies literal HTML-like source stays text.
    Continue preserving this invariant in syntax and source-map work.
32. **Inspect existing architecture first — evidence available.**
    Existing service, schema, replay, renderer, and test architecture were inspected
    and reused. Current changes extend the existing application.
33. **Staged implementation — in progress.**
    Analysis, shared events, hierarchical disclosure, source replay, synchronization,
    layout, performance, and tests exist, but stages are not all accepted.
34. **Preserve working functionality — tested at checkpoint.**
    Core, browser, and package delivery gates are rerun after each substantial
    batch. Recheck all gates for the final candidate before pushing.
35. **Ten functional acceptance scenarios — incomplete as a set.**
    Existing tests cover portions of each scenario, including deep recursion and
    safe unbounded execution. Recorded nested disclosure and five-iteration
    reversible playback are verified. Syntax-window tests cover 1,000 source
    lines and escaped/multiline lexical boundaries. Large real continuation
    performance and the representative supported-language matrix remain
    unverified for real recorded programs. Do not infer acceptance from counts.
36. **UI acceptance — incomplete.**
    Responsive layout, packet stability, method disclosure, and source-state
    regressions pass, but full rendered visual review and keyboard/screen-reader
    validation are still required.
37. **Integrated implementation and final delivery — in progress.**
    Implementation remains on `codex/execution-visualizer-improvements`.
    Final delivery requires closing the gaps above and revalidating every
    supported language and primary interaction, including rendered visual review.

## Checkpoint verification

- `npm run check`: typecheck, 85 core tests, build, and Prettier passed;
  one optional live CodeGraph integration test skipped.
- `npm run test:browser`: 26 passed, including paired-call, recorded
  execution-path, separate console writes, overview rewind, and persisted
  five-session continuation-chain coverage.
  continuation-chain fixture. Browser coverage includes recorded nested disclosure,
  repeated simulated invocations, recorded continuation preservation, deep
  simulated recursion, keyboard pagination, multiline lexical state, virtualized
  source continuity, real five-iteration loop playback, and mobile layouts.
- `npm run package:check`: packed CLI installation, MCP handshake, player assets,
  and stored flow API passed for the current candidate.
- `tests/flow-overview.test.mjs`: eight focused cases verify event-to-overview
  transitions, input and return values, nesting, caller call-site timing,
  independently recorded Python task console streams, and rejecting misleading
  adjacent entries from another async task. The added case checks distinct
  source-line output and newline-terminated writes. Two focused Playwright
  scenarios verify console-row seeking, rewind to page one and paired calls.
- The opt-in real CodeGraph integration test passed against a temporary indexed
  Kotlin project using npm-installed CodeGraph 0.9.9 on Windows. The test first
  confirmed rejection without an index, then verified PATH-discovered CLI
  transport, a provider-only trace, refinement, and ambiguous target selection.
  This does not establish live runtime tracing for Kotlin.
- Both JSDOM player suites exercise the module-imported stateful lexer; 26
  player and continuation tests passed after updating the JSDOM import harness.
- Additional focused lexer regressions cover multiline/nested JavaScript template
  interpolations, escaped interpolation markers, single-line Rust raw strings,
  and empty source windows. Browser coverage checks embedded code tokens and
  subsequent statements; comprehensive syntax grammar remains unverified.
- A separate persisted branching browser trace uses 300 child invocations and
  1,502 events, with independent nested disclosure and paged expansion; its
  seek fixture reported p95 20.1 ms, excluding paint and network. This is
  bounded evidence for one stored session, not long continuation chains.
- Five linked persisted synthetic sessions (7,503 events; 1,500 child
  invocations) loaded successfully in a focused Playwright test. A post-load
  seek sample reported p95 27.5 ms, excluding paint and network. The browser
  inspected the final child invocation, restored earlier console state, and
  made no extra flow requests during already-loaded playback. This is bounded
  evidence of the stored continuation path, not recorded program performance.
- The 20,000-event synthetic single-invocation browser fixture reported seek
  p50 12.8 ms and p95 19.0 ms, excluding paint and network. These figures do
  not verify performance for broad or deep trees.
- `git diff --check`: passed with no whitespace errors.
- Large object inspector behavior also passed the full 25-test browser suite;
  broader rendered accessibility and memory profiling remain open.

## Next implementation order

### Desktop layout follow-up

The default desktop contradiction in item 18 is now corrected: source and flow
open side by side, with a keyboard/pointer divider, independent temporary focus
controls, and persisted split/visibility preferences. A browser geometry test
checks panel alignment, useful height, resizing, focus, restoration, and reload.
The 1440x900 render was visually inspected. Existing tablet and mobile scenarios
passed. The mobile flow experience, compact toolbar, nested visual interactions,
and other open items above still require work; this closes the desktop layout
gap only.

### Animation stability follow-up

Packet rendering now retains the existing node and animation when only inspector,
bookmark, breakpoint, or layout state changes. A browser regression verifies node
and animation identity, replacement on forward navigation, and no animation under
reduced-motion preferences. All 26 player/continuation tests and typecheck pass.
This addresses the packet restart defect in items 20–21; broader nested visual
acceptance and avoiding unrelated inspector/connection rebuilds remain open.

### Mobile flow follow-up

Mobile navigation now includes Flow and Steps separately. Flow fills the selected
mobile workspace and is available even when the saved desktop diagram setting is
hidden. A browser regression checks packet bounds, forward stepping, returning to
the matching source line, preserved cursor, no extra requests, and no page overflow
at 390x844. That rendered flow view was visually inspected. The existing mobile
layout/keyboard scenarios, 26 player tests, and typecheck also pass. This resolves
the missing mobile flow access in item 26; deeper nested-flow acceptance remains.

### Recorded nested disclosure follow-up

A real Python fixture now records `outer -> middle -> add` across two source
files. The browser test expands the invocation ancestors, collapses the middle
method while playback is active, verifies its child's statement details disappear,
and reopens it with the child's expansion state retained. A controlled browser
clock proves disclosure preserves playback state and cursor rather than merely
observing a paused replay. The test also verifies return value 30, source navigation
back to the caller, final console output, reverse console restoration, and no
additional requests. This supplies stronger evidence for items 8–9 and the nested
part of item 35. Diagram-entity disclosure and large deep-tree performance are
still separate open requirements.

### Diagram disclosure follow-up

Diagram method boxes are now keyboard-accessible buttons that open the active or
most recently visited invocation of that symbol. The flow panel shows a nested
prepared-event tree with source lines kept separate from inputs, values, returns,
and output annotations. Child branches are created on expansion and each method
is paged in groups of 50 events. Expansion shares invocation state with the
timeline. Selecting an event seeks the existing shared replay.

The recorded nested browser scenario now exercises diagram selection, nested
collapse/reopen, retained child expansion, return values, source navigation, and
the current-step marker without additional requests. Repeated simulated calls of
one symbol retain independent return values when switching invocation selection;
the selector keeps keyboard focus. A recorded continuation retains the selected
method as later chunks are loaded. A separate simulated 45-level recursion test
verifies nested collapse/reopen and exposed a layout defect: fixed indentation
consumed all available width at deep levels. Proportional indentation now preserves
deep nested visibility. Keyboard pagination loads only prepared events, retains
the playback position, and transfers focus to the last event when complete.
Large branching trees and broader visual acceptance still need focused checks.

1. Correct default desktop source/flow layout, preserve compact mobile switching,
   add panel controls/preferences and acceptance assertions for actual geometry.
2. Prevent non-navigation updates from restarting packet animations; verify
   nested disclosure and state synchronization during playback.
3. Expand language-specific syntax coverage, test source-map provenance and
   verify the source execution reference visually. Multiline source coloring
   across virtualized windows now has explicit regressions.
4. Exercise real stored large traces, deep trees and language scenarios; close
   remaining correctness and accessibility gaps with focused tests.
5. Revisit every item here with final evidence and run full delivery gates.
