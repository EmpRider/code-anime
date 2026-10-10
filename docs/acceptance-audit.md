# Execution visualizer acceptance audit

Checkpoint: 2026-10-10, branch `codex/execution-visualizer-improvements`.
Multilingual source highlighting, a persisted branching-tree performance
fixture, recorded Python execution, and experimental Node.js JavaScript
recording are covered by tests.

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
2. **Focus on user code — implemented for tested Python and JavaScript scope.**
   Recorded fixtures cross user files; the JavaScript V8 Inspector adapter
   excludes Node runtime and dependency frames. `tests/recording.test.ts`
   verifies user-file entries. Broad framework callback coverage, generated
   infrastructure filtering, and worker-thread coverage remain unverified.
3. **Understand entry through completion — partial.**
   Python recording tests exercise calls, locals, returns, loops, branches,
   exceptions, generators, and asyncio. JavaScript tests now cover CommonJS and
   ES modules, debugger-observed nested calls and locals, loops, 37 levels of
   recursion, timers, output, nonzero exit, and event-budget truncation.
   V8-reported JavaScript throws and entry into catch scopes are now tested as
   observed events for caught and uncaught exceptions. JavaScript now records
   debugger-reported return values for ordinary and recursive calls; unobserved
   exits remain unresolved. Promise snapshots now preserve V8-reported settlement
   state and result when available, while pending or later settlements remain
   unresolved. A throwing `finally` does not emit a
   normal return in the new regression. Other frame-exit causes are unresolved.
   Concurrent repeated awaits, loop awaits, async recursion, and nested
   same-argument awaited calls now have invocation-identity regressions. These
   use V8-visible async ancestry to keep resumed parent and child invocations
   distinct. Arbitrary asynchronous execution and other languages remain incomplete.
   Evidence labels distinguish observed recording from CodeGraph and simulation.
   Captured JavaScript stdout remains unchanged in the saved trace; the browser
   removes ANSI control sequences only when displaying plain text. JavaScript
   stdout/stderr is now recorded as process-level output with no fabricated
   source location, invocation, or locals; the observed certainty describes the
   decoded output text, not the origin or write time. A concurrent async regression
   checks both independent output streams, missing newline terminators, and the
   continued observation of real user-method entries. Exact source causality,
   pipe buffering delays, and cross-stream write ordering remain unresolved.
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
    Current source rows additionally mark the executing line with
    `aria-current="location"`; enabled breakpoint buttons announce their line
    and whether activation sets or removes the breakpoint. A browser regression
    checks these announcements across keyboard activation and timeline seeks.
    The Node.js recorder now supports external and base64-inline V3 source maps
    using Node's source-map decoder. A generated JavaScript pause is attributed
    to the original TypeScript line only when the source-map reference is local,
    the original path is inside the project, and embedded source content exactly
    matches the original project file. The trace retains V8's generated file
    and line alongside the original source location; the player exposes that
    provenance in the source-header tooltip. Focused tests exercise both map
    formats and reject stale mappings, and a real browser test verifies source
    highlighting and console replay from a transpiled TypeScript fixture.
    Unmapped generated files under `dist` remain excluded; other user JavaScript
    files retain the exact text compiled by V8 when mapping is unavailable.
    Complete language-specific grammar, advanced bundler mappings, generated
    output without valid maps, and broad original-source provenance remain
    incomplete or unverified.
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
    the updated sum appears on the following event. A CommonJS V8 Inspector
    regression additionally checks each `i=0..3` loop value across a repeated
    source line. Broader loop semantics remain unverified.
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
    A focused browser regression checks source-line `aria-current` and
    stateful breakpoint names/pressed state after keyboard activation and seeks.
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
    Observed recording is implemented for Python and experimentally for
    Node.js JavaScript through V8 Inspector. JavaScript coverage includes
    verified recursive calls, ES modules, timer callbacks, caught/uncaught throws,
    catch-handler entry, output, budgets, and debugger-observed return values
    for tested synchronous calls. Unobserved exits remain unresolved, while
    Promise snapshots expose V8-observed state/results and explicitly preserve
    unknown future settlement. The regression exercises a fulfilled and pending
    Promise, without evaluating application code. This does
    not establish complete return-value accuracy or all async behavior. The
    JavaScript snapshot regression now verifies dense/sparse/nested arrays,
    accessor non-evaluation, and non-index array properties; a separate
    regression verifies V8-reported Date, Map, Set, RegExp, Error, typed-array,
    and class-instance types without claiming their native internal state was
    captured. Snapshot depth and property counts remain bounded. The
    TypeScript-to-JavaScript source mapping has observed line highlighting
    coverage for an externally mapped CommonJS entry and an inline map;
    this does not add a TypeScript runtime tracing backend. The optional
    real CodeGraph integration test previously passed against an
    indexed Kotlin fixture on Windows with the default npm CLI launcher.
    Structural analysis does not establish Kotlin runtime recording. Establish
    the full supported-language inventory and representative runtime evidence.
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
    Core, browser, and package delivery gates pass for this checkpoint.
    Recheck affected gates after any further changes.
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

- `npm run check`: typecheck, 112 core tests (111 passed, one optional live
  CodeGraph integration test skipped), build, and Prettier passed.
- `npm run test:browser`: 29 passed, including paired-call, recorded
  execution-path, separate console writes, overview rewind, and persisted
  five-session continuation-chain coverage.
  Browser coverage includes recorded nested disclosure,
  repeated simulated invocations, recorded continuation preservation, deep
  simulated recursion, keyboard pagination, multiline lexical state, virtualized
  source continuity, real five-iteration loop playback, and mobile layouts.
  JavaScript recording also verifies source, local values, ANSI-decorated output
  display, and reverse seeking without rewriting recorded stdout. The 27-test
  Playwright suite was rerun after the V8 Promise snapshot update.
  The additional browser test verifies source-line and breakpoint accessibility.
  The latest browser regression records a transpiled TypeScript entry, verifies
  its mapped original source line and V8 provenance tooltip, and replays output.
  The recorded JavaScript browser regression also seeks to a process-output
  event, verifies the absence of a fabricated executing source line, and retains
  the actual printed text in the console.
- `npm run package:check`: packed CLI installation, MCP handshake, player assets,
  and stored flow API passed, including both Python and JavaScript observed
  recordings through the installed package.
- `tests/recording.test.ts`: JavaScript regressions also cover repeated
  source-line visits with identical visible locals, debugger-observed throw
  values on caught and uncaught errors, and catch-scope entry, alongside
  cross-file calls/values, 37 recursive invocations via ESM, an explicitly
  truncated event budget and a timer callback.
  Four additional async regressions cover repeated concurrent awaits,
  awaited loop iterations, async recursion, and concurrent identical arguments
  passed through nested awaited functions. A transient debugger-disconnect
  failure occurred in one timer test run; the isolated rerun and complete
  `npm run check` passed. Stress and shutdown-race coverage remains open.
  A previously flaky timeout assertion now allows enough interpreter startup
  time during concurrent suite execution, while still verifying timeout and
  partial-trace semantics.
  A new Promise regression verifies a V8-observed fulfilled result and a
  still-pending Promise without predicting later settlement. JavaScript
  event-budget and cancellation regressions passed after adding the Windows
  `taskkill` nonzero-exit fallback.
  An additional stderr regression writes the current Node.js Inspector help
  URL from application code. The recorder now filters that URL when Node.js
  emits it as an Inspector startup notice, while preserving a subsequent
  identical application-written line. This fixes a Node.js v26.8.1 failure
  that otherwise appended the startup notice to recorded output.
  A concurrent stdout/stderr regression now checks per-stream text preservation
  with unterminated writes while keeping source and invocation attribution
  unresolved. The recording service rejects a failed startup whose only events
  are process diagnostics; the existing syntax-error regression verifies that
  the failure still surfaces the original Node.js diagnostic.
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
- The player, continuation, and value-inspection JSDOM suites pass with the
  terminal-display helper injected into their module import harness.
  A dedicated helper regression checks ANSI SGR and OSC stripping while
  preserving the raw recorded output string.
- Additional focused lexer regressions cover multiline/nested JavaScript template
  interpolations, escaped interpolation markers, single-line Rust raw strings,
  and empty source windows. Browser coverage checks embedded code tokens and
  subsequent statements; comprehensive syntax grammar remains unverified.
- A separate persisted branching browser trace uses 300 child invocations and
  1,502 events, with independent nested disclosure and paged expansion; its
  seek fixture reported p95 31.6 ms, excluding paint and network. This is
  bounded evidence for one stored session, not long continuation chains.
- Five linked persisted synthetic sessions (7,503 events; 1,500 child
  invocations) loaded successfully in a focused Playwright test. A post-load
  seek sample reported p95 37.3 ms, excluding paint and network. The browser
  inspected the final child invocation, restored earlier console state, and
  made no extra flow requests during already-loaded playback. This is bounded
  evidence of the stored continuation path, not recorded program performance.
- The 20,000-event synthetic single-invocation browser fixture reported seek
  p50 14.0 ms and p95 17.6 ms, excluding paint and network. These figures do
  not verify performance for broad or deep trees.
- `git diff --check`: passed with no whitespace errors.
- Large object inspector behavior also passed the full 28-test browser suite;
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
