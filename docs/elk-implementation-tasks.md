# ELK implementation task progress

Source: owner-approved reviewed implementation plan dated 2026-10-27. Static
analysis and explicitly labeled AI mock data remain mandatory; analyzed user
code must never execute to construct animations.

| Task | Description                                                        | Dependencies                     | Status                                                     |
| ---- | ------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------------------- |
| T0   | Restore mandatory formatting CI at the authored/generated boundary | Approved formatting remedy       | DONE — delivered as f2b5f10; remote branch verified        |
| T0a  | Format newly imported ELK plan and task-tracker docs to restore CI | T0 delivery; two-file CI failure | DONE — delivered as b5a08a67 and ffd490bb; remote verified |
| B0a  | Restore Values disclosure pointer and viewport reachability        | T0a; browser RED baseline        | DONE — focused desktop/mobile Chromium GREEN; full CI RED  |
| B0b  | Restore map navigation and continuation                            | B0a; behavior-contract evidence  | IMPLEMENTED_CANDIDATE — browser gate RED                   |
| B0c  | Preserve truthful typed call/return ancestry                       | B0b; mock/source identity        | IMPLEMENTED_CANDIDATE — browser gate RED                   |
| B0d  | True Fit and reachable source-step navigation                      | B0b; B0e, B0g UX/geometry gates  | IMPLEMENTED_CANDIDATE — browser gate RED                   |
| B0e  | Set Fit overview versus immediate-label readability contract       | B0d; explicit product choice     | WAITING_ON_OWNER                                           |
| B0f  | Set literal-source versus simulated-label display contract         | B0c; explicit product choice     | WAITING_ON_OWNER                                           |
| B0g  | Fix mobile composed SVG-transform browser test and interaction     | Ledger push; B0d                 | IN_PROGRESS — test patch; Chromium gate pending            |
| B0h  | Align mobile toolbar tests to intended flex with hit tests         | Ledger push; B0a                 | IN_PROGRESS — test-only patch; Chromium gate pending       |
| B0i  | Diagnose shared orientation/panel preference key collision         | Ledger push                      | DIAGNOSED_AWAITING_PUSH — no source fix                    |
| B0j  | Review accidental trailing README test line                        | B0 gate; owner priority          | LOW_PRIORITY                                               |
| T1   | Conservative, source-proven nested semantic grouping               | B0 MVP browser gate              | PAUSED — actionable browser failures under AGENTS.md       |
| T2   | Pure logical compound topology and truthful execution edges        | T1                               | Pending                                                    |
| T3   | Real same-origin ELK Worker and distributable package              | B0 gate; dependency/license gate | PAUSED — actionable browser failures under AGENTS.md       |
| T4   | Nested ELK geometry and robust Worker protocol                     | T2, T3                           | Pending                                                    |
| T5   | X6 compound frames, arrows, and existing HTML controls             | T4                               | Pending                                                    |
| T6   | Async race safety and full player-state preservation               | T5                               | Pending                                                    |
| T7   | Isolate orientation/panel preference keys with migration           | B0 MVP browser gate              | PAUSED — actionable browser failures under AGENTS.md       |
| T8   | PC-only compact visual clarity and accessibility                   | T6                               | Pending                                                    |
| T9   | Full mock-trace, performance, and package acceptance               | T1–T8                            | Pending                                                    |

## 2026-10-27 Council reconciliation and next tasks

The current branch baseline is `32f0ea01f92bbef7098ad206c88c3bf16d3881a4`.
[GitHub Actions 40489360476](https://github.com/EmpRider/code-anime/actions/runs/40489360476)
passed all four Node/check jobs but only **51/57 Chromium browser tests**.
Five independent Council advisors, five anonymized peer reviews, and four EDO
rebuttals recommended narrow B0 recovery. **No source fix or task acceptance is
claimed by this reconciliation.** The existing implementation plan still needs
explicit owner confirmation before optional ELK T1–T9 begin.

- **B0b — map specialist; independent QA:** navigation and continuation code is
  present, with relevant cases passing. Preserve unique invocation IDs,
  return/source/cursor/breakpoint continuity, reload and keyboard navigation;
  do not mark DONE while full browser acceptance is RED.
- **B0c — ancestry specialist; independent QA:** first-appearance and true
  typed call/return edges are present. Preserve all prepared indexes and add
  negative controls for absent call site and incorrect return target.
- **B0d — Fit/camera specialist; independent QA:** whole-map Fit is present,
  but after Fit actual labels measured 6.73px desktop and 2.15px mobile against
  the >=12px assertion; mobile pointer verification is blocked by B0g helper.
- **B0e — UX/accessibility specialist; owner decision:** choose A whole-map
  overview with keyboard Step 5 focus/zoom, readable labels after zoom, or B
  immediate >=12px readable/direct-click cards with possible overview clipping.
  Verify actual hit target and pointer/keyboard navigation, never just remove
  the readability assertion.
- **B0f — provenance specialist; owner decision:** expanded card shows mock
  `call A.main` while fixture literal source is `B.work();` (two failures).
  Proposed primary literal source plus explicit secondary simulated identity;
  preserve per-event/call uniqueness, escaped text, missing-source fallback.
- **B0g — browser geometry QA; independent reviewer:** fix mobile
  `DOMMatrix(null)` test helper without guessing identity transforms. Compose
  ancestor/screen transforms, include nonidentity ancestor negative control,
  real unforced pointer/keyboard interaction and repeated Fit/zoom checks.
- **B0h — mobile controls QA; independent reviewer:** desktop toolbar grid
  intentionally becomes mobile in-flow flex under 650px. Assert each actual
  viewport contract plus pointer/keyboard hit targets, overlay interception
  negative control and prior Step 6 reachability. No expectation-only green.
- **B0i — reliability/storage specialist; independent reviewer:**
  `public/diagram.js` stores raw orientation and `public/player.js` stores JSON
  panel settings under the same `code-anime-layout` key. Diagnose both write
  orders, legacy/corrupt/throwing storage. Escalate a separately approved B0
  fix if user-visible preference loss is reproduced; otherwise schedule T7.
- **B0j — documentation maintainer:** review trailing README `test commit`
  test line; lower priority than the six browser failures.

**Task progress commits:** commit/push one task ID at a time through the GitHub
connector; partial implementations remain `IN_PROGRESS` with exact delivered
versus missing criteria, never unsupported percentages. Each slice requires
independent review, focused genuine Chromium RED→GREEN desktop/mobile where
applicable, scope/type/unit/build/format/package checks, and exact-HEAD CI.
Local baseline `npm run check` passed 185 tests with 2 opt-in CodeGraph skips
outside the socket sandbox. No local browser green is claimed: the Chromium
download returned an invalid zero-byte archive. Keep T1–T9 PAUSED until B0
acceptance and the revised plan's explicit owner approval. Do not merge,
release, publish or remove this task ledger without owner authorization.

### B0g incremental progress — not accepted

- **Prepared change:** `tests/browser/player.spec.ts` no longer assumes the X6
  viewport SVG `<g>` has an inline `transform` attribute. The test reads its
  composed `getCTM()` and checks a temporary ancestor-group transform with
  `try/finally` restoration, plus keyboard activation of source Step 5 alongside
  existing unforced pointer, camera, and source synchronization checks.
- **Local verification:** elevated `npm run check` passed scope, typecheck,
  **185 Node tests with two opt-in CodeGraph skips**, build, and formatting.
  The restricted-sandbox run instead failed three socket-dependent suites.
  Focused Playwright could not start: first `listen EPERM`, then after elevation
  missing `chromium_headless_shell-1248` binary. **No Chromium assertion ran.**
  Independent static spec/quality review passed after one false-green negative
  control was corrected. Exact-head Chromium CI and remote commit verification
  remain pending. Keep `IN_PROGRESS` until those gates resolve.

### B0h incremental progress — not accepted

- **Prepared test-only change:** the diagram navigation browser case preserves
  desktop bottom-right grid and 3×3 control placement assertions while checking
  the intentionally mobile in-flow footer, scrollable flex controls, real
  control-center pointer hit targets and keyboard orientation activation.
  Its mobile path also tests source Step 6 pointer reachability, cursor and
  source-line synchronization, plus a temporary opaque pointer-blocking DOM
  overlay (removed in `finally`) to prove hit-test interception is detected.
- **Verification:** no product CSS/JS changes. Elevated `npm run check`
  passed static/mock scope, typecheck, 185 Node tests with two opt-in skips,
  build and formatting. Independent static spec/quality review passed after
  the overlay was made opaque. [GitHub Actions 40543156843](https://github.com/EmpRider/code-anime/actions/runs/40543156843)
  on B0g HEAD `8a7dc6b6b2c6c45088175fda44c56ce2c6039e9e` passed four Node
  jobs and 52/57 browser tests; the original mobile grid expectation was the
  remaining B0h browser failure. Focused local browser verification was blocked
  first by sandbox `listen EPERM`, then by absent
  `chromium_headless_shell-1248` binary after escalation. **No new Chromium
  assertion has run.** B0h browser RED→GREEN, task-specific remote commit/push
  and exact-HEAD CI await delivery. Keep `IN_PROGRESS`, not `DONE`.

### B0i diagnostic evidence — code fix not authorized

- **Expected:** selected diagram orientation and player panel settings each
  survive reload without erasing the other's preference.
- **Observed source:** `public/diagram.js:270–279` reads the shared
  `code-anime-layout` key only as raw `horizontal` and writes raw
  `horizontal`/`vertical`. `public/player.js:3050–3077` instead parses the
  same key as JSON panel settings and writes JSON. These incompatible formats
  overwrite each other. Both callers are on the static/mock player path;
  no analyzed user code executes.
- **Deterministic reproduction:** an independent reliability specialist ran
  verbatim extracts of those production storage paths in isolated Node `vm`
  contexts sharing a Map-backed `localStorage` (exit 0, all assertions passed;
  no repository files changed). **Panel then orientation:** persist inspector
  `true` as JSON, invoke the orientation-write snippet, then invoke the
  simulated next-load read: inspector reverts `false` because raw
  `horizontal` cannot parse as panel JSON. **Orientation then panel:** persist
  `horizontal`, invoke the panel-save snippet, then simulate the next-load
  read: orientation reverts vertical because the key now contains JSON.
  Invalid or throwing storage safely falls back without an uncaught exception.
- **Confidence / severity:** preference-loss mechanism **OBSERVED in a
  production-slice deterministic harness**, not yet verified in full Chromium
  UI. P2 bounded persistence regression candidate; no evidence of source-data
  loss or security impact. The storage snippets tolerate throwing storage;
  actual current-page control interaction was not browser-tested.
- **Remediation gate:** no code change approved as B0i. Revisit the Council's
  conditional decision and obtain owner priority/plan confirmation before
  promoting a scoped fix or implementing **T7**. Compare separate storage keys
  with legacy migration against a broader versioned settings schema; preserve
  both raw and JSON legacy cases, corrupt/throwing storage, both write orders,
  fresh/reload persistence and no uncontrolled deletion. Require real browser
  regression, Node/build/package/CI and independent review before closure.
- **Tracking:** B0i's diagnostic scope can close only after this evidence is
  independently reviewed and the task-specific GitHub docs commit/push is
  verified. The **preference bug itself remains OPEN** under owner-gated T7;
  B0i diagnostic completion must never imply the migration is implemented.

## T0 evidence

- Baseline HEAD: `2a7f5cc3f6543d051f2e692c629ce1dfffad1652`; clean worktree.
- RED: `npm run format:check` exited 1 with eight warnings: `AGENTS.md`,
  `scripts/create-session.mjs`, `src/index.ts`, both generated
  `public/diagram/` assets, and the three minified Cytoscape/Dagre bundles.
- Remedy: ignore only generated `public/diagram/` and the three exact minified
  vendor paths; format only the three authored failing files. Authored
  `public/diagram.js`, `public/diagram.css`, and other vendor files stay checked.
- Historical T0 local verification and independent review passed. Patch delivery
  was verified on 2026-10-27 through the GitHub connector. The full test suite
  was not rerun during delivery.
- GREEN: `npm run check` passed scope, typecheck, 185 unit tests (zero failures,
  two opt-in CodeGraph skips), build, and formatting. Authored stdin formatting
  violations were rejected for `src/index.ts`, `public/diagram.js`, and
  `public/diagram.css`; the exact generated/vendor paths remained ignored.
- Build/rebuild preserved both generated diagram hashes and all three vendor
  hashes. Vendor bytes match the installed lockfile distributions; original
  embedded notices are unchanged. `npm run package:check` passed installed CLI,
  MCP handshake, player assets, and flow API checks. A package dry-run manifest
  includes `LICENSE` and all five protected assets with matching byte sizes.
- Completed delivery SHA: `f2b5f10fbcc59495db00e85a913bf59efb1c492f`.
- The supplied patch applied cleanly to the baseline; all five patch output blob
  hashes matched. The supplied tracker and reviewed plan were imported intact
  in that commit. This follow-up records delivery status.
- Full reviewed plan: [implementation plan](code-anime-elk-reviewed-implementation-plan-2026-10-27.md).

## T0a follow-up — imported documentation formatting

- Baseline HEAD: `ee2317c1d32345de0d7108fc3887ecaeb3d6bc30`.
- RED: `npm run format:check` exited 1, identifying only the imported
  `docs/code-anime-elk-reviewed-implementation-plan-2026-10-27.md` and
  `docs/elk-implementation-tasks.md`.
- Scope: apply repository Prettier settings to those two Markdown documents only;
  keep authored-source checking and generated/vendor exclusions unchanged.
- GREEN: `npm run format:check` passes. The full `npm run check` passes in an
  unrestricted test environment: 185 unit tests passed, zero failed, and two
  opt-in CodeGraph cases skipped; scope/typecheck/build/format all passed.
  Restricted-sandbox runs fail three local-socket/subprocess test files, so
  those sandbox-only failures are not counted as product regressions.
- `npm run package:check` passes installed CLI, MCP handshake, player assets,
  and mock-flow API smoke. Independent review passed. The plan formatting was
  delivered as `b5a08a67ddca4c2e12a88b6f2788e612a6f3446b`; the tracker
  formatting and T0a verification followed as
  `ffd490bb69b0bd9419d5958df98c09ae17f8814c`. Both remote file blobs and
  branch head were verified. No browser pass is claimed.

## B0 — Existing X6 browser MVP blocker before optional ELK tasks

- **Observed RED:** GitHub Actions run
  [40473530665](https://github.com/EmpRider/code-anime/actions/runs/40473530665)
  at `ffd490bb69b0bd9419d5958df98c09ae17f8814c` completed with all four
  Node/check/format matrix jobs successful, but Chromium browser tests **29
  passed, 10 failed**. These six distinct browser-failure groups predate the
  T0a docs fix. They are not a green MVP baseline.
- **Decision gate:** A fresh, genuine 2026-10-27 engineering Council (five
  independent advisors, five newly anonymized peers, live EDO rebuttals)
  recommended minimal, separately tracked B0a/B0b/B0c fixes before T1.
  Full evidence and unresolved alternatives remain in the execution audit;
  this tracker does not claim the Council approved releases or arbitrary UI
  redesign. `AGENTS.md` requires actionable MVP blockers first.
- **B0a — Values disclosure reachability:** Reproduce the desktop sticky-dock
  pointer interception and mobile off-viewport control; use actual Chromium
  bounds/hit-testing and pointer/keyboard RED→GREEN for expand and collapse.
  Preserve playable dock controls, pan/zoom, selection and cursor. Never use
  force-click, blanket `pointer-events: none`, or a test skip as a remedy.
- **B0a focused acceptance verified:** The initial candidate at `4bd022de`
  fixed the desktop Values pointer target but introduced a mobile camera pan on
  keyboard collapse. A focused Council amendment approved opening-only
  reachability adjustment with a monotonic revision guard against stale
  animation-frame callbacks, including rapid open/close/reopen. The corrected
  generated player bundle was delivered as
  `346cb20e780d60fd31d60c58fbad57114e0bd49f`, its authored source as
  `833af2d1f0e1a1bc1ecdfaf2f459274e09993e1c`, and the focused browser
  regression tests as `17c5632680c254d051f2de78bf3af51b18217c8d`.
  Final-head [Actions run 40478955531](https://github.com/EmpRider/code-anime/actions/runs/40478955531)
  confirmed both new desktop and mobile `Values toggle preserves camera after
close and remains pointer reachable` cases **passed**: unforced pointer and
  keyboard disclosure, viewport/camera stability on collapse, rapid toggle
  protection, and playable dock controls. All four Node/check matrix jobs
  passed. This verifies **B0a's focused acceptance only**, not full browser CI.
- **B0b — Map navigation/recovery:** Prove an accessible class/owner→method→
  invocation path, distinct call IDs, correct returns and source, cursor and
  breakpoint preservation, reload/URL and continuation. Repair missing
  map-native behavior before replacing a historical selector assertion.
- **B0b candidate delivery, not acceptance:** Map navigation/continuation
  implementation and browser contract tests were delivered through the GitHub
  connector: generated bundle `8d1328d`, authored source `aa85ba3`, browser
  specification `b8bc3bd`, and amended browser specification `6edcc8d`.
  Full branch HEAD is `6edcc8d7223d001154531fe9a5e1964e3bd1c106`.
  Final-head [Actions run 40483518141](https://github.com/EmpRider/code-anime/actions/runs/40483518141)
  completed: all four Node/check matrix jobs **passed**, but Chromium had
  **37 passed and 6 failed of 43 tests**. The residual failures are one B0b
  mobile focused owner-drilldown case, two B0d desktop/mobile Fit cases, and
  three B0c cases (two recursive raw-edge assertions and one X6 paging case).
  B0b remains a **candidate**, not accepted; full browser CI is RED.
- **B0d — Fit source-step reachability:** Existing
  [Actions run 40481825483](https://github.com/EmpRider/code-anime/actions/runs/40481825483)
  demonstrates desktop/mobile Chromium RED: after `Fit diagram`, the
  `Go to source step 5` control lies outside the reachable viewport. Repair
  the actual fit/hit-target contract; a forced click or weakened assertion is
  not an acceptable remedy. Require unforced pointer and keyboard access to
  Step 5 after Fit on desktop/mobile, repeated Fit/zoom stability, usable
  playback controls, intact cursor/breakpoint and Values disclosure behavior,
  focused RED→GREEN Chromium tests, and independent review before delivery.
- **B0c — Browser assertion integrity:** Prove every prepared index remains
  reachable once, and typed call/return edges preserve real invocation
  ancestry. Use negative controls for missing steps or wrong return targets.
  Source review identifies scoped first-appearance sequence links in
  `public/diagram.js` (around lines 1263–1305) labeled `kind: 'call'` despite
  no call evidence. Verify this truthful typed-edge invariant with a RED
  counter-test before a Council-approved remedy; preserve genuine root-map
  call and return edges.
  Replace obsolete card/edge/page counts only with equivalent or stronger
  user-visible tests; do not narrow or skip browser coverage.
- **Exit gate:** Each slice needs focused RED→GREEN browser evidence,
  independent review, full relevant Node/build/package checks and its own
  descriptive verified GitHub delivery. The B0 gate closes only on applicable
  full browser acceptance (the B0b-v2 suite includes 43 cases; add B0d tests
  to that count when introduced) and successful CI. B0b, B0d and B0c must be
  accepted before T1/T3/T7 resume, absent explicit owner override of MVP-first.

## Role owners and acceptance gates

TL assigns individual specialists and exclusive files before each task starts.
All tasks require independent review; PM coordinates delivery after verification.

| Task | Responsible role                                          | Acceptance/test gate                                                                                                        |
| ---- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| T0   | Formatting implementer; independent QA/reviewer           | RED/GREEN format, authored negative controls, full check, deterministic assets, package smoke check                         |
| T0a  | Documentation formatting specialist; independent reviewer | Only two Markdown files changed; RED/GREEN format, full check and package smoke                                             |
| B0a  | Browser accessibility/UI specialist; independent reviewer | Chromium desktop/mobile Values click open/close and hit-test, keyboard and dock controls, cursor/zoom parity                |
| B0b  | Map navigation/player specialist; independent reviewer    | Accessible nested navigation, invocation and return provenance, URL/recovery/continuation, source and cursor parity         |
| B0d  | Camera/Player UI specialist; independent reviewer         | Unforced pointer/keyboard Step 5 after Fit on desktop/mobile; idempotent zoom/fit, playback/cursor/breakpoint/Values parity |
| B0c  | Browser contract QA specialist; independent reviewer      | Every prepared index accessible, typed call/return ancestry, negative controls, equivalent assertions without test skips    |
| T1   | Semantic-analysis specialist                              | Source-proven nested grouping, distinct event/visit/invocation identity, ambiguous syntax unresolved                        |
| T2   | Topology specialist                                       | Pure compound topology, truthful typed edges, every prepared index preserved                                                |
| T3   | Worker/package specialist                                 | Verified ELK version/license, human distribution approval, real same-origin Worker under CSP, packaged assets               |
| T4   | Layout/protocol specialist                                | Nested DOWN/RIGHT geometry, exact reply matching, restart/malformed/out-of-order failure tests, actual browser Worker       |
| T5   | X6 rendering specialist                                   | Frames/arrows, native selectors, call/return ancestry, visible unresolved fallback, browser interaction                     |
| T6   | Async/player specialist                                   | Stale continuation rejection, cursor/selection/state retention, manual viewport protection, playback parity                 |
| T7   | Preference-storage specialist                             | Legacy/raw orientation and panel migration, corrupt/partial/throwing storage, no preference loss                            |
| T8   | Desktop UX/accessibility specialist                       | Compact PC fit-to-screen, keyboard/focus/zoom controls, no existing mobile regression                                       |
| T9   | Acceptance/performance QA                                 | Full scope/type/unit/browser/build/package gates, 500/1000-event input-to-paint and memory evidence, final license approval |

## Open gates

- B0a's narrow Values desktop/mobile acceptance is verified. B0b is a
  delivered, Chromium-pending candidate; B0d Fit clickability and B0c browser
  contracts remain open. The full browser MVP gate is RED. T1/T3/T7 remain
  paused under `AGENTS.md`; T1–T9 are not implemented or verified.
- Local browser verification is blocked by the unavailable Playwright browser
  binary. Final-head GitHub Actions browser run `40478955531` at `17c56326`
  actually ran **41 tests: 31 passed, 10 failed**. Its two new focused B0a
  cases passed on desktop/mobile; the old full-map cases and eight other
  browser tests remain RED. The `Fit diagram` → source Step 5 offscreen target
  is now separately tracked as B0d, not claimed fixed by B0a/B0b. All four
  Node matrix jobs passed at that historical HEAD, but full browser CI is a
  release blocker. B0b-v2 final-head Chromium run `40483518141` completed:
  **37 passed, 6 failed of 43**; all four Node/check jobs succeeded. Remaining
  browser RED: B0b mobile owner-drilldown (1), B0d Fit (2), and B0c recursive
  raw-edge (2) plus X6 paging (1). The full suite is not green, and the
  `AGENTS.md` MVP gate continues to block T1/T3/T7.
- Verify ELK version, license notices, package inclusion, and obtain human public
  distribution sign-off before distributing the proposed ELK Worker.
- Actual Worker/CSP, nested geometry, async/player parity, desktop interaction,
  long-trace performance, and final package/browser gates remain pending.
- Original trace/design artifacts are unavailable; synthetic acceptance does not
  substitute for human confirmation that those fixtures are sufficient.
