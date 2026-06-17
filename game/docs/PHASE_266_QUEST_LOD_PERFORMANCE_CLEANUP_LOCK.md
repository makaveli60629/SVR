# Phase 266 — Quest LOD Performance Cleanup Lock

Build: `PHASE-266-QUEST-LOD-PERFORMANCE-CLEANUP-LOCK`

Track: game-only Quest LOD / performance cleanup

Site touched: no

## Purpose

Phase 266 keeps the Phase 265 pillar/sign clearance and adds a safe Quest performance cleanup pass.

## Protected Baseline

- Phase 261 new lobby remains active.
- Phase 265 pillar/sign clearance remains protected.
- No old lobby restore.
- No Phase 84 rollback.
- No website changes.
- No Truitive/Trueitive/founder branding.

## Runtime Changes

Runtime cleanup is applied through:

```text
game/modules/phase262_geometry_sky_alignment_lock.js
```

## Cleanup Applied

- caps renderer pixel ratio for Quest/browser stability
- disables shadow map
- hides the subtle floor grid to reduce shimmer
- reduces star-field size and opacity
- reduces decorative neon/glow opacity
- softens store plinth blocks further
- freezes static lobby meshes where safe
- excludes Moon/Mars/halo objects from static freeze
- keeps one high/back Moon and one high/back Mars
- preserves no-Truitive/no-founder runtime policy

## Manual QA

Open:

```text
https://svrpoker.com/game/?v=phase266-quest-lod-performance-cleanup
```

Check:

- signs remain readable
- pillars remain out of the storefront sign faces
- Quest view should be less flickery/choppy
- floor grid should no longer shimmer
- Moon/Mars remain high/back
- no Truitive/Trueitive/founder content
- no Phase 84 rollback
- site remains unchanged
