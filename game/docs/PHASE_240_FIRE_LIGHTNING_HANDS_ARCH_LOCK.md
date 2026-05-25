# PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK

## Purpose
Phase 244 adds the requested visual polish:
- A fire/electric SVR logo-theme arch.
- Electric lightning / fire glow around the hands.

## Direct additions
- `modules/hands.js`
  - Adds animated fire-orange, ember-gold, electric-cyan, and SVR-violet hand aura.
  - Adds rotating rings, lightning bolts, palm glow, and small local hand lights.
  - Applies to real hand tracking and controller hand proxies.
- `modules/world_skyline.js`
  - Adds `SVR_FIRE_LIGHTNING_ARCH` near the lobby spawn/main walkway.
  - Animated lightning, fire/electric light, and SVR Fire Lightning sign.
- `modules/fire_lightning_theme_panel.js`
  - Press F4 for theme verification.

## Preserved locks
- Hand teleport Phase 238/239 behavior remains.
- Quest right-stick autocalibration remains.
- Spawn-front chair clear remains.
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase244-firehands` and press `F4`.
