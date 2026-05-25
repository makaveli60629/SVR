# PHASE-236-VR-INPUT-DIAGNOSTIC-LOCK

## Purpose
Phase 236 fixes the VR input complaints and spawn obstruction reported by the user.

## Direct fixes
- Right controller stick Y now moves forward/backward.
- Right controller stick X still snap-turns in 45-degree increments.
- Hand fist teleport is restored and works even when controller fallback exists.
- Hand mode now allows hold fist or pinch, then release to teleport.
- Physical South Edge chair in front of spawn is hidden; seat marker remains for table logic.
- Adds `game/modules/vr_input_spawn_clear_recovery.js`.
- Adds F3 input/spawn verification panel.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase236-inputspawn` and press `F3`.
