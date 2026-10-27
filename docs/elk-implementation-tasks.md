# ELK implementation task progress

Source: owner-approved reviewed implementation plan dated 2026-10-27. Static
analysis and explicitly labeled AI mock data remain mandatory; analyzed user
code must never execute to construct animations.

| Task | Description                                                        | Dependencies                     | Status                                                     |
| ---- | ------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------------------- |
| T0   | Restore mandatory formatting CI at the authored/generated boundary | Approved formatting remedy       | DONE — delivered as f2b5f10; remote branch verified        |
| T0a  | Format newly imported ELK plan and task-tracker docs to restore CI | T0 delivery; two-file CI failure | DONE — delivered as b5a08a67 and ffd490bb; remote verified |
| B0a  | Restore Values disclosure pointer and viewport reachability        | T0a; browser RED baseline        | DONE — focused desktop/mobile Chromium GREEN; full CI RED  |
| B0b  | Restore or prove equivalent map navigation and continuation        | B0a; behavior-contract evidence  | WAITING — user-visible navigation acceptance pending       |
| B0c  | Align stale browser assertions with truthful mock-flow behavior    | B0b; typed-edge/step evidence    | WAITING — no expectation-only test changes authorized      |
| T1   | Conservative, source-proven nested semantic grouping               | B0 MVP browser gate              | PAUSED — actionable browser failures under AGENTS.md       |
| T2   | Pure logical compound topology and truthful execution edges        | T1                               | Pending                                                    |
| T3   | Real same-origin ELK Worker and distributable package              | B0 gate; dependency/license gate | PAUSED — actionable browser failures under AGENTS.md       |
| T4   | Nested ELK geometry and robust Worker protocol                     | T2, T3                           | Pending                                                    |
| T5   | X6 compound frames, arrows, and existing HTML controls             | T4                               | Pending                                                    |
| T6   | Async race safety and full player-state preservation               | T5                               | Pending                                                    |
| T7   | Isolate orientation/panel preference keys with migration           | B0 MVP browser gate              | PAUSED — actionable browser failures under AGENTS.md       |
| T8   | PC-only compact visual clarity and accessibility                   | T6                               | Pending                                                    |
| T9   | Full mock-trace, performance, and package acceptance               | T1–T8                            | Pending                                                    |

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
- **B0c — Browser assertion integrity:** Prove every prepared index remains
  reachable once, and typed call/return edges preserve real invocation
  ancestry. Use negative controls for missing steps or wrong return targets.
  Replace obsolete card/edge/page counts only with equivalent or stronger
  user-visible tests; do not narrow or skip browser coverage.
- **Exit gate:** Each slice needs focused RED→GREEN browser evidence,
  independent review, full relevant Node/build/package checks and its own
  descriptive verified GitHub delivery. The B0 gate closes only on applicable
  full browser acceptance (41/41 under the current suite) and successful CI.
  T1/T3/T7 remain paused until then or explicit owner override of MVP-first.

## Role owners and acceptance gates

TL assigns individual specialists and exclusive files before each task starts.
All tasks require independent review; PM coordinates delivery after verification.

| Task | Responsible role                                          | Acceptance/test gate                                                                                                        |
| ---- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| T0   | Formatting implementer; independent QA/reviewer           | RED/GREEN format, authored negative controls, full check, deterministic assets, package smoke check                         |
| T0a  | Documentation formatting specialist; independent reviewer | Only two Markdown files changed; RED/GREEN format, full check and package smoke                                             |
| B0a  | Browser accessibility/UI specialist; independent reviewer | Chromium desktop/mobile Values click open/close and hit-test, keyboard and dock controls, cursor/zoom parity                |
| B0b  | Map navigation/player specialist; independent reviewer    | Accessible nested navigation, invocation and return provenance, URL/recovery/continuation, source and cursor parity         |
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

- B0a's narrow Values desktop/mobile acceptance is verified, but B0b/B0c and
  the full browser MVP gate remain RED. T1/T3/T7 are blocked by that actionable
  gate; T1–T9 are not implemented or verified.
- Local browser verification is blocked by the unavailable Playwright browser
  binary. Final-head GitHub Actions browser run `40478955531` at `17c56326`
  actually ran **41 tests: 31 passed, 10 failed**. Its two new focused B0a
  cases passed on desktop/mobile; the old full-map cases and eight other
  browser tests remain RED. The `Fit diagram` → source Step 5 offscreen target
  is assigned to B0b for diagnosis, not claimed fixed by B0a. All four Node
  matrix jobs passed, but full browser CI is a release blocker.
- Verify ELK version, license notices, package inclusion, and obtain human public
  distribution sign-off before distributing the proposed ELK Worker.
- Actual Worker/CSP, nested geometry, async/player parity, desktop interaction,
  long-trace performance, and final package/browser gates remain pending.
- Original trace/design artifacts are unavailable; synthetic acceptance does not
  substitute for human confirmation that those fixtures are sufficient.
