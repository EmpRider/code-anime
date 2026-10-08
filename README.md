# Code Anime

**Watch code execute with mock values, one step at a time.**

CodeGraph retrieves the active project's source and relationships. Your AI agent uses that evidence to simulate a scenario, including basic transforms, assignments, branches, loops, calls and returns. Code Anime validates the trace and animates objects with their fields, before/after changes and source locations in a localhost player.

Version **0.4.0** restores the original mock-execution workflow. CodeGraph is required for every language; missing installation or index stops the process. Repository code, databases and HTTP effects are not executed. Values are labeled as simulated, assumed, unresolved or proposed.

## Connect the MCP

Requirements: Node.js 22+, CodeGraph installed and initialized/indexed for the active project, and an AI host that supports MCP and skills.

After version 0.4.0 is published to npm, a typical host configuration is:

```json
{
  "mcpServers": {
    "code-anime": {
      "command": "npx",
      "args": ["-y", "@empirerider/code-anime@0.4.0"],
      "env": { "CODE_ANIME_PORT": "0" }
    }
  }
}
```

A repository push does not publish npm. To use the source build immediately, run `npm ci` and `npm run build`, then configure `node /absolute/path/code-anime/dist/index.js` instead. Host configuration wrappers differ; use the format supported by your host.

Copy `skills/code-anime/` into your host's supported skill directory. Installing the npm package alone does not install the skill. Ask `/code-anime show ACH generation`, or ask to visualize any function or endpoint. The agent resolves the open workspace and supplies its path automatically.

Code Anime launches `codegraph serve --mcp --path <active-project>` using the installed CLI. No additional bridge config is required. If CodeGraph is already indexed, continue; do not repeat installation/init. Set `CODE_ANIME_CODEGRAPH_COMMAND` only when the executable is not on PATH. The adapter is exercised against CodeGraph 1.6.2 with Kotlin on Linux; Windows has not been directly exercised in this workspace.

## Default workflow

1. `visualizer_capabilities` advertises the workflow and limits.
2. `read_codegraph_evidence` retrieves complete relevant source through CodeGraph, with cached-response paging and provider file-range queries. Use explore for an endpoint/business request, then node for helpers and DTO definitions.
3. The host AI simulates every relevant statement/expression for chosen mock inputs. It includes transformations such as trim/min, parameter binding, return propagation, branch results and each loop iteration.
4. `generate_mock_flow_animation` validates evidence receipts and structured events, stores a temporary session and returns the player URL.
5. The player displays moving object-field cards, highlighted before/after values, inputs/results, origins, source lines, stack and locals. Play/Pause, Previous/Next, seek, speed and replay restore event snapshots.

For large traces, submit successive chunks with `continuationOf`. The player links them and the tool returns the first chunk's URL. For a visual feature plan, submit a full proposed scenario with `baselineSessionId`; switch between baseline and proposal in the player.

See the [tool contract](skills/code-anime/references/tool-contract.md) for payloads. The server checks receipt membership, project identity and event structure; it does not independently prove AI calculations correct. Missing source/uncertain semantics must be marked unresolved rather than invented.

## Tools

| Tool                           | Purpose                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| `visualizer_capabilities`      | Workflow, access boundary and limits                                     |
| `read_codegraph_evidence`      | Verified CodeGraph source/context retrieval and paging                   |
| `generate_mock_flow_animation` | AI mock trace, values, continuation and proposed scenario comparison     |
| `inspect_visualization`        | Bounded trace-event inspection                                           |
| `visualize_code_flow`          | Optional structural graph exploration job                                |
| `get_visualization_status`     | Structural job status/candidate selection                                |
| `refine_visualization`         | Structural job refinement; AI scenarios must be recomputed and submitted |
| `visualize_change_plan`        | Legacy structural proposal overlay                                       |
| `manage_visualization`         | List/cancel/delete/import                                                |

Structural graph jobs remain available but are not the default execution animation. Legacy `steps` payloads now require CodeGraph receipts, projectRoot and coverage; they cannot bypass the dependency requirement.

## Configuration and bounds

| Variable                       | Default                | Purpose                                             |
| ------------------------------ | ---------------------- | --------------------------------------------------- |
| `CODE_ANIME_PORT`              | `0`                    | Free localhost player port                          |
| `CODE_ANIME_TEMP_DIR`          | OS temporary directory | Parent for isolated per-process sessions            |
| `CODE_ANIME_PROJECT_ROOT`      | Per-request roots      | Optional project access boundary                    |
| `CODE_ANIME_CODEGRAPH_COMMAND` | `codegraph`            | Optional native executable override                 |
| `CODE_ANIME_CODEGRAPH_CONFIG`  | Unset                  | Optional normalized bridge for structural job tools |
| `CODE_ANIME_TTL_MS`            | `3600000`              | Session lifetime                                    |

Trace chunks accept 2,000 events and 8 MiB of request data; stored sessions are capped at 10 MiB, with 100 sessions per process. CodeGraph receipts last an hour and are capped at 200. Cached evidence responses are paged; oversized upstream results must be narrowed with file ranges. Report incomplete coverage explicitly and continue in chunks rather than silently truncating.

The player binds to `127.0.0.1`. Sessions use UUIDs, quotas, expiry and isolated directories; graceful shutdown removes this process's files. Force-kill/power loss may leave temporary directories; automatic orphan recovery remains future reliability work. Remote/container hosts need supported port forwarding.

## Development and demo

```sh
npm ci
npm run demo
npm run check
npm run package:check
```

The offline demo renders bundled mock data without analyzing a codebase. For the real CodeGraph integration tests and packed CLI smoke test, set `CODE_ANIME_TEST_CODEGRAPH` to the installed executable path. Tests cover dependency failure, mock transform/state contracts, continuation, comparison, safe object rendering and replay restoration.

## Structure

`src/services/simulation-service.ts` manages CodeGraph evidence receipts and AI trace validation; `src/analysis/` adapts the provider; `src/domain/` defines trace/flow schemas; `src/storage/` manages sessions; `src/mcp/` exposes tools; `public/` renders replay; `skills/code-anime/` supplies agent orchestration.

[Architecture](docs/architecture.md) · [CodeGraph details](docs/analysis.md) · [Release instructions](docs/releasing.md) · [MIT license](LICENSE)
