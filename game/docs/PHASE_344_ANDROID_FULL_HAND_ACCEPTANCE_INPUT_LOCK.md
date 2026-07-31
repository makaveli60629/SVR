# Phase 344 — Android Full-Hand Acceptance and Input Lock

## Build
`PHASE-344-ANDROID-FULL-HAND-ACCEPTANCE-INPUT-LOCK`

## Purpose
Phase 344 hardens the Phase 343 Android gameplay interface without creating another controller or poker engine.

## Single-fire input broker
- Wraps `SVR_POKER_ACTION`, `SVR_POKER_RAISE_TO`, and `SVR_POKER_NEXT_HAND` after all Android gameplay modules load.
- Rejects actions when it is not the human player's turn.
- Rejects illegal actions using the Phase 336 legal-action list.
- Blocks the same action signature for 650 ms.
- Blocks duplicate NEXT HAND commands for 1100 ms.
- Displays one short action confirmation.
- Temporarily locks non-seat action buttons while the accepted action is being processed.

## Seated-view acceptance
- Uses the Phase 341 canonical table center for view checks.
- Allows intentional look movement.
- Requires three consecutive failed checks before recovery.
- Recenters only when the table is offscreen or the camera has moved outside the allowed table-distance envelope.
- Tracks recovery count through runtime QA.

## Community-card authority
- Keeps exactly five community-card HUD slots.
- Repairs the strip if a late DOM mutation changes its slot count.
- Synchronizes every slot directly from Phase 336 `state.community`.
- Confirms the number of visible HUD cards matches the authoritative community-card count.

## Full-hand acceptance recording
Every hand records:
- hand number
- preflop, flop, turn, river, and showdown transitions
- maximum community-card count
- player hole-card count
- action sequence and messages
- winners and settlement labels

A hand passes full acceptance when all five streets are observed, five community cards are present, and the player has two hole cards.

## Runtime QA
```js
window.SVR_PHASE344_QA()
await window.SVR_PHASE344_RUN_FULL_HAND_QA()
window.SVR_PHASE344_RECENTER()
window.SVR_PHASE344_HISTORY
```

`SVR_PHASE344_RUN_FULL_HAND_QA()` resets the local play-money table and automatically chooses check/call actions for up to three hands by default. It can be configured:

```js
await window.SVR_PHASE344_RUN_FULL_HAND_QA({ maxHands: 5, timeoutMs: 90000 })
```

## Protected locks
- One Phase 326 MOVE/LOOK controller authority.
- Phase 336 poker-ledger authority.
- Phase 341 canonical table/card geometry.
- Phase 342 adaptive performance governor.
- Phase 343 organized Android HUD.
- APK `0.1.0-rc1`, code `1`.
- Forced and recurring update prompts disabled.
