# Phase 101H - Scene Geometry Cleanup

## Purpose

Clean the live Phase 260 scene after the screenshot showed duplicated overlays and old canopy/side-panel geometry still visible.

## Screenshot issues addressed

- Backwards/mirrored Roman canopy label.
- Old Phase 257/258/259 canopy geometry still present with Phase 260.
- Large blocky black side panels crowding the walkway.
- Visual clutter around the Roman canopy archway.
- Walking path needs to stay open and readable.

## Patch applied

### New module

```text
game/phase101h_scene_geometry_cleanup.js
```

This module removes stale scene roots and panel objects:

```text
PHASE257_ROMAN_CANOPY_ROOT
PHASE258_ROMAN_CANOPY_SMOOTH_ROOT
PHASE259_ROMAN_CANOPY_COLONNADE_POLISH_ROOT
PHASE257_CANOPY_SIGN
PHASE258_CANOPY_SIGN
PHASE200_LEFT_JUMBOTRON_SLOT
PHASE200_LEFT_JUMBOTRON_SLOT_FRAME
PHASE200_RIGHT_JUMBOTRON_SLOT
PHASE200_RIGHT_JUMBOTRON_SLOT_FRAME
```

It also removes matching stale Phase 257/258/259 canopy objects that reinstall from older timers.

### Phase 260 wire-in

`game/phase260_roman_canopy_archway_final_lock.js` now imports:

```text
./phase101h_scene_geometry_cleanup.js?v=phase101h-scene-geometry-cleanup
```

This lets the current Phase 260 module own the final cleanup without rewriting the whole game entry.

## Preserved

- Phase 260 Roman canopy root.
- Quest/WebXR runtime.
- Head-forward movement.
- Teleport runtime.
- Android compatibility.
- Watch module.
- Reiki/PGA/Sponsor scene targets.

## Debug status

Cleanup state is available in browser console:

```text
window.SVR_PHASE101H_SCENE_CLEANUP
```

## Validation checklist

- [ ] Game still loads Phase 260.
- [ ] Mirrored canopy label is gone.
- [ ] Old Phase 257/258/259 canopy duplicates are gone.
- [ ] Large blocky black side panels are gone.
- [ ] Walkway is more open.
- [ ] Phase 260 canopy remains visible.
- [ ] No lobby redesign occurred.

## Locked rule

This is a scene cleanup only. No website rebuild, no Android movement change, no Unity-only logic, and no sponsor content changes.

## Commit name

```text
Phase 101H - Scene Geometry Cleanup, Remove Duplicate Canopy Overlays, Open Walking Path
```
