# Engine / progression handoff — Windows 1.0.5 Demo

This is a working state handoff, **not a claim that the whole game or UI is 1:1**. Latest user instruction is to stop expansion and publish the current project for another AI to continue. Do not infer missing DAY15–29 Levels from the existence of late events.

## Files and ownership

- `src/engine.ts`: authoritative cash, stock ownership, encounter, source story/curation/service orchestration. Do not post the same cash change in UI and engine.
- `src/native-scheduler.ts`, `native-story.ts`, `native-campaign-data.ts`: source Level scheduling, 517 source events, serialized resumable condition/choice/wait/chunk interpreter. Rebuild catalog with `scripts/research/build_runtime_campaign.py`.
- `src/native-services.ts`, `native-rental.ts`: source daily rules, loans/rent/flowers/repair/reporting/auction/rental/challenge.
- `src/native-street-purchases.ts`, `native-street-purchases-data.ts`: 29 source level58 purchase components and original callback order. Rebuild with `scripts/research/build_runtime_street_purchases.py`.
- `src/native-generation.ts`: newly completed advanced source item generation paths.
- `src/native-curation.ts`: newly completed pure source general and registered special curation selectors/price action queues.
- Root owns `main.ts` / UI and session-store; NPC agent owns negotiation, native NPC modules and `street.ts`; item agent owns native item/card/tool/manual modules. This agent did not change `main.ts`.

## What is running

`new Game(...).start(stock, 'demo', seed)` starts original Demo DAY1–3. `'story'` retains the older video DAY6–11 slice, and `'challenge'` executes 30 purchase attempts, possible sales, five street breaks and one final score. The source bundle contains only `day01`, `day02`, `day03`, `triggeredEvents` Levels. Challenge has the original item-difficulty escalation but explicitly uses the available Demo personality pool where original late Level customer difficulty is missing.

The engine now runs native negotiation ordered pipelines, native card belief formation, all 32 original declarative haggle hooks, chunk queues, one-time outcome effects and exact native item instances. Accepted delayed offers are settled once. Script callbacks never infer cash transfer from a narrative-only finish command. Private newly discovered cards do not remove unrelated public belief; repeated private assume toggles.

`state.activeNativeItem` is cleared/recreated on each legacy visit to prevent stale item truth. Saves retain dynamic gem facts, world contexts, suspended story, curation state, RNG streams and one-time event IDs. Optional new world fields are defaulted at point of use; older saves remain loadable. Older saves without acquisition audit snapshots conservatively cannot unlock day24 difficulty13 from an invented wrong-appraisal ratio.

## Advanced item generation now implemented

Entry path: Assembly-CSharp `RandomPurchaseEventSlotData.GetAvailableRandomItemsIDsAndPrices` → `GenerativeCustomer.itemDifficultyByPawnshop` / `Challenge.itemDifficultyByPawnshop` → `.selectItem` → `GeneratedPurchaseEvent` → `CreateHaggle.createHaggleWithIntro` (increments `Gen_Haggle`). `IO.tomorrow` supplies the forced-umbrella target. Source IL is retained in `reference/original-study/windows-1.0.5-demo/il-*.json`.

- Candidate pool is original eligible definitions, inclusive native difficulty and `RandomItem.<id>.used` exclusion. Every candidate is instantiated and valued as an integer as the source does; dynamic jewelry is instantiated again for the actual selected transaction. Ranking instances and the transaction instance are separate.
- Selection consumes one initial random draw. Forced umbrella wins if `Gen_Haggle == shouldUmbrella && Gen_Haggle > 12` and an umbrella exists. Otherwise the same draw selects expensive top30 at `<= .2 && Gen > 15`, otherwise fake-brand at `<= .25 && day >= 11` when available. These three early-return paths bypass daily category/brand exclusions and do not append to those lists.
- Normal target is `Gen²*7.2` below80; `Gen²*6.2+6400` otherwise; subtract integer `itemValueStack`, then multiply by `.5 + draw`. Remove umbrellas valued≥200 once Gen≥100. Apply today's gray/brand exclusions; a 10% branch prefers at least4-card unbranded candidates if possible. Rank nearest20 by integer target distance; genuinely auction-valuable objects use integer `(int(hammerValue)+int(candidateValue))/2` midpoint. Uniform selection follows ranking. Append only the first Gray and first brand card.
- Umbrella adds at most50 to normal/forced stack; expensive/fake early paths add full value. Challenge uses original recursive target without random factor, excludes all umbrellas unless Gen%4==1, nearest30, and full stack value.
- Daily gray/brand lists use the original F# list string syntax. Reader accepts older browser pipe-delimited and JSON list saves. New date divisible by5 sets `shouldUmbrella = Gen + 1 + Next(14)`.
- Native difficulty covers the original source date gates, including existence (not truthiness) of `getScrew`, and day24 recent four-day wrong-acquisition ratio≤.5. Acquisition audit snapshots persist independently of later repair/sale/removal.
- `nativeHammerValue` is shared with auction payout; preserves the `blue_national` / `blue_nationalhis` source spelling mismatch and all unconditional random draws. True valuation eligibility is separate from UI auction eligibility: repaired/wrecked figure objects are still eligible for generation midpoint calculations.
- Source uses `Guid.NewGuid` for uniform item selection independently of `GeneralUtils.rnd`. Browser uses a separate persisted `generationChoiceRng`. We assert branch/candidate/ranking/value equivalence, **not cross-runtime identical random sequences**. Missing late customer-difficulty schedules remain missing.

Tests: `reference/original-study/progression/run_generation_probe.py` directly invokes the supplied original DLL, and saves513 observations in `generation-dll-fixtures.jsonl`. Reflection redirects only the original System.Random implementation to controlled draws; first row validates `.123, .456`. Singleton selection pools avoid asserting GUID sequence parity. `src/native-generation.test.ts` compares every row and adds pool-size, daily-filter bypass, midpoint and save-list tests.

## Curation API — controller completed, Demo UI path verified

**Important:** original DAY2 already contains `D02_firstassess_condition_after` and `D02_charBavac` (source type4/5). They now correctly enter item selection after intro. The old behavior silently picked the first listed item and treated curation as a generic sale; it has been removed. Root has now wired the APIs below. The latest frozen browser run completed DAY1–3 with a real DAY2 silver-bracelet selection and price offer.

- `game.curationView`: null or `{stage:'select'|'price'|'counter'|'settled', eventId, selectedItemId, counter, waiting, lineId}`.
- `game.getCurationCandidates()`: owned native instance IDs, titles, public appraised values/listing and stock flags. It does **not** reveal whether a candidate matches the request or expose true value. Source `CurationEvent.SuggestItem` checks ownership, not listing; unlisted stock is valid.
- `game.submitCurationItem(instanceId)`: runs source selector, queues actions and binds that instance. No sale/cash is committed merely by showing an item.
- `game.offerCurationPrice(amount)`, `acceptCurationCounter()`, `declineCuration()`: source price path, one counter acceptance/rejection, final flags and one-time ledger+stock transfer. Existing `offer()`, `accept()`, `requestDecline()` route here when appropriate.
- `game.continueStory()` advances both native chunk/intro/outro stories and a curation pool line. **A curation line can have `world.story === null`, `phase === 'narrative'`, `curationView.waiting === true`; do not hide Continue just because `world.story` is null.**
- `world.curation.pending/history` preserve exact source action order through save/load. A chunk pauses processing before the next accept/reject/price action, so its conditional effects can run first. Only after pending presentation finishes does interaction reopen.
- Source general ByItem/AND/OR, fake/wrecked exceptions and third-decline behavior are implemented. Registered selectors: D18 Jane, D14/D17 PreAvarice, D06 AVAC quest, halfBrandCuration1, graphology/history2/art2/archae2. Every registered price handler is implemented (D08 Choi, PreAvarice, five special1, five special2, four club ratios). Two success handlers write ItemForFixieWannabe1/2.
- Source `SkipCurationHaggle` transfers selected item for0. `SkippedCurationHaggleNoBuy` is retained in catalog; source field is assigned but not consulted by execution. Do not reinterpret its English name as a no-transfer instruction.
- `FinishCurationHaggleManually` sets original flags and ends the event, without invented transfer. Other source chunk stock/cash operations remain separate.
- Curation pure rules are independently checked against **2,016 original DLL action sequences** (plus registry row), in `curation-dll-fixtures.jsonl`. Run `run_curation_probe.py` to regenerate. Registry includes9 item handlers,17 price handlers,2 success handlers. Controller tests cover unlisted stock, pending-line reload, one-time commit and skip-haggle zero price.

**Remaining curation limits:** source customer dialogue-pool IDs are preserved (`lastLineId`), but `curationLine()` currently supplies readable generic English fallback text, not the character-specific original pool lines. Existing callable chunks use extracted localized text. The Demo DAY2 selection/price path passed real browser acceptance; counter/rejection branches and all late special scenes still need dedicated browser acceptance. No missing late Level ordering was invented. Duplicate definition instances are settled by selected instance; original Pawnshop removes all entries with the same definition ID (normally deduplicated by original generation), so that unusual duplicated-inventory edge is not claimed equivalent.

## Street/service UI entry points

- `getContexts()`, `getContext(k)`, `setContext(k,v)`; `storyView`, `continueStory()`, `chooseStory(id)`, `signalStory(name,value?)`.
- `getStreetPurchases(storeId?)`, `purchaseStreetProduct(id)`: source 29 component products. Source callback `Branch/Switch/Context/AdjustBalance/Journal/Line` effects apply in order. Actual paid ledger/event IDs prevent double charging.
- `selectStreetRepairItems(ids)`: max2/source price and eligibility contexts; `selectStreetAuctionItem(id)`.
- `isStreetStoreOpen(storeId)` / source gates: GEM morning/day≤5 or10–15, RepairShop≥9, HiddenV≥18, BestRoof≥12, CityChat≥21; challenge opens original special services. GEM has no StreetStorePurchase products.
- Rental methods/view already in engine: actual schedule probability/request cap, first-three purchase attempt, quote/counter/accept/decline and later return resolution; owned item stays in inventory while rented.
- Curation sale does not call ordinary Sale mandatory feedback or haggle outcome effects: source `successCuration` directly calls `Pawnshop.sellItemWithCustomPrice` plus the registered curation success handler.

## Verification checkpoint and next acceptance

- Latest combined focused suite: **54/54 passed** in `/tmp/nua-final-progression-tests.log`, including the original-DLL generation/curation comparisons, Demo three-day save/restore, challenge30attempts, services, engine and legacy video system regressions.
- Latest browser acceptance: **`artifacts/native-update/demo-browser-curation-final2/report.json`** — DAY3 complete, cash1282,852 real UI actions,22 manual card drags, save→menu→load passed, **0 browser errors**. Source request “silver bracelet” matched the publicly named Common Silver Bracelet via inventory click→Show→price, without reading true value or invoking engine mutations.35 screenshots include curation selection and final summary.
- First frozen attempt `demo-browser-curation-final/` reached DAY2 then found duplicate inventory DOM IDs: `renderSales()` and `renderCuration()` both rendered the drawer. A single `renderSales` guard now defers drawer rendering to `renderCuration` while stage=select. First failure is intentionally preserved; do not confuse it with final2 success.
- Final frozen build: `/tmp/nua-demo-final2-b8xhhvql/dist`, preview `http://127.0.0.1:5192/` (session53639 at handoff). The build manifest is retained under the final2 artifact directory. `npm run build` completed including TypeScript; prior native-tool/GEM dialogue compile errors are fixed.
- `scripts/native-demo-browser-playthrough.mjs` now drives curation using visible request text and public candidate names, then actual curation and calculator controls. Next coverage: counter/rejection branches, save/load mid-curation in the browser (already unit-tested), late special source chunks, challenge30attempts and all29shopcomponents.
- Do not claim1:1 from unit tests/build alone. Full later Levels, original animation/sound/camera/timing, rental-return presentation, source dialogue pools and some fractional cash boundaries remain explicit limitations.
