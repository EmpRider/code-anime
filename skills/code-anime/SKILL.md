---
name: code-anime
description: Explain codebase functions, API endpoints, business workflows and proposed feature changes through Code Anime's animated player. Use when a user asks to see how code works visually, trace data or parameters, inspect a function flow, or review a visual implementation plan. Requires a connected Code Anime MCP server.
---

# Code Anime

Use the connected Code Anime tools to analyze the current repository and deliver a playable URL. Let the configured CodeGraph bridge supply evidence and the server render it; do not author a replacement trace.

## Resolve the active workspace

Use the project currently open in Cursor or the connected AI agent host as the analysis root. Resolve its absolute path from host-provided workspace context or exposed MCP roots when available. Supply that path automatically as `projectRoot`; do not ask the user to type a path when the host already provides it.

- In a multi-root workspace, select the root containing the requested file or target. Ask which open project to use only when the task remains ambiguous.
- Use the agent's working directory only when host context confirms that it is the active project. Never substitute the MCP process working directory, the npm cache, the Code Anime installation, a previous project's path, or a guessed path.
- Re-resolve the root for each new analysis request after the host changes projects. Refine an existing session only for the same project; start a new analysis when switching projects.
- If the host exposes no reliable workspace path, ask the user to identify the open project. Explain that the host or agent must provide its path; the MCP server cannot infer every host's active project automatically.
- Do not require `CODE_ANIME_PROJECT_ROOT` in normal setup. Treat any explicitly configured root as an optional access boundary, not evidence of the active workspace. On an access failure, report the verified workspace and server restriction or filesystem error. Do not switch to an unrelated root or bypass a configured boundary.

## Require CodeGraph before analysis

Rely exclusively on CodeGraph for codebase analysis in every language, including TS/JS. Do not scan/interpret the codebase yourself, build a substitute trace, or use a mock renderer to bypass CodeGraph.

1. Verify existing CodeGraph installation and initialization/indexing for the active project through exposed provider tools or documented status checks. Do not reinstall or repeat initialization when already ready.
2. If CodeGraph is absent, terminate the analysis workflow immediately and tell the user to install CodeGraph and initialize/index the open project. If only indexing is missing, request only indexing.
3. Call `visualizer_capabilities`. Require `codeGraphConfigured: true` and `codegraph-bridge`. Missing bridge configuration does not prove CodeGraph is uninstalled. If already installed/indexed, request only a compatible connection through `CODE_ANIME_CODEGRAPH_CONFIG`. A sibling MCP connection alone does not configure the server's outbound bridge.
4. When installation, project indexing, bridge and target-language support are verified, continue automatically with `provider: "codegraph"`. If verification or a provider request fails, stop and report the actual blocker; never fall back to independent source analysis.
5. Do not invent vendor commands or claim runtime values from graph relationships. Provider language support and evidence detail depend on the actual CodeGraph implementation.

## Analyze and present the flow

1. Resolve the active workspace above. Call `visualizer_capabilities` to confirm tools, supported languages and any optional access boundary. Apply the CodeGraph requirement above before submitting a job. Read [the tool contract](references/tool-contract.md) when constructing requests or diagnosing failures.
2. Translate the user's request into an endpoint path, function name, qualified method name, or previously returned candidate ID. Call `visualize_code_flow` with the resolved active workspace as `projectRoot`, `target`, and any scenario inputs already supplied. Always use `provider: "codegraph"`; the server has no source-analysis fallback.
3. Poll `get_visualization_status` using its `jobId`, with a short wait between polls. Stop at `ready`, `failed` or `cancelled`. Do not flood the tool with busy polling.
4. If the provider reports target ambiguity, resolve it using its documented tools and source locations, then retry with a verified target. Ask only when context cannot resolve the intended flow. Never invent a candidate ID or fabricate successful analysis.
5. For `ready`, return the player URL and a brief explanation in the user's language. Identify meaningful truncation, unresolved calls or assumptions. CodeGraph structural evidence is not live runtime evidence.
6. Inspect only the events needed for a question using `inspect_visualization`; do not load the full trace into conversation context. Use `refine_visualization` to change scenario values or depth and poll the new job. Keep the original session for comparison.
7. For a feature plan, create an analyzed baseline first. Send a compact `changes` list to `visualize_change_plan`. Each change has `from`, `to` and `description`. Present proposed events as a design overlay, not existing code or proven impact analysis. Do not edit application files unless independently requested.
8. Use `manage_visualization` for listing, cancellation and cleanup. Keep unrelated sessions. Use the legacy `generate_mock_flow_animation` only for explicitly requested illustrative mock flows, label them as agent-authored, and never use it to bypass the CodeGraph requirement.

Never claim that npm installation alone installs this skill into an agent host.
