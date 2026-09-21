# Windows 1.0.5 original street service entrances

Extracted from the supplied original `level58`, with full GameObject hierarchy, transform chains, collider dimensions, serialized destinations, and `EnableByContext` controllers. Reproduce with `reference/original-study/npc/export_street_access.py` using the UnityPy environment. Raw results: `street-access-level58.json`; compact resolved entries: `street-hotspots-level58.json`. Runtime consumers are `native-street-data.ts`, `native-street-view.ts`, and `street.ts`.

| Service | Original path / GameObject | World center x,y | Collider / destination | Door access |
|---|---|---|---|---|
| Repair | `StoreEntrances/RepairShop/Teleporter Entrance RepairShop` / 687 | 17.720, −2.100 | 1618 → 1610, `Stores/RepairShop/Teleporter RepairShop` | `morning && day>=9`, controller2544 |
| Auction | `StoreEntrances/HiddenV/Teleporter Entrance HiddenV` / 690 | 15.450, −2.100 | 1613 → 1615, `Stores/HiddenV/Teleporter HiddenV` | `morning && day>=18`, controller2171 |
| Flowers | `StoreEntrances/Scented/Teleporter Entrance Scented` / 697 | 13.160, −0.149 | 1606 → 1621, `Stores/Scented/Teleporter Scented` | `morning`, controller2341 |
| Jewelry | `StoreEntrances/GemByJ/CityChat/Teleporter Entrance Gem by J` / 700 | 17.720, −0.149 | 1609 → 1622, `Stores/GemByJ/Teleporter GemByJ` | `morning && (day<=5 || (10<=day&&day<=15))`, controller2155 |
| Later CityChat | `StoreEntrances/GemByJ/CityChat/Teleporter Entrance CityChat` / 699 | 17.7091, −0.149 | 1608 → 1605, `Stores/CityChat/Teleporter CityChat` | `morning && day>=21`, controller2154 |

All five door BoxCollider2D sizes are approximately x **0.243558854**, y **0.75**; zero offset, trigger enabled. Their chains use unit scale and identity rotation, so the compact world positions are directly summed translations, not assumed pixel coordinates. Repair and HiddenV are on the lower commercial floor (B2); flowers and GEM are on B1. Do not reuse GEM as the repair entrance.

The earlier browser video strip stopped before HiddenV/Repair. It has now been replaced on B1–B3 with original scene sprites, while retaining the walking controller and Bob frames. Source layers are drawn background → Bob → foreground. Original source coordinates are projected with `x * 300 - 2364` into the existing strip coordinate system. The offset aligns the original shop columns with the preserved Bob/controller coordinate system; it is a viewport calibration, not a source constant.

The **300 pixels/world street scale** and **400 pixels/world room scale** at1920×1080 were independently checked against the original `PixelPerfectCameraInternal` and Cinemachine callback: assetsPPU100, ref640×480, initial zoom2; source targetOrtho1.85→pixel-perfect1.8 (street), target1.4→1.35 (room). Sprite atlas PNGs use their real textureRect offset relative to full Sprite.rect pivot, preventing trimmed glass reflections from stretching.

`export_native_street.py` extracts2969 static renderers /602 distinct source PNGs from levels56–59. It preserves hierarchy transforms, source tint/alpha, sorting layers/order, gate controls and existence conditions. The54 null-sprite renderer slots are recorded separately; they require their source dynamic/animation systems and are not declared reproduced by this static renderer. Public square remains the previous video-strip view; the B3 lower-floor destination remains explicitly unported.

`renderInterior` supports all nine store rooms. `nativeInteriorProductHotspots` returns the12 original shelf collider regions only: flowers6, real estate3, CityChat3. The17 logic-only style/service purchase components do not become invented shelf buttons. `nativeInteriorInteractionHotspots` exposes source manual triggers and teleporters for controller routing; eligibility and original dialog effects remain controller-owned.

Flower display is source `SetFlowers level58:2271`: selected triple reparented in tuple order to transform1071/1272/1091, with localPosition zero; other flower roots go to hidden position1110. Pass `flowerDisplay` to `renderInterior`; the returned camera carries the same list for product and interaction hotspots. No list means serialized layout for research, not the live shop default. Source sold markers inherit the same transform. Reversed tuple and unused flower tests verify both image and collider relocation.

Verification: `src/native-street-scene.test.ts` covers access dates/night/closed predicates, GEM→CityChat routing, B2/right-door reach and B3 return, nine source door coordinates, tuple reparenting, and product-vs-logic collider separation. `scripts/native-street-capture.mjs` renders eleven store/street views in an isolated browser: no browser errors or source asset load failures; screenshot files `artifacts/native-street-*.png`. Captures validate assembled scene layers, not complete store transaction/dialog parity.

Door access differs from service eligibility:

* `level58:2269`, `Stores/RepairShop/주인과 대화/Events/[수리점]상점에 들어왔을 때`, requires `Repair.availableToday`. Commission success2362 writes its daily states. This does not override door day>=9.
* `level58:2218`, HiddenV entry event, requires `Auction.boughtToday==false`; first-visit2530 has the same guard. Results2510 requires `Auction.finished`; auction room2262 requires `Auction.inProgress`. Door day>=18 still applies.
* Flower purchase events2558/2144/2143/2478/2408/2311 correspond to types1–6, each blocked by `Flower.boughtToday` or its `Flower.N.bought`. The flowers entry event2235 itself is unconditional after entering the morning-open shop.
* GEM's closure event2217 is day6–9, and2496 is day16–17; entry controls remain closed through day20 before CityChat occupies the same B1 doorway from day21.
* Several room return teleporters have `ExistByContext.falseIfAnyOf=[ChallengeMode]`. Challenge routing must use its own controller; these conditions should not be flattened into ordinary day gates.

`StreetTeleporter.Start/Refresh` reads enabled `DestinationFromThisTeleporter` components. On interaction it selects `destinations[0]`, fades0.3/0.15/0.3 seconds, and raises TeleportData to that destination collider. The serialized reference is a collider, not a Transform. Original world positions therefore resolve via that collider's GameObject.

For the exact 1–3 day Demo campaign, repair and auction are correctly inaccessible. Their back-end functions can exist, but showing a day1 GEM-based repair UI would contradict the original access conditions.
