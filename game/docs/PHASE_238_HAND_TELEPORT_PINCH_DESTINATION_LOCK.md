# PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK

## Purpose
Phase 244 changes hand teleport behavior to the user-requested interaction model.

## Direct fixes
- Teleport ON/OFF only toggles when the hand is near the face/chin and the user pinches or makes a fist.
- Pointing away from the face no longer toggles teleport off.
- When teleport is ON, point at the destination and pinch to teleport there.
- Release alone no longer shuts teleport off.
- Quest right-stick autocalibration is preserved.
- Spawn-front chair clear is preserved.
- Adds `game/modules/hand_teleport_pinch_destination.js`.
- Adds F1 hand teleport instruction panel.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase244-handtp` and press `F1`.
