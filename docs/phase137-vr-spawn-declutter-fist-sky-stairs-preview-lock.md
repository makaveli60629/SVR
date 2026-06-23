# Phase 137 — VR Spawn Declutter + Fist Teleport + Sky/Stair/Preview Lock

## Scope

Game-side only. The public website and `/site` were not touched.

This phase responds to live Oculus feedback:

- too many displays directly in front of spawn
- hand teleport ray appears but release does not reliably complete teleport
- desire for fist-look toggle to arm/disarm teleport
- black square/overlay artifacts in headset
- red stairs not connected to second floor
- duplicate black stairs / duplicate fences / duplicate walkway visuals
- storefront wall gaps and split upper/lower storefront alignment
- Camera 3 / live preview seeing clutter instead of clean lobby
- Moon/Mars ring artifacts and incorrect moon texture behavior

## Runtime changes

### Teleport control

Updated the movement wrapper:

- build label: `PHASE-137-FIST-ARMED-TELEPORT-RELEASE-COMMIT-LOCK`
- clench fist while looking at hand toggles teleport armed state
- pinch teleport requires fist-arm state
- unarmed pinch is blocked so it does not accidentally move the player
- release commit is no longer reverted by the short-hold guard
- poker-action teleport blocking remains preserved
- right-stick head-forward correction remains preserved

Runtime globals:

```js
window.SVR_PHASE137_FIST_ARMED_TELEPORT_RELEASE_COMMIT_LOCK
window.SVR_PHASE137_FIST_TELEPORT_TOGGLE_EVENT
```

### Lobby declutter

Added:

```text
game/phase137_vr_spawn_declutter_fist_sky_stairs_preview_lock.js
```

This module:

- hides diagnostic/checklist/build boards from spawn view
- keeps a small permanent phase badge
- moves tutorial guidance to a compact table-side tutorial panel
- injects a DOM overlay guard for black HUD/square/fallback overlays
- hides duplicate stair/fence/walkway visuals from older layers
- adds one connected red stair system with red-carpet steps and a continuous walk surface
- installs a floor-height override for the red stair ramp and second floor
- adds upstairs/downstairs storefront frames and glass window panels
- pushes storefront presentation forward to close the visual wall gap
- rebuilds Moon/Mars as clean Phase 137 sky objects
- hides old moon/mars/orbit/ring artifacts
- makes Mars orbit the Moon and scale larger when closer to the player
- hides extra tags and panels in Camera 3 / director preview mode

Runtime globals:

```js
window.SVR_PHASE137_VR_SPAWN_DECLUTTER_FIST_SKY_STAIRS_PREVIEW_LOCK
window.SVR_RUN_PHASE137_VR_CLEANUP_QA()
window.SVR_PHASE137_SKY_ORBIT_STATUS
window.SVR_PHASE137_FLOOR_HEIGHT
```

## QA command

Run in browser console:

```js
window.SVR_RUN_PHASE137_VR_CLEANUP_QA()
```

Expected checks:

- Phase 137 root exists
- phase badge exists
- fist teleport lock exists
- table tutorial panel exists
- connected red stairs exist
- clean moon exists
- Mars orbit object exists
- upstairs/downstairs storefront frames exist
- siteTouched is false

## Test URL

```text
https://svrpoker.com/game/?v=phase137-vr-cleanup
```

Use Ctrl+F5 / hard refresh before testing.

## Preserved

- `/site` untouched
- public root untouched
- Phase 135 spawn cleanup preserved
- Phase 136 poker action rail preserved
- poker logic untouched
- watch logic untouched
- store URL untouched
- no unapproved sponsor branding added
