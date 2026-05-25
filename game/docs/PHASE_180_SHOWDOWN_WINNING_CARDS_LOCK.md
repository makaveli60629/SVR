# PHASE-219-AUTO-APPLY-VERIFY-LOCK

## Scope
- Keeps playable poker priority moving forward.
- Evaluates and stores the exact best five winning cards at showdown.
- Shows Winning 5 cards in the table status and hand-history panel.
- Emits `svr_poker_showdown_reveal` with winner, board, winning five, ranking, pot, and stacks.
- Adds backend/site starter hooks for showdown reveal storage.

## Protected
- Root public Matrix launch page untouched.
- Site redesign untouched.
- Dealer body remains disabled.
- Unapproved Reiki/AWAITING APPROVAL/founder branding remains removed from runtime.
- Game ZIP stays under 25 MB.
