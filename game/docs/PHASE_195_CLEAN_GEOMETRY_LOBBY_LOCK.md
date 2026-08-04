# Phase 195 — Clean Geometry Lobby Lock

## Problem
The lobby still showed disfigured geometry: duplicate/overlapping moons, curved skyline/ring artifacts, old panels and legacy geometry stacking over the new room. The cause was the old `world_skyline.js` runtime path and post-boot geometry installers still creating pieces before cleanup modules could hide them.

## Scope
Game-side only. Site untouched.

## Fix
- Added `game/modules/phase195_clean_lobby_world.js`.
- Updated `game/main.js` to use the clean Phase 195 lobby builder instead of the legacy `world_skyline.js` builder.
- Removed runtime calls to old Reiki/NPC/command-center geometry from main for the clean room pass.
- Updated `game/phase176_boot.js` so it no longer installs Phase185 official look, Phase189 moon/floor hardlock, Phase192 geometry cleanup, or Phase193 refined geometry after boot.
- Preserved only non-geometry support locks:
  - hand-history public filter
  - lobby bounds
  - floor authority lock
- Added a clean rectangular lobby:
  - one visual floor
  - four clean walls
  - straight top/base trims
  - simple table area
  - one Moon
  - one Mars
  - star field
  - wall-aligned Play / Wellness / PGA / Store / Scorpion panels
  - clean portal pads
- Preserved Quest teleport, hands/controllers, watch, desktop controls, Android smart controls, scene buttons, and store portal.

## Locked behavior
- No legacy skyline/background buildings.
- No duplicate moons.
- No old curved building/ring artifacts.
- No octagon shell.
- No old geometry stack during or after loading.
- Visible build label stays on Phase 195.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase195-clean-geometry`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-195-CLEAN-GEOMETRY-LOBBY-LOCK`.
- [ ] Confirm only one Moon and one Mars are visible.
- [ ] Confirm the old background building skyline does not appear.
- [ ] Confirm no giant curved rings or disfigured stacked structures dominate the sky.
- [ ] Confirm the rectangular room walls and wall panels are visible.
- [ ] Confirm teleport marker still appears on the floor.
- [ ] Confirm right-controller teleport forward behavior still works.
- [ ] Confirm `window.SVR_PHASE195_CLEAN_WORLD.locked === true`.
- [ ] Confirm `window.SVR_PHASE195_LEGACY_WORLD_BYPASSED === true`.

## Files changed
- `game/modules/phase195_clean_lobby_world.js`
- `game/main.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
