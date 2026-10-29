# Code Anime V3 — proposed design documents

> **Documentation only.** The V3 design and implementation plan are **PROPOSED**, not user-approved for coding. Frontend implementation requires separate design, plan, and FE-work authorization; MCP/backend implementation is **FUTURE / DEFERRED** and requires its own authorization.

## Read in order

1. [Architecture](architecture.md) — responsibilities, trust boundaries, the one-document lifecycle, and source/player parity.
2. [Flow-scene JSON contract](flow-scene-json-contract.md) — versioned proposed/baseline variants, graph identities, source, frames, navigation, Values, Visits, and validation rules.
3. [Frontend graph design](frontend-graph-design.md) — adaptive horizontal/vertical geometry, nested grouping, connectors, labels, dark theme, and locked desktop UI.
4. [Future MCP architecture](mcp-future-architecture.md) — CodeGraph evidence, host-AI mock data, server-owned assembly, resource/security limits, and deferred migration.
5. [Engineering Council decision](council-decision.md) — options, independent challenges, tradeoffs, and outstanding approval gates.
6. [Implementation plan](implementation-plan.md) — proposed FE fixture-first tasks, future MCP tasks, dependencies, verification, and stop conditions.

Progress, discovered issues, task owners, and verified commits are recorded in the [V3 GitHub task ledger](../../.agent-tasks/code-anime-v3-design-20261029.md). Earlier CA012–CA021 work remains separately tracked in the [previous repair ledger](../../.agent-tasks/code-anime-repair-20261028.md); its incomplete or uncommitted work must not be silently replaced.

## Architecture boundary

- **Future MCP/Node owns semantics:** CodeGraph is the source of language-analysis evidence; host AI supplies explicitly labeled **mock** flow/values. The server will validate and assemble **one complete, immutable, viewport-independent JSON document** containing explicit graph nodes, edges, groups, exact source snapshots, frames, source Visits, navigation targets, Values, and provenance. This design does **not** execute or observe the analyzed project.
- **Frontend owns presentation only:** use supplied semantic IDs to measure cards, adapt layouts to available width/height and orientation, paint shapes/colors, group boundaries, connectors and labels, and handle local zoom/pan/selection. No source scanning for semantic structure, invented control flow, client continuation merging, computed mock values, or viewport-triggered server JSON fetches.
- **Current desktop behavior is locked:** panel locations, sizes, controls, source display/highlighting, Follow, Visits, Values, and playback must retain their **new-flow** behavior at a future cutover. Fixture-based rendering alone cannot establish that parity.

## Approval and verification status

| Phase                                                                            | Status                                                                                                                |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| V3 design and implementation-plan documents                                      | **PROPOSED** — separate owner DESIGN and PLAN approvals pending.                                                      |
| FE fixture-only adaptive graph work                                              | **PLANNED / NOT AUTHORIZED** — can start only after explicit FE code approval; does not prove a live MCP integration. |
| MCP compiler, complete JSON artifact, and native multi-language integration      | **FUTURE / DEFERRED / NOT AUTHORIZED** — required before live frontend/player cutover.                                |
| Browser appearance, new-flow source/playback parity, and real CodeGraph evidence | **UNVERIFIED for V3** until actual independent tests and owner visual review.                                         |

The documentation and task ledger do **not** authorize source changes, merging, publishing, tagging, deployment, or deletion/cleanup. Consult the ledger for the current issue status rather than treating a proposed example or synthetic fixture as shipped behavior.
