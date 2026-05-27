# PHASE 254 — Boot Shield XR Locomotion Hotfix

## Purpose
Fix the black screen / runtime shield issue before adding more features.

## Fixes
- Changed WebXR startup from required local-floor to optional XR features.
- Kept local-floor, bounded-floor, and hand-tracking optional.
- Updated cache-busting to phase254-boot-hotfix.
- Preserved Phase 253 kiosk, routes, Moon/Mars, poker, and private scenes.
- Site/public Matrix page untouched.

## Test Checklist
1. Game page no longer stays black.
2. Runtime shield does not block normal boot.
3. Desktop scene renders.
4. Quest Enter VR button appears.
5. Quest session starts.
6. Right stick forward/back still works.
7. Right stick left/right 45-degree snap still works.
8. Hold A / grip / trigger aims teleport.
9. Release teleports.
10. Watch remains visible and usable enough for next pass.

## Next Phase
PHASE-255-TRUE-CHIP-GRAB-PHYSICS-LOCK
