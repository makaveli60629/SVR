# Phase 90 — Scorpion Table Production Surface Lock

Game-side only. Site untouched.

## Added

- `game/modules/p90_surface_polish_lock.js`

## Updated

- `game/scorpion-table-test.html`

## Purpose

This phase upgrades the isolated Scorpion table test toward an investor-ready poker table prototype while keeping the accepted Quest seat/view.

## Surface corrections

- Keeps the lower play surface established from Quest feedback.
- Adds a procedural luxury felt surface.
- Adds a gold table line.
- Adds a subtle lower table glow.
- Applies procedural brick/noise materials to room surfaces.
- Keeps cards and chips snapped to the lower play surface.
- Keeps Phase 89 grab/release behavior active.

## What is protected

- Main lobby boot is not changed.
- Website files are not changed.
- No A-Frame framework injection.
- No craps module is added yet.
- No active-room merge yet.

## Runtime checks

```js
SVR_RUN_PHASE90_SURFACE_AUDIT()
SVR_RUN_PHASE89_SURFACE_AUDIT()
SVR_RUN_PHASE85_POKER_AUDIT()
```

## Test URL

`/game/scorpion-table-test.html?v=phase90-scorpion-table-production-surface-lock`

## Acceptance checks

- The seat/view remains the same accepted Quest position.
- Felt area looks richer and not flat.
- Cards and chips sit on the lower felt surface.
- Chips remain smaller than before.
- Grab/release still works.
- No main lobby movement stack is involved.

## Next

After Quest approval, lock the accepted surface height and seat offset into a reusable Scorpion room route module.
