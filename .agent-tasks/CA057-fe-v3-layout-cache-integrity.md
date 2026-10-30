# CA057 — FE V3 semantic graph drift aliases layout cache under unchanged artifact metadata

- **Priority:** P1 (correctness and stale-geometry/cache isolation).
- **Status:** `READY_FOR_COUNCIL / ISSUE-FIRST`; no CA057 code may be pushed until this ledger is committed and verified and the engineering Council renders its verdict.
- **Owner:** TL/FE geometry engineer with exclusive file lock, independent QA and contract reviewer; PM delivery; BA GitHub plugin relay.
- **Branch:** `fix/react-layout-collapse`.
- **Dependencies:** CA028 graph validation, CA052 private root fix, CA053 global graph IDs, CA054 Worker protocol fix; CA055 collapsed presentation projection currently in isolated development; CA030 isolated preview/browser gate later.
- **Affected paths:** `public/v3-scene-geometry.js`, `tests/v3-scene-geometry.test.mjs` (CA055 isolated stage `/tmp/ca055-work-cukd8M`; no remote CA057 implementation committed).
- **Design references:** `docs/v3/implementation-plan.md` CA029–CA030, `docs/v3/ca055-projection-council-20261030.md`; CA057 independent Council document will be added before the implementation gate.

## Observed versus expected

- **Observed independent QA RED:** In the CA055 projected geometry staging, two valid ready variants sharing the same declared `artifact.id`, `revision`, `sourceHash`, variant ID and presentation measurements but containing **different semantic node/group/edge topology** produced identical `topologyKey`. The regression test `same artifact metadata cannot alias a changed semantic topology` failed at `tests/v3-scene-geometry.test.mjs:857` (35/36 named tests PASS, 1 FAIL): identical cache keys could return stale positions/routes for a structurally different graph.
- **Observed independent contract-review repro:** `createV3SceneLayout` also returns the **same mutable cached result object** on an unchanged/cursor-only request. A synthetic FakeWorker returned a valid layout; the consumer set `result.nodes[0].id = 'CORRUPTED_BY_CONSUMER'`; the next cached request returned that mutated ID with `workers=1` and `sameObject=true`, although the original variant still contained `node:one`. This is a separate mechanism within the same cache-integrity failure class.
- **Expected:** A layout cache entry may be reused only when the effective presentation topology and all geometry-affecting inputs are identical. Even incorrectly reused artifact metadata must not cause silent semantic graph aliasing. Playback cursor/highlight-only updates still **must not** relayout. No business inference or source execution is permitted.
- **Scope distinction:** CA055's approved task explicitly listed variant/revision/collapsed groups/card measures/orientation/viewport in its key, but did not define same-metadata semantic-graph drift. This separately discovered cache-correctness invariant is tracked as CA057 under mandatory issue-first rules.

## Council questions — no design preselection

1. **Candidate A:** Stable deterministic structural graph fingerprint in `topologyKey` over original supplied nodes/groups/edges IDs, group/parent paths and edge endpoint relations (and only other geometry-affecting original graph fields), plus already approved presentation dimensions/state. Must be pure presentation cache identity, not an inferred graph transformation.
2. **Candidate B:** Trust supplied artifact revision/`sourceHash` as a contractually unique graph snapshot. Would be smaller/faster, but assess behavior when a validated payload violates this assumption.
3. **Candidate C:** Reference identity or `WeakMap` versioning for variant graph objects. Test cloned equivalent objects, in-place graph changes and deterministic replay/cursor-only updates.
4. **Candidate D (for cached-result integrity):** Return defensive deep-cloned geometry or deeply freeze cached output, with explicit ownership rules. Evaluate clone cost and object identity expectations in existing cursor-only tests; shallow copies are insufficient for nested arrays/points.
5. Evaluate complete-graph serialization versus canonical structural subset, collision/ambiguous ordering/Unicode/JSON safety, O(n) cost, large deep nested flows, predictable Worker cancellation and cache memory, plus explicitly distinct original edge identity.

The Council must obtain five genuine independent advisor positions, five anonymized independent peer reviews, an EDO provisional choice and targeted challenge/rebuttal before final approval; document objections and falsifiable tests. Until then the already locally staged experimental alias fix is **unapproved for remote commit** and must not be silently included in CA055 source relay.

## RED-to-GREEN acceptance

- Preserve the exact synthetic RED test: same metadata but different valid graph topology yields distinct layout identity; a cache hit must not reuse stale semantic routes.
- Preserve the independent FakeWorker mutation repro as RED: modifying a caller-visible geometry object (nested node ID, edge sections/points or group bounds) must not poison the next cached response or the original semantic variant. Choose an explicit immutable/shared-result or defensive-copy contract; assert it under cursor-only cache reuse and Worker cancellation.
- Same semantic topology under a new JavaScript object/clone and identical measurements should allow stable key; if ordering is nonsemantic, canonicalize deterministically or document why the adapter order must count.
- Cursor/frame/active-edge changes alone preserve layout identity and trigger zero new ELK Worker jobs. Variant/revision, collapse, Values/card measures, both viewport dimensions, orientation and group header/font metrics continue to invalidate correctly.
- Preserve original node/group/edge IDs and metadata; parallel edges stay distinct; no novel source/branch relationships, HTML interpretation, or change to MCP/legacy player.
- Run focused Node TDD with a genuine fail-before-fix assertion, independent contract/QA review, repo-config Prettier check, applicable `npm run check` and GitHub Actions five green jobs; obtain native ELK/Chromium evidence appropriate to CA029/CA030 without falsely claiming complete UI acceptance.

## Mandatory task management

1. BA GitHub plugin creates and independently fetch-verifies this task file **before** any CA057 implementation commit. Council decision and issue evidence must be persisted to GitHub.
2. Reserve exclusive CA057 author ownership; separate CA055 and CA057 task-level source/test commits with detailed descriptions and remote blob SHA verification. Do not bundle a hidden CA057 solution into CA055 and call it one task.
3. Only mark CA057 `DONE` when focused test, independent QA, remote CI and final task ledger updates pass. Keep CA055 and CA030 statuses honest; Chromium visual remains pending until actual tests/screenshots.
4. **GitHub plugin hard stop:** if plugin fails, stop all work immediately, notify BA/user; no Git CLI substitute.
