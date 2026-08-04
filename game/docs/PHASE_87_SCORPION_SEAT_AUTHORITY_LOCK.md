# Phase 87 — Scorpion Table Seat Authority Lock

Game-side only. Site untouched.

## Why this exists

Testing showed two active problems:

- the player was not seated close enough to the poker table
- hand-based travel/ray behavior could still appear while table gameplay was active

Phase 87 is the last boot authority for table-test seating.

## Added

- `game/modules/p87_scorpion_seat_authority.js`

## Boot rule

`p87_scorpion_seat_authority.js` loads after:

- Phase 84 table control override
- Phase 85 poker truth lock
- Phase 86 seated table lock
- the older runtime imports

This makes Phase 87 the final authority.

## Behavior

- Treats the active test as Scorpion table mode.
- Forces a close south/front seated table position.
- Repeats the seat correction after all older modules load.
- Hides hand/controller travel rays, arcs, markers, beams, reticles, and line objects while seated.
- Turns movement/travel flags off while seated.
- Adds a small position HUD.
- Keeps poker truth controls active.

## Runtime checks

```js
SVR_RUN_PHASE87_SCORPION_AUDIT()
SVR_PHASE87_RESEAT()
```

## Test URL

`/game/?v=phase87-scorpion-seat-authority-lock`

## Next

After Quest confirms the player is seated correctly and hand travel is suppressed, the next phase should wire Phase 85 poker actions into watch/buttons/VR interaction.
