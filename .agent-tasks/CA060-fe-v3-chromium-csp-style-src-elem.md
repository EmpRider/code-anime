# CA060 — FE V3 Chromium native X6 preview violates strict style-src-elem CSP

- **Priority:** P0 — genuine FE V3 browser acceptance and security-contract CI gate blocked.
- **Status:** `BLOCKED / ISSUE-FIRST / ROOT_CAUSE_UNCONFIRMED`. No source/test/CSP mutation is authorized until this distinct task is committed and independently verified through the GitHub plugin, evidence is triaged, and the engineering Council issues a reviewed remedy. Preserve the existing fail-closed security assertion.
- **Branch:** `fix/react-layout-collapse`.
- **Owner:** TL with exclusive FE preview/CSP investigation specialist, independent browser QA and security/semantic reviewer; PM delivery; BA GitHub-plugin relay.
- **First observed:** GitHub Actions [run 41083389952](https://github.com/EmpRider/code-anime/actions/runs/41083389952) for CA058 intermediate code/test commit [`faaad43`](https://github.com/EmpRider/code-anime/commit/faaad43eb2151667520bc7954a3d6347f50965a3).
- **Dependencies:** CA028/CA029 graph and ELK Worker work, CA030 isolated V3 X6 preview, CA054 Worker handshake, CA055 collapse, CA057 cache, CA058 label reservation, CA059 separate official ELK/X6 Node collision issue. Keep these in `IN_PROGRESS`, never call the FE V3 acceptance complete while CI is red.
- **References:** `.agent-tasks/CA058-fe-v3-native-chromium-layout-unavailable.md`, `docs/v3/ca030-build-council-20261030.md`, `docs/v3/ca058-label-council-20261030.md`, `.github/workflows/ci.yml`, `tests/browser/v3-preview-scaffold.spec.ts`.

## Observed versus expected

- **Observed (verified):** The CA058 post-commit Chromium job in run `41083389952` completed with **74 browser tests passing and 4 new V3 tests failing**. Unlike the prior `layout-unavailable` failure, all four V3 cases reach `#v3-preview[data-v3-state="ready"]`, render genuine X6/Worker scenes and progress through their screenshot, nested collapse/expand, pan/zoom and other interaction assertions. They fail at the final **strict CSP security assertion** because `window.__v3CspViolations` is not empty. GitHub job logs report repeated `style-src-elem` violation entries: **3** for the baseline case, **7** for each nested 900×600, 1440×900 and 1920×1080 case. The relevant assertions are `tests/browser/v3-preview-scaffold.spec.ts:132` and `:244`.
- **Artifacts (uploaded, not yet pixel-reviewed):** `browser-test-results` ID `12990153220` (13.91 MB, archive SHA-256 `1f9a35839f2c6b37fd187ba286fcc52fcd2aaf35a06aab58e531417850066a9a`) and `ui-preview-screenshots` ID `12989908371` (1.52 MB, archive SHA-256 `cc2c997954de45916e93c1655271362baa6eb56e7e817ab3cd4c87b1efd94c90`). Upload success is **not** visual acceptance; actual PNG label visibility, glyph bounds, clipping and overlaps remain to be assessed.
- **Expected:** Isolated real V3 X6/ELK Worker preview runs within its strict production CSP, with zero `securitypolicyviolation` events and zero console/page errors, original source-provided IDs and honest labels, no unintended network/API requests, and all visual interaction tests passing. Do not weaken CSP, inject arbitrary/eval-driven styles, bypass assertions or substitute static placeholders to turn the run green.

## Current root-cause confidence

1. **Verified:** The browser's `securitypolicyviolation` recorder receives `style-src-elem` entries only after the real preview starts; the new test fails on an actual nonempty array. Worker/X6 readiness succeeds, so the original generic Worker layout-unavailable hypothesis no longer explains these four browser failures.
2. **Unknown:** The specific violated policy directive, blocked URI/value, browser source URL/line, responsible stylesheet/style insertion mechanism (framework, X6 or project code), whether duplicate reports reflect distinct injections, and the least-privilege correction. Do **not** attribute the cause to X6 or an inline stylesheet without tracing the emitted event and DOM/console evidence.
3. **Separate blocker:** CA059 tracks Node official-ELK/strict renderer `e:yw` label collision. It is not evidence that CSP is safe or unsafe, and must not be bundled into this task's code commit.

## Investigation and decision gate

1. Read the exact preview CSP meta/header policy and all sources that create DOM styles for `/v3-preview.html` and its actual bundled entry path. Capture each `securitypolicyviolation` event's `violatedDirective`, `effectiveDirective`, `blockedURI`, `sourceFile`, `lineNumber`, `columnNumber`, `sample`, `disposition` and `originalPolicy` where available, plus precise DOM style nodes and stack/source association. Sanitize logs and avoid unrelated user data. Reproduce one minimal valid V3 browser case and distinguish an actual policy breach from a recorder/assertion bug.
2. Identify whether the violation originates in the approved isolated X6/Worker preview, generated bundle asset handling, inline runtime style insertion, third-party library behavior or test fixture. Verify cause-and-effect using a deterministic RED assertion that fails on the actual policy breach; do not relax the browser assertion as the remedy.
3. Convene a **fresh real engineering Council** (five independent advisors, five anonymous peer reviews, EDO provisional choice and targeted technical challenge/rebuttal) for the security-sensitive correction. Compare a narrowly scoped, least-privilege static stylesheet or trusted bundle-compatible fix with any necessary CSP policy variation, assessing security implications, browser compatibility, app behavior and rollback. A CSP relaxation or broad architectural change needs BA-mediated human security/design/plan approval as applicable. Do not silently adopt a nonce/unsafe-inline/eval allowance or an unrelated library replacement.
4. BA commits/pushes and independently verifies this CA060 task file via GitHub plugin **before any CA060 code/test instrumentation or fix**. TL assigns exclusive implementation and independent QA/security review after authorization; preserve CA059/CA058 separate task commits and previously passing cases. Any GitHub plugin error, including 404, immediately stops all work and is reported to the user; never use Git CLI fallback.

## Acceptance and verification

- Exact CSP violation mechanism reproduced under genuine Chromium and isolated to a known source with observed event fields. A focused pre-fix RED test and post-fix GREEN test establish the same strict policy with no misleading false negative.
- Four V3 Playwright cases return **zero real CSP violations** with genuine X6/ELK Worker `register`→`layout`, actual SVG cells/edges, original IDs/labels, nested collapse, cursor-only no new layout, keyboard pan/zoom and no unintended semantic/API requests. No weakening of production CSP security posture or removal of assertions.
- No browser console/page errors, no new external style/script network dependencies, no cross-origin Worker, no innerHTML/eval injection, and package privacy/build determinism preserved. Keep legacy player and MCP/backend untouched.
- All GitHub Actions checks **5/5 PASS** including Ubuntu/Windows Node 22/24 and Chromium; preserve the previously green 74 browser cases and re-run CA059 label collision regression independently. Six desktop/orientation PNGs plus collapsed view must be captured and actually visually inspected for label placement/readability. Artifacts alone are insufficient.
- Record exact root cause, measured security impact, reviewed changes/test hashes, task-specific implementation and status commits, Actions run/job/artifact IDs, independent QA/security verdict and remaining risk. `DONE` is prohibited until every named gate passes and remote GitHub verification confirms it.

## Evidence and next state

- Remote CA058 intermediate commit: `faaad43eb2151667520bc7954a3d6347f50965a3`, independently byte-verified before run `41083389952`.
- CA060 remains **BLOCKED / PENDING_ROOT_CAUSE_AND_COUNCIL**. Do not delete temporary task files without the user's explicit implementation-completion approval.
