# CA062 — FE V3 C0 CSP recorder test regressions (TypeScript TS2683 and Chromium positive control)

- **Priority:** P0 for the current FE V3 CI/acceptance gate; test-harness regressions, **not** evidence of a production outage.
- **Status (2026-10-30):** `IMPLEMENTED_TEST_ONLY / DUAL_REVIEW_GO / PENDING_CI_AND_REMOTE_PUSH` — issue-first record was separately committed and verified through GitHub plugin at `9b1d9dae65048714fba5640b8859ce581adc378d` **before** code staging. Both mechanical test-only fixes are staged and frozen under independent QA/contract GO. They are **not yet remotely committed or CI-tested**; do not mark CA062 or CA060 `DONE`. Keep CA060 `IN_PROGRESS`.
- **Repository/branch:** `EmpRider/code-anime` / `fix/react-layout-collapse`.
- **Intended remote ledger path:** `.agent-tasks/CA062-fe-v3-csp-recorder-test-regressions.md` (unique CA062 ID; existing `.agent-tasks` listing independently checked through GitHub plugin on 2026-10-30; CA061 present, CA062 absent).
- **Responsibility:** BA owns authorized remote issue-first commit; TL owns technical coordination; FE V3 C0 test specialist owns candidate code repair after the issue-first gate; independent QA/security reviewer validates preserved CSP assertions.
- **Dependency/order:** CA060 C0 source-attribution diagnostic work first; CA062 repairs two newly introduced *test-only* blockers without authorizing CA060 production remedy. CA059 official ELK/X6 geometry and CA061 visual readability remain separate, unresolved dependencies for full FE V3 acceptance.
- **Introduced in diagnostic-only commit:** [`415456389279a12f031c7b991e23d6da8598ae58`](https://github.com/EmpRider/code-anime/commit/415456389279a12f031c7b991e23d6da8598ae58) (CA060 C0). **CI:** [GitHub Actions run `41093479900`](https://github.com/EmpRider/code-anime/actions/runs/41093479900); Ubuntu 22.04 Node job [`124193095142`](https://github.com/EmpRider/code-anime/actions/runs/41093479900/job/124193095142); Chromium browser job [`124193094849`](https://github.com/EmpRider/code-anime/actions/runs/41093479900/job/124193094849).
- **Source evidence:** `tests/browser/v3-preview-scaffold.spec.ts` at the exact C0 commit, independently fetched through GitHub plugin, including `document.createElement` replacement at lines 73–89 and positive-control `initialCount`/`page.evaluate` at lines 174–198. Source and CI errors are separate corroborating evidence; this record does not claim a repaired GREEN run.

## Subcase A — Node TypeScript compile gate, TS2683

**OBSERVED:** In run `41093479900`, Ubuntu 22.04 Node job `124193095142` fails `npm run check` during TypeScript compilation:

```text
tests/browser/v3-preview-scaffold.spec.ts(77,50): error TS2683: 'this' implicitly has type 'any' because it does not have a type annotation.
```

Other Node matrix checks also fail. The diagnostic code assigns `document.createElement = function (tagName: string, options?: ElementCreationOptions) { const element = originalCreateElement.call(this, tagName, options); ... } as typeof document.createElement;`. This unannotated `this` is used in strict TypeScript compilation. The final `as typeof document.createElement` assertion does not type the function body's `this` parameter.

**EXPECTED:** C0 browser diagnostics compile cleanly under the repository's existing strict TypeScript checks on all supported Node/platform jobs; production CSP and app code remain unchanged.

**Root-cause confidence:** **OBSERVED source/error match**, a narrow diagnostic test-only typing defect; no claim that adding a type alone proves all CI GREEN. **Candidate mechanical fix (conditional on type validation):** annotate the function's receiver `function (this: Document, tagName: string, options?: ElementCreationOptions)`, preserving the original dispatch and existing `as typeof document.createElement` typing, rather than changing the DOM instrumentation or weakening TypeScript checks. Check DOM overload compatibility and `this` binding through tests before accepting.

**Safe RED reproduction:** At C0 commit `4154563`, run the existing repository `npm run check` in an isolated, disposable Node environment with project dependencies installed; capture `TS2683` and exit status. Do not modify CI configuration, skip typechecks, or edit production code.

## Subcase B — Chromium blocked-inline-style positive-control runtime gate

**OBSERVED:** In the same run, Chromium browser job `124193094849` reports:

```text
page.evaluate: ReferenceError: initialCount is not defined
tests/browser/v3-preview-scaffold.spec.ts:184
```

The new test `strict production CSP blocks an inline style and the early recorder sees it` defines `const initialCount` in the Playwright test's Node context, but refers to it inside an independently serialized `page.evaluate(() => ...)` callback in `expect.poll` around lines 184–195. Browser evaluation cannot close over Node lexical variables. The outer test variable remains valid for Node-side `toBeGreaterThan(initialCount)` after the evaluation.

**EXPECTED:** Under unchanged production `Content-Security-Policy: style-src 'self'`, the deliberately injected inline `<style>` is blocked, the pre-boot listener records a new `style-src` event with `blockedURI === 'inline'`, the counter increases beyond the pre-insertion baseline, and the custom CSS property remains unapplied. This positive control must be genuinely RED if the recorder is ineffective or CSP allows inline styles.

**Root-cause confidence:** **OBSERVED source plus runtime ReferenceError**; code-local Playwright serialization boundary is the direct cause. **Candidate mechanical fix (conditional on browser validation):** pass the count explicitly into the browser context, for example `page.evaluate((initial) => /* unchanged predicate using initial */, initialCount)`. Do not turn the positive-control assertion off, inject an artificial event, weaken CSP, or accept zero CSP events without proving recorder sensitivity.

**Safe RED reproduction:** At C0 commit `4154563`, execute the existing browser spec against its local isolated test server with real Chromium. The positive-control case fails with `ReferenceError` before it can validate CSP sensitivity. CI browser evidence reported **74 passing / 5 failing** overall: the new positive control fails independently while four V3 CSP application cases remain RED (the latter are **not** resolved by CA062).

## Bounded repair plan and acceptance

1. **Issue-first gate:** BA commits/pushes only this distinct CA062 task record through the GitHub plugin and returns verified issue-first commit SHA; **only afterward** authorize edits to `tests/browser/v3-preview-scaffold.spec.ts`. Preserve other task ledger files and CA060 security Council decisions.
2. **Apply the two smallest test-only corrections** after independent review: explicit `Document` receiver type for monkeypatched `createElement`; explicit Playwright evaluation argument for `initialCount`. No changes to production source, Worker, ELK/X6, legacy player, CSP headers, scripts, suppressed events, diagnostics bounds, or test expectations.
3. **RED→GREEN TypeScript:** Baseline `TS2683` is documented; patched `npm run check` succeeds in Node 22 and Node 24 matrix across Ubuntu and Windows where configured. Check formatting and relevant lint/test scripts. Do not claim GREEN without actual logs and exit statuses.
4. **RED→GREEN real browser positive control:** The runtime `ReferenceError` disappears; blocked style control yields a new recorded `style-src[-elem]` event with inline blocked URI; count increases beyond the correctly passed initial count; computed property stays empty under unchanged strict policy. Prove a deliberately ineffective/absent recorder or relaxed policy would make the test fail, rather than a false positive.
5. **Non-regression:** Existing four app-state V3 cases continue reporting their authentic CSP violations until separately root-caused and resolved under CA060. Keep bounded sanitized event/style provenance, early event listener, source-attribution diagnostics, Chromium interactions/screenshots and all security assertions intact. Verify no behavior changes to production bundles or legacy consumers.
6. **Delivery proof:** Independently review the diff and test results; update CA062 ledger to intermediate `VERIFIED`/`AWAITING_PUSH`; create a distinct task-specific GitHub-plugin implementation commit and verify remote SHA. Mark `DONE` only through the §9.2 post-push status protocol. Full 5/5 CI acceptance remains conditional on independent CA059/CA060 and visual gates; no premature resolution claim.

## Scoped implementation checkpoint — frozen for CI, not completion

- **Remote issue-first:** BA's verified `9b1d9dae65048714fba5640b8859ce581adc378d`, `.agent-tasks/CA062-fe-v3-csp-recorder-test-regressions.md`. The original C0 diagnostic test was fetched with exact repo-tree verification at branch HEAD, source blob SHA `77f778561c2b987f45e1cc3fd7cfc3e8669b90b5`. No guessed path, Git CLI or plugin error.
- **One exclusive changed repository target:** `tests/browser/v3-preview-scaffold.spec.ts`, frozen staged SHA-256 **`a437b875bd8637c95507b4cc7eba0180f9998f89dc8464a1e1a1e426a7c2966d`**, 15,348 bytes, compared with untouched original C0 diagnostic test SHA-256 `09403e8bf2d4bcdb435822775f94e2f771378fcfb029d9edfc67e55043eed6cb`.
- **Exactly two mechanical changes:** explicit `this: Document` receiver annotation on test-only `document.createElement` interception; explicit `page.evaluate((baseline) => ...)` browser callback receiving `initialCount` as an argument. No other source/test assertion, production application, CSP, X6 Config, Worker, legacy, ledger or CI workflow content changed in the staged candidate.
- **Local verification:** Node v24.22.1 TypeScript stripping + ES module VM parse **PASS**; this is syntax only, **not** TypeScript project compile or Chromium. **Two genuinely independent reviewers**, security QA and semantic/contract reviewer, independently rehashed baseline/frozen bytes and found exactly two intended diff hunks; both **GO for test-only intermediate CI only**. No test runtime correctness/5-of-5 Green is claimed.
- **Next BA action:** atomic task-specific GitHub-plugin commit of this test file and this CA062 intermediate-status update on latest leased HEAD; independently retrieve both remote bytes and new commit SHA, then inspect actual five GitHub Actions jobs. Expect the four authentic separate CA060 application CSP cases to remain RED until source causality/isolation/remedy is reviewed. Any plugin error, including 400/404, immediately STOPS all work; never use Git CLI fallback.

## Risk, rollback, and remaining unknowns

- **Blast radius:** Expected test-only; the critical risk is silently turning a CSP sensitivity control into a false GREEN or breaking DOM interception behavior. A `Document` annotation affects compile-time typing and should not change runtime behavior, but this needs browser verification.
- **Rollback:** Revert only the scoped test-harness patch in a separately tracked commit if assertions lose sensitivity; retain issue provenance and CA060 independent CSP evidence.
- **Not authorized by CA062:** No `Config.autoInsertCSS` production toggle, broader CSS bundler refactor, relaxed policy, source suppression, or cross-module changes. CA060's Council requires C0 provenance and module isolation before any production source fix.
- **Unknown until CI:** Whether both mechanical edits restore all Node jobs and the positive-control case. The four authentic strict-CSP V3 application failures remain unresolved, as does CA059 geometry.

## Skill/source preflight provenance

- **Task snapshot:** 2026-10-30. GitHub plugin independently verified the six current upstream default-branch HEADs match the prior immutable CA060 pinned manifest, and all 22 exact local instruction/reference SHA-256 digests match `tmp/ca060-skills/manifest.md`; no stale fallback was needed.
- **Heads:** `obra/superpowers@2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`; `EmpRider/claude-skills-llm-council@a7565e21d5ab03551fe66e36818e05af245467b8`; `JuliusBrussee/caveman@9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4`; `DietrichGebert/ponytail@96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`; `ayghri/i-have-adhd@1ecea1993b7fce257ffbd686c070948b5e07eda6`; `alexgreensh/attention-span@8a6e2250dbc1dfb1b4186e03a92484d8c799c1b0`.
- **Mandatory attachment:** `upload/agent-team-skill(2).md`, SHA-256 `6c2e6a18fcb6bcc61e733fb7ec9f218e3f6e86fff8aec890e873f2d49bc6bed1`; §9.3 issue-first remote commit required. No Git CLI fallback, no GitHub plugin errors, and no remote mutations by this recorder.
