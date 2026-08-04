# Phase 316 Deal Order Seat Badges Lock

Build: `PHASE-316-DEAL-ORDER-SEAT-BADGES-LOCK`

## Summary

Phase 316 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds visible numbered seat badges so the left-to-right deal order is obvious in the room.

## Behavior

- Reads `window.SVR_PHASE169_DEAL_ORDER`.
- Places numbered deal badges at each poker seat.
- Highlights the active seat when `svr-left-to-right-card-dealt` fires.
- Stores badge state in `window.SVR_PHASE316_DEAL_ORDER_SEAT_BADGES_STATE`.
- Adds `window.SVR_PHASE316_REFRESH_DEAL_BADGES()`.
- Emits `svr-deal-order-seat-badges-updated`.

## Files changed

```text
game/phase316_deal_order_seat_badges_lock.js
game/phase315_left_to_right_sequence_monitor_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase316-seat-badges
```
