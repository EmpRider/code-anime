# CA058 — FE V3 native Chromium preview fails before graph ready

- **Priority:** P0 — approved CA029/CA030 genuine browser acceptance is blocked.
- **Status:** `READY / ISSUE-FIRST / ROOT_CAUSE_UNCONFIRMED`. No code change is authorized until BA has committed and independently verified this task file, and the failing browser evidence has been triaged.
- **Branch:** `fix/react-layout-collapse`.
- **Owner:** TL with exclusive FE preview/Worker developer, independent browser QA and semantic-contract reviewer; PM delivery; BA GitHub plugin relay.
- **First observed:** GitHub Actions run [41052613150](https://github.com/EmpRider/code-anime/actions/runs/41052613150), browser job `124052136083`, following CA030 opt-in preview commit `eb1c307a97d058b0d8ef5101149b594fde55d1f6`.
- **Evidence:** Browser job failed four V3 Playwright cases. Each awaited `#v3-preview[data-v3-state="ready"]`, but the page remained in `layout-loading` and then changed to `layout-unavailable` within the 20-second assertion window. Ubuntu/Windows Node 22/24 check jobs passed 4/4. The action uploaded `browser-test-results` and `ui-preview-screenshots` artifacts (IDs `12975243146` and `12976060853` respectively); these artifacts may contain failure diagnostics rather than accepted render screenshots.
- **Dependencies:** CA028 graph adapter; CA052 private ELK root ID, CA053 globally unique per-variant IDs, CA054 Worker ACK validation, CA055 collapse projection, CA057 cache integrity, and CA030 isolated X6 preview. CA029/CA030 visual acceptance remains open until this issue is resolved and the true Chromium worker/render gates pass.
- **Design references:** `docs/v3/implementation-plan.md`, `docs/v3/ca030-build-council-20261030.md`, `docs/v3/ca054-worker-council-20261030.md`, `docs/v3/ca055-projection-council-20261030.md`, and `docs/v3/ca057-cache-council-20261030.md`.

## Observed versus expected

- **Observed:** Native Chromium starts the isolated `/v3-preview.html`, but four new V3 browser E2E tests cannot observe a successfully rendered graph. `data-v3-state` becomes `layout-unavailable`. The actual underlying error message/stack, Worker registration/layout traffic and CSP reports are **not yet confirmed** from the artifact/log excerpts; do not attribute the fault to ELK, X6, CSP or fixtures prematurely.
- **Expected:** The validated local V3 JSON fixture reaches `data-v3-state="ready"` with real same-origin ELK Worker `register` and `layout` requests, visible X6 original-ID cells/arrows, truthful labels/edge provenance, functional variant/orientation/collapse/cursor/keyboard, no CSP violations and no semantic API fetch. Malformed input/Worker failures must still fail closed visibly.

## Investigation and bounded fix scope

1. Retrieve first failing Playwright trace, rendered status text, browser console/page errors, CSP `securitypolicyviolation` events, Worker URL and actual registration/layout request/response observations from run `41052613150` artifacts/logs. Reproduce the minimal failing fixture and distinguish a real runtime error from an overstrict or premature test assertion.
2. Trace the narrow integration boundary `public/v3-preview-entry.js` → `public/v3-scene-geometry.js` → bundled `/vendor/elk-worker.min.js` → `public/v3-scene-diagram.js`; inspect generated second Vite bundle resolution and strict CSP without weakening security. Compare current exact remote sources and avoid modifying unrelated legacy player, MCP/backend, `src/web/app.ts`, or CI workflow without a separately documented and approved necessity.
3. Add the smallest deterministic RED test that reproduces the **confirmed** failure, implement only the verified cause, and preserve fail-closed behavior. If multiple materially different repairs are viable, obtain the prescribed independent engineering Council decision before code; do not silently alter worker protocol, graph semantics, CSP, user-data handling or topology projection.
4. Do not replace real Worker/X6 with a mock, synthetic screenshot, static placeholder or hidden browser assertion. Continue using current GitHub Actions browser job and artifact upload (glob `test-results/**/ui-*.png`).

## Acceptance and evidence gates

- Original four V3 Playwright cases pass in real GitHub Actions Chromium. Verify Worker registration and layout command sequence, same-origin Worker URL, strict production CSP, actual X6 SVG cells and original semantic node/edge IDs, route labels, and absence of console/page/CSP errors.
- Verify nested Outer/Inner collapse→expand preserves original identities/edges and source-provided semantics; cursor-only frame change performs no additional Worker layout. Keyboard pan and zoom change X6 transform. All six desktop/orientation screenshots (900×600, 1440×900, 1920×1080 in horizontal and vertical) plus at least one collapsed screenshot must be captured and visually reviewed, not merely uploaded.
- Preserve previously green Ubuntu/Windows Node 22/24 CI (4/4), and attain browser job PASS for full 5/5. Run focused RED→GREEN tests, syntax, project-config Prettier, build determinism, npm package privacy and independent QA/contract review on exact staged bytes.
- Retain current legacy diagram/player bundle parity and no CA031 live cutover. Record the actual root cause, fix/test SHA, reviewed commit, run and artifact IDs. CA058 may close only after browser execution and evidence review; CA029/CA030/CA055/CA057 remain appropriately in progress until their separate gates are met.

## Task-level publication and hard stop

1. BA creates this issue-first file via the GitHub plugin and verifies remote commit/blob SHA **before** any production fix. Keep the ledger status honest; do not mark `DONE` based on local Node or static tests alone.
2. TL coordinates diagnosis, an exclusive patch author and independent browser QA/semantic review. PM routes exact staged full-file hashes to BA for scoped plugin commits and GitHub Actions verification.
3. On **any GitHub plugin error**, halt all tasks immediately and report through PM→BA to the user. No Git CLI fallback.
