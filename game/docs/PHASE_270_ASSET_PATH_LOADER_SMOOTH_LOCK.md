# PHASE 270 — Asset Path Loader Smooth Lock

## Audit result
The live game was looking for assets under:
- /game/assets/models

But the repo also has assets under:
- /assets/models
- /assets/assets_backup

The old asset_base.js only used the game-local asset folder.

## Fixes
- Added root /assets fallback.
- Added root /assets/assets_backup fallback.
- Kept /game/assets as first priority.
- Reduced GLTF/OBJ/FBX missing asset HUD spam.
- Optional model misses now fall back procedurally instead of cluttering the lobby.
- Site untouched.

## Note
The deploy workflow excludes *.fbx from direct deploy. Prefer optimized GLB for future live model assets.

## Next
PHASE-271-QUEST-MOVEMENT-TELEPORT-HARDENING-LOCK
