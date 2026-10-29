# CA028 engineering Council addendum — static branch-arm evidence ownership

2026-10-29. EDO: TL `/root/pm_fe_phase_a/tl_fe_phase_a`; PM `/root/pm_fe_phase_a`; BA `/root`. Pinned Engineering Council snapshot: [FE Phase A skill provenance](fe-phase-a-skill-provenance-20261029.md), EmpRider Council root at `a7565e21d5ab03551fe66e36818e05af245467b8`. This is a newly encountered CA028 code-review choice, following the approved [kickoff Council](fe-phase-a-kickoff-council-20261029.md) and [Visit-completeness mini-Council](fe-phase-a-visit-coverage-council-20261029.md).

## Neutral question and evidence

**OBSERVED:** `docs/v3/flow-scene-json-contract.md` §3 allows a group's `sourceRef` to be null and `evidenceIds` to be empty; certainty includes `static`. §7's invalid-input matrix mentions a `branch arm without source/evidence where it is claimed static`, requiring rejection or producer relabeling before export. **Also observed:** §7's opening limits FE checks to schema/reference rejection and assigns output validation to the **future MCP producer**. The owner specifically prohibited business/semantic logic in frontend, allowing only geometry and presentation. The CA028 adapter currently accepts a structurally valid `branch`/`case` arm with `certainty:'static',sourceRef:null,evidenceIds:[]`; it rejects missing receipt IDs and malformed source refs.

**Choice A:** FE adds one exact presence rule for a branch/case group with non-null `arm`, certainty `static`, `sourceRef:null` and `evidenceIds:[]`, producing typed `INVALID_ARTIFACT`; no semantic evidence inspection.

**Choice B:** FE validates only the specified field shapes/enums and actual references, preserving declared certainty; future CA034 MCP checks whether static evidence genuinely supports a branch/case and rejects or labels unresolved **before export**. CA031 remains blocked.

**Choice C:** Introduce new versioned inherited-evidence/coverage marker; this is outside approved CA028.

## Five genuine independent advisor positions

| Advisor                  | Perspective              | Recommendation and strongest contrary case                                                                                                                                                                                      |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ca028_qa`               | QA/security              | **A, medium confidence.** §7 directly names absent source/evidence. FE could check existing metadata without source parsing. But parent/child receipt inheritance is not defined, and §7 allocates output validation to MCP.    |
| `ca028_contract_review`  | Normative schema         | **A, narrow.** Local absence is structurally checkable and prevents unsupported static painting. But future producer could supply legitimate evidence on parent/child and keep arm-local fields empty.                          |
| `ca028_impl`             | Adapter development      | **A, conditional.** Existing fields permit simple absence check; no need to assess receipt truth. But it could be an unstated cross-field rule that violates FE-only shape/ref boundary.                                        |
| `geometry_analyst`       | Graph visualization      | **B.** FE cannot determine evidence provenance or inheritance from metadata; §7 says producer validates/relabels before export. Misleading static paint before producer verification is a risk, so CA031 must remain blocked.   |
| PM `/root/pm_fe_phase_a` | Delivery and integration | **B.** Owner-approved frontend only renders; group `sourceRef` nullable and evidence IDs may be empty. Semantic proof is CodeGraph/MCP responsibility. B must retain all schema/ref rejection and CA034 native validation gate. |

Initial split: three A, two B. This was not decided by majority count.

## Anonymous peer-review stage — five actual independent reviews

Advisors received anonymized P1–P5 statements in differing lenses: P1=A explicit §7 invalid metadata; P2=B FE schema/reference only and parent receipt possibility; P3=A exact narrow four-field predicate; P4=B §7 future producer owns evidence; P5=A avoid ungrounded static paint. Their independent peer reviews:

1. **R1 QA:** A's §7 invalid row is strong, and a field-presence check is not source parsing. Strong B rebuttal: group evidence could legitimately be inherited, so a local-empty rejection could overconstrain future producer.
2. **R2 contract:** A may distinguish metadata absence from evidence truth, but parent-only support remains an unresolved compatibility risk. Negative mock→static arm fixture distinguishes options.
3. **R3 implementer:** A can remain narrow and never relabel; B correctly observes producer-owned output validity. Decision depends on whether §7's row is a _FE_ structural condition, not merely a producer export rule.
4. **R4 geometry:** B strongest on explicit FE/MCP split. A's apparent structural presence check embodies an undocumented source-evidence locality policy. Mandate CA034 fixture and keep CA031 blocked.
5. **R5 PM:** B strongest on owner boundary; a valid parent-proof arm and an ungrounded arm may have identical **local** fields, so FE cannot distinguish truth. A risks conflating missing local receipt with missing legitimate evidence.

## EDO provisional position and three actual challenge/rebuttal rounds

**Provisional EDO:** Lean B, despite advisor A majority, because the user made semantic/evidence decisions server-owned and §3 has no arm-local proof mandatory condition. Preserve the explicit §7 invalid example as a **producer gate** rather than discarding it.

1. **EDO challenged QA/A:** Why is arm-local absence structural rather than FE evidence sufficiency, given nullable fields and undefined inheritance? **QA live rebuttal:** §7 supplies a conditional example; A tests only declared support channels, not quality of CodeGraph proof. QA conceded B's serious possibility of valid parent/child support and accepted EDO B if CA034 rejects unsupported export.
2. **EDO challenged PM/B:** How does B prevent confident but unsupported static painting, and which real gate protects users? **PM live rebuttal:** CA034 must test a static case/branch without any grounded CodeGraph relationship or receipt (reject `INVALID_ARTIFACT` or produce `certainty:'unresolved'` with reasons **before export**); test legitimately supported parent/arm evidence separately. CA031 live cutover stays blocked pending real V3 JSON, native provider tests and completion. FE still rejects unknown receipt IDs, invalid source refs, invalid enum and membership. Residual future compiler error risk disclosed.
3. **EDO challenged contract/A:** If §7 explicitly assigns output certainty to MCP, would A falsely reject static arm grounded via parent/child evidence? **Contract advisor live rebuttal:** A is a metadata integrity rule, not proof evaluation; producer could attach receipt locally. But advisor acknowledged an approved inherited-proof fixture/contract rule would reverse them to B, and currently no explicit locality guarantee exists.

## Final EDO decision — B for CA028, producer gate CA034

**ACCEPT B for this approved FE-only CA028 phase.** A ready V3 JSON may have a `branch`/`case` arm with locally null `sourceRef` and empty `evidenceIds` provided all mandatory fields are valid; the adapter validates actual source/receipt references, uniqueness, graph/Visit/playback integrity, enumerations and document atomicity **but does not assess whether the producer's `static` claim has sufficient CodeGraph evidence**. It does not add certainty flags, relabel static/mock/unresolved, inspect source text, inspect receipt meaning or invent inheritance. This is the narrower behavior consistent with the explicit user and normative FE/MCP separation.

**REJECT A in FE now:** the specific local evidence-presence predicate would establish an unapproved _locality_ rule for optional group fields. Preserve three advisors' explicit §7 invalid-row concern as material dissent. **REJECT C now:** it changes wire contract/semantics and needs separate design/user approval.

**Mandatory CA034/MCP future acceptance** (record in task ledger, do not implement now): Given a branch/case arm claimed `static`, the future producer must compare CodeGraph evidence/approved ancestry against the claim; reject unsupported certainty as `INVALID_ARTIFACT` or emit explicit `unresolved` plus source/evidence-gap diagnostics **before exporting the single ready JSON**. Test unsupported arm with null own source/evidence and no supporting parent/provider receipt; grounded parent or local receipt; missing receipt ID; mock/unresolved uncertainty. CA031 live player cutover is blocked until real CA033–CA035 producer artifact + native provider validations exist and are independently verified. CA028 fixture-only PASS does not certify truthful static provenance.

**Post-decision CA028:** no static-arm code change authorized. Separately observed raw `TypeError` from coercing untrusted enum/selector inputs is an unambiguous typed-error contract defect, fixed in CA028 with independent RED→GREEN tests; it is not this Council's evidence-policy choice. No merge, release, publish, deployment, cleanup, backend code or live-player change is authorized.
