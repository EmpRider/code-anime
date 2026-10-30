# Code Anime V3 — FE Phase A Implementation Kickoff Engineering Council

**Date/time:** 2026-10-29 (Asia/Colombo) · **Branch:** `fix/react-layout-collapse` · **Task scope:** CA028–CA030 only · **AI Engineering Decision Owner (EDO):** actual TL `/root/pm_fe_phase_a/tl_fe_phase_a` (assumed owning Tech Lead role). **Human owner:** Anuruddha; actual owner approvals occurred in chat: `approved` for V3 DESIGN, `IMPLEMENTATION PLAN APPROVED`, and `START FE PHASE A`. No agent substitutes for further human scope/cleanup/merge/release approvals.

**Status: Kickoff council technical recommendation; no source code edited during Council.** A technical GO is conditional on the PM updating/pushing/independently verifying the remote task ledger before any code, with task-specific reviews/pushes thereafter. Explicit no CA031 live player cutover or CA033+ MCP/backend source work, no merge, deploy, npm publish, release, task-file deletion or destructive handling of seven existing dirty paths.

## 1. Pinning and evidence

Source: user-provided complete `upload/agent-team-skill(2).md`; freshly GitHub-plugin-verified mandatory upstream instruction files under `skill_pins/20261029`. Loader fetched **29/29 full required instruction/reference files** across canonical repositories, pinned their default-branch HEADs and recorded SHA-256 in `skill_pins/20261029/MANIFEST.md`.

| Repo                                 | Latest verified pinned SHA                 |
| ------------------------------------ | ------------------------------------------ |
| `obra/superpowers`                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` |
| `EmpRider/claude-skills-llm-council` | `a7565e21d5ab03551fe66e36818e05af245467b8` |
| `JuliusBrussee/caveman`              | `9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4` |
| `DietrichGebert/ponytail`            | `7801d061243d7b753bad0e0b3c057cd250b11755` |
| `ayghri/i-have-adhd`                 | `1ecea1993b7fce257ffbd686c070948b5e07eda6` |
| `alexgreensh/attention-span`         | `8a6e2250dbc1dfb1b4186e03a92484d8c799c1b0` |

Council skill root SHA-256 `6387755b0cd0f069720549c7e81d90b724433d4ff46cb127271b902939ad586d`. PM and EDO independently read complete pinned Council root; advisor specialists confirmed independent reads before peer-review. This does not certify source code or frontend screenshots.

**Read-only project evidence:** `docs/v3/architecture.md`, `flow-scene-json-contract.md`, `frontend-graph-design.md`, `implementation-plan.md`, original V3 task ledger; `public/diagram-elk-layout.js` (hierarchical width+height-aware ELK, parent/edge checks, Worker epoch); `public/diagram-control-layout.js` and `public/semantic-flow-model.js` (legacy semantic inference); `public/diagram.js:540–544` (live layout caller omits viewport) and `:1101–1108` (live geometry cache keys width only); `public/player.js` (client replay/Values/source/continuations; live cutover excluded). QA ran focused existing `node --test` for `tests/diagram-elk-layout.test.mjs`, `tests/diagram-label-placement.test.mjs`, and `tests/diagram-routing.test.mjs`, each PASS; these legacy tests are **not V3 fixture or browser/native proof**. Seven pre-existing dirty paths: old ledger, README, docs/architecture, code-anime skill SKILL.md + tool-contract.md, animation-builder.ts + builder.test.ts; untouched.

## 2. Neutral decision brief and EDO provisional position

**Decision:** How to execute exactly owner-approved CA028–CA030 while preserving a **single immutable, complete semantic V3 JSON per prepared animation** (the future server product), FE-only presentation geometry, all supplied node/edge/group identities and uncertainty, distinct ready/unavailable baseline variants, clean 2D group-aware layout, and all current desktop source/Visit/Values/player behavior?

**Options:** A. Isolated, fixture-driven new V3 JSON adapter → geometry → semantic shape/connector renderer; B. Patch live `public/player.js`/`public/diagram.js` directly for immediate UI effect; C. combine stages/swap graph layout engine or alternate design. **Constraints:** future MCP CA033–035 are explicitly deferred; live CA031 blocked; no source-language heuristics or browser business inference; no altering panel locations/sizes/controls; no new dependency absent reviewed need; preserve seven dirty files; task ledger must be verified on GitHub **before code**, and each CA task separately tested, reviewed and pushed.

**Prioritized criteria:** (1) semantic/provenance correctness and immutable original IDs; (2) locked current source, Visit, Values, controls; (3) readable nested grouping and truthful routes; (4) adaptive width-and-height space use; (5) reversibility and delivery time.

**EDO provisional preference:** A, derived from owner-approved plan. **Blinding limitation disclosed:** TL saw a few advisor observations before formally recording this preliminary position, although the approved written plan already specified A; do not claim perfect preliminary blinding. Advisors did not receive other advisor proposals or the EDO preference before each independent response.

## 3. Five distinct real independent advisor proposals, anonymized

The five role-stripped proposal bodies were distributed under letter identifiers in `FE_KICKOFF_COUNCIL_ANON.md` **before** peer reviews; concise faithful full substance is retained here.

- **A:** Reuse existing viewport-capable ELK and pure route/label helpers; direct live path and new layout library have much larger coupling. Preserve independent semantic edge fields versus visual proxy anchors at collapse; RED tests for 28-node wraps, group ancestry, stale Worker, long labels, parallel alternatives. Existing `checkPrepared` rejects group-anchor edge endpoints, requiring controlled geometry-only handling. Fixture-only cannot change current app.
- **B:** Deliver A with an isolated screenshot/preview checkpoint using the _same_ V3 rendering pipeline; fixture-only commits could otherwise produce zero visible live desktop effect. Direct live patch might give rapid feedback but violates user-approved CA031/backend dependency. Test nested multilingual groups and actual two desktop viewport dimensions; never call a fixture demo a production fix.
- **C:** Strict CA028→CA029→CA030 dependencies, task-specific remote GitHub verification, exclusive file locks and rollback. Existing dirty files and initially `NOT_AUTHORIZED` ledger demand **remote approved-status kickoff push first**. A malformed ready baseline is the top schema failure and invisible semantic edge alias the top geometry failure. Report `FIXTURE_VERIFIED`, not end-to-end readiness.
- **D:** Isolated `v3-scene-adapter.js` with atomic whole-root validation, variant-local IDs and `Map`/own-key safety. Negative cases: ready-baseline dangling references, group cycle, explicit unresolved vs structurally missing, CRLF+UTF-16 surrogates, `__proto__` keys, repeated Visits, cursor 0..N navigation, no source-scanning imports. No guessed byte/depth quotas or new dependencies.
- **E:** Existing legacy ELK and route tests PASS but are not V3 JSON coverage. Require malicious-key/text safety, original graph edge set unchanged through collapse, inactive alternatives painted while `activeEdgeIds` highlights only, camera/Worker staleness, actual desktop browser proof separately. Seven user dirty files are off-limits.

**Mapping after reviews concluded (not shown to peers):** A = real geometry specialist, B = real skill-loader acting independent alternative designer, C = real PM delivery specialist, D = real contract specialist, E = real QA/security specialist. All five are separate actual agents; do not claim distinct AI model diversity.

## 4. Five independent anonymous peer reviews

Every reviewer was given all A–E texts without their author roles, no other peer reviews.

1. **R1 (real contract specialist; best B with C and D):** B best guards visible delivery while keeping isolated scope. Challenge: fixture preview entry point is not in approved runtime and must not add production controls. Missed risk: `__proto__` and HTML-like labels may pass adapter then become unsafe keys or markup downstream. Test malicious text/keys and two ready variants at both desktop sizes, both orientations, no semantic import/fetch, graph identity under nested collapse.
2. **R2 (real geometry specialist; best C with B):** C honors dependencies and independent remote gates; B's visibility warning is essential. Challenge: current `public/diagram.js` omits Worker viewport and caches width only, so isolated V3 code does **not** fix current player. Missed risk: unmounted renderer could lack owner-visible preview; height must participate cache key even when width stays constant. Test 28-node fixture at 800×600/1920×1080 both directions through actual new Worker and capture isolated screenshot.
3. **R3 (real QA specialist; best C with D/B):** Independent remote ledger/task gates, contract negatives and visual honesty all required. Challenge: CA030 green task is an isolated renderer, not actual current player or UX. Missed risk: different fixture DOM/CSS/fonts can conceal real shell layout/hit-target defects. Reuse same runtime rendering modules and graph CSS in desktop harness, explicitly disclose CSP/font/shell differences, preserve edge IDs under parallel nested collapse.
4. **R4 (real skill-loader/alternative advisor; best C+B):** Node and Git SHA checks alone cannot establish arrow/label readability or visual success. Challenge: visual screenshot green can still mislead about production status. Missed risk: separate preview CSS/geometry forks and tests a different renderer. Test identical nested multilingual fixture with original IDs/edge status, group labels and no crossings across both dimensions/orientations.
5. **R5 (real PM advisor; best B+A):** B most honestly addresses user visibility; A offers concrete geometry. Challenge: appearance of group-port alias could hide original ownership through multiple nested collapsed scopes. Missed risk: isolated preview may diverge from production asset/CSP/keyboard and theme contrast. Test two nested collapsed group crossings with external parallel edges, original edge IDs/anchors/labels and exact re-expansion; desktop screenshots and asset/import audit.

**Deduplicated Council findings:** root-atomic contract trust; original semantic IDs under collapse; no false live UI progress; preview must use same actual rendering pipeline; view height and font/Values measurement; source/player and native provider remain a future integration gate.

## 5. EDO owner-led technical challenges, genuine agent follow-ups

### Challenge 1 — Can collapse proxies lie or create forbidden semantic edges?

**EDO asked original geometry advisor:** Current `checkPrepared` accepts card endpoints, not group region anchors. How preserve `X→Z` across nested collapsed groups without implying semantic `G→Z`, and preserve alternative true/false routes with shared ports?

**Real advisor rebuttal:** Freeze `ReadyVariant.graph.edges[]`. Derive a strictly **ephemeral geometry projection** per existing `edge.id`: `{id,semanticFromNodeId,semanticToNodeId,renderSourceAnchorId,renderTargetAnchorId,kind,certainty,label}`. Render anchors are original visible node or nearest **declared** visible collapsed ancestor group; not inferred reachability. Wholly internal collapsed edge omitted from painting only, retained in immutable graph. Parallel edges keep different IDs even with same border anchor. Changing ELK's cards-only check needs a RED test; if compound targeting invalid, show route error/keep expanded, never synthesize a bypass. Test group G with decision X, true Y/false W, external Z, eXY/eXW hidden internal and eYZ/eWZ visible as separate original-ID edges on collapse.

**EDO resolution: ACCEPT WITH GUARD.** Keep semantic endpoints and paint anchors separate, test no `eGZ`, all alternatives and certainties preserved, actual orthogonal route finite/contained; layout failure cannot upgrade provenance or add an edge.

### Challenge 2 — Can strict JSON validation reject valid uncertainty or damage source?

**EDO asked original contract advisor:** Atomic malformed-ready-root rejection versus `certainty:'unresolved'`, `sourceRef:null`, optional unavailable baseline, different source hashes, reserved key strings and exact UTF-16 token offsets. Avoid arbitrary node caps or unmeasured budgets.

**Real advisor rebuttal:** `INVALID_ARTIFACT` is structural: mandatory type/enums, duplicate IDs, foreign/dangling refs, missing/cyclic/conflicting groups and `groupPathIds`, bad frame step/navigation/Visit or token boundary. Every declared ready variant must validate, otherwise whole root rejected. Valid explicitly unresolved node/edge with required ID, uncertainty note, permitted null source and empty evidence remains paintable as uncertain. Unavailable baseline requires nonempty reason; two ready variants same project/target but source hashes may differ and IDs are variant-local. Preserve literal `__proto__` / `constructor` values via safe own-key access, render labels as text. Token spans are half-open UTF-16 offsets and cannot cut surrogate pairs. No guessed numerical caps or silent truncation; if genuinely resource-exhausted, return typed error instead of partial render; server aggregate quota CA035 is future.

**EDO resolution: ACCEPT WITH GUARD.** Validate references without semantic invention; unresolved is not an invalid-artifact fallback. Any finite resource policy requires actual evidence and explicit scope, no arbitrary per-node truncation.

### Challenge 3 — What prevents fixture-only PASS from being falsely called a live UI fix?

**EDO asked original QA advisor:** Node tests and separate preview might be entirely unmounted in current product; CSP, fonts, style and keyboard may differ; user expects visual improvement. What can be truthfully accepted without CA031?

**Real advisor rebuttal/concession:** Concede nothing in CA028–030 changes current live player. Safe statuses are per-task isolated adapter/geometry/renderer independently pushed, with `LIVE_PLAYER_NOT_WIRED` and complete V3 source/Visit/Values acceptance blocked. If feasible, use disposable local browser fixture harness importing _same actual_ `v3-scene-diagram.js`, graph CSS/fonts, X6/ELK; no `public/player.js`/`index.html` or locked UI change. Inspect geometry/ARIA/contrast at 800×600/1920×1080 in two orientations, record deviations from actual CSP/shell. If Chromium unavailable, `BROWSER_VISUAL_UNVERIFIED` and `OWNER_FEEDBACK_PENDING`, never full UI or E2E PASS. Include unsafe label and original-edge collapse negative tests.

**EDO resolution: ACCEPT CONCESSION.** Add fixture preview only within approved isolated QA/demo surface if technically feasible with existing dependencies; otherwise mark explicitly unavailable and do not broaden live production scope. BA should warn owner the existing desktop will remain unchanged until future authorized integration.

## 6. Final EDO recommendation and implementation gate

**Decision:** **GO for isolated fixture-driven CA028→CA029→CA030 only**, conditional on mandatory verified **GitHub kickoff ledger update BEFORE code**. Preserve user-approved plan and no new library. CA028 creates strict schema adapter + fixtures; CA029 transforms only supplied graph into local ELK 2D geometry while retaining semantic IDs and honest group collapse; CA030 paints labeled, accessible semantic shapes, edge ports/labels and scoped dark chart theme via pure geometry. All source/Visit/Values/controls in current product are untouched. Work proceeds via fresh task implementer and independent QA/spec+quality reviewer with RED→GREEN and separately verified GitHub plugin commits/status. Do not mark any task DONE until remote commit+status verified.

**Dissent/unknowns:** (1) No current desktop improvement from these isolated tasks because live `public/diagram.js` does not consume V3 fixture and its viewport caller omits dimensions. (2) Group-boundary route clarity and multi-row/column on actual browser fonts remain unverified. (3) Future MCP one immutable JSON producer, CodeGraph multilingual support, source/Visit/Values live parity and full package/Windows acceptance are _not_ completed. (4) Browser fixture preview may be unavailable without extra build harness; do not fake it.

**Hard rollout/rollback:** Existing live player and seven dirty files untouched; no new source-semantic module, no `CA031` cutover, no MCP backend work. If adapter/geometry/renderer fails, no live production regression introduced; task-specific isolated commits remain individually revertible with authorized, non-destructive follow-up.

**Per-task status at kickoff:** CA028 `READY` after ledger remote verification, CA029 `WAITING_ON_CA028`, CA030 `WAITING_ON_CA029`. CA031 `BLOCKED_ON_FUTURE_MCP`; CA033–039 `FUTURE/DEFERRED`. CA032 fixture QA can gather evidence, but full visual/owner/backend proof remains blocked.

**Owner approval preserved:** Design and plan and FE Phase A source authorization have been received; no additional approval required for the exact approved CA028–030 plan. A change that wires V3 into the live player, modifies app shell, starts MCP, changes published release, or deletes task files is beyond these approvals and requires a separate owner decision.
