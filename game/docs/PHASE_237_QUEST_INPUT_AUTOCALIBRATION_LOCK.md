# PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK

## Purpose
Phase 244 strengthens the Phase 235/236 input fix for Meta Quest / WebXR controller axis differences.

## Direct fixes
- Right-stick forward/back movement now auto-calibrates between axis pairs `[2,3]` and `[0,1]`.
- Right-stick X still snap-turns in 45-degree increments.
- Left stick movement remains available.
- Teleport publishes `window.SVR_TELEPORT_INPUT_STATE` for live diagnostics.
- Fist teleport remains: hold fist/pinch to aim, release to teleport.
- Spawn-front chair clear remains locked.
- Adds `game/modules/quest_input_autocalibration.js`.
- Adds F11 autocalibration panel.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase252-questinput` and press `F11`.
