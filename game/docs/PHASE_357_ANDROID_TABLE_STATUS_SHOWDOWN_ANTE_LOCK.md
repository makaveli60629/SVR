# Phase 357 — Android Table Status, Showdown, and Ante Lock

## Owner-reported defects

- SIT reported success but did not move the actual Android camera close enough to the table.
- The display did not identify the active player or show the amount bet.
- Showdown did not clearly identify the winner, amount won, winning hand, or winning cards.
- The table stopped after settlement instead of immediately offering the next hand.

## Implementation

- Keeps Phase 347 as the only MOVE, LOOK, and poker-button controller.
- Loads Phase 357 after the protected Android platform boot.
- Intercepts only SIT and RECENTER so the original Phase 347 seat state remains authoritative.
- Measures the camera and table in world coordinates.
- Moves the player rig by the exact camera-to-table-edge delta.
- Repeats the correction during the first second to defeat late camera resets.
- Adds one compact turn panel showing:
  - active player
  - street
  - player bet
  - amount to call
  - most recent action
  - all six players' current bets and actions
- Adds one showdown panel showing:
  - winner or split-pot winners
  - amount won
  - settled pot
  - winning hand name
  - winner hole cards
  - community board
- Shows ANTE UP / NEXT HAND immediately after settlement.
- The prompt accurately states that the next game is a $10 / $20 blind hand; Phase 336 remains the rule authority.

## Runtime APIs

```js
window.SVR_PHASE357_QA()
window.SVR_PHASE357_RECENTER()
window.SVR_PHASE357_ANTE_UP()
window.SVR_PHASE357_STATE
window.SVR_PHASE357_SEAT_STATE
```

## Protected locks

- Phase 336 remains poker, turn, betting, pot, winner, and hand-label authority.
- Phase 347 remains the only Android controller.
- Phase 356 freeze recovery remains active.
- No server-authoritative multiplayer claim.
- APK remains `0.1.0-rc1`, code `1`.
- `forceUpdate:false`
- `showUpdatePrompt:false`
- `manualUpdateOnly:true`

## Test route

`https://svrpoker.com/game/android.html?channel=stable&v=phase357`

## Real-device checklist

1. Tap SIT and confirm the camera moves to the south/front table edge.
2. Confirm the table center, cards, logo, and pot remain visible.
3. Confirm each turn identifies the player, bet, call amount, and last action.
4. Complete a hand and confirm winner, amount, hand name, hole cards, and board are displayed.
5. Tap ANTE UP / NEXT HAND and confirm the next hand begins without reloading.
