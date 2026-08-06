# Phase 386 — Quest Table Environment Authority

## Build

`PHASE-386-QUEST-TABLE-ENVIRONMENT-AUTHORITY-LOCK`

## Scope

Quest/Oculus game runtime only. This phase does not redesign or replace the public website. Android Phase 385 presentation work remains preserved on the same integration branch.

## Reported headset problems addressed

- Player appeared away from, beside, or at the wrong height relative to the poker table.
- Teleport remained available while positioned at the table.
- The original table appeared almost completely black because the environment and material response were under-lit.
- Eric was absent, hidden, incorrectly scaled, untextured, or separated from a visible external skeleton.
- The branded table felt and SVR logo were missing or visually incorrect.
- The Moon was visible but flat, untextured, too small, or poorly positioned.
- A black square/film attached to the headset view darkened the stars and environment as the player turned their head.
- Phase 384 could automatically force a standing player into the quick-play seated mode after the inspection delay.

## Authoritative corrections

### Player placement

- The original uploaded table is normalized to approximately `2.74 m × 1.46 m × 0.80 m`.
- The player is placed at the front/south side of the table and faces its center.
- The horizontal table distance is fixed at approximately `0.68 m` for both sitting and standing modes.
- Seated mode adjusts vertical rig height for a readable table view.
- Standing mode remains standing and is no longer automatically forced into the Phase 384 demo seat.
- Small position drift is corrected continuously so the player remains centered in front of the table.

### Teleport and movement

- Teleport flags, hand teleport, grip teleport, watch teleport, pointer ray, hand ray, table travel, locomotion, and stick movement are disabled at the table-front anchor.
- Teleport methods are guarded from external calls.
- Teleport rays, arcs, markers, landing indicators, and reticles are hidden while the table authority is active.
- Manual seating remains supported; only the old automatic quick-play seating request is blocked.

### Original poker table

- `game/assets/models/table.glb` remains the primary uploaded table authority.
- `game/assets/table.fbx` remains the existing fallback asset.
- Procedural/duplicate tables are hidden.
- Dark or missing materials receive readable professional dark-purple, metallic, and green-felt values.
- Existing image textures are preserved and corrected to sRGB.
- A professional green felt overlay with gold/white rings is placed at the table surface.
- `/logo.png` is placed directly on the felt as the authoritative SVR table logo.

### Professional lighting

The new Quest lighting rig contains:

- Ambient fill
- Hemisphere environment light
- Warm directional key light
- Cool directional fill light
- Dealer spotlight
- Player-side table fill

Dynamic shadows remain disabled for Quest performance. Renderer output is set to sRGB with ACES filmic tone mapping and exposure `1.22`.

### Eric dealer

- Reuses the approved Eric authority when it is available.
- Loads `game/assets/models/eric/eric.fbx` as a fallback when no approved Eric root is found.
- Keeps one Eric only and hides duplicate Eric roots and external skeleton helpers.
- Grounds Eric behind the dealer side of the table and scales him toward a target height of `1.78 m`.
- Preserves existing source image maps where available.
- Adds classified professional fallback textures for skin, hair, shirt, suit, pants, and shoes when FBX materials have no usable texture image.
- Keeps Eric visible and aligned while preserving the Phase 381 dealer hand/dealing motion authority.

### Black headset overlay removal

- Removes known camera/head overlays, comfort masks, vignette meshes, visor screens, fade planes, film layers, and black square panels.
- Detects unnamed dark planar meshes attached to or extremely close to the XR camera.
- Disables known vignette, comfort-mask, visor, head-overlay, and postprocessing runtime flags.
- Preserves hands, controllers, watch, cards, table UI, avatar objects, dealer objects, planets, and stars.

### Moon, Earth, and Mars

- Adds one authoritative textured Moon above and behind the lobby/table view.
- Uses a generated high-resolution crater texture and bump response.
- Moon radius is approximately `2.35 m` in the game scene.
- The Moon slowly rotates for visible surface movement.
- Hides duplicate older Moon geometry while preserving Moon-related lights and labels.
- A separate `PHASE-386-PLANET-PRESERVATION-GUARD` keeps the existing Earth and Mars objects and their parent showcase groups visible.
- Only legacy Moon objects are hidden by the preservation guard; Earth and Mars are not replaced or removed.

## Runtime files

- `game/modules/phase386_quest_table_environment_authority.js`
- `game/modules/phase386_planet_preservation_guard.js`

## Quest test route

`https://svrpoker.com/game/index.html?platform=quest&v=phase386`

## Required headset acceptance checks

1. The player loads centered in front of the original poker table.
2. Standing players remain standing; using the manual seat control still works.
3. Sitting and standing positions maintain the same horizontal distance from the table.
4. No teleport ray, marker, or teleport movement is available at the table.
5. The complete table is visible, correctly sized, and no longer black.
6. The felt is green and the SVR logo is readable at the table center.
7. Eric is visible behind the dealer side, upright, correctly scaled, textured, and lit.
8. No external skeleton is visible behind or through Eric.
9. The Moon is larger, above the lobby view, textured, and slowly rotating.
10. Earth and Mars remain visible and are not removed with the older Moon geometry.
11. Turning the headset no longer causes stars or the scene to dim behind a black square/film.
12. Existing cards, betting actions, dealer motion, audio, and gameplay remain functional.

## QA APIs

- `window.SVR_PHASE386_QA()`
- `window.SVR_PHASE386_QUEST_SWEEP(reason)`
- `window.SVR_PHASE386_PLACE_FRONT(reason)`
- `window.SVR_PHASE386_OVERLAY_SWEEP()`
- `window.SVR_PHASE386_LIGHTING_SWEEP()`
- `window.SVR_PHASE386_ALIGN_ERIC()`
- `window.SVR_PHASE386_PRESERVE_PLANETS()`
- `window.SVR_PHASE386_PLANET_QA()`

## Protected baselines

- Phase 380 original uploaded table authority
- Phase 381 Eric dealer motion/audio and seated protections
- Phase 384 Quest Eric/table polish
- Phase 385 Android original tabletop/gyro work
- APK `0.1.0-rc2`, version code `2`, manual update policy
- Phase 383 public website content
