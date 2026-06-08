# Version 1.6.5 - Single Sky Controller Lock

## Scope
Game side only.

## Why
The live build was flipping between 1.6.3 and 1.6.4 and Moon/Mars still did not move. That means multiple sky modules were fighting or an older module was winning after load.

## Fix
- Removes all old sky module script tags from game/index.html.
- Injects exactly one sky controller: svr_phase_1_6_5_single_sky_controller_lock.js.
- Uses A-Frame <a-scene>.object3D first, so the module works even when window.scene is not exposed.
- Hard-locks Moon/Mars every frame.
- Hides lower duplicates.
- Updates build label to 1.6.5.
- Caps skyline/buildings in the planet corridor.

## Locked values
- Moon: height 4500, size 340, position [-280, 4500, -3200]
- Mars: height 4500, size 300, position [260, 4500, -3700]

## Protected
- Website/site untouched.
- Reiki room untouched.
- Existing Reiki runtime files hash-protected.
- Lobby baseline not rebuilt.

## Test
https://svrpoker.com/game/?v=1-6-5-single-sky-controller
