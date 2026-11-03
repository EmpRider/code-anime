# CA070 — FE V3 CI format baseline (22 existing files)

- **Status:** `PROPOSED / WAITING_ON_EDO_JSON_EXCLUSION / NOT_IMPLEMENTED / NO_CI`. This is an issue-first task record, not a formatting fix or release acceptance.
- **Priority:** P0 — the four Ubuntu/Windows Node 22/24 CI jobs run `npm run check`, which includes `npm run format:check`.
- **Branch:** `EmpRider/code-anime:fix/react-layout-collapse`.
- **Owner:** TL to assign one exclusive formatting specialist after active editors freeze; independent QA/semantic reviewer verifies changes; PM is sole canonical ledger/Git publisher; BA carries owner and Council approvals.
- **Dependencies:** CA059 browser-spec editor must finish, freeze, and publish its approved test/ledger candidate before formatting those files; do not touch CA060's currently uncommitted production candidate. TL/EDO must separately approve the exact two-path forensic JSON exclusion before any `.prettierignore` edit. CA059/CA060 must become locally GREEN before the owner's single reserved final post-code CI.

## Observed baseline — 2026-11-03 (read-only)

- Local isolated worktree `D:\code-anime\.claude\worktrees\ca059-ca060-batch` was at remote-verified `cd967ce4deeb2e4818629715df0352e573d21254` (CA059 ledger-only `[skip ci]` commit), descendant of CA060 documentation/A1 baseline `b20199244903a864a2e1881e5f9c1c021929fbbe`. CA060 source and generated files were still uncommitted and deliberately untouched. This is a **working-tree formatting observation**, not a CI result at a clean production candidate.
- Read-only `npm run format:check` exited **1**: Prettier warned on **22 paths** — 8 existing `.agent-tasks` Markdown ledgers, 9 `docs/v3` Markdown records, 2 sanitized forensic `docs/v3` JSON snapshots, and 3 tests. No `--write` or formatting edit occurred. `.github/workflows/ci.yml` runs `npm run check` in all four Node matrix jobs; `package.json` includes `format:check` in that command.

### Twenty proposed mechanical formatting targets (exact paths)

```text
.agent-tasks/CA059-fe-v3-native-label-collapse-counterexample.md
.agent-tasks/CA061-fe-v3-desktop-flow-readability-space-use.md
.agent-tasks/CA062-fe-v3-csp-recorder-test-regressions.md
.agent-tasks/CA063-fe-v3-vite-virtual-entry-unresolved.md
.agent-tasks/CA064-fe-v3-csp-matcher-typescript-indexed-access.md
.agent-tasks/CA066-fe-v3-svg-label-nbsp-test-false-negative.md
.agent-tasks/CA067-fe-v3-offscreen-viewport-visibility-tests.md
.agent-tasks/code-anime-v3-full-revamp-20261031.md
docs/v3/ca059-d2-source-remedy-council-20261030.md
docs/v3/ca059-diagnostic-council-20261030.md
docs/v3/ca059-permanent-remedy-council-20261030.md
docs/v3/ca060-csp-engineering-council-20261030.md
docs/v3/ca063-exact-root-test-council-20261031.md
docs/v3/ca063-narrow-one-build-council-20261030.md
docs/v3/ca063-vite-root-entry-council-20261030.md
docs/v3/ca064-typescript-index-council-20261031.md
docs/v3/ca066-ca067-browser-label-and-viewport-council-20261031.md
tests/browser/v3-label-association.spec.ts
tests/browser/v3-preview-scaffold.spec.ts
tests/v3-scene-geometry.test.mjs
```

### Two immutable forensic snapshots — exclusion decision pending

- `docs/v3/ca063-final-local-bundle-trace.json` — observed SHA-256 `fd9e126a779e3530bc22557c1ac1af583524fc7748f37a3258d5d821bd67095d`.
- `docs/v3/ca063-vite-root-entry-baseline-hook-trace-sanitized.json` — observed SHA-256 `f44be867728c1e1ce98720551c3b3a48a3f617a6695e1c3fe498245225848944`.
- **Proposed, not approved:** exclude only these two exact paths in `.prettierignore` so their sanitized forensic bytes remain identical. No wildcard or directory-wide exemption, and no rewrite of either JSON, until the distinct TL/EDO provenance and CI-policy decision is recorded.

## Bounded future acceptance (not executed by this ledger commit)

1. Freeze the exact updated CA059 spec and all other active editor-owned files; reconcile the 22-path list against that frozen source before mechanical changes. Keep CA059 original `e:yw` strict 6px RED visible and CA060 CSP lifecycle evidence honest.
2. Obtain TL/EDO approval for the **exact-path** JSON ignore proposal; if rejected, return to Council/owner for a provenance-preserving alternative rather than changing forensic evidence or silently weakening formatting scope.
3. Apply repository-configured Prettier **only to the 20 listed non-JSON paths**, with no code behavior, tests/assertions, evidence content, EDO decisions, or provenance changed. Independent QA/semantic review checks each diff; the two JSON SHA-256 values above must remain byte-identical.
4. Verify `npm run format:check` exit **0**, `git diff --check` clean, exact changed paths, independent QA approval, and no unrelated modifications. Preserve the full Node test/CI failures as separate CA059/CA060 blockers until their actual fixes pass.
5. The **one reserved final CI** may run only after CA059/CA060 and the whole branch are locally GREEN, reviewed production HEAD is published and remotely verified, and BA/PM applies the owner's one-run cap. No CI dispatch, source/test formatting, `.prettierignore` edit, or `DONE` claim is authorized by this issue-first publication.
