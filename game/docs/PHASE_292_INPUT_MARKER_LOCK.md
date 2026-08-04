# Phase 292 Input Marker Lock

Build: `PHASE-292-INPUT-MARKER-LOCK`

## Summary

Phase 292 updates two game-side items.

## Admin marker

- Admin marker is moved into the user marker group.
- Admin marker is moved away from the table area for now.
- Player, Android, and Quest markers are grouped near the same user marker row.

## Hand teleport

- Pinch starts hand teleport aim.
- Release triggers teleport.
- Fist remains available as fallback.
- Controller fallback remains preserved.

## Files changed

```text
game/modules/teleport_phase101j_forward_lock.js
game/phase292_admin_pill_user_group_lock.js
game/index.html
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase292-input-marker-lock
```
