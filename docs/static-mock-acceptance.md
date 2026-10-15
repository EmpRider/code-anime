# Static/mock-only acceptance ledger

## October 15 — explicit uncertainty in MCP mock steps

`build_mock_animation` now rejects unresolved operations that are mislabeled
as ordinary mock execution, and requires a note explaining missing CodeGraph
evidence or unknown semantics. Rejected batches leave the prepared replay
unchanged; a documented unresolved branch can still be saved as an incomplete
mock scenario. `tests/builder.test.ts` covers both rejection cases and the
persisted scenario. The full builder suite passed **13/13**, production
TypeScript compilation, the static-scope guard, and `git diff --check` passed.
This narrows the uncertainty-reporting gap in requirements 3, 13 and 35; it
does not establish the agent's semantic accuracy or complete flow coverage.

The full `npm run typecheck` continues to fail on the historical recorder tests
described below. The complete release gates remain blocked and no release has
been prepared.

## Latest local gate results — October 15, 2026

The previously pending real CodeGraph integration process completed with
**21 passed, 0 failed, 0 skipped**. It includes indexed Kotlin, Java, and
TypeScript definitions, same-named-method isolation, relationship completeness
checks, and provider-only replay without executing fixture applications.

The complete unit suite was run again against the existing worktree:
**172 tests; 163 passed, 7 failed, 2 skipped**. Four test files cannot load
because they import removed recorder modules (`inspector-stderr`,
`large-source-recording`, `recording-boundaries`, `recording`). Two historical
continuation subtests still require the removed `Recorded execution` label
and their containing suite also fails. These are the seven reported failures.
The obsolete-test retirement/conversion operation was previously refused by
execution policy; no alternate cleanup was attempted and no failing tests
were excluded from the release commands. Full typechecking and complete CI
remain blocked by this obsolete runtime-only coverage. No release is claimed.

**Authority:** `AGENTS.md` and the owner's 37 numbered requirements in the
original `pasted-text-1.txt` specification. This ledger replaces the runtime
assumptions in the historical matrix in `acceptance-audit.md`; it does not
retroactively convert recorded-execution evidence into mock-flow acceptance.

Code Anime **never executes the analyzed application**. CodeGraph supplies
definitions, original source, and relationships; the host AI supplies
**hypothetical**, source-grounded inputs, branches, computations, mutations,
returns, exceptions, and output. The MCP builder constructs and persists the
prepared replay. A completed scenario is not proof of all reachable paths.

The October 15 CodeGraph callee-expansion regression now retains relationships
from earlier responses when a later, larger query returns a different set.
Such inconsistent provider evidence is marked incomplete even when the later
response claims a complete total. The focused synthetic test checks that the
original and newly returned callees both remain visible; real-project
completeness and cross-platform acceptance remain outstanding.

An additional regression covers repeated, identical CodeGraph callee rows.
These are counted as one unique relationship and explicitly mark coverage
incomplete, even when the provider's reported relationship total appears
satisfied by the duplicated rows. Static playback does not invent separate
call sites for indistinguishable provider evidence.

Same-named CodeGraph definitions are now isolated **before** checking reported
relationship totals or combining paginated responses. The adapter excludes
unrelated method edges and marks missing relationships in the selected method
as incomplete even when other definitions supplied enough rows to satisfy the
provider's combined count. Two synthetic regression cases cover incomplete
and complete selected-definition responses; real-project completeness remains
unverified.

On October 15, the source boundary was strengthened to resolve filesystem
symlinks before expanding CodeGraph relationships. Indexed calls whose aliases
resolve outside the selected project or into excluded generated/dependency
source remain compact, with the reason preserved in the event note. Synthetic
symlink tests exercise both graph traversal and source snapshots on Windows;
this addresses one boundary case in requirement 2, not its remaining callback
or cross-language acceptance gaps.

## October 15 — mock builder capacity and retained sessions

### Latest release-gate verification (October 15)

The opt-in CodeGraph-backed browser run passed **7/7** tests covering the
TypeScript cross-file simulated flow, Kotlin and Java mock flows, prepared
source highlighting, 20,000 prepared events, branching disclosures, and 1,500
invocations across five persisted continuations. The scope guard, production
build, `git diff --check`, and packed npm CLI/MCP/player smoke verification
also passed. These are targeted checks and do not supersede the complete
acceptance matrix.

The preceding full unit run remained **150 passed, 7 failed, 2 skipped**.
Four test files fail to load because they import removed runtime recorder
files; two obsolete runtime continuation subtests fail and the containing
suite is also counted as failed. Those subtests expect “Recorded execution”
instead of the player’s correct “Simulated values”. Full
typechecking also fails on runtime-only tests. The attempted runtime-test
removal/conversion was explicitly rejected by the execution policy and was
not performed. This prevents a green full CI gate; do not claim release
readiness or hide those tests from release commands.

`tests/builder.test.ts` reproduced a build-capacity bug: ten finalized mock
animations retained their in-memory handles, preventing a new animation from
starting. `AnimationBuilder` now reclaims the oldest **finalized** handle as
needed; persisted playback sessions remain in `SessionStore`. New CodeGraph
evidence is validated before a retained handle is reclaimed.

Two targeted regression tests passed locally. Eleven sequential mock sessions
preserved their first and last persisted replays; failed evidence validation
preserved existing finalized handles; the eleventh valid scenario reclaimed
only the oldest completed handle and returned a clear expired/not-found error
for its former ID. Ten active builds correctly reject a new begin; cancelling
one reopens capacity. This is bounded lifecycle acceptance, not full product
or CI acceptance.

The obsolete runtime-only test cleanup remains unresolved. The attempted
removal/conversion command was rejected by the execution policy. Full
TypeScript checks still fail on historical recorder imports and the removed
`observed` certainty. The static CodeGraph plus AI mock scope remains binding.

## How to read this ledger

- **Bounded:** the named behavior is proven by the stated fixture/check, but
  the original requirement's full scope has not yet been accepted.
- **Partial:** an implementation exists but one or more essential acceptance
  conditions are absent or unverified.
- **Unverified:** no adequate current static/mock acceptance evidence.
- **Verified:** the complete, specifically stated procedural requirement has
  direct evidence. No functional requirement is marked fully verified solely
  because tests compile or a narrow fixture passes.

| #   | Original requirement, interpreted for simulated flows                                     | Status     | Present evidence                                                                                                                                                                | Missing acceptance proof or implementation                                                          |
| --- | ----------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | No arbitrary call-depth limit; terminate on resource/evidence boundaries                  | Bounded    | `tests/builder.test.ts` checks >30 nested calls; `tests/native-codegraph.test.ts` checks >30 structural calls                                                                   | Larger recursive mock cases, cancellation, and bounded incomplete coverage across real projects     |
| 2   | Stay in user-written code and summarize external boundaries                               | Partial    | `native-codegraph.ts` now preserves indexed external/dependency/generated calls as compact leaf events and rejects out-of-project entry points; focused graph/source tests pass | Framework callback handoffs, symlinks, and cross-language real-project boundary review              |
| 3   | Explain selected entry-to-exit scenario with justified simulated values and unknown paths | Partial    | Mock state/return regressions in `tests/builder.test.ts`, `tests/mock-completeness.test.ts`                                                                                     | Agent semantic accuracy and A-to-Z scenario coverage cannot be proven from retrieved receipts alone |
| 4   | Precompute before replay; playback uses only stored events                                | Bounded    | `tests/browser/large-trace.spec.ts` asserts stable API count while seeking                                                                                                      | Scenario switching, all controls, and multiple continuations across browsers                        |
| 5   | Shared, language-independent event and snapshot contract                                  | Bounded    | `src/domain/trace.ts`, `tests/invocation-integrity.test.ts`, `tests/builder.test.ts`                                                                                            | Independent task ordering, event provenance, mixed-language cross-file validation                   |
| 6   | Default to compact high-level method/flow view                                            | Partial    | `public/flow-overview.js`, `public/player.js`                                                                                                                                   | Visual acceptance of start view, information hierarchy, and complex scenarios                       |
| 7   | Expand a method to prepared statement details                                             | Bounded    | Prepared hierarchical disclosure exercised in `tests/browser/large-trace.spec.ts`                                                                                               | Deep and branching cross-language source/view acceptance                                            |
| 8   | Independently expand and collapse nested methods without moving cursor                    | Bounded    | Browser branching/disclosure regression in `tests/browser/large-trace.spec.ts`                                                                                                  | Keyboard/screen-reader and deep recursion acceptance                                                |
| 9   | One synchronized position across high-level and detailed views                            | Bounded    | `tests/player-continuation.test.mjs` and prepared browser stepping                                                                                                              | Interleaved simulated tasks, comparisons, and full UI-state audit                                   |
| 10  | Integrate essential VisualJS source and interaction behaviors into existing UI            | Partial    | Prepared source browser fixture, modern player components                                                                                                                       | Side-by-side visual/interaction acceptance against the reference                                    |
| 11  | Display authentic original source and current simulated line                              | Bounded    | Initial source and line highlighting in `tests/browser/large-trace.spec.ts`                                                                                                     | Source map, large-file, and syntax coverage for every supported language                            |
| 12  | Follow simulated calls across sources and return to caller                                | Bounded    | Prepared navigation and source tests in `tests/player-continuation.test.mjs`                                                                                                    | Multiple cross-file nested mock calls and explicit unresolved source paths                          |
| 13  | Animate hypothetical loop iterations and state changes consistently                       | Partial    | Shared event kinds and reversible replay                                                                                                                                        | AI-derived loop-bound/counter correctness; unknown iterations must remain unresolved                |
| 14  | Playback, step, seek, breakpoint, and restart controls                                    | Bounded    | `tests/player-continuation.test.mjs`, `tests/browser/large-trace.spec.ts`                                                                                                       | Full keyboard/control integration on interleaved tasks and mobile                                   |
| 15  | Reclaim viewport space                                                                    | Partial    | Collapsible panels and responsive CSS                                                                                                                                           | Measured desktop/tablet/mobile layout acceptance                                                    |
| 16  | Progressive disclosure and readable visual hierarchy                                      | Partial    | Nested method and variable disclosures                                                                                                                                          | Rendered visual/usability acceptance, including empty/error states                                  |
| 17  | Compact toolbar, source, flow, inspector, and console                                     | Partial    | `public/index.html`, `public/styles.css`                                                                                                                                        | Screen-density review across target sizes                                                           |
| 18  | Effective side-by-side desktop workspace                                                  | Partial    | Resizable/collapsible panels in player                                                                                                                                          | Real viewport and keyboard resize acceptance                                                        |
| 19  | Accessible modern styles and themes                                                       | Partial    | Styling and browser interaction tests                                                                                                                                           | Contrast and assistive-technology review on both themes                                             |
| 20  | Smooth, meaningful simulated-flow animation                                               | Partial    | Prepared timeline, active-source display                                                                                                                                        | Reduced-motion behavior and visual continuity audit                                                 |
| 21  | Avoid flicker and layout jumps                                                            | Partial    | Large prepared browser seek checks                                                                                                                                              | Paint, resize, disclosure and continuity measurements                                               |
| 22  | Instant disclosure from prepared data                                                     | Bounded    | Branching and 1,500-invocation browser fixtures                                                                                                                                 | Deeper real-project branching and accessibility                                                     |
| 23  | Contextual mock variables, objects, changes and returns                                   | Bounded    | `tests/builder.test.ts`, source/inspector player tests                                                                                                                          | Rich collections, origins, cross-language value formatting and screen readers                       |
| 24  | Search, select, step, scrub and inspect without state loss                                | Bounded    | `tests/player-continuation.test.mjs`, prepared browser tests                                                                                                                    | Complex comparisons and interruption scenarios                                                      |
| 25  | Full keyboard and screen-reader accessibility                                             | Partial    | Focus/navigation regressions in prepared tests                                                                                                                                  | Manual screen-reader and WCAG/contrast acceptance                                                   |
| 26  | Responsive workspace on mobile/tablet/desktop                                             | Partial    | CSS breakpoints, mobile controls                                                                                                                                                | Touch target, viewport and orientation acceptance                                                   |
| 27  | Long prepared mock flows remain usable                                                    | Bounded    | 20,000 events; five persisted continuations; 1,500 invocations in `tests/browser/large-trace.spec.ts`                                                                           | Memory, accessibility, massive-source and cross-platform stress budgets                             |
| 28  | No repeated AI analysis during playback                                                   | Bounded    | API count invariant in initial-source browser test                                                                                                                              | All selectors, comparisons, continuations and disclosure paths                                      |
| 29  | CodeGraph-powered evidence and mock builder work across supported languages               | Partial    | Indexed Kotlin/Java/TypeScript MCP evidence/build tests and browser replay for all three in `tests/browser/codegraph-mock-flow.spec.ts` and `codegraph-multilang-mock.spec.ts`  | Realistic multi-module semantic coverage and all CodeGraph-supported languages                      |
| 30  | One reversible cursor/state across stack, output, source, and object values               | Bounded    | `tests/builder.test.ts`, browser stepping and continuation tests                                                                                                                | Task-switch and comparison synchronization under all controls                                       |
| 31  | Keep original source and simulated annotations distinct                                   | Bounded    | Browser source test, `src/domain/trace.ts`                                                                                                                                      | Mixed-source annotations and unavailable-source UI review                                           |
| 32  | Inspect existing implementation before making changes                                     | Verified   | The existing architecture, UI, and tools were inspected and retained during migration                                                                                           | Maintain this constraint for subsequent changes                                                     |
| 33  | Implement in a logical order, preserving the existing workflow                            | Partial    | Static boundaries, evidence, builder and replay are implemented incrementally                                                                                                   | Outstanding acceptance and final integrated review                                                  |
| 34  | Preserve working functionality while removing runtime capture                             | Partial    | Scope guard and packaged MCP smoke test                                                                                                                                         | Restore green active CI without resurrecting obsolete recording behavior                            |
| 35  | Functional scenarios covering calls, branches, loops, depth, resources, UI, and languages | Partial    | Selected builder, CodeGraph and browser fixtures, including Kotlin mock branch and Java mock loop in `tests/browser/codegraph-multilang-mock.spec.ts`                           | Integrated scenario-by-scenario audit for all ten subtests                                          |
| 36  | Complete minimalistic UI/UX acceptance                                                    | Partial    | Rendered Chromium prepared-trace tests                                                                                                                                          | Human visual, mobile, keyboard and assistive-technology review                                      |
| 37  | Finished integrated product with verified distribution                                    | Unverified | Package smoke test and focused local passes                                                                                                                                     | Green full static CI, complete acceptance, cross-platform proof and release decision                |

## Current verification and hard gates

The October 15 local continuation established 42/42 focused mock-flow tests,
9/9 native CodeGraph tests on Windows including indexed Kotlin/Java/TypeScript
source retrieval and actual MCP evidence/build/persist calls with hypothetical
values, and 5/5 prepared Chromium tests. `npm run check:scope`,
production TypeScript compilation, installed package verification, and
format/whitespace checks passed. These are bounded acceptance evidence only.

**Not release-ready.** Full `npm run typecheck` still fails on historical
recorder-dependent tests referencing the removed service and `observed`
certainty. The broader prepared continuation suite passes 32/35; three
historical assertions still expect `Recorded execution` instead of
`Simulated values`. The earlier safety refusal on deleting or rewriting
obsolete recorder tests remains unresolved. Cross-platform CI and the full
historical browser suite are not green. Do not reinstate recorders to satisfy
legacy checks, silently exclude the failing tests, or call the narrowed
passing subsets a complete product.

Next acceptance work: broaden the CodeGraph-to-MCP-builder-to-browser-player
path beyond one indexed cross-file scenario; prove handler/loop/branch
consistency across languages; measure responsive and assistive-technology
behavior; and close the CI blockers within the authorized static-only boundary.

## October 15 — indexed cross-file MCP-to-browser acceptance

`tests/browser/codegraph-mock-flow.spec.ts` passed **1/1 in local Chromium**
with `CODE_ANIME_TEST_CODEGRAPH=codegraph`. This opt-in integration indexes
inert TypeScript source across `checkout.ts`, `normalize.ts`, and `receipt.ts`,
retrieves definitions and bounded callee relationships through CodeGraph's MCP
evidence interface, and sends AI-style hypothetical values via the actual
`build_mock_animation` MCP protocol. The persisted trace and localhost player
were checked for original source snapshots, cross-file nested calls, `.trim()`
and `Math.min()` mock transformations, return-to-caller assignments, simulated
console output, reversible stepping, and no further flow fetches during replay.
The interactive method details exposed both nested invocation IDs while
retaining the playback cursor, and the same flow remained inspectable at a
390-pixel mobile viewport without horizontal overflow.

**Scope:** one hand-authored mock path with a known input and expected values;
the fixture application was never executed. This adds direct cross-file
browser evidence for requirements 11, 12, 23, 29, 30, and 35, but leaves
real-project agent interpretation, arbitrary language semantics, alternate
branches, and full CI/release acceptance unverified. Bounded relationship
queries are necessary for complete scenarios: an unbounded `callees` receipt
correctly triggers the CodeGraph evidence-completeness guard.

## October 15 — simulated exception ancestry and multi-chunk navigation

The high-level overview previously inferred a thrown exception's caller from
the **post-unwind stack**, incorrectly attributing `C.fail` to `A.main` when the
simulated exception had already closed both `C.fail` and its immediate caller
`B.work`. `public/flow-overview.js` now uses the invocation parent recorded at
entry for subsequent events, unless the event explicitly provides its parent.
`tests/mock-overview-ancestry.test.mjs` reproduces the wrong attribution before
the fix and verifies the correct source ancestry afterward, including recursive
invocations with distinct IDs.

`tests/player-continuation.test.mjs` additionally verifies simulated
multi-frame exception unwinding across **three prepared chunks** with an
interleaved unrelated mock task. Step Over, Step Into, and Step Out reach the
prepared exception/catch boundaries; backward seek restores original source,
stack and console state; and playback loads only the two stored continuations.
No analyzed application or user fixture code is executed to supply values.

## October 15 — interleaved simulated tasks and reversible shared state

`tests/builder.test.ts` now drives two independent mock tasks through the
actual server-side animation builder in separate append batches. The worker
creates a shared hypothetical object, the main task's child changes it, and
the worker changes it again after the child returns a value into its caller.
The persisted events retain unique invocation IDs, caller assignments, and
ordered before/after snapshots of the shared mock object. The inert project
source is read as text; no analyzed application is executed.

`tests/player-continuation.test.mjs` independently checks prepared browser
playback of the same kind of interleaving across two stored chunks. Seeking
backward restores the earlier object value and clears later simulated console
output; seeking forward restores the shared state and output without fetching
the continuation again. The initial player prompt now explicitly says
"Explore a simulated code flow." The invocation validator also distinguishes
duplicate IDs within an inferred pre-return stack from reused IDs across
separate mock tasks.

The focused builder, invocation, and completeness tests passed (40/40 before
the additional player test); the new player case passed (1/1). The static/mock
scope guard and production TypeScript compile passed. Full typechecking still
fails on the previously identified obsolete recorder-dependent tests. This is
**bounded** acceptance evidence for requirements 5, 9, 23, 24, 30, and 35;
cross-language semantics, accessibility, complete CI and release remain open.

These are bounded improvements for requirements 6, 9, 12, 24, 30 and 35.
They do not verify arbitrary branching, cross-language semantic accuracy,
cross-platform CI, or complete UI accessibility. The legacy recorder-dependent
test blocker above is still open, so the project remains **not release-ready**.

## October 15 — Kotlin and Java CodeGraph-to-browser mock replay

`tests/browser/codegraph-multilang-mock.spec.ts` adds two indexed, inert
multi-file fixtures: `KotlinOrder.checkout` calls `KotlinTotals.amount`, and
`JavaOrder.checkout` calls the static `JavaTotals.amount` method. Both retrieve
node and callee evidence through the actual Code Anime MCP tool, submit
AI-style hypothetical events using `build_mock_animation`, and inspect the
persisted source snapshots and localhost player. Neither fixture application
is compiled or run. Mock mutation/branch events in Kotlin and two mock loop
iterations in Java are explicitly simulated.

Chromium verified the original `.kt` and `.java` source text, highlighted
lines, independent invocation IDs and caller assignment, changing mock
variables, simulated console output, reverse navigation, hierarchical method
inspection, and no additional flow fetches during replay. The existing
TypeScript integration was rerun alongside it: **2/2 browser tests passed**;
the new test checks both Kotlin and Java within its single test case.
Production TypeScript compilation and the static-only scope guard also passed.

The indexed provider did **not** report a callee for Java's
`new JavaTotals().amount(raw)` expression. A static cross-file call
`JavaTotals.amount(raw)` was indexed and used for this verified scenario. This
is a discovered CodeGraph relationship boundary, not evidence that every
Java invocation style works. The mock scenarios do not prove real runtime
values, all branches, arbitrary language coverage, or release readiness.
