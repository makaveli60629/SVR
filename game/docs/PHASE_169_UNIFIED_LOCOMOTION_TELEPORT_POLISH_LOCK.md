# Phase 169 — Unified Locomotion Teleport Polish Lock

## Scope
Game-side only. Public website/site files remain untouched.

## Why this exists
The supplied locomotion design was written as an A-Frame component. SVR's current game runtime is a Three.js modular boot stack, so the fix was adapted into the existing movement facade instead of pasting A-Frame code into the active game.

## Files changed
- `game/modules/movement_phase169_locomotion_polish_lock.js`
- `game/modules/movement_phase228.js`
- `game/main.js`
- `update/version.json`

## Runtime behavior
- Hand pinch hold: aim teleport, release to move.
- Hand fist hold: aim teleport, release to move.
- Controller trigger/grip/A-style hold: aim teleport, release to move.
- Right thumbstick up/down: forward/back movement using current head/camera direction.
- Right thumbstick left/right: snap-turn remains preserved by the base locomotion stack.
- Y-axis guard rejects unexpected vertical jumps after teleport so the player does not sink through the floor, clip through the FBX table surface, or get launched vertically by table/collider offsets.
- Poker action teleport block remains respected when active.

## Compatibility
- Keeps Phase 168 playable poker/table visuals.
- Keeps Phase 164/166/167 table cleanup and table-surface locks.
- Keeps Android movement path untouched.
- Keeps website/site untouched.

## Runtime globals
- `window.SVR_PHASE169_UNIFIED_LOCOMOTION_TELEPORT_POLISH_LOCK`
- `window.SVR_RUN_PHASE169_LOCOMOTION_AUDIT()`

## Test URL
`/game/?v=phase169-locomotion-polish`

## QA checklist
- On Quest, pinch and hold shows the teleport target/arc.
- Releasing pinch commits teleport only once.
- Fist hold/release still works.
- Controller trigger/grip hold shows teleport target/arc.
- Releasing controller trigger/grip commits teleport once.
- Right stick forward moves relative to where the headset is facing.
- Right stick left/right snap-turns.
- Teleport does not sink below floor or jump upward from table/FBX surface offsets.
