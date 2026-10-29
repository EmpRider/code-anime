# Code Anime V3 — Engineering Council Decision Record

**Date:** 2026-10-29 (Asia/Colombo)  
**Scope:** FE-first architecture/design/implementation **documentation only**  
**Owner:** AI Engineering Decision Owner (EDO), acting in the assumed Staff/Principal Software Architect role  
**Decision status:** **PROPOSED, NOT USER-APPROVED FOR IMPLEMENTATION**  
**Tracking:** [V3 task ledger](../../.agent-tasks/code-anime-v3-design-20261029.md), CA022–CA039  
**Repository/branch:** `EmpRider/code-anime`, `fix/react-layout-collapse`  
**GitHub ledger-first gate:** CA022 ledger remotely verified at `915adb73e50db1005bb2ac56fc889d9b18af9453` before any `docs/v3/*` edit.

This is a record of a real five-advisor, five-anonymous-review, owner-led challenge process. The EDO is an AI technical advisor, **not** a substitute for the project owner's two separate future DESIGN and PLAN approvals. The owner authorized creating these documents and a GitHub task list; they did **not** authorize V3 production code, tests, builds, backend changes, migration, deployment, release, merge, publish, or deletion of previous work.

## 1. Question, evidence, and immutable user constraints

**Question:** How should Code Anime preserve CodeGraph-evidence-based, AI-mocked multilingual execution semantics while making the frontend responsible for adaptive graph geometry and nothing semantic?

The owner requires **one complete, versioned, immutable JSON document per prepared animation** from a **future** MCP backend. It must explicitly carry graph nodes, directed edges and meanings, nested groups, source snapshots, ordered frames, Visits, Values, stack/console displays, navigation targets, evidence and uncertainty. The browser may transform that **supplied** graph into rendered positions, shapes, group borders, orthogonal routes, labels, orientation-specific wrapping, zoom and pan. The browser must **not** scan source code to decide grouping, synthesize control flow/branch outcomes, merge server continuations, infer values, or fetch new JSON when the viewport/orientation changes.

**Static/mock boundary:** `AGENTS.md` forbids executing, instrumenting or recording analyzed user code. Only CodeGraph static evidence plus explicitly labeled host-AI mock interpretations may populate semantic data. An evidence receipt proves retrieval of source material, **not** truth of a simulated branch, runtime value or side effect. Unknown/missing relations must remain unresolved rather than being guessed by the browser.

**Observed current implementation, not V3 compliance:**

- `src/web/app.ts:35–67` serves raw per-session flow plus `nextSessionId`, rather than an immutable complete V3 document.
- `src/domain/trace.ts` stores event/evidence/source/group fields, but does not supply every V3 node, edge, playback-frame and UI-facing projection.
- `public/player.js:393–471`, `:1633–1740`, `:2424` and `:1171–1204` respectively prepare UI histories, assemble continuation chunks, replay event state, and tokenize source on the client. These paths need **future** cutover, not a docs-only edit.
- `public/semantic-flow-model.js` and `public/diagram-control-layout.js:2–286` currently derive grouping/topology, including bypass behavior. That semantic inference conflicts with the final V3 browser boundary.
- `public/diagram-elk-layout.js:20–109`, `:178–285`, `:308–499` already demonstrate presentational ELK layout, ID/parent/edge checks, containment/overlap protection and worker cancellation. This geometry can be reused only after it consumes explicit V3 semantic relationships. `public/diagram.js:510–545` does not currently pass both viewport dimensions to the geometry request; `:740–741` clamps zoom to `0.25–1.6`.
- Existing Source, Visits, Values, breakpoint, Follow, playback and external desktop component positions/sizes/controls are acceptance locks. Outside the graph, only theme tokens and internal padding/margin may change in a separately authorized phase.

**Decision criteria, ordered:** (1) obey semantic ownership and static/mock truthfulness; (2) preserve current/new-source and playback behavior; (3) readable nested graph/edge correctness; (4) complete, secure, bounded JSON; (5) reversible FE-first delivery and minimal change. Node overlap, invented edges or false evidence claims are unacceptable even if zoom or canvas usage improves.

## 2. Options and EDO provisional position

| Option | Benefit | Blocking drawback / status |
| --- | --- | --- |
| **1. Immutable full semantic JSON + FE presentation geometry** | One server-owned semantic truth; browser ELK can adapt locally to width and height; fixture-only FE work can precede backend | Requires a future complete server producer and full parity/size validation; **RECOMMENDED as proposed V3 design** |
| 2. Keep browser source scanning and continuation/replay inference temporarily | Uses existing browser code | Violates the owner's semantic-only-on-MCP rule; **REJECTED for the V3 runtime boundary** |
| 3. Server-generated coordinates and routes for each viewport | Simple browser drawing | Conflicts with FE-owned adaptive geometry and prohibition on viewport-triggered server fetch; **REJECTED** |
| 4. Minimal JSON where browser derives missing branch/group/Visit/Values semantics | Smaller producer contract | Reintroduces multilingual language-specific/frontend business inference; **REJECTED** |

**EDO position recorded before full synthesis:** Prefer Option 1; hard semantic ownership and source parity outrank layout efficiency and migration speed. Change recommendation if immutable payload cannot represent all playback/Visit behavior without frontend derivation, cannot be safely bounded, or if nested ELK cannot route the supplied edges without altering meaning. **Procedural transparency:** This EDO was instantiated after some advisor discussions had begun, and inherited earlier high-level context; consequently the preference was documented before deliberate full-report synthesis but **not claimed to be perfectly blinded**. Advisors independently assessed their own prompts and code evidence.

## 3. Five genuine independent advisor analyses

All five advisors read complete applicable current pinned engineering instructions independently and inspected relevant repository code read-only. Each gave its own recommendation before receiving other advisor reports. These are **technical proposals**, not independent sign-offs from human professional bodies.

| Advisor / lens | Core recommendation and observed evidence | Main reservation / verification |
| --- | --- | --- |
| **Systems / semantic contract (D)** | One viewport-agnostic semantic JSON. `trace.ts` already has events/groups/source; `player.js` currently creates Visits/history and merges continuations. Future MCP must provide typed nodes/edges/groups, ordered frames/source/values/navigation. | Complete JSON size, source/token parity, fake receipt certainty; nested multilingual fixture and zero extra-data-fetch test. |
| **Frontend geometry/UX (B)** | Reuse ELK Worker for **presentation only** over fully supplied topology; validate parent containment, orthogonal routes and stable IDs. Horizontal rows/vertical columns adapt using both actual canvas dimensions and measured cards. | Complex nested group crossings, long text and browser font metrics remain visually unverified; no invented routes/edges. |
| **Reliability/security/backend (A)** | Future Node/MCP alone validates continuation ancestry, receipts, mock status, source snapshots and builds complete bounded immutable JSON. Current chunk submit `8 MiB` and store `10 MiB` are not aggregate output budgets. | Aggregate size, privacy/injection, atomicity, quota and exact native provider evidence remain unverified. |
| **QA/source-player parity (E)** | Immutable indexed JSON must encode every repeated Visit, source highlight, stack/Values/console snapshot and step target before the FE receives it. | `player.js` still derives these. Test malformed links, Unicode offsets, asynchronous call/exception navigation, ANSI split, browser screenshots and native CodeGraph separately. |
| **Devil's advocate / migration (C)** | FE-first can develop an isolated fixture-driven adapter and geometry without replacing the live player while the backend producer is deferred. | A premature live cutover would force a hidden client semantic fallback. Preserve current behavior and insist on later end-to-end producer gate. |

These five reports collectively favor **Option 1 with strict migration and verification gates**. Agreement does **not** prove performance or visual correctness.

## 4. Five genuine anonymous peer reviews

Advisors were anonymized before cross-review: **A = security/backend, B = FE geometry, C = alternative/migration, D = contract, E = QA**. Independent reviewers referenced those letters, not author identities. Each completed a separate read-only review; this table records their individual findings rather than inventing a unanimous vote.

| Reviewer | Recommendation, challenged claim, and missing risk | Discriminating acceptance evidence |
| --- | --- | --- |
| **R1** | Favor D+B, informed by C migration and E tests. Challenged collapsing nested ELK branches without hiding meaningful transitions; missed stable proxy endpoint/edge identity. | Nested true/false group collapse, resize and zero viewport-triggered JSON fetch. |
| **R2** | Favor D+B+E with A/C safeguards. Challenged unproven nested ELK visual quality; identified repeated frame Values/stack snapshot memory amplification. | Deduplicated immutable snapshot references, large fixture size and latency measurements. |
| **R3** | Favor D+B with A security/C migration. Challenged phantom bypass edges under collapse; identified UTF-16 offsets drifting around CRLF/emoji. | Exact CRLF/emoji ranges, repeated same-line ordered Visits and edge-identity assertion. |
| **R4** | Favor D+B+A+E. Challenged any visual-route change that quietly fabricates a semantic edge; identified that `nodeId`, `eventId`, `frameId` need not be one-to-one. | Repeated loops/recursion and collapsed-edge set unchanged. |
| **R5** | Favor D+B+A+E with C migration. Challenged large complete frame/value exports. Identified `__proto__` filename/object dictionary keys and HTML-like labels as injection traps. | Safe `textContent` rendering, hostile keys, large value snapshots and bounded export behavior. |

**Deduplicated peer findings:** (a) graph-edge identity and visibility during group collapse; (b) aggregate immutable artifact/snapshot memory and limits; (c) source/Visit/step fidelity with Unicode and terminal formatting; (d) explicit trust/data-validation boundaries; (e) native/browser visual proof remains outstanding. Repeated concerns are design-review pressure, **not** measured benchmark results.

## 5. EDO owner-led live technical challenges and resolutions

The EDO posed three targeted objections to original advisors through their existing agent conversations. The advisors replied substantively; resolutions below were made **after** the challenge, not by tallying votes.

### Challenge 1 — Does collapsing a group create forbidden semantic edges?

**Owner question to B and D:** A nested branch group `G` contains `X`, and a supplied edge `eXZ` connects `X` to outside `Z`. If `G` collapses, how can the FE draw this connection through a group port without creating a fictitious `G → Z`, losing certainty/direction or crossing into another arm? Name necessary JSON fields and a counterexample fixture.

- **B (geometry) rebuttal:** Draw `eXZ` from a **visual proxy port** on `G` but retain immutable `edgeId`, original `sourceNodeId=X`, `targetNodeId=Z`, kind, direction, label and certainty in model/ARIA/inspector. Two hidden endpoints inside the same collapsed group suppress their internal line; distinct true/false edges remain distinct. Require explicit per-frame/per-Visit visibility metadata such as `activeEdgeIds`. **Concession:** Bare nodes/edges/groups without visit visibility are insufficient; remain expanded or show an unresolved warning rather than infer.
- **D (contract) rebuttal:** JSON must include immutable typed endpoints, parent group ancestry, frame/visit-active relationship IDs and stable distinct frame/event/node IDs. A collapsed shell can highlight the hidden active node while edge identity stays unchanged. No synthetic bypass.
- **EDO resolution — ACCEPT WITH GUARD:** FE may relocate **drawing anchors only**. It must not add, remove, merge or retag semantic edge IDs. Proposed acceptance: nested true/false route fixture, collapse/expand and select different Visits; assert rendered semantic edges are a subset of the exact supplied active edges and retain original identities. Missing membership/visibility metadata blocks smart proxy routing.

### Challenge 2 — Can one immutable artifact be complete under real resource limits?

**Owner question to A and C:** Existing per-chunk `8 MiB` submit and `10 MiB` session limits do not bound 100s of chunks or metadata-heavy ancestry. How can the future MCP compile **one** JSON, keep continuation/source/group integrity and reject too-large data without frontend pagination or silent omission?

- **A (security) rebuttal:** Treat complete artifact size, heap, time and concurrency as **separate measured budgets**; validate source/project/CodeGraph evidence and all cross-IDs at a fixed trace revision. Stage output, verify length/hash and atomically publish only an integral artifact; isolate source privacy and reject hostile payloads. **Concession:** Current numeric chunk limits do not establish safe aggregate numbers.
- **C (alternative) rebuttal:** Server walks a fixed revisioned continuation chain, rejects cycles/missing/conflicting ancestry, deduplicates canonical group definitions, prepares full source/frames/values/console including normalized split ANSI, and checks empirically chosen byte/heap/time quotas before atomic commit. Provider-known incomplete analysis may produce a **complete JSON of an explicitly partial animation** (`completeness: 'partial'` with unresolved markers); corruption, missing chunks or an indivisible over-budget artifact must return typed `ARTIFACT_UNAVAILABLE` / `ARTIFACT_TOO_LARGE` errors. **Concession:** Arbitrarily large complete playback cannot be promised with finite memory and transport; client paging would require a new owner decision.
- **EDO resolution — ACCEPT WITH FUTURE VALIDATION GATE:** No guessed numeric aggregate ceiling and no arbitrary global node-count cutoff. Quotas must be configurable, measured on representative payloads, checked atomically and documented. Neither frontend continuation assembly nor viewport JSON regeneration is an allowed fallback.

### Challenge 3 — Can source, Visits, Values and playback remain correct without FE data logic?

**Owner question to E and D:** Preserve exact CRLF source, prepared half-open UTF-16 tokens, repeated same-line Visits, source ±2 lines, zero-based internal cursor/one-based display, stack/Values/console snapshots, split ANSI and Into/Over/Out. How can the FE merely select precomputed JSON instead of running its existing replay/tokenizer/continuation engine?

- **D (contract) rebuttal:** Supply immutable `timeline.frameOrder` and `framesById`; `frameId`, `eventId` and `nodeId` are distinct ID domains. Each frame has explicit selected source/node/edge/Visit and navigation targets; `sourceVisits` index ordered frame IDs; source files keep exact text, UTF-16 `lineStartOffsets` and token spans; stack/value/object/console snapshots are indexed immutable dictionaries. Server normalizes terminal ANSI across original chunk boundaries. Cursor `0` means no active event; frame display starts at step `1`.
- **E (QA) rebuttal:** Future MCP must precompute per-frame active node/group/source window (±2 lines), immutable source, Visits, stack/locals/objects/values/console references, and previous/next/into/over/out targets. FE only indexes/selects/renders. Negative tests: invalid UTF-16 surrogate/token bounds; unordered or missing repeated Visits; dangling frame/source/snapshot/nav refs; split ANSI escape across chunk boundaries; incorrect async/exception step targets. **Concession:** Backend output and real end-to-end parity are currently **UNVERIFIED**.
- **EDO resolution — ACCEPT AS SPECIFICATION, NOT VERIFIED SOFTWARE:** Document exact source and interaction contract, including Unicode/line endings and deduplicated snapshot references. Fixture-level tests are only FE-contract checks; source/playback **100% parity** is an acceptance gate at future server cutover, not an achieved result.

## 6. Final decision, dissent and delivery gates

**EDO recommendation:** **Option 1** is the smallest design that satisfies the corrected user boundary. The provisional preference remains, but peer reviews and live rebuttals added non-negotiable edge-visibility, atomic output-budget and source-token/frame-index requirements. The frontend is a **presentation compiler**, not a language analyzer or simulator. User-controlled orientation, zoom/pan, group expansion and playback selection stay local and cannot trigger new semantic JSON generation. Visual geometry may reroute existing edges but cannot invent control flow.

**Remaining dissent / material unknowns:**

1. A single JSON may be large; aggregate output byte/heap/time/concurrency limits and compressed/deduplicated snapshot behavior need **future measured** verification. Existing per-chunk limits are not proof.
2. Complex ELK group crossings, visual node separation, labels, fonts, adaptive layout at actual desktop sizes and the owner's subjective visual acceptance remain **UNVERIFIED**. Zoom does not cure overlap; its range may be broad but must respect finite numerical/rendering safety.
3. Existing source panel, source highlighting/Visits/Values/stack/console/step navigation parity is **UNVERIFIED** for V3 because the future MCP JSON producer does not yet exist.
4. Native CodeGraph-to-mock V3 generation in TS/JS, Java, Kotlin, Python and other provider-supported languages, security and actual browser/CI/package checks remain **UNVERIFIED**; synthetic fixtures are not provider evidence.
5. Security/privacy: exact source and values in a self-contained artifact require controlled localhost access, bounded string/source handling, safe `textContent` rendering, prototype-safe dictionaries and no accidental exposure of private source. These controls are proposed, not security certification.

**Reversibility:** Future FE-only fixture adapter must be isolated from live player; no V3 cutover before server materializes and validates the same contract. If the visual algorithm fails, preserve the original explicit graph IDs and show a layout error/last valid scene; never silently replace it with guessed edges. Browser/server migration and removal of unused legacy scanners are separate future tasks requiring approval.

**Acceptance/dependencies:**

- **NOW, DOCS ONLY:** CA022–CA027 produce architecture, single-JSON schema, FE graph-design guardrails, deferred MCP architecture, phased implementation plan, independent review and verified per-task GitHub docs commits. These drafts remain **PROPOSED** until the owner's design/plan sign-offs.
- **LATER FE-first, NOT AUTHORIZED:** CA028–CA030 can be fixture-only geometry/rendering after separate approvals. CA031 full player/data cutover remains **BLOCKED** until real backend JSON is implemented; CA032 desktop/browser/owner visual QA must distinguish synthetic and native evidence.
- **LATER BACKEND, FUTURE/DEFERRED:** CA033–CA037 produce CodeGraph evidence graph contracts, server-owned frames/continuations/artifact, producer instructions and native multilingual tests only after future owner authorization. CA038 integration and CA039 cleanup require their own gates; no automatic deletion of old files/task ledgers.
- **Prior state preserved:** CA014 is partial; CA016 has a remotely pushed geometry partial implementation but desktop visual approval is pending; CA020 validator fix DONE; CA021 builder P1 fix is independently reviewed but **not committed/pushed**; CA019 producer docs have **uncommitted draft work**. Existing dirty legacy ledger, README/architecture/skill/tool-contract and builder/test files are outside all new V3 docs file locks. Nothing in this Council upgrades those statuses.

**Required human decisions:** BA must present the actual V3 design documents for an explicit DESIGN approval, then the implementation plan for a **separate PLAN approval**. Any later FE implementation needs explicit authorization and a new relevant Council/ledger gate; MCP backend remains deferred until specifically authorized. **No merge, publish, tag, deploy, release, automatic cleanup, or product-code implementation is permitted by this record.**

**First action after this verdict:** Independently review the V3 docs for strict field/ID/behavior consistency. PM may then commit and push each reviewed documentation task through the GitHub plugin and verify exact remote refs. BA presents the deliverables and asks the owner for the appropriate next approval; this Council does not speak to the owner directly.
