# PHASE-231-MAIN-IMPORT-RECOVERY-LOCK

## Scope
- Adds a live decision-aid line for the player turn.
- Calculates call cost against current pot to show pot-odds percentage.
- Labels action pressure as FREE CHECK, LOW PRESSURE, MEDIUM PRESSURE, or HIGH PRESSURE.
- Emits a modular `svr_poker_decision_aid_update` event for backend/site hooks.
- Public Matrix launch page remains untouched.

## Locked gameplay direction
- Poker first.
- Dealer body remains disabled.
- Invisible deal/card logic remains preserved.
- Game package remains under 25 MB.
