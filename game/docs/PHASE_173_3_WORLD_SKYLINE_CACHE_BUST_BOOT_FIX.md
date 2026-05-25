# PHASE-173-3-WORLD-SKYLINE-CACHE-BUST-BOOT-FIX

## Purpose
Fix the live boot blocker where `buildOuterCity()` calls `createMatrixBillboardTexture()` and the browser continues loading an old cached `world_skyline.js`.

## Changes
- Preserves Phase 173 poker winner proof and Phase 172 betting/bot AI logic.
- Ensures `game/modules/world_skyline.js` contains `function createMatrixBillboardTexture`.
- Cache-busts `game/index.html` module loading with `phase173-3-skyline-cache-bust`.
- Cache-busts `game/main.js` import of `world_skyline.js` with `phase173-3-skyline-cache-bust`.
- Site untouched.

## Validation
- `game/index.html` must contain `phase173-3-skyline-cache-bust`.
- `game/main.js` must contain `phase173-3-skyline-cache-bust`.
- `game/modules/world_skyline.js` must contain `function createMatrixBillboardTexture`.
