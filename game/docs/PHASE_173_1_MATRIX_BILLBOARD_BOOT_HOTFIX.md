# PHASE-173.1 — Matrix Billboard Boot Hotfix

## Purpose
Fixes the boot-stopping runtime error:

```text
ReferenceError: createMatrixBillboardTexture is not defined
```

## Changed
- Added local fallback helper functions inside `game/modules/world_skyline.js`:
  - `createMatrixBillboardTexture()`
  - `createAdBillboardTexture()`
  - `createPlaqueTexture()`
  - `createSponsorPlateTexture()`
  - `createStoreDisplayTexture()`
  - `createOrbHaloSprite()`
- Preserved Phase 173 winner proof and hand history logic.
- No website/site changes.
- No lobby redesign.

## Test
1. Open `/game/?v=phase173-1-matrix-billboard-hotfix`.
2. Confirm the loading world error is gone.
3. Confirm the lobby skyline loads.
4. Confirm poker table actions and showdown proof still work.
