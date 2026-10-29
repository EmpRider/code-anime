# CA028 engineering Council addendum — V3 source Visit completeness

Date: 2026-10-29. Engineering Decision Owner (EDO): TL `/root/pm_fe_phase_a/tl_fe_phase_a` under PM `/root/pm_fe_phase_a`, BA `/root`.

## Decision boundary and authoritative evidence

The approved FE Phase A CA028 validator accepts a self-contained, producer-authored V3 JSON document. This Council reviewed a **contested structural validation interpretation**, not permission to invent source data or change the wire schema. The applicable skill was the 2026-10-29 task-pinned `EmpRider/claude-skills-llm-council` snapshot recorded in [FE Phase A skill provenance](fe-phase-a-skill-provenance-20261029.md); the main [kickoff Council](fe-phase-a-kickoff-council-20261029.md) and actual user design/plan/phase approvals in the [V3 task ledger](../../.agent-tasks/code-anime-v3-design-20261029.md) remain separately recorded.

- **OBSERVED normative §1/§5:** each ready variant contains full prepared source/Visit metadata; `sourceVisits[].stepIds` are chronological 1-based numeric frame steps and repeated visits must be retained; `frame.sourceRef` is an explicit producer-authored file and inclusive line range.
- **OBSERVED normative §7:** a `Visit list not matching actual frame source` is an invalid playback index. Missing/invalid references reject the entire ready root, not just one variant.
- **OBSERVED adapter RED before ruling:** removing all Visit rows or one sole Visit step from a fixture with sourced frames was accepted. Declared Visit rows with incompatible file/range/call were already rejected.
- **UNVERIFIED future producer question:** normative text does not explicitly state whether a producer may intentionally omit an otherwise sourced frame from the Visit index. No such `nonVisitable`/sparse-index marker is in V3, and no real MCP V3 producer or user browser visual has been verified. No CA031 live cutover is authorized.

## Independently reasoned advisor proposals (five real agents)

Advisor identities are stored here for accountability; peer-review packet below was anonymized to participants.

| Advisor                      | Lens                              | Independent proposal and strongest objection                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — `ca028_impl`             | FE contract implementation        | **A**: every sourced frame must appear in at least one matching supplied Visit row. This compares existing indexes; no synthesized record. Objection: intentional sparse producer indexes would be rejected; no explicit opt-out currently exists. |
| B — `ca028_qa`               | Independent security/QA           | **A**: actual read-only mutation accepted both `sourceVisits=[]` and omitted step, silently losing navigability. Objection: contract does not explicitly quantify all sourced frames as Visit-addressable.                                         |
| C — `geometry_analyst`       | Graph/navigation presentation     | **A**: multi-frame repeated loop Visits may share one row (for example `[2,7]`), so minimum reverse coverage need not force a per-line record. Objection: multiline and unscoped-call matching remains somewhat permissive.                        |
| D — `ca028_contract_review`  | Normative schema/integration      | **A (inferred)**: full prepared Visits plus §7 mismatch rejection favor missing-step invalidity. Objection: no literal reverse-completeness sentence, hence potential false rejection of deliberate sparse indexes.                                |
| E — PM `/root/pm_fe_phase_a` | Delivery/future MCP compatibility | **B initially**: validate only supplied Visit rows until producer contract explicitly specifies sparse-versus-exhaustive coverage. Strongest risk of B: silently accepting an unusable Visit index despite a sourced trace.                        |

Alternatives: **A** minimum reverse frame coverage from existing data; **B** forward-only Visit row checks and future producer completeness gate; **C** new explicit sparse/coverage field and version, outside approved CA028 scope. All advisors opposed inventing `sourceVisits`, modifying source semantics, adding an unapproved field, or requiring one row per source line.

## Anonymous peer-review round (five actual reviews)

Five positions were distributed as anonymized `P1–P5`, without identifying their origin: P1=A minimum matching row; P2=A missing Visits break navigation; P3=B sparse/multiline possibility; P4=A shared repeated Visit row; P5=A §7 index-consistency interpretation. Independent reviews:

1. **R1 — implementer:** P1/P2/P4/P5 outweigh P3 because deleting all rows destroys Visit targets; P3's intended-sparse counterexample remains unresolved. Require shared repeated/multiline positive fixtures.
2. **R2 — QA/security:** Prefer A medium-high confidence; P3 correctly notes source-bearing frames might not always be visitable, but no current opt-out signal; do not add per-line expansion.
3. **R3 — contract reviewer:** P3 is the strongest compatibility risk. A's single matching row per frame is reference consistency, not execution reconstruction; missing a repeated step in Visit-next exposes failure.
4. **R4 — geometry advisor:** P4/P1 strongest; P5 overstates §7 if read alone. Recommends **conditional A** and explicit documentation of `all nonnull-source frames covered` to avoid false assumptions; precise fixture with two calls and one missing sourced step.
5. **R5 — PM:** P3 gives the strongest strict-contract objection; §7 alone can mean checking _only supplied_ rows. If A wins, it must be narrow and evidenced, with no FE-derived Visit row or canonical multiline line selection. PM initially still preferred B.

## EDO provisional position and actual challenge/rebuttal

**Provisional EDO:** conditional A, given §1 complete Visit promise and real data-loss example, but with exact minimum mapping and P3/B dissent preserved.

1. **Challenge to PM/B:** Which normative example permits deliberate `sourceVisits=[]` alongside sourced frames, and how would B preserve required Visit parity without an opt-out marker? **PM actual rebuttal:** conceded no such example or marker; accepted minimum A as purely structural, while rejecting per-line exact equality. Sparse Visit policy, if genuinely intended later, needs versioned explicit contract before CA031.
2. **Challenge to geometry/A:** Can A handle multiline ranges, calls, unscoped `callId:null`, repeated loops and null source without inventing an anchor? **Geometry advisor actual rebuttal:** matching existing row line anywhere inside inclusive `[line,endLine]` and exact/null call, with shared `[2,7]` allowed, solves these using supplied data. A null `sourceRef` imposes no reverse obligation; a Visit pointing at null source still fails. Deliberate sparse producer remains unknown.
3. **Challenge to implementer/A:** Is the rule business inference or a new field? **Implementer actual rebuttal:** it compares two precomputed producer indexes only; demonstrated positive multiline frame line 4–6 matched by Visit line 5, repeated loop `[2,7]`, and negative omitted Visit row. Explicitly acknowledged sparse-index risk, disfavored C outside authorized scope.

## Final EDO resolution — minimum structural Option A

**ACCEPT A under the already approved V3 full-Visit index interpretation.** For each `playback.frames[i]` with non-null `sourceRef` and step `s`, there must be at least one existing producer-supplied `sourceVisits` row where:

- `stepIds` contains `s` (1-based numeric step, not opaque frame ID);
- `fileId` equals frame `sourceRef.fileId`;
- Visit `line` is within inclusive frame source `line..endLine`;
- Visit `callId` is `null` (producer-declared unscoped) or equals frame `callId`.

Keep forward validation of every declared Visit step's matching source/call. A `sourceRef:null` frame creates no reverse Visit obligation. A single Visit row may contain many loop steps; one multiline frame need not have one Visit per source line. Do not synthesize entries, choose canonical source lines, deduplicate repeated Visits, look up another variant, interpret source code, or create a frontend navigation/flow engine.

**Reject B for present V3** because it would allow an entirely omitted index despite declared source-bearing frames and no explicit sparse Visit declaration; preserve B's strongest compatibility objection. **Reject C now** because a new `nonVisitable`/sparse-coverage field would require separate versioned contract design and owner permission. This interpretation is accepted for CA028 fixture validation, not proof that a future MCP V3 producer or CA031 browser has parity.

Required tests: RED omitted sole Visit row/step or empty Visit list for sourced frame; GREEN multiline in-range line, repeated loop `[2,7]`, `callId:null` unscoped row, `sourceRef:null` no reverse obligation. Negative out-of-range line and mismatching non-null call already validated. All malformed ready variants still reject atomically as `INVALID_ARTIFACT`. No arbitrary depth/node caps or frontend source analysis.

**Residual future gate:** CA034 producer must emit complete Visit targets under this interpretation. If the owner/producer later intentionally specifies sparse Visit indexes, reopen Council and secure human approval for an explicit versioned contract before CA031 live cutover. This decision does not authorize MCP changes, CA031, merge, deploy, publish or task-ledger deletion.
