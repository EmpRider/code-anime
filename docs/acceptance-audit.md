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

## Source gutter breakpoint consistency (October 13)

An event-specific breakpoint could make its source-line gutter appear pressed
and label it "Remove breakpoint", but activating that gutter added a separate
line breakpoint instead of clearing the existing event breakpoint. The control
therefore remained pressed. A focused browser regression reproduced this
failure before the correction. Source gutter controls now represent all event
breakpoints sharing the original file and line, including repeated loop
iterations. Activating a marked gutter clears those event breakpoints and any
line breakpoint at the location; activating an unmarked gutter sets a line
breakpoint. Both browser regressions and TypeScript typecheck passed locally.

This is bounded evidence for debugger controls and source accessibility in
requirements 11, 14, 24 and 25. Runtime breakpoint behavior, wider browser
and assistive-technology acceptance, and the remaining acceptance gaps remain
open.

## Ubuntu Inspector throughput regression (October 13)

GitHub Actions run `38408303893`, commit `8383fcb`, passed the Chromium browser
job and both Windows Node 22/24 jobs but failed Ubuntu Node 22/24. The same two
real JavaScript recorder tests exceeded their unchanged 60-second execution
budgets: the cross-module 2.2 MiB original-source recording and the failed
continuation-save rollback scenario. The resulting traces correctly retained
observed events and declared incomplete coverage; the rollback scenario never
reached its intended storage-failure path.

Opt-in Linux recorder timings show approximately 120–122 pauses per 10 seconds.
`Runtime.getProperties` accounts for roughly 5–7 seconds of summed request
latency per 10-second interval, with individual requests reaching 41–42 ms.
The prior optimization to omit unneeded async-context lookups did not resolve
this slowdown. It is incorrect to infer Linux performance from Windows passes
or from the browser playback suite.

The current follow-up reuses a lexical-scope property request when two or more
stack frames expose the same Inspector object ID during **one** debugger pause.
Each subsequent pause re-reads the scopes, preserving child mutations and
runtime-observed values. A new observed-recording regression checks caller
state after three separate child mutations. Local verification passed 148 core
tests with one optional live CodeGraph skip, 44 Chromium browser tests,
typecheck, build, and formatting. The change was committed as `012f3e4` and
GitHub Actions run `38412016937` confirmed it did not fix the Linux loop
throughput regression: both Ubuntu jobs still recorded about 120–122 pauses
per 10 seconds and timed out in the same two tests. Windows 22/24 and Chromium
passed. The scope cache remains useful for shared stack scopes but cannot solve
single-frame Inspector latency.

A Linux-only ACK workaround introduced in `c616008` sends bounded, read-only
`Runtime.getIsolateId` requests while debugger commands or recent source steps
await a response. Unlike an earlier unsupported WebSocket ping, this method
works with Node Inspector and requires no application evaluation. GitHub Actions
runs `38413220790` and `38413228793` passed all five jobs (Ubuntu and Windows
Node 22/24 plus Chromium). The formerly failing Linux large-source JavaScript
test completed in approximately 53 seconds on both Ubuntu versions, while the
continuation rollback test completed in approximately 44 seconds. Both retained
their original 60-second execution budgets and full assertions. The 2 ms
interval in `c4e7647` improved the margin further: GitHub Actions run
`38414083429` passed all five jobs, with the same large-source JavaScript test
finishing in 32.2 seconds (Ubuntu Node 22) and 32.1 seconds (Node 24), and the
rollback test in 20.7 and 20.0 seconds respectively. These results verify the
regression fix on the two Linux CI versions without increasing any budgets or
losing observed data. Broader source, runtime and UI scalability remain
unverified, so requirements 27 and 35 remain incomplete.

## Source display before playback (October 13)

The player now shows a captured original source file at cursor zero, preferring
the first recorded source location, then the captured target or another captured
file. Its line-numbered, bounded editor window is populated without presenting
any statement as currently executing or attaching a fabricated stack frame.
Rewinding to zero restores the initial source view and clears execution-line
highlighting. Traces without captured original source retain their existing
empty-state explanation. The recorded large-Python browser regression exercises
first load, cross-file navigation and rewind without replay requests.

This improves requirements 11, 15 and 31 for captured source; it does not
establish broad syntax coverage, source-map correctness, screen-reader behavior,
or complete VisualJS-style interaction acceptance.

## Large original-source recording (October 13)

GitHub Actions run `38364317171` passed Chromium, Windows Node 22/24 and Ubuntu
Node 22/24 for PR #6 at `0fd7803`. The current work extends that checkpoint;
CI for these additional changes remains to be verified.

Previously, the Python and JavaScript runtime recorders refused any executed
source file larger than 512 KiB, and all recording sources shared a 2 MiB
snapshot limit. The recording service independently enforced the same 2 MiB
aggregate limit. The limits are now 2 MiB per original file and 4 MiB total,
with the existing 10 MiB per-session quota and 64 MiB maximum protocol budget
unchanged. Excess sources still produce explicit recording diagnostics.

`tests/large-source-recording.test.ts` exercises real Python and JavaScript
recordings across three original source modules (over 2.2 MiB together),
executed cross-module calls, 550 loop iterations, original exact source
snapshots in each stored continuation, observed evidence, and exact output.
`tests/browser/recorded-large-source.spec.ts` checks real Python source
following across those modules and prepared continuations, bounded 301-row
source rendering, active-line accuracy, console output, and no replay requests
after prepared data is loaded. Both core regressions failed before the source
limit changes; the focused tests then passed locally. Broad validation and
cross-platform CI remain separate requirements.

`tests/recording-boundaries.test.ts` adds six actual-recorder regressions across
Python and JavaScript: an entry source above the 2 MiB per-file limit fails
without a misleading session, 4 MiB aggregate overflow after observed work
retains a clearly incomplete recorded trace, and a failed second session write
rolls back previously saved continuation chunks. All six passed locally.
These exercise source-budget error paths and transactional cleanup, not an
unbounded source-capacity guarantee. Cross-platform CI for this change is
pending.

This expands evidence for requirement 27; it does not establish performance for
arbitrary applications. Large files remain bounded by per-file, aggregate and
session budgets. Content-addressed source snapshots are now stored once per
distinct source set on disk and hydrated when a session is read, with the
original source returned unchanged to clients. Persistent restart, shared
continuations, deletion cleanup and corrupted-snapshot quarantine have focused
regressions. Failed writes prune unreferenced snapshots, and live corruption
or externally missing sessions schedule cleanup while retaining snapshots used
by other continuations. On October 13 the focused storage suite passed (12
tests), the full local core suite passed (146 tests and one optional CodeGraph
skip), all 44 Chromium browser tests passed, and packaged CLI/MCP/player/flow
verification passed. The logical hydrated session size quota remains unchanged. Very
large or escaping-heavy source content can still hit storage
quotas. JavaScript source-map coverage for large transpiled projects, broader
runtime languages, larger applications, and manual UI accessibility remain
open.

## Console history keyboard continuity (October 13)

The 655-event mobile console-history fixture exposed a keyboard-focus gap:
reaching the oldest or newest page disabled the activated paging button, so
focus dropped to the document. The player now moves focus to the remaining
enabled paging action. When seeking back before the history controls are
needed, it transfers focus to the still-visible console disclosure summary.
Focus in unrelated controls is unaffected, and ordinary console navigation
continues to reuse prepared trace data.

The focused browser regression failed before the fix and passed afterward.
It verifies both paging boundaries, disappearing history navigation, playback
position and absence of additional flow requests. This extends bounded
keyboard evidence for requirements 24–26; manual screen-reader acceptance
and broader mobile device coverage remain open.
Full local verification passed: 134 core tests (one optional live CodeGraph
skip), 42 browser tests, TypeScript typecheck, build, Prettier, and packed
CLI/MCP/player/flow verification. Cross-platform CI remains to be checked
on the pushed change.

## Runtime shutdown during pending browser requests (October 13)

The older Chromium push run `38354004675` timed out after 120 seconds in the
five-continuation browser test, despite logging successful assertions after
approximately 1.5 seconds. This made HTTP runtime cleanup a plausible failure
site, but that CI log does not identify the exact open connection. Both later
runs at `3b323dc` (`38355619772` and `38355624676`) passed all five jobs.

A new integration regression reproduced a related shutdown defect locally:
an in-flight `/api/flow/:id` response prevented `runtime.close()` from
settling. The test failed before the fix (`pending` after 400 ms) and passed
after the fix (approximately 10 ms in the full core suite). Runtime shutdown
now stops accepting connections, closes remaining HTTP clients, waits for the
server close callback, and releases the session store even if HTTP shutdown
rejects. This change affects server shutdown only, not trace generation or
ordinary player requests.

Local verification after the fix: 134 core tests passed, one optional live
CodeGraph test skipped, 42 Chromium/Edge Playwright tests passed (including
the five-continuation scenario), TypeScript typecheck, production build,
Prettier, packed CLI/MCP/player/flow verification, and `git diff --check`
passed. CI on this new change and the original CI timeout's exact root cause
remain to be verified. Requirements 27 and 35 remain partial.

## Source/flow keyboard continuity (October 13)

GitHub Actions run `38354009065` for PR #3 at `70b684f` finished successfully
on Chromium, Windows Node 22/24, and Ubuntu Node 22/24. Both stacked PRs (#2
and #3) remain open and mergeable; the recorder fix has not been merged to its
base branch.

The rendered execution path previously dropped keyboard focus when Follow
switched its visible overview page after a seek. A browser regression reproduced
focus loss for both a selected transition and a method disclosure. The player
now retains the same control when it remains visible, otherwise moves to the
active transition (with a paging fallback), using `preventScroll`. A separate
regression reproduced a source breakpoint gutter losing focus when a followed
execution crossed from `B.ts` back into `A.ts`. Source replacement now preserves
the existing line's gutter when possible, or focuses the newly executing
line's gutter; when no enabled source gutter remains, focus moves to Follow.
All changes reuse prepared execution data and preserve the current cursor.

The focused tests failed on the original behavior and passed after the fixes.
Current local verification passed `npm run check` (133 core tests; one optional
CodeGraph test skipped), all 42 Chromium browser tests, `npm run package:check`
(packed CLI, MCP handshake, player assets, and flow API), and `git diff --check`.
This adds bounded keyboard evidence for requirements 10, 12, 24, and 25; it does
not close manual screen-reader review, wider visual acceptance, or performance
requirements for representative large applications.

## Node 22 async recorder stabilization (October 13)

PR #2, commit `1f64fc3`, corrects two independently observed
debugger-control gaps without changing production execution budgets or
fabricating runtime evidence. The for-await recorder previously resumed to a
breakpoint in the loop body but did not reliably reach the statement following
iterator completion; the parser now locates that following statement using
the Acorn parent/statement hierarchy and installs a separate continuation
breakpoint. In addition, `paused()` previously copied `active` into
`lastFrame` before calculating `active.awaiting`. The subsequent step
selector read `lastFrame.awaiting`, which was therefore stale, and could
`Debugger.stepInto` instead of `Debugger.resume` at a suspension point.
The snapshot's awaiting flag is now synchronized before selecting the command.

Captured Ubuntu Node 22 diagnostic timelines reproduced the missing final
continuations for both a pair of concurrent loop-await invocations and
recursive awaited calls. The event lists stopped before the final user
statements, while the service correctly reported timeout and incomplete
evidence. The focused for-await return regression passed on both Windows and
Ubuntu Node 22 after the correction; existing tests also cover the two prior
timeout fixtures. The failure diagnostics now expose compact partial event
timelines for future investigations.

**Cross-platform CI evidence:** GitHub Actions run `38350186614`
at commit `79f4519` completed successfully: Windows Node 22 and 24,
Ubuntu Node 22 and 24, and Chromium browser all passed. The Node matrix
includes `npm run check` and `npm run package:check`, covering core tests,
typecheck, build, formatting, and the packed CLI/MCP/player smoke test.
This establishes the tested CI regression gates and does not establish
full acceptance of the original 37 requirements. Broader runtime accuracy,
cross-language tracing, visual interaction, accessibility, and large real
application performance remain open under the requirement status matrix below.

## Call-stack keyboard focus follow-up (October 13)

The source and State inspector stack controls previously replaced focused
buttons whenever a call entered or returned. A browser regression reproduced
focus loss when a selected child invocation was replaced by a sibling. The
player now moves focus to the same invocation if it survives, otherwise to
the closest surviving caller, and finally to Play when the stack empties.
Buttons elsewhere retain their focus; replacement uses `preventScroll`.
Restarting playback also clears both stack panels without stray placeholder text.

The regression verifies source and State stack controls, both same-call and
returned-child transitions, and empty-stack/restart fallback without requesting
new analysis. Local `npm run check` passed (133 tests, one optional live-CodeGraph
skip), all 42 browser tests passed, `npm run package:check` passed the packed
CLI/MCP/player checks, and `git diff --check` passed. These are local Windows
results. Native screen-reader review, wider keyboard/device coverage, and the
remaining 37-requirement acceptance work are still open.

The stacked PR #3 integration at `520d51e` passed GitHub Actions run
`38353153801`: Chromium and Windows/Ubuntu Node 22/24 jobs all succeeded.
The later execution-list keyboard regression exposed focus loss when paginated
event rows or paging controls were replaced. Event list replacement now keeps
focus on the same visible event or page action, moves it to a nearby visible
event after a seek, and falls back to an enabled page action at boundaries.
A 20,000-event Playwright fixture confirms page navigation, a seek across
several pages, and the last-page fallback. This is bounded keyboard evidence;
manual screen-reader and additional device validation remain outstanding.

## Node Inspector shutdown investigation (October 13)

GitHub Actions run `38343526305` at commit `54ae7ba` passed browser and both
Windows Node 22/24 jobs. Ubuntu Node 22 timed out in 16 recording tests; Ubuntu
Node 24 timed out in the deep ES module recursion test. Both Ubuntu versions
stopped that recursion recording after 194 events, with explicit incomplete
recording diagnostics. This suggests a shared recorder stall, but the CI logs do
not identify the blocked Inspector request or prove the root cause.

Commit `4a0d6c4` permits a pending final Inspector step request to finish its
wait when Node signals debugger shutdown, while preserving errors during active
execution. It retains the existing process execution budget and incomplete-trace
semantics. The patch passed 43 focused recording tests, the full local check
(133 passed, one optional CodeGraph skip), 42 Chromium browser tests, npm package
verification and whitespace validation. These were Windows local results; the
next Ubuntu run was needed to evaluate the shutdown hypothesis.

GitHub Actions run `38344686096` for `4a0d6c4` again passed the browser and
Windows Node 22/24 jobs, but **failed both Ubuntu jobs**. The Ubuntu Node 24
deep-recursion trace again stopped at 194 events, and Ubuntu Node 22 still timed
out in 16 recorder tests. The shutdown-notice race alone does not fix the stall.
Local reproduction of the same 194-event boundary shows that it is the observed
final return from `main.mjs:<module>`, following all recursive returns and output.
The next candidate resets the stale active-user-frame marker upon entering a
blackboxed runtime frame and resumes to installed user-code entry breakpoints,
avoiding step-into requests through Node's idle/shutdown machinery. Callback,
async, cancellation and recursion tests remain green locally; Ubuntu behavior
is not yet established for this second candidate.

The second candidate passed the complete Windows local `npm run check` gate on
October 13 (133 passed, one optional CodeGraph integration skip, typecheck,
production build and Prettier). `npm run test:browser` passed all 42 Chromium
tests, including 45-level mobile disclosure and the 4,308-event recorded
performance fixture. `npm run package:check` verified the packed CLI, MCP
handshake, player assets and flow API. These results do not validate Ubuntu
Inspector shutdown behavior; GitHub Actions on Ubuntu Node 22/24 is the next
required evidence before accepting the recorder fix.

The 45-level prepared-recursion browser regression now also exercises a 390 px
mobile Flow workspace: it preserves the deepest visible invocation, collapses
and reopens an ancestor with the Enter key, retains keyboard focus and playback
position, and checks that the document has no horizontal overflow. The focused
browser test passed locally. This adds bounded mobile disclosure evidence for
requirements 8, 25 and 26; device and screen-reader acceptance is still open.

Running the opt-in real-CodeGraph test with the installed Windows `codegraph.cmd`
and default discovery enabled passed all 8 tests, including a newly indexed
temporary Kotlin fixture, expected refusal without an index, provider-only
replay, and refinement. This is bounded evidence for requirement 29 and does not
establish cross-language runtime recording or every supported language.

## CI and recorded deep-disclosure follow-up (October 13)

GitHub Actions run `38340435972` for `d480f2d` passed Windows Node 22 and
24, but failed on Ubuntu Node 22 (16 JavaScript recording tests), Ubuntu Node
24 (one recording test), and the Chromium browser job (the recorded 47-level
Python recursion test exceeded its 150-second total timeout). The recording
failures all reported explicit incomplete traces at their configured execution
budgets. Their Linux-only cause remains unverified; do not mark cross-platform
CI accepted based on local success.

The resumed branch fixes a delayed native `<details>` event that could undo a
newly expanded child before its parent rendered the next recursion level.
Method summary activation now updates the shared disclosure set synchronously,
while the native toggle handler continues to synchronize the rendered state.
The real recorded 4,308-event / 47-level Python browser scenario now exercises
all nested expansions by keyboard and passed locally, with two-frame seeking
p95 approximately 34 ms. All 42 Chromium browser tests passed locally, as did
133 core tests (one optional live-CodeGraph skip), formatting and packed-package
verification. The heavyweight sparse-array return snapshot test has a separate
60-second recording budget to avoid the 15-second default on constrained CI
runners; normal production recording budgets remain unchanged. The recorded
browser test has a separate 300-second overall watchdog and explicit nested
invocation steps for CI diagnostics. These are bounded regressions, not final
manual assistive-technology or Linux recorder acceptance.

## Recorder regression follow-up (local verification, October 12)

October 13 update: The Node 24 full suite passed with 133 tests and one
optional CodeGraph skip after increasing the Inspector connection retry window.
The Node 26 default-concurrency run intermittently failed three Inspector
WebSocket handshakes; serial execution passed all 133 active tests. Core test
files now run serially to avoid competing V8 Inspector startups in constrained
CI runners, and failed WebSocket handshakes retain the underlying error text
when available. The final Node 26 `npm run check` passed 133 tests with one
optional CodeGraph skip, typecheck, build, and formatting. The packed-package
MCP/CLI/player smoke test passed. Playwright passed all 42 browser tests,
including a 4,308-event recorded performance fixture and a 20,000-event
prepared trace. Node 22 and GitHub Actions still require fresh verification.
The CI failure at `eee6421` predates all of these local changes; it does not
prove the amended worktree is green on Ubuntu or Node 22.

The JavaScript V8 recorder now tolerates an already-installed post-await
breakpoint without terminating the recording. Await candidates retain their
own enclosing statement source ranges, so an unreachable await after an
earlier throw or return on the same line is not reported as a suspension.
A regression covers the early-return case alongside the existing throw,
async sibling, loop, and concurrent-invocation cases.

Local validation: the final Node 26 core check passed 133 tests with one
optional CodeGraph integration skip; all 43 recording tests passed under
Node 24. The 42 Playwright browser tests passed, including the recorded-trace
performance fixture. The production build, typecheck, Prettier check,
packed-package check and git diff whitespace check also passed.

The failed GitHub Actions run at commit `eee6421` predates these local
changes. Node 22 and Ubuntu/Windows CI remain unverified on the amended
worktree. These focused changes do not close the remaining 37-requirement
visual, accessibility, cross-language and scale acceptance work.

## Requirement status matrix

This table summarizes the 37 original requirements. **Bounded** means the
specified behavior is demonstrated by particular fixtures or tests, but the
full acceptance scope is not yet proven. **Partial** means implementation or
verification remains outstanding. Detailed evidence follows in the checklist.

| #   | Requirement                               | Status      | Remaining acceptance work                                                                                          |
| --- | ----------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | No arbitrary 30-step limit                | Bounded     | Verify more real deep traces and resource limits.                                                                  |
| 2   | User-code focus                           | Bounded     | Exercise diverse framework callbacks and generated code.                                                           |
| 3   | Entry-to-exit execution accuracy          | Partial     | Cover wider async, exceptions, runtime boundaries, and languages.                                                  |
| 4   | Preprocess before playback                | Bounded     | Verify all trace/scenario navigation paths.                                                                        |
| 5   | Shared execution event model              | Bounded     | Validate high-volume and cross-language semantics.                                                                 |
| 6   | High-level view by default                | Bounded     | Complete visual/interaction acceptance.                                                                            |
| 7   | Expand method execution                   | Bounded     | Validate real deep, heavily branching traces.                                                                      |
| 8   | Independent nested disclosure             | Bounded     | Extend real branching and accessibility coverage.                                                                  |
| 9   | Synchronized overview and detail          | Bounded     | Validate complex interleaved tasks.                                                                                |
| 10  | VisualJS reference behaviors              | Partial     | Complete recorded-trace interaction comparison after initial visual review.                                        |
| 11  | Live original-source editor               | Partial     | Verify full source-map and syntax-language coverage.                                                               |
| 12  | Automatic source following                | Bounded     | Test deep cross-file jumps and return behavior.                                                                    |
| 13  | Real loop execution order                 | Bounded     | Verify wider runtime loop semantics.                                                                               |
| 14  | Playback and debugger controls            | Bounded     | Exercise more cross-language and async step semantics.                                                             |
| 15  | Reclaim viewport space                    | Partial     | Review rendered geometry and density.                                                                              |
| 16  | Progressive disclosure                    | Partial     | Accept full visual hierarchy in rendered UI.                                                                       |
| 17  | Compact main workspace                    | Partial     | Refine toolbar and secondary controls.                                                                             |
| 18  | Side-by-side desktop workspace            | Bounded     | Broader visual and viewport review.                                                                                |
| 19  | Modern accessible visual style            | Partial     | Audit contrast, themes, and visual quality.                                                                        |
| 20  | Meaningful animation                      | Partial     | Inspect animation timing and transitions visually.                                                                 |
| 21  | No flicker or layout jumps                | Partial     | Profile browser paint and complex traces.                                                                          |
| 22  | Instant prepared-data disclosure          | Bounded     | Verify real large branching trees.                                                                                 |
| 23  | Contextual variable inspection            | Bounded     | Deep-object screen-reader and rendering acceptance.                                                                |
| 24  | User-controlled navigation                | Bounded     | Exercise broader synchronized keyboard paths.                                                                      |
| 25  | Keyboard and screen-reader access         | Partial     | Nested pages, source/overview focus and manual-step live updates tested; full assistive-technology review remains. |
| 26  | Responsive workspace                      | Partial     | Mobile nested disclosure and accessibility acceptance.                                                             |
| 27  | Large trace performance                   | Partial     | Extend recorded paint/heap profiling to larger, deeper real applications.                                          |
| 28  | No repeated AI processing                 | Bounded     | Cover additional prepared continuation/scenario paths.                                                             |
| 29  | Supported language compatibility          | Partial     | Verify full language inventory and observed-vs-static behavior.                                                    |
| 30  | Single replay state                       | Bounded     | Verify multi-task and cross-language history.                                                                      |
| 31  | Original source separate from annotations | Bounded     | Preserve separation during further source work.                                                                    |
| 32  | Inspect existing architecture first       | Verified    | Preserve existing implementation contracts.                                                                        |
| 33  | Implement in logical stages               | In progress | Complete remaining acceptance stages.                                                                              |
| 34  | Preserve working functionality            | Bounded     | Recheck gates and regression scenarios on final build.                                                             |
| 35  | Functional acceptance scenarios           | Partial     | Test representative languages and real large runs.                                                                 |
| 36  | UI/UX acceptance                          | Partial     | Complete rendered, contrast, and screen-reader review.                                                             |
| 37  | Complete integrated delivery              | In progress | Close all gaps and verify final deliverables.                                                                      |

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
   A later raw Inspector experiment reproduced a second help notice immediately
   after `Debugger ending on <the recording URL>` in one of eight runs. This
   explains the intermittent extra console text in a source-map test: filtering
   only the startup notice left Node's shutdown help visible as application
   output. The extracted stderr handler now consumes one exact help line
   immediately following that known ending banner. Deterministic tests replay
   the observed sequence and preserve application help text elsewhere, unknown
   URLs, trailing whitespace, carriage returns, and unterminated prefixes.
   The handler is included in the built recorder package. This evidence does
   not explain the separate intermittent Inspector WebSocket connection failure.
   After this correction, the full core check passed 132 tests with one optional
   CodeGraph skip, plus typecheck, build, and formatting. Both recorded JavaScript
   and verified TypeScript-source-map browser playback regressions passed.
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
    Source and State call-stack buttons now preserve keyboard focus across
    invocation replacement, redirect focus to the closest surviving ancestor,
    and fall back to Play when the execution stack empties. The browser path
    regression tests those transitions without loading additional trace data.
    Cross-browser and native screen-reader acceptance remain open.
26. **Responsive workspace — partial.**
    Browser tests cover 1440x900, 820x1180, and 390x844, panel switching, playback
    visibility, and page overflow. Desktop side-by-side flow and a dedicated
    mobile Flow view pass geometry and replay checks. Mobile console-history
    paging and scrollable output now pass browser checks with 655 events.
    The recorded Python nested-call regression now also covers 320x568,
    390x667, and 390x844: the inspector retains at least 110px and the canvas
    at least 100px, nested disclosure responds to Enter, playback stays at the
    selected event, the dock fits within the viewport, and no additional
    requests or horizontal page overflow occur. The 320x568 canvas previously
    measured only 92px because the inspector consumed 45% of the flow panel.
    A mobile-only bounded inspector allocation now leaves more canvas space.
    All 41 browser tests passed, along with 129 core tests (one optional
    CodeGraph skip), typecheck, build, and formatting. These checks do not
    establish full visual accessibility; broader compact-layout and
    assistive-technology review remains open.
    A subsequent non-overlap assertion reproduced 20px of flow content behind
    the dock at 320x568. The mobile page now allocates separate grid rows to
    the header, remaining workspace, and actual dock height, replacing the
    fixed viewport subtraction. Its single column can shrink below intrinsic
    content width. The recorded regression checks the entire flow panel ends
    above the dock at all three phone sizes while retaining the existing
    canvas/inspector height, keyboard, cursor, and request assertions.
    This follow-up passed all 41 browser tests, packed-package verification,
    formatting, and whitespace checks. The saved 390x844 Flow screenshot was
    visually reviewed; its legend and flow panel end above the playback dock.
    Console preference continuity now has a separate regression: opening the
    mobile Console view previously left the desktop console expanded after
    resizing, even when the saved desktop preference was collapsed. Crossing
    the mobile breakpoint now restores the desktop preference or reveals the
    selected mobile Console view as appropriate. Only explicit desktop summary
    clicks persist the preference, avoiding queued programmatic toggle events
    overwriting it. Both collapsed and expanded desktop states, repeated
    viewport transitions, unchanged playback, no additional requests, and
    persistence of an explicit expansion across reload are tested.
    The console-preference update passed all 42 browser tests. Core verification
    was not consistently green: a concurrent run timed out in the CodeGraph
    fixture job; a subsequent run passed that test but failed two Node recorder
    tests (a debugger help notice leaked into mapped-program output, and a
    Promise fixture failed its Inspector WebSocket connection). Focused source-map,
    stderr-preservation, and Promise tests then passed (3/3). These intermittent
    recorder failures remain unresolved; no recorder behavior was changed in
    this UI update and focused passes do not establish a clean full core run.
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
    A second **actual Python recording** stress fixture runs 480 real
    cross-file worker calls with nested calculations, bounded nested local values,
    and an output for every iteration. The recorded 11,724 events include 960
    worker entries and 964 console events; all events retain observed evidence.
    A browser regression checks exact final output and invocation counts,
    retrieves every prepared continuation, pages to the oldest and newest console
    output, switches among 480 recorded invocations, repeatedly expands/collapses
    a selected invocation, and performs 36 two-frame seeks. Chromium tracing
    captures actual Paint events, while DevTools measures layout, heap and DOM
    node counts before/after seeking, with explicit garbage collection for
    comparable retained-node and heap measurements. The test also checks desktop/mobile
    viewports, bounded connected DOM, consistent playback position, and zero
    replay API requests after all continuations have loaded. One local Windows
    sample measured 50.2 ms seek p95, 196 Paint events totaling 267.6 ms,
    123 additional layouts, 13 to 13 MiB retained JavaScript heap, and DOM counters
    5,538 to 5,790 retained nodes. These are workload-specific diagnostic measurements,
    not universal paint or memory guarantees. The source files remain small,
    so real large-codebase source navigation and diverse application workloads
    still need profiling before requirement 27 can be accepted. The later
    large-source regressions documented above extend actual Python and
    JavaScript recording to more than 2.2 MiB of original source across three
    modules, and verify browser source following with bounded rendered rows.
    Realistic full-application profiling and scalable snapshot storage remain
    outstanding.
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
