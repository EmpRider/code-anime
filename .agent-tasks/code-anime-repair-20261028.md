# Code Anime repair ledger — 2026-10-28

Repository: `EmpRider/code-anime` · Branch: `fix/react-layout-collapse` · Baseline: `cc2894b0f5ad0373a5400771986cc277b1e2fd19`.

User authorized this ledger and separate verified fix commits pushed to this branch. **No merge, publish, release, or deploy.** BA `/root`; PM `/root/pm`; TL `/root/pm/tl`; specialists: dev, QA, UX, skill-loader. Status remains `WAITING_ON_REPRO` until root-cause evidence. `DONE` requires tests, independent review, task-specific commit/push, remote SHA verification, and final status update.

Council kickoff: five independent advisors, anonymous peer review, and owner-led challenge/rebuttal. Proposed staged minimal-impact permanent repairs; preserve every prepared event and exact selected Visit/call/source/Values identity. Broad engine migration/UI redesign requires separate design and plan approvals. No specific root cause accepted from counts alone.

Pinned upstream snapshots: Superpowers `2ce8aa15`, Council `a7565e21`, Caveman `9b68f7ed`, Ponytail `09c434ab`, ADHD `1ecea199`, Attention Span `8a6e2250` (full SHAs/digests in skill-loader evidence).

## CA-001 — Selected loop call-edge route (P0)

- Owner: development specialist; TL supervisor. Status: `VERIFIED/AWAITING_BROWSER_CI`. Lock: `public/diagram.js` and generated diagram bundle. Remote browser verification pending; not `DONE`.
- Observed: expected one selected call edge, got two (`tests/browser/player.spec.ts:880–948`). Expected exact Visit route with all recorded iterations preserved.
- Root-cause evidence: `prepareControlFlow` retains every prepared loop visit and marks its region selected/unselected. The renderer previously filtered call routes by `stepNodes` existence, which cannot distinguish retained unselected visits (`public/diagram-control-layout.js:52–80`, `public/diagram.js:1538–1550`). Council/TL accepted an edge-only projection fix while keeping all prepared event cards available.
- Implemented: collect indices whose prepared-card region ancestry contains an unselected loop; omit only their grouped expanded call/return connections, preserving canonical events, cursor navigation and the cards themselves. Generated player bundle rebuilt.
- Verification: `npm run check` exit 0 outside filesystem/network sandbox restrictions: scope guard, typecheck, Vite build, Node 250 PASS / 0 FAIL / 2 SKIP, Prettier PASS. `git diff --check` PASS. Independent QA source review approved conditionally. Local browser RED/GREEN unavailable because Playwright Chromium is not installed; CI baseline `40725527807` proves RED (2 edges, expected 1), but remote post-push Chromium remains required.
- Acceptance pending: targeted desktop/mobile and full browser suite green; selected Visit, cursor, call, source and Values refer to the same prepared event. If remote CI fails, keep task open and investigate rather than weakening assertions.

## CA-002 — Loop picker identity/options (P0)

- Owner: development specialist; TL supervisor. Status: `VERIFIED/AWAITING_BROWSER_CI`. Depends on CA-001 shared-root diagnosis. Same file lock; no remote browser green claim.
- Observed: four picker options where two expected (`tests/browser/player.spec.ts:1001–1055`). Expected only valid selectable Visit identities with exact cursor mapping.
- Root cause: `prepareControlFlow` creates a loop header for each recorded visit, and the renderer attached the full Visit selector to each header (`public/diagram-control-layout.js:52–80`, `public/diagram.js:1152–1159`); two headers each with two options yielded four options. The Council's challenged B decision keeps one canonical selector on the selected structural Visit region, distinct from cursor-only highlighting. All visit cards and history remain.
- Implemented: selected-region-only picker; browser assertion requires one picker before and after explicit selection, two options, and correct cursor seek. T6 native-renderer test verifies one picker, two options, selected value unchanged on cursor-only 5-to-9 updates, keyboard focus continuity and no extra Worker request. The earlier active-card-specific test locator was revised through explicit Council acceptance, without removing its behavioral focus assertions.
- Verification: targeted `node tests/diagram-routing.test.mjs` 20 PASS / 0 FAIL. Full `npm run check` exit 0: scope guard, typecheck, Vite build, Node 250 PASS / 0 FAIL / 2 SKIP, Prettier PASS; `git diff --check` PASS. Independent QA approved. Local Chromium unavailable; remote browser CI is pending.
- Acceptance pending: targeted desktop/mobile and full browser suite pass, exact identity selection, cursor/source/Values alignment and keyboard focus after explicit Visit switching. Keep task open if remote CI fails.

## CA-003 — Vertical geometry (P1)

- Owner: graph/development specialist. Status: `VERIFIED/AWAITING_BROWSER_CI`. Lock: `tests/browser/player.spec.ts` only; no production geometry changes.
- Observed: vertical sibling bounds were sampled immediately after the orientation click (`tests/browser/player.spec.ts:1325–1475`), while diagram geometry settles asynchronously through ELK and the canvas reports `data-layout-state` pending/stale/ready. The prior browser CI failure remains the behavioral RED; final rendered geometry has not yet been proven correct.
- Council decision: synchronize the browser test with the requested canvas direction and ready state; sample child DOM bounds across two animation frames for stability, then retain the original strict vertical non-overlap and x-alignment assertions unchanged. A ready marker alone does not waive geometry correctness. If CI still fails, reopen as a real geometry defect; do not weaken assertions.
- Verification: full `npm run check` scope guard, typecheck, Vite build and Node tests 250 PASS / 0 FAIL / 2 SKIP; Prettier and `git diff --check` PASS. The local pinned Playwright Chromium install failed despite authorized escalation (CDN delivered invalid/truncated 0 MiB ZIP); no local browser pass is claimed.
- Acceptance pending: remote browser CI must validate desktop/mobile strict geometry in both directions, no clipping or semantic endpoint regression. Task remains open until browser green.

## CA-004 — Values card anchor (P1)

- Owner: graph/development specialist. Status: `WAITING_ON_REPRO`. Lock: geometry renderer.
- Observed: Values card shifts vertically 29px desktop/64px mobile on Enter expansion (`tests/browser/player.spec.ts:1574–1718`). Expected stable anchor and focus.
- Cause unverified; inspect onExpand, worker, camera/reflow. Acceptance: targeted browser tests, identity/focus preservation, full suite.

## CA-005 — Branch labels/collision (P1)

- Owner: routing specialist; TL supervisor. Status: `READY_AFTER_CA-011`. Depends on CA-010/011 and a measured nested fixture; CA-004 remains independently browser-diagnostic blocked.
- Observed code allows missing labels and lacks edge-segment obstacles (`public/diagram-label-placement.js:9–54`, `tests/diagram-label-placement.test.mjs:40–57`). Expected labels discoverable and no unintended node/label/edge collisions.
- User-approved visual scope: orthogonal paths, meaningful label clearance, optional bounded correction when measured conflicts justify it. Preserve exact semantic edge identities and endpoints; no silent label drop. Max three strictly improving deterministic passes, then accessible unresolved fallback. Existing targeted semantic smoke plus a focused assertion for any new routing logic; user manual visual feedback is the aesthetics gate. Do not imply browser green.

## CA-006 — Follow-off/keyboard UX (P1)

- Owner: UX/development specialist. Status: `VERIFIED/AWAITING_BROWSER_CI` for the narrowly scoped Follow-off fallback auto-scroll fix; keyboard/zoom items remain separate and unimplemented.
- Root cause: despite the existing Follow guard on the packet's first canvas scroll, the later legacy fallback centering called canvas `scrollTo` and optional source-lines `scrollTo` unconditionally (`public/player.js:2715–2743`). This overrode manual pan/source inspection during playback. Explicit stack source reveal in `renderSource` and the Center View button are separate user intents.
- Council decision and fix: guard only both legacy automatic centering paths with `Follow.checked`; retain Follow-on behavior, explicit source reveal and Center View regardless of Follow. Deterministic JSDOM fallback harness injects optional historical `source-lines`, verifies actual packet path and spies both `scrollTo` methods: RED manual canvas offset `0 !== 71`, then GREEN Follow-off preserved 71/37 offsets, Follow-on both centering calls resume, Center View works independently.
- Verification: focused `node tests/player.test.mjs` 7 PASS / 0 FAIL; full `npm run check` scope guard, typecheck, Vite build and Node 251 PASS / 0 FAIL / 2 SKIP, Prettier PASS; `git diff --check` PASS. Independent QA approved. Remote browser CI still required before DONE.
- Acceptance pending: browser fallback Follow-off/manual viewport and Follow-on centering regressions. No keyboard or zoom changes in this commit.

## CA-007 — Text clipping/legibility (P1/P2)

- Owner: theme specialist; TL supervisor. Status: `READY_AFTER_CA-005`. Lock: `public/styles.css` only; graph CSS owned by CA-010. No other UI files without separate Council scope check.
- Risks: 9–10px metadata, clipped decision labels (`public/diagram.css:301–410,829–841`), contradictory legacy CSS (`public/styles.css:2908–3170`). Expected compact readable desktop flow.
- Approved scope: darker theme tokens, clean panel separation, and only safe internal spacing reductions. All existing component locations, arrangements, panel/control outer bounds, functionality, zoom/pan and keyboard targets are locked. EDO defers risky control padding unless browser measurement proves outer bounds remain unchanged (±1 CSS px). User manual visual review is required. No new panels or component relocations.

## CA-008 — Browser visual/full verification (QA)

- Owner: independent QA specialist. Status: `READY_AFTER_CA-007`. Depends on approved visual changes.
- Baseline GitHub Actions `40725527807`: Node 4/4 pass, Chromium browser 64 pass / 8 fail. Expected full green tests, zero unintended overlap, semantic route correctness, desktop 1366×768 100%/200% zoom, keyboard/focus and dark/light visual acceptance.
- User revised verification: do not create a large cosmetic unit/snapshot suite. Keep existing essential semantic smoke, typecheck/build/format/bundle parity, and a focused assertion for new nontrivial route logic. User will run UI and provide visual feedback; leave `WAITING_ON_USER_VISUAL` and `AWAITING_BROWSER_CI` as applicable. Do not remove/relax existing failing assertions or claim pixel-perfect/browser acceptance without evidence.

## Approved visual-implementation kickoff — 2026-10-29

- User approved the reference-inspired graph design and separate Implementation Plan v1; then explicitly instructed implementation with minimal new unit testing for visual appearance and user-led manual visual review. No merge, publish, release, or deploy.
- Hard lock: all existing desktop component locations, arrangements, panel sizes, controls, interaction behavior, manual zoom/pan and camera. Only darker theme tokens and measured safe internal padding/margin/gap reductions outside the graph. No automatic zoom-to-fill. Graph work: semantic shapes, AST-backed grouping, alignment, orthogonal connectors and mandatory labels.
- Fresh task skill manifest: Superpowers `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`, Engineering Council `a7565e21d5ab03551fe66e36818e05af245467b8`, Caveman `9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4`, Ponytail `09c434ab73ca43761c5d8b0c5d341926c2fba710`, ADHD `1ecea1993b7fce257ffbd686c070948b5e07eda6`, Attention Span `8a6e2250dbc1dfb1b4186e03a92484d8c799c1b0` (full file hashes in skill-loader task evidence).
- Real BA `/root` → PM `/root/impl_pm` → TL `/root/impl_pm/tl`; specialists: graph development, independent QA, skills/provenance, theme. Kickoff Council: five independent lenses, five anonymous peer reviews, three owner-led challenges/rebuttals. EDO recommendation staged graph visual changes, conditional measured geometry/routing, then conservative theme. Accepted reduced visual testing but rejected zero semantic checks and broad cosmetic test creation.
- Safety gate per task: existing semantic checks plus `npm run check` (scope guard, typecheck, build, Node, Prettier) and `git diff --check`; preserve node/edge IDs, source/target/Visit/Values/Worker epochs and camera. Do not claim visual PASS until user manual approval. If local Chromium stays unavailable, record browser CI unverified. No material engine rewrite under this authorization.

## CA-009 — Minimal visual safety baseline (QA)

- Owner: QA specialist; TL supervisor. Status: `DONE` for read-only baseline only; remote task commit verified `9512bdc786b4fe990743e52088bd85d1b384b0a5`. Resources: read-only inspection; no source or test files changed. No broad cosmetic unit/snapshot suite.
- Objective: capture existing semantic route, Visit/Values, keyboard/focus, camera and locked component-boundary expectations; identify a suitable representative nested execution fixture. Visual acceptance remains user-led.
- Dependencies: kickoff ledger remote push. Acceptance: baseline evidence and targeted existing checks recorded, no test assertions removed/relaxed. Browser geometry remains unverified until an actual browser run.
- Verification at remote ledger baseline `392a104`: targeted existing semantic suite `node --import tsx --test --test-concurrency=1 tests/semantic-flow-model.test.mjs tests/diagram-routing.test.mjs tests/diagram-elk-layout.test.mjs tests/diagram-label-placement.test.mjs` PASS, 4 files/0 FAIL (3.58s); `npm run typecheck` PASS (2.94s); `npm run check:scope` PASS (.12s). Independent QA evidence. No browser or build run for this read-only baseline; not a visual acceptance result. Task-specific ledger commit/remote confirmation verified; final DONE status-push pending.

## CA-010 — Semantic chart nodes and AST grouping (Graph UI)

- Owner: graph-development specialist; TL supervisor. Status: `VERIFIED/WAITING_ON_USER_VISUAL/AWAITING_PUSH` (not DONE). Exclusive lock: `public/diagram.css`, generated diagram CSS bundle. No JS/card constructor changes needed; existing semantic data attributes were sufficient.
- Objective: dark-theme-compatible distinct decision/loop/try/catch/return shapes, legible concise headings, subtle AST-grounded group boundaries, consistent node spacing. Do not fabricate architecture nodes or alter execution topology. Preserve the existing desktop component arrangement and zoom behavior.
- Acceptance: exact semantic node/edge identity, no false grouping, no missing control region/card, existing semantic checks and build parity; user normal-zoom visual critique pending. Separate task-specific commit/push.
- Implemented locally: semantic dark/light tokens and card treatments for decision, loop, try/catch, throw, return, call, and unresolved states; type-specific tinted AST-backed region borders/headings, selected/unselected distinction. Existing node identities, card layouts and canvas sizing untouched. Files: `public/diagram.css`, generated `public/diagram/diagram.css` only.
- Verification: focused QA 5/5 PASS, generated bundle parity/format/diff 8/8 PASS, full `npm run check` escalated after sandbox-only EPERM failures: 251 Node PASS / 0 FAIL / 2 optional SKIP, typecheck/build/scope/Prettier PASS. Independent QA source review APPROVED. No local rendered browser acceptance; user will manually judge visual shapes/colors before DONE. Remote task-specific commit pending.

## CA-011 — Measured graph geometry and guarded layout correction (Geometry)

- Owner: graph-development/geometry specialist; TL supervisor. Status: `READY_AFTER_CA-010`. Exclusive lock: `public/diagram-elk-layout.js`, relevant geometry composition in `public/diagram.js`, generated bundle when rebuilt.
- Objective: measure critical card/label bounds instead of relying only on fixed heuristics; invalidate geometry on applicable font/theme/Values changes; preserve ELK/Dagre/X6 ownership and Worker stale-response guards. Only make corrections backed by rendered geometry evidence; no unrequested auto-fit or panel changes.
- Acceptance: unchanged semantic edge tuples, deterministic ordering, containment and camera/selection preservation, targeted existing smoke, `npm run check`; unresolved browser-only geometry remains labelled `AWAITING_BROWSER_CI` rather than DONE. Separate task-specific commit/push.

Every newly discovered issue receives a separate ledger entry pushed **before** implementation. Each completed task receives its own verified commit/push and later `DONE` status update. Retain task files until user explicitly approves completion and cleanup.
