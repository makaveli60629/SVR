# Phase 200 — Ordered Grand Lobby Structure Lock

## User directive
The Phase 199 lobby felt scattered: pillars were not ordered, lighting was weak, the room showed gray guide lines, and the structure did not yet read like the supplied two-floor concept. The directive is to get the structure completely in order before adding store hubs and advertisements back.

## Scope
Game-side only. Site untouched.

## Fix
- Rebuilt the active clean lobby structure inside `game/modules/phase195_clean_lobby_world.js` into an ordered grand room.
- Replaced the scattered curved bay layout with a straight, readable architectural plan.
- Added a clean rear wall with five aligned module arch bays:
  - Wellness
  - PGA
  - Play Game
  - SVR Store
  - Scorpion
- Added evenly spaced rear columns and side columns.
- Added a U-shaped upstairs balcony/walkway using straight aligned geometry.
- Added guard glass, rails, posts, and two side stair paths.
- Added visible lighting:
  - hemisphere light
  - directional key light
  - cyan center light
  - warm rear lobby wash
  - visible warm wall bulbs over each rear bay
- Kept the lower poker table area centered and open.
- Kept one Moon, one Mars, and stars only.
- Kept background skyline/buildings disabled.
- Updated `main.js`, `index.html`, `phase176_boot.js`, `BUILD_VERSION.json`, and floor authority to Phase 200.

## Locked behavior
- Pillars must be evenly spaced.
- Module bays must be wall-aligned.
- Upstairs walkway must read as a clean U-shape, not a random/scattered ring.
- Lights must be visible and active.
- No old skyline/background buildings.
- No octagon stack.
- No black face overlay.
- No visible controller/glove proxy in hands.
- Teleport, hands/controllers, watch, scene buttons, and store portal remain preserved.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase200-ordered-grand-lobby`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-200-ORDERED-GRAND-LOBBY-STRUCTURE-LOCK`.
- [ ] Confirm columns are evenly spaced on the back wall and both side walls.
- [ ] Confirm rear module bays are aligned left-to-right.
- [ ] Confirm upstairs balcony/walkway is straight and ordered.
- [ ] Confirm lighting is visible and the room is not just gray lines.
- [ ] Confirm center table area remains open.
- [ ] Confirm no background buildings flash in.
- [ ] Confirm one Moon and one Mars only.
- [ ] Confirm teleport still works.
- [ ] Confirm `window.SVR_PHASE200_ORDERED_GRAND_LOBBY.locked === true`.

## Auto Deploy
The repository workflow `Auto Deploy` runs on push to `main`, so these committed game changes should trigger deployment automatically.

## Files changed
- `game/modules/phase195_clean_lobby_world.js`
- `game/main.js`
- `game/phase176_boot.js`
- `game/modules/phase191_floor_authority_lock.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
