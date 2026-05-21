# Phase 104 — Boot Constant + A-Frame Guard Lock

## Purpose
This phase fixes the boot risk found after the Phase 103 rescue pack. The active `main.js` referenced `PHASE_101_BUILD` without importing it, while `private_room_registry.js` exported phase aliases. That mismatch could stop the runtime during initialization and leave the game stuck on booting.

## Locked correction
- Added `PHASE_104_BUILD = PHASE-104-BOOT-CONSTANT-AFRAME-GUARD`.
- Kept older phase aliases pointing at the Phase 104 build string for compatibility.
- Updated `main.js` to import and display `PHASE_104_BUILD`.
- Preserved the current Three.js/WebXR runtime.
- Quarantined pasted A-Frame `AFRAME.registerComponent('watch-ui')` code as reference only. It must not replace the current `modules/watch.js` path because that would reintroduce a second runtime and can break boot.
- Site untouched.

## Watch rule
The wrist hologram remains implemented through `game/modules/watch.js` as native Three.js canvas/mesh UI. Any future watch upgrade must patch that module directly, not add A-Frame scene/entity code.

## Validation checklist
- `game/index.html` label should show `PHASE-104-BOOT-CONSTANT-AFRAME-GUARD`.
- Console should not show `PHASE_101_BUILD is not defined`.
- Boot should reach the lobby without a black screen or stuck Booting state.
- Watch HOLO panel should remain the single active Three.js implementation.
