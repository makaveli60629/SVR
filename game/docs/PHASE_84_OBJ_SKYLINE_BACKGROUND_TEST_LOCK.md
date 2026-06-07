# Phase 84 — OBJ Skyline Background Test Lock

## Scope
Game-side only. Website/site files are not touched.

## Added
- `game/modules/obj_skyline_loader.js`
- `game/assets/models/skyline/buildings_sprite.obj`
- `game/assets/models/skyline/skyline_03.obj`
- `game/assets/models/skyline/skyline_04.obj`

## Behavior
The module loads a controlled set of uploaded OBJ building assets and places cloned copies as a distant skyline/background ring outside the lobby. The material pass is dark neon blue/cyan so Moon/Mars remain visible and the new buildings do not overpower the lobby.

## Performance rule
This is a test lock. Only three OBJ source files are used first. If Quest frame rate remains stable, future phases can convert the assets to optimized GLB and expand the skyline ring.

## Runtime marker
`PHASE-84-OBJ-SKYLINE-BACKGROUND-TEST-LOCK`
