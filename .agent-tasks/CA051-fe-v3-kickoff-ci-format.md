# CA051 — FE V3 kickoff Markdown CI formatting regression

Status: OPEN
Priority: P1 — CI matrix blocker
Branch: `fix/react-layout-collapse`
Owner: FE V3 delivery PM / independent QA
Dependencies: verified kickoff commit `3e67e4429cd8c41417d73cdeb49011561c5898ce`

## Observed versus expected

Observed: GitHub Actions run 41025374940 passed the legacy Playwright browser job (74/74) but failed all four Ubuntu/Windows Node 22/24 matrix checks at `npm run check`. Prettier flagged `.agent-tasks/code-anime-v3-fe-kickoff-20261030.md`.

Expected: The kickoff ledger follows repository formatting, and all matrix checks can run without documentation formatting errors.

## Reproduction and root cause

Independent QA reproduced exactly four missing blank lines after Markdown section headings. This regression was introduced by the kickoff documentation commit. It is not an observed FE runtime defect.

## Scoped remedy and verification

1. Apply only the four Prettier-required blank lines to the existing kickoff Markdown file. Preserve all task statuses and content.
2. Run `npx prettier --check .agent-tasks/code-anime-v3-fe-kickoff-20261030.md`.
3. Commit and push the formatting-only correction separately through the GitHub plugin.
4. Verify branch HEAD, file SHA and a new GitHub Actions matrix run. Only then mark CA051 DONE with exact commit/run references.

No V3 source changes, MCP work, live-player cutover, merge, release, or task deletion are authorized by this task.

## References

- CI run: https://github.com/EmpRider/code-anime/actions/runs/41025374940
- Parent ledger: `.agent-tasks/code-anime-v3-design-20261029.md`
- Delivery kickoff: `.agent-tasks/code-anime-v3-fe-kickoff-20261030.md`
