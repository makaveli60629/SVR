# Phase 321 Update 3.1 Stability QA Lock

Build: `PHASE-321-UPDATE-3-1-STABILITY-QA-LOCK`

## Summary

Phase 321 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds a live readiness panel for Update 3.1 before packaging.

## Checks

```text
Canvas sizing
Room buttons
Movement pad
Poker deal lock
Android viewport
Desktop preview
Ready for package
```

## Behavior

- Collects viewport and canvas size.
- Checks renderer and camera readiness.
- Checks room access buttons are installed.
- Checks Android/Desktop movement pad is installed.
- Checks poker left-to-right deal lock is present.
- Releases returning overlays.
- Re-applies viewport/canvas sizing when needed.
- Stores readiness in `window.SVR_UPDATE31_READY_STATE`.
- Emits `svr-update31-stability-qa`.

## Runtime globals

```text
window.SVR_PHASE321_UPDATE31_STABILITY_QA_LOCK
window.SVR_PHASE321_UPDATE31_STABILITY_QA_STATE
window.SVR_UPDATE31_READY_STATE
window.SVR_PHASE321_AUDIT_UPDATE31_STABILITY
```

## Files changed

```text
game/phase321_update31_stability_qa_lock.js
game/phase320_android_desktop_movement_pad_guard_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase321-stability-qa
```
