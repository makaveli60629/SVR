# Phase 98 — Quest Stability Watch Fist Performance Lock

## Scope
Game/WebXR only. Website/site remains locked and untouched.

## Fixed
- Hard-disabled large low transparent floor overlays that cause Quest z-fighting/floor blinking.
- Reduced repair/render churn by removing the duplicate self-tick repair loop.
- Watch orientation corrected:
  - screen normal forced toward the viewer
  - local up forced upright
  - slimmer/closer forearm placement preserved
- Fist/pinch teleport refinement preserved:
  - hold fist or pinch
  - aim
  - release to teleport
- North-sky textured Moon/Mars preserved.
- Reiki portal hologram preserved.

## Test
Open:

```text
https://svrpoker.com/game/?v=phase98-quest-stability-watch-fist
```

Verify on Quest:

- Floor no longer blinks.
- Watch text is upright and faces the player.
- Hold fist or pinch shows teleport marker/arc.
- Release fist or pinch teleports.
- Frame rate is smoother than Phase 96/97.
