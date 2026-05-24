# PHASE-84-SKYLINE-CLONE-HOTFIX

## Fix
Prevents the boot crash:

`
TypeError: Cannot read properties of undefined (reading 'clone')
at buildSkylineRoom (.../game/modules/world_skyline.js)
`

## Root cause
sceneTargets cloned optional hub/private-scene vectors without checking whether those objects were present after a partial deploy or route mismatch.

## Locked behavior
- Lobby preserved
- Website untouched
- Private scene routing preserved
- Missing optional hub targets now fail soft instead of black-screening the game
- world_skyline.js is patched only around the scene target registry
