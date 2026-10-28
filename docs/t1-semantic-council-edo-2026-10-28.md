# T1 semantic hierarchy — Council decision and implementation gate

Date: 2026-10-28 (Sri Lanka). Branch: `fix/react-layout-collapse`.

## Authority, baseline and scope

- The owner requested completion of the previously reviewed ELK task ledger.
  This authorizes the scoped implementation, not public redistribution of
  the dual-licensed ELK Worker, an npm release, or deletion of task files.
- B0b–B0h scoped interaction acceptance and T7 preference preservation were
  verified at source/test commit `25efa689` in
  [Actions #40604735431](https://github.com/EmpRider/code-anime/actions/runs/40604735431):
  71/71 Chromium and four Linux/Windows check/package jobs. The subsequent
  documentation-only head `a575a85` also passed all five jobs in
  [Actions #40608487709](https://github.com/EmpRider/code-anime/actions/runs/40608487709).
- T1 is limited to authored `public/semantic-flow-model.js` and focused
  `tests/semantic-flow-model.test.mjs`. Build parity may require the already
  tracked generated `public/diagram/diagram.js`; changing this generated
  artifact is not authority to change runtime execution, layout, or the
  player. The only semantic public interface is
  `buildSemanticFlow(flow) -> { methods, roots, byEvent }`.
- `AGENTS.md` static/mock and MVP-first requirements remain binding. T9's
  missing historical CodeGraph/long-trace E2E, manual PC accessibility and
  release gates remain tracked separately. No current reproducible B0
  browser functional failure was found during the scoped acceptance audit.

## Five independent Council advisors — source-grounded findings

| Advisor lens     | Independent finding                                                                                                                                  | Recommendation                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Architecture     | `block(next,'else')` expects `{` and splits `else if` into siblings; `findLastIndex` misowns a shared `} else if` line.                              | Conservative source-proven nested false-arm; never fabricate multiarm truth.               |
| Implementation   | The current parser can place the second decision header inside the outer true arm. A nested binary decision preserves downstream layout assumptions. | RED first; minimally extend braced source ranges and conservative branch membership.       |
| QA               | Six old semantic unit cases omit damaged/unbraced, repeated IDs, exact leaf conservation, and unresolved ownership.                                  | Independent RED negative controls, no inferred execution or T2 arrows.                     |
| Reliability      | `source.replace()` crashes on null/non-string; regex/source masking, O(events × scopes) and first-false-selects-all-arms pose risks.                 | Fail closed on ambiguous source; avoid unbounded rescans and fabricated selected branches. |
| Devil's advocate | Reproduced a class method named `if` being falsely grouped as a decision despite prepared `statement` events, and wrong `else if` ancestry.          | Reject an `else if` formatting-only patch; require lexical/statement-context falsifiers.   |

Advisors produced proposals independently; no GitHub or source edits were
delegated to them. Each verdict was **conditional approval** of a narrowly
reviewed RED→GREEN T1 change, not approval of T2–T9.

## Five new anonymized blind peer reviews

All reviewers received uncredited option summaries: **A** minimal braced
matcher and nested `else if`; **B** event/visit/invocation provenance;
**C** test-first negative controls; **D** malformed-data and selected-arm
fail-safety; **E** adversarial false-positives and wrong ancestry. They did
not receive advisor identities or each other's replies.

| Blind peer | Independent challenge                                                                                                                                                              | Verdict                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| P1         | Class method `if` and regex literals must not invent decisions; preserve `node.id`, augment evidence identity separately.                                                          | Conditional GO                     |
| P2         | Reproduced wrong outer Yes ownership and empty No after `else if`; no event loss or fabricated parent.                                                                             | Conditional GO                     |
| P3         | Probed null `sourceFiles` causing TypeError and `if`-named method false decision; require guards.                                                                                  | Conditional GO                     |
| P4         | Renderer/layout consume `node.id`, `indices[0]`, binary Yes/No; missing source columns make shared-line ownership ambiguous. T1 semantic `Unresolved` is not yet visibly rendered. | Conditional GO with T5 visual gate |
| P5         | Renaming `event-${index}`/`structure-${index}` breaks selection/visit mapping; generated bundle must match source.                                                                 | Conditional GO                     |

## Live EDO challenges and rebuttals

1. **Identity challenge:** P1/P5 objected to replacing existing node IDs with
   hashes. Architecture **conceded** after verifying `event-4` assertions
   in layout tests and `selectedVisits` keyed by `node.id`. Preserve the old
   stable IDs; expose additional `evidenceIdentity`, invocation and visit
   occurrence metadata. Full unrelated trace-replacement invalidation is a
   T6 `traceRevision`/consumer concern, not a stateless T1 continuity claim.
2. **Visual uncertainty challenge:** P4 observed that the current
   `public/diagram.js` constructs cards from raw `event.kind` and label,
   ignoring semantic `note`/`ownershipStatus`. Architecture, live QA and
   live Devil **conceded**: T1 tests model-level neutral `Unresolved`
   ownership only. Visible neutral lanes, status and accessible presentation
   belong to T2/T5/T9. Do not claim human/browser visual acceptance from T1.
3. **Nested source challenge:** Live QA accepted a **binary outer Yes/No with
   a nested binary `else if` inside the outer No**. Flattening into three
   arms would break binary T2 layout assumptions and select multiple
   alternate arms from one false condition. Same-line `} else if` has no
   column provenance; ambiguous events must not be assigned to the old Yes.
4. **Devil's falsifiers:** The live Devil retained method-named `if`, regex
   literals, non-string snapshots, repeated event IDs, malformed syntax and
   conservation as hard negative controls. No advisor argued for an AST
   rewrite, recorded execution, Worker dependency or invented catch edge.

## Final EDO decision — CONDITIONAL GO, T1 only

1. **Tests-first RED:** `groups_multiline_else_if_and_nested_try`,
   `does_not_invent_unbraced_or_damaged_scope`,
   `keeps_repeated_call_and_visit_event_identity`,
   `contains_each_prepared_index_exactly_once`, and
   `marks_unknown_ownership_at_overview`. Add false-positive controls for
   method named `if`, regex literal and null/non-string source snapshots.
   Distinguish confirmed baseline RED failures from already-green guards.
2. **Narrow GREEN:** Conservative source-proven, braced nested binary
   grouping; visibly neutral **model metadata** for unproven semantics;
   fail-closed ambiguous branch/source ownership; preservation of each
   one-based prepared index exactly once at the **terminal leaf** level.
   Container/branch/visit `.indices` intentionally aggregate descendants.
3. **Compatibility:** Preserve `{methods, roots, byEvent}`, existing
   `event-${index}` and `structure-${index}` ID contracts, nested
   `method.items`, call/return provenance and append-prefix behavior.
   Additional identity metadata may disambiguate duplicate event IDs and
   repeated visits but cannot invent cross-snapshot provenance.
4. **Verification:** Push this decision and the task ledger to GitHub and
   remotely verify before T1 test/source edits. Push the RED tests with a
   descriptive commit; observe intended RED. Implement and independently
   review the minimum fix, rebuild tracked assets, then obtain focused
   GREEN, full Node/Chromium/package checks and exact-head GitHub CI.
   Do not mark T1 DONE before all accepted gates pass.
5. **Deferred gates:** T2 truthful execution arrows, T5 user-visible
   uncertainty/compound frames, T6 replacement-race invalidation, T9
   cross-language/large-trace/release acceptance and T3 public Worker
   licensing/distribution remain separate tasks and approvals.

**EDO conclusion:** The reproducible wrong-branch grouping and false
source decision warrant an isolated T1 correctness fix. Conditional Council
approval is not a release decision and cannot be used to bypass an observed
new MVP regression or a failed GitHub plugin write.
