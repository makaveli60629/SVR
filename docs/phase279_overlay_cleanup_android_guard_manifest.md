# Phase 279 — Overlay Cleanup + Android Guard

## Status
Pushed to `main`.

## Purpose
Clean duplicate screen overlays and duplicate scene markers, then add a lightweight Android black-screen guard.

## Files
- `game/phase279_overlay_cleanup_android_guard_lock.js`
- `game/phase277_status_marker_lock.js` updated to chain Phase 279 after Phase 277/278.

## Runtime helpers
```js
window.SVR_RUN_OVERLAY_CLEANUP()
window.SVR_PHASE279_STATE
```

## Checks
- Removes duplicate fixed status overlays.
- Hides duplicate phase/status/feedback/hitbox scene nodes.
- Verifies canvas size and attempts renderer resize if Android canvas becomes invalid.
- Keeps core poker/table helpers intact.

## Test URL
`https://svrpoker.com/game/?v=phase279-overlay-cleanup`
