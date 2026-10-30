# CA058 Engineering Council — Native ELK edge-label reservation

- **Date:** 2026-10-30 (Sri Lanka).
- **Project/branch:** `EmpRider/code-anime`, `fix/react-layout-collapse`.
- **Governance:** BA→PM→TL→five independent engineering advisors→five anonymous peer reviewers→EDO challenge and rebuttal; read-only deliberation, no production or GitHub writes during Council.
- **Issue-first gate:** `.agent-tasks/CA058-fe-v3-native-chromium-layout-unavailable.md`, GitHub commit `08824e2` independently verified before code.
- **Decision:** **Conditional GO, Option D only** — add deterministic, bounded presentation-only native ELK label reservations to the existing, visible, projected original edges; preserve the independent V3 renderer collision and orthogonal route validators. No new callout system, fabricated semantic edge or silent label omission in this P0 repair. Code, remote CI, browser and visual gates remain pending.
- **Skill/upstream receipt:** `skill-pin-fe-v3-20261030.md` and full `upload/agent-team-skill(2).md`; `code-anime/AGENTS.md` remains authoritative. Pinned upstream references were already verified for this continuous FE V3 implementation task.

## Direct evidence, before option scoring

1. GitHub Actions run [41052613150](https://github.com/EmpRider/code-anime/actions/runs/41052613150): Ubuntu/Windows Node 22/24 all passed, browser job `124052136083` failed four V3 Playwright cases (74 other browser tests passed). Uploaded screenshot and browser-result artifacts. Actual Chromium screenshots show `V3 graph unavailable: No collision-free V3 edge label position for edge:1` on baseline horizontal and `edge:start` on nested vertical. Three horizontal nested screenshots prove real Worker/X6 rendering can succeed under the production CSP.
2. Exact official ELK baseline geometry: node:one spans x20–280, node:two x300–560; original route x280→300 is **20 px**. Legacy `reserveRouteLabel` deliberately skips any segment shorter than **32 px** and requires a 46×26 px label for `next`. The new V3 renderer throws when this optional legacy placement helper returns `null`, blanking the entire graph. This is an exact root cause, not a Worker-registration or CSP guess.
3. TL and PM independently reproduced real official ELK/Worker-shaped registration→ACK→layout→flatten for baseline and nested fixtures, both orientations. Production `renderV3Scene` preflight reproduced the label exception before X6. Naively setting ELK node-between-layers spacing to 100 px at root and nested containers **still failed** the old preflight.
4. Independent read-only geometry/performance advisor experiments added `{text,width,height}` label metadata to the **ELK-only existing edge record** before native ELK layout. The unchanged V3 renderer label preflight then passed baseline/nested × horizontal/vertical (**4/4**). Baseline horizontal graph width changed **580→646 px** (+66); route gap **20→86 px**. This is not yet full Chromium acceptance.

## Compared alternatives

| Option | Mechanism                                                                                        | Council verdict                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Enlarge global ELK layer spacing                                                                 | Reject as sole fix; empirical 100 px spacing still failed three reproduced orientations, wastes compact PC canvas space.                                                          |
| B      | Deterministic bounded, visually edge-tethered label callouts                                     | Contingency requiring separate scoped design and issue-first task if a reproducible valid graph still fails after D; introduces clipping, edge association and new UX complexity. |
| C      | Silently omit visible labels, retain text only in data/aria                                      | Reject as normal behavior; erases one-glance branch/return meaning and violates the user's explicit visible flow requirement.                                                     |
| D      | Native ELK label dimension reservation on original visible edges, then strict renderer placement | **Conditional GO** for P0; strongest reproducible root-cause fix, no invented semantics, small layout growth.                                                                     |

## Five genuine independent advisors

1. **A1 — Geometry/ELK:** Directly measured 20→86 px horizontal and 20→66 px vertical route gaps after ELK-native label data. Strong D recommendation; warned native ELK's proposed label coordinates can intersect nested group headers, so retain independent `reserveRouteLabel` instead of directly painting native coordinates. D>B>A>C.
2. **A2 — UI/UX:** Inspected actual Chromium success and failure PNGs. Initially favored B when no label-aware ELK experiment existed; independently revised to D after the empirical evidence. 900×600 auto-fit text becomes tiny, a separate P1 backlog item rather than part of this P0 fix. D>B>A>C.
3. **A3 — QA/adversarial:** Explicitly corrected an early inaccurate 60 px gap assumption to **20 px** after PM evidence. Changed initial B-first to D-first with native ELK 4/4 proof. Requires parallel edges, nested collapse, CJK/Sinhala/emoji/newline/huge label, exact original provenance, route strictness, six desktop/orientation screenshots and one collapsed. D>B>C>A.
4. **A4 — Performance/architecture:** Independently made native ELK 4/4 preflight pass, measured 580→646 px. Warned `reserveRouteLabel` has approximate `O(E × S × 10 × (N+G+E))` repeated candidate/obstacle search on dense graphs; do not add unbounded retry passes. D>B>A>C.
5. **A5 — Semantic/security:** ELK-only label metadata derived from an _existing visible projected original_ edge is not a new semantic node or edge. Assert immutable `variant.graph`/playback, exact IDs/from/to/provenance/full Unicode, no CSP weakening/eval/innerHTML, and CA057 key sensitive to text and measured dimensions. D>B>A>C.

All five were separate, genuine read-only reviews, not simulated consensus.

## Five anonymous independent peer reviews

Peer reviewers received anonymized P1–P5 proposals, without author identities, and independently examined the code and reproduced evidence:

1. **R1 — CONDITIONAL GO D:** Scores P1/P4 5/5 for direct ELK experiments, P5/P3/P2 4/5. Challenges ASCII-width `line.length*6` measurement for CJK/Sinhala/emoji and whether 4/4 proves all label rectangles. Requires actual Chromium bounding-box and clipping review.
2. **R2 — CONDITIONAL GO D:** P1/P3/P5 strong, P2/P4 with readability/performance caution. Preserve strict post-ELK collision validator and defer B. Distinguishes code authorization from browser acceptance.
3. **R3 — CONDITIONAL GO D:** P1 9/10, P2 8/10, P3 8.5/10, P4 9/10, P5 9.5/10. D fixes the known P0; B is materially broader UX and should require a separate task if evidenced. Keep impossible placements explicit/fail-closed.
4. **R4 — CONDITIONAL GO D:** Strong reviewer focus on 10k edge worst case, Unicode/huge label bounds and measured dimensions in cache identity. Native ELK labels cannot justify unbounded retries or changing original IDs.
5. **R5 — CONDITIONAL GO D:** Four fixture passes are not universal proof. Approve narrow D only, keep B for separately demonstrated pathology, reject C silent omissions, require original labels/IDs/provenance, six + collapsed screenshots and visual QA.

## EDO challenge, rebuttal and adjudication

- **EDO provisional position before advisor results:** B (bounded original-edge callout) seemed most reliable when all known labels failed and native layout was assumed fixed. This was a hypothesis, not code authorization.
- **Evidence-driven revision:** D became the preferred fix only after independent official ELK injection proved all four failed fixture/orientation preflights could pass with 66 px growth and unchanged strict renderer placement. This directly falsified the adequacy of naive A and avoided speculative B complexity.
- **Peer challenge:** D with naive UTF-16 width estimates may still miss CJK/emoji/long labels; pathological graphs may remain impossible, and 10k edges may be costly. Four local preflights are neither full-browser nor universal proof.
- **Targeted rebuttal A1 (geometry):** D-only is safe for **code authorization**, not unconditional `DONE`. Derive ELK size and renderer collision envelope from the same deterministic measurement contract with conservative padding, preserve original labels, reject oversized resource demands. Chromium pixel/Unicode validation and performance are downstream _release_ gates; imposing them before code would prevent the necessary browser experiments. B is not justified without a concrete D failure.
- **Targeted rebuttal A3 (skeptical QA):** `GO_TO_IMPLEMENT_CONDITIONAL; NO_GO_TO_RELEASE_UNTIL_METRIC_BROWSER_EVIDENCE`. Require RED→GREEN on all four native ELK preflight fixtures, shared ELK/renderer label measurement including CJK/Sinhala/Arabic/emoji/multiline, bounded huge-label behavior, nested/parallel original IDs, cache-sensitive metrics, explicit malformed-route failures and 10k representative performance. Chromium label DOM/SVG bounds must be inspected before closeout. No silent B insertion or false `DONE` on 4/4 ASCII fixture proof.
- **EDO final disposition:** Conditional GO **D-only** as the smallest approved P0 root fix; preserve strict fail-closed if even native reservation cannot find an honest, visible label, without suppressing original semantic text or inventing edges. Evidence of such a failure requires a new separately approved B callout task, not a hidden additional change. Full final acceptance requires exact-byte independent QA and real Chromium Worker/X6/screenshots.

## Implementation limits and acceptance

1. Exclusive geometry author adds RED→GREEN to `public/v3-scene-geometry.js` and its V3 test: native ELK receives labels with deterministic, finite, bounded width/height for **existing visible projected original edges only**. Preserve graph ID/endpoints/provenance/order, cache identity, immutability, same Worker protocol and cursor-only reuse. Do not modify shared legacy `public/diagram-label-placement.js` or the legacy player/build/CSP/MCP backend.
2. Regression 4/4 baseline/nested × horizontal/vertical with actual `elkjs`, strict V3 renderer preflight, nested collapse/expand, original edge labels, parallel distinct edges, CJK/Sinhala/emoji/multiline/long labels, zero/invalid route rejection and dense performance. Record layout graph bounds/label collision proof; no added synthetic semantic edges.
3. Independent QA+semantic reviewer verify exact source/test file hashes, formatting/syntax, projected edge equivalence and tests; PM→BA mechanical GitHub plugin relay and byte-verify. GitHub Actions must pass **5/5**, including all four previously failed native Chromium tests and six screenshots plus collapsed screenshot, with label position visual assessment. No premature `DONE` or task-file deletion without user approval.
4. If GitHub plugin fails, immediately stop all tasks and notify BA/user; no Git CLI fallback.
