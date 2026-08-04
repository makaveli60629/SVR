# Phase 193

Game-side only.

Added:
- `game/modules/phase193_quest_teleport_forward_fix_lock.js`

Purpose:
- teleport starts off instead of always on
- grip toggles teleport armed state
- trigger or pinch aims/commits teleport
- teleport auto-disarms after a move
- hides extra straight laser/pointer overlays
- aligns visible teleport target to camera/head direction
- patches movement fallback so forward follows head/camera direction

Runtime audit:
```js
SVR_RUN_PHASE193_INPUT_AUDIT()
```

Helpers:
```js
SVR_PHASE193_TELEPORT_ON()
SVR_PHASE193_TELEPORT_OFF()
```

Test URL:
`/game/?v=phase193-quest-teleport-forward-fix`
