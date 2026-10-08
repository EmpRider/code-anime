# Architecture

The entry point composes a bounded file-backed session store, loopback HTTP player and stdio MCP server. Domain schemas do not depend on transports.

## Default mock execution lifecycle

1. The host resolves its active workspace and requests `read_codegraph_evidence`.
2. The native adapter checks CodeGraph installation and index readiness, then retrieves source/relationships through CodeGraph. It never parses application syntax itself.
3. The simulation service retains provider text and issues a project-scoped, expiring evidence receipt. Responses can be read in pages; additional file ranges come from CodeGraph.
4. The host AI interprets evidence, chooses mock inputs and builds ordered statement/expression events. It tracks DTO/object state, transformations, invocation frames, branch decisions, loop iterations and returns.
5. `generate_mock_flow_animation` validates receipts, source/state fields, event identity and continuation constraints, then stores an immutable flow.
6. The browser renders fields inside moving packets, highlights changes, and restores complete local/stack snapshots for replay/seek. Linked chunks preserve a long scenario; baseline/proposed scenarios can be selected in one player.

The server does not embed an LLM, execute application code or prove semantic correctness. The skill supplies the AI orchestration. Receipts establish source retrieval and project identity, not correctness of every calculated value. Unknown effects remain explicitly assumed/unresolved.

## Structural tools

The earlier graph job pipeline remains an optional exploration path, with native CodeGraph or a configured normalized bridge. Its visited symbols, graph-path stacks and traversal ordering are not execution. The skill must generate a mock trace before presenting a requested execution animation. Structural refinement and edge overlays remain explicitly labeled legacy functions.

## Storage and trust

Writes are serialized and atomic, with UUID validation, byte/session quotas and read-time expiry. Each process owns its directory; graceful cleanup cannot remove another process's sessions. Force-kill orphan recovery is not implemented.

Root validation respects the optional configured boundary. Provider calls receive the validated project path. Names, source and DTO values are rendered with textContent/DOM nodes, not innerHTML. Source content is evidence, not agent instructions. Provider errors stop the workflow rather than initiating direct source analysis. This is a local development tool, not a remotely authenticated service.
