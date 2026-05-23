# PHASE-142-TELEPORT-CRITICAL-QUEST-CONTROLLER-WATCH-MOON-MARS-LOCK

## Purpose

The user reported that the game still freezes at teleport and requested that teleport become a priority module. Phase 142 makes teleport the critical module and adds targeted fixes without reintroducing the heavy animated sky.

## Files changed

- `game/modules/teleport.js`
- `game/modules/static_moon_mars.js`
- `game/modules/hand_texture_patch.js`
- `game/modules/watch_orientation_patch.js`
- `game/index.html`
- `docs/PHASE-142-TELEPORT-CRITICAL-QUEST-CONTROLLER-WATCH-MOON-MARS-LOCK.md`
- `update/version.json`

## Teleport critical changes

- Teleport commit is now deferred to the next animation frame.
- Teleport avoids forced `updateMatrixWorld(true)` during the commit path.
- Teleport uses world-root position shift only, not XR reference-space mutation.
- Teleport pointer is simplified to lightweight circle/ring meshes.
- Purple fire effects are simplified to small basic meshes without point lights.
- Controller movement speed was reduced for stability.
- Snap turn cooldown was increased.
- Pointer logo texture was disabled for Quest performance.

## Quest controller rules

- Controller models remain hidden.
- Controller proxies remain hands/fallback inputs.
- Hold trigger/A/grip to aim teleport.
- Release trigger/A/grip to teleport.
- Right/primary stick movement remains active.
- 45-degree snap turn remains active.

## Moon/Mars rule

Moon and Mars are restored as static lightweight objects:

- No skybox.
- No orbit loop.
- No animated planet update.
- Moon is high in the sky.
- Mars is high/east.

## Watch rule

The watch screen orientation patch rotates only the inner screen plane so the forearm placement remains locked.

## Hand texture rule

A lightweight hand texture/color patch attempts to recolor tracked hand meshes with warm skin and dark glove fallback materials while keeping controller models hidden.

## Test URL

```text
https://svrpoker.com/game/?v=phase142-critical-teleport
```

Hard refresh:

```text
Ctrl + F5
```

## Quest test checklist

1. Enter VR.
2. Confirm FPS overlay appears.
3. Confirm Moon and Mars are visible but static.
4. Confirm watch is no longer upside down.
5. Confirm hands have warmer visible material when hand mesh is available.
6. Test controller movement before teleport.
7. Hold trigger/A/grip to aim teleport.
8. Release to teleport.
9. Test hand fist/pinch teleport only after controller teleport is stable.

## If freezing continues

If teleport still freezes after Phase 142, the next step must be `PHASE-143-BARE-TELEPORT-ONLY-DIAGNOSTIC-LOCK`:

- no watch
- no audio
- no portals
- no table
- no textured floor
- no hand mesh
- only flat floor, controller proxy, and teleport

That will isolate whether the freeze is in WebXR world-root shifting, hand tracking, controller input, or scene load.
