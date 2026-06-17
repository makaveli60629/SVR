# Phase 320 Android Desktop Movement Pad Guard Lock

Build: `PHASE-320-ANDROID-DESKTOP-MOVEMENT-PAD-GUARD-LOCK`

## Summary

Phase 320 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds a simple movement pad for Android and desktop preview testing while keeping the mobile viewport sized correctly.

## Controls

```text
Android / touch: on-screen arrows
Desktop: WASD or arrow keys
Q / E: snap turn
```

## Behavior

- Adds a bottom-left movement pad.
- Supports forward, back, left, right, and snap turns.
- Uses camera-facing movement direction.
- Uses teleport/player API when available, with camera fallback.
- Re-applies viewport height and renderer size while moving.
- Releases any returning runtime overlay before movement.
- Stores last movement in `window.SVR_PHASE320_LAST_MOVEMENT`.

## Runtime globals

```text
window.SVR_PHASE320_ANDROID_DESKTOP_MOVEMENT_PAD_GUARD_LOCK
window.SVR_PHASE320_LAST_MOVEMENT
window.SVR_PHASE320_LAST_SNAP
window.SVR_PHASE320_RESIZE_VIEW
```

## Files changed

```text
game/phase320_android_desktop_movement_pad_guard_lock.js
game/phase319_room_access_buttons_android_guard_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase320-move-pad
```
