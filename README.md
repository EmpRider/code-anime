# Code Anime

**Watch code execute with mock values, one step at a time.**

CodeGraph retrieves the active project's source and relationships. Your AI agent supplies source-grounded mock steps directly through MCP calls. Code Anime assembles the trace, manages frames and snapshots, and animates objects with their fields, before/after changes and source locations in a localhost player.

Version **0.5.0** adds a modern execution studio to the server-owned animation workflow. No agent-generated Python/JS helper, payload JSON file, custom player, or shell command is part of the visualization workflow. The default simulation workflow requires CodeGraph and does not execute repository code, databases or HTTP effects. Values are labeled as simulated, assumed, unresolved or proposed. Explicit runtime recording is available for main-thread Python programs as described below.

## Record actual Python execution

Use `record_execution` when the user requests running a trusted Python entry file. Unlike simulation, this executes the application with local permissions and real side effects; it is not a sandbox. Python must be installed (`python` on Windows, `python3` elsewhere), or set `CODE_ANIME_PYTHON_COMMAND` to its executable path. CodeGraph is not required for this recorder. Other languages retain their existing structural and simulated workflows; runtime support for them is not yet implemented.

Send `action: "start"`, `language: "python"`, `projectRoot`, `entry` (a `.py` file inside that root), and optional string `args`. Poll `action: "status"` with the returned `jobId` for event/byte counts and the final player URL. `action: "cancel"` stops a running job and saves any events already captured. A built-in recorder collects the events; the AI does not generate or infer their values. Playback and inspection only use these stored snapshots.

The recorder captures real invocations across user files, repeated source-line visits, bounded local/argument snapshots, returns, exceptions and text writes to stdout/stderr. Generators retain one invocation identity across yield/resume transitions; coroutine suspensions and resumptions are marked separately from real returns, and asyncio task identities distinguish interleaved task execution. Each line event is the state **before** that line executes; the next event reflects its effects. Runtime console writes are concatenated exactly as captured. Events are marked `observed`, with a unique recording identity shared across automatic continuation chunks. A completed trace covers the recorded input and main-thread user-code scope, not all possible branches or the entire application.

Defaults are 15 seconds, 10,000 events and 16 MiB of protocol data. Set `timeoutMs`, `maxEvents` and `maxTraceBytes` explicitly to adjust resource budgets (up to 300 seconds, 100,000 events and 64 MiB). These are resource budgets, not call-depth limits. Timeouts, cancellation and exhausted budgets preserve valid partial events and display their reason. Existing session quotas still apply when saving chunks.

Limits: detected concurrent threads stop with an explicit boundary. Generator/coroutine event stacks reflect currently executing Python frames; task IDs do not imply a causal relationship between tasks, and suspension events do not represent awaited result values. Other processes, native/dependency internals, binary stream writes and custom object internals are outside capture scope. Strings, collections, locals and nesting are bounded and omissions are marked in the snapshots; no custom `repr` or property getters run for inspection. Ordinary Python recursion limits still apply. Exceptions that escape the program are reported as incomplete runs. The recorder is not suitable for adversarial programs that replace instrumentation, write to its protocol stream or deliberately evade process supervision.

## Connect the MCP

Requirements: Node.js 22+, CodeGraph installed and initialized/indexed for the active project, and an AI host that supports MCP and skills.

After version 0.5.0 is published to npm, a typical host configuration is:

```json
{
  "mcpServers": {
    "code-anime": {
      "command": "npx",
      "args": ["-y", "@empirerider/code-anime@0.5.0"],
      "env": { "CODE_ANIME_PORT": "0" }
    }
  }
}
```

A repository push does not publish npm. To use the source build immediately, run `npm ci` and `npm run build`, then configure `node /absolute/path/code-anime/dist/index.js` instead. Host configuration wrappers differ; use the format supported by your host.

Copy `skills/code-anime/` into your host's supported skill directory. Installing the npm package alone does not install the skill. Ask `/code-anime show ACH generation`, or ask to visualize any function or endpoint. The agent resolves the open workspace and supplies its path automatically.

Code Anime launches `codegraph serve --mcp --path <active-project>` using the installed CLI. No additional bridge config is required. If CodeGraph is already indexed, continue; do not repeat installation/init. On Windows, Code Anime automatically resolves the npm-installed `codegraph.cmd` wrapper to its Node shim, avoiding Node's restriction on spawning `.cmd` files directly. Set `CODE_ANIME_CODEGRAPH_COMMAND` when the executable is not on PATH. For another bundled Node launcher on Windows, set this to its `node.exe` and set `CODE_ANIME_CODEGRAPH_ARGS` to a JSON array containing `--liftoff-only` and the absolute CodeGraph entry-point path. The native adapter was verified on Windows with an indexed Kotlin fixture and CodeGraph 0.9.9, including the default PATH-based launcher. It uses direct mode without detached daemons so provider processes close with each request. Provider versions that merge same-named definitions produce explicitly incomplete coverage rather than attributing another method's callees to the selected method.

## Default workflow

1. `visualizer_capabilities` advertises the workflow and limits.
2. `read_codegraph_evidence` retrieves complete relevant source through CodeGraph, with cached-response paging and provider file-range queries. Use explore for an endpoint/business request, then node for helpers and DTO definitions.
3. `build_mock_animation` begin opens a server-owned build. The AI sends compact source-grounded operations in append calls (normally 10–30 at a time).
4. The server assigns event/invocation IDs, retains the stack and all locals/objects, and produces before/after snapshots. No helper script or payload file is needed.
5. Finish automatically chunks and persists the trace and returns one localhost player URL. The player shows object fields, changes, inputs/results, origins and source lines with full replay controls.

Transforms such as trim/min, assignments, branch decisions and loop iterations remain explicit semantic steps. The host AI supplies mock results in the correct source-language semantics; the MCP server owns the full animation construction and hosting lifecycle. It does not execute source or generated programs.

For a visual feature plan, begin with baselineSessionId and append a proposed scenario. Use status/cancel for an unfinished build. Retries with the same batchId/body do not duplicate events. Server limits produce explicit errors, never instructions to create a script.

Baseline and proposed executions can each span multiple stored chunks. A baseline ID from a later chunk resolves to the start of that run. The player loads each variant independently and remembers its playback position when switching; fetching prepared chunks does not invoke AI analysis. Mark changed operations as `proposed`, including changes that appear only in later chunks.

See the [tool contract](skills/code-anime/references/tool-contract.md) for payloads. The server checks receipt membership, project identity and event structure; it does not independently prove AI calculations correct. Missing source/uncertain semantics must be marked unresolved rather than invented.

## Execution studio

The desktop inspector and console start collapsed to leave more room for source and execution. Open the inspector from the header, or expand the console when needed. On desktop and tablet widths, drag the divider beside the execution timeline to resize it; focused divider keys Left/Right adjust by 20 pixels and Home/End select its limits. Focus/Restore temporarily maximizes the source workspace. Timeline width, inspector visibility and console preferences are saved in browser storage when available. Layout changes preserve the selected event and playback state; mobile continues to use its dedicated view tabs.

Exception paths use explicit semantic operations. A `throw` may supply
`unwindTo` with an active call ID (from builder status) to retain that handler's
frame and remove its callees, or `null` for an uncaught exception. Omitting it
keeps the stack unchanged, allowing intervening `finally` statements to be
represented. Follow with `catch` and `set` to bind the exception in the handler.
These operations describe the AI-supplied simulation; they do not execute or
infer language-specific exception rules.

The player keeps a searchable execution timeline, live flow, source spotlight and step inspector together. It takes interaction cues from [VisualJS](https://www.visualjs.in/visualizer) while replaying CodeGraph-grounded mock traces across supported source languages.

- Click a step or scrub the timeline; Previous restores the recorded stack, locals and shared objects.
- Use the disclosure arrow beside a method entry to expand or collapse prepared details without seeking or pausing playback. Nested expansion preferences survive collapsing their parent. Selecting the step itself navigates the timeline; search and filters can reveal details inside collapsed methods.
- Use Focus view for the current transition or Full map to browse all symbols in this trace chunk.
- Inspect nested object fields, before/after changes, inputs, return values and value origins. Filter to changes only.
- Switch between Values, State (call stack, locals, shared objects), and Context (coverage, evidence, comparison and chunk navigation).
- Search labels, files or values; filter event types and bookmark important steps.
- Set a playback breakpoint with the red-dot button, or double-click a trace row. Autoplay pauses after displaying that step's recorded state. Press Play to continue. Breakpoints and bookmarks are session-local and reset on scenario switching.
- Use Space for play/pause, arrow keys to step, Home/End to seek, / to search and B to bookmark when focus is outside an interactive control.
- Export the current trace as JSON using the player's download button.

Source spotlight displays the recorded excerpt and line range. Shared objects show recorded snapshots; the player does not infer missing heap references, closures or runtime effects. Replay fidelity depends on the submitted source-grounded operations and their stated coverage.

## Tools

| Tool                           | Purpose                                                                     |
| ------------------------------ | --------------------------------------------------------------------------- |
| `visualizer_capabilities`      | Workflow, access boundary and limits                                        |
| `read_codegraph_evidence`      | Verified CodeGraph source/context retrieval and paging                      |
| `build_mock_animation`         | Default begin/append/finish workflow; server builds and hosts the animation |
| `generate_mock_flow_animation` | AI mock trace, values, continuation and proposed scenario comparison        |
| `inspect_visualization`        | Bounded trace-event inspection                                              |
| `visualize_code_flow`          | Optional structural graph exploration job                                   |
| `get_visualization_status`     | Structural job status/candidate selection                                   |
| `refine_visualization`         | Structural job refinement; AI scenarios must be recomputed and submitted    |
| `visualize_change_plan`        | Legacy structural proposal overlay                                          |
| `manage_visualization`         | List/cancel/delete/import                                                   |

Structural graph jobs remain available but are not the default execution animation. Legacy `steps` payloads now require CodeGraph receipts, projectRoot and coverage; they cannot bypass the dependency requirement.

## Configuration and bounds

| Variable                       | Default                | Purpose                                                |
| ------------------------------ | ---------------------- | ------------------------------------------------------ |
| `CODE_ANIME_PORT`              | `0`                    | Free localhost player port                             |
| `CODE_ANIME_TEMP_DIR`          | OS temporary directory | Parent for isolated per-process sessions               |
| `CODE_ANIME_SESSION_DIR`       | Unset                  | Optional restart-durable session directory (see below) |
| `CODE_ANIME_PROJECT_ROOT`      | Per-request roots      | Optional project access boundary                       |
| `CODE_ANIME_CODEGRAPH_COMMAND` | `codegraph`            | Optional native executable override                    |
| `CODE_ANIME_CODEGRAPH_ARGS`    | `[]`                   | JSON array of launcher arguments before CLI arguments  |
| `CODE_ANIME_CODEGRAPH_CONFIG`  | Unset                  | Optional normalized bridge for structural job tools    |
| `CODE_ANIME_TTL_MS`            | `3600000`              | Session lifetime                                       |

The builder accepts up to 100 operations/1 MiB per append, server-disk-backed snapshots without a fixed total event or byte cap, and ten retained builds with one-hour expiry. It splits storage chunks automatically. One-shot trace chunks accept 2,000 events and 8 MiB of request data; stored sessions are capped at 10 MiB, with 100 sessions per process. CodeGraph receipts last an hour and are capped at 200. Cached evidence responses are paged; oversized upstream results must be narrowed with file ranges. Report incomplete coverage explicitly and continue in chunks rather than silently truncating.

The player binds to `127.0.0.1`. Sessions use UUIDs, quotas and expiry. By default each process writes to an isolated temporary directory, removed on clean shutdown. Set `CODE_ANIME_SESSION_DIR` to an absolute, writable, private directory to keep finalized animations and continuation/comparison chains across normal server restarts. `CODE_ANIME_TEMP_DIR` still controls the parent of ephemeral storage when persistence is not configured. For example on PowerShell: `$env:CODE_ANIME_SESSION_DIR = "$HOME\\.code-anime\\sessions"`. Start the server with the same setting after a restart; the browser URL uses the new localhost port (`CODE_ANIME_PORT=0` selects a free port), but the saved session UUID remains valid. Old URLs with the previous port won't work.

On startup, persistent mode reconstructs session indexes, removes incomplete `.json.tmp` writes, deletes sessions older than `CODE_ANIME_TTL_MS` (default one hour), and quarantines corrupt or oversized session files in `.code-anime-corrupt` for manual inspection. Quarantined files are not served and are not automatically deleted. The 10 MiB/session and 100-session limits still apply, including to recovered sessions; when full, delete sessions or wait for expiry. The session directory is exclusive to one running process through `.code-anime.lock`. If a process crashes, verify it has stopped **before** manually removing its stale lock; the server will not guess that another process is dead. Keep the directory private because sessions may contain source snippets and simulated values. Remote/container hosts need supported port forwarding.

## Development and demo

```sh
npm ci
npm run demo
npm run check
npm run package:check
```

The offline demo renders bundled mock data without analyzing a codebase. For the real CodeGraph integration tests and packed CLI smoke test, set `CODE_ANIME_TEST_CODEGRAPH` to the installed executable path. Tests cover dependency failure, mock transform/state contracts, continuation, comparison, safe object rendering and replay restoration.

Run `npm run test:browser` for browser layout and interaction checks at desktop, tablet, and phone sizes. Windows uses installed Microsoft Edge; other platforms use Playwright Chromium (`npx playwright install chromium`). `CODE_ANIME_BROWSER_CHANNEL` overrides the browser channel. Tests cover viewport overflow, accessible playback controls, mobile panel switching without changing the selected event, state inspection, console scrolling, search, and keyboard help. Screenshots are saved under the ignored `test-results` directory.

## Structure

`src/services/animation-builder.ts` owns incremental trace construction and snapshots; `src/services/simulation-service.ts` manages CodeGraph evidence receipts and AI trace validation; `src/analysis/` adapts the provider; `src/domain/` defines trace/flow schemas; `src/storage/` manages sessions; `src/mcp/` exposes tools; `public/` renders replay; `skills/code-anime/` supplies agent orchestration.

[Architecture](docs/architecture.md) · [CodeGraph details](docs/analysis.md) · [Release instructions](docs/releasing.md) · [MIT license](LICENSE)
