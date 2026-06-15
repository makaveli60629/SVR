# Phase 101A - Boot Load Screen Recovery Patch

## Purpose

Fix the game getting stuck on the loading screen.

## Root cause found

`game/index.html` was only loading the Phase 257/258/259 overlay modules. Those modules wait for `window.__SVR_SCENE__`, but the real runtime entry `main.js` was not being loaded from the page. That means no scene was guaranteed to be created and the boot fallback could stay visible.

## Patch applied

### `game/index.html`

- Restored `main.js` as the real runtime entry.
- Added `phase101_boot_load_screen_recovery.js` before the runtime.
- Added `phase101_partial_runtime_render_guard.js` before the runtime.
- Kept Phase 257/258/259 Roman canopy polish modules after the runtime so they can install once `window.__SVR_SCENE__` exists.

### `game/phase101_boot_load_screen_recovery.js`

- Arms a boot-safe recovery guard.
- Captures runtime errors and promise rejections.
- Clears the loading overlay when the game is ready.
- Creates a minimal boot-safe lobby renderer if the real runtime never creates a scene.

### `game/phase101_partial_runtime_render_guard.js`

- Handles the partial-runtime case where `main.js` creates `window.__SVR_SCENE__` and `window.__SVR_RENDERER__` but stalls before its animation loop.
- Starts a temporary render loop so the user sees a visible scene instead of a stuck loading screen.
- Lets the full runtime overwrite the loop when it finishes.

### `game/version.json`

- Updated to `PHASE-101A-BOOT-LOAD-SCREEN-RECOVERY-LOCK`.

## Locked rules preserved

- WebXR game path only.
- No website rebuild.
- No Unity-only logic.
- No second lobby redesign.
- Quest controls preserved.
- Android compatibility preserved.
- Watch, teleport, hubs, moon, and Mars preserved.

## Validation checklist

- [ ] `/game/` loads past the boot screen.
- [ ] Boot overlay clears when `main.js` completes.
- [ ] If `main.js` fails before creating a scene, boot-safe lobby appears.
- [ ] If `main.js` stalls after creating a scene, partial render guard shows a visible scene.
- [ ] Phase 257/258/259 overlay modules still install after the scene exists.
- [ ] Quest WebXR button still appears when supported.
- [ ] Teleport and head-forward movement still use existing runtime modules.
- [ ] Android route still loads.
- [ ] `/deploy-health.json` updates after Pages deploy.

## Commit name

```text
Phase 101A - Fix Stuck Loading Screen, Restore Main Runtime, Add Boot Recovery Guard
```
