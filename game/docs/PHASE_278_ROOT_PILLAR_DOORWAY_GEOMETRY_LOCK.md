# Phase 278 Root Pillar Doorway Geometry Lock

Build: `PHASE-278-ROOT-PILLAR-DOORWAY-GEOMETRY-LOCK`

## Summary

Phase 278 moves the root geometry alignment module itself to doorway-jamb pillar positions and updates the boot loader cache keys.

## Why

Phase 276/277 aligned the late shim, but the root geometry module could still re-run and move pillars back across signs. Phase 278 fixes the root alignment pass directly.

## Files changed

```text
game/modules/phase262_geometry_sky_alignment_lock.js
game/index.html
game/docs/BUILD_VERSION.json
update/version.json
```

## Rear pillar target positions

```text
Column 1: x -15.4, z -15.78
Column 2: x  -9.0, z -15.78
Column 3: x  -3.0, z -15.78
Column 4: x   3.0, z -15.78
Column 5: x   9.0, z -15.78
Column 6: x  15.4, z -15.78
Column 7: x  18.45, z -15.92
```

## Test

```text
https://svrpoker.com/game/?v=phase278-root-pillar-doorway-geometry
```
