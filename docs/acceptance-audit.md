# Execution visualizer acceptance audit

Checkpoint: 2026-10-12, branch `codex/execution-visualizer-improvements`.
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

## Requirement status matrix

This table summarizes the 37 original requirements. **Bounded** means the
specified behavior is demonstrated by particular fixtures or tests, but the
full acceptance scope is not yet proven. **Partial** means implementation or
verification remains outstanding. Detailed evidence follows in the checklist.

| #   | Requirement                               | Status      | Remaining acceptance work                                                                                  |
| --- | ----------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | No arbitrary 30-step limit                | Bounded     | Verify more real deep traces and resource limits.                                                          |
| 2   | User-code focus                           | Bounded     | Exercise diverse framework callbacks and generated code.                                                   |
| 3   | Entry-to-exit execution accuracy          | Partial     | Cover wider async, exceptions, runtime boundaries, and languages.                                          |
| 4   | Preprocess before playback                | Bounded     | Verify all trace/scenario navigation paths.                                                                |
| 5   | Shared execution event model              | Bounded     | Validate high-volume and cross-language semantics.                                                         |
| 6   | High-level view by default                | Bounded     | Complete visual/interaction acceptance.                                                                    |
| 7   | Expand method execution                   | Bounded     | Validate real deep, heavily branching traces.                                                              |
| 8   | Independent nested disclosure             | Bounded     | Extend real branching and accessibility coverage.                                                          |
| 9   | Synchronized overview and detail          | Bounded     | Validate complex interleaved tasks.                                                                        |
| 10  | VisualJS reference behaviors              | Partial     | Complete recorded-trace interaction comparison after initial visual review.                                |
| 11  | Live original-source editor               | Partial     | Verify full source-map and syntax-language coverage.                                                       |
| 12  | Automatic source following                | Bounded     | Test deep cross-file jumps and return behavior.                                                            |
| 13  | Real loop execution order                 | Bounded     | Verify wider runtime loop semantics.                                                                       |
| 14  | Playback and debugger controls            | Bounded     | Exercise more cross-language and async step semantics.                                                     |
| 15  | Reclaim viewport space                    | Partial     | Review rendered geometry and density.                                                                      |
| 16  | Progressive disclosure                    | Partial     | Accept full visual hierarchy in rendered UI.                                                               |
| 17  | Compact main workspace                    | Partial     | Refine toolbar and secondary controls.                                                                     |
| 18  | Side-by-side desktop workspace            | Bounded     | Broader visual and viewport review.                                                                        |
| 19  | Modern accessible visual style            | Partial     | Audit contrast, themes, and visual quality.                                                                |
| 20  | Meaningful animation                      | Partial     | Inspect animation timing and transitions visually.                                                         |
| 21  | No flicker or layout jumps                | Partial     | Profile browser paint and complex traces.                                                                  |
| 22  | Instant prepared-data disclosure          | Bounded     | Verify real large branching trees.                                                                         |
| 23  | Contextual variable inspection            | Bounded     | Deep-object screen-reader and rendering acceptance.                                                        |
| 24  | User-controlled navigation                | Bounded     | Exercise broader synchronized keyboard paths.                                                              |
| 25  | Keyboard and screen-reader access         | Partial     | Final nested-page focus and manual-step live updates now tested; full assistive-technology review remains. |
| 26  | Responsive workspace                      | Partial     | Mobile nested disclosure and accessibility acceptance.                                                     |
| 27  | Large trace performance                   | Partial     | Extend recorded paint/heap profiling to larger, deeper real applications.                                  |
| 28  | No repeated AI processing                 | Bounded     | Cover additional prepared continuation/scenario paths.                                                     |
| 29  | Supported language compatibility          | Partial     | Verify full language inventory and observed-vs-static behavior.                                            |
| 30  | Single replay state                       | Bounded     | Verify multi-task and cross-language history.                                                              |
| 31  | Original source separate from annotations | Bounded     | Preserve separation during further source work.                                                            |
| 32  | Inspect existing architecture first       | Verified    | Preserve existing implementation contracts.                                                                |
| 33  | Implement in logical stages               | In progress | Complete remaining acceptance stages.                                                                      |
| 34  | Preserve working functionality            | Bounded     | Recheck gates and regression scenarios on final build.                                                     |
| 35  | Functional acceptance scenarios           | Partial     | Test representative languages and real large runs.                                                         |
| 36  | UI/UX acceptance                          | Partial     | Complete rendered, contrast, and screen-reader review.                                                     |
| 37  | Complete integrated delivery              | In progress | Close all gaps and verify final deliverables.                                                              |

**Next implementation target:** inspect the rendered source/flow experience
against the VisualJS interaction reference (items 10, 15–21, and 36), then
extend the initial real recorded trace paint/heap measurements to deeper,
larger applications (item 27).
The current keyboard work is bounded evidence for item 25 and does not establish
screen-reader acceptance across browsers and assistive technologies.

The October 12 Steps-panel update passed 129 core tests with one optional
CodeGraph integration skip, 41 Playwright browser tests, the production build,
TypeScript typecheck, formatting, and packed-package verification. The new
browser regression covers persisted desktop/tablet timeline disclosure,
inspector coexistence, playback continuity, and mobile Steps navigation.
This confirms the tested UI improvement without closing the remaining
visual, accessibility, language, or real-project performance requirements.

### Verification of the legacy first-load overview correction

After the structural-overview change, the full verification on 2026-10-12
reported 129 passing core tests, one optional CodeGraph integration skip, a
successful TypeScript typecheck and production build, and 39 passing Playwright
browser tests. The package check passed for the installed CLI, MCP handshake,
player assets, and flow API. Prettier and `git diff --check` passed after
formatting this audit. These results confirm the tested behavior; they do not
close the outstanding runtime-language, manual accessibility, visual, or
realistic paint/heap performance acceptance requirements.

## Requirement checklist

1. **Remove the 30-step limit — implemented, bounded verification.**
   `src/analysis/native-codegraph.ts` defaults to unlimited call depth and reports
   event/provider boundaries. `tests/native-codegraph.test.ts` covers more than
   30 calls; `tests/recording.test.ts` covers recursion, linked chunks, timeout,
   cancellation, and infinite execution. A real multi-file Python browser trace
   now verifies 47 nested recorded calls (46 recursive edges), accurate parent
   invocation identity, and return values from the root and leaf. Runtime
   recursion still obeys Python's
   runtime limit. These tests do not prove arbitrary unbounded execution.
2. **Focus on user code — implemented for tested Python and JavaScript scope.**
   Recorded fixtures cross user files; the JavaScript V8 Inspector adapter
   excludes Node runtime and dependency frames. `tests/recording.test.ts`
   verifies user-file entries, including user callbacks called twice through
   Node's native EventEmitter without exposing Node internals. Broad framework
   callback coverage, generated
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
   continued observation of real user-method entries. The high-level execution
   path now identifies these events as process output with unresolved source
   attribution, verified in the overview and recorded browser playback tests.
   Prepared terminal display now strips only complete, recognized ANSI CSI/OSC
   formatting sequences across stdout/stderr events, retaining independent
   stream ordering and original event output. An incomplete or unsupported
   sequence stays at its original event rather than disappearing. The overview
   and console use the same prepared display text; paging, backward seeks, and
   loaded continuation sessions recompute it from the saved events. Focused
   tests cover split controls (including OSC ESC-backslash), interleaved
   streams, raw-output preservation, a 300-event history boundary, and a
   stored-session split. Cross-stream causality remains unresolved.
   The JavaScript recorder now preinstalls Inspector breakpoints from parsed
   local JavaScript function bodies. Concurrent `Promise.all` siblings that V8
   previously stepped past after an `await` are observed as method entries.
   Tests cover function declarations, function expressions, async arrows,
   object methods, and async class methods. An additional one-line sibling
   regression verifies that distinct invocations are not duplicated when
   `await` resumes later on the same source line; same-line recognition
   requires column progress and the recorded async context. The existing
   nested concurrent-call regression also passes after that refinement.
   A focused runtime regression exposed a false suspension: a synchronous
   function returning the string `"await"` emitted an `await` event and lost
   its observed return. The recorder now identifies syntactic `await`
   expressions through Acorn instead of searching source text, and retains
   `for await...of` loop headers. The regressions pass for string literals,
   comments, property identifiers, template/regex literals, and a real async
   generator consumed by `for await...of`. Actual loop values and V8's
   fulfilled Promise return snapshot are checked without synthesizing a
   scalar return.
   The recorder also now prioritizes a V8-reported return over a syntactic
   await candidate when a frame exits, preventing an observed return from
   being replaced with an inferred suspension. The `return await` regression
   passes. The exact suspension boundary remains heuristic when V8 does not
   expose a return value.
   A second reproduced defect involved two functions defined on one physical
   line: throwing in the synchronous function incorrectly emitted `await`
   because its async sibling contained a real `await` expression. Await sites
   are now associated with their nearest lexical function and checked against
   the paused generated location. The focused same-line throwing regression
   passes alongside related await and async-entry tests.
   Another runtime regression exposed two distinct calls to a user callback
   on the same source line appearing as one invocation after an `await` in
   CommonJS. The parser now retries script grammar when strict module grammar
   rejects valid CommonJS code, retaining function-entry breakpoints. When V8
   reports a callback return and then hits the function-entry breakpoint,
   recording closes the earlier invocation and starts a new one. A fixture
   verifies three calls, including repeated identical arguments, distinct
   call IDs, observed returns, and complete process output. A separate fixture
   confirms repeated native EventEmitter calls. Other frame transitions where
   V8 reports neither return nor reliable entry evidence remain unresolved.
   V8 pause locations and stack frames remain the sole evidence for
   an `observed` entry; a parsed function definition alone creates no trace
   event. Unsupported syntax may still prevent this breakpoint preparation.
   A separate startup race could misclassify the Inspector's delayed help URL
   as application stderr. The recorder now consumes the first exact Inspector
   help notice even if pipe delivery occurs after debugger attachment, while
   preserving subsequent application messages that use those same URLs.
   Exact source causality,
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
   Legacy agent-authored sessions with structural handoffs but no runtime events
   now show their prepared transition path from cursor zero. These rows are
   labeled `unverified` and the heading explicitly states there are no runtime
   observations. Previously the player switched those sessions to Focus at
   initialization and displayed an empty execution overview. A desktop/mobile
   browser regression checks all prepared handoffs, seeking, restart, preserved
   evidence labels, and no subsequent network requests for those interactions.
   Broader flow quality and visual comparison with VisualJS remain open.
7. **Expandable methods — implemented, bounded verification.**
   Timeline invocation disclosure and clickable diagram method buttons share
   one nested recorded-event inspector. Browser tests cover source lines,
   annotation separation, and event selection; a 45-level simulated recursion
   verifies that deeply nested user calls remain inspectable. An additional
   recorded 47-invocation Python recursion expands every nested method in the
   diagram inspector and verifies accurate leaf/root returns. Broader visual
   review and deeper cross-language recordings remain open.
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
10. **VisualJS interaction reference — partial.**
    The actual VisualJS page and the Code Anime desktop/mobile player were
    inspected visually (1440x900 desktop and 390x844 mobile). This identified
    an empty first-load overview for a legacy session with four structural
    handoffs, corrected under item 6 above. A complete hands-on comparison of
    source-line stepping, call/return visualization, variables, and playback
    using representative _recorded_ programs remains unverified. Existing
    layout regressions alone do not establish interaction fidelity.
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
    The overview now uses more of the available height on tall desktop screens,
    paging up to 24 prepared transitions; smaller windows retain six rows.
    A browser regression is added for viewport-dependent density and paging.
    The session title, evidence badge, and trace counts now share the application
    header, eliminating the separate session information row. A browser geometry
    regression checks that the header contains the session label, tablet timeline
    scrolls internally without extending below playback, and source and flow each
    receive usable height at 820x1180. Mobile retains a visible evidence label.
    Desktop and tablet users can now collapse the step timeline from the compact
    header, recover its width for source and flow, and restore it without changing
    the selected event. The choice persists across reloads and leaves the mobile
    Steps tab accessible; a browser regression checks the panel geometry,
    inspector coexistence, replay continuity, and no additional flow retrieval.
    Rendered visual acceptance, performance verification, and broader viewport
    allocation review remain open.
16. **Content-first progressive disclosure — partial.**
    Inspector, console, and method details are disclosed on demand. The desktop
    source/flow arrangement is implemented. Default overview clarity and visual
    acceptance remain open; DOM geometry alone cannot prove them.
17. **Compact application structure — partial.**
    Resizable timeline, source, inspector, and console exist. Playback is in a
    bottom dock, with separate header regions. Resizable source/flow panes are
    implemented. The compact header now offers an accessible, persistent Steps
    toggle for desktop and tablet; toolbar density and secondary-control
    organization still need review.
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
    regression verifies unchanged packets on non-navigation updates. Flow
    connections now preserve their SVG/path DOM for inspection updates and
    consecutive steps with the same route; geometry updates in place on resize,
    and route or view changes invalidate them. Real-browser regressions verify
    these cases. Broader timing and visual quality remain unverified.
21. **No flicker/layout jumps — partial.**
    Source-window reuse, cached lexical state and cached timeline filtering
    reduce DOM work; source-window browser regressions protect source node
    identity during adjacent steps. Source and inspector call-stack controls
    now retain DOM identity and keyboard focus while invocation IDs remain
    unchanged. Their caches invalidate on stack changes, trace-variant switches,
    prepared-continuation rebuilds and cursor reset. A browser regression checks
    adjacent-step reuse, same-depth sibling replacement, stack contraction,
    and reset. Source following now scrolls only the editor when the active line
    leaves its viewport; a browser regression checks that adjacent lines do not
    scroll and page scroll remains stable. The inspector now retains its value
    and object trees and immutable replay snapshot during layout-only changes;
    changing the inspected call frame refreshes only the local tree. Trace
    continuation, scenario changes and cursor movement invalidate those caches.
    A real-browser regression verifies retained expansion, 120 paged fields,
    focus and DOM identity, and necessary replacement on a new frame or step.
    Flow connections now reuse their SVG/path elements across inspector-only
    updates, resize and consecutive same-route events. They update geometry
    when panel dimensions change and invalidate after route changes, path mode,
    trace rebuilds, or cursor reset. Browser regressions verify DOM identity,
    geometry update, and invalidation. Broader paint profiling remains open.
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
    requests during navigation. A browser test now verifies a 135-field object,
    60-field paging, retained focus and disclosure during resize, and correct
    updates when changing inspected frame and step. Broader real-browser
    accessibility and rendering for deeply nested objects remain unverified.
24. **User navigation control — implemented, bounded verification.**
    Timeline rows, stack buttons, follow toggle, and source breakpoints provide
    navigation. The recorded nested browser scenario verifies diagram selection,
    source-location navigation, and playback cursor synchronization. Output
    history now offers Older/Newer navigation through bounded 300-event pages,
    clearly displaying the visible range and the total output-event count.
    Player and mobile browser tests verify all 655 prepared output events are
    reachable while retaining the execution cursor and making no new requests.
25. **Keyboard/accessibility — partial.**
    Keyboard shortcuts, native disclosure buttons, focus styles, and reduced
    motion exist. Overview-page navigation now restores keyboard focus to an
    enabled paging control after replacing the visible page. A browser regression
    for keyboard paging has been added; broad screen-reader behavior remains open. Browser tests cover disclosure focus, invocation-selector
    focus preservation, pagination focus, mobile controls, and keyboard resizing.
    A focused browser regression checks source-line `aria-current` and
    stateful breakpoint names/pressed state after keyboard activation and seeks.
    Keyboard-shortcut help now exposes `aria-controls` and tracks its expanded
    state; Escape and its close control restore focus to the opener. The compact
    mobile evidence badge retains its full text in a tooltip. A browser
    regression verifies these semantics. Screen-reader behavior and all focus
    paths remain unverified.
    The nested-method final-page regression reproduces focus loss when the
    last prepared item is a `details` element; paging now focuses its actual
    keyboard-accessible `summary`. Another browser regression checks that
    manual step navigation announces the source location and evidence level in
    a dedicated polite live region. Repeated layout/status renders leave that
    announcement unchanged and avoid rewriting an identical status message;
    autoplay does not narrate every frame. These are DOM/keyboard assertions,
    not a complete assistive-technology acceptance test.
26. **Responsive workspace — partial.**
    Browser tests cover 1440x900, 820x1180, and 390x844, panel switching, playback
    visibility, and page overflow. Desktop side-by-side flow and a dedicated
    mobile Flow view pass geometry and replay checks. Mobile console-history
    paging and scrollable output now pass browser checks with 655 events.
    Mobile diagram method
    disclosure and broader visual accessibility still need verification.
27. **Large-codebase performance — partial.**
    Cached source lines, event indices, bounded timeline rows, and continuation
    exist. Console output now renders at most 300 events per page, exposes
    earlier output via explicit history controls, and resets the visible page
    to the cursor's latest output on subsequent playback navigation. The
    655-event player and browser regressions verify full historical access,
    output ordering, and no reanalysis requests. The 20,000-event synthetic
    browser test verifies seek/filter/disclosure
    and source reuse. Its synchronous handler timings exclude paint and network.
    A separate 45-level simulated recursion verifies nested visibility after
    collapse/reopen; proportional indentation avoids collapsing its usable width.
    The persisted 300-child/1,502-event browser fixture measures seek performance
    and checks paged expansion without restarting analysis. A separate browser
    fixture persists and loads five linked sessions with 1,500 invocations and
    7,503 events, verifying final-method inspection, reverse seeks, console
    restoration, and exactly one retrieval per prepared session. These synthetic
    tests exclude browser paint, broad real-project behavior, and heap profiling.
    An additional **actual recorded** Python program exercises two user source
    files, loops, 47-level recursion, 529 observed method entries, console
    output, and 4,308 trace events stored across multiple prepared sessions.
    The regression verifies each recursive parent link, the deepest stack, exact
    root and leaf returns, source following, and independent nested collapse and
    re-expansion without moving the playback cursor. It loads
    all sessions and measures 24 seeks across two animation-frame boundaries, plus
    Chromium DevTools heap and layout counters. One local sample after adding
    recursion reported a two-frame seek p95 of 85.6 ms, JavaScript heap 13 to
    7 MiB, and 76 additional layout operations. Historical replay remained correct, the DOM
    stayed bounded, and seeking sent no new flow requests. This is one local
    performance sample; the full 40-test browser suite passed after adding the
    original benchmark, prior to the recursion extension. It does not establish
    performance for arbitrary projects or directly measure per-frame paint time.
    Continue measuring longer stacks, large objects, substantially
    larger recorded output, and diverse real applications before accepting this.
    Value-tree DOM creation is now bounded to visible pages and explicitly
    expanded branches; the large-value regression verifies lazy construction,
    filtering, and replay state. Broader paint, heap, and real-project profiling
    is still required.
28. **No repeated AI processing — implemented by architecture, broader controls tested.**
    Player HTTP requests retrieve stored flows. Backend analysis is separate.
    A desktop browser regression observes network requests while navigating,
    stepping, playing, changing speed, filtering, inspecting variables,
    expanding panels, toggling bookmarks/breakpoints, switching visualizations,
    and using shortcuts. All operate on the prepared fixture without another
    request. Further coverage is required for continuation retrieval and
    alternative saved scenarios; those are permitted prepared-data requests.
29. **Existing language compatibility — partial.**
    Shared frontend and CodeGraph-backed simulation remain language-independent.
    Observed recording is implemented for Python and experimentally for
    Node.js JavaScript through V8 Inspector. JavaScript coverage includes
    verified recursive calls, ES modules, CommonJS script-only syntax, timer callbacks,
    caught/uncaught throws,
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

- 2026-10-12 nested disclosure and screen-reader navigation refinement:
  A 58-child, multi-page execution fixture reproduced and fixed lost keyboard
  focus on a terminal nested branch. Another focused regression verifies
  announced manual step/source/evidence transitions and unchanged live status
  across layout-only rendering. Both regressions passed. Full `npm run check`
  passed typecheck, 129 core tests (one optional live CodeGraph test skipped),
  build, and Prettier. All **38 browser tests** passed. `npm run package:check`
  passed the packaged npm CLI, MCP handshake, player assets, and Flow API.
  `git diff --check` passed. Other screen-reader configurations, rendered
  UI/VisualJS acceptance, language coverage, and paint/heap profiling remain
  incomplete.

- 2026-10-12 CommonJS parsing and callback identity refinement: the previously
  failing `with`-statement CommonJS fixture now retains breakpoint metadata
  and records three independently observed callbacks following an `await`,
  including two with identical arguments. Node EventEmitter callback coverage
  and unreachable same-line `await` were also added. The focused seven-case
  selection passed alongside loop and throwing-`finally` regressions. Full
  After formatting, full `npm run check` passed: typecheck, 129 core tests
  (one optional live CodeGraph test skipped), build, and Prettier. All 36
  Playwright browser tests and
  the packaged npm CLI/MCP/player/flow API verification passed. This is
  evidence for the named JavaScript cases; broader callback and language
  coverage and the remaining acceptance requirements are still unverified.

- 2026-10-12 same-line await scope refinement: a new real JavaScript
  recording fixture reproduced a false `await` on a throwing synchronous
  method sharing one source line with an async method. Matching await sites
  to the nearest Acorn function range removed the false event. The focused
  seven-case await/async regression selection passes, including real
  `for await...of`, `return await`, and concurrent invocation identity. After
  formatting, full `npm run check` passed: 126 core tests passed, one optional
  live CodeGraph integration skipped, and typecheck, build and formatting
  passed. All 36 Playwright browser tests and packed CLI/MCP/player/flow API
  verification passed. Unverified async cases and the other acceptance gaps
  remain open.

- 2026-10-12 JavaScript await-syntax refinement: the focused five-case suite
  passed for misleading `await` text, real `for await...of` iterations,
  `return await` completion, concurrent invocation identity, and repeated
  awaited loops. Full `npm run check` passed: 125 core tests passed, one
  optional live CodeGraph integration test skipped, and typecheck, build and
  formatting passed. All 36 Playwright browser tests passed. Packed npm CLI,
  MCP handshake, player assets and flow API verification passed. These checks
  establish the listed tested cases, not general async completeness or full
  37-item acceptance.

- 2026-10-12 JavaScript async-entry verification: the previously failing
  concurrent process-output test now passes with real `first` and `second`
  method-entry events. New fixtures also cover async function-expression,
  arrow, object, and class-method entries, including multiple sibling
  functions on one line. The full `npm run check` gate passes: 122 core
  tests passed, one optional live CodeGraph integration test was skipped,
  and typecheck, build, and formatting passed. All 30 browser tests and
  packed CLI/package verification also passed. These results verify the
  tested behaviors, not the complete 37-requirement acceptance scope.

- Earlier checkpoint: `npm run check` typecheck, 115 core tests (114 passed,
  one optional live CodeGraph integration test skipped), build, and Prettier
  passed. Current results are above.
- `npm run test:browser`: 30 passed, including bounded console-history paging,
  preserved mobile output scrolling, paired-call, recorded
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
  An additional stderr regression writes both documented Node.js Inspector
  help URLs from application code. The recorder filters one exact Inspector
  startup help notice, retaining later application-written lines. This
  addresses a Node.js v26.8.1 failure that appended an Inspector notice to
  recorded output. Rare startup notice ordering remains under investigation.
  A concurrent stdout/stderr regression now checks per-stream text preservation
  with unterminated writes while keeping source and invocation attribution
  unresolved. The recording service rejects a failed startup whose only events
  are process diagnostics; the existing syntax-error regression verifies that
  the failure still surfaces the original Node.js diagnostic.
  Two Inspector WebSocket connection failures appeared when the full core,
  browser, and package suites ran concurrently; both affected tests passed in
  isolation. Initial Inspector attachment now allows four bounded handshake
  attempts to tolerate transient refusal under startup load. This needs broader
  stress validation; debugger-command replay remains prohibited.
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
  Dedicated terminal regressions check ANSI SGR and OSC stripping across
  separate event writes and retained raw trace strings, including incomplete
  control sequences and output straddling a history-page boundary. A browser
  fixture asserts that paging displays the decoded text without escape
  fragments; comprehensive terminal emulation is outside the current scope.
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

### Compact header and tablet viewport follow-up

The session heading and evidence label were consolidated into the existing top
bar, removing a secondary information row and restoring vertical workspace
space. The separate decorative studio title and descriptive text were removed;
existing event counts and export access remain available. On tablets, source
and flow split available height more evenly. The execution timeline now has a
bounded height and an independently scrolling event list, so long traces do not
extend the page below the playback dock. Mobile retains its evidence badge in
the compact header. Browser coverage measures panel geometry, scrolling, and
header containment at 820x1180 and 390x844; the existing layout, focus, and
navigation regressions cover the other supported viewports. A broader visual
and accessibility review is still required.

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
