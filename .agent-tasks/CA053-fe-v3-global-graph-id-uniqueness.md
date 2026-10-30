# CA053 — Enforce variant-local global graph ID uniqueness

Status: READY (issue-first; no code fix)
Priority: P1 FE V3 acceptance blocker; no live production outage observed
Branch: `fix/react-layout-collapse`
Owner: FE V3 adapter developer; review: TL, independent QA and contract reviewer
Dependencies: CA052 DONE, then CA053 before CA029 acceptance and CA030 renderer
Approval: FE V3 design and plan approved. Human owner explicitly selected **globally unique IDs for node, group and edge within each V3 variant**; IDs may repeat across independent variants. No CA031 live cutover or MCP/backend changes.

## Observed versus expected

- OBSERVED: `public/v3-scene-adapter.js` `validateGraph` indexes `nodes`, `edges`, `groups` separately around lines 306–310; `indexed` around lines 211–220 checks duplicates within each kind only. Node and edge sharing `node:one` passes validation when playback `activeEdgeIds` references stay coherent. Earlier independent node/group alias passed adapter but failed geometry flatten.
- EXPECTED: Every cross-kind duplicate ID within one ready variant rejects early with typed `INVALID_ARTIFACT`, pointing to offending path/type. Independent variants may reuse IDs; valid IDs and input unchanged.

## Reproduction and root cause

Clone synthetic `tests/fixtures/v3/proposed-baseline.json` in memory; set `proposed.graph.edges[0].id = proposed.graph.nodes[0].id` (`node:one`) and update `playback.frames[*].activeEdgeIds` from `edge:1` to `node:one`. `validateFlowSceneDocument` currently ACCEPTS (independently reproduced). Unadjusted playback refs cause unrelated missing-edge failure. Proven missing cross-kind Set shared by all indexed kinds. CA052 private root defect separate.

## Scoped Council recommendation and owner contract

After per-kind indexing, enforce a common variant-local graph ID Set across nodes/groups/edges. Reject duplicates with adapter's existing `INVALID_ARTIFACT` fail path and offending-ID diagnostic. Preserve same-kind checks, canonical IDs, input immutability, source/trace certainty; no remap, FE business semantics, legacy player/server/MCP changes. Prior CA052 Council identified ambiguity; human owner resolved policy to global uniqueness.

## Affected resources and rollback

`public/v3-scene-adapter.js`, `tests/v3-scene-adapter.test.mjs`; V3 schema docs only if needed to record variant-local contract. Consumers CA029 geometry, future CA030 X6. Rollback task-specific adapter commit if unexpected regression; formerly accepted but non-renderable aliases intentionally invalid under owner rule.

## Verification and acceptance

1. TDD RED existing acceptance of node↔edge, node↔group, group↔edge aliases with coherent references and nested groups; GREEN typed `INVALID_ARTIFACT` and offending path.
2. Same ID across independent variants remains allowed; same-kind duplicate failures and valid fixtures preserved.
3. Full adapter suite and relevant geometry tests pass; Chromium E2E once preview exists; never execute analyzed user code.
4. Independent QA/reviewer scope signoff; task-specific plugin commit(s) remote byte-verified; mark DONE only in subsequent verified status commit.

## Delivery state

Issue-first creation awaiting GitHub plugin write. CA052 verified DONE at commit `6161da12a0b4965cc65d7b615fb04285f0efa78f`. No CA053 source edit or remote implementation commit yet.
