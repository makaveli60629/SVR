# Update 3.1-E — Uploaded Floor / Table Texture Reuse Lock

## Scope
Game-side only. Site untouched.

## Uploaded packages inspected

### 38-floor.zip
Usable runtime candidates:
- `Textures/Material _25_Base_Color.png`
- `Textures/Material _25_Height.png`
- `Textures/Material _25_Metallic.png`
- `Textures/Material _25_Mixed_AO.png`
- `Textures/Material _25_Normal.png`
- `Textures/Material _25_Normal_OpenGL.png`
- `Textures/Material _25_Roughness.png`

Held for later conversion:
- `Floor.FBX`

### table2.zip
Usable runtime candidates:
- `Table 2/poker table.jpg`
- `Table 2/_maps_and_proxies/FabricPlainSoft-Black.jpg`
- `Table 2/_maps_and_proxies/LeatherScuffoldDiff.jpg`
- `Table 2/_maps_and_proxies/WoodOiledTile.jpg`
- `Table 2/_maps_and_proxies/Poker_table_masck.jpg`
- Additional metal, concrete, oak, plaster, velvet, and fabric maps

Held for later conversion:
- `Table 2/stool.fbx`
- `Table 2/table 2.max`

## Runtime work completed
- Added `phase225_uploaded_floor_table_texture_reuse_lock.js`.
- Added Quest-safe generated material overlays matched to the uploaded floor/table material sets.
- Added main floor and upstairs floor texture overlays.
- Added table felt, leather rail, and wood trim overlays.
- Registered an in-runtime audit object at `window.SVR_UPDATE31E_TEXTURE_REUSE_AUDIT`.
- Did not load heavy FBX/MAX files directly into WebXR.

## Runtime label
`UPDATE-3.1-E-UPLOADED-FLOOR-TABLE-TEXTURE-REUSE-LOCK`

## Test URL
`https://svrpoker.com/game/?v=phase225-texture-reuse`

## Next recommended pass
Convert only the useful model pieces to optimized GLB:
1. Convert `Floor.FBX` to lightweight GLB or use only its PBR texture set.
2. Convert `stool.fbx` if it is visually better than current seats.
3. Ignore `table 2.max` for browser runtime unless converted externally.
4. Bake/resize textures to 512 or 1024 for Quest.
5. Keep table geometry stable and apply only safe overlays until geometry alignment is approved.
