# CA054 — Fail closed on malformed ELK Worker registration ACK

Status: DONE — strict Worker ACK source/tests pushed, independently reviewed and fresh branch CI verified; CA029/CA030 OPEN
Priority: P1 FE V3 G0 protocol correctness blocker; no observed live production outage/security exploit
Branch: `fix/react-layout-collapse`
Owner: FE V3 geometry developer; independent QA and Worker contract reviewer; TL technical supervisor; PM delivery
Dependencies: CA052 DONE, CA053 DONE; CA029 G0 and CA030 isolated preview blocked until CA054 verification
Approval: FE V3 implementation approved; no CA031 cutover or MCP/backend changes. Council: five independent advisors, five anonymous peers, EDO direct Devil/Reliability challenge; local record `ca054-worker-council-20261030.md`.

## Observed versus expected

- OBSERVED: `public/v3-scene-geometry.js:318–336` receives same-ID `{id,notAnAck:true}`; guard rejects only `data`/`error`, marks Worker registered and posts `layout`. Synthetic FakeWorker probe: `{"registration":"register","dispatchedUnexpectedLayout":"layout","terminated":false}` before manual disposal. No analyzed user code ran.
- EXPECTED: malformed registration fails closed with `Malformed V3 ELK registration ACK`, rejects Promise, terminates Worker, clears timeout/abort listener, dispatches **zero layout**. Exact `{id}` ACK advances once.

## Root cause and protocol evidence

- PROVEN: first-phase ACK guard accepts arbitrary extra keys.
- Vendored `public/vendor/elk-worker.min.js:6234` sends `postMessage({id:b.id})` for register and `{id:b.id,data:b.graph}` for layout. Custom `workerUrl` configurable; external metadata ACK contract unverified.
- Scope `public/v3-scene-geometry.js` onmessage guard and `tests/v3-scene-geometry.test.mjs` only; no new deps, legacy player, server, MCP or vendor rewrite.

## Council-reviewed remedy and alternatives

- Decision A: require non-array object, matching **own** `id`, exactly one own key `'id'` (`Object.hasOwn` + `Reflect.ownKeys`) within bounded `try/catch` covering property inspection. Invalid shapes/throwing getter/Proxy route through existing one-shot settle malformed-ACK rejection/cleanup. No layout before validation.
- Reject B arbitrary extra ACK metadata tolerance (preserves bug); defer C versioned handshake redesign (not justified for pinned vendor). Future supported custom Worker metadata needs explicit review.
- Five independent advisors/peers favored strict A conditionally. Peers identified `Object.keys` enumerable-only hole and injected getter/Proxy throw; EDO challenged Devil/Reliability and accepted `try/catch`. Exotic cases synthetic robustness, not live exploit proof.

## TDD acceptance

1. RED FakeWorker `{id,notAnAck:true}` unexpectedly posts `layout`; GREEN rejects with ACK error, terminates, exactly one register and zero layout posts, cleans timers/listeners.
2. Reject own enumerable extra, symbol/nonenumerable extra, inherited/missing/wrong id, arrays/primitives, `{id,data}`, `{id,error}`, getter/Proxy inspection throws; stale/repeated/cancelled responses safe.
3. Positive exact `{id}` ACK then `{id,data:validElkGraph}` yields one layout and success; genuine Chromium Worker integration at isolated V3 preview gate.
4. Existing geometry/Worker+adapter suites, Prettier/syntax, full Ubuntu/Windows/Chromium CI pass; independent QA/reviewer signoff.
5. Source/tests commits remote byte-verified; mark DONE only after CI green and separate verified DONE ledger commit.

## Risk and delivery

Strict ACK rejects undocumented custom Worker metadata; pinned vendor unaffected. Revert isolated CA054 commit if protocol evidence changes. CA029/CA030 remain OPEN until V3 Chromium/visual acceptance.

## Verified delivery

- Issue-first task commit `ec56983a4a0e0b8601d507600314282fd48128c8` preceded code.
- Worker geometry source fix `894b01e65458437bb7388ab9605732c2b2b24de8`; regression tests commit `ac8b440407b04bef828706ff12ceb33622a6dfd2`, both remotely re-fetched byte-identical to QA-reviewed staging.
- TDD RED malformed ACK cases → GREEN **27/27** geometry/Worker tests (11 malformed/protocol scenarios plus timeout recovery), independent QA and code review PASS; adapter 26/26 PASS; Node syntax and repository Prettier PASS.
- Durable [CA054 engineering Council decision](../../docs/v3/ca054-worker-council-20261030.md) at `9daa2e26867e829de4fc9c5c9efeb37f71b7edca`.
- Initial CA054 code commits' CI inherited the unrelated Prettier error in CA030 Council Markdown. CA056 fixed this in `be6da80ed57515243592deb12a956d82297fda07` and closed at `60ca9f66fc3dd241b861918888b351d863438bde`.
- Fresh descendant GitHub Actions [run 41045854664](https://github.com/EmpRider/code-anime/actions/runs/41045854664) **completed/success, 5/5 jobs** (Ubuntu Node22/24, Windows Node22/24, Chromium browser).
- Genuine V3 Chromium Worker test still PENDING_CA030; CA029 G1 collapse projection and CA030 isolated visual preview NOT DONE. Legacy browser suite does not establish V3 E2E.
