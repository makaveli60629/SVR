# PHASE-179-BETTING-ROUND-CONSISTENCY-LOCK

## Scope
- Adds a legal-action state layer for the player turn.
- Displays call amount, min raise, and legal options on the table history/action panel.
- Broadcasts `svr_poker_legal_actions_update` events for watch/site/backend hooks.
- Normalizes illegal player actions so check cannot happen while facing a call.
- Preserves the 20-second timer: auto-check when free, auto-fold when facing a bet.

## Protected
- Root public Matrix launch page untouched.
- Website redesign untouched.
- Dealer body remains disabled.
- Unapproved Reiki/AWAITING APPROVAL/founder branding remains removed from runtime.
