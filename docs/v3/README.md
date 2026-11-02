# Code Anime V3 — current design and decision index

> **Authority update (2026-11-02):** The owner explicitly approved V3 DESIGN, IMPLEMENTATION PLAN and START FE PHASE A on 2026-10-29, for isolated CA028–CA030. On 2026-10-31 the owner selected a full revamp with no legacy/old-session compatibility and complete selected-flow PNG capture across settings. That newer product direction does not establish a verified V3 backend, live cutover, visual sign-off or release. Earlier `PROPOSED`/`DOCS ONLY` headings in linked files describe their drafting checkpoints, not current approval status.

## Read in order

1. [Architecture](architecture.md) — responsibilities, trust boundaries, the one-document lifecycle, and source/player parity.
2. [Flow-scene JSON contract](flow-scene-json-contract.md) — versioned proposed/baseline variants, graph identities, source, frames, navigation, Values, Visits, and validation rules.
3. [Frontend graph design](frontend-graph-design.md) — adaptive horizontal/vertical geometry, nested grouping, connectors, labels, dark theme, and locked desktop UI.
4. [MCP target architecture](mcp-future-architecture.md) — planned CodeGraph evidence, host-AI mock data, server-owned assembly, resource/security limits, and migration gates.
5. [Historical Engineering Council decision](council-decision.md) — dated technical reasoning, not a new owner approval.
6. [Implementation plan and historical phase gates](implementation-plan.md) — approved FE Phase A scope, earlier deferred backend tasks, and verification requirements. Check the ledger and current owner direction before executing any dated checklist.

Progress, discovered issues, task owners, and verified commits are recorded in the [V3 GitHub task ledger](../../.agent-tasks/code-anime-v3-design-20261029.md). Earlier CA012–CA021 work remains separately tracked in the [previous repair ledger](../../.agent-tasks/code-anime-repair-20261028.md); its incomplete or uncommitted work must not be silently replaced.

## Architecture boundary

- **Future MCP/Node owns semantics:** CodeGraph is the source of language-analysis evidence; host AI supplies explicitly labeled **mock** flow/values. The server will validate and assemble **one complete, immutable, viewport-independent JSON document** containing explicit graph nodes, edges, groups, exact source snapshots, frames, source Visits, navigation targets, Values, and provenance. This design does **not** execute or observe the analyzed project.
- **Frontend owns presentation only:** use supplied semantic IDs to measure cards, adapt layouts to available width/height and orientation, paint shapes/colors, group boundaries, connectors and labels, and handle local zoom/pan/selection. No source scanning for semantic structure, invented control flow, client continuation merging, computed mock values, or viewport-triggered server JSON fetches.
- **Current desktop behavior is locked:** panel locations, sizes, controls, source display/highlighting, Follow, Visits, Values, and playback must retain their **new-flow** behavior at a future cutover. Fixture-based rendering alone cannot establish that parity.

## Approval and verification status

| Phase                                                     | Status                                                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| V3 design and implementation plan                         | **OWNER APPROVED 2026-10-29**; approval record is in the V3 task ledger.                                             |
| Isolated FE CA028–CA030                                   | **AUTHORIZED / PARTIALLY IMPLEMENTED**; not equivalent to production player cutover.                                 |
| Complete MCP V3 producer and live CA031 cutover           | **TARGET DIRECTION EXPANDED 2026-10-31 / IMPLEMENTATION UNVERIFIED**; reconcile a specific execution plan and gates. |
| Legacy session-format compatibility                       | **NOT REQUIRED** for the latest V3-only target; retain current new-flow behavior.                                    |
| Selected-flow PNG export with off-screen content/settings | **OWNER-REQUESTED**; product export acceptance/implementation not established by the older design docs.              |
| Visual/CI/native-provider/release acceptance              | **OPEN**; CA059 labels, CA060 strict CSP, CA061 readability and full backend-to-player parity remain unverified.     |

Documentation and Council records never authorize release or certify shipped behavior. The owner separately authorized a focused **local-only documentation cleanup on 2026-11-02**, without GitHub publication. Consult the current ledger, source and actual CI evidence; never treat fixture screenshots as native CodeGraph-to-MCP acceptance. Deleted recorder/React/old handoff documents remain recoverable from Git history.
