# Code Anime ELK/X6 technical handover

**Date:** 2026-10-28. **Branch:** `fix/react-layout-collapse`.
**Verified T9 source checkpoint:** `688169e1518cb59ee579263f6795e909e181b709`.

This is an implementation and non-browser test handover, **not final
owner acceptance or release approval**. The latest documentation-only
commit may be newer than the source checkpoint.

## Implemented and verified technically

- T2: pure mock source-grounded compound topology, typed evidence routes,
  stable event/visit identities and conservative unresolved handling.
- T3: deterministic build/installed-MCP packaging of original pinned
  ELK Worker, with notices and source-availability metadata.
- T4: nested ELK Worker geometry, request/epoch/abort/error guards.
- T5: existing X6 HTML card controls, selected loop/branch frames and
  source-status annotated directed call/return arrows.
- T6: synchronous render entry, stale response/cursor/focus/viewport guards
  and atomic multi-method geometry.
- T7: orientation/panel preference storage separation (historically DONE).
- T8: compact PC source + trace viewport, desktop-follow source centering,
  icon-only diagram group accessibility labels.
- T9: synthetic static/mock-only 76/500/1000 event topology Node checks.

All trace values remain labeled simulated; the analyzed user application
is never executed to construct the animation.

## Automated checks we can verify

[GitHub Actions run 40704303758](https://github.com/EmpRider/code-anime/actions/runs/40704303758):
all four **non-browser** check jobs passed on Ubuntu and Windows
with Node 22/24. Clean install, scope/typecheck, build, Node tests,
formatting and installed package verification were included. Three
named T9 synthetic scale tests passed in Ubuntu 24 logs.

Neither jsdom, test-double Worker, nor the successful Node matrix
proves native browser rendering, actual 200% zoom, memory or frame
performance. Those results are **OWNER_PENDING**.

## Owner's local browser checklist

- [ ] Run the current branch in the ordinary local MCP/player setup.
- [ ] At 1366x768 in DOWN and RIGHT layouts, inspect five-line source
  context (active ±2) and approximately four timeline entries.
- [ ] Repeat at **real browser 200% zoom**; verify scroll, controls,
  clipping, keyboard focus, overlays and tooltip clearance.
- [ ] Expand/collapse nested method/loop/branch/try/finally frames;
  validate arrow direction, returns, statuses and no phantom paths.
- [ ] Check visit/invocation selects, Values panels, source navigation,
  stack/console/breakpoints and reversible playback at repeated steps.
- [ ] Test pan/zoom/explicit Fit while Worker results are pending.
- [ ] Replace or continue a trace while Worker is pending; old geometry
  must not show as current; failure must be visible.
- [ ] Inspect light/dark/reduced-motion and existing mobile behavior.
- [ ] Compare real 76/500/1000-event rendering, memory and interaction
  performance; thresholds have not been independently established.
- [ ] Provide Chromium/Playwright E2E feedback and reproducible
  screenshots or steps for any failure.

## Remaining issues and review boundaries

- **T1:** valid regex-literal brace can lead to conservative unresolved
  grouping; previous unsafe quick fix was rejected. Source-parity
  investigation for old checked-in versus freshly built bundle is open.
- **T3:** independently proven exact Java/GWT corresponding-source and
  third-party provenance mapping is open. The owner stated licensing
  is settled, but no certification is asserted here.
- **T4/T5/T6/T8/T9:** final native browser and owner acceptance pending.

Do not merge, publish npm, deploy, release or delete temporary task
tracking documents until separately authorized. See active ledger
`docs/elk-implementation-kickoff-tasks-2026-10-28.md`.
