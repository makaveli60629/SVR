# Phase 207

Game-side only.

Added:
- `game/modules/phase207_lobby_recovery_visual_stability_lock.js`

Purpose:
- recover cleaner lobby look after table fixes
- keep real FBX table visible
- hide old clutter from earlier visual authority modules
- add clean walls, gold trim, square columns, and soft canopy lighting
- preserve active room portals
- keep one Moon and one Mars

Runtime audit:
```js
SVR_RUN_PHASE207_LOBBY_AUDIT()
```

Test URL:
`/game/?v=phase207-lobby-recovery-visual-stability`
