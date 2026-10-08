# CodeGraph integration

Code Anime 0.3.1 uses the installed `codegraph` CLI automatically. It never parses or simulates project source itself. `provider: "source"` is rejected.

## Native mode: no bridge config

For an active workspace request, Code Anime launches:

```sh
codegraph serve --mcp --path <active-project>
```

It requests the documented `codegraph_status`, `codegraph_node` and `codegraph_callees` tools, setting the child process's tool allowlist. It disables an additional file watcher and reuses CodeGraph's existing index. The installed CLI can use its own daemon/proxy lifecycle. No Cursor configuration discovery or sibling-session reuse is attempted; the executable is resolved from PATH. An optional `CODE_ANIME_CODEGRAPH_COMMAND` selects a different executable, including a Windows launcher.

Before creating a job, the server checks that the required tools and a nonempty project index are available. Missing installation or index stops the workflow with setup guidance. Already installed/indexed projects continue automatically. It never runs `init`, installs packages or indexes a project on the user's behalf.

Native conversion parses CodeGraph's documented text response format, not the application's source syntax. It walks indexed symbols and relationships, preserving provider source locations and snippets. Target ambiguity returns `needs_selection`; retry using a returned `name@file:line` candidate ID. Kotlin was verified with CodeGraph 1.6.2 on Linux. Windows launcher support uses the SDK's cross-spawn transport; it has not been exercised on a Windows machine.

## Evidence and depth

This is a structural graph walkthrough. Animation order is traversal order, stacks are graph paths, and relationships may represent calls, member containment, callbacks or references. No runtime execution, arguments, mutation values or return values are invented. Scenario inputs are retained for context but are not evaluated by native CodeGraph. Standard library calls are displayed only when CodeGraph returns their indexed evidence; otherwise they may be visible only in provider source snippets.

The default depth is 12, configurable to 30. Events default to 1000, capped at 2000. Native traversal makes at most 100 evidence requests per job and has a 60-second connection budget. Provider output or depth limits mark truncation; this is not a complete whole-codebase trace. `sourceHash` fingerprints received evidence, not locally read source. Target/location formats or provider versions that cannot be interpreted safely fail or mark the affected relationship unresolved.

## Optional normalized bridge

Existing normalized providers may still set `CODE_ANIME_CODEGRAPH_CONFIG` to a local configuration file:

```json
{
  "transport": "stdio",
  "command": "node",
  "args": ["/absolute/path/your-codegraph-bridge.js"],
  "toolName": "your_documented_trace_tool"
}
```

Alternatively use `transport: "http"`, `url` and `toolName` for a Streamable HTTP bridge. This optional mode expects the v2 trace schema in `src/domain/trace.ts`. Language support and simulation semantics belong to that producer. Custom HTTP authentication is not configured here.

## Workspace and storage

Use the host's active workspace as `projectRoot`. An optional `CODE_ANIME_PROJECT_ROOT` restricts requests and imports to its directory. Two jobs run concurrently, at most 100 jobs are retained, and refinement requests CodeGraph again. Provider failures have no independent source-analysis fallback. Imports are producer-supplied evidence, proposed plans are overlays, and the legacy mock renderer cannot substitute for CodeGraph analysis.

Adapter references: [CodeGraph MCP tools](https://github.com/colbymchenry/codegraph/blob/main/src/mcp/tools.ts) and [MCP documentation](https://github.com/colbymchenry/codegraph/blob/main/site/src/content/docs/reference/mcp-server.md).
