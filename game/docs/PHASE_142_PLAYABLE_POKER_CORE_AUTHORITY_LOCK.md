# Phase 142 — Playable Poker Core Authority Lock

## Scope

Game-side only. `/site`, public root, and website files are not changed.

## Purpose

This phase adds a playable play-money poker state machine behind the existing Phase 136 VR poker action rail.

## What is included

- Play-money hand state.
- Six seats:
  - one south/front player seat
  - five bot seats
- User actions:
  - Fold
  - Check
  - Call
  - Raise
  - All-In
  - Next Hand
- Bot action loop.
- Poker streets:
  - Preflop
  - Flop
  - Turn
  - River
  - Showdown
- Pot tracking.
- Current bet tracking.
- Player and bot stacks.
- Basic showdown winner selection.
- Compact table-side state panel.
- Keyboard fallback:
  - F = Fold
  - C = Check / Call
  - V = Call
  - R = Raise
  - A = All-In
  - H or N = Next Hand
- VR action rail integration through `svr-poker-player-action`.

## Preserved from previous locks

- Phase 140 deal display removal remains active.
- Phase 141 Quest movement and teleport lock remains active.
- Dealer body remains disabled.
- Left-to-right deal logic is preserved.
- Lobby layout is not redesigned.
- Private scenes are not changed.
- Website is untouched.

## Runtime globals

```js
window.SVR_PHASE142_PLAYABLE_POKER_CORE_STATE
window.SVR_POKER_CORE_STATE
window.SVR_PHASE142_PLAYABLE_POKER_CORE_AUTHORITY_LOCK
window.SVR_RUN_PHASE142_POKER_AUDIT()
```

## QA command

Run after deploy:

```js
window.SVR_RUN_PHASE142_POKER_AUDIT()
```

Expected:

```text
active: true
playMoneyOnly: true
dealerBodyVisible: false
leftToRightDealLogicPreserved: true
siteTouched: false
```

## Oculus test checklist

1. Open `/game/?v=phase142-playable-poker-core`.
2. Confirm badge eventually reads `PHASE 142 • POKER CORE LOCK`.
3. Aim/select the Phase 136 action rail buttons.
4. Confirm state changes for Fold / Check / Call / Raise / All-In.
5. Confirm bots act after the user.
6. Confirm pot and stacks update.
7. Confirm Next Hand starts a fresh hand.
8. Confirm old deal display boards do not return.
9. Confirm Quest right-stick movement and hold-release teleport still work.

## Limitations

This is still play-money demo logic, not real multiplayer, not real-money gambling, and not final casino-grade hand evaluation. It is the first stable table-control state lock for Phase 143 improvement.
