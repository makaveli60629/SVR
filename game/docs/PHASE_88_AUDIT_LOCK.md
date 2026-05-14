
# Phase 88 Audit Lock

## Locked targets
- Watch text corrected so the face is readable again without mirrored back-side rendering.
- Watch button hit areas rebalanced so TP / QUICK SIT / LEAVE TABLE are easier to press without false hits.
- Controller locomotion restored for VR:
  - left stick moves
  - right stick snap-turns 45 degrees
  - A/X arms controller teleport
  - trigger release commits controller teleport
- Hand pinch teleport kept as fallback when controllers are not active.
- Moon and Mars moved closer, with lower glow and stronger texture contrast.
- South information boards expanded and enlarged.
- Existing Reiki Hub storefront preserved and reinforced in the scene build.

## Audit notes
- Replaced mirrored watch back-plane scaling with normal two-sided readable screen rendering.
- Added direct controller gamepad polling inside teleport flow.
- Reduced star overdraw risk by enforcing depth-tested star materials.
- Preserved the current watch frame placement.
