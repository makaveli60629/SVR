# Phase 337 — Physical Pot and Winner Settlement Lock

## Build
`PHASE-337-PHYSICAL-POT-WINNER-SETTLEMENT-LOCK`

## Purpose
Phase 337 converts the Phase 336 authoritative pot ledger into a professional physical table presentation. Every displayed pot amount, eligible seat, winner, and split award is derived from the Phase 336 state.

## New systems
- Main-pot and side-pot chip stacks generated from exact ledger amounts.
- Contribution packets that move from each acting seat into the pot.
- Physical Phase 332 chips are visually collected into the authoritative pot after pass-line commitment.
- Dealer, small-blind, and big-blind buttons rotate from the live dealer state.
- Current-turn ring follows the authoritative acting seat.
- Main and side pots animate independently to eligible winners.
- Tied winners receive split-pot animations with odd-chip order matching the rules engine.
- Winner presentation stays on the far side above the table rather than in the headset sightline.
- Pot visuals reset automatically for the next hand.
- Pure deterministic QA validates side-pot amounts, eligibility, blind order, split awards, and visual-ledger equality.

## Preserved systems
- Phase 332 physical chip pickup, throwing, gravity, bounce, stacking, and pass-line commitment.
- Phase 333 Quest-safe shaders and XR action controls.
- Phase 334 table layout, cards, gestures, bots, and seated calibration.
- Phase 335 Oculus stability and clear sightline governor.
- Phase 336 authoritative rules, side pots, split pots, burn cards, betting order, and hand recovery.

## Runtime QA
```js
window.SVR_PHASE337_QA()
window.SVR_PHASE337_AUTOMATED_QA()
window.SVR_PHASE337_REBUILD()
window.SVR_PHASE337_DEMO_SETTLEMENT()
```

## Oculus route
`https://svrpoker.com/game/index.html?v=phase337-pot-settlement`

## Protected scope
- Game-side files only.
- Public website untouched.
- Sponsor and partner content untouched.
- Android stable route remains separate.
- APK remains `0.1.0-rc1`, code `1`, with no forced update.
- This phase does not claim server-authoritative multiplayer.
