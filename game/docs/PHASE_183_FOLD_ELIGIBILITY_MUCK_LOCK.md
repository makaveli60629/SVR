# Phase 185 — Fold Eligibility + Muck Lock

Build: `PHASE-194-PLAYTEST-WIZARD-LOCK`

## Added

- Folded/mucked player state during each hand.
- Folded players are excluded from side-pot winner eligibility.
- Hand-history panel displays mucked/folded names.
- Showdown payload includes folded players.
- Browser event: `svr_poker_fold_eligibility_update`.

## Preserved

- Public Matrix page untouched.
- Direct `/game` folder deploy path.
- Dealer body disabled; invisible card/deal logic preserved.
- Unapproved wellness/founder branding removed.
- Package under 25 MB.
