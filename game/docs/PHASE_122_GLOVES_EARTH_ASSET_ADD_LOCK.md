# Phase 122 — Gloves + Earth Asset Add Lock

## Build label
`UPDATE-3.0-PHASE-122-GLOVES-EARTH-ASSET-ADD-LOCK`

## Scope
Game-side asset addition only. Public site/backend files are untouched.

## Uploaded assets added

### Protective Gear Gloves
Source upload: `protective_gear_Gloves.zip`

Runtime location:

```text
game/assets/models/gloves/protective_gear/protective_gear_gloves.obj
game/assets/models/gloves/protective_gear/protective_gear_gloves.mtl
game/assets/models/gloves/protective_gear/protective_gear_skin_diffuse.jpg
game/assets/models/gloves/protective_gear/protective_gear_color.jpg
```

Purpose:
- future avatar/controller cosmetic
- future store item preview
- future glove equip/skin system

Lock:
- registered but not auto-loaded in the lobby yet
- do not force-load the OBJ on Quest until a GLB/Draco-optimized conversion is approved

### Earth Texture Set
Source upload: `59-earth.zip`

Runtime location:

```text
game/assets/texture/earth/earth_albedo_1k.webp
game/assets/texture/earth/earth_clouds_1k.webp
game/assets/texture/earth/earth_night_lights_1k.webp
game/assets/texture/earth/earth_bump_1k.jpg
game/assets/texture/earth/earth_land_ocean_mask_1k.webp
```

Purpose:
- future high-sky Earth object
- presentation/planet asset
- can replace procedural Earth texture later

Lock:
- the original `.blend` file is intentionally excluded from the runtime package
- source textures were optimized to 1K runtime-safe versions
- do not add the 45MB source zip or blend file to the deployed game package

## Runtime registry
Added:

```text
game/modules/asset_registry_phase122.js
```

This exposes:

```js
window.SVR_PHASE122_ASSETS
```

## Preserved locks
- Reiki storefront remains preserved.
- Lobby music remains off.
- Moon/Mars high lock remains preserved.
- Background building ring remains removed.
- Site/backend untouched.
- Package remains under the 25MB target.

## Next recommended asset phase
Convert gloves OBJ/MTL to a single optimized GLB before live auto-loading on Quest.
