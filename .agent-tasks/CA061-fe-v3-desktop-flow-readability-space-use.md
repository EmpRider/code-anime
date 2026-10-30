# CA061 — FE V3 desktop graph readability and space use in real Chromium screenshots

- **Priority:** P1 — high-impact desktop UI/UX degradation. Graph content is rendered, but the 900×600 initial views are too small to read at normal screenshot scale; the 1920×1080 vertical view uses a narrow central strip of the available graph pane. This is a **visual usability issue**, not a new mobile-responsive requirement.
- **Status:** `OPEN / ISSUE-FIRST / SCREENSHOT-VERIFIED / ROOT_CAUSE_UNCONFIRMED / DESIGN_AND_PLAN_APPROVAL_REQUIRED`. This is a proposed issue record only; no code, styles, tests, remote task files, or deployment were changed for CA061. An issue-first GitHub-plugin commit and independent remote verification must precede any authorized CA061 implementation.
- **Branch:** `fix/react-layout-collapse` (target issue ledger; no CA061 branch or remote mutation made by this draft).
- **Owner:** TL with independent desktop UX QA and FE layout specialist; PM delivery; BA sole user interface and GitHub-plugin relay. Actual implementation owner to be assigned after gates.
- **First visual evidence:** Real Chromium GitHub Actions [run 41083389952](https://github.com/EmpRider/code-anime/actions/runs/41083389952), from CA058 intermediate source/test commit [`faaad43eb2151667520bc7954a3d6347f50965a3`](https://github.com/EmpRider/code-anime/commit/faaad43eb2151667520bc7954a3d6347f50965a3), screenshot archive `ui-preview-screenshots` artifact **12989908371** (previously verified ZIP SHA-256 `cc2c997954de45916e93c1655271362baa6eb56e7e817ab3cd4c87b1efd94c90`). The related `browser-test-results` artifact is **12990153220**; it is separate from these visual observations.
- **Dependencies and non-goals:** CA028/CA029 native graph/ELK Worker, CA030 isolated X6 preview, CA054 Worker protocol, CA055 collapse, CA057 cache, CA058 label reservation, **CA059** official-ELK label collision and **CA060** strict Chromium CSP failures. Keep CA059/CA060 separate and unresolved, and do not call FE V3 accepted while required CI is red. No legacy player, MCP/backend, live cutover, cross-origin Worker, CSP relaxation or mobile/tablet expansion in this issue.
- **References:** `.agent-tasks/CA058-fe-v3-native-chromium-layout-unavailable.md`, `.agent-tasks/CA059-fe-v3-native-label-collapse-counterexample.md`, `.agent-tasks/CA060-fe-v3-chromium-csp-style-src-elem.md`, `docs/v3/implementation-plan.md`, `docs/v3/flow-scene-json-contract.md`, `tests/browser/v3-preview-scaffold.spec.ts`.

## Observed versus expected

1. **OBSERVED — unreadable small desktop:** Both 900×600 directions show the complete nested multilingual fixture but make node, edge and group captions visually minute at the screenshot's native size. The horizontal diagram is squeezed into a compact band of the right pane; the vertical view has particularly tiny edge labels such as `next`, `true` and `unresolved`, and node labels such as `条件 if/else` and `λ обработка` are hard to parse. **INFERRED:** Initial fit-to-viewport scaling could be reducing effective on-screen text size. The exact CSS transforms/font size and attribution to a specific function are **UNVERIFIED**, and must be measured before choosing a remedy.
2. **OBSERVED — inefficient large desktop space:** At 1920×1080, the vertical diagram occupies roughly x=849–1361, approximately **512 px** of a graph pane extending from x=290 to x=1920 (roughly **31% width**). It runs almost the full pane height but leaves large empty gutters on both sides. The horizontal view uses much more of the available width. The vertical aspect ratio may constrain scale; **no claim** that stretching the existing SVG is safe or desirable follows from these pixels.
3. **OBSERVED — boundary proximity, not proven clipping:** At 1440×900 vertical, the `unresolved` edge caption sits immediately beside the right orange dashed boundary of the nested `if` group near x=960. The screenshot **does not prove clipping, actual glyph occlusion or a collision**. Treat it as a precise regression-inspection point requiring DOM/SVG bounding-box measurement and zoom checks, not as a confirmed CA059-style strict-renderer collision.
4. **OBSERVED — counterexample:** The 1440×900 `scope`-collapsed view shows a compact node, a group box and a legible `next` edge caption. Thus the issue is not that every viewport or every collapse state is unreadable. The 1440×900 expanded horizontal and vertical and 1920×1080 horizontal screenshots are useful comparison states, not a blanket fail verdict.
5. **EXPECTED:** A desktop user can read source-provided node, edge, and group labels at an approved minimum effective on-screen size without manual browser magnification. The preview makes sensible use of available PC graph-pane space, keeps full graph navigation available, and leaves labels fully visible with intentional group/edge clearance. It preserves original IDs, labels, projections and collapse behavior; no semantics are hidden or fabricated to improve appearance.

## Safe reproduction

1. Use the **actual Chromium** V3 isolated preview (`/v3-preview.html`) and the existing nested multilingual FlowSceneDocument JSON fixture shown in the browser suite; select declared variant `proposed`, no declared groups collapsed, first `Horizontal`, then `Vertical`. Capture screenshots at **900×600**, **1440×900**, and **1920×1080** with browser zoom at 100%. Do not substitute a static mock or legacy renderer.
2. At 900×600 inspect text at native 1:1 pixels. Record effective rendered node/edge/group glyph height (CSS px after canvas/SVG transform), character legibility, container bounds, visible labels and any required user zoom. Do not confuse pre-transform font declarations with effective display size.
3. At 1920×1080 vertical compare the graph bounding box with the actual available canvas/pane rectangle. Record width/height occupancy, unused space and any viewport-height clipping before proposing an adaptive composition.
4. At 1440×900 vertical inspect the `unresolved` text bounding box and neighboring nested-group border segment at normal zoom and during pan/zoom. Check for real overlap or clipping. Then collapse `scope` and verify the counterexample remains clear.
5. Keep this reproduction separate from the existing **CA059** official-ELK `e:yw` collision and **CA060** `style-src-elem` CSP failure. A screenshot captures a rendered moment; it is not evidence that the strict CSP or all browser checks passed.

## Pixel-reviewed evidence ledger

All paths are under `/workspace/scratch/7f30f1f647be/qa-screenshots-41083389952/` after extraction of Actions screenshot artifact **12989908371**. SHA-256 values identify the exact PNG bytes actually viewed, not a claim of remote test acceptance.

| Native Chromium screenshot (relative to extraction root) | SHA-256 | Visual QA |
| --- | --- | --- |
| `v3-preview-scaffold-native-6dba6-600-horizontal-and-vertical/ui-v3-900x600-horizontal.png` | `6b392c33202f36b35e16b707aa9edc86455321fcc09338678eb304b5f0f44471` | Expanded horizontal; microscopic captions, compact rendered scene. |
| `v3-preview-scaffold-native-6dba6-600-horizontal-and-vertical/ui-v3-900x600-vertical.png` | `05eedd87392b19a026eb299f0267494dcf0d8230cb56c17bd4a54d4e6a40be28` | Expanded vertical; tiny edge/node captions despite abundant side space. |
| `v3-preview-scaffold-native-9dece-900-horizontal-and-vertical/ui-v3-1440x900-horizontal.png` | `559b0560f8f645c12195658953aa8881959c77443a00a9f88c33d76287a7c874` | Expanded horizontal comparison; graph spans much of pane width. |
| `v3-preview-scaffold-native-9dece-900-horizontal-and-vertical/ui-v3-1440x900-vertical.png` | `d12f290abd46611cd4174709e5e4028b7a190844e4a7897d740ec50da4d59d67` | Expanded vertical; `unresolved` caption near nested orange border; clipping unverified. |
| `v3-preview-scaffold-native-9dece-900-horizontal-and-vertical/ui-v3-1440x900-collapsed.png` | `ba4160b87fa5bcd3d6c47531df02d688e74778a4261f65be61eb74ec2ca58af8` | Collapsed `scope` counterexample; compact, readable `next` and node/group text. |
| `v3-preview-scaffold-native-c01d8-080-horizontal-and-vertical/ui-v3-1920x1080-horizontal.png` | `56f89e817cd7489e4cd3eaa157c1777bf8c5b9022f0b5a53c49d7eba154b196f` | Expanded horizontal; substantial pane-width use. |
| `v3-preview-scaffold-native-c01d8-080-horizontal-and-vertical/ui-v3-1920x1080-vertical.png` | `f0dee0f1ee20725a65f6b8ad4cba43541b927059f042cd3d401e51e5961ed4a0` | Expanded vertical; graph roughly 512/1630 px, ~31% pane-width use. |

## Investigation and UX decision gate

1. **Read-only measurement first:** Inspect current preview CSS, X6 graph container, `fitToContent`/zoom/pan/ELK layout options where actually present, and Playwright viewport/device scale. Measure SVG/canvas matrix, rendered text boxes, graph bounds, pane bounds, node/edge/group line weights and contrast. Compare expanded/collapsed and H/V; isolate whether scaling, geometry, text styles or intentional aspect-fit drives each symptom. No root-cause attribution or permanent fix is yet established.
2. **Fresh engineering LLM Council before a redesign:** Have five independent technical/adversarial perspectives, anonymous peer reviews, EDO provisional position, targeted challenges/rebuttals and a recorded proposed verdict. Weigh legibility-first min-zoom/pan, alternative initial fit/viewport framing, adaptive ELK layout density, and responsive **desktop-only** pane composition. Compare a narrow verified change with any broader permanent UX correction; measure collision and semantic/regression trade-offs. Do not select by aesthetics alone or stretch graph nonuniformly without proof.
3. **Human approval gates:** BA presents actual desktop wireframes/interaction states, accessibility/readability targets and the Council recommendation for separate, explicit **UI/UX design approval**. After design approval, BA presents a versioned, bounded implementation plan with files, tests, ownership, rollback and acceptance gates, and obtains separate, explicit **implementation-plan approval**. A visual issue record, Council recommendation or generic user reauthorization does not substitute for either approval or authorization to alter this design.
4. **Issue-first and implementation restrictions:** BA may create/commit/push this CA061 task in the remote ledger only within authorized scope and must verify the remote SHA through the **GitHub plugin before code work**. Any GitHub plugin error, **including 404**, immediately stops all work; report through TL→PM→BA, and do not use Git CLI fallback. Once approvals exist, assign separate FE, QA and independent review ownership. Preserve CA059/CA060 scope and their separate task-specific commits.

## Proposed measurable acceptance and verification (targets require design approval)

- **Readability gate:** At 100% browser zoom and 900×600 H/V, programmatically enumerate all visible source-provided node/edge/group label boxes and measure **effective on-screen CSS pixel size**, plus a human 1:1 screenshot review. Proposed floor: label text at least **12 effective CSS px** and readable Unicode/multilingual glyphs. If long text forces overflow, use an approved navigation/zoom treatment; never silently omit labels, replace text, or pass by hiding the graph. Record the final human-approved threshold before implementation.
- **Occupancy gate:** Capture graph/pane bounding boxes for 900, 1440 and 1920 desktop H/V and collapsed variants. For 1920×1080 vertical, current screenshot baseline is approximately **31%** pane-width occupancy. Candidate design target: **at least 45%** useful graph or intentionally approved adjacent information area, while retaining complete navigability and legible text; exact composition and threshold must be Council-reviewed and explicitly approved by the user. Do not increase width by clipping the tall graph without usable pan/zoom.
- **Collision/clipping gate:** Zero unintended glyph clipping, text-to-text overlap, and label occlusion by group borders across all matrix states. Capture DOM/SVG text and boundary bounding boxes; proposed minimum **6 CSS px** label-to-border clearance, subject to approved visual spec. Specifically check `unresolved` at 1440 vertical and CA059 `e:yw` in its separate valid collapse/parallel fixture. Intentional edge strokes crossing group boundaries are not mislabeled as text collisions.
- **Behavior and security gate:** Preserve real Worker `register`→`layout`, real X6 SVG cells, original IDs/endpoints/labels, deterministic collapse/projection, keyboard pan/zoom, cursor-only no fresh layout, zero unintended API calls and no console/page errors. Never weaken strict CSP or acceptance assertions; CA060 security must independently pass.
- **Regression/CI gate:** Obtain pre/post DOM measurements and seven new pixel-inspected PNGs for the exact desktop matrix above, plus automated Playwright assertions on effective text size, bounding-box integrity and supported navigation. Preserve the previously green 74 browser cases; run relevant Node geometry/label tests and verify GitHub Actions **5/5 jobs PASS** (Ubuntu/Windows Node 22/24 and Chromium). No `DONE` until Council review, both human approvals, scoped implementation, independent QA, verified task-specific commit/push, and separate final acceptance gates.

## Current next state

**OPEN — SCREENSHOT-VERIFIED P1, NO SOURCE FIX.** Obtain design/Council authorization after code-path measurement. The issue can be filed in the remote task ledger only by BA's authorized GitHub-plugin path; this scratch draft is not itself a remote issue commit. Keep task files until explicit user implementation-completion approval.

## CA061 task-pinned upstream skill provenance

- **Retrieved/verified UTC:** `2026-10-30T16:43:23Z`.
- **Procedure:** GitHub plugin first listed the live `.agent-tasks` directory on `fix/react-layout-collapse` (CA051–CA060 present; CA061 absent). The plugin independently resolved all six canonical repositories' current default-branch `commits/HEAD` to full SHAs, then successfully fetched all **22 required prior-manifest instruction/reference files at those exact commit SHAs**. The six heads remained identical to the prior CA060 pin; 22 locally retained exact-revision files were SHA-256 rechecked against their verified manifest. This is a fresh **CA061 provenance check**, not permission to reuse a stale HEAD if it changes on another task. No GitHub plugin error, Git CLI fallback, remote mutation or new local skill-copy file occurred.
- **Uploaded user agent-team skill:** `upload/agent-team-skill(2).md` SHA-256 `6c2e6a18fcb6bcc61e733fb7ec9f218e3f6e86fff8aec890e873f2d49bc6bed1`; read in full.

| Canonical source | Current default-branch HEAD SHA |
| --- | --- |
| `obra/superpowers` | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` |
| `EmpRider/claude-skills-llm-council` | `a7565e21d5ab03551fe66e36818e05af245467b8` |
| `JuliusBrussee/caveman` | `9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4` |
| `DietrichGebert/ponytail` | `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846` |
| `ayghri/i-have-adhd` | `1ecea1993b7fce257ffbd686c070948b5e07eda6` |
| `alexgreensh/attention-span` | `8a6e2250dbc1dfb1b4186e03a92484d8c799c1b0` |

| Exact-revision cached instruction/reference file | SHA-256 |
| --- | --- |
| `attention/attention-kind.md` | `959c0ff96c80ae5f6c007618951cae339340ed586b3b1a7bb5970cf229344ece` |
| `attention/rundown.md` | `c78fd3f8e2c8e6a96515a48e4c32acef2dc6456cdec9aafadd5c53524bd19ced` |
| `superpowers/systematic-debugging/root-cause-tracing.md` | `75b933b6a8c40bdb2031b10f21654395b56ec6ab6bc7b018c18d3fe57aeb7fb8` |
| `superpowers/systematic-debugging/SKILL.md` | `51c6435d98c83c42c96ba7c35725a0b2c376cd487fb1a4e6bd0ddbe7e33ef202` |
| `superpowers/systematic-debugging/defense-in-depth.md` | `1e175fb86fc357e58c6aebf5441e481e1b7868b4380c0456b63a17eefbd18ba7` |
| `superpowers/test-driven-development/writing-good-tests.md` | `51471c853306ff92ca8bb41dcaea05f31c0e46b03651f8f3c99754b7172f4ae1` |
| `superpowers/test-driven-development/SKILL.md` | `64b03fce4aee5a97a93160cea8111f3ba13a17b7c001db4bd5836d67fd10705d` |
| `superpowers/requesting-code-review/code-reviewer.md` | `82e370be6b3447523816286195571e4216ba56ba1ad6ad0e87862294c4c78dcb` |
| `superpowers/requesting-code-review/SKILL.md` | `2180e14a448e9410bec88e6646a2d1f0ce7fdd58de27388c1e052e929679d2bc` |
| `superpowers/dispatching-parallel-agents/SKILL.md` | `1968923066f3b707eb01d1992cdf4c42284c3855f70253b9cd5000ff45fca13c` |
| `superpowers/finishing-a-development-branch/SKILL.md` | `8db5a922b242dd4e1bf824cb91c13b3e8d8e8a86d6ceaf7f0774eb9cce909d65` |
| `superpowers/verification-before-completion/SKILL.md` | `2befe7fc55bcadaa3d97dd9e8efeb633d2561c0ebe74c5a8b17c4d9e7e4520b3` |
| `superpowers/using-superpowers/SKILL.md` | `82c5c8866ad7f5dd4440ce66bd7806ba48a2f13771beae5cf112e53f08fe36ba` |
| `superpowers/executing-plans/SKILL.md` | `e4649e59880ef2643d1da128e3d607e87e3f969410d72095a5bf65811b6036dc` |
| `superpowers/subagent-driven-development/implementer-prompt.md` | `81dd9d5a3fb0b09b96b5829f03b9796842f3199ef7591d1ba1c2db2a515f64d0` |
| `superpowers/subagent-driven-development/references/preflight.md` | `3ea21c5fc1af1a190ac8a9d19ceb0849b47bf2ffe27b87dffcc21b6a0539776c` |
| `superpowers/subagent-driven-development/SKILL.md` | `ba41f697136cba88a7962d60c8e2f97488ba04a8688b1d0fbeb27f6953808e75` |
| `superpowers/subagent-driven-development/task-reviewer-prompt.md` | `bfed55c8f19d0ff6ed57b0fe09127c92890e9311c6c73917129598826bf9ebe8` |
| `council/SKILL.md` | `6387755b0cd0f069720549c7e81d90b724433d4ff46cb127271b902939ad586d` |
| `caveman/SKILL.md` | `415d43518f2b1a9498c15a445d4657117b129ee5e81b19454ce348439cc6672b` |
| `adhd/SKILL.md` | `88955c019bbb1419ff4b49dbb1f80a867467de6233d7865af2e06a7d7b76c7d3` |
| `ponytail/SKILL.md` | `9badd22a32e19cb884e46dfa8d3aae82bb81dfa5484105b8b4f0262df823a509` |

**Applicability:** Council is required before any new remedy or UX design choice. Superpowers systematic-debugging guides evidence collection; implementation/review skills and Ponytail become applicable only after actual approvals. Caveman constrains technical handoff style; ADHD and Attention Span apply to BA communication, not this private specialist draft.
