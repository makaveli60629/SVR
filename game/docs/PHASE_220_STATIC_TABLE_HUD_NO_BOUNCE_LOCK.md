# Phase 220

Game-side only.

Added:
- `game/modules/phase220_static_table_hud_no_bounce_lock.js`

Critical correction:
- removes the camera-follow floating panels from Phase 218 and Phase 219
- replaces them with a static table-anchored HUD
- adds a stable small position readout anchored to the table area
- keeps travel/teleport visuals quiet while table testing
- keeps table-first module active
- keeps six-player table visuals active

Runtime audit:
```js
SVR_RUN_PHASE220_NO_BOUNCE_AUDIT()
```

Test URL:
`/game/?v=phase220-static-table-hud-no-bounce`
