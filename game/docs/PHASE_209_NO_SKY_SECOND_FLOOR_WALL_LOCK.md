# Phase 209

Game-side only.

Added:
- `game/modules/phase209_no_sky_second_floor_wall_lock.js`

Scope:
- remove sky visuals completely
- remove Moon, Mars, planets, stars, sprite sparkle, pulse, and blinking sky objects
- create a second-floor balcony ring
- make each second-floor corner touch the room walls
- keep the real FBX table and poker logic active

Boot cleanup:
- removed active sky modules from boot
- removed lobby overlay modules that were fighting the wall/corner alignment

Runtime audit:
```js
SVR_RUN_PHASE209_AUDIT()
```

Test URL:
`/game/?v=phase209-no-sky-second-floor-wall-lock`
