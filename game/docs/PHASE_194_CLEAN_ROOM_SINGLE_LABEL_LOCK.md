# Phase 194 — Clean Room Single Label Lock

## Problem
Phase 193 still allowed older lobby/background modules to load in the world path. The cleanup modules then hid them, which caused visible flashing/blinking during load. The visible build label also bounced because an older stabilizer script was still writing its own build text after the newer phase loaded.

## Scope
Game-side only. Site untouched.

## Fix
- Updated `game/main.js` to stop booting the legacy lobby modules directly:
  - Phase123 ad banner buildings
  - Phase168 solid octagon lobby
  - Phase171 cleanup sky/octagon path
  - Phase172 sponsor architecture module
- Set the main build label to `UPDATE-3.0-PHASE-194-BACKGROUND-BUILDINGS-REMOVED-SINGLE-PHASE-LOCK`.
- Added hard boot flags in main:
  - `SVR_DISABLE_LEGACY_SKYLINE = true`
  - `SVR_REFINED_LOBBY_GEOMETRY = true`
  - `SVR_BACKGROUND_BUILDINGS_REMOVED = true`
- Updated `phase187_official_lobby_stabilizer.js` so it is passive only. It still hides old geometry, but it no longer overwrites the visible build label, status pill, or `SVR_PHASE106.build`.
- Updated `phase176_boot.js` and `index.html` to show Phase 194.
- Preserved Phase 190 controller teleport, Phase 191 floor authority, Phase 192 HUD cleanup, and Phase 193 refined room geometry.

## Locked behavior
- No old background building set should appear during load.
- No octagon lobby should return.
- No Phase187/Phase193 label bouncing.
- Visible build label should stay on Phase 194.
- Lobby should use clean-room geometry instead of stacked legacy geometry.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase194-clean-room`.
- [ ] Confirm visible build label stays on Phase 194.
- [ ] Watch initial load: no background building set should flash into view.
- [ ] Confirm no octagon returns.
- [ ] Confirm lobby remains walkable.
- [ ] Confirm teleport still works.
- [ ] In console, confirm `window.SVR_PHASE194_LEGACY_MODULES_DISABLED === true`.
- [ ] In console, confirm `window.SVR_PHASE187_STABILIZER.passive === true`.

## Files changed
- `game/main.js`
- `game/index.html`
- `game/phase176_boot.js`
- `game/phase187_official_lobby_stabilizer.js`
- `game/docs/BUILD_VERSION.json`
