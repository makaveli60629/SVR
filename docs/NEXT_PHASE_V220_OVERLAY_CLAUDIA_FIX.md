# SVR Next Phase v2.2.0 Audit

Focused fixes in this pass:
- removed likely headset-view overlay sources by eliminating the atmospheric shell meshes
- reduced floor streaking/shimmer by disabling the table spotlight shadow and adding shadow normal bias on the main key light
- separated sponsor wall layers with stronger render ordering plus disabled depth testing on the panel/logo/plate stack to stop blinking
- moved Earth and Moon higher, brighter, and onto slower cleaner orbital paths; reduced spark count and removed fast sprite jitter
- lowered and smoothed the live preview camera so it stays table-focused rather than drifting into sky-heavy shots
- corrected Claudia's dealer anchor to use yaw-only facing and manual dealer motion instead of trying to bind the mismatched walking FBX clip
- widened the thin-cap table mesh filter to catch more blinking top-cover meshes

Static checks performed:
- `node --check main.js`
- `node --check modules/world_skyline.js`
- zip structure preserved for direct `update/game.zip` replacement

Known limitation:
- Claudia rig orientation was corrected by code without a live Quest test, so final dealer pose may still need one more headset calibration pass.
