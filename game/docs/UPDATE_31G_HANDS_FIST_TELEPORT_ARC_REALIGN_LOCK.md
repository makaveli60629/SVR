# Update 3.1-G — Hands Fist Teleport Arc Realign Lock

## User issues addressed
- Created controller model should not appear while using Oculus hands.
- Hand teleport must avoid fingertip/pinch triggers because those can conflict with Oculus system gestures.
- Teleport should be fist-based: make a fist to aim, release the fist to leap.
- Teleport arc should not look like white squares.
- Hand should glow with SVR theme colors when teleport is active.
- Teleport leap alignment needed correction.
- Dark transparent face squares still needed stronger cleanup.
- Browser/runtime should stay on one active phase.

## Active build

```text
UPDATE-3.1-G-HANDS-FIST-TELEPORT-ARC-REALIGN-LOCK
```

## Files changed
- `game/modules/hands.js`
- `game/modules/teleport_phase215.js`
- `game/phase227_hands_fist_teleport_arc_overlay_lock.js`
- `game/phase225_uploaded_floor_table_texture_reuse_lock.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`

## Hands behavior
- Removed the Phase 226 visible controller model.
- Controller proxies remain hidden and available only as fallback input data.
- Oculus hand meshes stay visible.

## Teleport behavior
- Pinch/fingertip teleport is removed from the active hand teleport path.
- Hand teleport is now fist-first:
  1. Make a fist to activate and aim.
  2. Keep fist held while aiming.
  3. Release fist to leap.
  4. Teleporter turns off after the leap.
- Controller fallback remains available only when hands are not active.

## Teleport visuals
- Replaced square-looking point particles with round particle textures.
- Added cyan and purple particle arc layers.
- Added a cyan/purple fist aura while teleport is active.
- Target marker uses a round glowing target instead of a white square target.

## Overlay cleanup
- Repeated cleanup removes camera-attached transparent panels, diagnostics, face overlays, and near-head transparent flat squares.
- Cleanup avoids removing hands, watch, teleport target, teleport arc, Moon, Mars, and stars.

## Test URL

```text
https://svrpoker.com/game/?v=phase227-hands-fist-teleport-arc-overlay-lock
```

## Quest checklist
- [ ] Browser title stays on 3.1-G.
- [ ] Oculus hands are visible.
- [ ] Created Quest controller model is gone.
- [ ] No dark transparent face squares remain in view.
- [ ] Make fist: teleport arc appears.
- [ ] Arc is cyan/purple and round-particle based, not square boxes.
- [ ] Fist/hand glows while teleport is active.
- [ ] Release fist: player leaps to the target.
- [ ] No pinch/fingertip teleport trigger is required.
- [ ] Site remains untouched.
