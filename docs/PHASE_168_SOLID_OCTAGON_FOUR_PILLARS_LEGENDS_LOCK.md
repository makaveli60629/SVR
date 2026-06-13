# Phase 168 — Solid Octagon + Four Pillars + Legends Lock

## Objective
Restructure the lobby into one tight, solid octagon-shaped shell with no visible wall gaps, hide the generic eight-ad-building ring, add four major cardinal pillar buildings for Tier 1 banner sliders, and restore the Legends hub as a clear dedicated area.

## Preserved Locks
- Phase 166 freeze guard remains active.
- Android smart sticks remain active and Android-only.
- Quest/WebXR locomotion remains untouched.
- Desktop controls remain untouched.
- Logo loading screen remains permanent.
- Sponsor/partner content remains modular and should not be hard-coded into the core lobby.

## Added

### 1. Solid Octagon Lobby Module
File: `game/modules/lobby_octagon_phase168.js`

Adds:
- 8-wall octagon shell.
- Tight wall segment overlap to avoid visual gaps.
- Low-draw materials for performance.
- Purple seam/trim line to mark the closed octagon.

### 2. Four Cardinal Pillar Buildings
File: `game/modules/lobby_octagon_phase168.js`

Adds four wide Tier 1 banner pillar faces:
- North: Tier 1 North sponsor slider face.
- East: Tier 1 East sponsor/leaderboard face.
- South: Tier 1 South notification sponsor face.
- West: Tier 1 West event sponsor face.

These replace the old generic eight-building ad ring visually.

### 3. Generic Background/Ad Building Ring Hidden
File: `game/modules/lobby_octagon_phase168.js`

The previous Phase 123 eight-building ad ring is set to `visible = false` once the Phase 168 octagon module installs.

### 4. Legends Hub Restored
File: `game/modules/lobby_octagon_phase168.js`

Adds a clear `LEGENDS HUB` area with:
- Dedicated Hall of Fame sign.
- Three mannequin/statue placeholders.
- Roped-off presentation zone.
- Octagon-aligned placement.

### 5. Game Runtime Install
File: `game/main.js`

- New build label: `UPDATE-3.0-PHASE-168-SOLID-OCTAGON-FOUR-PILLARS-LEGENDS-LOCK`.
- Imports and installs `installPhase168SolidOctagonLobby` after the old ad banner ring is created so it can hide the old ring cleanly.
- Adds Phase 168 optional tick.
- Keeps Phase 167 command center available.

### 6. Loading Screen Updated
File: `game/index.html`

- Loading screen still uses logo.
- Cache-bust updated to Phase 168.
- Phase copy updated for solid octagon, four pillars, and restored Legends hub.

## Verification Checklist
1. Open `/game/` fresh after clearing cache.
2. Confirm Phase 168 loading screen appears.
3. Confirm old eight generic ad towers are hidden.
4. Confirm one solid octagon shell appears around lobby.
5. Confirm four major pillar buildings appear at North/South/East/West.
6. Confirm each pillar has a wide Tier 1 banner surface.
7. Confirm Legends hub is visible and no longer missing.
8. Confirm Android sticks still work on Android.
9. Confirm Quest locomotion still works and is not reconfigured.
10. Confirm frame rate does not regress.

## Commits
- `ee59fdcf20897f8b0d8bb9c0896dd3378a070568` — Add Phase 168 solid octagon lobby module.
- `f2628aff0c9a077eefa0ebfccb1c6a4c136f7b07` — Install Phase 168 solid octagon lobby.
- `2de546a211083ee1e7e7100e7a1e6703f5a3a323` — Update loading screen to Phase 168 solid octagon.
