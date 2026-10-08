# Roadmap

This roadmap describes planned capabilities, not features already available.

## Milestone 1 — Contributor foundation (this project)

- Modular TypeScript MCP/HTTP server and bounded temporary sessions.
- Legacy tool compatibility and interactive mock-flow player.
- Documentation, demo, regression tests and cross-platform CI.

## Milestone 2 — Evidence-backed trace contract

- Stable symbol IDs and source spans.
- Call/return, branch, loop, mutation and unresolved events.
- Static facts, mock values and assumptions explicitly distinguished.
- Replay state reducer and checkpoints for correct reverse/seek behavior.

## Milestone 3 — Server-owned analysis

- Verify the actual CodeGraph implementation and supported interface.
- Configure a direct provider adapter; do not assume sibling MCP tools are visible to this server.
- TypeScript/JavaScript source fallback and incremental hash cache.
- Bounded recursion, lazy expansion, deterministic mock generators and job cancellation.
- Measure tool calls, token use, latency and storage against the initial renderer.

## Milestone 4 — Portable skill and visual planning

- Small Agent Skills-format package with tool contract references.
- Tested setup for Codex, Claude Code and OpenCode.
- Current-flow and proposed-change comparison with explicit planned nodes.
- Scenario selection and domain annotations only when needed.

## Before a public release

Select a license, verify host compatibility, add browser automation, review dependency updates, design stale-session recovery and document support boundaries. Additional programming languages come through separate analyzer adapters after the first language is verified.
