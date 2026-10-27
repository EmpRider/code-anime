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
| B0e  | Preserve overview Fit; focus/zoom then readable step navigation    | B0d; owner choice approved       | IMPLEMENTED_CANDIDATE — targeted CI passed; B0k RED        |
| B0f  | Show literal source first, explicitly simulated event second       | B0c; B0e commit; owner approved  | IMPLEMENTED_CANDIDATE — targeted CI passed; B0k RED        |
| B0g  | Fix mobile composed SVG-transform browser test and interaction     | Ledger push; B0d                 | IMPLEMENTED_CANDIDATE — targeted CI passed; B0k RED        |
| B0h  | Align mobile toolbar tests to intended flex with hit tests         | Ledger push; B0a                 | IMPLEMENTED_CANDIDATE — targeted CI passed; B0k RED        |
| B0i  | Diagnose shared orientation/panel preference key collision         | Ledger push                      | DONE — DIAGNOSTIC ONLY; T7 bug still open                  |
| B0j  | Review accidental trailing README test line                        | B0 gate; owner priority          | LOW_PRIORITY                                               |
| B0k  | Verify grouped boundaries after method collapse                    | B0f; CI 40601192848              | IN_PROGRESS — selected-outer contract, Chromium RED        |
| T1   | Conservative, source-proven nested semantic grouping               | B0 MVP browser gate              | PAUSED — actionable browser failures under AGENTS.md       |
| T2   | Pure logical compound topology and truthful execution edges        | T1                               | Pending                                                    |
| T3   | Real same-origin ELK Worker and distributable package              | B0 gate; dependency/license gate | PAUSED — actionable browser failures under AGENTS.md       |
| T4   | Nested ELK geometry and robust Worker protocol                     | T2, T3                           | Pending                                                    |
| T5   | X6 compound frames, arrows, and existing HTML controls             | T4                               | Pending                                                    |
| T6   | Async race safety and full player-state preservation               | T5                               | Pending                                                    |
| T7   | Isolate orientation/panel preference keys with migration           | B0 MVP browser gate              | PAUSED — actionable browser failures under AGENTS.md       |
| T8   | PC-only compact visual clarity and accessibility                   | T6                               | Pending                                                    |
| T9   | Full mock-trace, performance, and package acceptance               | T1–T8                            | Pending                                                    |

### B0k — full-map boundary contract after collapsing expanded methods

- **Task ID / title:** B0k — Verify grouped-boundary visibility and collapse
  contract. **Priority:** P2 test-contract regression, Council reviewed.
  **Responsible role:** TL-assigned diagram-state/test specialist; independent
  browser QA and Council review. **Dependencies:** B0f provenance delivery and
  exact-head browser result at `a662ea6f89a1342365a37d60813f715db865ffd5`.
  This issue record must be remotely verified **before any B0k code/test fix**.
- **OBSERVED:** [Actions 40553347458](https://github.com/EmpRider/code-anime/actions/runs/40553347458)
  passed four Windows/Ubuntu Node/check jobs and **61/63 Chromium tests**.
  Both remaining failures are the same desktop/mobile
  `full map nests files and owners with synchronized visible mock context`
  case. After `Collapse expanded methods`, the test at
  `tests/browser/player.spec.ts:2063` expects
  `page.locator('.diagram-boundary')` count **0**, while the browser
  consistently returns **3** (one file group, two owner groups).
- **EXPECTED / contract under review:** Current test demands no boundaries
  after collapse, but earlier in the same test it requires one file and two
  owner boundaries. The collapse control may only hide expanded _method_
  cards while preserving the still-grouped full map. The intended boundary
  lifecycle must be verified against product behavior, map navigation,
  call/return routes, selection/context and existing user-visible contracts
  before changing any expectation.
- **Initial source evidence, not a Council decision:** `public/diagram.js`
  collapse clears expanded state without exiting map mode; file/owner
  boundaries are created independently of method expansion and rerendered
  after graph cells are cleared. This plausibly explains the observed three
  persistent parent boundaries. Production regression versus stale assertion
  remains under **Council verification**, not presumed resolved.
- **Scoped reproduction:** Use the exact-head CI browser command
  `npm run test:browser`; inspect the desktop/mobile full-map case, expand
  methods, check typed call/return arrows and progress, collapse, and compare
  file/owner/expanded-method counts and selection/context. Use unforced
  pointer/keyboard verification and a negative control so a test-only
  correction cannot mask an actual missing collapse or broken topology.
- **Affected files/consumers:** `tests/browser/player.spec.ts`, potentially
  `public/diagram.js` and regenerated `public/diagram/diagram.js` only if
  source evidence proves a product defect; desktop/mobile grouped-map
  consumers, source/cursor, expanded cards, selection/context and typed
  call/return edges.
- **Acceptance:** Council completes five independent advisor perspectives,
  anonymized peer-review and EDO challenge/rebuttal, compares narrow
  contract correction with a production lifecycle fix; the chosen permanent
  remedy has independent review and real Chromium desktop/mobile regression
  evidence with non-vacuous semantic assertions. All four Node/check jobs,
  whole browser suite, build and package gates pass on the exact pushed HEAD.
  Task remains open until a separate, verified B0k browser-test commit and
  exact-head full acceptance. The preceding evidence describes initial
  discovery; see the dated Council decision below.

#### B0k Council decision — 2026-10-28

- **Exact pre-fix evidence:** Branch HEAD `db29779196a16d1938cbe4fbb95ec7f5fc41726a`;
  [Actions #40598039061](https://github.com/EmpRider/code-anime/actions/runs/40598039061)
  passed four Node/check/package jobs and **61/63 Chromium tests**. The only
  two failures were the desktop/mobile `full map nests files and owners with
synchronized visible mock context` cases at `player.spec.ts:2063`:
  assertion expected zero `.diagram-boundary` nodes but got three.
- **Contract evidence:** `public/diagram.js` only clears method expansion on
  `Collapse expanded methods`; full-map grouping is independent of method
  expansion. `docs/react-migration-audit.md:79–103` explicitly promises that
  file/owner groups and call/return arrows remain after methods collapse.
  The same browser case earlier expects one file and two owner boundaries.
- **Genuine Council:** Five independently tasked role advisors (architecture,
  implementation, QA, reliability/accessibility, devil's advocate); five new
  anonymized blind peer reviews; an EDO-led technical challenge and live QA
  plus devil's-advocate rebuttals. The unanimous engineering recommendation
  was **Option A: a narrow, nonvacuous test-contract correction**. No human
  approval for a different grouping UX, ungroup mode, or release is inferred.
  Removing production boundaries (Option B) was rejected for breaking a
  documented Full-map contract; switching to an ungrouped mode (Option C)
  would need a separate owner decision; leaving the test RED (Option D) is
  not an acceptable completed remedy.
- **Approved change boundary:** Fix `tests/browser/player.spec.ts`, not
  production JS/CSS. Assert after collapse exactly one correctly labeled
  prepared file boundary and two distinct prepared owner boundaries; two
  unexpanded outer method cards; zero expanded/child cards; geometrically
  correct hierarchy; preserved typed A→B call and B→A return identities;
  cursor `5 / 8`, no orphaned selection/context and connected, accessible
  keyboard focus. Use the group-B hide/restore behavior as a negative control
  for missing owner/return edges. Owner `B` is prepared mock grouping, not
  a claim about a runtime class declaration.
- **Residual uncertainty:** Assertions after the original failure did not
  execute in that CI run. If the corrected browser run exposes a genuine
  source, focus, or selection defect, reopen a separate scoped production
  task rather than weakening that check. The local environment lacks the
  pinned Playwright Chromium binary; browser acceptance must be established
  by exact-head GitHub Actions, not inferred from local Node success.
- **Completion gate:** Push the Council/ledger preflight before editing the
  test. After the separate corrective commit, require independent review,
  genuine desktop/mobile Chromium PASS and full browser/Node/package/build
  evidence at the final pushed HEAD. Do not mark B0k or B0e–h DONE early.

#### B0k implementation delivery — verification pending

- Council-approved ledger preflight: `f12e159a1a8ce8e02bfb45a02384c01a6f09b48c`;
  full Council dossier: `d702106fa0d725c19f1dc88ae1412564bc9dad04`.
  Both commits were verified on the remote branch before the test edit.
- Scoped test-only commit: `17ad7e67aa12fe9928c0bed3ed7209f528b4e9ee`;
  only `tests/browser/player.spec.ts` changed. Exact remote test blob
  `7b008178657d99cd3f72ca4b58a8a77621454c4d` verified. It checks
  surviving mock file/owner frames, contained methods, removed nested cards,
  typed call/return edges, cursor, keyboard focus, and owner-B negative
  hide/restore behavior. No production code or generated asset changed.
- Local `npm run check` **PASS**: static scope, typecheck, 185 unit tests
  passed and two opt-in skipped, build, formatting. Local
  `npm run package:check` **PASS** (installed CLI, MCP handshake, player
  assets and flow API). Independent browser QA and architecture diff review
  approved with minor geometry/focus concerns addressed before push.
- Local Playwright collected **63 tests** but could not launch Chromium: the
  pinned executable is absent and the attempted browser download returned an
  invalid zero-length ZIP. This is **not browser acceptance**. Require exact
  final-head GitHub Actions Chromium and four Node/check/package jobs before
  marking B0k or the B0 candidates DONE. If newly exposed focus/context or
  grouping checks fail, create a scoped follow-up task and preserve RED.

#### B0k focused selection-contract amendment — 2026-10-28

- **Observed new RED:** Exact pushed ledger HEAD
  `4470c76c97f5704898ae5e20213b72f1103ef762`,
  [Actions #40601192848](https://github.com/EmpRider/code-anime/actions/runs/40601192848):
  four Node/check/package jobs **PASS**, Chromium **61/63 PASS**. Only the
  desktop/mobile grouped-map case fails at `player.spec.ts:2125`, where
  `.diagram-selection` is expected hidden but remains visible. The previous
  file/owner counts, distinct labels, containment and typed edges now pass;
  later focus/context and negative checks were not reached.
- **Source-grounded diagnosis:** `onExpand` selects the outer B method
  (`public/diagram.js:524–546`). Global method-only Collapse clears only
  expansion (`:688–693`), leaving outer B present; `render` reselects
  that valid node (`:1490`). The documented contract clears actions when
  the selected **node itself** is removed or filtered, not when the
  selected outer method's child details are collapsed. Thus the blanket
  hidden assertion is stale; no production selection bug is yet proven.
- **Focused Council amendment:** Original independent QA and Devil's
  Advocate replied live to the EDO's new-evidence challenge following the
  previously completed five-advisor/five-blind-peer review. Both support
  preserving selection of surviving outer B and clearing an explicitly
  selected removed child. Detailed advisory evidence:
  [B0k selection amendment](b0k-selection-amendment-edo-2026-10-27.md).
  This remains the existing **B0k** task, not an invented B0l issue.
- **Next authorized test-only correction:** Assert positive outer-B selection
  persistence and valid actions after method Collapse; contrasting negative
  paths select a nested child before Collapse (orphan actions must clear),
  then hide owner B (selection/pair clears), restore B (no automatic reselection),
  and explicitly reselect if needed. Retain cursor, typed arrows, file/owner
  grouping, source/Values and keyboard/pointer focus. If a real orphaned-child
  or inaccessible-control bug emerges, record a separate scoped source-fix
  task before production edits. Browser 63/63 and exact-head Node/package
  evidence remain mandatory before DONE.

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
- **B0e — UX/accessibility specialist; owner approved option A:** explicit Fit
  must show the whole-map overview; users then focus Step 5 with keyboard and
  activate `Read selected node` to zoom/center until labels reach >=12px.
  Verify actual hit target, pointer/keyboard navigation, and preserved branch
  routes; readability is checked after deliberate Read, not immediately after Fit.
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
- **Verified diagnostic delivery:** independent spec/quality review accepted
  the source-grounded reproduction. GitHub connector verified documentation
  commit `c1c4bc19cccd68ae9aaeb14bae5d3113857cf86c` and tracker blob
  `ea0ebacf` on `fix/react-layout-collapse`. **B0i is DONE only for the
  diagnostic**, contingent on this separate status commit being pushed and
  verified. No storage migration or browser UI acceptance has been performed;
  **T7 remains PAUSED/WAITING_ON_OWNER** for remedial design approval.

### Owner-resolved B0e/B0f contracts — implementation gate

#### B0f implementation evidence — 2026-10-27

- Implementer: `/root/pm/tl/b0f_implementer_v2`; independent reviewer:
  `/root/pm/tl/b0f_review`. Base: B0e progress commit
  `e4e078263d5732c38f009603250f65601656c370`.
- Root cause: semantic expanded leaves selected `event.label`, bypassing the
  source-first labels already prepared by `createDrilldown`. Reuse those labels
  by replay index; preserve control titles, event objects, call IDs, typed edges,
  source locations, Values and seek handlers. Missing/out-of-range source retains
  the event-label fallback.
- Primary source text remains in the existing `textContent` sink. The existing
  header kind slot now shows `Simulated: ${event.label}` for semantic leaves.
  Header and primary text use ellipsis with full tooltips; no new height band,
  dependency, analyzed-code execution or ELK change.
- Tests were edited before production: existing desktop/mobile source/mock
  assertions strengthened; six missing/out-of-range/markup-looking long-source
  cases added. Shared-return tests assert identical source text across distinct
  invocation IDs and node IDs. Existing cursor, Values and typed-return checks
  remain. Prior baseline has two genuine B0f source-label RED cases; new cases
  have not achieved a local behavior RED/GREEN cycle.
- `npm run test:browser -- --grep 'expanded source provenance' --reporter=line`
  first hit sandbox `listen EPERM 127.0.0.1`; approved elevated retry reached
  Playwright but all six cases failed before execution because
  `chromium_headless_shell-1248` is not installed. Browser behavior, safe-text
  rendering and overflow remain **UNVERIFIED** pending exact-head Chromium CI.
- `npm run check` passed: static scope guard, typecheck, 187 Node tests
  (185 passed, 2 skipped, 0 failed), build and repository formatting check.
  The build regenerated tracked `public/diagram/diagram.js`; integration
  explicitly requested retaining that synchronized distribution artifact.
  `git diff --check` passed. Long simulated labels also have header
  ellipsis/title assertions; both repeated call sites now use `demo.ts:3`
  with distinct call-node IDs and `b`/`b-again` typed call routes. Independent
  review and final browser evidence remain pending.
  Status remains **IN_PROGRESS**, not DONE. No remote write is performed by the
  implementer; task-specific delivery and exact-head CI belong to integration.

The owner explicitly selected the following options after the Council's
five-advisor, five-peer, EDO challenge/rebuttal review. These **authorize the
scoped existing-MVP B0e and B0f fixes**, not the optional ELK redesign.

- **B0e — whole-map Fit / accessible readable detail (first):** preserve
  `Fit diagram` as an overview of the entire prepared map, including true
  branch/loop/return structure. Do **not** promise immediate >=12px labels at
  overview scale: the dense fixture measured 6.73px desktop / 2.15px mobile.
  Keep keyboard selection, an explicit `Read selected node` focus/zoom path,
  and source Step 5 reachable by unforced pointer and keyboard. **After
  focus/zoom**, assert labels >=12px, actual target inside the visible surface
  and not intercepted; repeated Fit/read, source cursor, return arrows, Values
  and playback must remain intact. Preserve or strengthen browser assertions;
  never simply delete the >=12px check. Responsible role: camera/accessibility
  QA with independent review. Inspect `public/diagram.js:342–399,541–555`,
  `public/diagram.css:436–440` and `tests/browser/player.spec.ts:994–1005`.
- **B0f — source/mock provenance (second, after B0e delivery):** primary card
  label displays the literal source text when evidence exists; a separate,
  clearly marked **Simulated** secondary label retains mock event identity.
  Preserve `event.id`, invocation IDs, repeated same-line calls, typed returns,
  truthful source fallback, source cursor and existing mock values. Render
  arbitrary source text via safe text sinks (`textContent`), not HTML parsing.
  Add browser negative controls for duplicate invocation/source lines, absent
  source and markup-looking text. Responsible role: semantic-card engineer with
  independent QA/security review. Inspect `public/diagram.js:928–947` and
  `public/diagram-drilldown.js:44–69`.
- **Baseline:** exact-code [Actions 40544366684](https://github.com/EmpRider/code-anime/actions/runs/40544366684)
  at `433e6d26e0326d14303b5ee176d66012d0b5ba60` passed 4/4 Node/check
  jobs and 53/57 Chromium cases. Its **only four failures** are the two B0e
  readability cases and two B0f literal-source/mock-label cases.
- **Delivery:** publish and remotely verify **this decision-ledger update
  before source/test edits**. Ship B0e and B0f as distinct task-specific
  commits with `IN_PROGRESS` whenever any acceptance criterion, especially
  real Chromium, remains outstanding. Independent review and exact-head CI
  are mandatory; no release, merge or task-file cleanup is authorized.
- **ELK T1–T9:** owner chose **Review plan first**; revised
  `docs/code-anime-elk-reviewed-implementation-plan-2026-10-27.md` has **NOT**
  received explicit renewed design/implementation approval. All T1–T9 remain
  PAUSED under `AGENTS.md`, even if B0 browser becomes green. Owner-gated T7
  preference migration remains separately OPEN.

### B0e candidate verification — 2026-10-27

- **Status: IN_PROGRESS.** Test-only changes in `tests/browser/player.spec.ts`
  preserve whole-map Fit bounds and branch routes. Actual Tab traversal reaches
  Step 5's name. Each of two Fit/Read cycles pans Step 5 offscreen with keyboard
  arrows, reverse-Tabs to Read, and activates it with Enter. Assertions require
  centered Step 5, effective Step 5 and decision labels >=12px, unobstructed
  source-button geometry, pointer/keyboard source navigation and correct cursor.
  No production code or static/mock behavior changed.
- **Observed checks:** scoped Prettier and `git diff --check` passed. Restricted
  `npm run check` passed scope/typecheck but reported three file-level test
  failures (`analysis.test.ts`, `builder.test.ts`, `provider.test.ts`). Elevated
  `npm run check` then passed scope/typecheck, all unit tests (187 total, 185
  passed, 2 existing skips, 0 failed), build and whole-tree formatting. Existing
  npm proxy and unresolved build-time layout-icon warnings remained.
- **Browser UNVERIFIED:** focused desktop/mobile
  `graph groups loop visits and decision paths without losing steps` first
  stopped at `listen EPERM: operation not permitted 127.0.0.1`. The elevated
  rerun passed server startup but both cases stopped before assertions because
  `chromium_headless_shell-1248` was absent. No browser RED/GREEN or mutation
  result is claimed. Independent review and exact-head Chromium CI remain gates;
  no commit or remote delivery is claimed here.

### B0e mobile cursor-follow test correction — 2026-10-27

- **Status: IN_PROGRESS.** Isolated base HEAD
  `3c0ced89eeb96846f046655c491c89f6b575848a`. Prior CI run `40549840023`
  at `e4e078` passed this desktop case but timed out on mobile after 30 seconds.
  The failed mobile screenshot showed cursor 6/8 with the decision centered.
  **Hypothesis, not confirmed root cause:** after seeking 6, cursor-follow
  (`public/diagram.js:1545–1572`) moves Step 5's source button offscreen.
- Test-only correction uses the owner-approved `Read selected node` action
  after seeking 6, before the unforced pointer source-button click. Both
  Fit/Read cycles, actual Tab/Shift+Tab traversal, offscreen pan, whole-map
  bounds, branch routes and keyboard source navigation remain. Read polls
  require at least two labels with effective font sizes >=12px within three
  seconds; the pointer phase also polls genuine contained/unobstructed geometry.
  Named test steps identify each Fit/Read cycle and both source-navigation phases.
  No production source, timeout increase or assertion deletion.
- **Observed local checks:** `npm ci --ignore-scripts` completed. Restricted
  `npm run check` passed scope/typecheck, then reported file-level failures in
  `analysis.test.ts`, `builder.test.ts` and `provider.test.ts` (22 passed, 3
  failed). Elevated `npm run check` passed scope/typecheck, all unit tests (187
  total, 185 passed, 2 existing skips, 0 failed), build and whole-tree formatting.
  Existing npm proxy and unresolved build-time layout-icon warnings remained.
- **Browser UNVERIFIED:** focused restricted run stopped at localhost
  `listen EPERM`; elevated desktop/mobile rerun reached browser launch, then both stopped
  before assertions because `chromium_headless_shell-1248` is absent. No local
  browser RED/GREEN or mutation result claimed. Independent review and exact-head
  Chromium CI are still required; no commit/push or B0 completion claimed.

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
