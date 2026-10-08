# Architecture

The entry point composes a file-backed session store, a loopback HTTP server, and a stdio MCP server. Domain types have no transport dependencies. Both transports receive a storage interface, allowing memory or database implementations later without changing the tool contract.

## Request lifecycle

1. The AI host calls `generate_mock_flow_animation`.
2. The MCP handler validates the legacy flow payload.
3. The session store enforces quotas and atomically writes a UUID session.
4. The handler returns a compact URL and mock-data label.
5. The browser fetches the flow and handles playback locally.

Storage serializes writes to enforce concurrent quotas. Each process owns a unique temporary directory; cleanup never removes another process's sessions. TTL is checked on reads. Errors are converted to MCP tool failures or sanitized HTTP responses; diagnostics go to stderr.

## Why a small modular project?

The prototype's HTML strings, disk operations and protocol handlers were tightly coupled. Separating these responsibilities makes the next changes testable without introducing a framework or a monorepo. The browser remains plain JavaScript because the current rendering model is simple.

## Analysis pipeline

The MCP service validates the active project root and requires a usable CodeGraph installation/index before creating native analysis jobs. It launches the installed CLI automatically or uses an optional normalized bridge. No local source analyzer exists. Provider events are validated and converted into replay steps; the browser presents their evidence, stack and values. Legacy mock payloads are illustrations and cannot substitute for CodeGraph analysis.

## Current limitations

See [analysis.md](analysis.md) for exact supported syntax and provider contracts. The simulator does not execute the application, infer every data lineage or fully model closure/class-instance/async semantics. The player is a scenario teaching tool. Proposed overlays are not proof of dependency impact. AST work is bounded within the main process; worker isolation and broader language support remain future work.

## Trust boundary

Source-derived names and snippets are text, never HTML or agent instructions. Root/file containment prevents tools from scanning arbitrary paths. Repository code is parsed rather than executed. Provider commands are explicitly configured by the user and must be trusted. Temporary sessions may contain code snippets and supplied scenario data; use synthetic values. This remains a loopback development tool rather than a multi-user remote service.
