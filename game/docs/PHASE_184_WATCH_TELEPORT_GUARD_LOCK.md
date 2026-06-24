# Phase 184 — Watch Teleport Guard Lock

## Scope
Game-side only. No website or site edits.

## Purpose
Stop accidental hand pinch from turning teleport on/off through the watch while preserving the watch display and poker controls.

## Changes
- Adds `game/modules/phase184_watch_teleport_guard_lock.js`.
- Wraps the active teleport rig `toggleMode` path.
- Blocks teleport toggles while the active hand input reports pinch.
- Allows the Phase 174 face-fist toggle path to remain active.
- Keeps watch runtime active for display and poker/status controls.
- Updates `game/index.html` to Phase 184 cache keys.

## Runtime audit
```js
SVR_RUN_PHASE184_WATCH_TELEPORT_AUDIT()
```

## Test URL
`/game/?v=phase184-watch-teleport-guard`

## Expected test
1. Teleport OFF.
2. Look at watch/hand and pinch.
3. Teleport should not turn ON from accidental pinch.
4. Fist near face remains the deliberate ON/OFF gesture.
5. Watch should still display and report runtime status.
