# Contributing to Code Anime

Welcome! You can help with the player, tests, documentation, accessibility, and the future analysis engine.

## Local workflow

1. Fork and clone the repository.
2. Install Node.js 22 or newer and run `npm ci`.
3. Run `npm run demo` and open the printed URL.
4. Create a branch for one focused change.
5. Run `npm run format` and `npm run check`.
6. Open a pull request describing the problem, behavior, and verification.

For MCP integration use `npm run build`, then configure your host to run `node /absolute/path/code-anime/dist/index.js`. `npm run dev` is useful for development, but watch restarts expire sessions.

## Design conventions

- Keep domain contracts independent of Express and MCP.
- Pass dependencies into modules; avoid mutable global server state.
- Validate external input at the boundary. Keep tool compatibility intentional.
- Render untrusted names and values as text, never HTML.
- Use asynchronous file operations and clean up only resources owned by this process.
- Log MCP diagnostics to stderr; stdout belongs to the protocol.
- Add meaningful regression tests for behavior and lifecycle changes.
- Explain assumptions: mock data is not observed runtime data.
- Avoid adding abstraction layers until a concrete use case needs them.

Start with an issue for major APIs, dependencies, language analyzers, or breaking changes. Small fixes can go straight to a PR. Suitable first contributions include keyboard playback, clearer empty states, source-evidence schema proposals, and UI regression tests. These are suggestions, not pre-existing assigned issues.

## License

This project is licensed under the [MIT License](LICENSE). Contributions are made under the same license.
