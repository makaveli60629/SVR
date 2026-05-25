# Phase 199 — All-In Contribution Lock

## Scope
- Adds per-seat contribution ledger during each hand.
- Caps all betting/calling/raising/all-in payments to the available stack.
- Marks all-in players when a player spends their full stack or cannot cover the requested amount.
- Exposes `svr_poker_allin_update` events for backend/game telemetry.
- Preserves public Matrix page, private scenes, poker controls, left-to-right dealing, and clean Reiki approval lock.

## Notes
This is a contribution/all-in safety lock. Full multi-side-pot split calculation can build on the contribution ledger in the next phase.
