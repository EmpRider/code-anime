# Code Anime V3 — proposed single-document semantic scene contract

> **CA023 design specification, not a shipped API.** V3 architecture: [architecture.md](architecture.md). Implementation requires separate design, plan, and coding approvals. The MCP producer/compiler is **FUTURE / DEFERRED**; synthetic FE fixtures are not CodeGraph-provider evidence.

## 1. Contract guarantee

A `FlowSceneDocument` is **one immutable, versioned, viewport-agnostic JSON artifact per prepared animation**. The future MCP/Node side emits it **only after** validating and combining its own mock operations and continuation sessions. One successful document contains all semantically relevant node/edge/group definitions, full prepared source snapshots and display tokens, ordered playback frames, complete referenced Values/stack/object/console snapshots, Visit targets and explicit evidence/uncertainty diagnostics. A scenario can be labeled `complete:false` when static evidence or the simulated path is incomplete; that is **not** permission to omit fields or return half a continuation.

The browser must be able to perform every visual redraw, playback step, Follow/Visit navigation, chart group-collapse display, orientation change and zoom action using **only that JSON and local UI geometry state**. It may calculate visual node sizes/positions, canvas fit, ports, edge routes and paint styles. It must not infer missing control flow, source semantics, branch choices, stack/value updates or continuation membership. **No viewport-triggered server fetch. No stored server-computed geometry.**

This is a proposed _wire contract_, not the shape returned by the current `/api/flow/:id` endpoint.

## 2. Top-level object

All fields below are **required** unless marked optional. Array ordering is significant only where stated. `Id` denotes a non-empty stable string, preferably canonical namespaced IDs (`node:…`, `edge:…`, `group:…`, `event:…`, `frame:…`, `file:…`, `value:…`) assigned by the future server. Stable IDs must not be derived from frontend coordinates, branch-label text or viewport dimensions.

| Field           | Type               | Meaning / strict invariant                                                                                                                                   |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schemaVersion` | literal `"3.0.0"`  | Unsupported **major** contract version is rejected; no guesswork from browser heuristics. Future optional extension policy requires its own schema revision. |
| `artifact`      | `ArtifactIdentity` | Immutable artifact ID, session ID, immutable revision, source hash, created timestamp and producer identity; no viewport.                                    |
| `scenario`      | `Scenario`         | Chosen entry point, description, and explicitly simulated input label; no target-code execution.                                                             |
| `provenance`    | `Provenance`       | `provider:"codegraph"`, `simulationMode:"ai-mock"`, receipt references, source/relationship coverage, evidence gaps.                                         |
| `status`        | `ArtifactStatus`   | `complete`, `truncated`, `coverage.status`, reasons, warnings; distinguish valid incomplete analysis from structurally invalid artifact.                     |
| `graph`         | `SemanticGraph`    | Typed `nodes[]`, `edges[]`, `groups[]`; exact relationships, semantic kind, call/task and group ownership, certainty.                                        |
| `source`        | `SourceCatalog`    | Exact decoded source text and server-prepared syntax token spans for displayed files; generated-source provenance optional.                                  |
| `playback`      | `Playback`         | Initial display state, ordered frames, Visit targets, value/stack/console/invocation lookup tables; no browser event replay needed.                          |

### `ArtifactIdentity`, `Scenario`, `Provenance`, `ArtifactStatus`

| Field                                                                    | Type                                                              | Requirements                                                                                                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `artifact.id`, `artifact.sessionId`, `artifact.revision`                 | `Id`                                                              | Non-empty and stable for the lifetime of this materialized document. A new semantic content revision is a **different artifact**, never a viewport variant. |
| `artifact.createdAt`                                                     | UTC ISO-8601 string                                               | Generation instant; useful for expiry and audit, not proof of execution.                                                                                    |
| `artifact.sourceHash`                                                    | non-empty digest string                                           | Hash of the validated source snapshot/project preparation; compare entire continuation ancestry.                                                            |
| `artifact.producer`                                                      | literal `"code-anime-mcp"`                                        | Future producer identity, not presently returned.                                                                                                           |
| `scenario.entrypoint`, `scenario.description`, `scenario.mockInputLabel` | string                                                            | Display-safe strings; never contain commands for the browser to execute.                                                                                    |
| `provenance.provider`, `provenance.simulationMode`                       | literals `"codegraph"`, `"ai-mock"`                               | CodeGraph is the sole language semantic evidence provider; host AI supplies explicitly simulated choices and values.                                        |
| `provenance.receipts[]`                                                  | `{id:Id,tool:string,queryDigest:string,providerBoundary?:string}` | These represent inspected static evidence retrieval. Raw receipt contents may be too large/sensitive for UI export; preserve IDs and meaningful bounds.     |
| `status.complete`, `status.truncated`                                    | boolean                                                           | `complete` concerns the **declared mock scenario**; `truncated` records a resource/provider boundary. Neither proves exhaustive real program behavior.      |
| `status.coverage`                                                        | `{status, reasons[]}`                                             | `status` enum: `unknown`, `partial`, `unresolved`, `provider-truncated`; never `verified-runtime`.                                                          |
| `status.warnings[]`, `status.diagnostics[]`                              | string[]                                                          | Specific limitations; invalid structural references are rejected instead of demoted to warnings.                                                            |

## 3. Graph — meaning supplied, geometry omitted

### Nodes

| Field              | Type                    | Requirements                                                                                                                                                                                                                                   |
| ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `Id`                    | Unique node identity. A visual node may stand for multiple mock events.                                                                                                                                                                        |
| `kind`             | enum                    | `entry`, `statement`, `decision`, `branch`, `loop`, `iteration`, `try`, `catch`, `finally`, `switch`, `case`, `lambda`, `call`, `return`, `throw`, `await`, `yield`, `console`, `unresolved`. New kinds require a versioned contract decision. |
| `label`            | string                  | Exact user-facing text supplied by producer; frontend must not build it by interpreting source code.                                                                                                                                           |
| `eventIds[]`       | `Id[]`                  | Globally unique event IDs associated with this node; each referenced playback event ID maps to **one** node. Loops can revisit the same node using different event IDs/frames.                                                                 |
| `order`            | non-negative integer    | Stable semantic ordering provided by producer; orientation does **not** change it.                                                                                                                                                             |
| `callId`, `taskId` | `Id`                    | Explicit invocation/task ownership.                                                                                                                                                                                                            |
| `groupPathIds[]`   | `Id[]`                  | **Explicit outer→inner** semantic group ancestry; not inferred from source indentation/braces or edge routes. Empty for an ungrouped node.                                                                                                     |
| `sourceRef`        | `SourceRange` or `null` | Known original-source location, or explicit `null` with unresolved explanation.                                                                                                                                                                |
| `certainty`        | enum                    | `static`, `mock`, `assumed`, `unresolved`, `proposed`; `static` is source/relationship evidence, **never an observed runtime value**.                                                                                                          |
| `evidenceIds[]`    | `Id[]`                  | Must reference known `provenance.receipts`. Empty is valid for an honestly labeled mock assumption.                                                                                                                                            |
| `note`             | string or `null`        | Why an unknown/assumed node exists and what coverage is missing.                                                                                                                                                                               |

### Edges

| Field                          | Type                                    | Requirements                                                                                                                                                           |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `fromNodeId`, `toNodeId` | `Id`                                    | Edge identity and exact existing endpoint nodes. **Frontend cannot invent endpoints.** Parallel edges are permitted when their IDs and meanings differ.                |
| `kind`                         | enum                                    | `sequence`, `branch-true`, `branch-false`, `case`, `loop-body`, `loop-back`, `loop-exit`, `exception`, `finally`, `call`, `return`, `await`, `resume`, `unresolved`.   |
| `label`                        | string                                  | Explicit predicate, case value, iteration or exception label from producer; FE routes/places text only.                                                                |
| `certainty`, `evidenceIds[]`   | same as node                            | Never treat CodeGraph receipt as an observed branch choice.                                                                                                            |
| `executionStatus`              | enum                                    | `simulated-taken`, `alternative`, `unresolved`; graph may show alternative branches, but frame-active edges are explicit and do not imply an unexecuted arm was taken. |
| `callTransition`               | `{fromCallId:Id,toCallId:Id}` or `null` | Required on `call`/`return` edges crossing invocation scopes; unrelated cross-call control edges are rejected.                                                         |

The FE may compute orthogonal polyline segments, visual ports, collision-free labels, and collapsed-group visual proxies **for these existing edges**. A proxy must carry `underlyingEdgeIds[]`; it may hide a route temporarily but cannot change `fromNodeId`, `toNodeId`, kind, certainty, or simulation status. `playback.frames[].activeEdgeIds` remains authoritative even when a proxy is painted.

### Groups

| Field                                     | Type                             | Requirements                                                                                                                               |
| ----------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`, `kind`, `label`                     | `Id`, enum, string               | `kind`: `decision`, `branch`, `loop`, `iteration`, `try`, `catch`, `finally`, `switch`, `case`, `lambda`, `sequence`, `unresolved`.        |
| `parentGroupId`                           | `Id` or `null`                   | Parent must exist; graph must be **acyclic**; parent/call/task consistency validated server-side.                                          |
| `memberNodeIds[]`                         | `Id[]`                           | **Direct** member nodes of this group, without inferred indirect descendants. A group with nested child groups can have zero direct nodes. |
| `order`                                   | non-negative integer             | Producer-supplied stable visual ordering hint, not a browser-computed control-flow order.                                                  |
| `callId`, `taskId`                        | `Id`                             | Same invocation/task as direct members and nested groups.                                                                                  |
| `arm`                                     | `{id:Id,label:string}` or `null` | Only `branch` and `case` groups may have an arm; never infer an arm from node text.                                                        |
| `iteration`                               | positive integer or `null`       | Required only for `iteration` groups; optional repetition is explicit per mock scenario.                                                   |
| `sourceRef`, `certainty`, `evidenceIds[]` | as above                         | Static/group header source may not cover the entire body; no implicit line-range membership.                                               |

**Consistency rule:** A node's `groupPathIds` must exactly identify the outer→inner parent chain; its **last** group must include that node in `memberNodeIds`. If path is empty, no group may directly claim the node. Parent groups may own child groups without listing every descendant node. Sibling branch/case arms cannot claim the same direct event/node membership. All group paths and arm/iteration ownership are supplied by MCP, not derived by FE.

## 4. Source — exact text and UI syntax tokens

`source.files[]` contains `{id:Id,path:string,text:string,languageHint:string|null,tokenSpans:TokenSpan[]}`. It may contain arbitrary legal file names, including `__proto__`; **never** use an untrusted filename as a prototype-bearing object property. A `SourceRange` is `{fileId:Id,line:positiveInt,endLine:positiveInt,generated?:{fileId:Id,line:positiveInt}}` with inclusive **1-based** lines. Missing original source must be explicit unresolved data; the FE may show a provided snippet only when a separate display field is supplied, never silently pretend it is the file.

`TokenSpan` is `{startUtf16:nonnegativeInt,endUtf16:positiveInt,kind:TokenKind}` where `TokenKind` is a bounded server-approved display type (`keyword`, `identifier`, `type`, `function`, `string`, `number`, `comment`, `operator`, `punctuation`, `other`). Offsets are half-open **`[startUtf16,endUtf16)` UTF-16 code units** into the **exact decoded** `text` string, matching browser text slicing; spans must be in range, non-overlapping for the single semantic syntax-color layer, and must not bisect a surrogate pair. Preserve original `CRLF`/`LF`/mixed line separators, Unicode and indentation in `text`; do not normalize on the client or silently adjust source line ranges. A future producer should keep the exact original source bytes or trusted decode metadata outside the semantic JSON if byte-level file identity matters; JSON escaping is not raw original-file-byte identity.

Syntax display tokenization **is not semantic language analysis**: it cannot introduce graph relationships or values. It is a future MCP-side UI display preparation concern with native cross-language verification still pending. The browser only colors received spans and highlights received active source ranges; it may virtualize long files and show the current ±2 source context or manual scroll window using local view state.

## 5. Playback — every derived value precomputed

| Field                                            | Type                                                                             | Meaning and invariants                                                                                                                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `playback.initial`                               | `{valueSnapshotId,stackSnapshotId,consoleThrough}`                               | Before-first state; browser cursor **0** shows this prepared state instead of replaying any event.                                                                                                                         |
| `playback.frames[]`                              | `Frame[]`                                                                        | Complete chronological mock scenario sequence; `step` strictly `1..N` with no gap, frame array index is `step-1`, and frame IDs remain stable. No arbitrary global step-count cutoff, but explicit resource budgets apply. |
| `frame.id`, `frame.eventId`, `frame.step`        | `Id`, `Id`, positive integer                                                     | `eventId` must map to exactly one `graph.nodes[].eventIds`; repeated group/loop node visits can have different event IDs.                                                                                                  |
| `frame.activeNodeIds[]`, `frame.activeEdgeIds[]` | `Id[]`                                                                           | Exact highlighted source/flow path, supplied by server; FE only highlights or maps visual proxies.                                                                                                                         |
| `frame.callId`, `frame.taskId`                   | `Id`                                                                             | Selected invocation/task, supplied by server, not inferred from stack labels.                                                                                                                                              |
| `frame.sourceRef`                                | `SourceRange` or `null`                                                          | Exact active source file and line range for the step; current source text remains unchanged.                                                                                                                               |
| `frame.valueSnapshotId`, `frame.stackSnapshotId` | `Id`                                                                             | Full prepared snapshots, not patches for browser to replay or merge.                                                                                                                                                       |
| `frame.consoleThrough`                           | non-negative integer                                                             | Count of prepared console entries visible through this step; monotonic and bounded by console array length.                                                                                                                |
| `playback.valueSnapshots[]`                      | `{id:Id, variables:PlainJsonObject, objects:PlainJsonObject, result?:JsonValue}` | Complete inspectable mock Values/object state. No frontend assignment simulation or inherited-key loss.                                                                                                                    |
| `playback.stackSnapshots[]`                      | `{id:Id,frames:{callId:Id,label:string}[]}`                                      | Complete active invocation display stack per snapshot.                                                                                                                                                                     |
| `playback.consoleEntries[]`                      | `{id:Id,text:string,certainty,sourceStep:positiveInt}`                           | Terminal-display strings pre-normalized **across continuation boundaries**, including split ANSI sequences. Escaped as text, not HTML.                                                                                     |
| `playback.sourceVisits[]`                        | `{fileId:Id,line:positiveInt,callId:Id                                           | null,stepIds:positiveInt[]}`                                                                                                                                                                                               | Visit targets sorted by chronological step; **repeated visits retained** for loops or concurrent tasks. No source-line-order inference. |
| `playback.invocations[]`                         | `{callId:Id,symbolId:Id,parentCallId:Id                                          | null,entryStep:positiveInt,stepIds:positiveInt[]}`                                                                                                                                                                         | Explicit call navigation, Step Into/Over/Out selection and source Follow hints; cross-task relationships precomputed.                   |

The future producer must support currently visible Follow/unfollow/pinned call, repeated Visit prev/next, current source-line, source window paging, Values/object details, console playback, stack, keyboard step controls and baseline source comparison without client event semantic reconstruction. If an existing behavior requires a missing index or field, **extend and version this contract before live cutover**, rather than quietly weakening the UI. UI timers, cursor movement, keyboard focus, manual source scroll and visual collapse are local _presentation state_ and permitted. Branch truth, source line anchoring, grouping, values and call ownership are not.

## 6. Representative semantic constructs and a small fixture

The following mappings are **language-neutral metadata**, not source-code parsing rules. Java, Kotlin, JS, TypeScript, Python, C# or future languages can emit the same categories only when CodeGraph evidence plus host mock supplies explicit relationships.

| Construct in source           | Explicit producer graph/group fact                                                                                        | FE rendering only                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `if / else-if / else`         | `decision` parent; sibling `branch` group arms with exact edge kind `branch-true` / `branch-false`, certainty per arm.    | Decision diamond/pill with nested arm lanes and distinctly labeled connectors.              |
| `for / while / do`            | `loop` group, optional `iteration` instances, exact `loop-body`, `loop-back`, `loop-exit` edges and repeated mock frames. | Bounded loop group, compact iteration rails, visible back-edge; no source keyword matching. |
| `try / catch / finally`       | Explicit `try`, `catch`, `finally` groups; `exception`/`finally` edges; unresolved missing handler if needed.             | Separated exception lanes and truthful exception labels.                                    |
| `switch / when / match`       | `switch` group plus explicit `case` arms, literal case labels and branch status.                                          | Clean case grouping and correct fan-out, independent of source-language keyword.            |
| `lambda / closure / callback` | Explicit `lambda` group, call ownership, and declared `call`/`return` edges when simulated.                               | Distinct function shape/boundary; never infer body or capture values.                       |

### Illustrative valid JSON shape

This small, **synthetic** sample includes a nested loop → decision → lambda, switch/case and try/catch. It is **not** a real CodeGraph result, native multilingual test, or current MCP output. Source text is deliberately short; its `tokenSpans` is empty to illustrate the schema (full syntax-color parity needs a populated server token list in production). A mock path contains one loop-body step followed by a loop-exit and caught error; alternatives are clearly marked.

```json
{
  "schemaVersion": "3.0.0",
  "artifact": {
    "id": "artifact:demo",
    "sessionId": "session:demo",
    "revision": "rev:1",
    "createdAt": "2026-10-29T00:00:00Z",
    "sourceHash": "synthetic-fixture-only",
    "producer": "code-anime-mcp"
  },
  "scenario": {
    "entrypoint": "demo",
    "description": "Synthetic nested flow",
    "mockInputLabel": "one item"
  },
  "provenance": {
    "provider": "codegraph",
    "simulationMode": "ai-mock",
    "receipts": []
  },
  "status": {
    "complete": false,
    "truncated": false,
    "coverage": {
      "status": "unresolved",
      "reasons": ["Synthetic fixture; no native CodeGraph receipt"]
    },
    "warnings": ["All outcomes and values are illustrative mock data"],
    "diagnostics": []
  },
  "graph": {
    "nodes": [
      {
        "id": "node:entry",
        "kind": "entry",
        "label": "demo",
        "eventIds": ["event:1"],
        "order": 0,
        "callId": "call:main",
        "taskId": "task:main",
        "groupPathIds": [],
        "sourceRef": { "fileId": "file:demo", "line": 1, "endLine": 1 },
        "certainty": "mock",
        "evidenceIds": [],
        "note": null
      },
      {
        "id": "node:loop",
        "kind": "loop",
        "label": "for each item",
        "eventIds": ["event:2"],
        "order": 1,
        "callId": "call:main",
        "taskId": "task:main",
        "groupPathIds": ["group:loop"],
        "sourceRef": { "fileId": "file:demo", "line": 2, "endLine": 2 },
        "certainty": "mock",
        "evidenceIds": [],
        "note": null
      },
      {
        "id": "node:if",
        "kind": "decision",
        "label": "if ready",
        "eventIds": ["event:3"],
        "order": 2,
        "callId": "call:main",
        "taskId": "task:main",
        "groupPathIds": ["group:loop", "group:iteration", "group:decision"],
        "sourceRef": { "fileId": "file:demo", "line": 3, "endLine": 3 },
        "certainty": "mock",
        "evidenceIds": [],
        "note": null
      },
      {
        "id": "node:lambda",
        "kind": "lambda",
        "label": "apply value",
        "eventIds": ["event:4"],
        "order": 3,
        "callId": "call:main",
        "taskId": "task:main",
        "groupPathIds": [
          "group:loop",
          "group:iteration",
          "group:decision",
          "group:branch",
          "group:lambda"
        ],
        "sourceRef": { "fileId": "file:demo", "line": 4, "endLine": 4 },
        "certainty": "mock",
        "evidenceIds": [],
        "note": null
      },
      {
        "id": "node:switch",
        "kind": "switch",
        "label": "switch kind",
        "eventIds": ["event:5"],
        "order": 4,
        "callId": "call:main",
        "taskId": "task:main",
        "groupPathIds": ["group:loop", "group:iteration", "group:switch"],
        "sourceRef": { "fileId": "file:demo", "line": 5, "endLine": 5 },
        "certainty": "mock",
        "evidenceIds": [],
        "note": null
      },
      {
        "id": "node:case",
        "kind": "case",
        "label": "case A",
        "eventIds": ["event:6"],
        "order": 5,
        "callId": "call:main",
        "taskId": "task:main",
        "groupPathIds": [
          "group:loop",
          "group:iteration",
          "group:switch",
          "group:case"
        ],
        "sourceRef": { "fileId": "file:demo", "line": 6, "endLine": 6 },
        "certainty": "mock",
        "evidenceIds": [],
        "note": null
      },
      {
        "id": "node:try",
        "kind": "try",
        "label": "fallback",
        "eventIds": ["event:7"],
        "order": 6,
        "callId": "call:main",
        "taskId": "task:main",
        "groupPathIds": ["group:try"],
        "sourceRef": { "fileId": "file:demo", "line": 7, "endLine": 7 },
        "certainty": "mock",
        "evidenceIds": [],
        "note": null
      },
      {
        "id": "node:catch",
        "kind": "catch",
        "label": "handle error",
        "eventIds": ["event:8"],
        "order": 7,
        "callId": "call:main",
        "taskId": "task:main",
        "groupPathIds": ["group:try", "group:catch"],
        "sourceRef": { "fileId": "file:demo", "line": 8, "endLine": 8 },
        "certainty": "mock",
        "evidenceIds": [],
        "note": null
      }
    ],
    "edges": [
      {
        "id": "edge:1",
        "fromNodeId": "node:entry",
        "toNodeId": "node:loop",
        "kind": "sequence",
        "label": "next",
        "certainty": "mock",
        "evidenceIds": [],
        "executionStatus": "simulated-taken",
        "callTransition": null
      },
      {
        "id": "edge:2",
        "fromNodeId": "node:loop",
        "toNodeId": "node:if",
        "kind": "loop-body",
        "label": "iteration 1",
        "certainty": "mock",
        "evidenceIds": [],
        "executionStatus": "simulated-taken",
        "callTransition": null
      },
      {
        "id": "edge:3",
        "fromNodeId": "node:if",
        "toNodeId": "node:lambda",
        "kind": "branch-true",
        "label": "ready",
        "certainty": "mock",
        "evidenceIds": [],
        "executionStatus": "simulated-taken",
        "callTransition": null
      },
      {
        "id": "edge:4",
        "fromNodeId": "node:if",
        "toNodeId": "node:loop",
        "kind": "branch-false",
        "label": "not ready",
        "certainty": "unresolved",
        "evidenceIds": [],
        "executionStatus": "unresolved",
        "callTransition": null
      },
      {
        "id": "edge:5",
        "fromNodeId": "node:lambda",
        "toNodeId": "node:switch",
        "kind": "sequence",
        "label": "next",
        "certainty": "mock",
        "evidenceIds": [],
        "executionStatus": "simulated-taken",
        "callTransition": null
      },
      {
        "id": "edge:6",
        "fromNodeId": "node:switch",
        "toNodeId": "node:case",
        "kind": "case",
        "label": "A",
        "certainty": "mock",
        "evidenceIds": [],
        "executionStatus": "simulated-taken",
        "callTransition": null
      },
      {
        "id": "edge:7",
        "fromNodeId": "node:case",
        "toNodeId": "node:loop",
        "kind": "loop-back",
        "label": "next item",
        "certainty": "mock",
        "evidenceIds": [],
        "executionStatus": "alternative",
        "callTransition": null
      },
      {
        "id": "edge:8",
        "fromNodeId": "node:loop",
        "toNodeId": "node:try",
        "kind": "loop-exit",
        "label": "end",
        "certainty": "mock",
        "evidenceIds": [],
        "executionStatus": "simulated-taken",
        "callTransition": null
      },
      {
        "id": "edge:9",
        "fromNodeId": "node:try",
        "toNodeId": "node:catch",
        "kind": "exception",
        "label": "mock throw",
        "certainty": "mock",
        "evidenceIds": [],
        "executionStatus": "simulated-taken",
        "callTransition": null
      }
    ],
    "groups": [
      {
        "id": "group:loop",
        "kind": "loop",
        "label": "for each item",
        "parentGroupId": null,
        "memberNodeIds": ["node:loop"],
        "order": 0,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": null,
        "iteration": null,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      },
      {
        "id": "group:iteration",
        "kind": "iteration",
        "label": "iteration 1",
        "parentGroupId": "group:loop",
        "memberNodeIds": [],
        "order": 1,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": null,
        "iteration": 1,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      },
      {
        "id": "group:decision",
        "kind": "decision",
        "label": "ready?",
        "parentGroupId": "group:iteration",
        "memberNodeIds": ["node:if"],
        "order": 2,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": null,
        "iteration": null,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      },
      {
        "id": "group:branch",
        "kind": "branch",
        "label": "ready",
        "parentGroupId": "group:decision",
        "memberNodeIds": [],
        "order": 3,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": { "id": "arm:true", "label": "true" },
        "iteration": null,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      },
      {
        "id": "group:lambda",
        "kind": "lambda",
        "label": "apply",
        "parentGroupId": "group:branch",
        "memberNodeIds": ["node:lambda"],
        "order": 4,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": null,
        "iteration": null,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      },
      {
        "id": "group:switch",
        "kind": "switch",
        "label": "kind",
        "parentGroupId": "group:iteration",
        "memberNodeIds": ["node:switch"],
        "order": 5,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": null,
        "iteration": null,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      },
      {
        "id": "group:case",
        "kind": "case",
        "label": "A",
        "parentGroupId": "group:switch",
        "memberNodeIds": ["node:case"],
        "order": 6,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": { "id": "arm:A", "label": "A" },
        "iteration": null,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      },
      {
        "id": "group:try",
        "kind": "try",
        "label": "fallback",
        "parentGroupId": null,
        "memberNodeIds": ["node:try"],
        "order": 7,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": null,
        "iteration": null,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      },
      {
        "id": "group:catch",
        "kind": "catch",
        "label": "caught error",
        "parentGroupId": "group:try",
        "memberNodeIds": ["node:catch"],
        "order": 8,
        "callId": "call:main",
        "taskId": "task:main",
        "arm": null,
        "iteration": null,
        "sourceRef": null,
        "certainty": "mock",
        "evidenceIds": []
      }
    ]
  },
  "source": {
    "files": [
      {
        "id": "file:demo",
        "path": "demo.pseudo",
        "text": "function demo() {\n  for each item\n  if ready\n  lambda apply\n  switch kind\n  case A\n  try fallback\n  catch error\n}\n",
        "languageHint": null,
        "tokenSpans": []
      }
    ]
  },
  "playback": {
    "initial": {
      "valueSnapshotId": "value:empty",
      "stackSnapshotId": "stack:empty",
      "consoleThrough": 0
    },
    "frames": [
      {
        "id": "frame:1",
        "eventId": "event:1",
        "step": 1,
        "activeNodeIds": ["node:entry"],
        "activeEdgeIds": [],
        "callId": "call:main",
        "taskId": "task:main",
        "sourceRef": { "fileId": "file:demo", "line": 1, "endLine": 1 },
        "valueSnapshotId": "value:empty",
        "stackSnapshotId": "stack:main",
        "consoleThrough": 0
      },
      {
        "id": "frame:2",
        "eventId": "event:2",
        "step": 2,
        "activeNodeIds": ["node:loop"],
        "activeEdgeIds": ["edge:1"],
        "callId": "call:main",
        "taskId": "task:main",
        "sourceRef": { "fileId": "file:demo", "line": 2, "endLine": 2 },
        "valueSnapshotId": "value:one",
        "stackSnapshotId": "stack:main",
        "consoleThrough": 0
      },
      {
        "id": "frame:3",
        "eventId": "event:3",
        "step": 3,
        "activeNodeIds": ["node:if"],
        "activeEdgeIds": ["edge:2"],
        "callId": "call:main",
        "taskId": "task:main",
        "sourceRef": { "fileId": "file:demo", "line": 3, "endLine": 3 },
        "valueSnapshotId": "value:one",
        "stackSnapshotId": "stack:main",
        "consoleThrough": 0
      },
      {
        "id": "frame:4",
        "eventId": "event:4",
        "step": 4,
        "activeNodeIds": ["node:lambda"],
        "activeEdgeIds": ["edge:3"],
        "callId": "call:main",
        "taskId": "task:main",
        "sourceRef": { "fileId": "file:demo", "line": 4, "endLine": 4 },
        "valueSnapshotId": "value:one",
        "stackSnapshotId": "stack:main",
        "consoleThrough": 0
      },
      {
        "id": "frame:5",
        "eventId": "event:5",
        "step": 5,
        "activeNodeIds": ["node:switch"],
        "activeEdgeIds": ["edge:5"],
        "callId": "call:main",
        "taskId": "task:main",
        "sourceRef": { "fileId": "file:demo", "line": 5, "endLine": 5 },
        "valueSnapshotId": "value:one",
        "stackSnapshotId": "stack:main",
        "consoleThrough": 0
      },
      {
        "id": "frame:6",
        "eventId": "event:6",
        "step": 6,
        "activeNodeIds": ["node:case"],
        "activeEdgeIds": ["edge:6"],
        "callId": "call:main",
        "taskId": "task:main",
        "sourceRef": { "fileId": "file:demo", "line": 6, "endLine": 6 },
        "valueSnapshotId": "value:one",
        "stackSnapshotId": "stack:main",
        "consoleThrough": 0
      },
      {
        "id": "frame:7",
        "eventId": "event:7",
        "step": 7,
        "activeNodeIds": ["node:try"],
        "activeEdgeIds": ["edge:8"],
        "callId": "call:main",
        "taskId": "task:main",
        "sourceRef": { "fileId": "file:demo", "line": 7, "endLine": 7 },
        "valueSnapshotId": "value:one",
        "stackSnapshotId": "stack:main",
        "consoleThrough": 0
      },
      {
        "id": "frame:8",
        "eventId": "event:8",
        "step": 8,
        "activeNodeIds": ["node:catch"],
        "activeEdgeIds": ["edge:9"],
        "callId": "call:main",
        "taskId": "task:main",
        "sourceRef": { "fileId": "file:demo", "line": 8, "endLine": 8 },
        "valueSnapshotId": "value:one",
        "stackSnapshotId": "stack:main",
        "consoleThrough": 0
      }
    ],
    "valueSnapshots": [
      { "id": "value:empty", "variables": {}, "objects": {} },
      {
        "id": "value:one",
        "variables": { "item": { "ready": true, "kind": "A" } },
        "objects": {}
      }
    ],
    "stackSnapshots": [
      { "id": "stack:empty", "frames": [] },
      {
        "id": "stack:main",
        "frames": [{ "callId": "call:main", "label": "demo" }]
      }
    ],
    "consoleEntries": [],
    "sourceVisits": [
      {
        "fileId": "file:demo",
        "line": 1,
        "callId": "call:main",
        "stepIds": [1]
      },
      {
        "fileId": "file:demo",
        "line": 2,
        "callId": "call:main",
        "stepIds": [2]
      },
      {
        "fileId": "file:demo",
        "line": 3,
        "callId": "call:main",
        "stepIds": [3]
      },
      {
        "fileId": "file:demo",
        "line": 4,
        "callId": "call:main",
        "stepIds": [4]
      },
      {
        "fileId": "file:demo",
        "line": 5,
        "callId": "call:main",
        "stepIds": [5]
      },
      {
        "fileId": "file:demo",
        "line": 6,
        "callId": "call:main",
        "stepIds": [6]
      },
      {
        "fileId": "file:demo",
        "line": 7,
        "callId": "call:main",
        "stepIds": [7]
      },
      {
        "fileId": "file:demo",
        "line": 8,
        "callId": "call:main",
        "stepIds": [8]
      }
    ],
    "invocations": [
      {
        "callId": "call:main",
        "symbolId": "symbol:demo",
        "parentCallId": null,
        "entryStep": 1,
        "stepIds": [1, 2, 3, 4, 5, 6, 7, 8]
      }
    ]
  }
}
```

The sample's edge `edge:7` is an **alternative loop-back**, not an executed step. `edge:4` is explicitly unresolved and cannot be colored as confidently taken. The `edge:8` loop-exit links the prepared post-iteration try block; the graph's semantic meaning comes entirely from the JSON, not from the pseudo-source text.

## 7. Validation and error matrix

Validation is future MCP-owned on output and FE-owned **only for schema/reference rejection**. The FE must not “repair” missing semantic graph links. No implementation is authorized in this documentation phase.

| Invalid input/failure                                                                                                                | Required future handling                                                                                                           | UI result                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Duplicate node/edge/group/event/frame ID, missing node endpoint, missing source/snapshot reference                                   | Reject `INVALID_ARTIFACT` before persistence/delivery; retain last valid artifact.                                                 | Explicit error panel; no invented connection.                                         |
| Group parent cycle, call/task mismatch, contradictory nested paths, sibling arms sharing a direct node/event                         | Reject `INVALID_ARTIFACT` and identify conflicting IDs.                                                                            | Do not flatten malformed hierarchy as if it were correct.                             |
| Cross-call edge with `kind:sequence` and no valid declared transfer; branch arm without source/evidence where it is claimed `static` | Reject invalid ownership/unsupported certainty; or label genuinely unknown branch `unresolved` with diagnostics **before export**. | Do not infer call transition or arm direction.                                        |
| Frame step gap, repeated event ID, missing active edge, nonmonotonic `consoleThrough`, Visit list not matching actual frame source   | Reject inconsistent playback indexes.                                                                                              | Never silently shift source highlights or Values.                                     |
| Source token offset out of range/overlap/split surrogate, line outside immutable source, conflicting continuation source hash        | Reject/diagnose exact source consistency error; do not modify text/line numbers.                                                   | Show safe original text only if artifact valid; never reparse source to guess tokens. |
| Unread CodeGraph evidence, truncated relationships, unknown language construct                                                       | Explicit `status.coverage` and `complete:false` if scenario not complete, plus unresolved nodes/edges and reasons.                 | Display uncertainty, not invented mock success.                                       |
| Invalid JSON/version, expired session, source-root mismatch, corrupted digest                                                        | Typed `INCOMPATIBLE_VERSION` / `EXPIRED` / `SOURCE_MISMATCH` / `INVALID_ARTIFACT`, no partial scene.                               | Safe error; no browser semantic fallback.                                             |
| Materialized JSON exceeds a **future measured** aggregate budget, or producer is interrupted                                         | Atomic `ARTIFACT_TOO_LARGE` / `NOT_READY`, cleanup only authorized temporary output, preserve prior validated state.               | Explain unavailable document and retry guidance, no silent truncation.                |
| Visual worker returns stale, overlapping or out-of-bounds rectangles for otherwise valid JSON                                        | Reject **geometry only**, retain prior valid same-artifact layout with visible retry/error; no semantic mutation.                  | Preserve correct source/Visit/Values regardless of diagram error.                     |

Security constraints: names and source text are untrusted; render with `textContent`/escaped text, never executable HTML/CSS. Preserve own data keys such as `__proto__` using arrays/`Map`/null-prototype objects, and validate bounded JSON nesting and serialized sizes. A future local endpoint must check artifact/project ownership and use no-store/cache isolation; an opaque `sessionId` alone is not an authorization policy. Preserve source and mock values only within the explicitly scoped local player, and disclose privacy exposure.

## 8. Proposed verification matrix and migration gates

| Gate                         | Fixtures and assertions                                                                                                                                                                               | Timing / truth state                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Schema and security          | Unique IDs, direct/ancestor group consistency, typed edge meanings, dangling/cyclic/foreign references, `__proto__` filenames, malicious labels, Unicode/CRLF token offsets.                          | Contract design now; executable schema tests **FUTURE**.                                           |
| Multilingual semantics       | Explicit provider-supplied `if/else`, `loop`, `try/catch/finally`, `switch/when/match`, `lambda`, await/resume across JS/TS/Java/Kotlin and other CodeGraph-supported languages; no FE text scanning. | Synthetic contract fixtures only after FE authorization; **native CodeGraph provider UNVERIFIED**. |
| Playback/source parity       | Step 0 initial state; 1-based ordered frames; repeated source Visits; Follow/pinned calls; source ±2 context, long-file paging, Values/object/stack/console, split ANSI across continuations.         | Future server + FE cutover gate; **not currently verified**.                                       |
| Complete one-JSON lifecycle  | Multiple valid continuation chunks fold in server, immutable sourceHash, full graph/frame references, no frontend semantic fetch on orient/resize/seek, incomplete evidence labeled.                  | Backend CA033–CA036 **FUTURE/DEFERRED**.                                                           |
| Geometry isolation           | Same semantic IDs and execution statuses before/after horizontal/vertical layout, resize, zoom/collapse; all connectors/labels legible and valid.                                                     | FE CA028–CA032 **PLANNED/NOT AUTHORIZED**; browser screenshot and user visual review pending.      |
| Resource/security acceptance | Measure aggregate artifact bytes/time/memory, configurable abort/retry, corrupted output recovery, source privacy, localhost cross-root isolation and no runtime project execution.                   | **FUTURE**; no size/latency or native provider benchmark fabricated.                               |

**Approval gates:** CA023 design review and documentation commit do **not** approve code. The owner must separately approve the V3 design and the later implementation plan, authorize FE implementation, and **separately** authorize deferred MCP work before production cutover. No deletion of old task tracking files without the owner's explicit completion and cleanup approval.
