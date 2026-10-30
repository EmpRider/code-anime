# CA060 Engineering Council — strict-CSP X6 stylesheet injection

- **Date:** 2026-10-30 (Asia/Colombo); **repository/branch:** `EmpRider/code-anime` / `fix/react-layout-collapse`.
- **Issue-first gate:** `.agent-tasks/CA060-fe-v3-chromium-csp-style-src-elem.md`, verified GitHub-plugin commit `6225d511696eaad9c59e5d68c44258281fbc9f42`.
- **Evidence:** CA058 source commit `faaad43eb2151667520bc7954a3d6347f50965a3`, [Actions 41083389952](https://github.com/EmpRider/code-anime/actions/runs/41083389952), `tests/browser/v3-preview-scaffold.spec.ts:132,244`, `src/web/app.ts:16`, V3 stylesheet entry and AntV X6 CSS-loader/configuration source (see the pinned CA060 neutral brief).
- **EDO:** FE/Security Tech Lead. This is an AI-proposed *engineering* decision, not human security/design approval.
- **Council:** Five genuine independent advisors (A1–A5), a subsequent anonymized five-peer round (R1–R5), a previously recorded private EDO provisional view, then separate real adversarial challenge and independent technical rebuttal. All stages were read-only; no CA060 production code was changed during Council.
- **Decision:** **CONDITIONAL GO to tightly scoped C evidence capture followed by A only if its source and module-isolation preconditions are proven.** No unconditional X6 global toggle. Preserve `style-src 'self'`, never suppress CSP events. **NO GO** to D (policy relaxation); B (broader CSS refactor) requires new findings and the applicable human design/plan approval. This record must be remotely committed and verified before CA060 source changes. CA060/CA058 remain `IN_PROGRESS`, not `DONE`.

## Observations and uncertain attribution

1. **OBSERVED:** Real Chromium native V3 X6/ELK tests passed rendering and interactions but failed their strict security assertion in four cases: 74/78 browser tests passed, and observed `style-src-elem` events were 3 baseline and 7 each nested case. Recorder currently retains only `violatedDirective`; direct `sourceFile`, `blockedURI`, insertion stack, policy, timing and style-content evidence are absent.
2. **OBSERVED:** Server supplies strict `style-src 'self'`; V3 preview already loads same-origin external `/vendor/x6.css` and `/v3-preview/preview.css`. A byte comparison found the 2,854-byte static X6 core stylesheet matches upstream core CSS exactly. Upstream X6 code creates inline `<style>` elements by default (`Config.autoInsertCSS=true`) and its Graph lifecycle can remove them.
3. **INFERRED, not verified:** Counts correlate with X6 Graph constructions; redundant X6 core injection is the leading cause. Correlation does **not** establish which DOM injector produced each event, whether an X6 plugin inserts separate CSS, whether the CSP listener starts early enough, or whether V3 and legacy share the same mutable X6 module-global `Config`.
4. **OBSERVED separate blocker:** Node official ELK/X6 geometry preflight fails strict `e:yw` label placement under CA059. CA060 must not dilute or hide that failure; full 5/5 CI is a combined future gate, not an A-only outcome.
5. **Scope/severity:** P0 for isolated FE V3 acceptance/security regression. No evidence of deployed exploitation. Config mutation can reach other consumers sharing the module instance; a wider bundler rewrite has larger build and visual regression risk.

## Competing remedies and engineering impact

| Option | Benefit | Risks / Council result |
| --- | --- | --- |
| **A: prevent X6 core auto-injected CSS; keep existing trusted static CSS** | Smallest plausible *permanent* correction if a proved core injector duplicates existing stylesheet. | Module-global `Config` may affect legacy/shared instances, two bundled copies may make toggle ineffective, plugin CSS may remain. **Only conditional after C evidence and boundary proof.** |
| **B: broaden explicit CSS bundling/adapter** | Can eliminate multiple style injectors without ambient global mutation. | More source/build/style drift and potential UI behavior redesign. **Deferred unless A boundary/cause fails; return to Council/human sign-off as needed.** |
| **C: diagnostic-only event/source attribution** | Proves recorder sensitivity, event causality and module boundaries before shipping behavior changes. | Extra CI cycle/time, test instrumentation itself can affect timing; bound and isolate. **GO first.** |
| **D: weaken CSP, ignore assertions or suppress recorder** | Apparent fast green. | Hides underlying inline style and weakens security guarantees. **Rejected.** |

## Five independent advisor positions (pre-peer)

1. **A1 — architecture:** Conditionally favored A because static X6 core CSS exists; require proof that imported `Config` and `Graph` are the same instance and V3 cannot change legacy behavior; C event tracing and visual parity required.
2. **A2 — implementation:** Conditionally favored A as the narrowest remedy, with early assignment, unchanged CSP, actual Chromium RED→GREEN, and a limited fallback if plugin CSS is separate.
3. **A3 — reliability/security:** Conditionally favored A with strict all-event recorder and positive control; plugin/static stylesheet coverage and shared-realm contamination must be explicitly tested.
4. **A4 — QA:** Conditionally favored A tied to six viewport/orientation screenshots, nested/collapse behavior, recurrence, original labels, no hidden CSP violations, and full CI.
5. **A5 — devil's advocate:** Favored C diagnostic attribution before A; 3/7 event count and identical CSS establish a strong hypothesis, **not** a traced responsible injector. Shared global config is a material unknown.

## Five anonymized blind peer reviews

Advisors' alternatives were anonymized and reordered before peer circulation. Peers did not receive EDO provisional notes or named advisor identities. All five independently preferred **P4** (a source-evidenced, controlled A+C gate), not an unconditionally safe global toggle. Their positions are guidance, not proof.

1. **R1 — P4:** Preserve an unfiltered strict-CSP recorder with a deliberately blocked inline-style negative control, check global `Config` and independent plugin injection.
2. **R2 — P4:** Compare A-off/ A-on insertion stacks/content digests with early event capture, retain identical CSS and real browser interactions.
3. **R3 — P4:** Require module identity, shared-consumer isolation, actual policy and visual parity; source-map residual events to decide plugin/static alternative.
4. **R4 — P4:** Stressed 3/7 correlation is not DOM-injector proof; a V3-owned adapter could avoid shared mutable `Config`. Reject A as complete if any CSP, plugin style, legacy, or visual difference remains.
5. **R5 — P4:** Demanded a positive control, pre-boot listener, unchanged headers, baseline/nested/recreate and shared-realm legacy checks. An isolated V3 adapter is the fallback if ambient toggling crosses consumer boundaries.

## EDO provisional, challenge, rebuttal, resolution

**Initial EDO provisional (recorded privately before advisors):** Favor minimal A with existing byte-identical static X6 CSS and unchanged CSP, contingent on direct Chromium source/visual evidence. Mind-changing findings: different event source, residual plugin insertion, or global config contamination.

**Adversarial challenge 1 — module-global mutation:** A genuine independent challenger objected that `Config.autoInsertCSS=false` is not a Graph-local setting. Shared legacy/other X6 consumers could lose CSS, or duplicate module instances could ignore the setting. Requested import graph/bundle inspection and a real legacy→V3→legacy creation/disposal negative control. **Independent technical rebuttal:** ACCEPT unresolved boundary risk; REJECT it as an already demonstrated regression. Prove same module instance and bounded consumer isolation *before* any A commit; do not assume toggling back after construction is race-safe. If isolation fails, keep C-only and revisit a V3-specific CSS adapter or B.

**Adversarial challenge 2 — inferred injector attribution / false GREEN:** Counts correlate with Graph creation, but Chromium events were not fully recorded and X6 plugins may insert CSS independently. A late listener can produce false zeroes. **Independent technical rebuttal:** ACCEPT missing causality; REJECT that this alone justifies B. Register recorder at page-init, record all fields/insertion timing, demonstrate sensitivity via blocked `<style>` positive-control experiment, and compare baseline RED to A GREEN under identical strict CSP. If residual source differs, preserve C evidence and redirect.

**EDO resolution:** ACCEPT both substantive objections and revise the provisional A-first posture to an **evidence-gated C→A sequence**. A majority/5-of-5 peer preference is not root-cause evidence. Retain A as the least-impact plausible permanent fix *only if* independent source/module checks validate it; otherwise no source fix is authorized. Reject D without exception. Broader B or UI design changes require a renewed Council plus actual human approvals when applicable.

## Authorized implementation and acceptance gates

1. **C0 controlled source attribution (test-only; implement first):** Inside `tests/browser/v3-preview-scaffold.spec.ts` or isolated V3 test helper, install `securitypolicyviolation` recording before application scripts (e.g. Playwright init script). Capture `effectiveDirective`, `violatedDirective`, `blockedURI`, `sourceFile`, `lineNumber`, `columnNumber`, `sample`, `originalPolicy`, a bounded event count and insertion timing. No private content or unbounded event streams. Explicitly prove listener sensitivity with a separate deliberately blocked inline-style control under the same unchanged policy; restore test baseline after that control. If `blockedURI=inline` is generic, supplement only test-side `<style>` creation stack/digest provenance. Establish baseline, nested, collapse, orientation and repeated Graph recreation RED evidence.
2. **A1 read-only precondition:** Before touching production, inspect installed/pinned X6 API, exact ESM/bundle module identity, `Config` import and all X6 Graph callers. Prove the early flag affects intended V3 Graphs and cannot unexpectedly style-break legacy/shared consumers. If shared module consumer risk remains, DO NOT apply ambient A; retain C0 test diagnostics and return to Council for scoped adapter or B.
3. **A2 conditional narrow fix:** Only when C0 attributes violations to duplicated X6 core auto-CSS and A1 proves isolation, allow the smallest isolated V3 opt-out before Graph creation while keeping the existing same-origin stylesheet, strict CSP, static content, and all plugin styles intact. Do not change legacy, MCP, Worker, CA059 geometry, CSP headers, or app entry ownership beyond minimum identified hook.
4. **Security RED→GREEN:** The recorder's blocked inline-style control must fail as designed; without control, zero is invalid. In real Chromium baseline, nested, collapse and recreated Graph tests, require zero **all** CSP events for app state, no page/console errors, unchanged response CSP header, and verified loaded static CSS. Compare computed style and actual DOM `<style>` insertion source; failing any one aborts A and returns to C/B analysis.
5. **Visual and semantic parity:** Real X6/ELK native rendering, original node/edge IDs and labels, collapsed/expanded, pan/cursor/keyboard interactions, six actual desktop/orientation screenshots plus collapsed 1440 screenshot pixel-review (900×600 readability separately tracked as P1, not swept under CSP). No mock render substitute or test-assertion suppression.
6. **Release gates:** Independent frozen-byte QA and contract review, task-specific GitHub-plugin commit with latest HEAD lease, remote byte verification, GitHub Actions full 5/5 success including CA059, screenshot inspection and user acceptance. If any plugin call errors, STOP immediately, report BA, never Git CLI fallback. Keep issue `IN_PROGRESS` until proven and pushed. No UI redesign or deployment authorized by this record.

## Uncertainty and next decision trigger

- **Highest-confidence hypothesis, not confirmed cause:** duplicate X6 core `<style>` injection. This record does not claim positive-control Chromium results, exact event attribution, A isolation, or successful full CI occurred.
- **Immediate next task:** Stage C0 bounded event capture test-only and inspect X6 import/caller boundaries read-only. Only after corroborating evidence may stage A under the conditions above; otherwise report a strict NO_GO and reconvene for an alternative.
- **Remaining blockers:** CA059 e:yw strict geometry, and P1 visual readability/space utilization to be issue-first tracked separately. CA058/CA059/CA060 do not become `DONE` through this Council recommendation.
