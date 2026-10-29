# Code Anime V3 — FE-first Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Status: PROPOSED PLAN — NOT APPROVED FOR CODE IMPLEMENTATION.** The owner authorized this document and the GitHub task ledger, **not** CA028–CA039 source, test, migration, or package changes. The owner must separately approve the V3 design, separately approve this plan, and explicitly authorize the relevant FE phase. MCP/backend work remains **FUTURE/DEFERRED** until separately authorized. No merge, publish, release, deployment, deletion, or cleanup is authorized.

**Goal:** Display a CodeGraph-evidence-grounded, host-AI-mocked, multi-language flow from **one complete immutable semantic JSON document**, while the fixed-desktop frontend computes only adaptive graph presentation and preserves every new-flow source/Visits/Values/playback interaction.

**Architecture:** The future MCP/Node producer owns complete nodes, directed edges, nested groups, exact source/token spans, playback frames, navigation targets, values, provenance, and all continuation assembly. One JSON root contains a required ready `proposed` variant and an optional independently ready or explicitly unavailable `baseline`. The browser validates this supplied document, selects its prepared frame/variant, and computes local ELK/X6 geometry, connector routes, labels, and camera state; viewport/orientation/zoom/selection never causes a semantic JSON fetch.

**Tech Stack:** Node.js `>=22`, TypeScript, JavaScript ES modules, Zod 3, Express 5, MCP SDK, X6 `3.1.8`, browser ELKJS `0.12.0` Worker, existing Vite build, Node test runner, Playwright desktop browser tests, Prettier. Reuse installed project dependencies; propose new ones only after an independently reviewed need.

**Spec:** [architecture.md](architecture.md), [flow-scene-json-contract.md](flow-scene-json-contract.md), [frontend-graph-design.md](frontend-graph-design.md), [mcp-future-architecture.md](mcp-future-architecture.md), and [Council decision](council-decision.md). **Tracking:** `.agent-tasks/code-anime-v3-design-20261029.md`, tasks CA022–CA046 and later separately tracked discoveries. This plan follows the normative contract, not older illustrative `timeline.*` field names.

## Global Constraints

1. Code Anime is **static CodeGraph evidence plus host-AI mock data only**. Never execute, import, instrument, debug, record, or profile analyzed user code. Do not add a built-in TS/JS or other language-semantic analyzer. CodeGraph receipts prove source retrieval, **not** simulated branch truth.
2. Exactly **one immutable, viewport-agnostic semantic JSON document** per prepared animation. Its `comparison` and `variantsById` contain an independently complete ready `proposed` and optional ready/unavailable `baseline`. No browser continuation merge, baseline fetch, viewport-triggered JSON fetch, or FE source/business/semantic inference.
3. The frontend may validate mandatory schema/reference integrity and derive **presentation geometry only**: measurements, selected supplied groups' visual visibility, local hierarchical ELK placement, shapes/styles from explicit tags, ports, routing, labels, zoom/pan, and prepared-frame selection. It may never invent/drop semantic graph IDs or evaluate source/mock values.
4. **Atomic validation:** one malformed required field, dangling endpoint, ownership conflict, cyclic group, or corrupt reference in **any declared ready variant** rejects the **entire root JSON**. A specifically typed unavailable baseline with a supplied reason is valid and disabled. A structurally valid `certainty:"unresolved"` node/edge is rendered as uncertain, not rejected or upgraded.
5. Ready variants own separate graph/source/Values/Visits/navigation namespaces. Their `artifact.projectRoot` and `artifact.target` match, but source hashes may differ. `playback.frames[]` is ordered by 1-based `step`; `playback.sourceVisits[].stepIds` keeps repeated steps; `playback.navigationByCursor` covers **every cursor `0..N`**, with server-provided `previousCursor`, `nextCursor`, `intoCursor`, `overCursor`, `outCursor` integers in `0..N` or `null`. No `timeline.framesById` API exists.
6. **Locked current desktop UI:** do not move/resize/reorder any component, panel, control, keyboard behavior, source display, Follow, Visit, Values, or playback. Outside the graph, later approved changes may adjust only darker color tokens and compact _internal_ padding/margins. Old-session compatibility is not required; exact **new-flow** source/highlight/playback behavior is.
7. Horizontal graph orientation may use multiple rows; vertical may use multiple columns; small graphs remain compact. Group separation, non-overlap, edge identity, legible labels and truthful semantics outrank fill ratio. No arbitrary node-count cap; use cancellable, measured resource budgets. Zoom never excuses overlap or false connections.
8. The **current phase is documentation only**. CA028–CA032 are **PLANNED/NOT_AUTHORIZED**; CA031 live player cutover and full CA032 acceptance remain blocked until actual CA033–CA035 server output exists. CA033–CA039 are **FUTURE/DEFERRED/NOT_AUTHORIZED**. Synthetic fixtures and Node geometry tests are neither native CodeGraph evidence nor browser/user visual approval.
9. Preserve legacy work and its task ledger. CA014 remains PARTIAL; CA016 is Node-verified but browser-visual-pending; CA020 is remotely DONE; CA021 is reviewed but unpushed; CA019 repo skill/docs are dirty and uncommitted. Do not overwrite, reset, silently include, or delete those paths. The PM owns the file ledger and task-specific GitHub plugin-first commit/push/verification once each future task is authorized.

## Review Focus

These five likely failure classes must become **future RED→GREEN checks**, not fabricated present test results:

1. **Invalid comparison root:** a ready baseline with an unknown endpoint, missing Values/Visit reference, or group cycle must reject the **whole** document; an explicit unavailable baseline stays a disabled, explained selection. Own test: CA028 `tests/v3-scene-adapter.test.mjs`; server-side mirror: CA034.
2. **Collapsed branch with parallel/cross-group edges:** every painted edge or boundary proxy retains its original supplied edge ID, endpoints, certainty and label; hidden internal edges remain in the immutable model. Own test: CA030 `tests/v3-scene-diagram.test.mjs`.
3. **Prepared navigation and terminal fallback:** cursor `0`, final cursor `N`, repeated Visits, nested calls, async interleaving, exception unwind, absent explicit `return`, and console-without-call must follow the server's exact `navigationByCursor`, never FE stack inference. Own server tests: CA034 `tests/flow-scene-compiler.test.ts`; browser parity: CA031.
4. **Exact source and object data:** CRLF/mixed newlines, emoji/UTF-16 token offsets, source ±2 focus, `__proto__` keys, split ANSI control sequences, distinct baseline/proposed hashes, and values at every frame must remain exact and safe text. Own tests: CA028 schema fixtures, CA034 compiler, CA031 source/player parity.
5. **Dense layout and incomplete data:** nested multilingual semantic fixtures, long labels/expanded Values, both 800×600 and 1920×1080 desktop geometry, stale Worker replies, high-count/budget exhaustion and incomplete CodeGraph coverage must never invent or silently drop graph facts. Own checks: CA029/CA030 fixture geometry, CA035 aggregate export limits, CA037 native provider, CA038 browser/owner visual.

## Dependencies, ownership and authorization gates

| Work                                                                 | Owner / exclusive candidate paths                                                                                                                        | Hard predecessor and outcome                                                                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CA022–CA027 documentation now**                                    | PM/TL, design authors, independent reviewer; only `docs/v3/*` and new V3 ledger                                                                          | Current docs-only authorization; Council and independent reviews, individual task-specific remote verification. No source tests or live cutover. |
| **CA028** JSON adapter/fixtures                                      | FE contract specialist; `public/v3-scene-adapter.js`, `tests/v3-scene-adapter.test.mjs`, `tests/fixtures/v3/*`                                           | Separate DESIGN + PLAN + FE coding approvals, verified V3 contract. Isolated fixture path; production player untouched.                          |
| **CA029** local adaptive geometry                                    | FE geometry specialist; `public/v3-scene-geometry.js`, `public/diagram-elk-layout.js`, focused geometry tests                                            | CA028; retain CA016/CA020 verified protections.                                                                                                  |
| **CA030** shapes, edges, routing, labels                             | FE graph specialist; `public/v3-scene-diagram.js`, `public/diagram-routing.js`, `public/diagram-label-placement.js`, `public/diagram.css`, related tests | CA028–029; no live replacement or external panel/control movement.                                                                               |
| **CA031** source/player live V3 cutover                              | FE player specialist; `public/player.js`, `public/player-entry.js`, relevant source display and browser tests                                            | CA028 **and actual CA033–CA035 complete JSON**; BLOCKED until backend producer exists and is independently verified.                             |
| **CA032** FE visual QA                                               | Independent QA; tests/evidence only                                                                                                                      | Fixture checkpoint after CA028–030; final source/player/owner visual acceptance waits CA031, real backend and a desktop browser.                 |
| **CA033–CA037 FUTURE** MCP producer/compiler/storage/contract/native | Future MCP/CodeGraph specialists with exclusive backend, storage, skill and test path locks                                                              | New specific backend implementation authorization; CA014/CA019/CA021 reconciliation first. No backend source changes now.                        |
| **CA038** integration + owner acceptance                             | Future independent QA and PM                                                                                                                             | CA031–032 and CA033–037; real CodeGraph/browser/package/Windows evidence, final Council, user approval.                                          |
| **CA039** legacy cleanup                                             | Future PM/TL                                                                                                                                             | CA038 and **explicit completion/cleanup permission**; never automatic.                                                                           |

On future coding authorization, assign genuine FE, backend (when authorized), QA and independent review agents under BA→PM→TL. Resolve each task's exclusive file locks before concurrent edits. Complete a focused RED→GREEN cycle, independent review, `npm run check` at the justified integration checkpoint, and a **detailed task-specific GitHub plugin CAS commit/push/fetch verification** before PM marks that task `DONE`. A rejected/blocked remote push leaves the task incomplete. Preserve all historic task files until the user explicitly approves completion and cleanup.

## Phase A — FE-first, fixture-only work (PLANNED; NOT AUTHORIZED)

### CA028 — Strict V3 JSON input boundary and isolated fixture preview

**Files:** Create `public/v3-scene-adapter.js`, `tests/v3-scene-adapter.test.mjs`, and synthetic `tests/fixtures/v3/{proposed-baseline,unavailable-baseline,invalid-ready-baseline,nested-multilingual}.json`; keep the live `public/player.js` untouched. Names are proposed paths, not files already present.

**Interfaces:** `validateFlowSceneDocument(raw)` consumes untrusted JSON and returns a validated `FlowSceneDocument` or throws a typed `INVALID_ARTIFACT` error. `selectReadyVariant(document, variantId)` returns the named ready variant, or an explicit unavailable result for its optional baseline; it must **not** search another variant's references. The consumer is CA029 geometry and future CA031 player. Validation is a trust-boundary check, **not** language/business inference.

- [ ] **Step 1 — RED:** Create contract fixtures for two independently ready variants (different valid `sourceHash`), an unavailable baseline, structurally valid unresolved edges, plus invalid baseline ready references, cyclic groups, invalid nav cursor/Visit step, unsafe labels and `__proto__` filenames. Assert a malformed **ready baseline rejects the full root**, while unavailable baseline does not.
- [ ] **Step 2 — Verify RED:** Run `node --test tests/v3-scene-adapter.test.mjs`; expect FAIL on missing adapter/contract validation before implementation. Never interpret a syntax error in the fixture as the intended RED.
- [ ] **Step 3 — Implement minimum:** Parse and validate the exact finalized normative fields (`comparison`, `variantsById`, per-variant `graph`, `source`, `playback.frames[]`, `playback.sourceVisits[].stepIds`, `playback.navigationByCursor`). Use safe own-key/`Map` lookups and text-only data. No AST, brace scanner, continuation loader, computed branch/Values, or second JSON fetch.
- [ ] **Step 4 — Verify GREEN:** Run the focused command again; require every required/negative case to pass. Assert no import of `public/semantic-flow-model.js`, `public/diagram-control-layout.js`, `public/replay.js`, or source-scanning heuristics in the isolated V3 adapter. Run `npm run typecheck` and `npm run check:scope` if applicable.
- [ ] **Step 5 — Review and remote gate:** Independent schema/security review; PM records exact tests and task files, commits/pushes CA028 **only after FE implementation authorization**, verifies remote SHA, then marks `DONE` in a separate verified ledger update. Fixture PASS **does not** mean live MCP readiness.

### CA029 — Layout explicit graph topology across available width and height

**Files:** Create `public/v3-scene-geometry.js`, `tests/v3-scene-geometry.test.mjs`; modify only the presentation interface of `public/diagram-elk-layout.js` and its existing `tests/diagram-elk-layout.test.mjs` if verified necessary. Reuse CA016/CA020 safeguards.

**Interfaces:** `prepareV3LayoutInput(readyVariant, presentationState, measuredCards)` returns `{cards,regions,edges,topologyKey}` with **only supplied** node/group/edge identities; `createControlLayout().layout(prepared,{direction,viewport:{width,height},signal})` remains the ELK Worker geometry consumer. `presentationState` includes only visual collapsed-group and orientation choices. CA030 consumes validated positions/routes. No semantic bypass/branch creation.

- [ ] **Step 1 — RED:** Test small flows remain single-lane, long explicit chains pack into multiple horizontal rows or vertical columns when useful, nested call/control groups stay contained, and identical semantic IDs survive orientation/resize. Include `variantId`/revision in cache identity and expanded Values card measurements.
- [ ] **Step 2 — Verify RED:** Run `node --test tests/v3-scene-geometry.test.mjs tests/diagram-elk-layout.test.mjs`; expect new adapter/viewport assertions to fail before new geometry work.
- [ ] **Step 3 — Implement minimum:** Build ELK inputs directly from declared graph hierarchy; pass **both** actual canvas dimensions; preserve existing Worker abort/epoch, root containment, sibling collision and orthogonal-route validation. Do not parse source, mutate edge meaning, or cap by arbitrary node count.
- [ ] **Step 4 — Verify GREEN:** Repeat focused tests with nested and large fixtures. Assert cursor-only playback does not trigger geometry; resize, variant switch, Values expand and collapsed-group display changes invalidate the appropriate geometry key. Invalid output retains only a clearly identified same-artifact valid scene or explicit layout error.
- [ ] **Step 5 — Review and remote gate:** Independent geometry reviewer checks edge IDs, placements and O(n log n) collision guards; PM task-specific CA029 GitHub push and remote verification after authorization. Node geometry green **does not** certify visual screenshots.

### CA030 — Render semantic shapes, nested groups and exact connectors

**Files:** Create `public/v3-scene-diagram.js`, `tests/v3-scene-diagram.test.mjs`; reuse/change `public/diagram-routing.js`, `public/diagram-label-placement.js`, `public/diagram.css` only under this task lock. Keep existing outer app shell and controls untouched.

**Interfaces:** `renderV3Scene(container,readyVariant,geometry,presentationState)` paints the exact existing node/edge/group IDs from CA028/CA029. `visibleEdgeIds` is a **presentation-only subset** of immutable `readyVariant.graph.edges[]`; an external collapsed-group port carries original `underlyingEdgeIds[]` and source/target IDs, never a new graph edge.

- [ ] **Step 1 — RED:** Tests fail when a decision/loop/try/switch/lambda supplied tag loses its readable shape/group label, an external edge proxy changes identity/certainty, or a hidden internal edge is deleted from the model. Add parallel true/false/case routes and collision/ARIA assertions.
- [ ] **Step 2 — Verify RED:** Run `node --test tests/v3-scene-diagram.test.mjs tests/diagram-routing.test.mjs tests/diagram-label-placement.test.mjs`; expect the new paint/identity assertions to fail first.
- [ ] **Step 3 — Implement minimum:** Map explicit style roles to existing X6/graph CSS tokens; reserve nested group headings/gutters, orthogonal ports and label clearance. Reuse routing helpers **only for geometry**, never call `prepareControlFlow` or generate an inferred transition. Preserve theme contrast, keyboard focus and old panel layout.
- [ ] **Step 4 — Verify GREEN:** Repeat focused tests; check all present model IDs remain addressable, painted/hidden edge status is truthful, no unexpected edge/label, and all valid visible routes are nonoverlapping/contained. Mark browser screenshot appearance **UNVERIFIED** until actual user desktop review.
- [ ] **Step 5 — Review and remote gate:** Independent accessibility/geometry review and individually verified CA030 GitHub task commit/status. No forced live V3 player cutover here.

### CA031 — Preserve exact source/Visits/Values/playback on the live V3 JSON

**Hard block:** This task **cannot complete or replace the current player** until real CA033–CA035 backend artifacts, matching the final normative V3 schema, exist and pass independent validation. Backend implementation is **not authorized now**.

**Files (future):** `public/player.js`, `public/player-entry.js`, player/source integration tests (`tests/player.test.mjs`, `tests/player-continuation.test.mjs`, `tests/source-highlighter.test.mjs`, `tests/browser/player.spec.ts`). Physically deleting unused legacy modules belongs CA039, not this task.

**Interfaces:** `mountPlayer` and existing control events remain externally stable. FE selects `variantsById[activeVariantId]`, keeps `cursorByVariant`, displays `playback.frames[c-1]` for cursor `c>=1`, and reads `playback.initial` at `0`; `playback.navigationByCursor[c]` supplies five action targets (`previousCursor`, `nextCursor`, `intoCursor`, `overCursor`, `outCursor`). `source.files[].tokenSpans`, frame `sourceRef`, `sourceVisits[].stepIds`, value/stack/console snapshots are already prepared by the future server.

- [ ] **Step 1 — RED:** Freeze current **new-flow** regression expectations for exact original source CRLF/Unicode/tokens/highlight, ±2 focus, repeated Visit identities, Step Into/Over/Out terminal/unwind/no-call behavior, baseline/proposed selection, Follow, keyboard focus, object/Values/stack and stripped ANSI console. Add negative import/network assertions that forbid active browser source scanning, semantic graph building, data replay and continuation fetch under V3.
- [ ] **Step 2 — Verify RED:** Run `node --test tests/player.test.mjs tests/player-continuation.test.mjs tests/source-highlighter.test.mjs`; run applicable `npm run test:browser` targeted browser cases when Chromium is available. Require the new V3-only acceptance cases to fail on the old live path rather than weakening existing behavior.
- [ ] **Step 3 — Implement minimum:** After CA033–CA035 passes, bind existing UI views and controls directly to precomputed variant/frame/source/snapshot/nav lookups; keep source display text exact. Remove all **active V3 runtime** uses of `replayState`, lexical source tokenizer/control scanner, `nextSessionId` semantic fetch and inferred Step navigation. FE may measure/scroll/pan/animate; it cannot infer event outcomes or mutate snapshots.
- [ ] **Step 4 — Verify GREEN:** Rerun source/player tests and real browser checks; prove one initial JSON load and **zero** extra semantic data requests on variant switch, orientation, resize, zoom, seek or playback. Confirm baseline and proposed cursors/data remain independent. If native backend/browser proof is unavailable, status remains `WAITING_ON_MCP/BROWSER` and live cutover is blocked.
- [ ] **Step 5 — Review and remote gate:** Independent user-visible parity/QA review, full justified `npm run check` checkpoint, individually verified CA031 GitHub commit and status update **only after backend and FE implementation approval**.

### CA032 — Fixture, browser, package and owner visual acceptance

**Files:** QA-owned Node/browser tests and reproducible screenshot/evidence notes, with generated bundles only under a serialized build lock. No test may execute analyzed user project code.

- [ ] **Step 1 — RED matrix:** Record missing checks for 800×600 and 1920×1080 desktop viewports, both orientations, small/long/deep nested graphs, contrast/ARIA, labels and connectors, large Values, stale Workers, switch/try/lambda, collapse/expand identity, and source/Visit/Values/Follow/Step/baseline parity.
- [ ] **Step 2 — Focused verification:** Run relevant `node --test tests/diagram-elk-layout.test.mjs tests/diagram-routing.test.mjs tests/diagram-label-placement.test.mjs` and new V3 fixture tests. Fix only independently documented failures through their owning tasks; do not loosen assertions or conflate one passing subset with the suite.
- [ ] **Step 3 — Full checks:** After appropriate code changes, run `npm run check`, `npm run package:check`, and `npm run test:browser` (only where safe/local Chromium is genuinely available), plus applicable Windows/CI smoke. Record actual versions, commands, exits and screenshots.
- [ ] **Step 4 — Human visual gate:** Have the owner run real desktop cases and report darker chart, clean grouping/routing and minimal wasted canvas while exterior positions/controls remain locked. Do not mark fixture-only geometry as finished native/browser validation.
- [ ] **Step 5 — Independent status:** Record `FIXTURE_VERIFIED` separately from live `DONE`; PM may push the individually reviewed QA task only after required gates. CA032 final acceptance waits CA031 and the future MCP output.

## Phase B — MCP/Node producer and native verification (FUTURE / DEFERRED; NOT AUTHORIZED)

### CA033 — Host-AI/CodeGraph semantic node-edge-group input contract

**Files (future):** `src/domain/trace.ts`, `src/services/animation-builder.ts`, `src/mcp/server.ts`, `tests/builder.test.ts`, `tests/mcp-semantic-groups.test.ts`. First reconcile CA014 PARTIAL and CA021 reviewed-unpushed source under their own task records; do not overwrite them.

**Interfaces:** Extend only the accepted MCP mock-operation schema needed to declare graph node/edge/group/arm/call IDs and typed certainty/evidence from CodeGraph receipts. Producer-owned canonical identities are inputs to CA034; a host AI cannot predict server-assigned event IDs. No first-party language analyzer.

- [ ] **RED:** Write failing tests for dangling edge endpoints, fake receipts, contradictory group ancestry, duplicate IDs, cross-call/task ownership, ungrounded confident branch/case and idempotent retry identity.
- [ ] **Run RED:** `node --import tsx --test tests/builder.test.ts tests/mcp-semantic-groups.test.ts` must show the new failure on current production contract.
- [ ] **Implement:** Add only validated semantic ingress with canonical server IDs, explicit unresolved status, evidence receipts and language-neutral operations.
- [ ] **GREEN:** Repeat focused tests; assert CodeGraph-only input and zero target-code execution, including Java/Kotlin/TS/JS-style synthetic metadata.
- [ ] **Review/push:** Independent provider-contract review, CA033 individual GitHub commit and verified status **after separate backend authorization**.

### CA034 — Canonical graph, comparison and frame compiler

**Files (future):** Create `src/domain/flow-scene.ts`, `src/services/flow-scene-compiler.ts`, `tests/flow-scene-compiler.test.ts`; integrate `src/services/simulation-service.ts` only if needed and coordinated with its owner.

**Interfaces:** `compileReadyVariant(acceptedScenario)` produces a strictly validated `ReadyVariant` with immutable graph, exact source tokens, full value/stack/object/console snapshots, `playback.frames[]`, `sourceVisits[].stepIds`, and `navigationByCursor` for **every** cursor `0..N`. Server owns simulation relationships and Step target computation; no frontend stack/replay rules. The precise accepted-scenario type is fixed at CA033, not fabricated by the browser.

- [ ] **RED:** Test nested/parallel branches, repeated loops, try/catch sibling ownership, switch/lambda, console split ANSI to plain displayed text, duplicated/missing event IDs, `__proto__` keys, CRLF and surrogate-token boundaries; source and Values match exact prepared states.
- [ ] **Navigation RED:** Assert `navigationByCursor.length===frames.length+1`, frame cursor 0/1..N, no dangling/cross-variant targets, and actual Into/Over/Out behavior for attributed exhaustion (fallback to `N`), absent returns, unrelated async siblings, exceptions, no-call console and terminal cursor.
- [ ] **Run RED:** `node --import tsx --test tests/flow-scene-compiler.test.ts`; expected fails before compiler is added.
- [ ] **Implement/GREEN:** Compile and validate the **entire** ready variant with stable IDs and no silently omitted member/source/value; rerun focused tests. Emit valid `certainty:"unresolved"` where evidence is incomplete; structurally impossible graph/frame is an error.
- [ ] **Review/push:** Independent schema/QA review, indivisible oversized ancestry regression, CA034 separate reviewed remote commit/status after backend authorization.

### CA035 — Server-only chain fold and atomic one-document artifact

**Files (future):** Create `src/services/flow-scene-materializer.ts`, `tests/flow-scene-materializer.test.ts`; extend `src/storage/file-session-store.ts`, `src/web/app.ts` and relevant session/web tests with exclusive locks.

**Interfaces:** `materializeFlowSceneDocument(proposedChain, optionalBaselineChain)` outputs the complete root `FlowSceneDocument` with `{schemaVersion,comparison,variantsById}` only after independently validated ReadyVariants. Optional baseline may be `UnavailableVariant` with an explicit reason; invalid declared **ready** baseline rejects the **whole root**. The new read-only localhost artifact endpoint returns the same immutable bytes for every viewport/action; no `nextSessionId` browser protocol.

- [ ] **RED:** Multi-chunk valid trace, missing/expired/cyclic ancestor, modified group/source hash, duplicate global ID, baseline different source hash but same project/target, unavailable baseline, malformed ready baseline, output over-budget and interrupted atomic publication.
- [ ] **Run RED:** `node --import tsx --test tests/flow-scene-materializer.test.ts`; expect specific missing output contract failures.
- [ ] **Implement:** Snapshot and validate all variant chains server-side, deduplicate canonical definitions, assemble frame/source/console data, check **actual serialized UTF-8 output bytes**, heap/time/cancellation/concurrency based on later measured configurable policy, and publish an integrity-checked private file atomically. On over-budget return typed error; never silently truncate, paginate in browser, or fetch per viewport.
- [ ] **GREEN/security:** Repeat focused tests; assert no partial file is discoverable, corrupted artifact is refused, restricted source-root/session, CSP/no-store/text-only rendering and safe own-key dictionaries. Existing per-submission 8 MiB or store 10 MiB **does not prove** aggregate output safety.
- [ ] **Review/push:** Independent storage/security reviewer, CA035 individual verified GitHub task commit/status after authorization; no deployment.

### CA036 — Versioned MCP instructions and migration contract

**Files (future):** `skills/code-anime/SKILL.md`, `skills/code-anime/references/tool-contract.md`, `README.md`, `docs/architecture.md`, relevant MCP/skill tests. These are **currently dirty under CA019**; require separate reconciliation before any future edit.

- [ ] **RED:** Contract examples should fail against finalized CA033–CA035 behavior if obsolete; include one-shot/two-step mock metadata, invalid receipt/source and unknown-language cases, incompatible V2 V3 error behavior and no predicted server IDs.
- [ ] **Implement:** Update repo-owned producer instructions and public tool contract to the **already verified** implementation; no personal installed skill changes. Document opt-in migration, expiry, version rejection and rollback without promising old-session compatibility.
- [ ] **GREEN:** Re-run relevant MCP tests, validate frontmatter/links/examples, `npm run format:check` and package inclusion; separate independent skill/contract review.
- [ ] **Push:** CA036 individual verified commit/ledger update only with backend/docs authorization and safe CA019 reconciliation.

### CA037 — Native CodeGraph, Windows/npx and release-readiness evidence

**Files (future):** QA-owned provider/contract tests and evidence; no changes to analyzed user projects beyond approved read-only indexing.

- [ ] **Provider matrix:** Real indexed TS/JS, Java, Kotlin and Python sources where CodeGraph supports them; host mock if/else/loop/try/catch/switch/lambda produces one validated JSON per scenario. Mark each `PASS/PARTIAL/UNVERIFIED/UNSUPPORTED` using actual provider receipts, never syntax guesses.
- [ ] **Failures:** Native provider missing/unindexed/truncated, interrupted chain, oversized assembled JSON, stale source hash, project-root escape and simulated branch certainty all produce honest diagnostics, not an internal analyzer fallback.
- [ ] **Smoke:** Run applicable `npm run check`, `npm run package:check`, `npm run test:browser`, Node `>=22`, Windows PowerShell npx/stdio and relevant CI when a safe environment exists. A sandbox without installed CodeGraph/Chromium means `UNVERIFIED`, not PASS.
- [ ] **Independent sign-off/push:** Document exact commands/output and independent QA; CA037 commit/status after backend and test environment authorization. No npm publish or deployment.

### CA038 — Integrated V3 and owner acceptance

**Dependencies:** CA031–032 and CA033–037; real one-document HTTP/player, desktop browser and native provider available.

- [ ] **RED integration assertions:** The player loads one JSON only; resizing, orientation, group collapse, Values expansion, playback, variant switch and navigation produce zero additional semantic-data requests or inferred edges. Source/Visit/Values/console and 0..N Step controls match approved new-flow expectations.
- [ ] **GREEN evidence:** Full tests, package/Windows/npx/CI where available, source privacy checks, adaptive group/route/label screenshots in both orientations, owner visual feedback and final **five-advisor Council** independent review; unresolved blockers stay open.
- [ ] **Delivery:** PM records task-specific verified push and accurate remaining risks. BA asks the owner to approve implementation completion. No automatic merge/publish/deploy.

### CA039 — Retire unused legacy inference only after acceptance

**Dependencies:** CA038 verified complete **and** separate explicit owner completion/cleanup authorization.

- [ ] **Inventory:** Prove zero active V3 runtime references to old browser source scanner, client continuation/replay-business modules and obsolete task/plan files. Preserve user edits and recoverable history.
- [ ] **Review:** Independent reviewer identifies only truly unused files for a later deletion proposal. Disabling semantic inference in V3 runtime was mandatory at CA031 cutover; physical removal is optional and never a reason to delay truthful acceptance.
- [ ] **Authorization:** Obtain exact target-by-target user deletion consent before deleting code/docs/task ledgers. No implicit cleanup from successful tests or Council advice.
- [ ] **Verification/push:** If authorized, focused regression checks, individually reviewed CA039 GitHub plugin commit and verified ledger status; report what was removed and recoverability. Otherwise leave CA039 `FUTURE/DEFERRED`.

## Approval and verification handoff

1. **Now (docs only):** independent QA reviews this plan against the corrected `flow-scene-json-contract.md`, CA040–CA046 issue resolutions, architecture, FE design, future MCP design, and current desktop source/Visit/Values acceptance. PM may push this **documentation task only** and verify exact GitHub blobs. A docs commit is **not** software implementation.
2. **Next human gates:** BA presents the actual V3 DESIGN for explicit approval, then presents this IMPLEMENTATION PLAN for a **separate explicit approval**. Authorization of CA028–CA032 FE code and later CA033–CA039 backend/code/cleanup remains additional, explicit action.
3. **Future execution:** after approvals, Council kickoff, three or more genuine specialists, separate ledger-first remote gate, worktrees/locks as authorized, focused RED→GREEN tests, independent per-task review and GitHub plugin task-specific CAS commit/push/fetch/status. Do not mark `DONE` for a passing local test or a failed remote write.
4. **No claims today:** No V3 software implementation, native CodeGraph run, Chromium visual check, Windows/package verification, merge, publish or deployment was performed by drafting this plan. Existing CA019/CA021 dirty work and earlier task files remain untouched.
