# CA057 engineering Council — V3 layout cache identity and result ownership

- **Date:** 2026-10-30.
- **Repo/branch:** `EmpRider/code-anime` / `fix/react-layout-collapse`.
- **Remote issue-first gate:** `.agent-tasks/CA057-fe-v3-layout-cache-integrity.md`, verified commit `fc2e11908f66b586cc572bfcf8620728ab36a8b2`.
- **Scope:** FE V3 presentation-only cache in CA029 geometry; no backend, legacy player, CA031 cutover or semantic inference.
- **Council provenance:** Five genuinely independent role-specific advisors, five subsequent anonymous peer reviewers, EDO's provisional position recorded to PM _before_ advisor outputs, and two targeted EDO post-peer challenges answered by distinct peers. These are paraphrases of received statements, not manufactured direct quotations.

## Reproduced issue and technical boundary

Two independent read-only test teams found two cache bugs on uncommitted CA055 staging:

1. **Same metadata, different graph:** Two validated ready variants with the same artifact ID, revision, source hash, variant ID and measurements but different original edge endpoints/labels generated the same initial `topologyKey`. An independent Node test reported **35 PASS / 1 FAIL** (`same artifact metadata cannot alias a changed semantic topology`), risking reuse of stale geometry/edge metadata. The experimental staging later added a raw `readyVariant.graph` JSON key field, but that was explicitly withheld from the clean CA055 remote commit and reserved for CA057 review.
2. **Cached result mutation:** FakeWorker returned a valid layout. A consumer mutated `result.nodes[0].id = 'CORRUPTED_BY_CONSUMER'`. A cursor-only repeat returned the **same object** and the corrupted ID with only one Worker created; the validated variant still contained `node:one`. Nested route points, arrays and group geometry have the same ownership risk.

Advisors independently identified a third closely related in-flight consistency risk: `createV3SceneLayout` builds ELK input at request entry yet later flattens the Worker reply against the caller's _live_ mutable `variant`. Input mutation between Worker ACK and response can combine old routes with new semantic metadata, then cache an inconsistent object. This is treated as one CA057 cache/snapshot coherence issue, not an unrelated task.

## Anonymous candidates and original advisor round

| Anonymous candidate | Mechanism                                                                                                                                                                 | Key limitation                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **A**               | Canonical full original semantic graph/returned metadata + presentation content identity, detached per-request input snapshot, one deeply frozen shared completed result. | O(graph size) key/snapshot/freeze; requires X6 read-only compatibility.                                         |
| **B**               | Trust artifact `revision`/`sourceHash` for key and freeze output.                                                                                                         | The reproduced same-metadata different-graph RED disproves trust as sole correctness.                           |
| **C**               | WeakMap/object-reference identity for key and clone on cache hit.                                                                                                         | Fails in-place graph mutation and misses equal independently parsed clones.                                     |
| **D**               | Canonical complete detached input snapshot/key, but clone each result for every caller including first, concurrent pending and cache hits.                                | Breaks current same-result/Promise identity expectations and O(N) cloning on scrubbing.                         |
| **E**               | Cache immutable geometry only by canonical structural topology, rehydrate fresh original semantic records on every hit.                                                   | More state/provenance joins, hidden-edge/parallel route race surface; potentially valuable future optimization. |

**Five genuine advisor perspectives (verbatim agent messages were delivered to TL but only these paraphrases persist):**

1. **Performance/cache:** conditional A + detached deep-frozen D-ownership mechanism (not to confuse with anonymous candidate D's clone-on-each-hit); key must also distinguish returned labels/evidence or split semantic rehydration. Flagged 10k-flow CPU/heap and object-key insertion order.
2. **QA/security:** conditional A plus immutable cached output; explicit RED/GREEN across changed endpoints/group ancestry/labels, Unicode ID distinctions, nested point poisoning, cloned equivalents, Worker cancellation, false revision trust; preserve ELK meaningful array order.
3. **Worker reliability:** canonical content key from a single detached request snapshot, then deep clone-and-freeze final result once; identified mid-flight variant mutation/old route + new metadata race and stale Worker epoch concerns.
4. **UI/UX/playback:** conditional A + immutable snapshot/frozen result; X6 should create separate mutable cell configs, playback cursor/highlight should update overlays without calling `layout` again. Warned raw full-graph JSON on every cursor can stutter, and labels/certainty changes must not reuse stale metadata.
5. **Devil's advocate:** materially dissented in favor of clone-on-every-return (**D**) until frozen X6 consumer compatibility is proven; warned about one-entry key size, object property order, midflight caller changes and `pending===first`/`replay===geometry` test contract. Accepted a bounded-content cache and explicit performance gate.

**EDO provisional recommendation, sent before advisor outputs:** prefer **A identity plus detached immutable result ownership**, conditional on native tests, 10k benchmark and X6 compatibility; reject B and C as sole cache authorities. This was not an implementation authorization.

## Five independent anonymous peer reviews

The peer alternatives above were presented without role/author identity.

| Peer   | Independent rank/selection                                               | Strongest concern                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#1** | Initially chose **D** conditionally.                                     | Frozen public result might conflict with mutable X6; cloning each caller isolates two consumers. Needs detached call-time snapshot and GC/latency proof.                            |
| **#2** | Chose **A** conditionally.                                               | Snapshot entire ready variant before Worker; property-key canonicalization with ELK-order-preserving arrays; detach before recursive freeze; metadata label change must invalidate. |
| **#3** | Ranked **A > D > E > C > B**.                                            | Worker live-variant flattening is an independent TOCTOU risk; freeze requires detached nested input and actual X6 consumer proof; D fallback if mutation necessary.                 |
| **#4** | Ranked **A > D > E > C > B**.                                            | Snapshot/key/flatten ownership plus stable same-object/cursor cache; 10k entity memory/key CPU; property-order equivalence vs ELK meaningful array order.                           |
| **#5** | Chose **A** conditionally, named **E** as strongest future optimization. | Need proof X6 can read frozen result, that semantic label-only edits refresh correctly, and that no midflight mutation or simultaneous caller shares dirty geometry.                |

## EDO challenge, genuine rebuttals and final judgment

After peer reports, EDO directly challenged **peer #1**, the D dissenter: identify an _observed_ X6 mutation warranting clone-per-hit, reconcile cloning with existing strict same-Promise/same-result assertions and with 60Hz scrubbing cost. **Actual rebuttal:** peer #1 explicitly changed position **D→A**. No observed X6 mutation existed; the CA030 renderer builds new node/edge/route cell configs without mutating input, while CA055 tests require same pending Promise and completed geometry object for cursor-only requests, one Worker. D would require a contract expansion and per-frame O(N) allocations. Peer #1 retained actual Chromium X6 and 10k benchmarking as non-negotiable tests.

EDO directly challenged **peer #5**, the A supporter: show how freezing shallow-spread semantic records avoids freezing caller input; how canonical full-graph key avoids every-frame overhead while not trusting revision/WeakMap; and how X6 compatibility is proven. **Actual rebuttal:** synchronously `structuredClone` the validated ready variant and presentation settings, derive canonical key/project/Worker input from that same snapshot, flatten against it on reply, `structuredClone` final result then recursively freeze **before first resolve/cache**. Since arbitrary in-place mutation cannot be detected in O(1) without an immutable-input contract, cursor/highlight UI must avoid calling `layout()` at all; explicit topology requests can do O(N) correctness verification. Canonical object keys sorted deterministically, meaningful graph arrays retain input order; full returned metadata included. Actual X6 frozen-read compatibility and 10k budget remain pending validation.

**Final EDO verdict: CONDITIONAL APPROVAL — A.**

- Use a detached immutable **request-time snapshot** for key, projection, ELK Worker input and post-reply flattening. Never read a live mutable caller variant after the Worker has been dispatched.
- Use a **collision-free canonical JSON/tuple content identity** for all original semantic data returned in cached geometry (nodes/groups/edges including IDs, membership, endpoint, labels, certainty, evidence/source refs) and all geometry-affecting view state. Sort object-property keys with deterministic Unicode code-unit order; retain graph array order unless the ELK input order is also explicitly normalized. Never merge parallel edge IDs, truncate keys, or silently key only by artifact revision/WeakMap.
- Detach geometry from both caller and Worker payload, deeply (iteratively if necessary) freeze nested arrays/sections/points/metadata **before** resolving the first Promise or caching; share the same immutable resolved object thereafter to preserve existing cursor-only identity. Limit cache retention to the existing single most recent entry and make oversized-key failures explicit rather than unsafe aliasing.
- Preserve CA052 collision-free ELK root, CA053 original cross-kind unique IDs, CA054 strict Worker registration ACK, abort/epoch/stale-result fail-closed behavior, and CA055 exact projected semantic identity. No Worker/layout invocation from cursor/frame/activeEdgeIds-only UI events.
- Validate with TDD RED→GREEN **three repros** (same-metadata graph drift, consumer mutation poisoning, midflight source mutation), equivalent clones/property reorder, meaningful array reordering, label-only metadata change, nested route/group/`underlyingEdgeIds` attempted mutation, parallel edge IDs/Unicode distinction, concurrent same-key promises, abort/timeout/dispose/late reply, 10k entity key/heap/latency characterization, and actual Chromium X6 read-only compatibility. If X6 cannot consume frozen input without mutation, return to Council rather than silently adopting D or weakening semantics.

This **does not authorize remote CA057 code by itself**: CA057 issue-first ledger is already verified; next exclusive FE geometry TDD author may implement scoped code _after_ PM/BA accepts this complete Council record and reviews exact test/quality gates. Keep CA055 and CA030 status `IN_PROGRESS/PENDING_BROWSER`, no fraudulent DONE.
