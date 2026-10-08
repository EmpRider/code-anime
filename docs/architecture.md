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

## Current limitations

The payload describes transitions, not full execution semantics. Node identity is a display name. Previous/seek redraw a selected step; they do not reconstruct memory mutations. There is no branch interpreter, source index, call stack, CodeGraph connection or portable installed skill yet. A future versioned event model must address these together rather than pretending a longer list of steps is a debugger.

## Trust boundary

Source-derived strings and mock values are treated as text. Session IDs are validated before filesystem access. The browser has a restrictive content security policy. The HTTP server is read-only and loopback-bound; remote exposure requires a separate authentication and origin policy design. Temporary sessions may contain agent-provided sensitive information, so use synthetic data. This is a local development tool, not a hardened multi-user service.
