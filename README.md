# Code Anime

**Watch code flows move, one step at a time.**

Code Anime gives AI agents a local animated code-flow player. Its server analyzes TypeScript/JavaScript source, resolves calls across project files and generates bounded scenario events with mock values and source evidence. Agents submit a target instead of authoring every frame.

> Version 0.2 adds server-owned source analysis, eight MCP tools, replay state inspection and a portable skill. This is a bounded static scenario simulator, not a live debugger. See [analysis support and limitations](docs/analysis.md).

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

The planned public package name is `@empirerider/code-anime`. Version 0.2.0 requires a new npm release; repository updates alone do not publish it. Once released, an MCP host that uses a `servers` configuration can run it directly:

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

Some hosts use `mcpServers` or another configuration format. Use the same command and arguments in your host's supported format. Node.js 22+ is required. Pin `@empirerider/code-anime@0.2.0` for a reproducible version after that version is published. Installing the MCP does not install an agent skill or add source analysis.

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

Ask your agent to call `visualizer_capabilities`, then `visualize_code_flow` with the absolute path of the project currently open in the host as `projectRoot` and a function/endpoint `target`. Poll `get_visualization_status` for the player URL. No project-specific environment variable is required: the agent resolves the active workspace from host context or exposed MCP roots and supplies it automatically in each tool call. In a multi-root workspace, use the root containing the requested target; ask only when it is ambiguous. The server cannot infer the active project if the host or agent does not provide its path. Optionally set `CODE_ANIME_PROJECT_ROOT` to restrict access to one directory.

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

The npm tarball and repository include `skills/visualize-code-flow/SKILL.md` with a small tool-contract reference. The skill instructs agents to use the host's active workspace, re-resolve it after project switches, and avoid guessed paths or the MCP process working directory. Copy the entire `visualize-code-flow` directory into the skill location supported by your host (for example `.claude/skills/` or `.opencode/skills/`; consult your host's current documentation for Codex/other variants). This is a distributable project skill, not automatically installed in your account. Connect the MCP separately. Skill activation and setup need to be verified on your host; no all-host compatibility guarantee is made.

## What works today

- Server-owned bounded TS/JS source analysis and cross-file function resolution.
- Asynchronous analysis jobs, target candidates, scenario refinement and quotas.
- Source spans/snippets, calls/returns, stack/locals snapshots and mutation events.
- Replay controls with immutable seek/Previous state and uncertainty labels.
- Visual proposed-change overlays and paginated inspection.
- Configurable normalized CodeGraph MCP bridge and offline trace imports.
- Legacy tool contract, UUID sessions, safe rendering and cleanup.
- A bundled portable skill, regression tests and installable-package checks.

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

| Variable                      | Default                  | Purpose                                    |
| ----------------------------- | ------------------------ | ------------------------------------------ |
| `CODE_ANIME_PORT`             | `0`                      | Player port; `0` chooses a free port       |
| `CODE_ANIME_TEMP_DIR`         | OS temp directory        | Parent for an isolated process directory   |
| `CODE_ANIME_PROJECT_ROOT`     | Unrestricted per request | Optional allowed source repository root    |
| `CODE_ANIME_CODEGRAPH_CONFIG` | Unset                    | Optional normalized provider bridge config |
| `CODE_ANIME_TTL_MS`           | `3600000`                | Session lifetime from creation             |

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

The next milestone expands AST semantics, adds worker isolation and broadens language/provider adapters. See [the roadmap](docs/roadmap.md). Contributions to accessibility, tests, and player usability are welcome now.

## License

[MIT](LICENSE) © 2026 empirerider. See [release instructions](docs/releasing.md) for npm publishing.
