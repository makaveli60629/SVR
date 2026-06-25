# Phase 208

Game-side only.

Added:
- `game/modules/phase208_sky_hard_reset_one_planet_lock.js`

Critical correction:
- removed older active sky authority modules from boot
- stops the stacked Moon/Mars conflict
- removes old Moon/Mars/planet objects at runtime
- creates exactly one stable Moon and one stable Mars from one module
- hides extra blinking glow/sprite clutter except protected portals

Runtime audit:
```js
SVR_RUN_PHASE208_SKY_AUDIT()
```

Test URL:
`/game/?v=phase208-sky-hard-reset-one-planet`
