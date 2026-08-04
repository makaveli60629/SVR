# Phase 359 — Dual-Platform Gameplay Continuity Lock

## Purpose

Unify the already-certified Android Phase 357 and Quest Phase 358 gameplay releases under one shared local-game continuity layer without replacing either platform authority.

## Platform authorities preserved

- Phase 336: poker rules, turns, cards, pots, winner settlement, balances
- Phase 341: canonical table/card coordinates and visible card meshes
- Phase 347: one Android MOVE/LOOK/action controller
- Phase 357: Android close seating, turn/bet display, showdown, ANTE UP
- Phase 331: Meta hand tracking and Quest table interaction
- Phase 358: Quest uploaded-table authority and full-game browser release

## Shared Phase 359 behavior

- Shows winner name
- Shows payout amount
- Shows winning hand label
- Shows winner hole cards
- Shows all five community cards
- Shows settled pot and conserved table chips
- Holds the result for nine seconds
- Automatically starts the next local hand after the result interval
- Supports immediate manual NEXT HAND
- Supports pausing/resuming continuous play

## Quest presentation

Quest receives an in-world winner sprite above the real uploaded table. The accepted Quest table authority remains:

`PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED`

The source asset is:

`game/assets/table.fbx`

The emergency Phase 358 table fallback is not accepted by the Quest release gate.

## Android presentation

Android continues to use the Phase 357 showdown panel. Phase 359 adds the continuous-play countdown and supplies a fallback result panel only if the Phase 357 panel is unavailable.

## Input locks

### Android

- Exactly one controller authority
- One MOVE stick
- One LOOK stick
- One action panel
- Left input moves left
- Right input moves right
- No visible legacy controllers

### Quest

- Meta hands primary
- Controller fallback available
- Headset-look forward movement
- 45-degree snap turn
- Hold to aim teleport; release to teleport
- No Android controller DOM

## Product truth

This phase certifies the shared browser gameplay layer for local play-money poker against five bots. It does not claim server-authoritative multiplayer, production internet cards/balances, real-money gambling, a signed Android RC2 APK, or completed physical-device testing.

## Test routes

- Android: `/game/android.html?channel=stable&v=phase359`
- Quest: `/game/index.html?platform=quest&v=phase359`

## Runtime QA

```js
window.SVR_PHASE359_QA()
window.SVR_PHASE359_WINNER()
window.SVR_PHASE359_NEXT_HAND()
window.SVR_PHASE359_TOGGLE_CONTINUOUS()
window.SVR_PHASE359_STATE
```

## Release gate

The Phase 359 GitHub workflow runs both existing platform browser acceptances on the same PR head:

1. Android complete hand through showdown and NEXT HAND
2. Quest complete hand through showdown and NEXT HAND
3. Shared continuity static contract
4. Uploaded FBX table existence and authority
5. Winner/card/payout presentation contract
6. APK 0.1.0-rc1 manual-update lock
