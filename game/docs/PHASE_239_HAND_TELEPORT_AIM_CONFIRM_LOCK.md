# PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK

## Purpose
Phase 244 refines Phase 244's hand teleport behavior with visible destination confirmation and live hand teleport state.

## Direct improvements
- Destination ring brightens once a stable aim target is locked.
- Status text shows `DESTINATION LOCKED • pinch to teleport`.
- Publishes `window.SVR_HAND_TELEPORT_STATE`.
- Adds `game/modules/hand_teleport_aim_confirm.js`.
- Adds F2 aim confirmation panel.
- Preserves Phase 244 behavior:
  - face/chin pinch or fist toggles ON/OFF only
  - point away from face + pinch teleports
  - release alone does not shut teleport off
- Preserves Quest right-stick autocalibration and spawn chair clear.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase244-handaim` and press `F2`.
