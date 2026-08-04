# Phase 209 — Quest Locomotion Teleport Stair Sky Lock

## Purpose
Phase 209 addresses the reported Quest blockers:

- Black transparent squares stuck in the player's face.
- Forward/backward movement becoming sideways after turning 45 degrees.
- Grip / trigger / A not reliably arming teleport.
- Freeze risk after previous overlay fixes.
- Moon and Mars too low/small/plain.
- Stairs visible but not walkable.

## Scope
Game-side only. Site untouched.

## Changed files
- `game/index.html`
- `game/modules/teleport.js`
- `game/phase209_quest_stability_scene_fix.js`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`

## Fixes
### Face overlay / black squares
- Adds bounded cleanup for camera-attached black square / guide overlay objects.
- Suppresses HTML overlays during XR.
- Keeps cleanup bounded so it does not create another freeze loop.

### Locomotion
- Right-stick forward/back now moves only along the current headset look direction.
- Side drift / strafe is disabled for this pass.
- 45-degree head turns should preserve forward as forward.

### Teleport
- A / grip / trigger are treated as hold-release teleport inputs.
- Hold to arm and show the ray.
- Release to teleport.
- Includes Quest button indexes 0, 1, 2, 3, 4, and 5.

### Stairs / upstairs
- Adds `window.SVR_PHASE209_FLOOR_HEIGHT(x,z)`.
- Teleport locomotion now reads the floor height and adjusts reference-space height on stairs and upstairs walkways.

### Moon / Mars
- Moon is doubled in size.
- Moon gets procedural crater texture.
- Mars is enlarged and textured.
- Both are raised higher.
- Moon rotates and softly orbits.
- Mars rotates and orbits around the Moon position.

## Preserved
- Phase 207 freeze recovery guard.
- Phase 208 performance monitor.
- Existing lobby/storefront structure.
- Watch module.
- Hands/controller fallback.
- Store portal.
- Site untouched.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase209-quest-fix`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-209-QUEST-LOCOMOTION-TELEPORT-STAIR-SKY-LOCK`.
- [ ] Enter Quest VR and confirm there are no black squares locked to the face.
- [ ] Push forward while looking straight; movement goes forward.
- [ ] Turn head 45 degrees; push forward; movement follows the current look direction.
- [ ] Hold A / grip / trigger; teleport ray appears.
- [ ] Release A / grip / trigger; teleport executes.
- [ ] Walk onto stairs; height rises with the stair path.
- [ ] Moon is higher, larger, textured, rotating/orbiting.
- [ ] Mars is higher, larger, textured, rotating/orbiting.
- [ ] Stay in lobby for 90 seconds and confirm no freeze.

## Next phase recommendation
Phase 210 should only happen after Quest confirmation. If stable, re-add a single lightweight selection highlight inside `main.js` only. Do not add another independent boot loop.
