# Phase 219 — Sci-Fi OBJ Silhouette Skyline Lock

## User request
Continue the city-background phase and keep improving the second-floor view.

## Scope
Game-side only. Site untouched.

## Source asset used
Uploaded archive:

- `scifi city.zip`
- Internal model: `Scifi downtown/Scifi downtown city.obj`

The OBJ contains 71,002 vertices with a broad city footprint. Instead of loading the full 11 MB OBJ directly into Quest runtime, this phase uses a reduced skyline silhouette generated from the OBJ's vertex bounds.

## Implementation
- Added `game/phase219_scifi_obj_silhouette_lock.js`.
- Generated 39 Quest-safe skyline stacks from the uploaded OBJ bounds.
- Added a top-trace line across the reduced skyline profile to make the second-floor view read like a real city silhouette.
- Added roof glows, antenna accents, and a small plaque marking the layer as an OBJ-derived city silhouette.
- Updated `game/phase176_boot.js` keep list so Phase 219 objects are not hidden by the old legacy-city cleanup rules.
- Updated `game/index.html` to load Phase 219 with cache key `phase219-obj-city`.
- Updated build/deploy version markers.

## Locked behavior
- The Phase 216 uploaded city background remains active.
- Phase 217 city-depth observation remains active.
- Phase 218 second-floor overlook polish remains active.
- Phase 219 adds the OBJ-derived skyline silhouette in the far background.
- Legacy skyline clutter remains disabled.
- No face overlay is reintroduced.
- Teleport, upright stance, Moon/Mars, and second-floor walking support remain preserved.

## Moon RAR note
The uploaded `44-moon-photorealistic-2k.rar` was inspected enough to confirm it contains Moon OBJ/FBX and 2K diffuse/bump textures, but this runtime still lacks a working RAR extraction backend. Phase 215's active Moon/Mars system remains preserved until that asset can be extracted or re-uploaded as ZIP.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase219-obj-city`.
- [ ] Enter Quest VR.
- [ ] Go upstairs to the second-floor overlook.
- [ ] Look north/back beyond the rail.
- [ ] Confirm the city now has deeper layered silhouettes, not just a flat image.
- [ ] Confirm no black face overlay appears.
- [ ] Confirm teleport still works.
- [ ] Confirm Moon/Mars are still visible.
- [ ] Confirm `window.SVR_PHASE219.active === true`.

## Next phase recommendation
Phase 220 should add a clean upstairs destination flow: direct path lighting from the stairs to the overlook, a safe return marker, and optional seated/photo-view camera positions for Webex/demo capture.
