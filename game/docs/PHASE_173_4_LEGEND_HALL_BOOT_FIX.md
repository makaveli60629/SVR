# Phase 173.4 — Legend Hall Boot Fix

## Purpose
Fixes a boot-blocking skyline runtime error where `buildAlignedLegendHall()` called `buildLegendHall()` but the helper was missing in the active runtime.

## Fixed
- Added local `buildLegendHall()` procedural fallback in `game/modules/world_skyline.js`.
- Added local `addLobbyInfoBoards()` helper because the same runtime path also calls it later during skyline setup.
- Updated cache-bust marker to `phase173-4-legend-hall-boot-fix`.
- Preserved Phase 173 winner proof and hand history.

## Protected
- Site untouched.
- Lobby not redesigned.
- Dealer body remains disabled.
- Poker flow preserved.
