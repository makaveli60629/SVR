# Phase 87 — Real Texture Moon/Mars Sky Lock

Game-side only update.

## Locked changes
- Removed the fake simple Moon/Mars sphere look from the active sky pass.
- Rebuilt Moon and Mars as texture-backed sky-body groups using existing real texture assets:
  - `game/assets/texture/moon_diffuse.png`
  - `game/assets/texture/moon_bump.png`
  - `game/assets/texture/mars/diffuse_1k.jpg`
  - `game/assets/texture/mars/bump_1k.jpg`
- Raised Moon and Mars very high above the skyline.
- Added additive glow halos, rim glow, and point-light glow.
- Added slow independent rotation.
- Added slow orbit drift while keeping both high and behind the skyline.
- Preserved lobby structure and private-scene routing.
- Website/site untouched.

## Notes
The project did not include separate Moon/Mars `.glb` model files in the current package, so this phase creates GLB-style textured sky-body groups from the real texture assets already in the game. If dedicated Moon/Mars GLB files are supplied later, they can replace these groups without changing the lobby structure.
