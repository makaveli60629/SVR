# Phase 179-183 Foundation Sequence

## Scope
Game-side only. No website or site edits.

## Phase 179 — Watch Runtime Lock
- Adds `game/modules/phase179_watch_runtime_lock.js`.
- Audits watch runtime and teleport state.
- Keeps watch status visible to runtime checks.

## Phase 180 — Walkable Collision Lock
- Adds `game/modules/phase180_walkable_collision_lock.js`.
- Adds invisible barrier references for balcony and stair edges.
- Adds stair and second-floor height follow logic for desktop and XR rig.

## Phase 181 — Teleport Surface Validator Lock
- Adds `game/modules/phase181_teleport_surface_validator_lock.js`.
- Patches the active teleport rig setPlayerPose path.
- Clamps teleport targets to room bounds.
- Keeps teleport targets on ground or upper level.
- Moves invalid table-area targets away from the table center.

## Phase 182 — Table Fit Lock
- Adds `game/modules/phase182_table_fit_lock.js`.
- Rebuilds a final table surface fit over the real FBX table bounds.
- Adds fitted felt, outer table surface, and a pass-line marker layer.

## Phase 183 — Demo Status Lock
- Adds `game/modules/phase183_demo_status_lock.js`.
- Adds desktop demo status panel for teleport, table, poker, and watch readiness.

## Boot
- `game/index.html` is cache-busted to Phase 183.
- Phase 179 through 183 modules are loaded after Phase 178.
- `update/version.json` now points to Phase 183.

## Runtime audits
```js
SVR_RUN_PHASE179_WATCH_AUDIT()
SVR_RUN_PHASE180_COLLISION_AUDIT()
SVR_RUN_PHASE181_TELEPORT_AUDIT()
SVR_RUN_PHASE182_TABLE_AUDIT()
SVR_RUN_PHASE183_DEMO_AUDIT()
```

## Test URL
`/game/?v=phase183-foundation-sequence`
