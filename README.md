# Code Anime

**Watch code flows move, one step at a time.**

Code Anime is an early-stage MCP server that gives AI coding agents a local animation player. An agent supplies a sequence of calls and mock parameters; the player shows data moving between modules, with playback and inspection controls.

> Current scope: an agent-authored flow renderer. It does **not** index repositories, query CodeGraph, execute your application, or capture live variables. Those capabilities belong to the roadmap.

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

The planned public package name is `code-anime`. It is not published yet. Once released, an MCP host that uses a `servers` configuration can run it directly:

```json
{
  "servers": {
    "code-anime": {
      "command": "npx",
      "args": ["-y", "code-anime"]
    }
  }
}
```

Some hosts use `mcpServers` or another configuration format. Use the same command and arguments in your host's supported format. Node.js 22+ is required. Pin `code-anime@0.1.0` for a reproducible version after that version is published. Installing the MCP does not install an agent skill or add source analysis.

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
      "env": { "CODE_ANIME_PORT": "3456" }
    }
  }
}
```

Use an absolute path; escape Windows backslashes in JSON. Host configuration formats differ: translate this command and arguments into the format your agent supports. This project has not yet verified every host.

Ask your agent to analyze an endpoint and call `generate_mock_flow_animation` with the supported payload. The tool returns a session URL. It does not automatically analyze the endpoint itself.

## What works today

- Existing `generate_mock_flow_animation` input contract retained.
- Validated payloads, per-session UUIDs, multiple simultaneous sessions.
- Play/Pause, Next/Previous, Restart, speed selection and timeline seek.
- Mock parameter inspector and safe text rendering.
- Loopback-only HTTP server, per-process temporary storage and graceful cleanup.
- Independent MCP, web, domain and storage modules.

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

| Variable              | Default           | Purpose                                  |
| --------------------- | ----------------- | ---------------------------------------- |
| `CODE_ANIME_PORT`     | `3456`            | Player port; `0` chooses a free port     |
| `CODE_ANIME_TEMP_DIR` | OS temp directory | Parent for an isolated process directory |
| `CODE_ANIME_TTL_MS`   | `3600000`         | Session lifetime from creation           |

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

The next milestone moves repetitive analysis into the server: provider adapters, evidence-backed trace events, deterministic mock scenarios, and a portable agent skill. See [the roadmap](docs/roadmap.md). Contributions to accessibility, tests, and player usability are welcome now.

## License status

An open-source license has not yet been chosen. Package metadata currently says `UNLICENSED`; removing the publish block does not grant an open-source license. The maintainer should select a license before the public release. See [release instructions](docs/releasing.md).
