# PHASE-238-HAND-TELEPORT-PINCH-DESTINATION-LOCK

## Purpose
Phase 238 carries Phase 238's right-stick movement / fist teleport / spawn-chair fix forward and adds a tester diagnostic surface.

## Adds
- `game/modules/vr_input_diagnostic.js`
- `window.SVR_VR_INPUT_DIAGNOSTIC`
- F5 panel for controller axes, movement test steps, fist teleport test, and spawn path confirmation.

## Preserved from Phase 238
- Right stick Y: forward/back movement.
- Right stick X: 45-degree snap turn.
- Hand fist teleport: hold fist/pinch to aim, release to teleport.
- Spawn-front chair hidden/cleared.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase238-inputdiag` and press `F5`.
