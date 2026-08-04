# Phase 196 — Lobby Module Bay Polish Lock

## Scope
Game-side only. Site untouched.

## Purpose
After Phase 195 removed the legacy skyline/world builder, Phase 196 improves the new clean lobby so it looks more like a finished modular room instead of a bare reset.

## Changes
- Polished `game/modules/phase195_clean_lobby_world.js` while keeping the same exported builder so `main.js` remains stable.
- Updated the internal lobby label to `UPDATE-3.0-PHASE-196-LOBBY-MODULE-BAY-POLISH-LOCK`.
- Added stronger room architecture:
  - four clean walls
  - top/base trims
  - modular columns
  - better wall bay framing
- Improved module bays:
  - Play Game
  - Wellness
  - PGA Training
  - SVR Store
  - Scorpion
- Added a center carpet path to organize movement toward the table.
- Improved the intended lobby poker table with chip-stack visuals and center logo pad.
- Kept exactly one Moon and one Mars.
- Kept star field only; no background skyline/buildings.
- Added a lightweight ceiling guide ring that does not behave like a floor or canopy.
- Preserved teleport, hands/controllers, watch, desktop controls, Android smart controls, and scene buttons.

## Locked behavior
- No old skyline.
- No duplicate planets.
- No octagon shell.
- No stacked geometry.
- Module bays are wall-aligned.
- Center remains open and walkable.
- Build label should stay on Phase 196.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase196-module-bays`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-196-LOBBY-MODULE-BAY-POLISH-LOCK`.
- [ ] Confirm one Moon and one Mars.
- [ ] Confirm no background building skyline appears.
- [ ] Confirm wall panels are readable.
- [ ] Confirm center carpet path and poker table are visible.
- [ ] Confirm portal pads are visible near module bays.
- [ ] Confirm right-controller teleport still works.
- [ ] Confirm `window.SVR_PHASE196_MODULE_BAYS.locked === true`.

## Files changed
- `game/modules/phase195_clean_lobby_world.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
