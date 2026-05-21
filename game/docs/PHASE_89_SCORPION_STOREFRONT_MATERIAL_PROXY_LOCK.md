# Phase 89 — Scorpion Storefront Material Proxy Lock

## Scope
Game-side only.

This phase adds a lightweight second-table / material proxy display for the Scorpion storefront using the uploaded material maps.

## Locked rules

- Website/site untouched.
- Current lobby preserved.
- Main poker table not replaced.
- Scorpion private room remains a separate private scene.
- Raw `table 2.max` is not loaded at runtime.
- Raw FBX/MAX assets stay out of the live WebXR path until optimized to GLB.
- Package remains deploy-safe and under 25 MB.

## Added files

```text
game/modules/scorpion_storefront_proxy.js
game/assets/textures/scorpion/scorpion_bare_metal_512.jpg
game/assets/textures/scorpion/scorpion_concrete_512.jpg
game/assets/textures/scorpion/scorpion_bronze_tile_512.jpg
game/assets/textures/scorpion/scorpion_raw_wood_512.jpg
game/assets/textures/scorpion/scorpion_ochre_fabric_512.jpg
game/assets/textures/scorpion/scorpion_black_fabric_512.jpg
game/assets/textures/scorpion/scorpion_pattern_carpet_512.jpg
game/assets/textures/scorpion/scorpion_vip_carpet_512.jpg
game/assets/textures/scorpion/scorpion_light_wood_512.jpg
```

## Runtime behavior

The module installs a freestanding material display near the Scorpion storefront anchor:

- patterned Scorpion storefront carpet
- small second-table proxy
- black felt sample
- wood rail/top sample
- bare metal base/trim
- bronze rail trim
- concrete/material boards
- sign reading `SCORPION TABLE`

The module sets:

```js
window.SVR_PHASE89_SCORPION_STOREFRONT_PROXY
```

## Conversion note

`table 2.max` should be converted outside the runtime pipeline:

```text
table 2.max → FBX/GLB → optimized GLB → texture assignment → runtime module
```

Do not load `.max` directly in WebXR.
