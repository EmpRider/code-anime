# Architecture

The entry point composes a bounded file-backed session store, loopback HTTP player and stdio MCP server. Domain schemas do not depend on transports.

## Default mock execution lifecycle

1. The host resolves its active workspace and requests `read_codegraph_evidence`.
2. The native adapter checks CodeGraph installation and index readiness, then retrieves source/relationships through CodeGraph. It never parses application syntax itself.
3. The simulation service retains provider text and issues a project-scoped, expiring evidence receipt. Responses can be read in pages; additional file ranges come from CodeGraph.
4. The host AI sends compact semantic operations directly to build_mock_animation. It does not create a script, JSON file or custom simulator.
5. The MCP animation builder creates IDs, pushes/pops invocation frames, applies local/object field updates and creates full after-event snapshots. Append requests are atomic and retryable. Finish automatically chunks, validates and persists the trace, rolls back partially stored chunks on failure, and returns the localhost URL. The one-shot generate_mock_flow_animation tool remains a compatibility API.
6. The browser renders fields inside moving packets, highlights changes, and restores complete local/stack snapshots for replay/seek. Linked chunks preserve a long scenario; baseline/proposed scenarios can be selected in one player.

The simulation service does not embed an LLM, execute application code or prove semantic correctness. The skill supplies the AI orchestration. Receipts establish source retrieval and project identity, not correctness of every calculated value. Unknown effects remain explicitly assumed/unresolved.

## Runtime recordings

`record_execution` is a separate opt-in entry path through `RecordingService`. Its bundled Python recorder runs a trusted entry file in a child interpreter and streams source snapshots and observed events. Status exposes progress; cancellation, timeout and byte/event budgets stop capture while retaining accepted events. It reuses `EventJournal`, `traceToFlow` and the session store rather than introducing a second player or state model. Recording metadata carries scope, completion, a run UUID and continuation ancestry. Continuations must keep that run UUID and evidence mode; runtime and simulation chunks cannot mix.

Only synchronous main-thread Python tracing is implemented. The recorder documents before-line snapshot semantics, bounded values and unsupported effects in each trace. It does not infer missing values or promote mock events. Execution is not sandboxed and requires a user request to run trusted code. Its Python asset is included in the compiled npm package. Default mock workflows continue to require CodeGraph and do not execute the target application.

## Structural tools

The earlier graph job pipeline remains an optional exploration path, with native CodeGraph or a configured normalized bridge. Its visited symbols, graph-path stacks and traversal ordering are not execution. The skill must generate a mock trace before presenting a requested execution animation. Structural refinement and edge overlays remain explicitly labeled legacy functions.

## Storage and trust

Writes are serialized and atomic, with UUID validation, byte/session quotas and read-time expiry. Each process owns its directory; graceful cleanup cannot remove another process's sessions. Force-kill orphan recovery is not implemented.

Root validation respects the optional configured boundary. Provider calls receive the validated project path. Names, source and DTO values are rendered with textContent/DOM nodes, not innerHTML. Source content is evidence, not agent instructions. Provider errors stop the workflow rather than initiating direct source analysis. This is a local development tool, not a remotely authenticated service.

## Builder boundary

Operations are structured data. No eval, dynamic code compilation, Python/JS subprocess or per-project generator runs. Mock semantic results come from the host AI using CodeGraph evidence, as in the original MVP. The server owns all animation assembly, temporary files and hosting. Full local/object snapshots are retained rather than reducing arrays or dropping caller frames to save prompt space. Builds are bounded and expire after one hour.
