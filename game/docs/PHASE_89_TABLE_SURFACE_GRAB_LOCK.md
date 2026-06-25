# Phase 89 — Table Surface + Grab Lock

Game-side only. Site untouched.

## Based on Quest feedback

The isolated Scorpion table seat/view is acceptable, but the table objects were floating too high because the real table has a hand-rest lip and the playable surface sits lower.

## Added

- `game/modules/p89_surface_grab_lock.js`

## Updated

- `game/scorpion-table-test.html`

## Corrections

- Drops the play surface by about six inches from the highest table bound.
- Hides floating Phase 85 table overlays in the isolated test page.
- Rebuilds smaller chips on the lowered surface.
- Rebuilds cards on the lowered surface.
- Adds basic WebXR select/squeeze grab behavior.
- Releasing a grabbed card/chip applies simple throw velocity.
- Keeps the seat/view unchanged.

## Runtime checks

```js
SVR_RUN_PHASE89_SURFACE_AUDIT()
SVR_RUN_PHASE85_POKER_AUDIT()
```

## Test URL

`/game/scorpion-table-test.html?v=phase89-table-surface-grab-lock`

## Acceptance checks

- Cards sit on the lower tabletop/felt plane, not floating above the hand rest.
- Chips are visibly smaller.
- A chip can be selected/grabbed with Quest controller/hand select source.
- Released chips/cards move briefly and settle back on the surface.
- Seat remains the same as the accepted test position.
