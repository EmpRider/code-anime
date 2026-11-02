# AGENTS.md instructions for D:\Dhana\My project\code-anime

<INSTRUCTIONS>
# Recovering from blocked calls and oversized prompts

Keep working toward the user's authorized goal after a tool failure. Preserve completed progress and continue any independent, permitted work that remains possible.

- If a tool reports `This tool call was blocked by OpenAI because we couldn't determine the safety status of the request.`, treat that operation as safety-blocked. Do not retry it by disguising its purpose, softening technical terminology, fragmenting it to avoid review, or switching tools to evade the block. Record the exact error and identify which operation was not executed.
- For clearly transient, non-safety errors such as timeouts or temporary connectivity failures, wait about 5-6 seconds between retries. Allow a maximum of 3 retry attempts for the failed operation; review the error and current state before each retry.
- If all 3 retries return the same error, stop retrying that operation. Skip the failing step and pursue a genuinely different, permitted approach toward the user's goal. Do not restart the retry counter by rewording the same call or switching tools to bypass a safety block. If no viable approach remains, continue independent work and report the unresolved step.
- When a legitimate request is too long for a tool's input limit, summarize irrelevant context accurately or split it into about 5-6 smaller, coherent requests. Keep the purpose, technical details, and necessary context explicit. This applies only to input-size failures, not safety refusals.
- If the operation remains blocked, complete other safe work and report what was completed, what could not be executed, and the actual error. Request a compliant alternative only if necessary.
- Never claim a blocked operation succeeded or silently omit unfinished work.

--- project-doc ---

# Code Anime project scope (mandatory)

Code Anime is a **static code-analysis and AI mock-data execution-flow visualizer**.
It is **not a runtime execution, debugging, profiling, or recording tool**.
This product boundary overrides outdated plans, audit notes, tests, prior
implementation choices, and external requirement documents that describe
observed runtime execution or actual program instrumentation.
Code Anime must never execute, import, evaluate, compile-and-run, or instrument
analyzed user project code to construct animations.

## Current V3 design authority (2026-11-02)

- The static CodeGraph-evidence and AI-mock-only product boundary above always takes precedence. Never execute or instrument the analyzed project.
- For current design intent and approval chronology, start at `docs/v3/README.md`. The target technical contracts are `docs/v3/architecture.md`, `docs/v3/flow-scene-json-contract.md` and `docs/v3/frontend-graph-design.md`. Check actual source and the relevant `.agent-tasks/` ledger for implemented/verified status.
- The owner approved V3 design, implementation plan and isolated FE Phase A (CA028–CA030) on 2026-10-29. On 2026-10-31 the owner requested a full V3 revamp without old-session/legacy-format support and complete selected-flow PNG captures. This later product direction does not itself prove backend implementation, live cutover, CI or release acceptance.
- Dated Council verdicts, old ELK/React plans, handoffs and historical task status snapshots are evidence of decisions **at their recorded dates**, not instructions to restart superseded work. Never treat an older `PROPOSED`, `DOCS ONLY` or `NO CUTOVER` heading as a newer owner decision. Council advice is not a substitute for owner approval.
- Keep current desktop new-flow source, highlighting, Visits, Values, playback and keyboard behavior intact through any future V3-only cutover. Record remaining CA059 label, CA060 CSP, CA061 readability and native MCP/browser gates honestly.

## Design documentation changes: update existing files first

- For every newly approved design change or decision, **find and update the existing authoritative design documents in place**. Use the current design index to locate the relevant architecture, contract, frontend design or implementation plan. Do not create another dated/versioned design, decision, Council, plan or handoff Markdown file for the same topic.
- In the same scoped documentation change, reconcile affected sections, approval/status wording, cross-references and the current index so agents see **one consistent current design**. Mark replaced decisions as superseded in the existing document instead of keeping contradictory active instructions in separate files.
- **Creating a new design document is an exception, not the default.** It requires evidence that no suitable existing document can hold the new subject, a short explanation of why an in-place update is insufficient, and the project owner's explicit approval **before** creating the file.
- Preserve the factual history of existing Council and task records: append a clearly dated supersession or link to the updated canonical design when needed; do not silently rewrite past approvals, test evidence or task outcomes. A new design decision still needs its normal review and authorization gates.

## Reconciled implementation requirements

The following goals from the original "Intelligent Code Execution Visualizer"
requirements are in scope **only when achievable through static analysis and
labeled AI simulation**:

- Deep, multi-file, multi-language flow analysis without arbitrary step limits.
- Hierarchical, expandable/collapsible call-tree visualization.
- Source-line highlighting synchronized with stack, variables, and console views.
- Minimalistic, space-efficient UI preserving existing layout philosophy.
- Smooth, responsive playback using precomputed mock data.
- Focus on user-written code; framework/library internals shown only as
  compact events needed to explain control flow through user code.
- Explicit handling of infinite loops, recursion, unbounded traces, and
  resource exhaustion via configurable budgets and cancellation.
- Clear communication of incomplete traces and evidence gaps.

Requirements that **conflict with the static/mock boundary** are out of scope
until the project owner explicitly changes this rule:

- Actual runtime execution, debugging, profiling, or recording.
- Observed variable values, return values, or side effects derived from
  running the user's application.
- Language runtimes, V8 Inspector, Python trace hooks, or program recorders.
- Tests or benchmarks that execute user project code to construct animations.

## Required workflow

1. Start from the user-selected codebase root and entry point, function,
   class, endpoint, or business flow. Keep analysis scoped to that project.
2. Use **CodeGraph** to discover source, definitions, references, callees,
   relationships, and paths. Use the AI agent to interpret the source and
   build a plausible, source-grounded flow across user-written modules.
3. The AI agent supplies **mock inputs, mock variable values, branches,
   mutations, returns, console examples, and assumptions**, clearly labeled as
   simulated. Never claim these were observed from a running program.
4. Submit mock operations through Code Anime's MCP animation builder. The MCP
   server owns the trace construction, session persistence, localhost player,
   and replay. No scripts, JSON payloads, or generated helpers may be created
   in the user's project to produce the animation.
5. Animate the complete relevant user-code flow as deeply as available source
   evidence and configurable resource budgets permit. No hardcoded 30-step
   limit. Make unknown branches or unavailable semantics explicitly unresolved,
   with a note explaining the evidence gap. Never label unresolved events as
   confidently simulated behavior.
6. Render a compact, interactive view with a hierarchical call tree, original
   source line highlighting, stack, mock variables/objects, return values,
   console examples, and a single reversible playback cursor. Playback and UI
   inspection use prepared data and never invoke fresh AI analysis.

The **Node.js server process and localhost web player** are infrastructure and
remain necessary. They must never execute the analyzed user's application.
Tests may execute Code Anime's own code, fake providers, and synthetic fixtures,
but must not run user project code to construct an animation.

When scope is unclear, favor static source evidence plus explicitly labeled
AI mock values. Reject any feature request to add runtime visualization until
the project owner explicitly changes this repository rule.

## Static/mock release quality and active V3 work

- Treat `docs/static-mock-acceptance.md` as historical static/mock acceptance evidence, not an up-to-date V3 task or approval list. Use the current V3 index, applicable task ledgers, actual code and explicit latest owner decisions for the active scope.
- Work on actionable release blockers before optional polish, without overriding a later owner-approved V3 scope change.
- For every change, run the smallest meaningful regression check first. Run
  the full typecheck, unit tests, browser tests, package check, and CI gates
  once the corresponding blockers have been addressed; repeat only when a
  subsequent code change or failure justifies it.
- Retire obsolete runtime-specific coverage only through authorized operations;
  replace any still-relevant behaviors with static/mock-data acceptance tests.
  Never restore recorder code, hide failures by narrowing release scripts, or
  call a selected passing subset the entire test suite.
- Preserve unrelated uncommitted work. Give a concise account of completed
  fixes, actual test results, blocking failures, and remaining acceptance gaps.
- Release readiness requires evidence for the full static/mock MCP workflow,
  the applicable original requirements, and passing CI/package checks.

</INSTRUCTIONS>
