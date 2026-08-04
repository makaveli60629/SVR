# Phase 317 Deal Direction Table Arrows Lock

Build: `PHASE-317-DEAL-DIRECTION-TABLE-ARROWS-LOCK`

## Summary

Phase 317 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds visible table-surface arrows so the locked poker deal order is easier to see during testing.

## Behavior

- Reads `window.SVR_PHASE169_DEAL_ORDER`.
- Draws numbered arrows on the table surface.
- Listens for `svr-left-to-right-card-dealt`.
- Highlights the active dealt seat arrow.
- Stores state in `window.SVR_PHASE317_DEAL_DIRECTION_TABLE_ARROWS_STATE`.
- Adds `window.SVR_PHASE317_REFRESH_DEAL_ARROWS()`.
- Emits `svr-deal-direction-arrows-updated`.

## Files changed

```text
game/phase317_deal_direction_table_arrows_lock.js
game/phase316_deal_order_seat_badges_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase317-deal-arrows
```
