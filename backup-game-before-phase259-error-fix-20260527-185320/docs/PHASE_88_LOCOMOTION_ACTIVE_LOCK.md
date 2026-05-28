# Phase 88 — Locomotion Active Lock

Game-side only. Site untouched.

## Verified active modules

- `game/main.js` imports `game/modules/teleport.js`.
- `game/main.js` imports `game/modules/hands.js`.
- `game/main.js` imports `game/modules/desktop_controls.js`.
- `game/modules/teleport.js` owns XR movement, snap turn, and teleport reference-space movement.

## Fix applied

The prior build had no standalone `locomotion.js`; movement was inside `teleport.js`. That module was active, but right-controller forward/back movement was not robust enough because movement preferred left-stick axis mapping.

This phase locks:

- Right stick Y = forward/back movement.
- Right stick X = 45-degree snap turn.
- Left stick remains secondary fallback/strafe when present.
- Trigger-release teleport path preserved.
- Watch teleport toggle preserved.
- Original lobby only; no second lobby or duplicate wall-room shells.

## Protected

- Original lobby layout.
- Single lobby rule.
- No website/site changes.
- No extra lobby walls or second-lobby shell.
