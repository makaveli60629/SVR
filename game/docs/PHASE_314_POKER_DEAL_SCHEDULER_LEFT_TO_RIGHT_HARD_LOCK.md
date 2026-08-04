# Phase 314 Poker Deal Scheduler Left-To-Right Hard Lock

Build: `PHASE-314-POKER-DEAL-SCHEDULER-LEFT-TO-RIGHT-HARD-LOCK`

## Summary

Phase 314 is game-side only. The public root page remains locked and untouched.

## Purpose

Hard-locks the actual poker demo scheduler so hole cards deal left-to-right.

## Behavior

- Keeps the existing seat sort by ascending table X position.
- Publishes `window.SVR_PHASE169_DEAL_ORDER` from the active scheduler.
- Publishes `window.SVR_POKER_LEFT_TO_RIGHT_DEAL_ENFORCED`.
- Resets `window.SVR_PHASE314_LEFT_TO_RIGHT_DEAL_SEQUENCE` each hand.
- Records every dealt hole card in strict left-to-right order.
- Emits `svr-left-to-right-card-dealt` for each scheduled hole card.
- Exposes `getDealOrder()` on the poker demo API.

## Runtime globals

```text
window.SVR_PHASE169_DEAL_ORDER
window.SVR_POKER_LEFT_TO_RIGHT_DEAL_ENFORCED
window.SVR_PHASE314_LEFT_TO_RIGHT_DEAL_SEQUENCE
window.SVR_PHASE314_LAST_DEALT_CARD
```

## Files changed

```text
game/modules/poker_demo.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase314-left-right-scheduler
```
