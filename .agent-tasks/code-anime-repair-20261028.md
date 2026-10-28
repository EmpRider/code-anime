# Code Anime repair ledger — 2026-10-28

Repository: `EmpRider/code-anime` · Branch: `fix/react-layout-collapse` · Baseline: `cc2894b0f5ad0373a5400771986cc277b1e2fd19`.

User authorized this ledger and separate verified fix commits pushed to this branch. **No merge, publish, release, or deploy.** BA `/root`; PM `/root/pm`; TL `/root/pm/tl`; specialists: dev, QA, UX, skill-loader. Status remains `WAITING_ON_REPRO` until root-cause evidence. `DONE` requires tests, independent review, task-specific commit/push, remote SHA verification, and final status update.

Council kickoff: five independent advisors, anonymous peer review, and owner-led challenge/rebuttal. Proposed staged minimal-impact permanent repairs; preserve every prepared event and exact selected Visit/call/source/Values identity. Broad engine migration/UI redesign requires separate design and plan approvals. No specific root cause accepted from counts alone.

Pinned upstream snapshots: Superpowers `2ce8aa15`, Council `a7565e21`, Caveman `9b68f7ed`, Ponytail `09c434ab`, ADHD `1ecea199`, Attention Span `8a6e2250` (full SHAs/digests in skill-loader evidence).

## CA-001 — Selected loop call-edge route (P0)

- Owner: development specialist; TL supervisor. Status: `WAITING_ON_REPRO`. Lock: `public/diagram.js` and related tests.
- Observed: expected one selected call edge, got two (`tests/browser/player.spec.ts:880–948`). Expected exact Visit route with all recorded iterations preserved.
- Hypothesis: filtering by retained `stepNodes` (`public/diagram.js:1538–1550`); not proven.
- Reproduce identity/edge trace across Visit switching. Acceptance: targeted desktop/mobile and full browser suite green; selected Visit, cursor, call, source, Values refer to same prepared event.

## CA-002 — Loop picker identity/options (P0)

- Owner: development specialist. Status: `WAITING_ON_REPRO`. Depends on CA-001 shared-root diagnosis. Same file lock.
- Observed: four picker options where two expected (`tests/browser/player.spec.ts:1001–1055`). Expected only valid selectable Visit identities with exact cursor mapping.
- Hypothesis: per-iteration picker rendering (`public/diagram.js:1152–1159`); verify before edit. Never remove prepared events or weaken assertions.
- Acceptance: targeted desktop/mobile and full suite pass, correct identity selection.

## CA-003 — Vertical geometry (P1)

- Owner: graph/development specialist. Status: `WAITING_ON_REPRO`. Lock: diagram layout files.
- Observed: displaced/incorrectly ordered siblings (`tests/browser/player.spec.ts:1325–1452`). Expected ordered, non-overlapping vertical flow.
- Cause unverified; inspect orientation propagation, async readiness, actual DOM. Acceptance: both orientations desktop/mobile, semantic endpoints preserved, no clipping; full browser suite.

## CA-004 — Values card anchor (P1)

- Owner: graph/development specialist. Status: `WAITING_ON_REPRO`. Lock: geometry renderer.
- Observed: Values card shifts vertically 29px desktop/64px mobile on Enter expansion (`tests/browser/player.spec.ts:1574–1718`). Expected stable anchor and focus.
- Cause unverified; inspect onExpand, worker, camera/reflow. Acceptance: targeted browser tests, identity/focus preservation, full suite.

## CA-005 — Branch labels/collision (P1)

- Owner: graph specialist. Status: `WAITING_ON_REPRO`. Depends on CA-001..004 stabilization and measured nested fixture.
- Observed code allows missing labels and lacks edge-segment obstacles (`public/diagram-label-placement.js:9–54`, `tests/diagram-label-placement.test.mjs:40–57`). Expected labels discoverable and no unintended node/label/edge collisions.
- Minimal evidenced fix only; broad geometry redesign requires separate approval. Acceptance: rendered DOM/SVG geometry and full interaction tests.

## CA-006 — Follow-off/keyboard UX (P1)

- Owner: UX/development specialist. Status: `WAITING_ON_REPRO`.
- Risks: auto-center despite Follow off (`public/player.js:2715–2743`), global keys (`:3347–3387`), hidden zoom actions (`public/diagram.css:479–485`). Expected intentional keyboard controls and stable manual viewport.
- Reproduce first; acceptance: keyboard-only, Follow-off playback and regression tests.

## CA-007 — Text clipping/legibility (P1/P2)

- Owner: UX/UI specialist. Status: `WAITING_ON_REPRO`.
- Risks: 9–10px metadata, clipped decision labels (`public/diagram.css:301–410,829–841`), contradictory legacy CSS (`public/styles.css:2908–3170`). Expected compact readable desktop flow.
- Measure 1366×768/200% zoom and apply only proven localized correction; wholesale redesign `BLOCKED` pending design/plan approval. Acceptance: browser screenshot/bounds and accessibility checks.

## CA-008 — Browser visual/full verification (QA)

- Owner: QA specialist. Status: `WAITING_ON_REPRO`. Depends on applicable fixes.
- Baseline GitHub Actions `40725527807`: Node 4/4 pass, Chromium browser 64 pass / 8 fail. Expected full green tests, zero unintended overlap, semantic route correctness, desktop 1366×768 100%/200% zoom, keyboard/focus and dark/light visual acceptance.
- Do not remove/relax failing assertions or claim pixel-perfect acceptance without browser evidence.

Every newly discovered issue receives a separate ledger entry pushed **before** implementation. Each completed task receives its own verified commit/push and later `DONE` status update. Retain task files until user explicitly approves completion and cleanup.
