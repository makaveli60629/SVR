# Phase 360 — Fresh Shuffle, Leave Reset, and Continuous Table Lock

## Objective

Correct owner-reported table-session problems without replacing the certified Android, Quest, poker, table, or input authorities.

Reported symptoms:

- NEXT HAND sometimes failed after extended play.
- Leaving the table and returning did not start over.
- The same hole-card pair appeared in consecutive games, creating concern that the deck was not changing.
- Meta card pickup needed a clear current-status answer.

## Root cause

Phase 336 intentionally saves the current hand to `localStorage` and restores interrupted hands for up to 30 minutes. Android Phase 347 LEAVE only returned the camera to lobby movement; it did not clear that poker recovery snapshot. Rejoining could therefore recover the same hand and the same cards.

Phase 336 uses `Math.random()` during its synchronous Fisher–Yates shuffle. It does shuffle, and repeated pairs are mathematically possible, but it did not expose a deck fingerprint or prefer the browser cryptographic random source.

## Phase 360 behavior

### Fresh random source

Phase 360 wraps synchronous Phase 336 start/reset calls only while the deck is being created:

- Uses `crypto.getRandomValues` when available.
- Restores the original `Math.random` immediately after the engine call.
- Keeps a complete dealt-plus-remaining deck fingerprint for diagnostics.
- Fails release acceptance if the exact complete deck order repeats.
- Does **not** falsely state that the same two-card pair can never occur naturally.

### Browser session behavior

- A new browser/app tab session receives a fresh six-player table and a fresh deck.
- A same-tab accidental reload may still use Phase 336 recovery.
- A deliberate LEAVE clears the Phase 336 recovery snapshot and arms a fresh table for the next SIT/JOIN.
- Rejoining resets six players to 1,000 play-money chips and starts a fresh hand.

### Continuous practice loop

Phase 359 remains the nine-second winner/result and automatic NEXT HAND authority.

Phase 360 protects the loop when:

- Fewer than two players have chips, or
- The human player has been eliminated.

In that local practice condition, the six-seat play-money table resets to 1,000 chips per player and begins a fresh session instead of becoming stuck.

## Meta card interaction truth

Phase 334 currently supplies:

- Tracked-hand pinch pickup near either human hole card.
- Quest controller-trigger pickup fallback.
- Held-card movement.
- Release back to the table.
- Throw toward the center to fold.
- Table knock for Check/Call/Next Hand.
- Two-hand forward push for All In.

This is implemented in source and loaded in the Quest critical path. Physical headset acceptance for reach radius, pinch reliability, controller grip, throw-fold threshold, and visible jitter remains pending.

## Runtime APIs

```js
window.SVR_PHASE360_QA()
window.SVR_PHASE360_META_CARD_GRAB_QA()
window.SVR_PHASE360_FRESH_HAND()
window.SVR_PHASE360_LEAVE_TABLE()
window.SVR_PHASE360_JOIN_TABLE()
window.SVR_PHASE360_SECURE_NEXT_HAND()
window.SVR_PHASE360_STATE
```

## Test routes

```text
https://svrpoker.com/game/android.html?channel=stable&v=phase360
https://svrpoker.com/game/index.html?platform=quest&v=phase360
```

## Acceptance gate

The Phase 360 workflow requires:

1. Static secure-random and session-reset contracts.
2. Android-sized browser proof that consecutive deck fingerprints differ.
3. Deliberate leave followed by join resets to hand 1 with 6,000 chips.
4. Zero exact complete-deck repeats.
5. Zero page, console, and request errors.
6. Android complete-hand regression through showdown and NEXT HAND.
7. Quest complete-hand regression through showdown and NEXT HAND.
8. APK remains `0.1.0-rc1`, code `1`, manual-update-only.

## Product boundary

This remains local play-money poker against five bots. Phase 360 does not claim server-authoritative cards, balances, multiplayer poker, real-money gambling, or physical-headset acceptance.
