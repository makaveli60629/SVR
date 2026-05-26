# SVR Phase 251 Watch Fix

Date: 2026-05-26

## Fixed

- Rebuilt game/modules/watch.js with null-safe runtime.
- Added browser HUD watch fallback.
- Added A-Frame wrist watch panel when VR hand/controller exists.
- Added safe scene detection.
- Added safe Moon/Mars locomotion status integration.
- Added chip/status/time display.
- Added Shift+W and F8 watch toggle.
- Patched optional_module_loader.js to load watch.js.
- Rebuilt update/game.zip fresh.

## Controls

- Shift+W: hide/show watch
- F8: hide/show watch
- L: locomotion mode toggle if Moon/Mars locomotion module is active

## Test

- https://svrpoker.com/game/?v=phase251-watch
- https://svrpoker.com/game/version.json?v=phase251-watch
- https://svrpoker.com/game/deploy-health.json?v=phase251-watch