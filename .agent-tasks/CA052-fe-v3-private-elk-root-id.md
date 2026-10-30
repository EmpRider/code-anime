# CA052 — FE V3 private ELK root ID collision

Status: READY (issue-first; no fix committed)
Priority: P1 FE V3 acceptance blocker (isolated preview, no known live-player outage)
Branch: `fix/react-layout-collapse`
Owner: TL FE V3 → geometry developer; independent QA and code reviewer
Dependencies: CA051 DONE; CA029 IN_PROGRESS; CA030 blocked on CA029 acceptance
Approval: FE V3 design/plan/start approved; engineering Council `ca052-council-20261030.md` selected deterministic collision-free private root; no CA031 cutover or MCP changes authorized.

## Observed versus expected

- OBSERVED: Adapter permits semantic node ID `v3-scene-root`; `buildV3ElkGraph` builds private root with same ID (`public/v3-scene-geometry.js:104`). Native ELK returns root and child duplicate IDs; `flattenV3ElkGraph` throws `Duplicate V3 ELK node v3-scene-root`.
- EXPECTED: Every V3 ready graph satisfying the approved contract must layout without FE-reserved IDs clashing with semantic IDs. Preserve all external node/group/edge IDs and relationships unchanged.

## Safe reproduction and evidence

Use synthetic V3 ready fixture with a node `id: "v3-scene-root"`, another reachable node and an edge; build input via `buildV3ElkGraph`, run Code Anime's bundled ELK, flatten via `flattenV3ElkGraph`. Confirm duplicate failure. No analyzed user-project code executed. Independent specialist reproduction with actual ELK; prior five-advisor peer-reviewed Engineering Council record `ca052-council-20261030.md`; pinned skill snapshot `skill-pin-fe-v3-20261030.md`.

## Proven root cause and Council remedy

- PROVEN: private ELK root uses a fixed externally permitted semantic ID.
- Remedy: choose deterministic first available private root ID absent from a Set of **all supplied node, group and edge IDs**, checking suffix candidates without arbitrary cap.
- No remapping external semantic IDs, business logic inference, legacy player cutover, or MCP modifications.
- Separate CA053 cross-kind collision requires its own issue-first ledger and user-approved globally unique adapter validation. Do not treat CA052 as full CA029 completion.

## Affected resources and rollback

`public/v3-scene-geometry.js`, `tests/v3-scene-geometry.test.mjs`; consumers `buildV3ElkGraph`, `flattenV3ElkGraph`, CA029 layout, later CA030 X6 renderer. Roll back isolated CA052 geometry commit if regression.

## Acceptance and verification

1. TDD RED test reproduces exact collision, then GREEN after fix.
2. Cover base/suffix/chained suffix occupied by node/group/edge, nested groups, cross-container edge, both orientations, exact semantic IDs/endpoints/certainty and input immutability.
3. Existing geometry suite and synthetic Worker negative cases remain green; real Chromium Worker integration checked when V3 preview available.
4. Independent QA/reviewer approval, task-specific implementation commit pushed/verified, then separate `DONE` status ledger commit. A legacy screenshot is not V3 visual acceptance.

## Delivery state

Issue-first creation pending BA GitHub plugin write. No CA052 code edits or remote implementation commits yet.
