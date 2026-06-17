# Phase 310 Scorpion Poker Loop QA Lock

Build: `PHASE-310-SCORPION-POKER-LOOP-QA-LOCK`

## Summary

Phase 310 is game-side only. The public root page remains locked and untouched.

## Fix

Adds a QA tracker for the Scorpion local poker loop before starting the two-player prototype.

## Tracked loop

```text
table_selected
join_flow
seat_reserved
seat_snap
action_hud
action_state
bot_response
showdown_payout
```

## Behavior

- Tracks all Scorpion poker events from table selection through payout.
- Shows a readable QA status panel.
- Stores completion state in `window.SVR_PHASE310_SCORPION_POKER_LOOP_QA_STATE`.
- Marks `readyForMultiplayerPrototype=true` only after the full local poker loop is complete.
- Adds `window.SVR_PHASE310_RESET_SCORPION_QA()` for manual QA reset.

## Runtime globals

```text
window.SVR_PHASE310_SCORPION_POKER_LOOP_QA_LOCK
window.SVR_PHASE310_SCORPION_POKER_LOOP_QA_STATE
window.SVR_PHASE310_RESET_SCORPION_QA
```

## Files changed

```text
game/phase310_scorpion_poker_loop_qa_lock.js
game/phase309_scorpion_showdown_payout_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Next recommended phase

```text
PHASE-311-LOCAL-TWO-PLAYER-GHOST-MULTIPLAYER-PROTOTYPE
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase310-scorpion-poker-loop-qa
```
