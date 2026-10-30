# CA059 Engineering Council — measured ELK/X6 label collision diagnosis before a permanent remedy

- **Date:** 2026-10-30 (Sri Lanka); **branch:** `EmpRider/code-anime` / `fix/react-layout-collapse`.
- **Issue-first gate:** `.agent-tasks/CA059-fe-v3-native-label-collapse-counterexample.md`, independently verified GitHub-plugin commit `c07b3fcd32e74771147bc80502373ab10b642509`.
- **Source evidence:** CA058 intermediate commit `faaad43eb2151667520bc7954a3d6347f50965a3`, GitHub Actions [run 41083389952](https://github.com/EmpRider/code-anime/actions/runs/41083389952); strict official ELK/X6 test fails `No collision-free V3 edge label position for e:yw` at `public/v3-scene-diagram.js:364`/test around line 1597.
- **Engineering Decision Owner:** FE V3 Tech Lead (AI-proposed engineering recommendation, not a human design/security sign-off).
- **Council execution:** Five genuine independent advisor agents (A1–A5), then five anonymized blind peers (R1–R5) in separate waves, followed by targeted EDO challenge/rebuttal with advisors A5 and A1. No advisor had the EDO provisional note or others' output while forming independent positions.
- **Decision:** **Conditional GO to D0 only**: time-bounded, bounded-output, test-only real ELK/strict-X6 collision diagnostics and controlled *non-shipping* one-factor experiments. **NO GO to any permanent D1 padding, D2 renderer correction, or B callout yet.** Preserve existing strict renderer failure. This Council record must be independently committed/verified before the new CA059 test instrumentation commit. Do not mark CA059/CA058/CA030 `DONE`.

## Evidence, root-cause confidence and blast radius

1. **OBSERVED:** All four Node check jobs fail the same new CA058 official ELK/X6 preflight. Existing original `e:yw` Y→W label `return-to-sibling` cannot be assigned a collision-free visible position by `renderV3Scene`, even with native ELK label dimensions. `collapseScene` expanded/horizontal is the first failing state by deterministic sequential iteration and original ID. Existing CA055 fixture geometry and projection tests establish a valid supplied graph.
2. **OBSERVED evidence gap:** CI logs contain no flattened ELK route sections, obstacle boxes, prior label reservations or candidate rejection coordinates. The local scratch environment lacks `elkjs`; the exact geometric rejection cause remains **UNVERIFIED**. No claim that native padding alone or callouts are required is supported.
3. **INFERRED competing explanations:** (D1) native label reservation lacks off-route clearance; (D2) renderer compound coordinate transform, own-label obstacle classification or finite candidate enumeration is wrong; (B) after correct transforms/candidates and bounded native reservations, a valid route still cannot safely host a label. These have materially different blast radii.
4. **Severity/impact:** P0 for isolated FE V3 acceptance, not a demonstrated deployed incident. D0's blast radius is a test-only bounded diagnostic; D1 can inflate compound canvas and reroute unrelated edges, D2 changes strict rendering behavior, and B introduces a new UI/UX presentation contract requiring human design and implementation-plan approvals.

## Options considered

| Option | Benefit | Risk and verdict |
| --- | --- | --- |
| **D0: bounded test-only diagnostic** | Distinguishes coordinate, obstacle, candidate and clearance causes without shipping behavior changes; preserves fail-closed RED. | Extra CI cycle and artifact size, mitigated by caps/time-box. **GO now.** |
| **D1: finite native ELK padding/refinement** | Potentially smallest permanent source fix if lack of clearance is measured. | Unknown efficacy, canvas expansion, dense/parallel regressions. **NO GO until measured RED→GREEN.** |
| **D2: renderer-local transform/classification/candidate correctness** | Narrow permanent fix if renderer falsely rejects legal route. | May affect all visible edge labels and strict safety. **New hypothesis only; no source authorization yet.** |
| **B: bounded edge-tethered callout** | Contingency for proven valid impossible native placement. | New clipping, edge association, hit-target and accessibility UX; requires user design/plan approvals. **NO GO now.** |
| **A/C global spacing or silent omission** | Simpler superficial workaround. | Previously falsified spacing or violates visible semantic truth; **rejected**. |

## Five independent advisor positions

1. **A1 Systems/Geometry Architect — D0:** Measure original sections, compound transforms, obstacle boxes, candidate rejection reasons; native box alone cannot guarantee off-route placement. D1 only with measured finite success; B later with human design approval.
2. **A2 Implementation Lead — D0:** Smallest safe surface is focused test-only failure instrumentation; avoid broad source edits or invisible semantic changes; test all projected identities and preflight variants.
3. **A3 Reliability/Security/Performance — D0:** Bounded deterministic logs, original semantic IDs, strict failures, no security/CSP/backend change; distinguish 10,000-edge ELK *input* time from full renderer performance. D1 blind padding could increase canvas/CPU without resolving route policy.
4. **A4 Quality/Verification Lead — D0:** Preserve exact RED, capture layout/collision state and run bounded discriminating experiments; acceptance needs full matrix, Unicode, parallel, browser pixel QA and 5/5 CI.
5. **A5 Devil's Advocate — D0 plus controlled simultaneous experiments:** Urgency favors collecting causal evidence and tightly bounded one-factor test-only D1 probes in the same CI investigation, without promoting a one-case green to production. B's tether/accessibility risks remain high.

## Five anonymized blind-peer findings

The independent advice was anonymized and reordered P1–P5 before each peer received it, without author roles. No vote is treated as causal evidence.

1. **R1 — preferred P2:** A time-bounded diagnostic plus one-factor experiments balances urgency and proof. Added compound-coordinate and renderer candidate search as underexamined alternatives; warned CI cycles and independent radii sweeps can confound a native fix.
2. **R2 — preferred P2:** Keep baseline and change one variable at a time; a coordinate transform/candidate enumeration correction might be narrower than D1/B. Require full X6 dense-render performance and pixel review.
3. **R3 — preferred P3:** Test parent/local/world coordinates and whether the edge's own ELK label reservation is misclassified as an obstacle or transformed twice. Don't infer native infeasibility before checking false collision arithmetic.
4. **R4 — preferred P2:** Challenge unproven assumption that larger ELK dimensions improve renderer placement. Independently recompute collision predicates in one coordinate space.
5. **R5 — preferred P3:** Parent/child coordinate reconciliation and specific obstacle IDs can falsify D1; callouts require demonstrated native impossibility and explicit human design approval.

## EDO provisional position, challenge and rebuttal

**Provisional (written before advisor responses):** D0 diagnostic first; correctness, semantic truth, security and causal geometry outrank speculative speed. The strongest mind-changing evidence would be a measured bounded D1 RED→GREEN with acceptable growth, or provable native infeasibility after correcting coordinate/candidate logic.

**Challenge 1 — urgency versus causal isolation:** A5 proposed D0 with concurrent disposable D1 probes; R1/R2 objected that changing ELK margins and renderer radii together obscures cause. **A5 rebuttal:** conceded uncontrolled two-axis sweeps confound. Proposed unchanged baseline capture, then at most two finite native-label-height increments each in independent layouts, restore baseline, and only if evidence implicates candidate reach perform a separate bounded candidate-radius experiment; stop on excessive canvas growth/new overlaps. **EDO resolution: ACCEPT with constraint.** One diagnostic CI may include independent, labeled, one-factor, non-shipping probes if they remain test-only, bounded and preserve original failing assertion. No D1 production authorization.

**Challenge 2 — missing third permanent alternative:** Blind peers noted renderer coordinate-transform, self-obstacle or candidate enumeration bugs are not D1 nor B. **A1 rebuttal:** explicitly named D2 as a conditional future remedy, proposed independent coordinate-frame recomputation, obstacle IDs/types (including own reservation), and legal route intervals. D0 can distinguish among D1, D2 and B without changing renderer now. **EDO resolution: ACCEPT.** Expand the hypothesis map, not code scope. A proven renderer-local defect must return to Council for a permanent source decision.

**Challenge 3 — diagnostic leakage/performance:** A3 warned about unsanitized graph text and O(E×candidates) dumps. **EDO resolution: ACCEPT.** Capture only targeted synthetic fixture IDs/geometry, bound event count and serialized bytes, exclude private analyzed project sources; keep large-graph benchmark separate from local candidate dump. Explicitly preserve fail-closed throw.

**EDO final recommendation:** **D0 evidence-only GO** as a bounded engineering experiment. No full remediation choice yet. Contrary to a simple majority, this recommendation rests on missing causal coordinates and on the ability to falsify D1/D2/B with one controlled run. Five advisors independently favored diagnostic first; blind peers added important renderer-local alternatives. Human approval for any new UI callout remains outstanding.

## Authorized next implementation package (diagnostic only)

1. **Exclusive scope:** `tests/v3-scene-geometry.test.mjs` official ELK/X6 preflight, and at most a new isolated test-only helper in `tests/` if needed. No production geometry, renderer, shared legacy helper, Worker, CSP, MCP or CI workflow change in this phase.
2. Preserve original failing `e:yw` assertion. On exception, emit a bounded sanitized diagnostic: exact variant/collapse/orientation; original edge ID/endpoints/label measurement; raw ELK sections and flattened points with coordinate-owner tags/ancestor translations; nearby original node/group-header/other-label obstacle boxes, previous reservations, renderer candidate rectangles/rejection reason IDs and collision arithmetic if calculable in test-only code. Cap output, e.g. one target edge, at most 128 obstacles and 32 candidates, numeric finite coordinates, at most 16 KiB of serialized diagnostic text; avoid arbitrary project/user text.
3. Optional one-factor non-shipping probes may reuse the same CI investigation only **after baseline capture**: at most two independently tagged finite native-label-reservation increments and, separately only if justified, one renderer candidate interval/radius experiment in a test-only copy. Do not mutate live application constants or suppress strict RED; if unavailable without production changes, omit probes and report limitation.
4. Focused syntax/format/tests and independent QA/contract review of frozen diagnostic bytes. BA mechanically commits/pushes one CA059 task-specific instrumentation commit through the GitHub plugin, verifies remote blobs/HEAD and reads GitHub Actions results. Any plugin error triggers immediate STOP. Keep task `IN_PROGRESS` and record exact case geometry before requesting another Council remedy verdict.

## Exit criteria and revisit trigger

- Evidence shows exactly which collision rule/coordinate frame rejects `e:yw`; original strict RED remains observable. No unrelated test weakening or fabricated edge.
- If measured native clearance resolves all cases with bounded growth, reconvene Council for D1 source fix; if renderer incorrectly transforms or classifies obstacles, reconvene for D2; only if native and renderer correctness are exhausted consider B with separate human design and plan approval.
- Full 5/5 CI and Chromium screenshot pixel review remain eventual CA058/CA059/CA030 gates; **this D0 diagnostic stage is not a completion claim**. CA060 strict CSP issue is separate.
