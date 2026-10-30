# CA055 — FE V3 collapsed-group presentation projection before ELK

- **Priority:** P1 (CA029 G1 correctness and FE V3 compactness prerequisite).
- **Status:** `IN_PROGRESS / PENDING_CA030`; native geometry implemented and CI verified; genuine V3 Chromium Worker/X6 and human visual checks remain open.
- **Branch:** `fix/react-layout-collapse`.
- **Owner:** TL/FE geometry developer, independent QA and semantic-contract reviewer; PM delivery, BA GitHub plugin relay.
- **Dependencies:** CA028 validated graph contract; CA052 private ELK root collision fix DONE; CA053 globally unique graph IDs within variant DONE; CA054 Worker ACK protocol safety DONE; approved CA029/CA030 architecture and the independent CA055 engineering Council decision. Real Chromium proof depends on opt-in CA030 isolated preview and stays pending until its browser tests run.
- **Related documents:** `docs/v3/implementation-plan.md` (CA029/CA030), `docs/v3/ca055-projection-council-20261030.md` (to be committed after Council final), `docs/v3/ca030-build-council-20261030.md`.

## Observed versus expected

- **Observed:** `public/v3-scene-geometry.js` builds ELK geometry for every validated graph node/group/edge; collapsed descendants still consume space. `flattenV3ElkGraph(elk,variant)` expects the complete graph; no `prepareV3LayoutInput(readyVariant,presentationState,measuredCards)` or collapse-aware topology key exists. Renderer-side hiding alone leaves blank space and can route edges to invisible endpoints.
- **Expected:** Compact, faithful nested collapse/expand in either orientation, using only original semantic identities and edges. FE computes layout visibility and routing anchors, never invents a transition or mutates MCP-supplied graph/playback/source/Values data. Playback seeking alone must not re-run ELK.

## Limited implementation scope

1. Add a presentation-only `prepareV3LayoutInput(readyVariant,presentationState,measuredCards)` contract yielding `{cards,regions,edges,topologyKey}` and explicit mapping from immutable original semantic endpoints to effective visible ELK anchors. Fully expanded input remains identical in graph meaning.
2. Project only visible nodes and expanded regions before ELK. A collapsed group becomes one measurable presentation leaf under its original **group ID** (not a synthetic semantic node), with inherited nearest visible collapsed-ancestor anchor for hidden external endpoints. Preserve nested hierarchy and boundaries. Treat internal edges whose projected source and destination coincide inside the same collapsed group as hidden _for painting/layout only_.
3. For every exposed edge, preserve the original edge ID, original from/to IDs, label, type, certainty, status, highlighting metadata and `underlyingEdgeIds: [originalEdge.id]`; retain distinct parallel edge identities even if visible anchors coincide. Never fabricate group-to-node semantic edges, deduplicate originals, or delete internal semantic records. Keep hidden active edges inspectable in the immutable model; do not paint a deceptive visible transition.
4. Make the flatten/geometry validator aware of the **projected visible input**, not the full immutable variant, and normalize root-listed nested `edge.container` coordinates before strict orthogonal/card-interior checks. Fail closed to a conspicuous V3 layout error if ELK cannot provide valid group-leaf routing; do not silently switch to semantic inference or an unsafe paint path.
5. Build deterministic `topologyKey` scoped to variant/revision, collapsed-group IDs, expanded Values/card measurements, orientation and both viewport dimensions. Exclude playback cursor/frame/activeEdgeIds; preserve Worker abort/epoch stale-result protection.
6. Keep changes within CA029 presentation geometry/tests and a narrowly reviewed CA030 consumer interface if strictly required. No legacy player change, no MCP/backend change, no CA031 live cutover, no generated bundle mutation except separately reviewed preview build gate.

## RED-to-GREEN verification and acceptance

- Construct nested Outer → Inner → X/Y with sibling W and external Z; parallel branch/return external edges with distinct metadata, an inner-only edge, and an internal-to-sibling boundary edge. Cover collapse Inner, collapse Outer, re-expand each, both horizontal/vertical, small/large viewports, and measured Values cards.
- Real bundled `elkjs`/ELK Worker fixture must prove group-as-leaf endpoints route correctly, nested `edge.container` offsets normalize, no diagonal/card-interior crossing, compact collapsed bounding box is smaller, and parallel edges retain separately addressable IDs/labels/provenance.
- Assert deep equality for original `variant.graph` before/after projection and every layout; exact visible-edge subset, absent internal-only painted edges, correct nearest-ancestor anchors, no accidental self-loops or missing exposed edges.
- Assert topology key invalidates on collapse/expand, variant/revision, card-size/Values, viewport/orientation changes; cursor-only navigation/active-edge highlights leave key stable and trigger zero new Worker layout calls.
- Focused TDD RED then GREEN (`node --test tests/v3-scene-geometry.test.mjs tests/diagram-elk-layout.test.mjs`); independent FE contract/QA review; repository-config Prettier; applicable `npm run check` plus GitHub Actions 5/5 green after plugin commits.
- Browser integration and screenshot human visual acceptance remain separately **PENDING_CA030** until real isolated preview renders in Chromium; native unit success alone cannot close CA029 G1 visual gate.

## Commit, status and ownership gates

1. BA GitHub plugin creates this issue-first task file with a detailed commit, verifies remote SHA; only then start CA055 production code changes.
2. Exclusive FE geometry author writes focused tests/fix in isolated staging. Independent QA and semantic reviewer examine same exact bytes/hashes. PM sends full reviewed source/test to BA for GitHub-plugin compare-and-swap commits and remote blob revalidation.
3. Record each scoped commit, RED/GREEN commands, Windows/Linux CI URL, and residual Chromium/visual gate here. Mark `DONE` only after full acceptance; otherwise `IN_PROGRESS / PENDING_CA030`. Preserve task file until explicit owner cleanup authorization.
4. If the GitHub plugin fails, stop **all work immediately** and notify BA/user; no Git CLI workaround.

## Verified implementation checkpoint (not full completion)

- Issue-first ledger commit `c2533b4b31ef0ce483cd6e5df958ba7a9b61c2f5`; Council decision `9c390e536600ed0b015df01251b2f4b550096a35`.
- CA055 presentation-only source/tests atomic GitHub-plugin commit `0cf1e56c422b7022daa1fe1a2c493a66852646cb`, both independently re-fetched byte-identical to QA staging.
- Reviewed staging SHA-256: geometry `c00c100eeab9c6ef846bfaf212c018a8db08e075660378286277f0b578c37ea9`; tests `7aba3a9658d1d9f3f7abe0e03077ade18d05c10df2f30a44fd199e47e5777ac3`.
- Independent QA and separate semantic-contract reviewer PASS: actual native ELK geometry **36/36**, combined focused **56/56**, Node syntax and repository-configured Prettier PASS. Original edge IDs/endpoints/labels/certainty and CA052/053/054 fixes preserved.
- GitHub Actions [run 41049366771](https://github.com/EmpRider/code-anime/actions/runs/41049366771) at `0cf1e56` **completed/success, 5/5** (Ubuntu Node 22/24, Windows Node 22/24, Chromium legacy/scaffold browser).
- CA057 cache identity and mutation isolation tracked separately at issue-first `fc2e11908f66b586cc572bfcf8620728ab36a8b2`; experimental cache fix **not included** in CA055 commit.
- **Not DONE:** real V3 X6/ELK Worker Chromium integration, 900×600 / 1440×900 / 1920×1080 screenshots, active-hidden-edge behavior, human visual signoff and CA057 integrity still pending.
