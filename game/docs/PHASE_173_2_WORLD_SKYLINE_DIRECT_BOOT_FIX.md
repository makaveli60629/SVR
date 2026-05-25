# Phase 173.2 — World Skyline Direct Boot Fix

## Purpose
Fixes the live boot blocker:

```text
ReferenceError: createMatrixBillboardTexture is not defined
    at buildOuterCity
```

## Direct fix
`game/modules/world_skyline.js` now contains local, hoisted helper functions used by the skyline builder, including:

- `createMatrixBillboardTexture()`
- `createAdBillboardTexture()`
- `createPlaqueTexture()`
- `createSponsorPlateTexture()`
- `createStoreDisplayTexture()`
- `createOrbHaloSprite()`

## Lock
Game-side hotfix only. Site untouched. Poker Phase 173 winner proof and hand history preserved.
