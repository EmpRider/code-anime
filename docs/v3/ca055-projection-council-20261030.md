# CA055 engineering Council — collapsed-group presentation projection

- **Date:** 2026-10-30.
- **Repository/branch:** `EmpRider/code-anime` / `fix/react-layout-collapse`.
- **Decision owner:** EDO under TL → PM → BA; BA remains the sole user interface and GitHub plugin write relay.
- **Boundary:** Approved FE V3 CA029 geometry and CA030 isolated preview only; no legacy player change, no MCP/business inference, no live CA031 cutover.
- **Provenance:** Five independently tasked engineering advisors, five independent blind peer reviewers, EDO provisional verdict _before_ peer outputs, and two targeted post-peer owner-led EDO challenges with real rebuttals. Summaries below paraphrase actual received reports, not fabricated quotations. The five advisor full raw messages were not persisted verbatim in this scratch record.

## Question before the Council

The approved `docs/v3/implementation-plan.md` requires `prepareV3LayoutInput(readyVariant,presentationState,measuredCards)` and compact nested collapse without generating new semantic graph edges. Current `public/v3-scene-geometry.js` builds/validates every source node/group/edge, so hiding collapsed descendants **after** ELK keeps their footprint and may route to invisible endpoints. How should CA029 G1 project visibility while preserving exact graph identity, native nested ELK routing, and zero relayout on playback cursor changes?

## Alternatives and independent advisor stage

| Council option | Mechanism                                                                                                                                                                                                     | EDO technical assessment                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**          | Project the visible **presentation graph before ELK**; keep immutable semantic graph separately, collapsed original groups become ELK leaves, layout-only endpoint anchors map to nearest collapsed ancestor. | Supports actual compact reflow; feasible only with projection-aware strict flattening, native-ELK route evidence, and identity/cache safeguards.          |
| **B**          | Layout all graph descendants using ELK, then hide collapsed items and reroute in renderer.                                                                                                                    | Hidden descendants still reserve space, so violates approved compactness. Post-hoc routing risks invalid sections.                                        |
| **C**          | Cache expanded layout, hide and locally compact without running ELK.                                                                                                                                          | May improve reopen speed but layout/containment and edge route correctness become unproven. Cache can be an optimization only after Option A correctness. |
| **D**          | Project top-level only, defer nested collapse.                                                                                                                                                                | Incomplete with respect to approved nested collapse.                                                                                                      |

Five genuine independent advisors' role-specific conclusions, paraphrased from TL's received reports:

1. **Implementation engineering:** favored A with an explicit projection-aware build/flatten contract; group-as-leaf ELK routing must be proven on nested/parallel fixtures.
2. **QA/test engineering:** favored conditional A; RED/GREEN must cover semantic deep equality, actual ELK hierarchy, both orientations, collapse/expand, and cursor-only no relayout.
3. **Reliability/Worker:** favored A with stale Worker epoch/abort safety and deterministic key invalidation, avoiding inferred fallback geometry.
4. **UI/UX geometry:** favored A because only omitting collapsed descendants before ELK actually removes wasted canvas; labels and independent parallel routes still need readability tests.
5. **Devil's advocate:** conditionally favored A but challenged the unproven nested group-as-leaf ports, `edge.container` offsets, strict full-graph flattener, and reopening latency. Proposed retaining an expanded-layout cache as an optional optimization.

**EDO provisional verdict before anonymous peer reports:** prefer **Option A**, conditional on native bundled ELK proof, identity-conserving projection and stricter geometry validation. The EDO did **not** authorize implementation at this provisional stage.

## Five independent, blinded peer reviews

For peer anonymity the descriptions were remapped: peer proposal **B** = Council Option A with explicit immutable IDs/cache; peer **E** = Council Option A with nearest-ancestor endpoint routing; peer **A** = full ELK then hide; peer **C** = local compaction; peer **D** = shallow-only projection. Peer identity is intentionally independent from author identity.

| Peer   | Blind choice and material independent objection                                                                                                                                                                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#1** | Chose blind B (conditional): native nested group-leaf, parallel branch/return edges, `edge.container`, exact semantic identities, cursor-cache proof required.                                                                                                                            |
| **#2** | Chose blind A as a conservative diagnostic alternative to unproven projection; conditional acceptance of projection only with native ELK routes, strict flattening and shrinking bounds. Retain B fallback only for diagnostics, not untruthful compactness.                              |
| **#3** | Chose blind B (conditional): warned that multiple hidden-child edges may map to the same visual group anchor but **must not be merged**; preserve original IDs/metadata/`underlyingEdgeIds`, `edge.container` normalized sections, exact internal-only hidden subset.                     |
| **#4** | Chose blind E with blind B safeguards: nearest-collapsed-ancestor anchors are necessary for nested boundary edges; real elkjs nested root-listed edge has a non-root `container`; current V3 normalizer already accounts for this—do not mistake a legacy helper limitation for a V3 bug. |
| **#5** | Chose blind B amended with E ancestor routing: real elkjs 0.12.0 read-only fixture proved two distinct parallel external routes and one inner edge. The inner route was physically in root `edges[]` but had `edge.container:'outer'`.                                                    |

None voted for fabricated semantic transitions, merging parallel edges or live-player replacement. Peer #2's conservative stance remains documented dissent against treating a promising ELK experiment as comprehensive proof.

## Reproducible real-ELK evidence

Independent peer #5 ran `elkjs@0.12.0` from the repository with a synthetic nested graph: root contains `outer` with collapsed ELK leaf `inner` and visible `w`, plus external `z`; root edge records have parallel `e1/e2:inner→z` and `e3:w→inner`. It observed:

- `e1.container=root`, `e2.container=root`, `e3.container=outer` despite all three physically under root `edges[]`.
- Two parallel `inner→z` routes remained separate (`e1` start x=214,y≈60.67; `e2` start x=214,y≈42.33).
- `outer` absolute offset `(12,12)`; `e3` reported relative `(92,39.5)→(112,39.5)`, becoming absolute `(104,51.5)→(124,51.5)`, aligning with its actual visual leaf boundaries.

Reproduce from `code-anime`:

```bash
node --input-type=module -e 'import ELK from "elkjs/lib/elk.bundled.js"; const graph={id:"root",layoutOptions:{"elk.algorithm":"layered","elk.hierarchyHandling":"INCLUDE_CHILDREN","elk.edgeRouting":"ORTHOGONAL"},children:[{id:"outer",children:[{id:"inner",width:90,height:55},{id:"w",width:80,height:40}]},{id:"z",width:80,height:40}],edges:[{id:"e1",sources:["inner"],targets:["z"]},{id:"e2",sources:["inner"],targets:["z"]},{id:"e3",sources:["w"],targets:["inner"]}]}; const out=await new ELK().layout(graph); console.log(JSON.stringify({rootEdges:out.edges.map(e=>({id:e.id,container:e.container,start:e.sections[0].startPoint,end:e.sections[0].endPoint})),outer:out.children.find(n=>n.id==="outer")},null,2));'
```

This is **feasibility evidence**, not proof of all source metadata/geometry validation cases or full Chromium Worker integration. Specifically, `public/v3-scene-geometry.js` already has `normalizeV3EdgeContainers` and should retain/regression-test it; the peer's raw nested-offset defect observation applied to the older flatten helper (`public/diagram-elk-layout.js`), **not the existing V3 wrapper**.

## EDO targeted challenge and actual rebuttal

After all five blind reviews, EDO specifically challenged peer #4 (nearest-ancestor E) and peer #5 (identity/cache B) to defend how projected group leaves coexist with the existing strict `flattenV3ElkGraph(elk,variant)` complete-graph expectation; how original vs layout endpoint IDs, parallel labels, hidden active IDs, `edge.container` and fail-closed behavior work.

- **Peer #4 actual rebuttal:** proposed pure `projectV3Graph(readyVariant,collapsedGroupIds)` returning `{layoutGraph,paintEdgeIds,hiddenEdgeIds,endpointMap,topologyKey}`. Collapsed groups become measured ELK leaves using original group IDs, no children; layout edges preserve original edge IDs but map only effective anchors, with separate original endpoints and `underlyingEdgeIds`. Extend geometry builder/flattener to validate **visible subset**, not relax semantic validation. Active hidden edge IDs remain in original model and may surface in collapsed-group indicator. On invalid ELK: reject and show explicit unavailable/stale state, retain only known coherent geometry, never synthesize routes. Corrected their prior assertion: V3 normalizes nested containers already; legacy helper is the defect location.
- **Peer #5 actual rebuttal:** independently defended immutable semantic graph plus separate layoutSourceId/layoutTargetId, `underlyingEdgeIds:[original]`, distinct parallel edge records, projection-aware subset flattening/rejoin by ID, stable group IDs, and active hidden edge IDs visible in a collapsed-group inspection summary. Verified actual ELK in RIGHT and DOWN. Topology key includes artifact revision, variant, collapsed set, orientation, viewport, card dimensions and rendering/font revision but excludes cursor. Readable parallel labels remain an explicit RED/GREEN requirement.

## Final EDO verdict and non-negotiable gates

**CONDITIONAL APPROVAL — Council Option A, pre-ELK visibility projection, with nearest-collapsed-ancestor routing and strict original semantic-ID provenance.** Distinct original semantic edge records never merge; group leaves reuse existing IDs only as layout endpoints, never masquerade as source graph nodes. Prepare a per-edge original-to-layout endpoint map and exact `underlyingEdgeIds` so renderer can show only the truthful visible subset and hidden active edge indicators.

Before CA055 code: BA must create and verify `.agent-tasks/CA055-fe-v3-collapse-projection.md` **issue-first** via GitHub plugin. Then exclusive FE geometry author must demonstrate TDD RED→GREEN with actual bundled ELK nested compound groups, parallel distinct routes, internal-hidden edges, `edge.container` exact once offsets, both orientations and viewports, deep-equal immutable semantic input, expand/contract compactness, strict no diagonal/interior crossing, and topology key invalidation on variant/revision/collapse/Values/measured size/viewport/orientation but **not cursor**. Independent semantic reviewer/QA must sign off on exact staged bytes. Worker epoch/stale cancellation and prior CA052/053/054 safeguards remain intact.

If native ELK cannot safely model a collapsed nested group as a leaf, **fail closed and return to Council**, show explicit stale/unavailable UI without inventing routes. No provisional full-graph/hide fallback may be portrayed as compact collapse. Real Chromium Worker, X6 visual routing, final screenshot/owner pixel acceptance are `PENDING_CA030`; these must not be claimed from the Node feasibility probe. CA029 remains `IN_PROGRESS` until the approved gates truly pass.
