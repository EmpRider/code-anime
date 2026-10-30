# CA054 Engineering Council — fail-closed ELK Worker registration ACK

Date 2026-10-30, branch `fix/react-layout-collapse`, FE V3 CA029 G0. EDO: Tech Lead `/root/pm_fe_v3_retry/tl_fe_v3_retry`. Human owner: Anuruddha (FE V3 implementation approved; no CA031 cutover). Technical verdict is proposed implementation detail, not completed verification.

## Proven defect and alternatives

- OBSERVED: `public/v3-scene-geometry.js:318–336` accepts a FakeWorker registration reply `{id,notAnAck:true}` carrying the correct pending request ID and posts a `layout` request. It rejects keys `data/error` but not arbitrary extras. Probe confirmed `register→unexpected layout`, Worker not terminated until disposal.
- OBSERVED: vendored Worker at `public/vendor/elk-worker.min.js:6234` sends register ACK `{id:b.id}` exactly and layout reply `{id:b.id,data:b.graph}`. `scripts/build.mjs` pins vendor bytes by SHA-256. No analyzed user-project execution involved.
- P1 isolated FE V3 G0 correctness blocker, not evidence of a production outage or exploit.
- A: exact-own-key `{id}` registration guard; fail on all unrecognized control frames using existing `settle` cleanup. Small permanent fix, targeted geometry/test files.
- B: tolerate arbitrary metadata/loose signature or allow extra fields. Better hypothetical custom Worker flexibility, but preserves demonstrated false acceptance without a documented allowlist.
- C: introduce versioned Worker handshake. May be useful if protocol families become supported, but broad integration/vendor change unjustified for current pinned Worker.

## EDO provisional position before advisor inputs

Prefer A. Criteria ranked: fail-closed protocol correctness, compatibility with pinned Worker, minimal blast radius, tests and cleanup guarantees, extensibility last. Revisit if real supported Worker shows legitimate ACK metadata.

## Five independent technical advisors

Five genuine separate advisor conversations (no claim of model diversity): Implementation Lead, Quality & Verification, Reliability & Security, Systems Architect, Devil's Advocate. All recommended A, conditional on robust shape checking and clear compatibility scope. Implementation/QA cited the pinned Worker ACK and existing `settle` reuse; Reliability cited one-shot termination, timer and abort cleanup; Architect rejected a broad versioned handshake; Devil stressed that naive `Object.keys(reply).length===1` misses nonenumerable and symbol own properties, and `workerUrl` configurability does not prove vendor-only custom compatibility.

## Five independent, role-anonymous peer reviewers

All five actual peer reviewers received shuffled proposals A–E and independently judged anonymous **Proposal B** strongest for spotting the enumerable-only guard hole and explicitly distinguishing known vendor protocol from unverified custom Worker contracts. They recommended technical Option A, **not** permissive alternative B. Repeated criticism: nonenumerable/symbol extras and injected Proxy/getter throws can bypass an insufficient guard or throw before existing `settle`. Those exotic values are synthetic FakeWorker robustness scenarios, not evidence of real browser structured-clone exposure. Strongest omitted risk: a synchronous getter or Proxy `ownKeys` throw could leave an in-flight Worker and timeout if `onmessage` exception bypasses cleanup.

## Required live EDO challenge and replies

1. **EDO challenge to Devil's Advocate:** Is `Reflect.ownKeys` enough? Are synthetic getters a disproportionate expansion? Devil **conceded** real Worker structured clone generally normalizes data, but noted current `reply.id` read occurs before shape guard and may synchronously throw under injected FakeWorker. Recommended bounded `try/catch` around reply ID/ACK inspection, catch through existing `settle(new Error('Malformed V3 ELK registration ACK'))`, never post layout first. EDO **ACCEPTS** bounded throw-safe cleanup in CA054; **REJECTS** broad Worker refactor or claim of production exploit.
2. **EDO challenge to Reliability:** Does strict ACK break permitted custom Worker metadata, and is throwing getter worth guarding? Reliability **conceded** synthetic-only current evidence but showed narrow cleanup is low blast radius and restores fail-closed behavior under injected WorkerClass. URL configurability identifies location, not an advertised ACK extension contract. EDO **ACCEPTS** current pinned vendor exact ACK as requirement; **LEAVES OPEN** future versioned/allowlisted metadata only if owner approves documented alternate Workers. Arbitrary tolerance B **REJECTED**.

## Final EDO recommendation and gates

Implement technical Option **A** inside the approved CA029 Worker G0 work **after CA054 issue-first GitHub ledger is remotely committed/verified**. In the registration stage, accept only a non-array object with matching own `id` and exactly one own key `id` (`Object.hasOwn` plus `Reflect.ownKeys`). Cover `reply.id`, own-key/prototype checks and phase detection in a bounded exception-to-`settle` path; malformed ACK rejects, terminates, clears timer/listener and dispatches zero layout. Preserve valid `{id}`→`{id,data}` and existing abort/timeout/epoch semantics. Keep vendored Worker, legacy player, backend/MCP untouched.

TDD RED/GREEN on fake register replies `{id,notAnAck:true}`, nonenumerable/symbol extras, inherited/wrong/missing ID, array/primitive, `data/error`, throwing getters/Proxy, stale/duplicate/cancelled cases. Positive synthetic and genuine Chromium bundled Worker registration/layout required. Existing 14 geometry and 26 adapter cases should remain green, plus repo-config Prettier and GitHub Actions matrix. Independent QA/reviewer before task-specific GitHub-plugin relay. No final CA029/CA030 DONE until V3 Worker/browser/visual acceptance. Rollback isolated CA054 geometry/test commit if pinned protocol changes.

**Evidence limitation:** No CA054 source edit, remote implementation commit, Chromium V3 preview, or user visual signoff occurred during this Council. `Reflect.ownKeys` exotic cases are defensive synthetic tests, not observed production traffic. Future custom Worker metadata remains unverified and out of current contract.
