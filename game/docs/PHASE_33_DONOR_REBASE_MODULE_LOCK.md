# Phase 33 donor rebase module lock

## Baseline
- donor archive: uploaded `game.zip`
- deploy target: `update/game.zip` only
- site untouched

## Locked controls
- Meta hands only visual path
- no watch
- no fake arms
- left-stick move
- right-stick 45 degree snap turn
- fist near face toggles teleport fallback

## Permanent removals in this phase
- wrist watch runtime path disabled
- glove / arm shell overlays removed
- slate / competitor-style floor removed

## Modules
- `modules/world_skyline.js` -> lobby shell, floor, wall, room, reiki, pga, sponsor
- `modules/teleport.js` -> locomotion and teleport fallback
- `modules/hands.js` -> hand/controller bridge
- `main.js` -> assembly and mode lock

## Next step
- continue re-integrating real donor lobby geometry and assets while preserving this control lock
