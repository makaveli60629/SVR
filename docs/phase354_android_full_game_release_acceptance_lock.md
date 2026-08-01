# Phase 354 — Android Full-Game Release Acceptance Lock

## Purpose
Phase 354 answers one release question: can the Android web route complete a full local play-money poker hand after all controller, avatar, presence, table, and card modules load?

## Required acceptance sequence
1. Android page boots with one controller root.
2. Exactly one MOVE stick, one LOOK stick, one action panel, and six action buttons exist.
3. Legacy Android controls are physically absent.
4. SIT places the player at the south/front table position.
5. Two player-card slots and five community-card slots are visible.
6. The Phase 336 engine starts a six-seat hand with five bots.
7. Human turns are completed through legal CHECK, CALL, ALL IN, or FOLD actions.
8. At least one tested hand reaches five community cards and showdown.
9. A winner and settled pot are recorded.
10. Total table stacks remain exactly 6,000 chips after settlement.
11. The SVR center logo and raised pot display exist.
12. NEXT HAND increases the hand number.
13. Forced APK updates and automatic update prompts remain disabled.

## Runtime tools
```js
window.SVR_PHASE354_QA()
await window.SVR_PHASE354_RUN_ANDROID_FULL_GAME_ACCEPTANCE()
window.SVR_PHASE354_ACCEPTANCE_RESULT
```

The acceptance runner may attempt up to four hands because a legal bot hand can end uncontested before the river. It only passes after a complete five-community-card showdown is observed.

## Browser workflow
`.github/workflows/phase354-android-full-game-acceptance.yml` launches Chromium with an Android user agent and a 412 × 915 viewport. It opens:

`/game/android.html?channel=stable&v=phase354&acceptance=1`

The pull request cannot pass the Phase 354 gate unless the browser result reports `pass: true`.

## Product truth
A pass means the Android browser route supports a complete local play-money poker demo against five bots. It does not mean internet multiplayer poker, server-authoritative cards, production accounts, or the signed RC2 APK are complete.

## Protected locks
- Phase 336 poker rules and settlement authority
- Phase 341 table and card coordinate authority
- Phase 347 single Android controller and seated movement authority
- Phase 350 controller DOM deduplication authority
- APK `0.1.0-rc1`, code `1`
- Manual-only update policy
