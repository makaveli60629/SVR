# Phase 304 Scorpion Seat Reservation Lock

Build: `PHASE-304-SCORPION-SEAT-RESERVATION-LOCK`

## Summary

Phase 304 is game-side only. The public root page remains locked and untouched.

## Fix

Adds Scorpion table session state after the buy-in join flow.

## Behavior

- Listens for `svr-scorpion-table-join`.
- Reserves the open south player seat when Join is confirmed.
- Arms a spectator rail state when Spectate is confirmed.
- Stores session data in `window.SVR_PLAYER_SCORPION_TABLE_SESSION`.
- Emits `svr-scorpion-seat-reserved`.
- Shows a readable reservation/status panel near the Scorpion route area.

## Runtime globals

```text
window.SVR_PHASE304_SCORPION_SEAT_RESERVATION_LOCK
window.SVR_PHASE304_LAST_SEAT_RESERVATION
window.SVR_PLAYER_SCORPION_TABLE_SESSION
```

## Files changed

```text
game/phase304_scorpion_seat_reservation_lock.js
game/phase303_scorpion_buyin_join_flow_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase304-scorpion-seat-reservation
```
