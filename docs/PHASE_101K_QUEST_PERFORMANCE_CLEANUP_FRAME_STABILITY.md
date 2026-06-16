# Phase 101K - Quest Performance Cleanup and Frame Stability Pass

## Purpose

Improve Quest/WebXR frame stability after the live build reached Phase 260 and the overlay/geometry/camera cleanup phases were added.

## Scope

Game-side only.

No website rebuild. No Android movement changes. No lobby redesign. No Unity-only logic.

## Patch applied

### New module

```text
game/phase101k_quest_performance_cleanup.js
```

This module adds a Quest-focused final pass:

- Reduces Quest renderer pixel ratio.
- Lowers XR framebuffer scale.
- Ensures foveation is high when supported.
- Disables shadows.
- Reduces expensive material settings on Quest.
- Lowers high light intensity.
- Hides debug/helper/dust/sprite/starfield style objects on Quest only.
- Adds a lightweight frame probe for smoke testing.

### Phase 260 wire-in

`game/phase260_roman_canopy_archway_final_lock.js` now imports:

```text
./phase101k_quest_performance_cleanup.js?v=phase101k-quest-performance-cleanup
```

This runs after the HUD cleanup, scene geometry cleanup, and camera/path polish modules.

## Debug / smoke-test object

Use Quest browser console:

```text
window.SVR_PHASE101K_PERFORMANCE
```

Expected fields:

```text
renderer.pixelRatio
renderer.framebufferScale
renderer.foveation
scene.meshes
scene.hidden
scene.lights
frames.avgMs
frames.worstMs
frames.slow
```

## Validation checklist

- [ ] Quest WebXR enters correctly.
- [ ] Scene still shows Phase 260 canopy.
- [ ] Double overlays stay hidden.
- [ ] Duplicate old canopy geometry stays removed.
- [ ] Teleport ray still points forward.
- [ ] Head-forward walking still works.
- [ ] Frame probe records average frame time.
- [ ] No Android movement regression.
- [ ] No website change.

## Locked rule

This is a performance cleanup only. Do not redesign the lobby or replace the Phase 260 scene.

## Commit name

```text
Phase 101K - Quest Performance Cleanup and Frame Stability Pass
```
