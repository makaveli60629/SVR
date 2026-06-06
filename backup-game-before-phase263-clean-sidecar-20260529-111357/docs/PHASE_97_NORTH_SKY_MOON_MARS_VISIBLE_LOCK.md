# Phase 97 — North Sky Moon Mars Visible Lock

## Scope
Game/WebXR only. Website/site remains locked and untouched.

## Fixed
- Moon and Mars moved higher into the north sky.
- Lobby now gets a guaranteed visible textured Moon/Mars fallback pair named `SVR_NORTH_SKY_MOON_MARS`.
- Fallback pair is larger and closer so it is visible on Quest.
- Private rooms now use higher north-sky placement.

## Preserved
- Phase 96 Quest floor blinking fix.
- Phase 96 hand teleport hotfix.
- Phase 94 Reiki portal hologram.
- Private scene routing.

## Test
Open:

```text
https://svrpoker.com/game/?v=phase97-north-sky-planets
```

Verify:

- Build label shows `PHASE-97-NORTH-SKY-MOON-MARS-VISIBLE-LOCK`.
- Look toward the north/back sky above the lobby skyline.
- Moon should be high-left in the north sky.
- Mars should be high-right/deeper in the north sky.
