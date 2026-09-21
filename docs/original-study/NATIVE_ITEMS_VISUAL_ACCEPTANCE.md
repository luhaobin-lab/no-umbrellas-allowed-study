# Windows 1.0.5 runtime data and visual components

This is a bounded acceptance record for the item, tool, manual, card, and character modules. It is not a declaration that the entire browser game is visually identical to Unity.

## Source and coverage

- All runtime data comes from the supplied **Windows 1.0.5 Demo**. The Mac 0.2.5 Demo remains a separate research corpus.
- `scripts/generate-native-data.py` generates all 609 item definitions, 252 raw card definitions, full source effect text, 77 manual pages, source book frame, card prefab, fonts and image requests.
- `scripts/export-native-assets.py` exports 1,010 requested item/tool/manual/card sprites or font textures. Sprite transparency is reconstructed to the original `m_Rect` using `textureRectOffset`; source pivot coordinates are retained. There are no export errors.
- Exactly 606 of 609 item definitions have a resolvable main image. The source Resources paths are absent for `potatoChip_01`, `tumblbug`, and `theGleaners`; they are not replaced with other items' pictures.
- `scripts/research/export-native-characters.py` exports 54 Character definitions, 772 part records, 4,468 animation clips, and 16,331 source sprite images. Static sprites resolve through Addressables GUIDs and paths. Animated sprites use the original clip keys.
- Main-store character rig is `StoreManager.currentCustomerPrefab` → `resources.assets:4069`, with `CharacterDisplayManager resources.assets:25714`. At a 1920×1080 full viewport, original camera scale gives **3 canvas pixels per source sprite pixel**, and body anchor **(960, 765)**. The cutscene rig is not used.

## Rule boundaries

`native-rules.ts` intentionally preserves raw Card vs factory differences, category replacement, tier precedence, color/category ordering, double arithmetic, final minimum value, permissive true-card cases, and original jewelry arithmetic. The external original-DLL oracle covers **609 × 252 = 153,468** true-card checks, every raw card and factory outcome, 609 source item valuations, 1,616 condition combinations, and generated jewelry cases. Player truth, player assertions and NPC beliefs remain distinct data.

`native-tools.ts` supplies source-aware output for damage, material, signature, year, jewel and watch-opening tools; it returns source images, applicable states, book targets and unlock keys. Local seeded item/appearance random generation is reproducible but does not reproduce Unity Random/Guid's historical sequence.

## Manual renderer

`NativeManualView` renders the original `RectTransform` hierarchy and supports source layout groups, fitters, image tint/nine-slice, actual TMP glyph advances, explicit rich-text sizes, inline sprite metrics, card links, weekly pickup-material substitution, conditions targeted at the actual component/GameObject, and lock-aware navigation. Native child Canvas enabled state controls tooltips; enabled-condition badges do not hide an entire navigation row. Twelve event pages have actual ScrollRect content and wheel scrolling.

Use `setPointer(x,y)` before rendering; route wheel input to `wheel(deltaY,x,y)`. `render` returns the current page's actionable hit rectangles. `pageId` exposes the resolved page if a locked target was rejected. The 21 earlier video page aliases remain mapped.

The English locale selects the original **Sevastopol Interface SDF** atlas. Fixed-font nodes retain their own source font, giving four atlas definitions after adding the card override-caption font. No installed system font is substituted. All source kerning tables are empty. Explicit `<size=22>` text now uses the row's real ascender/descender plus TMP's base line gap, fixing the Figures6 divider collision.

## Card renderer

`native-card-view.ts` is derived from `CardDisplayManager resources.assets:26132`, prefab `resources.assets:4704`, original size **279×174**.

```ts
const drawn = drawNativeCard(ctx, nativeCardId, x, y, width, slotHeight, {
  image, expanded: hovered, otherCardIds, highlight,
});
// expanded cards are painted after neighbouring cards; hit-test drawn.hit
```

`width` sets the source aspect ratio. `height` is the visible folded slot; it must not squeeze the whole 174-pixel-tall card into a strip. `full:true` displays the complete card for dragging. Original hover behavior raises the card by `32 + InfoText.renderedHeight`, with `.1 s easeOutQuad`; optional `previewProgress` provides its normalized interpolation. `getNativeCardRequiredImages()` lists image dependencies.

There are 18 source backgrounds (six colors × three visual tiers), four highlight images, original Name/Effect/Info/Tier positions/colors/fonts, and override caption/struck-out previous effect. TierText is inactive in the source prefab, so it is hidden by default. Source reputation cards map five tiers onto three backgrounds; generated jewelry's Unity display tier is distinct from the core valuation factory's tier. Red/yellow cards have no short effect field. `SetOverriddenEffect` ordering and `Card.badFigures` are preserved, including first-applicable pink card precedence. Highlight state preserves recently-changed notices versus continuing effects.

## Character color: independently verified Windows shader math

The old runtime field `layer.hsv` is retained for compatibility, but its meaning is **HSL adjustment**. `applyNativeCharacterHsl(imageData.data, layer.hsv)` applies it in place for an image cache:

- Convert source RGB to HSL.
- Add red to hue with HLSL signed remainder modulo one.
- Add green minus 0.5 to saturation and blue minus 0.5 to lightness.
- Convert back without clamping S/L beforehand; preserve texture alpha.

Evidence is Windows shaders `resources.assets:1338`, `:1340`, `:1344`, independently decoded from their original DXBC. `:1343` SoftHard uses `:1338`'s `OpaquePixelUniversal2D` via UsePass. Mac GLSL independently showed the same calculation, but the Windows implementation is not based on that assumption. Decoder field definitions follow Microsoft's [DirectX token format header](https://github.com/microsoft/DirectXShaderCompiler/blob/main/include/dxc/Support/d3d12TokenizedProgramFormat.hpp).

`scripts/research/extract-native-shader-dxbc.py` reproduces bytecode/assembly evidence; `probe-native-character-hsl.py` independently interprets source instructions into **288 oracle cases** across three Windows shader variants. The TS implementation matches those cases within 2e-6. Color assignment also follows the exact renderer sets in `CharacterDisplayManager`: eye/special retain prefab colors, and default lipstick does not overwrite skin color.

## Validation evidence

- `artifacts/native-data/final-domain-tests.tap`: 40 targeted tests, including original DLL matrix and source shader oracle.
- `artifacts/native-manual-qa/final/`: screenshots and hit/bounds state for all 77 pages, zero browser errors.
- `artifacts/native-manual-qa/interaction-report.json`: hidden/hover/exit tooltip checks, occluded card hits, locked direct navigation, pickup material replacement, all 12 event ScrollRects and actual long-page scrolling passed.
- `artifacts/native-manual-qa/final-client/`: prescribed web-game Playwright client run for the corrected rich-size page.
- `artifacts/native-card-qa/`: all 252 cards, 17 dynamic cards, all six folded/expanded colors, and overridden/highlighted cards. Zero browser errors. `report.json` contains models and source image identities.
- `npx tsc --noEmit` passed after the component integration.

## Exact remaining visual limits

- Text uses source atlas glyphs and layout metrics, but its alpha mask is a threshold at 128 rather than Unity's GPU SDF material/antialiasing/bold-weight shader. This prevents a claim of pixel-identical text.
- Browser layout reproduces the relevant Unity components, not every TMP and Unity layout solver branch. Source narrow fixed card-title rectangles and minimum font sizes are preserved; long English titles can extend outside a title strip. Exact matching of that behavior still needs a corresponding original Unity screenshot.
- Scroll wheel/content clipping is implemented; the source's runtime scrollbar auto-hide/viewport-expansion geometry is not fully rendered.
- Character sprites, part offsets, ordering, mirroring, default clip keys and HSL transform are source-based. Full Animator transition/blink delays, source URP scene lighting, outlines and shadow passes are not included in this component acceptance.
- Shader `Epsilon` is a uniform. Its live initialization was not established; the pure transform uses an explicit 1e-10 default for the achromatic limit, and the independent DXBC probe uses that same explicit uniform. GPU single-precision and Canvas byte rounding are not asserted bit-identical.
- These browser screenshots verify coverage and local layout/interaction. They are not a 77-page aligned image-difference test against the original Unity game's live renderer.
