# CA030 Engineering Council — isolated V3 preview bundling

Date: 2026-10-30 (Asia/Colombo). Scope: `EmpRider/code-anime` branch `fix/react-layout-collapse`, approved CA030 opt-in V3 preview; **no live cutover**. EDO: FE V3 Tech Lead (`/root/pm_fe_v3_retry/tl_fe_v3_retry`). Human product owner: Anuruddha. This is a **proposed technical selection**, not proof of implementation or visual approval.

## Evidence and decision

- OBSERVED: `scripts/build.mjs` currently runs one Vite library build: `publicDir:false`, `outDir:public/diagram`, `emptyOutDir:true`, `lib.entry:{diagram:public/diagram.js}`, `cssFileName:'diagram'`. It also copies vendor ELK Worker and X6 CSS into `public/vendor`. The existing player loads `public/diagram/*`.
- OBSERVED: `src/web/app.ts` already serves `public` through Express static with self CSP. `package.json` has `prepack` bound to the build and `files:['public']`. An opt-in `public/v3-preview.html` is therefore feasible without modifying player entry, server routing, or MCP.
- INFERRED, not measured: adding a V3 entry to that same Vite build may modify legacy CSS extraction/chunks, while separate builds may duplicate X6 bytes and increase build time.
- Option A: extend existing Vite `lib.entry` to multi-entry `{diagram,v3Preview}` with one `public/diagram` output. Lowest line count and potential dependency sharing; risk shared CSS, filenames, chunks, and legacy regression.
- Option B: keep the first diagram build unchanged and add a **second** sequential Vite build whose output (`public/v3-preview/` or narrower generated-only subfolder) is owned exclusively by generated V3 JS/CSS. Authored HTML, entry source and fixtures stay outside the cleaned output. More build steps and possible duplicate bundle bytes, but bounded legacy asset ownership and easier differential verification.

## Provisional EDO position before advisors

Preferred B; ranked criteria: (1) zero legacy/player regression, (2) CSS and output ownership isolation, (3) repeatable CI/browser verification, (4) small configuration change, (5) maintainability and package cost. Change my view if a controlled A build proves byte-for-byte legacy asset stability and no CSS or shared-chunk bleed with meaningful efficiency benefit.

## Five independent advisors

Five genuine advisor conversations (same agent model family; no claim of model diversity) independently recommended **B conditionally**:

1. Systems Architect: current single output directory and `cssFileName` couple A to legacy assets; B retains first Vite invocation byte-stable in source. Warned HTML inside B's `emptyOutDir` would be erased; demand two clean builds and SHA/CSP checks.
2. Quality & Verification: B supports independent artifacts and Playwright tests. Require `npm run build` to actually invoke both builds, fail on missing preview artifacts, and record `DOM_PASS`, `ARTIFACT_EXISTS`, `HUMAN_VISUAL_APPROVED` separately.
3. Reliability & Security: B isolates generated files, but optional build steps can drift; require mandatory CI, CSP/same-origin Worker, clean fail-closed second-build error, rollback and package manifest.
4. Implementation Lead/UI: B is a localized second Vite invocation with scoped preview CSS. A may save bundle size/CI time, not measured; parity and browser tests required.
5. Devil's Advocate: a second `outDir` **alone is not safety**. It can delete authored files, leave partially written local outputs on failure and duplicate X6; B must prove isolation through real tests. A remains credible if demonstrated safe.

## Five anonymous peer reviews

Five genuine independent peer reviewers received proposals in a shuffled, role-anonymous A–E order. All considered **anonymous Proposal A** the strongest risk analysis (it was the skeptical proposal), **not** because of a majority preference for B. All conditionally favored B only after verification. Shared hard challenge: a textually unchanged first Vite call does not yet establish **measured legacy SHA parity**. Repeated omitted risk: `npm pack` may exclude or unexpectedly include V3 assets, stale previews, or non-synthetic fixture content; baseline package size and fixture privacy need checking. Reviewer positions were collected before EDO synthesis.

## EDO-led challenge and actual rebuttals

1. **Challenge to Devil's Advocate:** If B cannot guarantee isolation, is it merely a symptom mask? Advisor **conceded** second outDir alone is insufficient, but defended B with generated-only output, mandatory second build, clean CI, legacy SHA comparison, forced failure and current-run screenshot manifest. EDO **accepts** the safeguards and **rejects** any unqualified “zero risk” claim; A remains a live fallback after evidence.
2. **Challenge to Implementation/UI advisor:** Why isn't A's smaller diff and possible shared X6 preferable? Advisor **conceded** A's possible size/build advantage, and that CSS chunk collision is inference, not observed. Advisor defended B as lower shared-output ownership risk, with duplicate bytes/time measured later. EDO **accepts** preference B for staged CA030 and **accepts** A as a revisit trigger if byte-stability/CSS isolation empirically favor A. No experimental comparison was run as part of this Council.
3. **Challenge to reliability/QA evidence:** How prevent false success from stale/partial assets or packaged fixtures? EDO **accepts** peer conditions: clean build twice, forced second-build failure must exit nonzero and block deploy/publish, verify manifest and HTTP 200/CSP/Worker, package only synthetic fixtures, and tie screenshot artifact to exact run/commit. `ARTIFACT_EXISTS` requires the *latest* uploaded artifact with expected screenshot matrix; only human owner can set `HUMAN_VISUAL_APPROVED`.

## EDO recommendation — conditional B

Implement Option **B** within already approved CA030 isolation scope, **after CA029 geometry/Worker gates**. Prefer a second sequential Vite build into a generated-only V3 directory, leaving legacy `public/diagram` build configuration, `public/player-entry.js`, `public/player.js`, `src/web/app.ts` and MCP unchanged. Keep authored `public/v3-preview.html`, entry source, and synthetic fixtures outside any `emptyOutDir` target. No dependency addition unless separately reviewed. This is a technical decision under already approved isolated-preview authorization; no CA031 cutover permission.

**Mandatory validation before completion:**

1. Compare SHA-256 of all legacy `public/diagram/*` and vendor outputs with matching baseline, build twice from clean inputs; explain any drift.
2. Ensure second build invocation is mandatory and fail-closed in `npm run build`, verify generated-only cleanup, force a controlled failure in a disposable copy and assert nonzero/no false acceptance.
3. Verify npm pack manifest/size, no secrets or real user project/source fixtures, expected HTML and JS/CSS included.
4. Chromium HTTP 200 + strict CSP + ELK Worker registration/layout and X6 readiness, no pageerror; legacy 74 browser checks and V3 DOM cases.
5. Desktop Playwright screenshots at 900x600, 1440x900, 1920x1080 in both orientations; nested/long labels, loops/returns, collapse identity preservation, keyboard/pan/zoom; artifact belongs to exact commit/run.
6. Do not mark CA029/CA030 DONE merely from static fixture screenshots. Full CodeGraph→MCP integration and actual user visual acceptance remain separate gates.

**Risks/deferred:** second build cost and bundle size unmeasured; A might eventually be superior if empirical parity proves it. Revisit on unexpected legacy asset hash changes, failing CSP/Worker, missing tarball assets, excessive bundle size, or build unreliability. No code, GitHub, CI, or player changes were made by this Council.
