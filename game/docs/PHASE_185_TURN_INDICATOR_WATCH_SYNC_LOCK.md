# Phase 185 — Turn Indicator + Watch Sync Lock

## Scope
Game-side runtime polish only. Public Matrix launch page remains untouched.

## Added
- Active turn indicator payload for table/watch UI.
- Player countdown turn indicator synced once per second.
- Bot action turn indicator for preflop/flop/turn/river.
- Cleaner hand-history panel spacing so stacks, side pots, action log, and legal actions do not overlap.
- Browser events: `svr_poker_turn_indicator_update` and `svr_watch_turn_indicator_update`.

## Preserved
- Public page untouched.
- Dealer body disabled.
- Invisible deal/card logic preserved.
- Poker side-pot/fold/all-in rules preserved.
- Zip under 25 MB.
