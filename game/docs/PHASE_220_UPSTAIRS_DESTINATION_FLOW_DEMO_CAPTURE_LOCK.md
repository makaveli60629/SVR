# Phase 220 — Upstairs Destination Flow Demo Capture Lock

## User approval
User approved the recommended next phase after Phase 219.

## Scope
Game-side only. Site untouched.

## Purpose
Make the second floor function as an intentional destination, not just a decorative upper balcony.

## Implementation
- Added `game/phase220_upstairs_destination_flow.js`.
- Updated `game/index.html` to load Phase 220 with cache key `phase220-upstairs-flow`.
- Updated `game/phase176_boot.js` so Phase 220 objects are protected from old cleanup rules.
- Updated `game/docs/BUILD_VERSION.json`.
- Updated `update/version.json`.

## Added features
- Stair-to-overlook path lights.
- Directional City View arrows.
- Safe Return to Lobby pad.
- Webex/demo capture standing spots:
  - City Hero
  - Lobby + Skyline
  - Spectator View
- `window.SVR_PHASE220_DEMO_SPOTS` exposes demo camera positions for later automation.
- Soft city reveal shimmer behind the skyline.
- Low safe overlook rail.

## Preserved protections
- No black face overlay.
- No legacy skyline clutter.
- Phase 219 OBJ-derived skyline remains active.
- Phase 218 overlook polish remains active.
- Phase 216 uploaded city background remains active.
- Phase 215 Moon/Mars remain active.
- Teleport and upright stance remain protected.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase220-upstairs-flow`.
- [ ] Enter Quest VR.
- [ ] Walk/teleport upstairs.
- [ ] Confirm route lights guide from stairs to overlook.
- [ ] Confirm City View markers appear.
- [ ] Confirm Return to Lobby pad appears upstairs.
- [ ] Confirm demo/photo spots appear at the overlook.
- [ ] Confirm city skyline remains visible behind the second floor.
- [ ] Confirm no black overlay appears.
- [ ] Confirm Moon/Mars remain visible.
- [ ] Confirm `window.SVR_PHASE220.active === true`.

## Next phase recommendation
Phase 221 should add one-click demo camera switching for desktop/Webex preview while keeping Quest player control untouched.
