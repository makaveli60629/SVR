# Phase 319 Room Access Buttons Android Guard Lock

Build: `PHASE-319-ROOM-ACCESS-BUTTONS-ANDROID-GUARD-LOCK`

## Summary

Phase 319 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds easy room access buttons for desktop and Android, plus an Android/mobile viewport guard for the black-side movement issue.

## Room buttons

```text
Lobby
Poker
Reiki
PGA Range
Chip/Putt
Scorpion
Store
Lounge
```

## Behavior

- Creates a fixed quick-access room button panel.
- Uses existing route execution when available.
- Falls back to camera movement when a route is missing.
- Re-applies viewport height using `visualViewport` / `innerHeight`.
- Forces app/canvas sizing to full viewport.
- Prevents mobile touchmove page drag while preserving button taps.
- Re-sizes renderer and camera aspect on Android movement, viewport resize, and touch events.
- Releases hidden boot overlays if a black overlay reappears.

## Runtime globals

```text
window.SVR_PHASE319_GO_ROOM(key)
window.SVR_PHASE319_LAST_ROOM_BUTTON
window.SVR_PHASE319_ROOM_ACCESS_BUTTONS_ANDROID_GUARD_LOCK
```

## Files changed

```text
game/phase319_room_access_buttons_android_guard_lock.js
game/phase318_deal_path_pulse_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase319-room-buttons-android-guard
```
