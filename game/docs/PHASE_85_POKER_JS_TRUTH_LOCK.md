# Phase 85 — Poker.js Truth Lock

Game-side only. Site untouched.

## Added

- `game/modules/p85_poker_truth_lock.js`

## Wired

- `game/index.html` now loads Phase 85.
- Phase 84 table-control override remains active.
- Poker truth module loads after table-control override.

## Locked poker behavior

- Six seats: player plus five bots.
- Dealer body remains invisible / not required.
- New hand flow:
  - preflop
  - flop
  - turn
  - river
  - showdown
- Player controls:
  - Fold
  - Check
  - Call
  - Raise
  - All-In
  - Next Hand
- Desktop hotkeys:
  - `F` fold
  - `K` check
  - `C` call
  - `R` raise
  - `A` all-in
  - `H` next hand
- Bot decisions:
  - check
  - call
  - raise
  - fold
- Chip accounting:
  - blinds
  - bets
  - pot
  - winner payout
- Winner logic:
  - seven-card evaluation from two hole cards plus board
  - supports pair through straight flush

## Runtime checks

```js
SVR_RUN_PHASE85_POKER_AUDIT()
SVR_POKER_NEXT_HAND()
SVR_POKER_ACTION('fold')
SVR_POKER_ACTION('check')
SVR_POKER_ACTION('call')
SVR_POKER_ACTION('raise')
SVR_POKER_ACTION('allin')
```

## Test URL

`/game/?v=phase85-poker-js-truth-lock`

## Next target

After testing Phase 85, the next phase should attach these actions to the watch UI and VR hand/controller interaction layer.
