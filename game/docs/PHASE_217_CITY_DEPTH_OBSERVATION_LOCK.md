# Phase 217 — City Depth Observation Lock

## User direction
Continue after the sci-fi city background pass and make the second-floor city view read stronger.

## Scope
Game-side only. Site untouched.

## What changed
- Added `game/phase217_city_depth_observation.js`.
- Updated `game/index.html` to load Phase 217 after the Phase 216 city background lock.
- Updated `game/phase176_boot.js` so cleanup preserves Phase 217 city-depth objects.
- Updated `game/docs/BUILD_VERSION.json`.
- Updated `update/version.json`.

## Visual additions
- Procedural foreground city towers behind the north/upstairs lobby.
- Neon window points and roof glow trims.
- Distant antenna lights.
- Second-floor translucent observation glass band.
- Gold sightline rail.
- `CITY OVERLOOK` sign at the rear second-floor view.

## Locked behavior
- The uploaded sci-fi city backdrop from Phase 216 remains active.
- Phase 217 adds depth in front of the backdrop rather than replacing it.
- The city stays outside the lobby floor space.
- The city is intended to be visible from the second-floor walkway.
- Phase 215 Moon/Mars remain active.
- No black face overlay is reintroduced.
- Site untouched.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase217-city-depth-observation`.
- [ ] Enter Quest VR.
- [ ] Go upstairs / second floor.
- [ ] Look toward the north/back wall.
- [ ] Confirm the city view has depth, not just a flat wall image.
- [ ] Confirm `CITY OVERLOOK` is visible.
- [ ] Confirm the city does not block lobby walking paths.
- [ ] Confirm no black overlay is stuck to the headset view.
- [ ] Confirm Moon/Mars remain visible.
- [ ] Confirm `window.SVR_PHASE217.active === true`.

## Notes
The uploaded RAR moon asset remains listed but not applied here because this runtime could list the RAR contents but could not extract them without a RAR extraction backend. The Phase 215 procedural Moon/Mars remain the active sky lock.

## Next phase recommendation
Phase 218 should add a Quest-safe second-floor overlook polish pass: benches/standing marks, subtle glass reflections, and a clear non-blocking path to the view.
