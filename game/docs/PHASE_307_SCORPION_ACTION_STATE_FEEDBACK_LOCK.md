# Phase 307 Scorpion Action State Feedback Lock

Build: `PHASE-307-SCORPION-ACTION-STATE-FEEDBACK-LOCK`

## Summary

Phase 307 is game-side only. The public root page remains locked and untouched.

## Fix

Adds a Scorpion action-state feedback layer after the player action HUD.

## Behavior

- Listens for `svr-scorpion-player-action`.
- Tracks play-money hand state, pot, current bet, stack, player status, and last action.
- Updates state for Fold, Check/Call, Raise, All-In, and Next Hand.
- Shows a readable action-state panel near the Scorpion action HUD.
- Emits `svr-scorpion-action-state-updated`.

## Runtime globals

```text
window.SVR_PHASE307_SCORPION_ACTION_STATE_FEEDBACK_LOCK
window.SVR_PHASE307_SCORPION_ACTION_STATE
window.SVR_PHASE307_LAST_ACTION_STATE
```

## Files changed

```text
game/phase307_scorpion_action_state_feedback_lock.js
game/phase306_scorpion_action_hud_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase307-scorpion-action-state
```
