# CA056 — Format CA030 Council document to unblock CI

Status: READY — issue-first; no formatting fix yet
Priority: P1 CI delivery gate blocker (four npm-check matrix jobs red; browser job green; no live outage)
Branch: `fix/react-layout-collapse`
Owner: documentation/format specialist; independent QA and TL review; PM delivery
Dependencies: CA030 Council doc commit `ecf7b1ace1630dd5a5170156703a68ede7f3c1aa`; block CI-dependent CA054/CA030 completion until fixed

## Observed versus expected

- OBSERVED: Actions run `41044992668` on CA030 Council doc fails all four Ubuntu/Windows Node22/24 `npm run check` matrix jobs; browser passes. Ubuntu job `124026777622` Prettier warns `docs/v3/ca030-build-council-20261030.md`.
- EXPECTED: Markdown matches `.prettierrc.json`, `npm run format:check` and all matrix jobs pass, technical Council content semantically unchanged.

## Proven cause and minimal remedy

- PROVEN: added Council document violates Prettier style. Apply project Prettier only to `docs/v3/ca030-build-council-20261030.md`; preserve all EDO, advisor, peer, rebuttal, references and approvals. No source/tests/workflow/player/server/MCP changes or weakened CI.
- CA054 implementation cannot be marked DONE while inherited branch CI red.

## Reproduction and verification

1. On exact remote document run repository-config `prettier --check docs/v3/ca030-build-council-20261030.md` RED; capture exact diff.
2. Format scoped doc only, independent diff check whitespace/wrapping semantics unchanged.
3. Prettier check GREEN; BA GitHub-plugin commit/push/re-fetch byte-verify; Actions all **5/5 GREEN** (Ubuntu/Windows Node22/24, Chromium browser).
4. Mark CA056 DONE only after implementation CI verified and separate verified task-status commit. Preserve temporary ledger pending user completion approval.

## Council, approval and rollback

Ordinary mechanical Prettier regression analogous CA051, no new architecture choice. FE V3 implementation and GitHub task lifecycle already approved. Revert narrow formatting commit if editorial meaning changes; no behavioral changes.

## Delivery state

Issue-first GitHub file not yet created; no formatting fix committed. CA054/CA055/CA030 read-only/isolated prep may continue; CI-dependent completion BLOCKED.
