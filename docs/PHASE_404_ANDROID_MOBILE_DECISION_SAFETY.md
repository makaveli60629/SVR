# Phase 404 — Android Mobile Decision Safety

## Build

`PHASE-404-ANDROID-MOBILE-DECISION-SAFETY-LOCK`

## Baseline

Phase 404 is a browser-only Android presentation/safety layer over the locked Phase 403 poker engine.

Protected authorities remain:

- Poker engine: `PHASE-403-ANDROID-POKER-ENGINE-RELIABILITY-LOCK`
- Side-pot rules: `PHASE-403-ANDROID-SIDE-POT-RULES-LOCK`
- Visual table order: `PHASE-402-ANDROID-VISUAL-LEFT-SEAT-ORDER-LOCK`
- Raise/call rules: `PHASE-398-ANDROID-RAISE-SIZING-SMOOTHNESS-LOCK`
- Tournament director: Phase 401
- iPhone/Safari: Phase 400
- Quest: Phase 396
- Android APK: `0.1.0-rc2`, code `2`, manual update only

## Permanent table order

`YOU → Nova → Claudia → Eric → Maya → Darius → YOU`

Phase 404 does not alter this order.

## Mobile safety changes

### Double-tap ALL IN confirmation

The Phase 404 script is loaded before the Phase 403 gameplay engine.

- First ALL IN tap is intercepted during capture.
- The event is prevented from reaching the normal engine handler.
- The button changes to `CONFIRM ALL IN`.
- Confirmation remains armed for 2.6 seconds.
- A second tap during that window is allowed through to the Phase 403 engine.
- Tapping another action, starting a new hand, expiration, or hiding the page cancels the armed state.

This is a mis-tap guard only. It does not alter legal poker action rules.

### Decision information strip

The strip is inserted inside `#raisePanel`, not as an additional `.shell` grid child. This preserves the established portrait and landscape shell layout.

It displays factual decision information only:

- current pot
- exact call amount
- pot odds for the call
- player stack
- current minimum raise-to amount

It does not recommend whether the player should fold, call, raise, or go all-in.

### Paced all-in runout presentation

The Phase 403 engine still computes the hand and payouts. Phase 404 detects when at least two live players remain and no player can take another action because the remaining players are all-in.

For presentation:

- unrevealed community-card elements are temporarily hidden,
- the winner banner and complex showdown sheets are held back,
- flop / turn / river are exposed in order at a 720 ms step,
- the stored Phase 403 winner presentation is restarted after the visible runout finishes.

This keeps the payout authority in Phase 403 while preventing an all-in board from visually dumping all remaining streets at once.

### Screen-awake request

When supported by the browser, Phase 404 requests the Screen Wake Lock API while the player is joined and the page is visible. It releases the lock when play is not active or the page is hidden. Browsers that do not support wake lock continue normally.

## Playtest session report

A new `SESSION` button shows local session statistics including:

- hands started/completed
- pots won
- main pots won
- side pots won
- all-in runouts
- biggest pot
- play time

`COPY TEST REPORT` produces a JSON QA report containing the local session summary, current game position, viewport/browser information, and existing Phase 403/398/401 QA snapshots.

The report remains in `sessionStorage` unless the player explicitly copies it. The report does not intentionally include passwords or payment data.

## Routes

- Android hub: `/game/android.html?channel=stable&v=phase404`
- Practice: `/game/android-tabletop.html?v=phase404&mode=practice`
- Regular: `/game/android-tabletop.html?v=phase404&mode=regular`
- Direct runtime: `/game/android-stable-phase404.html?v=phase404&mode=regular&direct=1`
- Tournament portal: `/game/tournaments.html?v=phase404`
- Reiki tournament: `/game/android-tabletop.html?v=phase404&mode=tournament&tournament=reiki-first-50`
- Tournament results: `/game/tournament-results.html?v=phase404`

## Backend truth

Phase 404 does not make shared multiplayer live. Automatic cross-device matchmaking, shared tournament registration, authoritative cross-device crown state, and live voice still require the secure game-sync/signaling backend.

## Physical acceptance checklist

Android handset testing should confirm:

1. Practice, Regular, and Tournament open Phase 404.
2. Portrait table remains fitted and does not gain an extra shell row.
3. Landscape table remains compact and playable.
4. First ALL IN tap does not commit chips.
5. Second ALL IN tap within 2.6 seconds does commit the action.
6. Armed ALL IN expires/cancels correctly.
7. Pot / call / pot odds / stack / min raise values remain legible.
8. When all remaining players are all-in, unrevealed board cards appear in paced street order.
9. Winner result is not visually spoiled before the paced runout completes.
10. SESSION statistics increment across multiple hands.
11. COPY TEST REPORT works on the handset.
12. Existing Phase 403 side-pot, action-order, teaching and tournament behavior remains correct.

No physical handset or headset validation is claimed by source/CI checks alone.
