# Phase 199 — Side Pot Eligibility Lock

Build: `PHASE-225-PILOT-HANDOFF-CARD-LOCK`

## Locked additions
- Side-pot resolution from the Phase 199 contribution ledger.
- Per-seat payout array at showdown.
- Winning side-pot summary displayed in the table hand-history panel.
- New browser event: `svr_poker_side_pot_resolution`.
- Player and bot stacks remain capped at zero and payouts are added back by seat.

## Protected
- Public Matrix launch page untouched.
- Lobby structure preserved.
- Unapproved wellness/founder branding remains removed.
- Dealer body remains disabled; invisible card/deal logic preserved.
- Direct `/game` deployment preserved.
