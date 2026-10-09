# CodeGraph evidence and AI simulation

Code Anime 0.4.1 uses CodeGraph for source discovery/retrieval and the host AI for mock execution. No built-in language parser or application executor exists.

## Native connection

Code Anime launches the installed `codegraph serve --mcp --path <active-project>` executable with read-only tools enabled: status, node, callees, search, explore and files. It disables an extra watcher. It checks for a nonempty, usable index before accepting evidence. Already indexed projects continue automatically; missing setup stops with the actual blocker. The server does not install/index automatically.

The installed CLI may use its own daemon/proxy lifecycle. Code Anime does not discover Cursor configurations or reuse a sibling MCP connection. `CODE_ANIME_CODEGRAPH_COMMAND` optionally selects a launcher outside PATH. Tests use CodeGraph 1.6.2 and Kotlin on Linux; direct Windows verification remains outstanding.

## Evidence and simulation

`read_codegraph_evidence` preserves provider text rather than truncating it to an 800-character snippet. Cached output is paginated by character offset. `node` supports provider file line ranges; use these when explore or a symbol response is truncated. The provider response cap is 256,000 characters; narrow the upstream request if exceeded. Each receipt records project, query tool and provider-response hash, expires after one hour, and can ground submitted events.

The host reads retrieved source and simulates the selected scenario, including library operations like trim/min from evidenced call sites, assignments, helpers, objects, branches and loops. Language-standard operations do not require indexed library internals. Unsupported semantics remain unresolved. This produces simulated execution order and values, not live runtime data.

The host sends compact operations to the MCP builder. The server creates each event with a unique event ID, invocation ID, stack/local/object snapshots, source reference and receipt IDs. Transforms/assignments/mutations include before/after. Optional inputs, result, objectId and origins show data propagation. Every call iteration is independent even when it reuses a symbol definition.

The builder automatically splits completed traces into bounded storage chunks linked through continuationOf, keeping scenario inputs and unique IDs. Agents must not create scripts or JSON files to construct these chunks. Values are not recomputed by the player or server; changed inputs require the host AI to regenerate the scenario. Proposed full scenarios reference a baseline session for comparison.

## Optional structural jobs and bridge

`visualize_code_flow` walks indexed relationships. Its defaults remain depth 12/events 1000, maximum depth 30/events 2000 and a 100-request traversal budget. Those limits apply only to graph jobs; they do not set simulation depth. The graph output is labeled structural evidence.

An optional `CODE_ANIME_CODEGRAPH_CONFIG` may configure a normalized stdio/HTTP bridge for structural job tools. The v2 trace contract remains supported. The default evidence/AI workflow uses the native CLI and needs no bridge file. Importing an export preserves producer-supplied claims and is not live verification.

## Scope

Use the current host workspace root, respecting any `CODE_ANIME_PROJECT_ROOT` restriction. Full codebase coverage means tracing any requested entry point across relevant indexed source; it does not mean every possible path or every file in one animation. Completeness and unresolved boundaries must be visible. Provider-response hashes identify retrieved evidence, not independently read project files.
