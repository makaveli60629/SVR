# Phase 263 — Geometry + Sky Hard Lock

**Build:** `PHASE-263-GEOMETRY-SKY-HARD-LOCK`  
**Track:** game-only lobby geometry / sky hardening  
**Site touched:** no

## Purpose

Phase 263 continues the screenshot-driven lobby cleanup after Phase 262.

It hardens the runtime pass for:

- duplicate storefront/arch visuals
- columns cutting through signs
- store display blocks protruding into the walkway
- Moon/Mars sitting too low or too close to the skyline
- `VR NOT SUPPORTED` overlay text still appearing during desktop preview

## Protected Baseline

- Phase 261 Roman/new lobby remains the active baseline.
- No Phase 84 rollback.
- No old lobby restore.
- No site changes.
- No Truitive/Trueitive/founder branding.

## Runtime Changes

The existing cleanup module remains wired through:

```text
game/modules/phase262_geometry_sky_alignment_lock.js
```

For compatibility, the exported function name remains:

```js
installPhase262GeometrySkyAlignmentLock()
```

But its active runtime label is now:

```text
PHASE-263-GEOMETRY-SKY-HARD-LOCK
```

## Fixes

1. Pushes all rear columns farther back.
2. Slims rear columns so storefront signs are easier to read.
3. Moves Phase 202 storefront shells farther toward the rear wall.
4. Scales down internal storefront display geometry.
5. Softens store plinth blocks so they no longer read as heavy duplicate black blocks.
6. Preserves one Moon and one Mars only.
7. Moves Moon/Mars higher and farther back.
8. Fixes the halo pass so Phase 262/263 halos are not hidden as duplicate Moon/Mars objects.
9. Adds stronger suppression for `VR NOT SUPPORTED` overlay text.
10. Keeps no-Truitive/no-founder runtime safety pass.

## Manual QA

Open:

```text
https://svrpoker.com/game/?v=phase263-geometry-sky-hard-lock
```

Check:

- Phase 263 label is active.
- Moon and Mars are high in the sky, not attached to the building line.
- Only one Moon and one Mars are visible.
- Storefront wall has fewer duplicate panels.
- Columns are less intrusive against signs.
- Store shelf blocks are less heavy/less obstructive.
- No `VR NOT SUPPORTED` center overlay.
- No Truitive/Trueitive/founder branding.
- Site remains unchanged.

## Next Phase Recommendation

If this passes screenshot QA, next phase should be a **micro-alignment pass only**:

- adjust individual sign heights
- reduce any remaining z-fighting
- tune camera spawn angle
- verify Quest performance
