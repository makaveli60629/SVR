# Phase 336 — Authoritative Poker Rules and Pot Settlement Lock

## Build
`PHASE-336-AUTHORITATIVE-POKER-RULES-POT-SETTLEMENT-LOCK`

## Purpose
Phase 336 replaces the temporary fixed-raise/single-pot poker logic with one authoritative Texas Hold'em engine. Physical chips, button actions, gesture actions, player stacks, round bets, the displayed pot, burn cards, community cards, and payouts now resolve through the same game state.

## Preserved systems
- Phase 332 denomination chips, pickup, gravity, throwing, bounce, spin, stacking, and pass-line commitment.
- Phase 333 Quest-safe shaders, lighting, turn panel, and XR action controls.
- Phase 334 professional pass line, proportional logo, seated calibration, two-column chips, player-facing cards, Eric bots, and gestures.
- Phase 335 Oculus sightline, chip recovery, card stability, bot governor, and duplicate-action debounce.

## Authoritative gameplay changes
- One canonical player stack and contribution ledger.
- Exact per-street bets plus total-hand contributions.
- Variable raise-to amounts and minimum full-raise enforcement.
- Short all-in raises do not incorrectly reopen betting.
- Correct check, call, bet, raise, fold, and all-in validation.
- Correct dealer, blind, preflop, and postflop action order.
- Folded, busted, and all-in players are skipped correctly.
- One real burn card before flop, turn, and river.
- Main and side pots generated from contribution levels.
- Folded chips stay in pots while folded players remain ineligible.
- Tied winners split each pot, including odd-chip table-order distribution.
- Uncontested pots settle immediately.
- Busted players remain at zero instead of automatically returning to 1,000 chips.
- Bots consider hand strength, pot odds, stack pressure, position, and street.
- Short interrupted-hand snapshots restore after browser or headset interruption.

## Physical chip bridge
Phase 336 consumes the Phase 332 pending physical-chip total on the final call or raise. A short physical call is automatically completed when the player still has sufficient chips. A physical amount above the call is validated against the minimum raise.

## Runtime API
```js
window.SVR_POKER_ACTION('check')
window.SVR_POKER_ACTION('call')
window.SVR_POKER_ACTION({ type: 'raise', raiseTo: 160 })
window.SVR_POKER_ACTION('allin')
window.SVR_POKER_ACTION('fold')
window.SVR_POKER_COMMIT_PHYSICAL_BET(85)
window.SVR_POKER_RAISE_TO(160)
window.SVR_POKER_LEGAL_ACTIONS()
window.SVR_POKER_NEXT_HAND()
window.SVR_RESET_POKER_TABLE(1000)
```

## Runtime QA
```js
window.SVR_RUN_PHASE336_POKER_AUDIT()
window.SVR_PHASE336_RULES_QA()
window.SVR_PHASE336_PHYSICAL_BET(85)
window.SVR_PHASE336_RAISE_TO(160)
```

## Validation completed
- JavaScript syntax checks passed for the evaluator, engine, visual bridge, compatibility bridge, and loader.
- JSON parsing passed for both release manifests.
- Deterministic tests passed for straight flush, wheel straight, full house, multi-level side pots, and folded-player eligibility exclusion.

## Protected scope
- Game-side files only.
- Public website untouched.
- Sponsor and partner content untouched.
- Android stable touch route remains separate.
- APK remains `0.1.0-rc1`, code `1`, with no forced update.
- This phase does not claim server-authoritative network multiplayer.
