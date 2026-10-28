# Code Anime — implementation handoff and recovery guide

**Snapshot date:** 2026-10-28 (Asia/Colombo). **Repository:**
[EmpRider/code-anime](https://github.com/EmpRider/code-anime), branch
`fix/react-layout-collapse`. This is a **readable continuation snapshot**, not
an authorization to skip the approved design, Council, tests, or human gates.

**Last verified application/ledger HEAD before this documentation work:**
[`471e68e5a24da3585ad55d85e640893fae63ada8`](https://github.com/EmpRider/code-anime/commit/471e68e5a24da3585ad55d85e640893fae63ada8).
Later documentation-only commits move HEAD. On resume, read the *actual* branch
HEAD and its diff; do not assume the SHA above remains current.

## 1. Executive checkpoint — what is true now

- **T0, T0a, B0a–B0i, B0k and T7:** recorded as DONE in the canonical
  [task ledger](elk-implementation-tasks.md), with individual historical
  acceptance notes and commits. B0j (accidental README `test commit` line)
  remains LOW_PRIORITY; removal is not automatically authorized.
- **T1 — conservative semantic source ownership:** `CI_VERIFIED`, **not DONE**.
  The RED tests and recovered source fix are pushed; full CI is GREEN, but a
  genuine independent *final* review against the exact recovered source and
  task acceptance reconciliation have not been documented as complete.
- **T1a — Prettier CI regression:** DONE, including temporary diagnostic
  deletion and exact-head cross-platform CI verification.
- **T2:** PENDING. Pure logical compound topology and truthful typed edges
  have **not** been implemented or pushed. Do not infer T2 from T1's parser.
- **T3:** PAUSED on real same-origin ELK Worker version/license, corresponding
  source and **explicit human redistribution approval**; no licensed public
  Worker delivery is claimed.
- **T4, T5, T6, T8, T9:** PENDING and gated by predecessor tasks. T7 is
  already DONE; never re-implement its storage-key migration as new work.
- **No npm publish, release, merge, deployment or deletion of temporary
  task-ledger files** has been authorized or performed by this handoff.
- **Team orchestration:** this chat/runtime did not expose genuine
  PM → TL → three-specialist delegation or a current Codex turn token during
  the latest attempted restart. **No new Council or independent final
  review was actually run there.** A suitable runtime is required for the
  mandatory team stage; do not role-play agents or retroactively claim review.

### Last verified exact-head acceptance

- **Source HEAD:** `471e68e5a24da3585ad55d85e640893fae63ada8`.
- **CI:** [Actions #40624563408](https://github.com/EmpRider/code-anime/actions/runs/40624563408)
  completed **SUCCESS**, five jobs: Ubuntu/Windows × Node 22/24 (4/4) and
  Chromium browser (1/1). Workflow checks out this exact commit.
- **Node (Ubuntu 22 log):** 194 tests, **192 passed, 0 failed, 2 opt-in
  skipped**; static/mock boundary, typecheck, build and Prettier all passed.
- **Chromium:** **71/71 passed** at that HEAD. This is the *current
  checked-in suite*, not proof that previously removed/opt-in tests ran.
- **Packed package:** CI's `npm run package:check` passed installed npm
  CLI, MCP handshake, player assets and flow API. It does not publish npm.
- Any future source/test/docs edit creates a new HEAD and needs its own
  exact-head CI evidence before calling that revision GREEN.

## 2. Authoritative source files and decisions

1. [`AGENTS.md`](../AGENTS.md): product boundary, MVP-first priorities and
   tool-failure rules. This is a static analysis + **explicitly labeled AI
   mock values** visualizer, never a user-application runtime/recorder.
2. [`docs/elk-implementation-tasks.md`](elk-implementation-tasks.md): canonical
   file-based task/status/issue ledger, including B0 and T0/T1a history.
3. [`docs/code-anime-elk-reviewed-implementation-plan-2026-10-27.md`](code-anime-elk-reviewed-implementation-plan-2026-10-27.md):
   detailed T1–T9 interfaces, dependencies, test names and acceptance gates.
   Its initial 2026-10-27 `revised plan approval pending` statement is a
   **historical planning gate**. Later scope-specific T1/T7 Council/owner
   authorization is in their own files; do not silently treat it as blanket
   T2–T9 feature/design or ELK Worker redistribution approval. Resolve
   authorization precisely through the next Council/owner.
4. [`docs/t1-semantic-council-edo-2026-10-28.md`](t1-semantic-council-edo-2026-10-28.md):
   T1 five-advisor/peer/EDO conditional GO, falsifiers and reserved T2/T5/T6
   responsibilities; does **not** approve release or all later tasks.
5. [`docs/t7-preference-council-edo-2026-10-27.md`](t7-preference-council-edo-2026-10-27.md):
   scoped T7 one-key preference migration decision. See ledger closeout.
6. [`docs/static-mock-acceptance.md`](static-mock-acceptance.md): older
   original-requirement and mock/MCP acceptance history. Historical
   2026-10-15 failing suites are **not** current 2026-10-28 CI results;
   historical passing opt-in stress/CodeGraph runs do **not** prove the
   missing tests still exist in today's checked-in suite.
7. `public/semantic-flow-model.js`, `public/diagram-control-layout.js`,
   `public/diagram.js`, `public/diagram-returns.js`, `public/diagram.css`,
   `tests/semantic-flow-model.test.mjs`,
   `tests/diagram-control-layout.test.mjs` and
   `tests/browser/player.spec.ts` are the primary source/test consumers.

**Baseline package:** `@empirerider/code-anime` source `package.json`
version **0.5.2**, Node >=22, X6 3.1.8, Dagre 0.8.5, Vite 8.3.4.
`elkjs` is **not** an installed package dependency at this snapshot.
README examples still describe an older **0.5.0** publish/configuration
scenario; do not infer npm publish from source `package.json` or README.

## 3. Delivered history and audit trail

- **T0/T0a:** restored formatting CI and formatted the imported plan/tracker.
  Ledger records T0 `f2b5f10`, T0a `b5a08a67` and `ffd490bb`.
- **B0 MVP repairs:** B0a–B0h, B0k cover Values, map navigation,
  call/return ancestry, Fit and reachable source, literal-source-vs-mock
  display, browser hit-test/toolbar/collapse contracts. Consult their
  individual ledger acceptance entries rather than re-opening wholesale.
- **T7:** orientation stored under `code-anime-diagram-orientation`;
  `code-anime-layout` remains the JSON panel-layout key. Legacy raw
  orientation migrates safely; source commit
  [`25efa689`](https://github.com/EmpRider/code-anime/commit/25efa689f5f20aa2b15a5c1e6aa155d0316c389a).
- **T1 Council:**
  [`1f4297ad`](https://github.com/EmpRider/code-anime/commit/1f4297ad361376b377f0fdb8444b9499e3ad2efd)
  and T1 state/ledger preflight `2a7cfbb7` were pushed before T1 code.
- **T1 RED tests:**
  [`e4c5b97`](https://github.com/EmpRider/code-anime/commit/e4c5b97bb6410b4a1808ae6c0f6dc1f2f5a01c57).
  Seven new focused source-provenance cases; historical first run had six
  expected semantic RED failures. Current committed tests are the authority.
- **T1 source candidate:**
  [`1b219b7`](https://github.com/EmpRider/code-anime/commit/1b219b7702e978ea7c23a3f88ceb9c324b7a0013).
  Conservative braced `else if` ownership, multiline `try/catch/finally`,
  malformed/non-string source fallback, class/object impostor guard,
  distinct event/visit/invocation provenance, unresolved evidence without
  fabricated branches. Public `{ methods, roots, byEvent }`, `event-N` and
  `structure-N` ID contracts are to be preserved.
- **T1 formatting-only failure:** Actions
  [#40615276143](https://github.com/EmpRider/code-anime/actions/runs/40615276143)
  passed browser/semantic tests but failed Prettier on the new model source.
  It was **not** a proven failing semantic behavior regression.
- **T1a recovery:** issue ledger `ad61712`, temporary formatter diagnostic
  `7ba4198`, repository-native formatted source
  [`1cf0e2f`](https://github.com/EmpRider/code-anime/commit/1cf0e2f3f6da2307a71cc3f51b68bbc7f8de1fbe),
  temporary diagnostic **removed** by
  [`e67ef30`](https://github.com/EmpRider/code-anime/commit/e67ef30d58e2ba07b72e71534757046e83156baa).
  CI [#40624072126](https://github.com/EmpRider/code-anime/actions/runs/40624072126)
  and subsequent docs HEAD CI #40624563408 passed all five jobs.
- **T1a ledger closeout:**
  [`471e68e`](https://github.com/EmpRider/code-anime/commit/471e68e5a24da3585ad55d85e640893fae63ada8).
  This closes the formatter subtask, **not T1 final independent review**.

## 4. Fixed technical boundaries — never regress

- Preserve AntV X6 cards, native visit/invocation selectors, toolbar actions,
  user focus, breakpoints, mock Values, mutations, console, stack, source
  cursor, continuation and typed call/return arrows. Dagre remains the
  top-level method/call layout; ELK (if approved/licensed) is nested geometry.
- No analyzed-user-code execution, evaluation, imports, instrumentation,
  database/HTTP effects, runtime recording or V8 debugger; only CodeGraph
  static evidence and clearly labeled hypothetical prepared operations.
- Preserve every prepared global one-based event index exactly once at the
  **terminal leaf** level. Containers may aggregate child `.indices`.
- Do not guess condition values, execute an absent catch/finally, synthesize
  loopbacks, or invent a cross-file return edge. Unknown source membership
  must remain visibly **Unresolved** when rendered by later tasks.
- Preserve `{ methods, roots, byEvent }` and stable node IDs. Duplicate
  source lines / repeated calls and loop visits must remain distinguishable.
- Async layout must not reset playback, selection, viewport or source; keep
  synchronous public `createDiagram().render(...)` API. Worker failures
  cannot silently fall back to unrelated fake geometry as if successful.
- New visual work is **PC-only** (1366×768, real 200% browser zoom,
  vertical/DOWN and horizontal/RIGHT). Existing mobile behavior/tests stay;
  do not delete or redesign mobile-specific features without new permission.
- Keep self-only CSP (`script-src`, `style-src`, `default-src`). ELK must be
  **same-origin native Worker**, never CDN/blob/eval; include verified
  licensing and corresponding-source notices before redistribution.

### Intended pipeline (planned, not all implemented)

```text
CodeGraph static evidence + AI mock trace
  -> T1 conservative semantic method.items [CI_VERIFIED]
  -> T2 pure cards/regions/typed edges [PENDING]
  -> T4 ELK nested geometry [PENDING; requires T3]
       ^ T3 real licensed same-origin Worker [PAUSED]
  -> T5 X6 frames/arrow rendering [PENDING]
  -> T6 async freshness + player state guards [PENDING]
  -> T8 desktop clarity/accessibility [PENDING]
  -> T9 stress, cross-language, package + release gates [PENDING]
```

## 5. Exact implementation order and acceptance work

### Gate A — finish T1 before opening T2

1. Use a runtime capable of **real BA → PM → TL → three relevant
   specialists** and engineering Council independent advisor/peer/rebuttal
   stages as specified by the owner's agent-team skill. Inspect actual
   available delegation slots; never simulate or invent agent work.
2. Re-read current HEAD and exact tests. Independent architecture, semantic
   QA and adversarial reviewers must inspect the *committed formatted*
   `public/semantic-flow-model.js` plus focused assertions at HEAD.
3. Explicitly examine missing/null/unbraced/comment/regex/method-named-if
   cases; repeated callId/event IDs; loop visits; `else if` nested No arm;
   contradictions/unknowns; exact terminal-index conservation; unchanged
   `event-N` and `structure-N`. Record counterexample results and any
   discovered issue with separate ledger entry **before** fixing.
4. Audit generated `public/diagram/diagram.js` against authored modules
   and `npm run build` output: full CI builds a fresh runner artifact,
   which alone does not prove the checked-in distributable bundle matches.
   Regenerate/commit it only if source comparison proves necessary.
5. Reconcile exact-head [CI #40624563408](https://github.com/EmpRider/code-anime/actions/runs/40624563408)
   with T1 acceptance, log independent reviewer identities/evidence,
   then commit a task-specific T1 `DONE` ledger update only if every gate
   actually passes. Otherwise retain `CI_VERIFIED` and record the blocker.

### Gate B — T2 pure topology (only after Gate A)

- **Scope:** `public/diagram-control-layout.js`,
  `tests/diagram-control-layout.test.mjs`. Retain existing
  `layoutControlFlow(...)` and consumer compatibility until T5 migration.
- **Proposed API:** `prepareControlFlow(method.items, { cursor = 0,
  visits = new Map(), methodCallId } = {})` returns pure immutable
  `{ cards, regions, edges, topologyKey }` without screen coordinates.
  Parent ownership via `parentRegionId`; edges have stable IDs and
  `prepared | possible | not-selected | unknown` status; key is
  deterministic and excludes cursor-only styling.
- **RED first:** selected loop-header belongs to its iteration region;
  actual `if/else` ancestry; normal `try` does **not** run catch; exceptional
  trace reaches evidenced catch/finally only; loopback requires evidence;
  `return`/`throw` terminate path; repeated same-line invocations stay
  distinct; every event/unknown path remains accessible and edge endpoints
  exist. Fix any old test that asserts false normal `try→catch` routing.
- **GREEN/review:** `node --test tests/diagram-control-layout.test.mjs`,
  full `npm run check`, actual browser regressions, independent topology
  QA/architecture review, then distinct verified implementation and ledger
  status commits. No T2 `DONE` from only newly added tests or CI alone.

### Gate C — T3 license and Worker approval

- Verify the proposed exact `elkjs@0.12.0` version, true license obligations,
  Worker build bytes, complete notices and corresponding-source availability.
- Obtain **explicit project-owner/legal redistribution approval before**
  bundling/publishing a public Worker. The project's MIT license alone
  does not prove the third-party Worker redistribution terms are satisfied.
- After authorization, build a real same-origin Worker under existing CSP;
  test actual Worker response, 404/CSP/abort/dispose, package inclusion
  and no silent main-thread fallback. T4 cannot integrate before T3.

### Gate D — T4 → T5 → T6

- **T4:** guarded asynchronous nested geometry, absolute offset flattening,
  both DOWN/RIGHT layouts and extra Values height; match `workerEpoch`,
  `requestId` and `geometryKey`; reject stale/malformed/duplicate replies,
  parent cycles, nonfinite coordinates and id-only registration ACKs.
- **T5:** X6 compound frames, correctly directed arrowheads, prepared vs
  possible vs unknown labels, loop/catch/return semantics, source/method
  fallbacks and keyboard/pointer-native dropdowns. No fabricated execution.
- **T6:** keep `render(...)` synchronous. Increment `traceRevision` on
  append/replacement/continuation snapshots even with identical flowId,
  hash or event count; commit geometry atomically only for matching request;
  separate `viewportRevision` to protect manual pan/zoom from stale fit;
  preserve selections, playback, console/source and pending-result failures.

### Gate E — T8 and T9 (release readiness, not yet approved)

- **T8:** compact 1366×768 PC UI, both orientations, actual 200% browser
  zoom, icons with accessible labels, focus, dark/forced-color and reduced
  motion, menus not clipped; preserve existing mobile behavior.
- **T9:** synthetic 76-event normal/exception traces, 500/1000-event
  input-to-paint/DOM/main-thread/memory evidence and representative deep
  continuations; restore missing opt-in CodeGraph TypeScript/Kotlin/Java
  MCP-to-browser and historical 20,000-event/1,500-invocation/five-
  continuation coverage. The older acceptance report describes historical
  tests **not all currently present** in `tests/browser/`.
- Test package assets and real Worker license/source, Web CSP, all source,
  mock-value, route, breakpoint, Stack/Values/Console and player controls;
  obtain independent UX/security/license review and **human visual,
  accessibility and distribution sign-off** before declaring release ready.

## 6. Verification and recovery commands

Use an authorized, isolated Code Anime checkout. Do not execute the
analyzed user's code. These commands test Code Anime itself:

```bash
npm ci
node --test tests/semantic-flow-model.test.mjs
node --test tests/diagram-control-layout.test.mjs
npm run check:scope
npm run typecheck
npm test
npm run build
npm run format:check
npm run test:browser
npm run package:check
```

- Full `npm run check` runs scope/typecheck/unit/build/format; the GitHub CI
  matrix runs it and `npm run package:check` on both OSes and Node versions.
- `npm run package:check` uses temporary `npm pack`, install and live local
  MCP handshake; inspect its side effects and use safe isolated workspace.
- CI browser stage installs Chromium and builds. Local environments have
  previously lacked the Playwright Chromium binary or local socket rights;
  **do not confuse setup failures with application failures**.
- On Windows/PowerShell, use the repository's supported Node >=22 setup;
  do not rewrite tests to hide a platform-specific failure.
- Verify branch HEAD, changed-file list, generated assets and Actions run
  **after each task commit**. A green run at an older SHA never certifies
  subsequent untested source changes.

## 7. Required agent, approval and GitHub delivery contract

- Before implementation work, use current verified skills from the owner's
  `agent-team` instructions, assign **real** BA/PM/TL and at least three
  genuine role-specific specialists, complete applicable five-advisor,
  anonymous peer-review and EDO objection/rebuttal Council stages.
- If actual delegation or pinned skill reading is unavailable, report the
  blocked gate; no fake team/approval. Documentation alone cannot satisfy it.
- Obtain any **still-missing separate design/implementation approvals**
  before optional architectural scope. T1 Council conditional GO, T7
  approval, PC-only clarification and repeated `continue` requests are not
  universal T3 license/release authorization.
- GitHub connector/plugin is the **mandatory default** for repository
  read/write, commits and task-ledger updates. Do not substitute CLI
  Git pushing for convenience. On **any GitHub plugin error**, the owner
  explicitly requires **stop all work immediately and notify them**;
  check remote HEAD before attempting a new authorized retry.
- For each task: push ledger/preflight first; tests-first RED; narrow
  authorized implementation; independent review; meaningful tests; scoped
  descriptive commit with task ID; verify remote commit and exact-head CI;
  only then mark `DONE` with a distinct verified ledger/status commit.
- Track newly found defects as separate file-based tasks with observed vs
  expected, reproduction/evidence, severity, remedy and acceptance, and
  push that issue ledger before fixing. Do not batch completed tasks into
  one late commit. Never delete temporary task files until explicit
  **user approval of full implementation completion**.
- Preserve GitHub errors truthfully. Past connection disconnects, write
  timeouts, a temporary blob-log 404, and a safety-blocked write occurred;
  the final formatting recovery was later pushed and verified. These past
  failures do not prove current plugin availability; check each session.

## 8. Immediate restart checklist for a future developer/agent

1. Fetch current `fix/react-layout-collapse` HEAD and inspect new commits
   after base `471e68e`. Read this handoff, canonical ledger,
   `AGENTS.md`, T1 Council file and current implementation plan.
2. Confirm **fresh** Actions run and job logs for the current HEAD,
   including 4/4 Node matrix, browser 71/71 or current total, unit totals,
   formatting and packed package. Reconcile any new failures honestly.
3. Check real agent delegation capacity/skills; re-establish BA/PM/TL,
   three specialists and required Council before substantive new source work.
4. **Close T1** via independent exact-code audit and missing acceptance
   evidence (including generated bundle check), or open separate fixes.
5. After verified T1 closure and approved T2 kickoff, push T2 ledger
   `IN_PROGRESS` and focused RED tests **before** implementation; follow
   the precise `Task 2` plan, no jump straight to the ELK Worker.
6. Parallelize only genuinely independent, authorized license research
   for T3; do not redistribute the Worker until human sign-off.
7. Carry T4/T5/T6/T8/T9 through separate review/test/push gates. Present
   final outcome and request user completion approval before removing
   task files. Do not claim npm release/publish without distinct authority.

## 9. Status provenance and interpretation

- **OBSERVED:** remote branch `471e68e` and CI #40624563408 were read
  directly from the GitHub connector on 2026-10-28; all five jobs succeeded;
  unit 192/194 pass with two skipped and browser 71/71 green.
- **OBSERVED:** T1a temporary diagnostic was removed in `e67ef30`; T1
  remains `CI_VERIFIED` and T2 pending in the branch ledger.
- **REPORTED IN EARLIER WORK, NOT RE-VERIFIED IN THIS DOCUMENTATION TASK:**
  previous independent T1 candidate reviews and a local 28/28 focused
  test run. Do not treat these as the required final review of the exact
  remotely committed source. Current CI does verify its checked-in tests.
- **NOT VERIFIED:** final human PC visual/accessibility sign-off, live
  CodeGraph-to-browser release stress fixtures, public ELK Worker license
  and distribution clearance, T2–T9 implementation, npm publication.

**Safe next milestone:** independent T1 exact-code acceptance, then
**T2 tests-first source-only logical topology**. Keep statuses and approvals
distinct from the historical plan; this file is a handoff, not a Council
verdict or release certificate.
