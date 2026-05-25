# PHASE-212-BOOT-DIAGNOSTIC-SNAPSHOT-LOCK

## Scope
- Added dealer button / blind-state telemetry for every hand.
- Added table rebuy continuity so busted seats refill safely before the next hand.
- Added visible dealer/SB/BB line in the hand-history panel.
- Added visible rebuy ledger line.
- Public Matrix launch page remains untouched.

## Runtime events
- `svr_poker_dealer_button_update`
- `svr_poker_rebuy_update`

## Locked rules
- Game package remains under 25 MB.
- Dealer body remains disabled; invisible deal/card logic remains.
- Unapproved wellness/founder branding stays removed.
