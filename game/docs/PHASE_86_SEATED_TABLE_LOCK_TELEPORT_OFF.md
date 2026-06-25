# Phase 86 — Seated Table Lock + Teleport Off

Game-side only. Site untouched.

## Added

- `game/modules/p86_seated_lock.js`

## Purpose

This phase fixes the active seated gameplay problem:

- player must be seated directly in front of the table
- player must be close enough for table play
- hand/controller travel visuals must stay hidden while seated
- table gameplay must remain stable for the poker loop

## Boot order

`p86_seated_lock.js` loads after:

- Phase 84 table control override
- Phase 85 poker truth lock

This makes Phase 86 the last authority for seated table position and travel suppression.

## Runtime checks

```js
SVR_RUN_PHASE86_SEAT_AUDIT()
SVR_PHASE86_RESEAT()
```

## Expected result

- spawn/seat is at the south/front table position
- position HUD appears in front of the camera
- visible hand/controller travel ray is hidden
- movement/travel flags are set off while seated
- poker controls remain active

## Test URL

`/game/?v=phase86-seated-table-lock-teleport-off`

## Next

After this is confirmed in Quest, connect Phase 85 poker actions to the watch/VR interaction layer.
