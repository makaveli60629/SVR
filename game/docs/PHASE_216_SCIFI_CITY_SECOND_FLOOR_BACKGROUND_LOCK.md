# Phase 216 — Sci-Fi City Second-Floor Background Lock

## User request
Use the uploaded sci-fi city asset and place the city in the background so it is visible from the second floor.

## Scope
Game-side only. Site untouched.

## Uploaded assets reviewed
- `scifi city.zip`
  - Contains `Scifi downtown/Scifi downtown city.obj`, material/textures, and three city render images: `downtown.jpg`, `downtown1.jpg`, `downtown2.jpg`.
  - A compressed embedded city skyline texture was generated from the three downtown renders for Quest-safe runtime use.
- `44-moon-photorealistic-2k.rar`
  - Archive contents were listable, including Moon OBJ/FBX and 2K diffuse/bump textures.
  - This runtime did not have a working RAR extraction backend, so the RAR moon asset was not applied in this pass.
  - Phase 215 procedural textured Moon/Mars remain active.

## Implementation
- Added `game/phase207_scifi_city_background.js`.
  - Installs the uploaded sci-fi city background material into the lobby.
  - Adds a north city background plane behind the second-floor rear wall.
  - Adds angled west/east background panels for a wider city wrap.
  - Adds distant glowing tower silhouettes to improve depth.
- Added `game/phase216_city_final_label.js`.
  - Locks the final build label to Phase 216.
  - Confirms uploaded city zip usage.
  - Preserves Phase 215 Moon/Mars and no-face-overlay protection.
- Updated `game/index.html` boot chain to load the city background after Phase 215 and then lock the final Phase 216 label.
- Updated `game/docs/BUILD_VERSION.json`.
- Updated `update/version.json`.

## Locked behavior
- City appears behind the north/upstairs wall.
- City is visible from the second-floor walkway.
- City is also wrapped slightly onto the west/east background sides.
- No legacy skyline clutter is re-enabled.
- No black overlay is attached to the player view.
- Phase 215 Moon/Mars remain active.
- Site untouched.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase216-scifi-city-background`.
- [ ] Enter Quest VR.
- [ ] Go upstairs / second floor.
- [ ] Look toward the north/back wall.
- [ ] Confirm city skyline is visible behind/above the second-floor background.
- [ ] Confirm no black overlay is stuck to the view.
- [ ] Confirm Moon/Mars remain visible in the sky.
- [ ] Confirm teleport still works.
- [ ] Confirm `window.SVR_PHASE216.active === true`.

## Next phase recommendation
Phase 217 should replace the compressed embedded city image with a true optimized GLB/OBJ skyline asset once the sci-fi city OBJ is cleaned, decimated, and packed into a Quest-safe format.
