# CA069 — Full End-to-End V3 Revamp Implementation Ledger

**Branch:** `EmpRider/code-anime:fix/react-layout-collapse`

**Ledger target:** `.agent-tasks/code-anime-v3-full-revamp-20261031.md`

**State:** IMPLEMENTATION_IN_PROGRESS / PURE_INTERMEDIATE_VERIFIED_AWAITING_PUSH. Kickoff and exact current-source parity passed before implementation. Issue CA069-I01 was recorded and remotely verified at `81ed77aced26d35ac00e4e38dd7f6fdbe53c2cb3` before its fix. Its focused Council then approved a candidate-only correction. The exact five-file T03 pure source intermediate has final test, QA content/base-parity and independent spec/quality approval. BA may atomically publish those five files plus this progress ledger; remote source delivery is not yet claimed. Whole T03/I01 and downstream acceptance are NOT DONE.

**Historical kickoff delivery:** BA `/root`; PM `/root/pm_legacy`; Technical Lead/EDO `/root/pm_legacy/tl_legacy`. These assignments describe the original kickoff and the preserved source/review evidence below, not the resumed task's current supervisors. BA remains the only GitHub writer and user communicator. Any GitHub plugin ERROR stops all task work; no Git CLI fallback.

## Current resumed-task provenance

- **Current delivery:** BA `/root`; PM `/root/pm_v3_resume`; Technical Lead/EDO `/root/pm_v3_resume/tl_v3_resume`. The current supervisors retain the approved D1/A1/P1 scope, prior decisions and all unresolved acceptance gates.
- **Governing instruction from this resumed task:** user-supplied `upload/SKILL(3) (1).md`, 230 lines, SHA-256 `475cf20bbb0f9d6f7bb46ed2bb721dc116578827bb056c5cbfe42dbdb3a357fd`. The 297-line instruction and earlier assignments recorded below are historical kickoff facts; they do not supersede this updated instruction.
- **Current source preflight:** seven core files were freshly retrieved at the exact upstream pins below and independently byte-checked; no prior snapshot reuse. Local manifest `/tmp/ca070-preflight-20261031T145112Z-skill-loader/CA070-seven-core-manifest.json`, SHA-256 `0a24e00256f4704adcf2f987b5476888ee8d7c223aa4f2921f889522b128b367`, records sources, digests, dependencies, runtime selection and successful retrieval. This passes the settled mechanical-publication phase only; additional methods must be loaded before their applicable integration work.
- **Current runtime selection:** new agents explicitly request `gpt-6-astra` with `ultra` reasoning through fresh contexts. Selection is supported by the current runtime; effective execution settings are `NOT_EXPOSED`, not independently attested. Nested PM/TL/specialist delegation is active.
- **Record-only correction:** this resumed ledger changes provenance and makes current status fields explicit. It does not alter the five frozen source files, historical test/review evidence, approved artifact hashes, or acceptance scope. BA will publish a newly verified six-entry source-plus-ledger tree; the earlier uncommitted tree is not branch delivery.
- **Current parent state:** `CA069-T03` and `CA069-I01` each retain `work_status: RUNNING`, `scope_status: IN_SCOPE`, `delivery_status: NOT_PUBLISHED`, and `status_sync: PENDING`. Their historical `IN_PROGRESS` wording below has the same non-complete meaning.
- **Current intermediate state:** `CA069-T03.PURE-01` has `work_status: AWAITING_PUSH`, `scope_status: IN_SCOPE`, `delivery_status: NOT_PUBLISHED`, and `status_sync: PENDING`. Publishing this intermediate will not complete T03/I01 or release downstream acceptance.
- **Cleanup boundary:** completion acceptance does not authorize deletion. Any later temporary-record cleanup requires separate explicit delete-and-publish permission for exact paths under the current governing instruction.

## Owner approvals and permanent references

The user selected **Full end-to-end V3 (Recommended)** and separately approved the following exact artifacts through BA. Approval supersedes prior producer/live-cutover deferment only as specified. Approved artifact bytes remain immutable; proposal-era status wording inside them is historical, not a revocation of the approvals recorded here.

| Artifact | Exact explicit owner response | SHA-256 |
| --- | --- | --- |
| CA069-D1 v1 | `Approve D1 v1 (Recommended)` | `1acb77d343f17255944abc863446d99e7359f957ac503861692b04954186226d` |
| CA069-D1-A1 v1 | `Approve addendum (Recommended)` | `84588922da79fe8a703d1b14aecca2c1cc544f8f6706de1688345ad949569457` |
| CA069-P1 v1 and explicit START | `Approve and start (Recommended)` | `96572c6b47be0ce8ee065a5bee910bb45fb55130a97cd28c3ed4a08c6acf8545` |

Approvals were relayed by BA in this 2026-10-31 task; no exact human click timestamp is invented. PM independently read and hashed all three files. Accessible task-working artifacts are `tmp/ca069-council/design-delta-v1.md`, `design-addendum-a1-v1.md` and `implementation-plan-v1.md` under `/workspace/scratch/7f30f1f647be/`; these are local paths, **not already-published repository links**. CA036 includes publishing their exact approved bytes as permanent repository documentation, within its existing task-specific commit. Do not delete permanent approved artifacts during later tracking cleanup.

Existing repository grounding: `docs/v3/architecture.md`, `docs/v3/flow-scene-json-contract.md`, `docs/v3/frontend-graph-design.md`, `docs/v3/implementation-plan.md`, `docs/v3/mcp-future-architecture.md`, `AGENTS.md`, and `docs/static-mock-acceptance.md`.

## Approved outcome and hard boundaries

1. Newly created MCP animation URLs use complete server-owned V3 documents in the existing locked PC shell. Keep `/flow/:id` and `/api/flow/:id`; API returns canonical root `schemaVersion:"3.0.0"`, `comparison`, `variantsById`, not a V2 envelope. Latest/root sees published V3 only.
2. No old-session/payload compatibility, migration, V2 reader, dual write or browser semantic adapter. Preserve all retained old session/source bytes. V3 recovery/expiry/pruning owns only its isolated namespace; old-ID identification is safe read-only metadata, never old JSON parsing/recovery or symlink traversal.
3. Preserve CodeGraph discovery and host-authored labeled mock semantics. Never execute/import/evaluate/compile-and-run/instrument analyzed user applications. Structural-only discovery/refinement returns useful evidence/guidance, **not a playable URL**, until genuine host-AI mock input exists (approved A1). No fabricated AI-mock provenance.
4. Server prepares graph/groups, exact source/token spans, frames, snapshots, Visits, navigation, Values, stack and normalized console. A ready malformed baseline rejects the whole document. Evidence completeness is not publication status.
5. Complete durable publication, integrity, admission and coherent discovery precede URL success. Lost response retries recover the committed identity. Precommit accepted abort publishes nothing; postcommit output is not falsely called cancelled. Every retained publisher passes the same barrier.
6. Full Source/Visits/Follow/pin/Values/stack/console/navigation/cursor-zero/breakpoint/keyboard behavior and independent variant cursors remain required. After the initial document GET there are zero semantic follow-up requests. Geometry only arranges supplied identities; no semantic repair or old fallback.
7. Candidate modules stay unwired until CA038 atomically switches producer/store/API/bootstrap/active MCP instructions. Retire old current-only source only after replacement evidence. Rollback uses a tested matched revision and isolated ownership roots; never old-store recovery against retained roots.
8. No CSP change, CA068 PNG work, dependency upgrade, unrelated UI redesign, deployment, merge, release or package publication. Original ELK Worker/notices/source/privacy/static/mock safety stays intact. Shared geometry, server display lexer and validator may not be removed while consumed.

## Task-pinned instructions and Council evidence

Historical kickoff instruction: attached `agent-team-skill(2).md` (297 lines) governed the original BA→PM→TL→specialists, real Council and ledger-first delivery. The original CA069 upstream snapshot was `ca069-task-skills/manifest.json`: 40 complete instruction resources; the original PM checked SHA-256 and Git blob digests with zero mismatches. These are preserved historical facts. The current resumed-task instruction and supervisors are recorded above; current workers read their newly pinned applicable full resources themselves.

| Upstream | Pinned commit |
| --- | --- |
| obra/superpowers | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` |
| EmpRider/claude-skills-llm-council | `a7565e21d5ab03551fe66e36818e05af245467b8` |
| JuliusBrussee/caveman | `9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4` |
| DietrichGebert/ponytail | `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846` |
| ayghri/i-have-adhd | `1ecea1993b7fce257ffbd686c070948b5e07eda6` |
| alexgreensh/attention-span | `39c6b46b24dddecc4cef4e3ab8dc36d3fbffeb42` |

Local preserved Council records: `tmp/ca069-council/edo-verdict.md`, `d1-council-verdict.md`, `p1-council-verdict.md`, proposals, anonymous-label reviews, actual objections/rebuttals and builder checks. P1 verdict SHA-256: `4ab214011bcc5089c901071721bcfe115fe493d757c79e532f81c7261c6389d5`. Five independent proposals and five real reviews preceded each material verdict; reused authors' self-recognition limits were disclosed. Final fresh P1 builder: `nothing important left`; that is plan review, not implementation verification.

Implementation kickoff is separate from design/plan review and is now complete. Final local record `tmp/ca069-council/kickoff-verdict.md` has SHA-256 `efdccf6d5b4d01626028c09ee8eedcf5d538c649568dba5fae0b507a69cd3a03` (PM independently read and verified). Five actual independent proposals, five randomized-label peer reviews and actual FE/QA challenge rebuttals preceded the EDO's final disposition. Reused authors' self-recognition was disclosed; no fully blind review is claimed.

Kickoff decisions: release CA029 and CA033 independently only after common gates; no manufactured RED for already-green geometry; FE-only native/CSP gaps hold FE acceptance without blocking ready backend work. Disjoint source alone is insufficient: complete current manifest parity, exclusive generated/build/test resources and frozen hash-bound review evidence are mandatory. Any relevant later source/output change invalidates certification. P1's specific targeted native checks and three full checkpoints govern, not invented universal extra runs. Exact scoped briefs and independent spec/quality reviews preserve accountability while the user/team's mandatory safe parallelism controls over generic serial/fresh-context defaults. No Git helper scripts or permission/budget/scope exceptions are authorized. No unresolved design decision remains; actual runtime/resource/durability evidence remains future acceptance work.

## Historical kickoff owners and exclusive resources

All named specialists were requested with GPT-6 Astra, ultra reasoning. Existing agents retain their originally selected settings; no substitution or fictitious role is claimed.

| Owner key | Actual specialist | Responsibility / exclusive task resources |
| --- | --- | --- |
| FE | `/root/pm_legacy/tl_legacy/fe_execution` | CA029/030 geometry/renderer, CA031 shell, later CA039 deletion. No backend or active-composition edits before assigned integration lock. |
| BE | `/root/pm_legacy/tl_legacy/contract_pipeline` | CA033 shared ingress/types, CA034 compiler, CA035-B facade/handlers, CA036 contract docs, CA038 integration. Serialize overlapping builder/source-catalog edits. |
| ST | `/root/pm_legacy/tl_legacy/risk_dependencies` | CA035-A isolated storage/probe and tests, after type contract; storage resource-policy review separately from code self-certification. |
| QA | `/root/pm_legacy/tl_legacy/test_compatibility` | Independent acceptance/fault/browser/native checks; CA037 candidate proof; no implementation-source write without separately assigned lock. |
| IR | `/root/pm_legacy/tl_legacy/p1_builder_check` | Independent spec/code review; never sole certification of its own changes. |

All five actual owners have acknowledged these sequential responsibilities and the no-edit gate; final kickoff Council accepted the roster and locks. FE and BE first-wave read-only preparation is disjoint. No owner may edit source before the remote gate. Generated build assets/dist, package checks, shared test environments and active composition have serialized TL locks. Every runtime fixture/store/profile uses a distinct owned `mkdtemp` root. The pristine capture remains read-only. QA exclusively prepares `/workspace/scratch/7f30f1f647be/tmp/ca069-execution/source-55468de` after remote-ledger release, then verifies source parity before any implementation edit.

BA's GitHub compare of `d1c050a..55468de` verified four commits and exactly six differing files: added `.agent-tasks/CA064-fe-v3-csp-matcher-typescript-indexed-access.md`, `.agent-tasks/CA066-fe-v3-svg-label-nbsp-test-false-negative.md`, `.agent-tasks/CA067-fe-v3-offscreen-viewport-visibility-tests.md`, `docs/v3/ca064-typescript-index-council-20261031.md`, `docs/v3/ca066-ca067-browser-label-and-viewport-council-20261031.md`; modified `tests/browser/v3-label-association.spec.ts`. BA fetched all six exact HEAD UTF-8 contents without error. Other captured project source is unchanged. QA's execution-copy proof must include these six files and the newly verified kickoff ledger; the historical capture alone is insufficient.

## Existing status and task graph

Preserve recorded historical status: CA028 **DONE**, implementation `0898802fab96ce48bfe87a30958aa05c191f9f90`, status `428202936ab9c06a4a4381a4d3c2c3a1af6478d8`; CA029 **IN_PROGRESS**; CA030 **WAITING_ON_CA029**. BA confirmed no superseding formal status. Later V3 code is reusable but not parent acceptance. Do not repeat CA028 or invent green gates. CA059/CA060/CA063 limitations and experiment stops remain visible.

The new `CA069-Txx` IDs below uniquely track delivery under P1 and explicitly map to the original work items; they do not silently renumber historical records. Global predecessor `G0` means approved D1+A1+P1+START, final kickoff, at least three real responsible agents, BA-verified remote ledger, reconciled source baseline and assigned lock. No task is executable merely because this draft lists it.

| Unique delivery ID / mapped work | Owner; independent review | Dependencies | Initial status |
| --- | --- | --- | --- |
| CA069-T01 / CA029 | FE; QA+IR | G0 | BLOCKED_ON_KNOWN_CA059_LABEL_GATE |
| CA069-T02 / CA030 | FE; QA+IR | T01 required geometry contract | WAITING_ON_T01 |
| CA069-T03 / CA033 | BE; QA+IR | G0 | IN_PROGRESS; PURE_INTERMEDIATE_VERIFIED_AWAITING_PUSH |
| CA069-T04 / CA034 | BE; QA+IR | T03 committed interface | WAITING_ON_T03 |
| CA069-T05 / CA035-A | ST; QA+IR | T03 committed shared types | WAITING_ON_T03 |
| CA069-T06 / CA035-B | BE; ST risk review+QA+IR | T04+T05 | WAITING_ON_T04_T05 |
| CA069-T07 / CA031 | FE; QA+IR | T02; final acceptance consumes T06 | WAITING_ON_T02 |
| CA069-T08 / CA036 | BE; QA+IR | verified T03–T06 interfaces | WAITING_ON_T06 |
| CA069-T09 / CA037 | QA; IR plus FE/BE evidence | T06+T07+T08 | WAITING_ON_CANDIDATES |
| CA069-T10 / CA038 | BE integration; FE+ST+QA+IR | all required T01–T09 gates | WAITING_ON_CANDIDATE_PROOF |
| CA069-T11 / CA039 | FE retirement; BE+QA+IR | T10 replacement proof | WAITING_ON_T10 |

Initial concurrent work after G0: T01 and T03. T04 and T05 then run independently; T07 may run alongside backend once T02 is accepted. T09 tests explicit candidate composition and does **not** depend on T10. T10 alone activates defaults. T11 never precedes replacement proof. Completion commits follow dependencies, not an artificial global finish barrier.

## Detailed implementation tasks and tests

### CA069-T01 — CA029 remaining geometry acceptance

- Scope/locks: reuse `public/v3-scene-geometry.js`, `public/diagram-elk-layout.js`; `tests/v3-scene-geometry.test.mjs`, `tests/diagram-elk-layout.test.mjs`, affected existing V3 browser tests. No reconstruction of accepted helpers.
- Acceptance: exact Worker ACK/error/timeout/cancel/stale behavior and both orientations; immutable identities, no overlaps, truthful layout error. Historical diagnostic stops remain binding unless P1's explicitly new delivery checks apply.
- Verify: `node --test tests/v3-scene-geometry.test.mjs tests/diagram-elk-layout.test.mjs`; targeted real Worker/ELK/X6 evidence. Existing green characterization is not invented RED; unresolved gates prevent completion.

### CA069-T02 — CA030 presentation-only renderer handle

- Scope/locks: `public/v3-scene-diagram.js`, `tests/v3-scene-diagram.test.mjs`, `tests/browser/v3-x6-lifecycle.spec.ts`, current label-association tests.
- Add `handle.setActiveIds({activeNodeIds:readonly string[],activeEdgeIds:readonly string[]}):void`. Preserve topology and original IDs; no camera reset, graph replacement or ELK call per cursor update.
- Verify regression `cursor highlights preserve graph identity and camera without ELK work`; `node --test tests/v3-scene-diagram.test.mjs`; actual browser lifecycle/labels under unchanged CSP.

### CA069-T03 — CA033 strict V3 semantic ingress

- Scope/locks: new `src/domain/flow-scene.ts`, `src/domain/scene-input.ts`, `src/services/scene-ingress.ts`, `public/v3-scene-adapter.d.ts`, `tests/scene-ingress.test.ts`; guarded candidate builder/simulation/source-catalog additions. Methods remain unregistered.
- Reuse CA028 runtime validator through typed wrapper; no duplicate schema validator. Nodes/edges/groups/operations use authored keys, not predicted server IDs; strict validation rejects conflicts, unknown refs, old group-path authority and false evidence/coverage. Canonicalize identities server-side.
- Candidate contracts: `beginScene(SceneBegin) -> {buildId}`; `appendScene(raw) -> {buildId,acceptedEventCount,replayedBatch}`; `prepareScene(buildId,artifactIdentity,{complete,coverage},signal) -> AcceptedSceneInput`. Exact accepted DTOs/signatures are in approved P1; graph-only source locations must be collected. No old semantic reader.
- Verify strict author-key/cross-call/evidence rejection, same-batch replay identity/count and unchanged journal on invalid input. `node --import tsx --test tests/scene-ingress.test.ts tests/builder.test.ts tests/mcp-semantic-groups.test.ts`.

### CA069-T04 — CA034 canonical compiler/navigation/source

- Scope/locks: new `src/services/flow-scene-compiler.ts`, `flow-scene-navigation.ts`, `flow-scene-source.ts`, corresponding three test files, `public/source-highlighter.d.ts`; no live composition import.
- Compile accepted explicit semantics into exact ready variant; frame zero plus snapshots, interleaved calls/exception unwind/terminal N, chronological Visits and per-cursor navigation. Server display lexer/terminal normalization reuse supplies presentation only, never graph semantics.
- Verify immutable input, exact sources, variant-local snapshots, `navigation.length===frames.length+1`, mixed newline/surrogate/split-ANSI handling and packed imports. `node --import tsx --test tests/flow-scene-compiler.test.ts tests/flow-scene-navigation.test.ts tests/flow-scene-source.test.ts`; affected adapter/source/type/scope checks.

### CA069-T05 — CA035-A isolated durable artifact storage

- Scope/locks: new `src/storage/v3-artifact-store.ts`, `legacy-session-probe.ts`, `tests/v3-artifact-store.test.ts`; inactive store only.
- Own `.code-anime-v3/` beneath configured persistence or new owned temp root: `.staging/<operationUuid>`, `artifacts/<sessionUuid>`, `inputs/<buildUuid>`. Embed final source; stage document+detached receipt, synchronize and publish via same-filesystem directory rename. Committed directories alone are authoritative/discoverable; indexes reconstruct only there. Rename by itself is not claimed crash durability.
- `findCommitted` precedes materialization; atomic commit rechecks publisher/key/hash. Known expiry/conflict/corruption is not an unknown identity. Persist sticky expiry before document removal; retain finite-capped identity history without eviction/reuse. Clock rollback cannot revive expiry. Existing valid retry works; expired retry fails before callback.
- Old exact-ID probe validates UUID and safe `lstat`, never follows links or parses/quarantines/prunes old data. Verify old-only/mixed/symlink/restart/expiry byte manifests, crash boundaries, integrity, quota and identity conflicts; `node --import tsx --test tests/v3-artifact-store.test.ts`. Linux/Windows durability remains an explicit gate.

### CA069-T06 — CA035-B publication facade, handlers and enforced policy

- Scope/locks: new `src/services/flow-scene-materializer.ts`, `v3-publisher-handlers.ts`, `flow-scene-resource-policy.ts` and matching three tests; no live tool registration.
- Only lazy `publishOnce(identity,materialize,{store,signal})`; lookup before callback/transient lookup, atomic recheck at commit. Identity is strict publisher + caller UUID + server semantic request hash; builder finish uses buildId and strict finish request. Import pins document digest/authorized provenance so committed retry survives missing original file. No competing signature or bypass publisher.
- Actual candidate factory owns finish/generateMock/discover/refine/changePlan/import handlers before T08/T09 consumers. A1 evidence-only discovery/refinement never commits without genuine explicit mock input. Invalid V2/raw/integrity/provenance input fails closed. Supported tool names are not blanket-retired.
- Current 10 MiB/100 limits are constants, not preexisting configurable or measured V3 capacity. Conservative whole-root/live-artifact defaults and existing 1h default TTL are explicit. Measure combined-variant heap/time/abort/concurrency and Council-select finite enforced compile/heap/concurrency/identity-journal policy. Receipt/tombstone/reservation capacity fails new work before materialization; no identity cleanup without authority. Missing policy/durability blocks acceptance.
- Verify every actual publisher lost-reply/restart identity, malformed ready baseline no publish, whole-root byte rejection, import missing-file retry, sticky expiry/capacity and truthful pre/postcommit abort. `node --import tsx --test tests/flow-scene-materializer.test.ts tests/v3-publisher-handlers.test.ts tests/flow-scene-resource-policy.test.ts tests/v3-artifact-store.test.ts`.

### CA069-T07 — CA031 full prepared-data PC player, initially unwired

- Scope/locks: new `public/v3-player.js`, `v3-player-load.js`, `v3-player-entry.js`, named `tests/v3-player*.test.mjs`, `tests/browser/v3-player.spec.ts`, `tests/fixtures/v3/player-parity.json`; serialized build emits `public/v3-player/player.js`. Production index unchanged.
- `mountV3Player(root,{sessionId,loadDocument,createLayout,renderScene}) -> disposer`; validate one same-origin load before any paint. Dispose aborts/removes listeners/timers. No no-renderer fallback.
- Preserve exact source CRLF/Unicode/token spans, repeated Visits/Follow/pin, Values/object/stack/console rewind, cursor zero/prepared navigation, keyboard/breakpoints, independent variants and camera; zero later semantic requests. Candidate final acceptance uses actual T06 output, not fixture-only success.
- Verify `node --test tests/v3-player-load.test.mjs tests/v3-player.test.mjs tests/v3-player-lifecycle.test.mjs tests/v3-player-source.test.mjs tests/v3-player-values.test.mjs`; actual `tests/browser/v3-player.spec.ts` and `source-layout.spec.ts`. Strict doubles cannot replace real X6 proof.

### CA069-T08 — CA036 inactive V3 contract and approved documentation

- Scope/locks: candidate instructions/examples and exact approved D1/A1/P1 artifacts under `docs/v3/`; reconcile CA019 ownership. Active repo skill/reference/README/tool claims remain unchanged until T10.
- Verify all documented authoring examples against actual T06 handler factory; supported IDs/evidence/retry semantics; no predicted IDs or obsolete compatibility claims. Invalid receipt publishes no URL. `npm run format:check` plus candidate handler tests/link/package-target checks.
- Publish approved exact artifact bytes without rewriting approval hashes; record actual new repository paths at completion. This is the existing eighth task, not an extra documentation push outside the approved budget.

### CA069-T09 — CA037 independent candidate/native proof

- Scope/locks: new `tests/v3-native-workflow.test.ts`, isolated `tests/native-codegraph.test.ts`, V3 browser acceptance; explicit test-owned candidate composition, not production defaults.
- Require real provider receipts and complete prepared behavior, old-byte preservation, fault/cancel/retry and zero semantic refetch. `node --import tsx --test --test-concurrency=1 tests/native-codegraph.test.ts tests/v3-native-workflow.test.ts` only with verified `CODE_ANIME_TEST_CODEGRAPH`. Missing/skipped native provider is unverified, not pass; existing Kotlin/Java/TS results do not prove JS/Python.
- Execute first new full-delivery checkpoint (`check`, `package:check`, browser once) using bounded policy below. Record tested exact preactivation rollback commit and fresh isolated empty store/temp configuration. T10 is not a prerequisite.

### CA069-T10 — CA038 atomic active cutover and installed proof

- Scope/locks: exclusive `src/index.ts`, `src/mcp/server.ts`, `src/web/app.ts`, builder/simulation/visualization active dispatch, `public/index.html`, build/package scripts and active repo skill/reference/README/docs.
- Switch all publishing paths+store/API+`/v3-player/player.js`+active instructions together. Existing `{error:string}` envelope: malformed ID 400; missing/expired 404; identified unsupported stored format 409; sanitized corruption/internal 500. Raw `POST /api/session` 410 with guidance to `build_mock_animation`; no artifact failure-status invention.
- Immediately open each newly returned MCP URL against installed defaults; canonical API/latest, restart retry, strict full shell/CSP and byte manifests. No V2 publishing branch behind V3 reader. `npm run check`, `npm run package:check`, `npm run test:browser`; native installed-default and current Ubuntu/Windows Node22/24 CI. This is second full-delivery checkpoint; any required failure blocks acceptance.

### CA069-T11 — CA039 evidence-backed legacy retirement

- Scope/locks: exact deletion manifest from current consumers after T10 proof; old player/entry/renderer/semantic construction/generated output only where replacements are established. Build/package/test edits form one traceable task.
- Never delete a whole V2-named suite blindly: preserve current behavior assertions through new harness. Retain shared V3 geometry/label routing, consumed server lexer/validator, X6/Worker/notices, shell/styles/icons and all retained stored bytes. No no-op global-library housekeeping detour masquerading as V3 delivery.
- Prove production imports contain no retired renderer or browser semantic reconstruction; fresh installed V3 URLs still work. Third full-delivery checkpoint and relevant deletion-specific checks. Source rollback restores files, not data. Task ledgers remain until explicit user completion approval.

## Per-task evidence, delivery and discovered issues

### CA069-T03.PURE-01 — canonical V3 types and corrected strict ingress (INTERMEDIATE)

- **Scope:** only five new files: `src/domain/flow-scene.ts`, `src/domain/scene-input.ts`, `src/services/scene-ingress.ts`, `public/v3-scene-adapter.d.ts`, `tests/scene-ingress.test.ts`. No existing live file, registration, route, publisher, build script, dependency or stored data is changed by this intermediate.
- **Implemented purpose:** canonical server declarations and a wrapper delegating to the existing CA028 validator; authored node/edge/group/operation DTOs; strict candidate parser rejecting old group-path authority/unknown fields; candidate-only safe JSON detachment and own-key-preserving dictionaries. This is not a V2 converter and does not activate a producer or viewer.
- **Safety correction:** actual I01 RED preceded candidate-local parser changes. Separate Council verdict `tmp/ca069-council/I01-verdict.md`, SHA-256 `6df99e5fe020a3e1bb528f43db5912eeee9b25bd292aea60dcc5b20da4c2b719`, contains five proposals/reviews and actual risk/systems rebuttals. PM/TL released only parser/tests after both that disposition and verified issue commit `81ed77aced26d35ac00e4e38dd7f6fdbe53c2cb3`. Shared live operation/event schemas remain unchanged.
- **Observed development cycle, not pure-package acceptance:** the mixed in-progress T03 tree ran 17 tests with 12 pass/5 fail before correction, then 17/17 after. Origins rejection was already-green characterization, not invented RED. Because that tree also contains future integration work, it is not the source package to publish.
- **Pure package:** clean committed-source tree `/workspace/scratch/7f30f1f647be/tmp/ca069-i01-pure-work-jfTsfr/source` contains only the five new source files above the verified `81ed77aced26d35ac00e4e38dd7f6fdbe53c2cb3` base. It restores the frozen six-test pure baseline and adds six I01 cases, excluding unshipped integration tests without deleting any committed test. Exact complete content package: `tmp/ca069-council/I01-final-five-file-package.json`, SHA-256 `e5b33b023e44fdcee7ca8a98e9407d637d5e9d81c1251b1d109307e302da6de0`. PM independently recomputed all five byte lengths, SHA-256 and Git blob IDs and matched actual pure-root contents: 5/5.
- **Observed final verification:** `node --import tsx tests/scene-ingress.test.ts` passes 12/12 with no failures/skips; `npm run typecheck` (no emit) exits 0; `npm run check:scope` exits 0; installed locked Prettier `--check` on all five new files exits 0. Complete outputs and exact identities: `tmp/ca069-council/I01-final-pure-verification.md`, SHA-256 `ee0110a5208038239388623deeffd1173f36f6f388c8eac82a4dcddd86385d98`. Npm's existing `http-proxy` environment warning is retained, not hidden.
- **Formatting limitation:** the read-only repository-wide check exited 1 on 27 paths. BA authorized normalizing only four flagged new source files; all other 23 flagged paths stayed untouched. Two declaration copies initially retained read-only snapshot permissions; EACCES stopped formatting, then BA explicitly authorized only those owned working-copy files after QA verified no links/shared inodes. Original frozen evidence was preserved. The five delivered files now pass their check; repository-wide format was not rerun or relabeled GREEN.
- **Independent review:** final `tmp/ca069-council/I01-pure-ir-round1.md`, SHA-256 `2cc8797456d3574dcd0ee0280df74d0559225b0c933826a7df3d5728cf0ceeb7`, concludes pure-stage spec COMPLIANT and quality APPROVED for exact packet `e5b33b023e44fdcee7ca8a98e9407d637d5e9d81c1251b1d109307e302da6de0`. IR read the full mechanical formatting diff, independently matched all five final hashes, found I01's parser finding addressed and no new Critical/Important breakage. PM read the final verdict; no reviewer test reruns or broader completion claims.
- **Independent QA byte/base receipt:** QA confirms all five complete contents, byte lengths, SHA-256/Git blob IDs and final verification-report hash match; committed base 219/219 with zero mismatches, unexpected project extras or integration leakage. Final copied content root: `/workspace/scratch/7f30f1f647be/tmp/ca069-i01-final-u4huco/files`; evidence and non-Git original-pure diff are retained beside it. PM and TL separately recomputed all five packet/source identities with zero failures. No new test/semantic gate or source change remains for this intermediate.
- **Explicit remaining scope:** candidate begin/append/prepare integration, transactional references/evidence/coverage/retry behavior, preparation source-hash/scenario/V3-baseline handoff, and downstream journal/event preservation. The later ordinary event-schema loss point remains a separately required proof/correction gate. Full I01 and T03 stay IN_PROGRESS; T04/T05 consumers are not released by an intermediate.
- **Remote delivery:** exact pure-package proof and independent review are complete; BA may now publish the five source files and this ledger atomically against verified base `81ed77aced26d35ac00e4e38dd7f6fdbe53c2cb3`, then verify remote bytes/branch. Planned next delivery is push 3/23, not yet executed. No completed-task status or automatic DONE update is requested. Additional future work remains inside the existing ceiling or needs explicit additional budget.

| Exact new file | SHA-256 | Git blob SHA |
| --- | --- | --- |
| `src/domain/flow-scene.ts` | `799beeb98ab158f7d6b3f1fc7efbe919a983854d4e3d538d6c1b2e3183917cc4` | `30b8a198b06697a85beead3bdde579fd36aa1539` |
| `src/domain/scene-input.ts` | `f1f0f149f52a131f5e6e2fc390b46be9e864c834fa16292b0e6c261dae4c4067` | `680b6f397a35df1ee540c1818327a7675759da99` |
| `src/services/scene-ingress.ts` | `8d91ba6ced0dae8ca39642618ccd52b1a0893b79ebaf9b51e907736b1d61d35f` | `5a7ba37e86025ca093c4445549562ad5a91450c0` |
| `public/v3-scene-adapter.d.ts` | `0fbe97a463a8d44fbe96fb77184eda7934f64bd6afa832fb3f6d65005a50e3fa` | `0297a47980f8f487702eeedaa0097c43bf52435d` |
| `tests/scene-ingress.test.ts` | `e25f358fa35d6f85ad866f0635dec3b19149b303700153d940ba5e7fbb9c39fd` | `a417a8ece3a6a7056527af91e870060fae286a9f` |

### CA069-I01 — preserve legitimate own mock-data keys in V3 candidate ingress

- **Status:** PURE_INGRESS_CORRECTION_VERIFIED / FULL_PATH_PROOF_OPEN. Its pre-fix issue record was remotely verified at `81ed77aced26d35ac00e4e38dd7f6fdbe53c2cb3`; the focused Council approved and PM/TL released the narrow parser correction afterward. Owner BE `/root/pm_legacy/tl_legacy/contract_pipeline`; supervisor TL; independent QA and IR remain separate. Exact pure-stage tests/review are now approved, but downstream proof still gates full I01/T03 acceptance. This is not issue DONE. No active wiring or shared old-schema change is authorized.
- **Priority/impact:** important development acceptance blocker: silent input-data loss in an unregistered, unshipped V3 candidate. No production outage, exploitation or deployed data loss is claimed.
- **Observed:** one direct scratch reproduction uses JSON.parse to supply an own `__proto__` value `{kept:"yes"}` plus own `constructor:"own"` and `ordinary:7` controls in operation.inputs. Raw keys are `["__proto__","constructor","ordinary"]`; parsed keys are `["constructor","ordinary"]`. `Object.hasOwn` changes true→false for `__proto__`; both controls survive. Assertion fails with exit 1. No repository source was changed for reproduction.
- **Expected:** preserve every legitimate own JSON mock-data key and its value without altering object prototypes, escaping names, silently dropping values or inventing replacements. Canonical requirement: `docs/v3/flow-scene-json-contract.md:1037`.
- **Evidence:** initial independent review `tmp/ca069-council/T03-CA033-pure-ir-01.md`; complete reproduction/proposal `tmp/ca069-council/CA069-I01-evidence-and-proposal.md`, SHA-256 `29b79c2999f7992842e2a5b624c7884ac5683b15e65ad0234654049dc8f84101`; scratch fixture `T03-own-key-reproduction.mts`, SHA-256 `aa649b425ee87320a4d44ec527a3f08e61ce39f4a4f1f07faf6b9395de10e240`. These are task-local evidence paths, not fictitious published links. Command: `node --import tsx /workspace/scratch/7f30f1f647be/tmp/ca069-council/T03-own-key-reproduction.mts` in the isolated execution root.
- **Reproduced pre-fix mechanism:** `src/services/scene-ingress.ts:58–67` inherited ordinary `z.record` mock dictionaries from `src/services/animation-builder.ts:14,38–49`; `src/domain/trace.ts:2–4` documents that special own keys are dropped and contains an existing safe custom-dictionary principle. Reproduced old parser SHA-256 `654c670f01f48ba088ac87cbf5636c316a0cb17f4d9e06b095b76dc3a32c8c40`. The later candidate event/snapshot `eventSchema.parse` path has analogous ordinary records; that second loss point is source-suspected, NOT established by the parser reproduction or closed by this intermediate.
- **Council-approved bounded remedy:** candidate-only descriptor-aware detachment before Zod reads, followed by preserving dictionary validation for inputs/set/fields/values/origins; string-valued origins keep their existing constraint. Reject accessors without invoking them, preserve exact legitimate own JSON keys/nested values, detach caller-owned values, reject cycles without rejecting repeated acyclic values, and avoid prototype setters. No shared live schema modification, raw unvalidated reattachment, arbitrary new resource quota, generic serialization framework or Proxy-security guarantee. Full T03 must separately prove candidate event/journal/preparation preservation.
- **Anticipated fix locks:** new `src/services/scene-ingress.ts`, its new ingress tests; candidate-only guard selection inside already-approved `src/services/animation-builder.ts` only for later full-path proof if Council confirms. Existing live schemas/active routes/publication remain untouched. Any additional path requires explicit reviewed lock expansion.
- **Required proof:** hand-authored JSON-key regression demonstrates intended RED; candidate inputs/set/fields/values/origins retain own keys, nested values, ordinary controls and object prototypes; rejection never invokes accessors; full candidate snapshots and multi-batch rollback/retry preserve exact data. Direct pure tests, no-emit typecheck, scope and independent spec/quality review are complete for the exact intermediate above. Existing localhost builder suite requires the ordinary approved execution permission path. All full-path journal/event/preparation gates remain open. No remote source implementation commit or DONE is yet claimed.
- **Delivery:** the issue-only tracking record is verified delivery push 2/23. A corrected pure T03 source package may be delivered as a separately reviewed INTERMEDIATE commit with T03 IN_PROGRESS, without waiting for unrelated later scenario/source-hash/baseline handoff decisions. Do not mark CA033/I01 complete or release downstream consumers from an intermediate.

For each task record exact file changes, intended RED command/result, focused GREEN/adjacent results, independent review findings, limitations, and implementation/status remote commits. An already-green characterization is not RED; missing environment/import setup is not a false behavioral reproduction. Readiness failures are facts, not implicit authority to bypass.

Status progression: `WAITING_ON_* → READY → RUNNING → REVIEW → VERIFIED/AWAITING_PUSH → DONE`. DONE requires actual independent verification **and** BA-confirmed remote implementation commit; then verified status update. No multiple completed tasks batched into one later commit. Task commit message includes ID/title, changes, problems resolved, tests/results and significant decisions. Do not self-certify.

New discovered defects require separate unique `CA069-Ixx` records with observed/expected behavior, evidence, risk/severity, proposed Council-reviewed remedy, paths, owner/dependencies and tests. Push/verify that issue record before its fix. A new push consumes explicit remaining approved capacity or requires expanded budget; never silently reset or exceed the ceiling.

## Bounded execution, CI and rollback

- P1 approval explicitly authorizes at most **23 pushes**, **46 workflow invocations**, **230 scheduled job slots**: kickoff ledger + eleven task implementation/ledger commits + eleven verified status updates, allowing push+one existing PR synchronization each. Count duplicates/failures/cancellations/skips/status-only events. No manual reruns, extra PR events or recursive status commits. BA records event/SHA/run/attempt/job IDs and cumulative totals; final status-push receipt can be outside Git.
- Three separate new full-delivery checkpoints T09/T10/T11 run unchanged `check`, `package:check`, browser once, justified by changed code. Formerly protected specs may execute in these explicitly new delivery runs; this does not revive, extend or reset CA059/CA063 diagnostic experiments. Never narrow workflows. Failed gate stops advancement; fixes need recorded remaining-budget allocation or new approval.
- Required CI remains Ubuntu/Windows × Node22/24 check/package plus Ubuntu Node22 Chromium. Native provider, real CSP/browser, Windows/npx, resource policy and platform durability remain **UNVERIFIED** until current evidence. Selected subsets/fakes/screenshots are not full/native proof.
- Use existing locked dependencies and recorded Node/browser versions in an authorized isolated copy. Builds/package checks may mutate only that copy/owned temp infrastructure; no analyzed user-project execution. No dependency install, permission bypass or hidden fallback.
- T09 verifies exact preactivation matched rollback revision against new empty owned `CODE_ANIME_SESSION_DIR` and `CODE_ANIME_TEMP_DIR`. Never start old store against retained old/V3 roots. Stop publication during recovery; V3 links explicitly unavailable, not converted. Restore tested matched V3 producer/reader/bootstrap with original V3 ownership roots; old/V3/receipt hashes unchanged and identical retries recover identities.

## Kickoff gate, remote receipts and current progress

- Owner D1/A1/P1+START approvals: CONFIRMED, exact texts/hashes above.
- Implementation Council: COMPLETE, final verdict/hash above; five proposals, five reviews, two actual targeted rebuttals and explicit EDO dispositions. No inherited design verdict substitutes for §9.1 kickoff.
- Actual FE/BE/ST/QA/IR assignments: all acknowledged and accepted. QA completed exclusive copy setup/parity; PM released exact T01/T03 locks. Later tasks retain their dependencies. I01's narrow parser correction was released only after verified issue commit and final focused Council; full-path correction/acceptance remains separately gated.
- Current source baseline: BA applied the six exact current files plus kickoff ledger; QA verified all 219 tracked blobs/33 directories at `8ce4fdc01cb557eb230cb6a8e863b2458dd6e800` before edits. Original capture remains unchanged. New T03 work is tracked against this base with task-specific frozen hashes; no source parity is inferred from the directory name.
- Remote kickoff ledger commit: `8ce4fdc01cb557eb230cb6a8e863b2458dd6e800`, BA verified exact fetched content and branch HEAD. QA parity receipt `tmp/ca069-execution/setup-tracked-parity-receipt.json` reports 219/219 blob matches, no shared regular-file inodes, all 13 dependency links internal, original capture unchanged. BA independently repeated tracked-blob verification successfully.
- Budget before this source intermediate: 2/23 verified delivery pushes (kickoff `8ce4fdc01cb557eb230cb6a8e863b2458dd6e800`, issue `81ed77aced26d35ac00e4e38dd7f6fdbe53c2cb3`); this exact five-file-plus-ledger intermediate would be push 3/23 after BA confirms it. Workflow/job totals require BA's actual event receipts and are not assumed zero. Future intermediate/corrective work consumes the same finite ceiling; no reset or silent expansion.
- T01 focused current-file run failed; direct diagnostic exposed 52 tests / 51 pass / 1 failure in existing CA058 label-placement preflight: `No collision-free V3 edge label position for e:yw` at `public/v3-scene-diagram.js:364`. FE mapped it to already-tracked CA059, not a new compatibility-removal permission. No FE source edits/remedy; native/CSP acceptance remains unverified.
- T03's first six-test pure snapshot was blocked by I01 despite its limited GREEN. The corrected, formatted pure candidate now passes 12/12, no-emit typecheck, static scope and exact-five-file formatting, with final-byte QA and independent spec/quality approval. Candidate begin/append/prepare integration is separately in progress and unaccepted; active defaults remain unchanged. The five-file intermediate is ready for BA's atomic source delivery; no remote source commit or whole-task DONE is yet claimed.
- Initial nested Node test reporting hid details. Bounded scratch/direct diagnostics exposed actual assertions without changing product tests. Existing builder direct run had 16/17 passes and a localhost close-path failure under sandbox; BA reran unchanged source with approved localhost permission and obtained 17/17, exit 0, 6.56s. This supports permission-sensitive execution, not a product code workaround. Local diagnostic allowances were individually recorded, never reset; no CI rerun/build/native/browser was substituted.
- CA068 PNG/CSP work: still separately paused, not included.

Final completion requires independent Council/agent review, all required verified remote tasks and honest limitations, then BA asks the user to approve completion. Only that explicit approval can authorize removing temporary task files. Preserve approved permanent docs and Git history.
