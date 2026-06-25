# Phase 215

Game-side only.

Added:
- `game/modules/phase215_table_geometry_controller_watch_panel_lock.js`

Purpose:
- measure the real FBX table bounding geometry
- lower cards onto the tabletop surface
- keep chips inside the table/felt area
- raise bot tags and table status tag higher
- reinforce camera/head-relative controller forward movement
- keep sky hidden
- keep existing watch/portal module ready for the next watch menu phase

Runtime audit:
```js
SVR_RUN_PHASE215_TABLE_GEOMETRY_AUDIT()
```

Test URL:
`/game/?v=phase215-table-geometry-controller-watch-panel`
