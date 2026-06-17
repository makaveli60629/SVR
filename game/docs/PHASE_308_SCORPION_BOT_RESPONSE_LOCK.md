# Phase 308 Scorpion Bot Response Lock

Build: `PHASE-308-SCORPION-BOT-RESPONSE-LOCK`

## Summary

Phase 308 is game-side only. The public root page remains locked and untouched.

## Fix

Adds deterministic bot response feedback after Scorpion player action state updates.

## Behavior

- Listens for `svr-scorpion-action-state-updated`.
- Generates five bot responses.
- Tracks bot actions, pot contribution, street progression, and hand count.
- Shows a readable bot response panel near the Scorpion action-state HUD.
- Emits `svr-scorpion-bot-response-complete`.
- Remains play-money demo only.

## Runtime globals

```text
window.SVR_PHASE308_SCORPION_BOT_RESPONSE_LOCK
window.SVR_PHASE308_SCORPION_BOT_RESPONSE_STATE
window.SVR_PHASE308_LAST_BOT_RESPONSE
```

## Files changed

```text
game/phase308_scorpion_bot_response_lock.js
game/phase307_scorpion_action_state_feedback_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase308-scorpion-bot-response
```
