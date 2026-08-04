# Phase 210

Game-side only.

Added:
- `game/modules/phase210_camera_relative_movement_balcony_fix_lock.js`

Purpose:
- force forward movement to follow camera/head direction
- fix 45-degree movement where forward felt sideways
- patch exposed rig move function when available
- add keyboard/gamepad camera-relative movement fallback
- rebuild second-floor balcony above pillars
- add aligned glass fence/bar around the balcony opening
- keep sky removed

Runtime audit:
```js
SVR_RUN_PHASE210_AUDIT()
```

Test URL:
`/game/?v=phase210-camera-relative-movement-balcony-fix`
