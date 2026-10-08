# Code Anime

**Watch code flows move, one step at a time.**

Code Anime renders CodeGraph-supplied code-flow evidence in a local animated player. CodeGraph is required for every codebase analysis, including TypeScript and JavaScript. Code Anime does not parse or simulate project source itself.

> Version 0.3.1 removes the built-in analyzer. The installed `codegraph serve --mcp` CLI is used automatically for the active workspace. No separate bridge-config file is required. See [provider setup](docs/analysis.md).

## Try the player

Requirements: Node.js 22+ and npm.

```sh
git clone https://github.com/EmpRider/code-anime.git
cd code-anime
npm ci
npm run demo
```

Open the URL printed in the terminal. The demo uses `examples/login-flow.json` and requires no database or AI host. Stop it with Ctrl+C.

## Install through npx (after the first npm release)

The planned public package name is `@empirerider/code-anime`. Version 0.3.1 requires a new npm release; repository updates alone do not publish it. Once released, an MCP host that uses a `servers` configuration can run it directly:

```json
{
  "servers": {
    "code-anime": {
      "command": "npx",
      "args": ["-y", "@empirerider/code-anime"]
    }
  }
}
```

Some hosts use `mcpServers` or another configuration format. Use the same command and arguments in your host's supported format. Node.js 22+ is required. Pin `@empirerider/code-anime@0.3.1` for a reproducible version after that version is published. Install the portable skill separately; the installed CodeGraph CLI is used automatically.

## Connect an AI agent

```sh
npm run build
```

Configure a stdio MCP server in your host. A common configuration shape is:

```json
{
  "mcpServers": {
    "code-anime": {
      "command": "node",
      "args": ["/absolute/path/code-anime/dist/index.js"],
      "env": { "CODE_ANIME_PORT": "0" }
    }
  }
}
```

Use an absolute path; escape Windows backslashes in JSON. Host configuration formats differ: translate this command and arguments into the format your agent supports. This project has not yet verified every host.

The agent resolves the project currently open in the host and checks that CodeGraph is installed and indexed for it. If absent, stop and install/initialize CodeGraph. If already ready, continue without reinstalling. Code Anime resolves `codegraph` from PATH and checks the active project index before creating a job. Use optional `CODE_ANIME_CODEGRAPH_COMMAND` only when the executable is elsewhere. Provider failures stop without fallback.

Call `visualizer_capabilities`, then `visualize_code_flow` with `provider: "codegraph"`, the active workspace `projectRoot` and a target. Poll for the player URL. Native replay shows CodeGraph indexed relationships and source snippets, not simulated execution or calculated runtime values. `CODE_ANIME_PROJECT_ROOT` remains an optional access restriction.

| Tool                           | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `visualizer_capabilities`      | Supported scope, project root and limits     |
| `visualize_code_flow`          | Analyze source and enqueue a replay job      |
| `get_visualization_status`     | Progress, target candidates and player URL   |
| `inspect_visualization`        | Paginated events, values and source evidence |
| `refine_visualization`         | New scenario/depth analysis                  |
| `visualize_change_plan`        | Proposed-change overlay on a baseline        |
| `manage_visualization`         | List/cancel/delete/import                    |
| `generate_mock_flow_animation` | Backward-compatible agent-authored renderer  |

## Portable agent skill

The npm tarball and repository include `skills/code-anime/SKILL.md` with a small tool-contract reference. The skill instructs agents to use the host's active workspace, re-resolve it after project switches, and avoid guessed paths or the MCP process working directory. Copy the entire `code-anime` directory into the skill location supported by your host (for example `.claude/skills/` or `.opencode/skills/`; consult your host's current documentation for Codex/other variants). This is a distributable project skill, not automatically installed in your account. Connect the MCP separately. Skill activation and setup need to be verified on your host; no all-host compatibility guarantee is made.

## What works today

- Automatic installed CodeGraph CLI adapter plus optional normalized bridge; no independent source analyzer.
- Background jobs, cancellation, session storage and scenario refinement through the provider.
- Rendering of provider-supplied source evidence, call stacks and values where available.
- Replay controls, paginated inspection and proposed-change overlays.
- Offline evidence imports and an explicitly illustrative legacy mock renderer.
- Portable `code-anime` skill and package verification.

The native adapter was tested against CodeGraph 1.6.2 using Kotlin on Linux. It does not reuse Cursor's sibling MCP session; it launches the installed executable with the active project path. Windows has not been tested directly. See [evidence limits](docs/analysis.md).

## Tool payload

```json
{
  "endpoint": "POST /login",
  "steps": [
    {
      "from": "LoginController",
      "to": "AuthService",
      "dtoName": "LoginRequest",
      "dtoFields": { "email": "demo@example.com" }
    }
  ]
}
```

Fields are required. Up to 2,000 steps and 10 MiB per session are accepted. Names are display labels; distinct functions sharing a label currently share a node. The browser shows a simulation, not a verified execution trace.

## Configuration

| Variable                       | Default                  | Purpose                                     |
| ------------------------------ | ------------------------ | ------------------------------------------- |
| `CODE_ANIME_PORT`              | `0`                      | Player port; `0` chooses a free port        |
| `CODE_ANIME_TEMP_DIR`          | OS temp directory        | Parent for an isolated process directory    |
| `CODE_ANIME_PROJECT_ROOT`      | Unrestricted per request | Optional allowed source repository root     |
| `CODE_ANIME_CODEGRAPH_COMMAND` | `codegraph`              | Optional executable path for native adapter |
| `CODE_ANIME_CODEGRAPH_CONFIG`  | Unset                    | Optional normalized bridge override         |
| `CODE_ANIME_TTL_MS`            | `3600000`                | Session lifetime from creation              |

The server accepts local connections at `127.0.0.1`. It creates at most 100 sessions per process. Expired sessions are removed when accessed or when a new session is created. Graceful shutdown deletes this process's directory. Force-kill and power loss can leave temporary files; automatic orphan recovery is planned. No production authentication or remote hosting is provided. A remote/container AI host needs its own supported port-forwarding setup.

## Project structure

| Path             | Responsibility                              |
| ---------------- | ------------------------------------------- |
| `src/domain/`    | Flow contract and storage interface         |
| `src/mcp/`       | MCP registration and tool handling          |
| `src/storage/`   | Bounded temporary session persistence       |
| `src/web/`       | Player pages and read-only API              |
| `src/runtime.ts` | HTTP/storage composition and lifecycle      |
| `public/`        | Browser player, styles and page             |
| `tests/`         | Contract, storage, HTTP and MCP regressions |
| `docs/`          | Architecture and staged roadmap             |

## Development

```sh
npm run dev
npm run format
npm run check
```

CI runs the same checks on Node 22/24 and Linux/Windows. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and [docs/architecture.md](docs/architecture.md) for design boundaries.

## Help shape the next version

The next milestone adds real vendor-specific CodeGraph adapters and broadens provider coverage. See [the roadmap](docs/roadmap.md). Contributions to accessibility, tests, and player usability are welcome now.

## License

[MIT](LICENSE) © 2026 empirerider. See [release instructions](docs/releasing.md) for npm publishing.
