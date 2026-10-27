# Code Anime T7 — focused Engineering Council EDO verdict

**Date:** 2026-10-27 · **Status:** READ-ONLY technical recommendation to BA/PM/root; explicit owner task authority and GitHub file-ledger preflight still govern writes. **No repository, GitHub, source or test mutation by this Council.** Exact initial source baseline `08dfc5b1502dba58868940b5d4132cd0a7ff501e`; branch advanced to a docs-only status commit `65775a29c21f308a23c179601bdbd84e6be30e72` during review. Reconfirm exact head before integration.

## EDO decision — reviewed Task 7 option A (ONE new orientation key)

**APPROVE as a scoped, P2 static/mock MVP preference-persistence correction, pending authorized ledger-first execution:** Keep `code-anime-layout` owned by the existing **JSON panel settings** code in `public/player.js`. Change only the diagram orientation storage path in authored `public/diagram.js` to read/write a new validated `code-anime-diagram-orientation` key (`horizontal` or `vertical`), and update `tests/browser/player.spec.ts`. Rebuild and verify tracked generated `public/diagram/diagram.js`. **Do not change `public/player.js`**, other UI storage, user-flow tracing, analyzed project code, MCP schema, ELK dependency or Worker unless a failing regression specifically proves necessary.

This is not a new architecture choice: the exact reviewed plan `docs/code-anime-elk-reviewed-implementation-plan-2026-10-27.md:166–179` already specifies **one new key, old panel JSON retained, diagram.js + browser tests only**. The earlier Council provisional sketch of **two** new keys was **withdrawn** when that authoritative design constraint was read. A centralized versioned settings schema is broader and unjustified for one collision; it risks coupling independent diagram/player lifecycles and stale JSON read-modify-write collisions.

## Proven mechanism, not yet browser RED

`public/diagram.js:283–297` checks `localStorage.getItem('code-anime-layout') === 'horizontal'` and writes raw `horizontal`/`vertical`. `public/player.js:3049–3077` parses **the same key** as JSON for `inspector`, `timeline`, `traceWidth`, `console`, `diagram`, `sourceShare`; all panel saves rewrite that key as JSON. B0i source-extracts ran in shared Map-backed Node `vm` storage and reproduced both write-order losses: orientation→panel loses orientation after reload; panel→orientation loses inspector/layout settings. **This is confirmed source-mechanism evidence but NOT a genuine browser RED yet.** No analyzed user's application was executed; test target is Code Anime's own player.

## Safe one-key legacy migration contract

1. Read the **new** orientation key first; accept only exact enum `horizontal|vertical`. A valid new value wins over contradictory legacy data. If the new key exists but is malformed/unknown, choose safe default and **do not repeatedly resurrect stale legacy state**.
2. **Only when the new key is absent**, inspect the old shared key. If it equals raw `horizontal` or `vertical`, honor it and best-effort copy that orientation **once** to the new key. Do not delete or overwrite the old key. If the old key is valid JSON panel settings, ignore it for diagram direction, default `vertical`, and leave the panel settings untouched. Unknown/corrupt/null values are ignored safely.
3. Every later diagram orientation change writes **only** `code-anime-diagram-orientation`; every panel update continues writing **only** `code-anime-layout` through the existing `public/player.js`. Initial player `applyLayout()` currently does not itself persist defaults; verify no startup write corrupts valid legacy raw data during migration.
4. Catch `localStorage.getItem` and `setItem`/SecurityError independently. In-memory orientation change and panel controls must remain operational if reads or writes throw; persistent reload cannot be promised when browser storage is denied. **Previously overwritten preference bytes are mathematically unrecoverable from the single conflicting old key**; do not claim recovery or silently delete user data.

## Real tests and delivery gates

**Gate 0 — remote file-based tracker:** Before test/source edits, add/activate T7's task row or distinct B0i-fix subtask with expected/actual, exact key names, source/consumer paths, write-order reproduction, owner, P2, dependencies, RED→GREEN criteria, rollout/rollback and unknowns; GitHub connector task-specific commit/push, remote ref/diff verification. B0i remains **DONE diagnostic only**, not falsely DONE implementation. This T7 _MVP bugfix_ does **not** approve unrelated optional ELK T1–T9 architecture or public Worker distribution.

**Gate 1 — write RED Playwright first** (real current player, same origin, isolated fixture/session):

- `orientation→inspector→reload` and `inspector→orientation→reload`: assert actual `diagram-canvas.dataset.direction`, inspector `aria-expanded`/panel state, valid persisted values and **two reload cycles**. Current shared key should fail at least one preference in each order.
- Seed legacy raw `horizontal`, raw `vertical`, valid panel JSON; verify correct one-time orientation read/copy and **unchanged** panel JSON. New-key-vs-legacy contradiction uses new valid key. Corrupt/truncated/`null`/wrong-type new and old values must not crash.
- Make storage `getItem`/`setItem` throw or fail halfway; verify UI does not crash, controls remain functional in memory and no silent deletion. Actual timeline divider value (`aria-valuenow`), inspector, console/flow panel choices and orientation survive appropriate reloads. Exercise keyboard controls and desktop/mobile view semantics (a hidden mobile tab alone is not a lost persisted setting).
- Distinct keys cross-isolate: changing only direction never modifies panel JSON; panel updates never modify orientation. A controlled negative reversion of diagram's writer back to old shared key **must fail** the write-order tests.

**Gate 2 — implementation and checks:** Minimal authored `public/diagram.js` change, generated asset parity, independent code/test/security/accessibility review; focused RED→GREEN genuine Chromium (both viewport variants as applicable), full browser suite, `npm run check` and `npm run package:check` (Windows/Linux Node 22/24 CI) at **exact pushed HEAD**. Commit/push one T7 task slice with descriptive evidence; mark DONE only on verification, not merely because latest prior CI was green.

**Rollback:** Revert only new orientation-key source/test changes if a verified regression occurs; **never delete** old panel/legacy key or unrelated persisted preferences. New key may be ignored by an older binary after rollback, possibly restoring its former collision, but existing panel JSON remains intact. No new dependency/license, runtime recorder, analyzed-project execution, npm publish, merge or release is authorized.

## Focused Council and objections

The prior full engineering Council architecture and B0 reconciliation were already completed; this is a material **issue-specific amendment**, not a fabricated new five-plus-five vote. An accountable EDO traced both writers and legacy consumers before taking a provisional position. Original independent QA and Devil's Advocate advisors were separately re-engaged. Both initially proposed broader **two** dedicated keys, then read the pinned reviewed Task 7 file and **explicitly conceded** the mandatory one-new-key alternative is sufficient and safer. The EDO **accepts** their RED, legacy, corrupt-storage and negative-test concerns; **rejects** broader two-key migration and versioned centralized schema absent independent failure evidence. Unresolved: full Chromium reproduction/acceptance and owner gate; no claim that VM proof equals browser GREEN.

**First action:** BA/root remotely push verified T7 ledger preflight, then write the two-order browser RED tests. Only after the RED is observed may the implementer patch diagram orientation storage under the reviewed one-key contract.
