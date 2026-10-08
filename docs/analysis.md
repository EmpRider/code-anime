# Source analysis and provider integration

## Server-owned analysis

Code Anime 0.2 includes a TypeScript compiler-API analyzer in its npm runtime dependencies. It parses up to 400 TS/JS files and 20 MiB of source beneath an allowed root, skipping vendor/generated directories and symlinks. File hashes reuse parsed sources while each request rebuilds symbol resolution. The scanner stops after 10,000 directory entries. It does not read external dependencies through the compiler host.

Targets can be function names, qualified class methods, candidate IDs, direct Express-style endpoint paths or simple Nest controller/method decorator paths. Unresolved targets return a candidate list rather than silently choosing a similarly named method.

Supported scenario operations include literals, parameter mocks, local variables, object property changes, simple arithmetic/comparisons, arrays, property access, direct calls, return, if/ternary/logical conditions, await boundaries, bounded for/for-of loops and throw markers. Function/class calls can cross project files through TypeScript symbol resolution. No repository function is executed: the interpreter handles only its explicit AST subset and never uses eval.

Unknown calls/values are marked unresolved. An unknown if condition uses an explicitly assumed then path. Generated primitive inputs and user-supplied scenario inputs are mock data. Object inputs should be supplied in `scenario`. try/catch, switch, while/do, closure captures, constructors/class instance state and asynchronous ordering are not fully simulated. Inline callbacks and dynamic dispatch may be unresolved. Literal results are not claims about live database state.

Event snapshots include symbol IDs, source spans/snippets, call IDs/parents, stack, values and locals. The player restores immutable snapshots when seeking. Data origins are represented through scenario inputs, assignment evidence and unresolved external-call expressions; complete taint/data-lineage analysis is not implemented.

## Allowed roots

By default, the MCP process working directory is the allowed root. Set `CODE_ANIME_PROJECT_ROOT` to your repository's absolute path when your host starts servers elsewhere. Requested project roots and imported files must resolve inside it. Path escapes are rejected.

```json
{
  "mcpServers": {
    "code-anime": {
      "command": "npx",
      "args": ["-y", "@empirerider/code-anime@0.2.0"],
      "env": {
        "CODE_ANIME_PROJECT_ROOT": "C:\\Users\\Empire Rider\\projects\\my-project",
        "CODE_ANIME_PORT": "0"
      }
    }
  }
}
```

Use this example only after 0.2.0 is published. Replace the path with your repository. Port 0 selects a free port, so follow the returned URL.

## CodeGraph integration

Different products called CodeGraph expose different tools and schemas. This project provides a configurable outbound MCP adapter for a **normalization bridge**, not a guessed vendor-specific query API. Existing sibling MCP connections in your AI host are not automatically visible to Code Anime.

Set `CODE_ANIME_CODEGRAPH_CONFIG` to a trusted local JSON configuration:

```json
{
  "transport": "stdio",
  "command": "node",
  "args": ["/absolute/path/your-codegraph-bridge.js"],
  "toolName": "your_documented_trace_tool"
}
```

Or use `transport: "http"`, `url`, and `toolName` for an accessible Streamable HTTP bridge. Authenticated HTTP providers that require custom OAuth/header setup are not configured by this adapter yet. Do not put secrets into checked-in examples.

The bridge receives `projectRoot`, `target`, `scenario` and limits, and must return the `traceSchema` shape from `src/domain/trace.ts` as structured content or a JSON text block. Configure `provider: "codegraph"` in the analysis request. Incompatible vendor graphs fail validation; they are never treated as execution traces. Normalize your actual CodeGraph API into this contract in your bridge. We have tested the adapter against a fixture bridge, not your particular CodeGraph installation.

For offline export producers, `manage_visualization` with `action: "import"` reads the same trace contract from a file. Exported source hashes are producer claims and are labeled unverified.

## Limits and jobs

Two jobs may be queued/running at once; job count is capped at 100. Cancellation is checked during file scanning and provider requests, and AST tracing has an operation/event budget. Compilation/tracing remains synchronous within the process; it is bounded but is not yet a separate worker thread. Sessions expire independently from job metadata. Refinement creates a new job/session and keeps the original.

Plans append proposed transitions to a baseline trace. They do not infer a comprehensive blast radius or change source files.
