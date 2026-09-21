# Windows 1.0.5 Declarative runtime and end effects

This is an implementation and differential-verification record, not a claim of full-game or full-video equivalence. Only supplied Windows 1.0.5 Demo behavior is used.

## Implemented surfaces

`src/native-script-hooks.ts` maps all **32 exact DeclarativeList registry keys**, independently from character appearance and base personality. Hook state, phase counters, tool-use flags, and pending callable chunks are JSON-serializable. It handles price, card, private assumption, tool, player acceptance and player refusal, including the first-three-day Darcy/Hue/condition/material tutorials. The original creation path removes ordinary tick pipes for a registered script; the local runtime does the same.

The controller supplies `native.scriptId` from the StoreEvent ID. Every native transition may append `{type:'chunk', id}` to `native.scriptEffects`. The controller calls `drainNativeScriptEffects`, commits its returned state, then executes effects in order with the original event chunk interpreter. Draining consumes effects exactly once. A script may issue a chunk while leaving the transaction open; the controller must not convert every refusal to settlement. `declineNativeDeal` returns the resulting state and whether a script handled the refusal. A Darcy tutorial acceptance intentionally ends as failure with the `accept` chunk; it transfers no item.

The existing separately tested `story-appraisal.ts` handles the four complex legacy brand/art/private closure families; the native adapter supplies native beliefs and overrides post-proof fake routing with the ordered native pipes. No recorded DLL outcome is read by runtime code. A few original literals have surprising spellings (`blue_art_good`, `blue_art_bad`); they are preserved instead of silently corrected.

## Differences found by actual source execution

* `Customer.declineCard` removes the proposed ID from current customer beliefs, even when previously accepted.
* `Infoscreen.assume` prepends a card and then removes the old matching ID. Repeating an identical private ID removes it. It differs from `Infoscreen.accept` and tier-based refinement.
* `IO.onPlayerAssumeCard` calls the hide hook before adding the card. The jewel scanner calls that same path. `Haggle.playerHideCard` and `IO.onToolUse` do not append the negotiation context; their diagnostics now go to `native.actionLog` instead.
* `Haggle.clearContext` leaves status, hook closures and tick pipes intact. A scheduled action subsequently evaluates its original context-length guard; clearing context must not reopen a settled transaction.
* Original `Report.reportPlayer` checks `NextDouble() <= 72.5`, which always passes after the actual eligibility predicates. It is not a 72.5% probability. The `under75` guard's key contains a leading space: ` charCbokhoAsk`.
* The report-under-30 scan skips prices newer than its first PriceStamp. The implementation preserves this source behavior and tests both sides of that boundary.

## End-of-haggle contract

`nativeHaggleOutcomeEffects(haggle, success, liveGlobals)` returns `{contexts, visitorsDelta, evidence}`. Apply once at committed settlement. It includes buyback promise, imprecise appraisal/precise correction, pending visitors, fraud, Fixie deal counts, red-card use, below-75 conditions, insist stack/last transaction, shakes, Junuk/SingSing effects, reporting/badge state, first fake, and PreAvarice3's success condition. This replaces the standalone modifier-outcome patch. Cash, ownership, Appraised and Trusted remain in the existing controller/reputation settlement and must not be applied twice.

## Independent evidence

Source: `HoochooGames.NoUmbrellasAllowed.dll`, SHA-256 `8fd9303d81d3a086fd0aade914c0eea31c1017f7865e1a94fc7451a6a3ed56c3`.

* `reference/original-study/npc/script-probe/Program.cs` calls original `CreateHaggle.createHaggle`, `IO.onPlayerAssertPrice`, `IO.onPlayerAssertCard`, `IO.onPlayerAssumeCard`, `IO.onToolUse`, and `IO.playerDeclineDeal`.
* 168 original-DLL scenarios cover all 32 registry keys. Differential assertions compare transaction state, valuation, public/private card IDs, exact callable-chunk sequence, and context action order. Terminal acceptance actions are normalized because source presentation and local settlement represent final acceptance differently.
* 144 additional cases invoke original `IO.haggleSuccess`/`IO.haggleFail`, crossing success/failure, day 10/11, Active/Fixie, zero/one/two fake-brand facts, and six distinct context histories. Selected global-state outputs and added visitors are compared directly.
* `src/fixtures/native-script-original.json` and `native-end-effects-original.json` are external test fixtures, never runtime tables.
* Rerun `reference/original-study/npc/run-script-probes.sh` to build the original-DLL harness, regenerate fixtures and execute the differential tests.

All registry identities have dynamic coverage. This does **not** mean every possible branch combination, arbitrary Odin event interleaving, process-wide original RNG stream or source localization presentation has been exhaustively proven equivalent. End effects depend on actual refined truth and belief IDs supplied by the controller. Full UI/end-to-end validation is tracked separately by the main task.
