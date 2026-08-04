# Phase 218 — Second-Floor Overlook Polish Lock

## User direction
Continue the city / second-floor polish pass after the uploaded sci-fi city background and the City Overlook depth layer.

## Scope
Game-side only. Site untouched.

## What changed
- Added `game/phase218_overlook_polish.js`.
- Updated `game/index.html` to load Phase 218 after the Phase 217 city-depth layer.
- Updated `game/phase176_boot.js` so cleanup preserves Phase 218 overlook objects.
- Updated `game/docs/BUILD_VERSION.json`.
- Updated `update/version.json`.

## Visual additions
- Clear green walking path marks toward the city overlook.
- `CITY VIEW` path arrow.
- Two floor stand/photo spots:
  - `STAND HERE`
  - `PHOTO SPOT`
- Two low side benches on the second floor.
- Subtle glass reflection streaks on the observation band.
- Non-blocking low rail for view framing.

## Locked behavior
- Phase 217 city-depth skyline remains active.
- Phase 216 uploaded sci-fi city backdrop remains active.
- Phase 215 Moon/Mars remain active.
- Overlook objects stay on the second-floor route and do not block walking paths.
- No black face overlay is reintroduced.
- Site untouched.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase218-second-floor-overlook-polish`.
- [ ] Enter Quest VR.
- [ ] Walk or teleport upstairs.
- [ ] Confirm green path markers lead toward the city overlook.
- [ ] Confirm `STAND HERE` and `PHOTO SPOT` rings are visible.
- [ ] Confirm side benches do not block movement.
- [ ] Confirm the city depth layer is still visible beyond the observation area.
- [ ] Confirm no black overlay is stuck to the view.
- [ ] Confirm Moon/Mars remain visible.
- [ ] Confirm `window.SVR_PHASE218.active === true`.

## Next phase recommendation
Phase 219 should refine second-floor navigation and view routing: snap/teleport landing pads, a better return path, and optional signage for Legends / Sponsors without adding clutter.
