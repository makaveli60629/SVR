# Phase 198

Game-side only.

Added:
- `game/modules/phase198_duplicate_logo_moon_cleanup_lock.js`

Purpose:
- keep only one active floor logo
- keep only one active moon
- leave Mars visible as the moon-orbit object
- continue hiding duplicate logo and moon objects after boot
- suppress update popup overlays
- continue center rail cleanup

Runtime audit:
```js
SVR_RUN_PHASE198_AUDIT()
```

Test URL:
`/game/?v=phase198-duplicate-logo-moon-cleanup`
