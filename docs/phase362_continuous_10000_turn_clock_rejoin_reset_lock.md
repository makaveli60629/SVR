# Phase 362 — Continuous 10,000-Chip Tournament, Turn Clock, and Rejoin Reset Lock

## Objective

Provide one shared local play-money table policy for Android, Quest WebXR, and desktop browser while preserving the certified poker engine, platform controls, table authority, and APK policy.

## Table policy

- Six seats: one human and five bots.
- Every seat enters a fresh table with 10,000 play chips.
- Total table bankroll is 60,000 chips.
- Blinds remain 10 / 20.
- Each active player receives 15 seconds to act.
- A player whose active turn remains unchanged for 15 seconds folds automatically.
- Bots retain their existing normal strategy and usually act before the deadline.
- If a bot stalls, the same authoritative timeout fold is available.

## Continuous winner-take-all rotation

- Stacks persist from hand to hand.
- A player with zero chips remains out while funded players continue.
- The table does not reset merely because the human player busts.
- When exactly one funded player remains, that player is recorded as table champion.
- The next-hand request starts a new tournament with six 10,000-chip stacks.
- Total chips remain conserved at 60,000 during active hands, including committed chips.

## Leave and rejoin

- Android and Quest pause the turn clock before SIT / PLAY GAME.
- Deliberate LEAVE TABLE pauses continuous play and clears the interrupted-hand snapshot.
- Returning with SIT / PLAY GAME starts hand 1 on a fresh six-player 10,000-chip table.
- Quest returns to the standing lobby spawn before rejoining.

## Quest controls preserved

- Starts standing behind the uploaded poker table.
- Normal headset-forward movement before PLAY GAME.
- 45-degree snap turn.
- Hold-to-aim and release-to-teleport.
- Meta hands primary.
- Controller fallback preserved.
- PLAY GAME seats at the south/front position.
- Movement and teleport lock while seated.
- Head look and card interaction remain available.
- LEAVE TABLE returns to the lobby.
- Watch remains available.

## Android controls preserved

- Phase 347 remains the only MOVE, LOOK, and poker-button controller.
- Left input moves left; right input moves right.
- SIT and LEAVE remain the table-session controls.
- The 15-second clock appears above the game without creating another controller.
- Phase 350 physical controller-DOM cleanup remains active.

## Cross-platform presentation

- Android and desktop receive a compact HTML turn clock.
- Quest receives the HTML safety clock plus an in-world canvas clock above the table.
- The clock identifies the active player and changes to urgent red during the final five seconds.

## Runtime API

```js
window.SVR_PHASE362_QA()
window.SVR_PHASE362_STATE
window.SVR_PHASE362_CONSTANTS
window.SVR_PHASE362_RESET_TOURNAMENT()
window.SVR_PHASE362_NEXT_HAND()
window.SVR_PHASE362_LEAVE_TABLE()
window.SVR_PHASE362_JOIN_TABLE()
window.SVR_PHASE362_TIMEOUT_CURRENT()
```

## Acceptance gate

The Phase 362 workflow requires:

1. Static 10,000 / 60,000 / 15-second contracts.
2. Android clock paused before SIT.
3. Actual 15-second Android human timeout and automatic fold.
4. Automatic advance to another hand without freezing.
5. Android leave/rejoin reset to hand 1 and six 10,000-chip buy-ins.
6. Single-champion reset to six 10,000-chip stacks.
7. Quest standing lobby mode before PLAY GAME.
8. Quest seated mode, visible clock, LEAVE TABLE, and fresh rejoin.
9. Desktop 60,000-chip and 15-second policy load.
10. Existing Android and Quest complete-hand regressions.
11. Zero page, console, and request failures in the Phase 362 policy run.

## Product truth

This phase is a local play-money game against five bots. It does not claim server-authoritative multiplayer, real-money gambling, production multiplayer cards, or persistent server balances.

## APK policy

The installed Android APK remains:

- Version name: `0.1.0-rc1`
- Version code: `1`
- Forced update: disabled
- Automatic update prompt: disabled
- Manual update only: enabled

No APK reinstall is required for this web-runtime phase.
