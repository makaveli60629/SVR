# Phase 291 Player Slot Mapper Lock

Build: `PHASE-291-PLAYER-SLOT-MAPPER-LOCK`

## Summary

Phase 291 maps received player pose state into the Phase 287 pill slot markers.

## Runtime global

```text
window.SVR_PHASE291_PLAYER_SLOT_MAPPER_LOCK
```

## Behavior

- Reads available player pose state.
- Ignores the local player id when available.
- Maps up to four player entries into existing pill marker slots.
- Does not create a server connection.
- Preserves the disabled Phase 290 presence client.

## Files changed

```text
game/phase291_player_slot_mapper.js
game/index.html
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase291-player-slot-mapper
```
