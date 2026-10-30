# Code Anime FE V3 — Delivery kickoff (2026-10-30)

Repository: EmpRider/code-anime
Target branch: fix/react-layout-collapse
Scope: FE V3 implementation only. No MCP backend CA033–CA037, CA031 live cutover, or real code execution.
Source of truth: .agent-tasks/code-anime-v3-design-20261029.md and approved FE V3 design.

## Confirmed baseline
- CA028: DONE (as previously recorded).
- CA029: IN_PROGRESS. Must not be marked complete until geometry, semantic fidelity, routing, and safety checks pass.
- CA030: WAITING_ON_CA029. Isolated visual preview / renderer only, not the live player.
- CI browser workflow succeeds on legacy player at run 41010339844. Its screenshots do not prove V3 usability.

## Council and implementation gates
1. CA029-G0: verify worker ACK, malformed reply/error/timeout/cancellation handling; stale async result isolation; deterministic node/edge IDs and provenance; expand/collapse geometry; return arrows and routing; unit tests. Capture exact failing tests and repair only within FE scope.
2. CA029-G1: check graph meaning is preserved in nested branches, loops, method calls, returns and shared nodes. Verify layout stability, correct edge endpoints, clipping, grouping, orientations, and readable density. Require repeatable fixtures and tests before completion.
3. CA030-G0: implement an isolated FE V3 diagnostic preview after CA029 safety gate. Leave the legacy entrypoint and server untouched. Any added build/preview/test files need approval against existing design boundaries before changing build behavior.
4. CA030-G1: GitHub Actions Playwright desktop screenshots at 900x600, 1440x900, 1920x1080; horizontal/vertical flow, deeply nested, loops, returns, long/multilingual labels, collapse/expand, keyboard. Inspect screenshot artifacts. Distinguish DOM_PASS, ARTIFACT_EXISTS, and HUMAN_VISUAL_APPROVED.
5. CA030-G2: Council + QA evaluate evidence; obtain user approval for visual/UX acceptance. Do not claim FE V3 complete without all gates.

## Task tracking and commit rules
- Maintain this file and parent ledger after each completed work unit.
- One task → tests/verification → detailed commit → push → update status, branch SHA, CI run/artifact IDs.
- Preserve PC-only compact UI and presentational-only FE responsibilities. MCP delivers semantic JSON; FE lays out nodes/edges.
- Block on GitHub plugin write failures; no Git CLI fallback without user authorization.

## Review provenance
A multi-role code review (2 UI, 2 UX, graph/flow, QA) and council (5 advisors, 5 anonymous peers, objections/rebuttals) recommended staged safety, isolated V3 preview and visual CI gating. This kickoff is a planning record, not a claim that implementation or visual review is finished.
