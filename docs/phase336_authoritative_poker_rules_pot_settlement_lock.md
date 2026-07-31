# Phase 336 — Authoritative Poker Rules and Pot Settlement Lock

## Result
Phase 336 replaces the temporary fixed-raise and single-pot poker logic with one authoritative Texas Hold'em engine.

### Locked improvements
- Player stacks, round bets, physical-chip amounts, total contributions, and displayed pot use one state.
- Variable raises and minimum-raise rules are enforced.
- Short all-ins do not improperly reopen betting.
- Main pots, side pots, split pots, and tied winners settle correctly.
- Dealer, blinds, and street action order rotate correctly.
- Burn cards are removed from the real deck before flop, turn, and river.
- Busted players remain at zero until an explicit table reset.
- Bots account for hand strength, pot odds, stack pressure, position, and street.
- Interrupted hands can recover from a short browser or headset interruption.

## Test route
`https://svrpoker.com/game/index.html?v=phase336-authoritative-poker`

## Runtime QA
```js
window.SVR_RUN_PHASE336_POKER_AUDIT()
window.SVR_PHASE336_RULES_QA()
window.SVR_PHASE336_PHYSICAL_BET(85)
window.SVR_PHASE336_RAISE_TO(160)
```

## Release policy
- APK: `0.1.0-rc1`
- Version code: `1`
- Forced update: `false`
- Public website untouched.
- No claim of completed server-authoritative multiplayer.
