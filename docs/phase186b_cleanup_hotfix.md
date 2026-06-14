# Phase 186B Cleanup Hotfix

## Purpose

Fix the runtime error shown in the browser:

TypeError: Cannot create property 'visible' on boolean 'true'

## Root cause

The Phase 186 cleanup pass inspected scene.userData and tried to set `.visible = false` on values that were not Three.js objects. Some userData keys are booleans, so the cleanup pass needed an object guard.

## Fixed files

- game/modules/phase186_deploy_sync_cleanup.js
- game/phase176_boot.js
- game/index.html
- game/version.json

## Fix details

- Added `isObject3D()` guard.
- Added `safeHide()` helper.
- Cleanup now only changes visible state on valid objects.
- Non-object userData values are ignored safely.
- Loader cache changed to `phase186b-cleanup-hotfix`.

## Preserved

- Official Phase 185 lobby look.
- Table selector.
- Lobby bounds.
- Quest movement.
- Controller fallback.
- Android controls.
- Watch.
- Store hubs.
- Moon and Mars.

## Test URL

/game/?v=phase186b-cleanup-hotfix

## Runtime checks

window.SVR_PHASE185_OFFICIAL_LOOK
window.SVR_PHASE186_DEPLOY_SYNC

## Commits

- 2d5208e427ea9ac63ef9fba0534ee6ea3ac3137b
- 0bb39c294aad2f8b118396c295705b013b050d18
- 382639b48147aa3c900686aaff17c3bf11710cfb
- 9b42176845f3b77caafc00b7659a9dcde330d4de
