# Street reconstruction from the provided video

The street module is `src/street.ts`. The main app owns the HUD, inventory, source-day story routing and cash balance. StreetWorld owns continuous walking, camera movement, visible proximity targets, original sprite animation, door interaction and the observed timed 13V search.

## Source and runtime geometry

- Native canvas: 1920 × 1080. Street scene is clipped to y=90…990.
- B1 scenery: frames 571–635 seconds; a 4506 × 900 source panorama, horizontal foreground railing and 12 extracted walking frames plus 2 idle frames.
- B2: 586–594.8 seconds. Only the left balcony, left descending elevator, JNKJNK and part of HIDDEN are recorded before a hard cut. The map deliberately ends within that captured region.
- Public square: 638–666 seconds, expanded using both recorded ends. A 3888 × 940 panorama accommodates the original vertical camera offset, which changes by about 28 px during horizontal walking. `reference/street/public-final-xy.json` records the measured source camera positions. The viewport follows a bounded approximation of this camera path.
- Late public square: 3478–3528 seconds. A separate original-pixel central facade contains ARRESTED, 53 Avarice Criminals Left, D-5, empty central stairs and the later crowd. The unchanged outer balcony uses the earlier recorded scenery. `public-square-later` enables it; `setLateScene` lets the caller retain/reset the source period.
- Full-body public-square sprite crops are separate from the B1/B2 sprites. The B1 source railing hides the waist at y=582…612 and those hidden pixels have not been painted. Public frames avoid reusing that waist gap. The source blue-shirt NPC occasionally overlaps Bob, so the runtime selects the clearer available public walking frames.
- Source pixels are retained when cropping and masking. New PNGs are saved without ffmpeg color metadata. This preserves the browser/raw-RGB agreement established by the book QA.

## Controls and integration

`new StreetWorld()` exposes `ready`, `update(dtSeconds, keys)`, `render(ctx)`, `enter(screen)`, `interact()`, `click(x,y)`, `takeAction()`, `setShopsOpen(boolean)`, `setLateScene(boolean)` and `state()`.

- Left/right or A/D move at 480 native px/s, measured from the common recorded camera displacement. The speed is reconstructed from the recording, not a recovered original game constant.
- E activates the nearest visible interaction. A distant door click walks to that door, then emits its action. Ground clicks set a walking target. This click-to-walk convenience is a reconstruction control and is not established as original input behavior by the video.
- Call `takeAction()` after `update()` to collect a completed click-walk or search event exactly once.
- B1 doors emit `nav:flower-shop`, `nav:shop`, `nav:gem-shop`; elevators emit `nav:street-b2`/`nav:public-square`; public down elevators emit `nav:street-west`/`nav:street-east`.
- Public Stbl.Office service window is world x=1094 and emits `nav:office`. Its original E Talk prompt was captured at 2913.20 seconds. It is an open street window, not an interior scene.
- Closed flower/GEM doors emit `street:notice:scented` or `street:notice:gem`. Darcy remains accessible as an explicit navigation aid to avoid trapping the reconstructed playthrough between days.
- Only the B2 left bin pays 13V. Its source search begins around 587.2 s, shows a searching bubble, and displays 13V around 590.3 s. Runtime search lasts 3.1 s, then emits `cash:13` once per StreetWorld instance. Other bins do not invent a reward.

## Verified literal prompts

The prompt PNGs retain the recorded glyph pixels: Move to lower floor (583.5 s), Move to upper floor (607.5 s), Read notice (606.5 s), Scavenge (587.0 s), Move to SCENTED (709 s), Go to work at Darcy's (755 s), Move to GEM byul (2924.8 s), Participate (638.5 s), Talk (2913.20 s).

Seeing Move to GEM byul at 2924.8 s establishes the visible door prompt only. The player continues walking toward the right elevator; the video later cuts to a repair interior. The physical repair-shop entry is not established by that prompt and must not be inferred from it.

## Ambient speech

`src/reference-street-dialogues.ts` exports `STREET_PROTEST_DIALOGUES` and `STREET_AMBIENT_DIALOGUES`, each retaining source asset, native rectangle and timestamp. Three photographed protest groups cover the intimidation, freedom, union-against-Fixerain and resuming-Fixerain slogans. Other crops cover the office clerk's bus remark and the donation terminal's slogans.

The video shows E Participate and nearby slogans, but a Participate key press or an effect of pressing it is not identifiable. All these records have `trigger: 'ambient'` and `participateKeyPressConfirmed: false`. Showing them on proximity is a reconstruction of the visible ambient behavior. No reputation, payment or quota effect is invented.

## Source gaps and remaining visual limits

- B2's left elevator explicitly says Move to lower floor. It is not a return elevator. At 594.8 s the player is still on B2 with 441V; at 595.0 s the edit jumps to B1's right side with 573V. The intervening return path and 132V cause are not visible. The caller's Escape-to-B1 behavior is a labelled navigation aid.
- Public square around 666 s cuts directly to the day summary. A night-time return-to-Darcy path is not recorded.
- This is a layered panorama reconstructed from compressed video, not recovered original level assets. Moving background advertisements, crowds, sea parallax, exact camera easing, masked sprite outlines and inaccessible shop interiors are not pixel-identical to the original simulation. Stitching uses only visible source pixels; compressed temporal changes can leave local seams. This work must not be reported as proof that the whole street is 1:1 identical.
- Book rasters have a separate stronger gate: all 21 book page regions compare pixel-identically to their source crops after PNG color metadata normalization. That result does not establish 1:1 street fidelity.

## Acceptance evidence

`scripts/verify-street.mjs` uses native Chrome at 1920 × 1080 and real pointer/keyboard input against a standalone module fixture. It does not inject game state. It checks continuous intermediate movement/camera positions, distant door walking, both captured elevator directions, timed once-only 13V payment, captured-region boundaries, the late scene variant and the office service target. Read-only state is used for assertions. Results are `artifacts/qa/street-report.json`; actual screenshots are in `artifacts/qa/street/`.

This module fixture test supplements, but does not replace, the main app's 53-visitor end-to-end test. The fixture's late-scene link is a QA route and is not part of the game UI.
