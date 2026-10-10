# Execution visualizer acceptance audit

Checkpoint: 2026-10-10, implementation baseline `2178cb8`.

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
   The browser disclosure test verifies no requests during that interaction;
   broader interaction coverage is still needed for a complete acceptance claim.
5. **Shared execution model — implemented, bounded verification.**
   `src/domain/trace.ts` carries invocation, stack, source, values, output, and
   evidence data. Async task identity is carried in event values. Array order
   supplies sequence; immutable snapshots support backward navigation.
   `tests/replay.test.mjs` and player tests verify historical state restoration.
6. **High-level default view — partial.**
   `filterList()` hides internal statement details until disclosure. The animated
   diagram itself is hidden by default. Verify that the initial view communicates
   caller, arguments, return transfer, and output in the requested example.
7. **Expandable methods — partial.**
   Invocation disclosure is implemented in timeline rows, with values in the
   inspector and packet. Browser tests cover disclosure, but clickable diagram
   entities do not yet provide the full requested nested method presentation.
8. **Independent nested expansion — implemented, incomplete acceptance.**
   `expandedCalls` preserves invocation-specific state and does not move the
   cursor. Existing disclosure coverage is narrower than a full A/B/C nested
   scenario with independently retained expansion and active playback.
9. **Synchronize detail levels — implemented, bounded verification.**
   Disclosure and inspector derive from the same cursor. Browser tests verify
   position preservation. Full nested expansion during running playback remains
   unverified.
10. **VisualJS interaction reference — unverified.**
    A direct visual/interaction comparison is still required. Existing layout
    tests do not establish fidelity to the requested source execution experience.
11. **Live source editor — partial.**
    `renderSource()` displays captured source, line numbers, active arrow,
    breakpoint controls, and source-follow navigation. Python lexical coloring
    now distinguishes floor division and comments. Multiline lexical context,
    broader language syntax, and source-map scenarios remain incomplete or
    unverified. Preserve exact source text when addressing these gaps.
12. **Follow method execution — implemented, bounded verification.**
    Player and recording browser tests cover source transitions, returning caller
    state, and disabling follow. Source windows retain DOM nodes on adjacent
    steps. Deep cross-file source-follow acceptance needs explicit coverage.
13. **Animate loops — implemented for tested recordings.**
    `tests/recording.test.ts` checks repeated line visits and loop values;
    browser replay checks reversible source/console state. Add the exact
    five-iteration sum example to connect iteration values, highlighting, and
    final output in one acceptance scenario.
14. **Playback/debugger controls — implemented, bounded verification.**
    Player tests cover reverse, seek, step-over/out, breakpoints, continuation,
    and async invocation semantics. Browser tests cover playback controls.
    Reverse restores snapshots without running the program again.
15. **Reduce wasted viewport — partial.**
    CSS makes headers smaller, inspector collapsible, and console compact.
    The diagram is optional and the visible diagram layout remains vertical.
    Measure primary-content allocation after completing the desktop layout.
16. **Content-first progressive disclosure — partial.**
    Inspector, console, and method details are disclosed on demand. The default
    visualization and source layout needs the corrections in items 6 and 18;
    visual clarity remains an acceptance task, not proven by DOM assertions.
17. **Compact application structure — partial.**
    Resizable timeline, source, inspector, and console exist. Playback is in a
    bottom dock, with separate header regions. The requested compact primary
    toolbar and resizable source/flow arrangement need review and implementation.
18. **Default side-by-side layout — contradicted by current CSS.**
    `.center-column:not(.show-flow) > .flow-panel` hides the diagram initially;
    `.center-column.show-flow` uses stacked rows. Source focus and preferences
    exist, but flow maximization and default side-by-side primary panels are
    missing. Existing tests preserve the current layout rather than this goal.
19. **Visual style — partially inspected, not accepted.**
    Existing typography and restrained colors are retained. Contrast, active
    line readability, and compactness require rendered inspection. There is no
    evidence here establishing a second supported theme.
20. **Meaningful animation — partial.**
    `render()` animates value packets and honors reduced motion. It recreates
    packets on every render, including unrelated state updates. Inspect and
    prevent animation restart when the execution position has not changed.
21. **No flicker/layout jumps — partial.**
    Source-window reuse and cached timeline filtering reduce DOM work; the
    large-trace browser regression protects source node identity. Inspector,
    packet, and connection updates still need scrutiny for unnecessary rebuilds.
22. **Immediate disclosure — implemented, incomplete scale evidence.**
    Disclosure uses prepared data; tests verify no request and cursor retention.
    The 20,000-event fixture has only one invocation, so it does not establish
    deep-tree disclosure responsiveness.
23. **Contextual variable inspection — implemented, bounded verification.**
    Collapsible inspector shows locals, arguments, object changes, and returns.
    Player tests check historical values and per-invocation async differences.
    Large/deep object inspection usability remains unverified.
24. **User navigation control — implemented, bounded verification.**
    Timeline rows, stack buttons, follow toggle, and source breakpoints provide
    navigation. Test diagram method inspection and source-location navigation
    explicitly against the requested behavior.
25. **Keyboard/accessibility — partial.**
    Keyboard shortcuts, native disclosure buttons, focus styles, and reduced
    motion exist. Browser tests cover disclosure focus, mobile keyboard controls,
    and keyboard resizing. Screen-reader behavior, all focus paths, and reduced
    motion during all interaction types remain unverified.
26. **Responsive workspace — partial.**
    Browser tests cover 1440x900, 820x1180, and 390x844, panel switching, playback
    visibility, and page overflow. Large-screen side-by-side animation remains
    missing as described in item 18. Mobile Execution currently shows the trace
    list while the diagram is hidden; verify the requested flow experience.
27. **Large-codebase performance — partial.**
    Cached source lines, event indices, bounded timeline rows, and continuation
    exist. The 20,000-event synthetic browser test verifies seek/filter/disclosure
    and source reuse. Its synchronous handler timings exclude paint and network.
    Measure memory, many methods, long stacks, large objects, large output,
    multiple files, and real stored continuation chains before accepting this.
28. **No repeated AI processing — implemented by architecture.**
    Player HTTP requests retrieve stored flows. Backend analysis is separate.
    Extend request assertions to all ordinary controls for behavioral acceptance.
29. **Existing language compatibility — partial.**
    Shared frontend and CodeGraph-backed simulation remain language-independent.
    Observed recording is Python-only; Kotlin structural integration was tested
    previously. Do not equate structural coverage with verified runtime semantics.
    Establish the supported-language inventory and representative evidence.
30. **Single execution state — implemented, bounded verification.**
    `replayState()` and the cursor drive stack, locals, source, console, and flow.
    Continuation tests check exact historical state and scenario isolation.
    Complete the nested animation acceptance scenario to cover all views together.
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
    Existing suites passed before the most recent lexical-only change; 26 player
    tests, the lexical browser regression, and typecheck passed after it.
    Rerun affected gates after further implementation changes.
35. **Ten functional acceptance scenarios — incomplete as a set.**
    Existing tests cover portions of each scenario, including deep recursion and
    safe unbounded execution. Missing full-scope evidence includes nested
    disclosure during playback, large real continuation performance, and the
    representative supported-language matrix. Do not infer acceptance from counts.
36. **UI acceptance — incomplete.**
    Responsive and source-state assertions pass, but default source/animation
    layout, stable animations, rendered visual review, and comprehensive keyboard
    validation are still required.
37. **Integrated implementation and final delivery — in progress.**
    Changes are integrated and pushed on `codex/execution-visualizer-improvements`.
    Completion requires closing the gaps above and rerunning applicable gates.

## Checkpoint verification

- `npm run check`: 66 passed, 1 optional real-CodeGraph test skipped; typecheck,
  build, and formatting passed at `fd3ba34` before the Python coloring change.
- `npm run test:browser`: 10 passed at that same performance checkpoint.
- `npm run package:check`: installed CLI, MCP handshake, player assets, and flow
  API passed at that checkpoint.
- At `2178cb8`: Python lexical browser regression passed, 26 player/continuation
  tests passed, typecheck and diff whitespace checks passed.

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

1. Correct default desktop source/flow layout, preserve compact mobile switching,
   add panel controls/preferences and acceptance assertions for actual geometry.
2. Prevent non-navigation updates from restarting packet animations; verify
   nested disclosure and state synchronization during playback.
3. Complete multiline source coloring while preserving original text and source
   window performance, then verify the source execution reference visually.
4. Exercise real stored large traces, deep trees and language scenarios; close
   remaining correctness and accessibility gaps with focused tests.
5. Revisit every item here with final evidence and run full delivery gates.
