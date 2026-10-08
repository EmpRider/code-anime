# Required CodeGraph integration

Code Anime 0.3.0 does not analyze project source. All new analysis jobs and refinements use the configured CodeGraph provider. The former TypeScript/JavaScript analyzer has been removed. `provider: "source"` is rejected.

## Prerequisites and failure behavior

Verify CodeGraph installation, target-language support and initialization/indexing for the project open in the agent host. Reuse existing installation and current indexes. If absent, terminate the analysis workflow immediately and tell the user to install CodeGraph and initialize/index the open project. Request only missing setup.

Code Anime also requires a compatible outbound normalization bridge. A sibling CodeGraph MCP connection in Cursor is not automatically visible to this server. Missing `CODE_ANIME_CODEGRAPH_CONFIG` rejects `visualize_code_flow` before creating a job or reading project source. An unreachable, invalid or incompatible configured provider fails the job, with no independent analysis fallback. Capabilities indicate configuration only; they do not prove provider readiness or language support.

## Bridge configuration

Set `CODE_ANIME_CODEGRAPH_CONFIG` to a local JSON file:

```json
{
  "transport": "stdio",
  "command": "node",
  "args": ["/absolute/path/your-codegraph-bridge.js"],
  "toolName": "your_documented_trace_tool"
}
```

Alternatively use `transport: "http"`, `url` and `toolName` for a Streamable HTTP bridge. Custom HTTP authentication is not configured by this adapter.

The bridge receives `projectRoot`, `target`, `scenario`, `maxDepth` and `maxEvents` where provided. It must return the v2 trace schema in `src/domain/trace.ts` as structured content or JSON text. The server validates the schema and requested project identity, converts events into player steps and stores them. It does not infer runtime values from graph edges. Language coverage, built-in methods and analysis semantics are the provider's responsibility.

This generic bridge is tested against a fixture, not a vendor-specific Kotlin installation. Installing CodeGraph alone does not produce a compatible normalization bridge. A real vendor adapter still needs its documented tools and response schemas.

## Workspace and limits

Use the host's active workspace as `projectRoot`. An optional `CODE_ANIME_PROJECT_ROOT` restricts requests and imports to its directory. No project-specific environment root is required.

Two jobs run concurrently, with at most 100 jobs. Depth requests are 1–30 and event requests 10–2000; the provider controls expansion. Provider calls time out after 60 seconds. Session storage and trace schema remain bounded. Refinement requests CodeGraph again. Imported evidence is labeled producer-supplied; imports do not analyze source. Proposed plans are overlays, not proven impact analysis. The legacy renderer is for explicitly requested illustrations and must not bypass the CodeGraph requirement.
