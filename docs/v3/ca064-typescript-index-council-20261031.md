# CA064 — TypeScript indexed-access CI2 blocker, engineering Council archive

**Stage:** `EDO_FINAL_SIGNED / LOCAL_ARCHIVE_FOR_INDEPENDENT_QA_SECURITY_REVIEW / HUMAN_AUTHORIZATION_OUTSTANDING / NOT_DONE`. This is a read-only preservation archive, not a GitHub/repository publication, code instruction, or human sign-off.  
**Actual EDO final:** `/root/pm/tl/ca064_edo_blind`, signed **2026-10-31T03:31:43Z UTC**, `tmp/ca064/council/edo/final.md`, SHA-256 `53b95cd19586fc64d5280ea80dbb19ec4032e7fddf62743cc0f555e9bb619be0`. Council verdict is **PROPOSED** only.
**Repository/branch/source:** `EmpRider/code-anime`, `fix/react-layout-collapse`, exact official CI2 commit `d1c050a5b98bd4bdafdb7182933e4f6b00646bf6`; frozen test SHA-256 `7ccfb0849bcdc11788d3bd3a1f4a69fb825ddc40e0a58e8443d6fdd08f2c0fbe`.  
**Task-pinned skills:** `tmp/ca064-skills/manifest.md` SHA-256 `b51068ff07b61ac2eea3134b0313ede0588157f84785f24ba90f508184156f00`; six canonical fresh default HEAD/tree verifications, 18 matching full-file hashes, zero GitHub plugin errors at pin time.  
**Input brief:** `tmp/ca064/council-neutral.md` SHA-256 `84c340d1411db7d4ba0786231fc36b023bfb63a8eb01c58d89cb4ad2cd48b9be`. User-attached Agent Team skill SHA-256 `6c2e6a18fcb6bcc61e733fb7ec9f218e3f6e86fff8aec890e873f2d49bc6bed1`.

## Decision question and factual basis

Which smallest permanent test-only correction for TypeScript `TS2532` at `tests/browser/v3-label-association.spec.ts:135:30`, if any, is warranted while preserving strict CSP matching/fail-closed behavior? Human authority over implementation, issue-first push, branch-trigger/CI3 budget, and CA060 policy remains separate.

**OBSERVED:** `classifyCsp` builds `matchingStyles` with one outer entry per `candidates` event (`:110–124`); `countMatches(0)` increments by one, returns at `eventIndex === candidates.length`, then indexes `matchingStyles[eventIndex]` (`:129–148`). The array is not mutated during search. `tsconfig.check.json` includes tests and extends `strict` plus `noUncheckedIndexedAccess`; lockfile TypeScript 5.9.3. Source-level induction makes a real undefined index **unreachable under current synchronous construction**, so a runtime fault is **UNVERIFIED**. An older baseline contains the identical expression at line 134 before CI2's Vite resolver change; one new import shifted it to 135.

**BA-REPORTED, NOT INDEPENDENTLY REPLAYED:** Official CI2 Actions run `41159899754` reportedly failed all four OS×Node `check` jobs with `TS2532: Object is possibly 'undefined'` at `(135,30)`; fifth browser job also failed for distinct reasons. Local browser ZIP does not contain original Node check logs. Reported build gate impact can support candidate `P1` **only for release-check blocking**, not for demonstrated production runtime, data loss, or CSP exploitability.

**Scope:** One Playwright smoke-test helper, called once at `:502`; caller at `:504–511` checks recorder overflow and `csp.unexpected`. Preserve positive exact X6 source-linked unique assignments, `usedStyles` nonreuse, ambiguity rejection, 20,000-search cap, foreign violation rejection, and the existing security status `SEPARATE_RED_NOT_VERIFIED_BY_CA059`. Existing original CA059 geometry, CA060 CSP/security, CA061 UX, CA066 label comparator, CA067 offscreen and FE production/release status are not cleared by this task.

## Genuine Council chronology and perspectives

1. **Blind EDO provisional first:** `tmp/ca064/council/edo/provisional.md` signed 2026-10-31T03:17:18Z; explicitly preferred conditional Option A with B as a credible alternative and D/STOP as execution state; no advisor/peer opinions yet.
2. **Five genuine independent original advisors:** A1 Architecture/Reliability, A2 Implementation, A3 Reliability/Security, A4 QA/Verification, A5 Devil's Advocate independently submitted `tmp/ca064/council/advisors/a1.md` through `a5.md`. All characterized the `noUncheckedIndexedAccess` type proof gap, runtime absence unverified, and conditional narrow A while D governs present no-write status. A5 emphasized zero-event/foreign-style vacuity and CA060 separation. These are proposals, **not five implemented fixes**.
3. **Blind packet and five genuine anonymous peers:** `tmp/ca064/council/anonymous-peer-packet.md` froze five role-free proposal letters A–E (SHA-256 `514bf88df586c055b1f8cbf7a24ecace1bb41eca99c98a594cabde7dacd2be28`). R1–R5 independently reviewed the packet without original identity mapping, originals, EDO, or other peers. Three selected anonymous B as strongest skeptical coverage; two selected E for exact typecheck RED/negative-characterization distinction. Rankings are **not decision votes**. The confidential identity mapping is retained separately for TL/EDO audit, not reproduced here.
4. **Owner-led discussion:** `tmp/ca064/council/edo/challenges.md`, signed 2026-10-31T03:28:23Z and updated 03:28:46Z after R4's format-only revision, posed **three targeted disputes**. The same five original advisors actually replied in `tmp/ca064/council/rebuttals/a1.md` through `a5.md`; the actual signed EDO final subsequently accepted/rejected/left unresolved the points below.

## Technical dispute and rebuttal record — final EDO disposition

| EDO targeted challenge | Genuine original replies | Key evidence and EDO disposition |
| --- | --- | --- |
| **1. A's fail-closed guard versus B's assertion** — hypothetical absent entry *after* a previously completed match | A1, A2, A3 | **ACCEPT** A's sticky `ambiguousOrOverLimit=true` branch proof: it falsifies `matchingAssignments === 1 && !ambiguousOrOverLimit` at `:149–153`, leaves `knownSeparateCA060Signature=[]`, and puts every captured candidate/event into `unexpected`. Present-but-empty `[]` remains valid zero matches. **REJECT** claim B would silently exempt CSP: its `!` still throws on undefined, and Playwright catch rethrows, also fail-stop. **UNRESOLVED** until verification: A's structured diagnostic advantage versus B's smaller diff/flag-name overload. |
| **2. Genuine RED and practical negative controls** — avoid artificial mutation seam, cap-test overclaim | A2, A4 | **ACCEPT** that only genuine target RED is exact pinned TypeScript 5.9.3 `TS2532`; all CSP controls are pre/post **characterization**, not fabricated runtime behavioral RED. Same-file literal fixtures can test unique 1×1 and 2×2 mappings, style reuse, ambiguity, wrong hash/source/1500ms boundary, foreign script, and vacuity. **REJECT** contrived unreachable-index mutation seam and claim that 2×2 ambiguity proves 20,000 cap. **UNRESOLVED** compiler replay, Playwright server-hook costs and actual test outcomes, all unexecuted. |
| **3. Zero-event foreign style and CA060 policy** — is this CA064 veto or separate contract? | A3, A5, supported by A2 | **ACCEPT** vacuous attribution concern: `classifyCsp([], [foreignStyle])` yields `unexpected=[]` and misleading `SOURCE_LINKED_X6_CORE_ONLY` despite no source proof. **REJECT** as CA064 TS remedy veto: no *reported* violation event was thereby exempted and current caller asserts reported events only. A constructed foreign report meeting hash/length/basename/timing heuristics could false-exempt at input level, **not observed as Chromium exploit**. **UNRESOLVED** separate CA060 security/product policy for unreported insertions and provenance strength; no CA060 GREEN. |

## Competing proposals before final owner outcome

| Proposal | Potential advantage | Principal risk / status |
| --- | --- | --- |
| **A — explicit `undefined` index guard and sticky fail-closed flag** | Type-narrows indexed iterable; local test helper; structured `unexpected` behavior if invariant ever breaks | **#1 EDO conditional future scoped preference**; branch currently unreachable by valid input, flag name overloaded, exact RED/GREEN and unchanged positives/negatives needed. |
| **B — non-null assertion or explicit invariant assertion** | Minimal source/compiled JS impact; current runtime invariant supports it and undefined iteration would fail-stop | Bare `!` erases compiler protection for future drift; explicit throw changes diagnostic semantics. |
| **C — structural association refactor** | Could structurally encode bounds | Larger security-sensitive DFS change risks bijection, ambiguity, cap, unrelated CA060 policy. No current runtime breach demonstrated. |
| **D — STOP/gather exact evidence** | Honours present authorization and uncertainty | Reported TS gate remains RED. **Mandatory current execution posture**, irrespective of later proposed remedy. |

## Signed FINAL proposed EDO decision — conditional A, D/STOP now

The accountable EDO **retained the blind preference after authentic peer review and direct original-advisor rebuttals**: **conditional Option A**, a narrow **test-only** `matchingStyles[eventIndex]` entry read with `undefined` guard and `ambiguousOrOverLimit = true` before return. A present `[]` remains a valid no-match array. A's structured negative classification offers a future maintenance/diagnostic benefit, not a measured present runtime-security advantage over B. **Option B** (`!`) is credible fallback because an actual undefined iteration throws and current harness rethrows; choose only if A fails proof/diagnostic expectations. **Option C** larger security-sensitive backtracking refactor is not supported by observed shared root cause. **Option D/STOP remains the actual current action** without human authority, exact compiler RED, and focused verification.

**Static cause confidence:** high-confidence source/config inference that `noUncheckedIndexedAccess` cannot establish the recursive numerical bound. A true runtime missing array entry is **UNVERIFIED** and appears unreachable in current synchronous code. Four Node check-job failures are **BA-reported**, not independently fetched/replayed. **Severity:** provisional **P1 CI/release gate impact** only; no verified production incident, CSP exploit, or user-data loss.

**No execution yet:** Proposed ordinary correction is to bind the indexed local array, mark only `undefined` as sticky unresolved, and iterate the present array. The **exact read-only/unapplied candidate diff** is `tmp/ca064/ca064-minimal-proposed.diff`, SHA-256 `4f6cf5082e6e1bf02a18e5a647b38f4b8e5897fdf9093e27266695cc55c5c3b7`; companion proposal notes SHA-256 `a8e96ecbafbf3c9dab7adc7093f6d258aa50b178eb2135f6bfac25a1e568377d`. It has **not** been applied to source, executed, tested, committed, pushed, or authorized.

**Validation/rollback if later permitted:** obtain verbatim official CI2 Node logs and fresh exact-`d1c050a` TypeScript 5.9.3 old-source **RED**; if absent, STOP. After approved A, same `npm run typecheck` GREEN, `npm run check`, relevant focused Playwright helper controls and adversarial negatives, exact one-file diff/format/independent QA/Security review. Existing pre-change CSP negatives are characterization, not false runtime RED. Revert only the guard hunk and separately approved tests if diagnostics or classifications regress; retest under the approved budget. No production CSP policy change, public API, Worker, renderer, persisted data or migration is justified by CA064.

## Non-negotiable execution and human gates

1. **Human YES/NO Gate 1 (separate CA066 local-only):** “Do you authorize **one bounded CA066 local browser rerun**, using a task-only HTTP overlay for `/vendor/elk-worker.min.js`, **no** copy into symlink/public directory, production source change, or CI trigger?” This is **outside CA064's technical verdict**; no authority exists until an explicit YES and CA066 safety conditions.
2. **Human YES/NO Gate 2 (CA064 tracking, guard, verification, CI3 and exceptional batching):** “Do you authorize a **distinct CA064 issue-first ledger**, using a tracking-only `[skip ci]` push **only after explicit branch-policy/required-check approval and verification**; then a reviewed **CA064-only A guard** and focused checks, coordinated with separately tracked CA066 work for **one proposed combined reviewed source push and at most one reserved CI3 run, zero retries**?” The attached Agent Team skill normally requires task-specific, **separately pushed** completions, so this also needs an **explicit exception/waiver** to combine two tasks in one source push. A NO, unverified skip/branch policy, absent distinct task traceability or absent batching waiver means **HOLD**. Neither Gate 1 nor Gate 2 has received human approval.
3. **No issue-first remote action now.** Scratch task proposal `tmp/ca064/issues/.agent-tasks/CA064-fe-v3-csp-matcher-typescript-indexed-access.md` remains LOCAL ONLY, not pushed. BA must check `CA064` candidate uniqueness against current remote tree before any publication. Every push normally triggers `.github/workflows/ci.yml`; `[skip ci]` is a potential policy change, not a safe assumption. **Current `CI3_HOLD_CA064_HUMAN_GATE` means NO CA066 implementation push and NO CI3** even if the technically proposed guard seems sound.
4. **After distinct authority**, use exact compiler **RED→GREEN** evidence, narrowly scoped classifier-positive/adversarial-negative characterization, independent QA/Security semantic and exact diff review, and full approved gate observations. A typecheck GREEN is **not** CA060 security PASS, fifth-browser-job PASS, all five CI jobs GREEN, CA066/CA067 completion, or release GO. Task stays `NOT_DONE` until independently verified and separately human-approved completion.
5. BA alone communicates the proposed EDO outcome to user through the EDO→TL→PM→BA relay, adapting the Council skill's direct-presentation step without inventing human sign-off.

## Frozen supporting receipts (SHA-256; scratch local)

| Artifact | SHA-256 |
| --- | --- |
| EDO pre-advisor provisional | `2b80a36decee44958f637b91e0c5b55980c2df8ad6dd5833aab01466602099a3` |
| A1 original advisor | `64d4fdb134a860854c6b56b70bd8a71c0c74d4c6c87f5add5878af57ca8917bf` |
| A2 original advisor | `9b8bb8e0e881204edf3b0934f36d70b158a353656a4562b7a54ba033b5a04a22` |
| A3 original advisor | `cc5dd962583f0cbdcef1dcad50a29f79f08b30719d4cf28f7739c6e82151f383` |
| A4 original advisor | `5b7bc50d1b85de76dea75027e439ec6d1641222d57c5acfb93826630499632ad` |
| A5 original advisor | `665256dc0bb6fde875b536c67f78e0f68bab50537de722f7506da0e870699cee` |
| Anonymous A–E packet | `514bf88df586c055b1f8cbf7a24ecace1bb41eca99c98a594cabde7dacd2be28` |
| R1 blind peer | `2bf94384d01960177854ceeebb8f3697ca566bec6171449fb7174a843ad825a9` |
| R2 blind peer | `c2ed5b010116b21d3d2f947617a146dd1839dee81d4427952f46c22a8c5a979a` |
| R3 blind peer | `f03aeef41e912ea43eeac642581ed666d8adb6f624f790b0b7d639a08794cc03` |
| R4 blind peer final | `a3f5561c3c23c6286af0fe7b65c58c247e9ff30dd30266ceb80cc3161b1028b7` |
| R5 blind peer | `38eab06f0a1140792ff37478e1ec6d3e017f903f3c053f195edc4cea2ca7fb16` |
| EDO three targeted challenges | `a9438ce1770480a2c55648d883969fdbb42193caed4741b15e535a0f1b508e3f` |
| A1 original rebuttal | `525c837134904f88ee750dfca8cc13d49e72b536248a2b3a63c2f350a3890606` |
| A2 original rebuttal | `589a18365798f6e050a20d114c5eb21e3ea1353490e3e782a35db312f5bb881b` |
| A3 original rebuttal | `2d5326f5df8ece12de521d9ff0cf6927aa855be61a0963fdb3928ecbfab17a50` |
| A4 original rebuttal | `c3525126707445006f0d970ee57e0ef4ba39b56fa17fb11a33bad29a801c2444` |
| A5 original rebuttal | `bf8632076d0f03f466c7100061d25a8bdd4d301871c19922e5fa31d252695b16` |
| **Signed EDO final** | `53b95cd19586fc64d5280ea80dbb19ec4032e7fddf62743cc0f555e9bb619be0` |
| **Exact proposed, unapplied diff** | `4f6cf5082e6e1bf02a18e5a647b38f4b8e5897fdf9093e27266695cc55c5c3b7` |

**Archive sign-off/provenance:** Based on **actual EDO-signed** `final.md` and genuine 5 original advisors / 5 independent blind peers / 5 original rebuttals. It is a **proposed** technical verdict, not human approval. Archive is scratch-only, not committed/pushed or independently QA/Security-approved yet. No source/test/compiler/build/CI/GitHub/plugin/Git action by archive specialist.

## Later human YES/YES authorization — 2026-10-31, recorded 03:47Z UTC

**Chronology supersession only; original EDO verdict and earlier `D/STOP` were accurate at signing.** BA→PM→TL now relays the human answered **YES to both separately presented questions**. The original human reply time beyond this relay was not provided; this archive's date/time is the recording checkpoint, not a claimed original approval timestamp.

- **Q1 CA066 local-only YES:** Exactly one task-owned local browser rerun, **zero retries**, with a test-only HTTP overlay for `/vendor/elk-worker.min.js`; no symlink/public worker copy, production source mutation, or CI. This is separate CA066 scope and cannot serve as CA064 or CA060 security acceptance.
- **Q2 CA064 gated YES:** A distinct proposed CA064 issue-first ledger/documentation push by **BA alone**, with `[skip ci]` **only after explicit branch-policy and required-check compatibility verification and proof of ZERO Actions for that tracking-only push**. BA must also verify `CA064` candidate ID uniqueness/current remote task tree and the remote tracking reference. Only **after** successful issue-first may the EDO's minimal conditional **A** guard and CA064 test-helper checks/TypeScript RED→GREEN move to implementation and independent QA/Security review.
- **Explicit narrowly scoped exception granted:** The human approved **one** reviewed **combined CA066+CA064 source commit/push**, despite the attached Agent Team skill's normal one-task/one-push delivery requirement. Both issues and independent acceptance evidence remain distinct; this waiver does **not** extend to other tasks. That source push may trigger **the sole reserved CI3 five-job cycle, zero retries**. An unverified skip policy, unintended tracking-push Actions run, incomplete branch/QA/security checks, or lost task traceability requires STOP/escalation, not assumption of permission or success.
- **Status now:** `HUMAN_APPROVED_PENDING_ISSUE_FIRST_REMOTE / NOT_DONE`. No remote issue-first confirmation, approved code/test execution result, browser capture, CI3, or five-job green evidence is supplied in this local append. Original CA059 geometry RED, CA060 CSP/security RED, CA061 UX OPEN, CA067 offscreen UNTESTED and production/release NO_GO persist. A remains a *proposed technical choice* until implemented and verified; the Council recommendation's original evidence and dissent are unchanged.

**Signed EDO final remains immutable:** `tmp/ca064/council/edo/final.md` SHA-256 `53b95cd19586fc64d5280ea80dbb19ec4032e7fddf62743cc0f555e9bb619be0`; this addendum records **subsequent human authorization**, not an edit to the EDO's signed decision.

## Later CA067 factual viewport-evidence supersession — 2026-10-31, recorded 03:49Z UTC

The original Council's and earlier archive sections' **“CA067 offscreen UNTESTED”** reflected the **pre-capture chronology**. It must **not** be repeated as CA067's current observational status: one exact-`d1c050a`, **900×600 CSS-pixel**, real Chromium/Worker/ELK/X6 local capture subsequently recorded five native DOM/rectangular-clipping states: baseline fit → all five label boxes fully offscreen after pan (same-edge DOM/text/path retained) → exact inverse pan/byte-identical baseline PNG recovery → two partially clipped parallel labels → zoom to all five geometrically outside. Positive DOM rectangles were proven insufficient to indicate on-screen visibility; the measurements prove **rectangular intersections for this fixture**, not masked/rotated paint or user-readable glyphs.

**Freshly verified signed receipts:** Capture owner `tmp/ca067-capture/CA067-one-shot-browser-capture-20261031.md` SHA-256 **`91d840a8d27f4d6fe4672a6c23db20dc6ee640fa732ea03287e53c13f4e5bd94`**; independent QA `tmp/ca067-capture/reviews/qa.md` SHA-256 **`0d04c475ffbed5519b5ba4f217a2e6b3251fadbe9c4ed50207ceff394c067acd`**; independent UX `tmp/ca067-capture/reviews/ux.md` SHA-256 **`d9dd8360374b0749ef54a05527b2141432761c5532a0f9f4c97ad97075e5fc8c`**. QA and UX independently signed **`EVIDENCE_GO` for the narrowly observed five-state rectangular sequence**, but **`ACCEPTANCE_NO_GO / PRODUCTION_NO_GO`** for generalized automated viewport visibility, pixel/ink oracle, occlusion/masks/rotation, text legibility, accessibility, or full V3 shell acceptance.

**Current status correction:** `CA067_CAPTURE_OBSERVED / GENERALIZED_AUTOMATED_TEST_UNIMPLEMENTED / PRODUCTION_NO_GO`. No general visibility test was created or run merely by taking the capture. This does **not** alter CA064's conditional A recommendation, any prior human approval scope, immutable EDO verdict, or the **CA060 CSP/security RED**, original CA059 clearance RED, CA061 UX OPEN and FE production/release NO_GO. No source/GitHub/plugin/CI3 or new browser execution was done by this documentation specialist.
