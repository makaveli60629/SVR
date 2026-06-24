# Phase 169 — Demo QA Position + Sky Overlay Module Lock

## Scope
Game-side only. No lobby redesign. No website/site file changes.

## New rule locked
All new systems must be modular. `game/index.html` is only the boot activator and should load modules instead of carrying feature logic.

## Added module
`game/modules/phase169_demo_qa_position_overhead_sky_overlay_lock.js`

## Added features
- Laptop/desktop-only position display.
- Bird's-eye height inspection mode without enabling flying.
- PageUp/PageDown camera height adjustment while in overhead mode.
- Position copy helper for exact placement requests.
- Black overlay / vignette / face overlay purge for Oculus and runtime overlays.
- Modular Moon and Mars sky replacement.
- Old generated Moon/Mars objects are removed at runtime and replaced by the Phase 169 sky module.

## Laptop controls
- `P` toggles the position display.
- `B` toggles overhead/bird view.
- `PageUp` raises overhead camera.
- `PageDown` lowers overhead camera.
- `Shift + C` copies the camera/target position.

## Runtime audits
```js
SVR_RUN_PHASE169_POSITION_AUDIT()
SVR_RUN_PHASE169_OVERLAY_AUDIT()
SVR_RUN_PHASE169_SKY_AUDIT()
```

## Notes
The overlay purge removes in-game DOM/mesh overlays and black/vignette/face blockers. Physical headset field-of-view edges cannot be removed in software, but the in-game black screen overlay blockers are suppressed.

## Test URL
`/game/?v=phase169-position-sky-overlay`

## QA checklist
- On laptop, confirm the position display appears.
- Press `P` to hide/show it.
- Press `B` for bird's-eye inspection and confirm this does not enable free-fly movement.
- Press `PageUp/PageDown` to adjust height.
- Move/click mouse and confirm floor target and last click update.
- Confirm old Moon/Mars are gone.
- Confirm new modular Moon/Mars are visible in north sky.
- Confirm Quest black overlay blockers are suppressed.
- Confirm Phase 168 poker demo remains active.
