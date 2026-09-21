# Items, tools, manual and character handoff

## Scope and version boundary

The runtime data in this domain targets the supplied **Windows 1.0.5 Demo** (Unity 2020.3.11f1). The supplied Mac 0.2.5 Demo is a separate research corpus; its behavior must not be silently substituted for Windows behavior. The extracted Demo contains assets beyond its playable three-day campaign. Asset presence is not proof that a later encounter is playable.

Runtime coverage:

- **609 item definitions**, with original fields, source IDs, real item art where present, and per-instance generated jewelry facts.
- **252 serialized card definitions**, with raw versus factory differences preserved.
- **77 original manual pages**, their original frame, hierarchy, text, images, links, conditions and navigation. The earlier 21 video-page aliases remain supported.
- **54 character definitions**, 772 part records, 4,468 animation clips and 16,331 sprite images. Character parts are selected from source Addressables references, not represented by a shared placeholder.
- Six tools: damage, material, year, signature, gem scanner and screwdriver.

Three source item Resources paths have no main sprite: `potatoChip_01`, `tumblbug`, `theGleaners`. They have not been replaced with another item's image.

**The original reference video is absent from the current workspace/handoff state.** The user previously referenced `/Users/haobinlu/Desktop/无雨伞/参考视频.mp4`; do not claim it is included or available. Restore that video, or obtain an accessible original recording, before attempting aligned video-to-runtime visual acceptance. Existing derived reference assets are not a substitute for the original video.

## Runtime entry points

| Module | Main API / responsibility |
|---|---|
| `src/native-item-data.ts` | Compact generated item/card catalog and source sprites |
| `src/native-rules.ts` | `getNativeItem`, `getNativeCard`, `createNativeItem`, `resolveNativeItem`, `estimateNativeCards`, `overwriteNativeCard`, `refineNativeCards`, `isTrueCard`, `resolveNativePickupCard` |
| `src/native-tools.ts` | `inspectNativeItem`, `nativeToolBookTarget`, `NATIVE_TOOL_UNLOCKS`; computes source readouts and side-effect metadata without mutating NPC beliefs |
| `src/item-facts.ts` | Compatibility adapter for original instances and prior video scenarios |
| `src/native-manual-data.ts` | `NATIVE_MANUAL_PAGES`, `NATIVE_MANUAL_FRAME`, `NATIVE_MANUAL_FONTS`, inline sprite definitions and collect-context keys |
| `src/native-manual-view.ts` | `NativeManualView`: `setPointer`, `render`, `wheel`, `pageId`; actual card/page hit regions and lock-aware navigation |
| `src/native-text.ts` | Source atlas glyph metrics, rich text, inline sprites, per-line size/ascender/descender handling |
| `src/native-card-view.ts` | `drawNativeCard`, `getNativeCardRequiredImages`, `getNativeCardAppearance`; source backgrounds, typography, highlights and overridden effects |
| `src/native-characters.ts` | `createNativeCharacterAppearance`, `getNativeCharacterLayers`; source parts, offsets, sorting, mirroring and sampled clip frames |
| `src/native-character-color.ts` | `nativeCharacterHslPixel`, `applyNativeCharacterHsl`; original color adjustment before scene lights and outlines |
| `src/native-tool-visual-data.ts` | `NATIVE_TOOL_VISUALS`, `nativeToolOutBounce`, `nativeToolOutExpo`; exact source damage/scanner hierarchy, transforms, SpriteMask and animation constants |
| `src/native-tool-view.ts` | Root agent's latest tool animation renderer. Added after the frozen browser acceptance described below; see the explicit unverified status below. |

`estimateNativeCards` returns a number using double arithmetic. Do not floor each intermediate step. `createNativeItem` returns a persistent instance whose generated jewelry and RNG state must be saved. Do not regenerate its truth on inspection or restore.

`drawNativeCard(ctx, id, x, y, width, slotHeight, options)` uses `width / 279` as its source scale; `slotHeight` clips a folded card rather than squashing the original 279×174 rectangle. Draw hovered cards after their neighbours and use the returned `hit`. `full:true` renders a complete card during dragging.

Manual input must call `setPointer` before rendering and forward wheel events to `wheel`. `render` returns current actionable hit regions. Read `pageId` when a locked requested target was rejected. Conditions such as `EnableByContext` target specific components or child objects; they must not hide the entire host row by default.

The character layer property is named `hsv` for compatibility, but it contains **HSL adjustment parameters**. The source applies hue addition and saturation/lightness offsets around 0.5. It is not HSV saturation/value multiplication.

## Rules that must not be “cleaned up” by intuition

- Serialized Card assets and the core/Unity factories differ. For example, the serialized garnet certificate adds zero while a factory certificate adds 50. The art-revalued card's printed value does not define its arithmetic.
- Replacement follows the original category/color/tier rules; same-category replacement and final sorting are not interchangeable operations.
- Nonempty final valuations clamp to at least 1; an empty card set returns 0.
- Jewelry price depends on kind and cut; the original core price ignores carat. The Unity display factory and core valuation factory use different display tiers for generated gems.
- Source appraisal truth contains deliberately permissive exceptions, including some higher-tier jewelry and half-brand cards. Do not tighten these based on common sense.
- The player's factual inspection, player assertions and NPC beliefs are separate. A tool reading must not automatically reveal all true cards to the NPC.
- Old UI aliases can collide with pickup-material cards. Prefer `nativeId` when present; otherwise an original dynamic card's `id` is already its source ID.
- Local seeded randomness preserves reproducible browser saves; it does not reproduce Unity Random/Guid's historical random sequence.

## Independent evidence already obtained

### Arithmetic and data

`src/native-rules.test.ts` exercises the external original-DLL oracle rather than deriving expected answers from the TypeScript implementation:

- **609 × 252 = 153,468** true-card comparisons.
- Every serialized card and observed factory outcome.
- All 609 serialized item valuations/refinement results.
- 1,616 condition boundary combinations.
- Generated jewelry and arithmetic-order cases.

Primary result file: `reference/original-study/items/windows-dll-probe.jsonl`. The earlier Mac legacy appraisal research remains separately documented and must not be conflated with this Windows matrix.

The original Windows shader DXBC was independently decoded, and a small instruction interpreter generated **288 HSL oracle cases** across shaders 1338/1340/1344. Shader 1343 uses the relevant 1338 opaque pass through `UsePass`. See `src/fixtures/native-character-hsl-original.json`, `scripts/research/extract-native-shader-dxbc.py`, and `scripts/research/probe-native-character-hsl.py`.

The last domain-wide run before the root agent's latest tool renderer changes passed **40/40 tests**. Evidence: `artifacts/native-data/final-domain-tests.tap` and `artifacts/native-data/final-acceptance.json`. This is historical evidence for that tested revision, not a claim that later changes have already been revalidated.

### Manual and card UI

- All 77 manual pages were rendered to actual browser canvas screenshots with zero browser errors: `artifacts/native-manual-qa/final/`.
- Tooltip hidden/enter/exit states, popup hit occlusion, locked direct navigation, weekly pickup substitution, all 12 event ScrollRects and a real long-page scroll passed: `artifacts/native-manual-qa/interaction-report.json`.
- The Figures6 `<size=22>` line-spacing bug was corrected and visually rechecked; its text no longer crosses the row divider.
- All 252 card definitions and 17 dynamic cards, six folded/expanded colors and overridden/highlighted displays were captured with zero browser errors: `artifacts/native-card-qa/`.
- Detailed acceptance and limits: `docs/original-study/NATIVE_ITEMS_VISUAL_ACCEPTANCE.md`.

### Six-tool actual browser controls

`artifacts/native-tools-browser/report.json` records **20/20 functional checks**, zero browser errors, screenshots and action/readout traces. This was run against a frozen Vite production build served at port 5182, not the HMR development server.

The browser used explicitly marked source-item saved fixtures. `scripts/research/create-native-tools-fixtures.ts` creates actual Game/item instances, enters through the engine encounter loader, writes them with `SaveRepository`, and verifies restore. The browser receives the initial localStorage envelope only at Main Menu and then clicks **Load Game**. No tool result, pending animation, awarded card or post-load truth is injected.

Verified cases:

- Damage/material/year/signature readouts and automatic book targets.
- All six tools preserve **Home** with Shift held; this avoids false positives from pages a tool would preserve even without Shift.
- Screwdriver opens and closes a source watch and rejects an item without an OpenSprite.
- No-signature result uses no borrowed signature image.
- Easy and generated gems enter a pending phase, then award one private certificate after the source total interval.
- Repeated certificate, two occupied private slots and an item with no jewel reject correctly. The two slots were filled using real UI controls.
- Settings → Save → Main Menu → Load Game preserves each scanned native instance exactly, including generated carat/cut/RNG state, and retains its fair value. Tested values were 147.20000000000002 and 1174.
- Actual screenshots show source card colors and distinct Darcy/random-female character appearances.

**This is fixture UI acceptance, not a campaign completion run.** It does not establish that these special fixtures naturally appear during the three-day Demo or a challenge pool.

## Latest tool animation change: not yet accepted

The frozen six-tool test identified two visual differences:

1. The scanner awarded correctly after the delay but displayed a stationary scanner/“Scanning...” label instead of the source ticket print and fade.
2. The damage tool displayed the correct final angle without the source settling/idle tween.

Exact source data was then exported to `src/native-tool-visual-data.ts`:

- At 1920×1080, the source camera gives 300 pixels/world unit. With PPU100 and unit tool ancestry, sprites render at 3 pixels per source pixel.
- Damage needle anchor `(0, -0.095)` world units; needle centre is another `(0, +0.11)` relative to that anchor. Source settling is 0.5 seconds `easeOutBounce`; idle sweep is 0.7-second linear ping-pong over ±52.7 degrees.
- Scanner ticket anchor Y is +0.0292; ticket local Y moves from 0 to −0.12 in 0.75 seconds, then fades for 0.25 seconds. Both use iTween's default **easeOutExpo**.
- Ticket is 23×14 source pixels and is visible **outside** its actual source SpriteMask. The exported hierarchy contains mask image, alpha cutoff, custom sorting range, pivots and relative transforms.

The root agent subsequently added `src/native-tool-view.ts`. **That new animation implementation has not yet undergone the frozen-build, frame-by-frame browser recheck.** Optional-type compile errors were reported during its implementation and the root agent was fixing them. This handoff does not claim the latest file compiles or that those animation findings are closed. No implementation was edited as part of this handoff-only task.

## Genuine remaining 1:1 limits

- Source font glyphs and metrics are used, but atlas alpha is thresholded at 128. Unity's GPU SDF smoothing, bold-weight/material behavior and final rasterization are not reproduced pixel-for-pixel.
- The browser implements the relevant Unity RectTransform/layout/TMP behavior, not every solver branch. Some source narrow card-title rectangles/minimum font sizes still require live original screenshot comparison. Scroll content and clipping work, but scrollbar auto-hide/viewport-expansion visuals are incomplete.
- Character part data, ordering, default clip samples and HSL calculation are source-based. Complete Animator transitions/blink delays, original scene lights, outline/shadow passes and final compositing are not included in the domain's pixel-parity claim.
- Shader `Epsilon` is a uniform whose live initial value was not established. The pure transform and independent probe use an explicit 1e-10. GPU float rounding versus Canvas byte conversion is not claimed bit-identical.
- The 77-page/252-card browser captures prove coverage and local rendering/interaction, not aligned image differences against the original Unity renderer. The original video must be restored for that comparison.

## First steps for the next agent

1. Run `npx tsc --noEmit` and inspect the current tool renderer. Resolve any remaining compile issue before building; do not rely on the earlier successful domain compilation.
2. Run the domain tests without regenerating frozen research data:
   `npx tsx --test src/native-rules.test.ts src/native-tools.test.ts src/item-facts.test.ts src/native-characters.test.ts src/native-manual.test.ts src/native-card-view.test.ts src/native-character-color.test.ts`.
3. Build a new isolated production directory. Preserve the existing baseline reports rather than overwriting them. Create fixture saves with the existing fixture script if necessary, and run `scripts/research/verify-native-tools-browser.mjs` with a new `TOOL_UI_URL` and `TOOL_UI_OUT`.
4. Capture scanner frames before, during and after printing/fading; verify ticket travel, masking, alpha, a single private-card award, and save/load through a pending scan. Capture damage entry/settling/exit frames to verify the correct pivot, bounce and idle sweep. The current script checks the functional interval; add visual frame assertions for the new renderer.
5. Restore the original reference video and compare fixed frames before making any “fully identical” claim. Keep remaining layout, font, lighting and animation differences explicit.

No new large export is needed for these checks. Existing source catalog/generation scripts should only be rerun if their inputs or extraction logic actually change.
