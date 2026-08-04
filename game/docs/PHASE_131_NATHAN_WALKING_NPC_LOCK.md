# Phase 131 — Nathan Walking NPC Lock

## Scope

Game-side only. Website, site, backend, and database files are untouched.

## Added

- Added `game/modules/npc_nathan_walker_phase131.js`.
- Wired the module into `game/main.js`.
- Added a Nathan walking patrol route around lobby/store/Reiki/lounge/scorpion target areas.
- Added animation mixer support through Three.js `FBXLoader`.
- Added a fallback walking pill NPC so the scene does not break if the binary FBX asset is missing.
- Updated build/version labels to `UPDATE-3.0-PHASE-131-NATHAN-WALKING-NPC-LOCK`.

## Required binary asset path

The real uploaded Nathan FBX must be committed here:

`game/assets/npc/nathan/rp_nathan_animated_003_walking_u3d.fbx`

The uploaded zip contains the correct small Unity/Three-friendly FBX file:

`rp_nathan_animated_003_walking_u3d.fbx`

## Local commit steps

1. Extract `55-rp_nathan_animated_003_walking_fbx.zip`.
2. Copy `rp_nathan_animated_003_walking_u3d.fbx` into:

   `game/assets/npc/nathan/`

3. Commit and push:

```powershell
git add game/assets/npc/nathan/rp_nathan_animated_003_walking_u3d.fbx
git commit -m "Add Nathan walking NPC FBX asset"
git push origin main
```

## Test URL

`https://svrpoker.com/game/?v=phase131-nathan-walking-npc`
