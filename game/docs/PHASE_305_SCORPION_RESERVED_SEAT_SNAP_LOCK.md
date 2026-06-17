# Phase 305 Scorpion Reserved Seat Snap Lock

Build: `PHASE-305-SCORPION-RESERVED-SEAT-SNAP-LOCK`

## Summary

Phase 305 is game-side only. The public root page remains locked and untouched.

## Fix

Adds seat snap execution after the Scorpion seat reservation state is created.

## Behavior

- Listens for `svr-scorpion-seat-reserved`.
- If Join is confirmed, snaps the player to the reserved Scorpion open south seat.
- Supports desktop camera movement.
- Supports XR teleport rig API when exposed.
- Includes XR reference-space fallback if no teleport API is exposed.
- Emits `svr-scorpion-seat-snap-complete`.

## Runtime globals

```text
window.SVR_PHASE305_SCORPION_RESERVED_SEAT_SNAP_LOCK
window.SVR_PHASE305_LAST_RESERVED_SEAT_SNAP
```

## Files changed

```text
game/phase305_scorpion_reserved_seat_snap_lock.js
game/phase304_scorpion_seat_reservation_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase305-scorpion-seat-snap
```
