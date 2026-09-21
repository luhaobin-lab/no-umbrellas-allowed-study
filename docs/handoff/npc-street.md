# NPC negotiation and original street handoff

Freeze requested by the user for GitHub handoff. This document distinguishes implemented runtime, independently tested source behavior, and main/UI work that is still unfinished. Source behavior is **Windows 1.0.5 Demo only**; do not mix the older Mac0.2.5 rules or call these Demo files the complete retail game.

## Negotiation runtime already implemented

Primary files: `src/negotiation.ts`, `native-negotiation-types.ts`, `native-pipelines.ts`, `native-price-pipeline.ts`, `native-card-pipeline.ts`, `native-script-hooks.ts`, `native-haggle-effects.ts`. Detailed rules/evidence: `docs/original-study/NPC_MODELS.md`, `NPC_RUNTIME_UPDATE.md`, `NPC_SCRIPT_RUNTIME.md`; machine coverage `reference/original-study/npc/runtime-verification.json`.

- Five native personality families, generated beliefs, ordered modifier routing, price/card/hide/tool/tick histories, delayed decisions, flower effects, sale feedback/value pipelines, serialized local RNG and script state are in the runtime. The game controller supplies actual source item/card facts and live contexts; runtime must not guess unknown true cards.
- All **32 exact Declarative registry keys** are implemented in `NATIVE_SCRIPT_REGISTRY`. They are event identities, not character names or inferred personality. Four complex appraisal families reuse the independently tested `story-appraisal.ts` adapters. Native ordinary idle/tick pipelines are cleared when source creation installs a special declarative.
- Original `scriptId` is the StoreEvent ID if it matches the registry; StoreEvent resources do not have a standalone `CustomFunction` field. Story script handling and old per-video special handlers must remain mutually exclusive.
- `drainNativeScriptEffects(haggle)` returns `{state,effects}`; commit returned state, run `{type:'chunk',id}` effects in order through original callable chunks. Never reset the effect queue before drain, replay a consumed effect, or assume every chunk ends a transaction.
- `declineNativeDeal(haggle)` returns `{state,handled}`. Some original give-up paths only issue a chunk. The special Darcy tutorial acceptance ends as failure plus its `accept` chunk and transfers no inventory.
- `nativeHaggleOutcomeEffects(haggle,success,liveGlobals)` returns `{contexts,visitorsDelta,evidence}`. Apply **once** in committed settlement. It replaces the old standalone modifier-outcome patch. Cash, ownership, Appraised/Trusted remain controller-owned and must not be duplicated.
- Original scanner output uses the same `assumeCard`/private-card hook as hiding. The hook sees **pre-private state**. Private assume toggles a repeated exact ID off; conflict handling differs from public refinement. Actual public→private movement removes the exact public ID; a fresh scanned private card must not delete another public card merely sharing a category.
- Tool IDs are source IDs (`brush`, `magnifier`, `sign`, `year`, `jewelscan`, `screw`). Tool hooks run even for source tool failure/no-result outcomes where original `Tool.Use` still fires `PlayerUseTool`.
- Source `Report.reportPlayer` has the literal `NextDouble() <= 72.5`, therefore always passes *after eligibility*. Do not “fix” it to0.725. The key ` charCbokhoAsk` includes its leading space. Preserve original price-history scan ordering.

Progression agent integrated these contracts in `engine.ts`; controller one-time effects, narrative pauses, inventory and cash ownership require the full controller regression suite. Do not infer whole-game parity from pure negotiation tests.

## Original-DLL evidence and reruns

Original core DLL SHA256: `8fd9303d81d3a086fd0aade914c0eea31c1017f7865e1a94fc7451a6a3ed56c3`.

`src/native-script-hooks.test.ts` and `src/native-negotiation.test.ts` owned suite: **191 passing tests**, including168 original-DLL declarative scenarios /344 transitions over all32 keys, plus144 original `IO.haggleSuccess/haggleFail` effect scenarios. Earlier native fixture families include540 initial quotes,3654 mandatory appraisal-feedback cases and6090 sale-value cases; see the machine coverage record for exact separate populations.

Runtime does **not** load probe outcomes as answer tables. Fixtures under `src/fixtures` are test-only. Native behavior is independently implemented in TypeScript.

```sh
npx tsx --test src/native-script-hooks.test.ts src/native-negotiation.test.ts
npx tsx --test src/native-street-scene.test.ts src/native-street-purchases.test.ts
npx tsc --noEmit
npm test
```

To regenerate DLL fixtures, inspect `reference/original-study/npc/run-script-probes.sh` and `script-probe/{Program.cs,ScriptProbe.csproj,scenarios.json}`. The script expects original Managed files at `原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data/Managed` and .NET on PATH; older research probes also used `/tmp/nua-demo-managed`. Restore or configure these external dependencies on a new machine. Committed generated fixtures run without the original DLL. Source extraction likewise needs UnityPy and the source directory recorded in `extraction-report.json`.

Limits: all32 registry identities dynamically covered does not imply every possible hook/branch combination, arbitrary Odin interleaving or exact original process-wide RNG/Guid stream. Local RNG save/restore is tested; original seed-for-seed random equivalence is not asserted. Eligibility probability is not final model frequency after random candidate selection. All possible random jewelry/alternative-condition sale combinations are not exhaustively proven.

## Original street modules and APIs

Files: `src/native-street-data.ts`, `native-street-view.ts`, `street.ts`, generated scene/interactions/hotspots JSON and `public/assets/native-street/*.png`.

Source extraction: `reference/original-study/npc/export_native_street.py`, `export_street_access.py`. These read source files; they do not modify the original game. Levels56/57 are street navigation/art;58/59 are interior navigation/art. Extracted2969 static renderer placements,602 unique PNGs, with54 null-sprite slots recorded separately. Source transforms, trimmed textureRect offsets/pivots, tint/alpha, sort order, active ancestors and context gates are retained.

```ts
const view = new NativeStreetView();
await view.ready;
// view.isReady; view.errors
street.setContexts(game.getContexts());
street.render(ctx, {
  nativeView: view,
  contexts: game.getContexts(),
  drawPrompt: (text,x,y) => { /* original bitmap-font UI */ },
});
const camera = view.renderInterior(ctx, 'Scented', game.getContexts(), {
  flowerDisplay: game.world.flower.display,
});
const productRegions = nativeInteriorProductHotspots('Scented', camera);
const interactionRegions = nativeInteriorInteractionHotspots('Scented', camera, game.getContexts());
```

Exact rooms: `Scented`, `GemByJ`, `CityChat`, `JunkJunk`, `HiddenV`, `RepairShop`, `NiceT`, `AjikHair`, `BestRoof`. Aliases `flowers/gem/auction/repair` also work. Interior returns camera `{worldX,worldY,pixelsPerUnit,width,height,flowerDisplay}`. Source PixelPerfect correction yields300px/world for street and400px/world for rooms at1920×1080. Street strip X uses `sourceWorldToStreetX(x) = x*300-2364`; its offset is viewport calibration, not an original game constant.

`renderStreet` can split `background`/`foreground`. `StreetWorld.render` places Bob between them. Rooms select their actual source art root; **CityChat uses `chat_darkVersion`**, not the obsolete inactive `chat` room. `nativeSceneVisible` applies original gates and existence conditions.

Flower display is the exact `SetFlowers level58:2271` tuple behavior: three selected types move in order to source transforms1071/1272/1091 with localPosition zero; other product roots move out of view. Both rendered sprites/sold markers and projected purchase/interaction colliders receive the same translation. Supply the day's list; omitting it intentionally shows serialized research layout, including all six roots.

Product hotspots expose only real source shelves: flowers6 (filtered to today's3), BestRoof3, CityChat3. The17 logic-only hair/clothing/service purchase components have **no shelf collider** and must be reached through original NPC/selection flow.

`nativeInteriorInteractionHotspots` exposes source manual `InteractionBounds` and `StreetInteractible` regions, with IDs/path/kind/purchaseId/type/bounds; it excludes automatic-only trigger volumes, context-inactive objects and other-room regions outside camera. It returns source geometry, not permission to bypass engine guards or original dialogue effects. Original NPC interaction IDs:

| Store | Manual source trigger |
|---|---|
| GemByJ | level58:2145 |
| Scented | level58:2505 |
| RepairShop | level58:2211 |
| HiddenV reception | level58:2470 |
| NiceT | level58:2152 |
| AjikHair | level58:2192 |
| CityChat | level58:2395 |
| BestRoof | level58:2483 |
| JunkJunk | level58:2289 |

NiceT selection2338 and open/close2312, AjikHair hair selection2348 are separate source regions. Exit teleporters have kind `StreetInteractible`; do not convert every collider to a purchase button. ChallengeMode removes the source Scented/HiddenV/Repair exit objects where specified; GEM does not share that condition.

## Main integration still required at freeze

The root agent is applying only a minimal GEM fix at handoff. **Do not assume the new `StreetWorld` renderer and all store surfaces are wired into `main.ts`.** Inspect latest main to see which minimal changes landed.

1. Replace the incorrect GEM→repair action with source `GemByJ` room and Kim dialogue. The supplied Demo has **no GEM goods/purchase/repair component**. `nativeGemDialogue(day,choiceIndex)` returns ordered `{character,id,key,text}` lines for one of two original groups in the day<=5 / day>5 branch. Pick and persist `choiceIndex` once using world RNG, not every render. Data: `native-gem-dialogue-data.json`.
2. Before enabling native street rendering, fix the Bob source-animation problem below. Then create/preload `NativeStreetView`; call `street.render` with view, live contexts and actual bitmap prompt drawing. Default monospace prompt is only a loading/research fallback.
3. Dispatch new navigation routes `nav:street-b3`, `nav:street-b2-east`, and `nav:store:<exact storeId>`. B2 now spans the full source width4506/maxX3710, and source doors include JunkJunk/HiddenV/Repair. B3 includes NiceT/AjikHair/BestRoof. Preserve E and click-walk arrival semantics and saved street position.
4. Before opening a store, call controller `game.isStreetStoreOpen(storeId)`. Source gates: Repairday>=9; HiddenVday>=18; BestRoofday>=12; CityChatday>=21; Scented/NiceT/AjikHair morning. GEM is morning and(day<=5 or10..15). JunkJunk has its own evening/day3/day7..10/hanjaHurt exclusions. The day1–3 Demo correctly cannot access Repair/HiddenV.
5. Render each true room and attach its source NPC/selection/shelf/exit regions. Engine APIs already available from progression: `getStreetPurchases(storeId)` and `purchaseStreetProduct(id)` plus repair/auction selection calls. Source purchase callbacks/conditions are controller-owned. Show only a room's legitimate available offers; do not invent a universal store management page.
6. Preserve original dialogue/UI sequencing: choosing a source purchase region may require an original question or selection callback. The static renderer/hotspot helper alone does not implement these interactions. Use original `StreetEventData`/Odin callbacks, available in decoded progression data, and controller predicates.
7. Test full walking→enter→source dialogue→select/buy→cash/inventory change once→exit→save/reload. Static captures and pure purchase tests are not that end-to-end acceptance.

## Verified visuals and real unresolved defects

`src/native-street-scene.test.ts`6 tests plus `native-street-purchases.test.ts`4: **10/10 passed** at freeze. They cover exact source gate boundaries, GEM/CityChat routing, B2/right-door reach, B3 return, source projection, flower tuple reorder/hotspot relocation, manual vs automatic triggers and challenge exit conditions. Purchase suite iterates all29 original purchase components.

`node scripts/native-street-capture.mjs` uses a separate local dev server at5199 and headless Chrome, not the user's active browser tab. It generated11 source interior/street captures plus3 composed walking views with0 browser errors and0 missing assets. See `artifacts/native-street-*.png`.

**Newly observed blocking visual defect:** `artifacts/native-street-walk-b2.png` shows Bob's body gaps and feet floating above the original walkway. The old `/assets/street/bob-*-*.png` frames are video-derived cutouts with original rail occlusions baked into their alpha, and their existing y=400 anchor does not fit the source scene camera. The native static street layers are valid, but a composed native StreetWorld is **not visually accepted**. Next AI must extract/reconstruct the actual original StreetPlayer/Bob animation sprites, source anchor/scale and animation timing; do not patch by drawing missing limbs or declare screenshot-strip cutouts faithful. Until then keep the previous street view or mark the new native view as research-only.

Other remaining street gaps: public square is still the earlier video strip; B3 lower-floor route is explicitly unported;54 dynamic null-sprite slots, scene animations and runtime character/style assignments are not reproduced by static exports. Source room screenshots verify layering/trim offsets and three-flower layout, not complete native animation or every source state.

At this subagent's final typecheck, only `src/native-tool-view.ts` optional/null errors were reported; that file is root-owned and root is fixing it. No street type errors were reported. Rerun the full build and suite after the root's final freeze instead of treating this transient typecheck as the final repository result.
