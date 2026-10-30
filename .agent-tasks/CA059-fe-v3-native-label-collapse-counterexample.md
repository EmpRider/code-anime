# CA059 — FE V3 native ELK label reservation fails valid collapse/parallel edge

- **Priority:** P0 — FE V3 CI and genuine Chromium acceptance blocked.
- **Status:** `BLOCKED / ISSUE-FIRST / ROOT_CAUSE_UNCONFIRMED`. This file must be committed and independently verified through the GitHub plugin before any CA059 production or test instrumentation change. No fix is authorized by this issue record alone.
- **Branch:** `fix/react-layout-collapse`.
- **Owner:** TL with exclusive geometry/renderer investigation specialist, independent QA and semantic-contract reviewer; PM delivery; BA GitHub-plugin relay.
- **First observed:** GitHub Actions run [41083389952](https://github.com/EmpRider/code-anime/actions/runs/41083389952), after CA058 intermediate code/test commit [`faaad43`](https://github.com/EmpRider/code-anime/commit/faaad43eb2151667520bc7954a3d6347f50965a3).
- **Dependencies:** CA028 graph adapter, CA052/CA053 IDs, CA054 Worker ACK, CA055 collapse projection, CA057 cache integrity, CA058 native ELK label reservation, CA030 isolated X6/Worker preview. Keep CA058 and CA030 `IN_PROGRESS`, not `DONE`.
- **Design references:** `.agent-tasks/CA058-fe-v3-native-chromium-layout-unavailable.md`, `docs/v3/ca058-label-council-20261030.md`, `docs/v3/implementation-plan.md`, `docs/v3/flow-scene-json-contract.md`.

## Observed versus expected

- **Observed (verified):** The first CA058 post-commit GitHub Actions Node 22/24 `npm run check` jobs fail only the newly added official-ELK/strict-X6-renderer preflight in `tests/v3-scene-geometry.test.mjs:1545–1615`. The test throws `No collision-free V3 edge label position for e:yw` from `public/v3-scene-diagram.js:364` (test call near line 1597). The run reports 364 tests, 361 passing, 1 failing, 2 skipped; other CA058 Unicode/Arabic and 10,000 native edge-label input assertions pass. Browser conclusions must be recorded separately when available.
- **Graph fact (verified):** Original edge `e:yw` is `Y→W`, label `return-to-sibling`, in the synthetic `collapseScene` fixture; existing CA055 official ELK tests validate this fixture's original IDs, projected edges and routes. It is a valid graph, not a malformed input or a permission to drop the label. The new CA058 matrix iterates baseline, nested, then collapseScene expanded/inner-collapsed/outer-collapsed in horizontal and vertical orientations. The failing per-case state and obstacle coordinates are **not printed** by the current CI error, so the exact state is **unverified**. Expanded-horizontal is the earliest possible failing case, not an observed fact.
- **Expected:** Each existing visible projected original edge retains its exact ID/endpoints/semantic label and obtains a genuinely visible, collision-free label in the real ELK→X6 scene, while valid impossible-placement cases remain explicitly fail-closed. No fabricated or silently omitted semantics, no runtime execution of analyzed user code, no legacy-player regression.

## Current root-cause confidence

1. **Verified boundary:** `public/v3-scene-geometry.js` now includes bounded native ELK `labels` metadata on the existing projected edges (CA058). The independent `reserveRouteLabel` collision validator in `public/v3-scene-diagram.js` still rejects at least this `e:yw` route with `null`; its caller correctly throws. This is a genuine counterexample to claiming the CA058 Option-D implementation covers all acceptance fixtures.
2. **Inferred, not proven:** `return-to-sibling` is 17 ASCII code units, so the current ELK label reservation is approximately 122×26 px; the renderer tries finite route-tethered candidate positions offset from a route (10 px) and rejects obstacles with additional clearance (6 px). Reserving the label rectangle alone may not guarantee sufficient off-route candidate space; small route segments or nested/parallel obstacles might also matter. Actual failing ELK sections, label coordinates, obstacle bounds and tested candidate rectangles have not been captured.
3. **Not supported:** A Worker registration/CSP failure, malformed fixture, optional-label semantics, or generic spacing fix is not established by the current Node test. Do not weaken the strict renderer validator, hide label text, fabricate edges, or substitute static/mock screenshots to make tests pass.

## Required investigation and decision gate

1. First instrument a narrowly scoped **diagnostic-only** real-ELK test to identify the exact `variant × collapse state × orientation`, the `e:yw` route sections/points, original source/target IDs, group/node/other-label obstacles, required label box and each rejected renderer candidate. Preserve the original failing assertion and test fixture; establish a deterministic RED counterexample. Diagnostic outputs must be bounded, sanitized and removed or scoped before completion.
2. Independently reproduce the exact collision geometry and challenge a test-harness mismatch before treating any padding change as a permanent fix. Check actual native ELK label box/placement versus renderer candidate envelope, nested group headers, interleaved parallel edges and segment-length constraints. Record observed and inferred separately.
3. Convene a **fresh real engineering Council** with five independent advisors, anonymized peer reviews, EDO provisional decision, targeted technical challenge/rebuttal and durable verdict for any new remedy decision. Compare a narrow bounded native-ELK Option-D dimension/padding refinement (only if a falsifiable measured countertest proves it) against the previously deferred route-tethered callout Option B. Do not silently implement B; if the required remedy materially changes UI design, route through BA for separate human design and plan approvals.
4. Commit/push/independently verify this CA059 issue-first record via GitHub plugin **before any code or test instrumentation**. Then use TDD, exact-file ownership, independent QA/contract review and one task-specific source/test commit. BA alone relays approved remote writes. Any GitHub plugin error (including a failed path lookup) means immediate stop and user notification; no Git CLI fallback.

## Acceptance and verification

- New deterministic RED→GREEN reproduction for the genuine `e:yw` counterexample, with explicit case/orientation and measured route/obstacle geometry. All earlier baseline/nested four preflights remain green.
- Official ELK + unchanged strict V3 renderer place visible labels for valid expanded/inner/outer collapse, horizontal/vertical and parallel-original-edge cases without changing original edge IDs, endpoints, provenance or order. Impossible routes still fail closed explicitly.
- Preserve Unicode (Sinhala, Arabic, CJK, emoji), multiline, huge-label resource bounds, 10,000-edge **input-preparation** test and representative performance evidence; do not misreport input-preparation speed as full X6 rendering throughput.
- Run focused Node RED→GREEN, syntax, formatting, full `npm run check`, package/privacy verification, and real GitHub Actions **5/5 jobs PASS**, including all native Chromium cases. Inspect real Worker registration/layout, X6 SVG, strict CSP, browser-console errors, and six desktop/orientation screenshots (900×600, 1440×900, 1920×1080) plus collapsed screenshot. Upload alone is not visual acceptance; examine label glyph bounds, overlaps, clipping and readability.
- No changes to legacy `public/diagram-label-placement.js`, legacy player, MCP/backend, CI workflow, Worker/CSP policy or CA031 live cutover without a separately evidenced and approved necessity. Do not mark CA059, CA058, CA030 or FE V3 `DONE` on unit evidence or an intermediate push alone.

## Evidence and next state

- CA058 reviewed source/test bytes prior to plugin commit: source SHA-256 `cb8fa8367cc6530054a4697207621c53eb0247a184e56d0f9be488fd4289163f`; test SHA-256 `832ea2647dcdfc11b6afdc39ff14b5e8cb0f65581f31592efc5e003c856514aa`. Review verdict was conditional GO for CI only.
- CA059 remains **BLOCKED / PENDING_ROOT_CAUSE_AND_COUNCIL** until issue-first remote push and reproducible geometry evidence. Preserve all existing task files pending explicit user completion approval.
