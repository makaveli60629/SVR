# Phase 96 — Quest Floor Hand Teleport Hotfix

## Scope
Game/WebXR only. Website/site remains locked and untouched.

## Fixed
- Quest floor blinking/z-fighting by disabling large low transparent floor glow overlays that flicker in headset rendering.
- Hand teleport now works without the old face-toggle step:
  - hold fist or pinch
  - aim
  - release to teleport
- Added fist aiming fallback because closed fists can collapse the index-to-wrist aim vector.
- Controller teleport path remains:
  - hold A/grip/trigger
  - aim
  - release to teleport

## Preserved
- Private scene routing.
- Reiki portal hologram.
- Textured Moon/Mars in lobby and private rooms.
- Quest right-stick forward/back movement and 45-degree snap turn.

## Test
Open:

```text
https://svrpoker.com/game/?v=phase96-quest-floor-hand-teleport
```

Verify on Quest:

- Floor no longer blinks.
- Hold fist or pinch shows teleport marker/arc.
- Release fist or pinch teleports.
- Controller right stick still moves forward/back.
