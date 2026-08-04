# Phase 178 — Structure Watch Logo Lock

## Scope
Game-side only. No site edits.

## Built
- New module: `game/modules/phase178_structure_watch_logo_lock.js`
- Replaces old stair / upper structure objects with a new solid upper structure.
- Adds walkable steps, top landing, second floor slab, tight edges, and aligned glass panels.
- Adds a height-follow patch so desktop, Android, and VR can follow the stair and second-floor height path.
- Enlarges the SVR floor logo into a carpet under the table.
- Removes nearby rails, ropes, poles, and posts around the table and old stair area.
- Keeps overlay cleanup running.
- Keeps watch expected/enabled in the runtime audit.

## Runtime audit
```js
SVR_RUN_PHASE178_STRUCTURE_AUDIT()
```

## Test URL
`/game/?v=phase178-structure-watch-logo`
