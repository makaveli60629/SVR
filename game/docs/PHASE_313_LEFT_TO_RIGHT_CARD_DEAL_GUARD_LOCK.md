# Phase 313 Left-To-Right Card Deal Guard Lock

Build: `PHASE-313-LEFT-TO-RIGHT-CARD-DEAL-GUARD-LOCK`

## Summary

Phase 313 is game-side only. The public root page remains locked and untouched.

## Purpose

Locks and verifies the rule that cards are dealt from left to right.

## Existing baseline confirmed

The core poker demo already sorts seats by table X position and deals in that order. Phase 313 adds a guard and readable QA panel so the rule remains visible and auditable.

## Behavior

- Reads `window.SVR_PHASE169_DEAL_ORDER`.
- Validates the deal order is left-to-right using ascending table X position.
- Sets `window.SVR_LEFT_TO_RIGHT_DEAL_LOCK`.
- Adds a readable in-game panel showing the current dealing order.
- Provides `window.SVR_PHASE313_AUDIT_LEFT_TO_RIGHT_DEAL()`.
- Provides `window.SVR_PHASE313_FORCE_LEFT_TO_RIGHT_DEAL_ORDER()` as a manual correction hook.
- Emits `svr-left-to-right-deal-guard-check`.

## Runtime globals

```text
window.SVR_PHASE313_LEFT_TO_RIGHT_CARD_DEAL_GUARD_LOCK
window.SVR_LEFT_TO_RIGHT_DEAL_LOCK
window.SVR_PHASE313_AUDIT_LEFT_TO_RIGHT_DEAL
window.SVR_PHASE313_FORCE_LEFT_TO_RIGHT_DEAL_ORDER
```

## Files changed

```text
game/phase313_left_to_right_card_deal_guard_lock.js
game/phase312_free_manual_presence_transport_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase313-left-right-deal
```
