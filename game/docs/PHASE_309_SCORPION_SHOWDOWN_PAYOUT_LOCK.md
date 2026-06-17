# Phase 309 Scorpion Showdown Payout Lock

Build: `PHASE-309-SCORPION-SHOWDOWN-PAYOUT-LOCK`

## Summary

Phase 309 is game-side only. The public root page remains locked and untouched.

## Fix

Adds showdown and payout resolution after Scorpion bot responses.

## Behavior

- Listens for `svr-scorpion-bot-response-complete`.
- Resolves player fold, all-in, and showdown outcomes.
- Selects a deterministic play-money winner.
- Applies pot payout to player or bot stack state.
- Shows a readable showdown / payout panel.
- Emits `svr-scorpion-showdown-payout-complete`.

## Runtime globals

```text
window.SVR_PHASE309_SCORPION_SHOWDOWN_PAYOUT_LOCK
window.SVR_PHASE309_SCORPION_SHOWDOWN_PAYOUT_STATE
window.SVR_PHASE309_LAST_SHOWDOWN_PAYOUT
```

## Files changed

```text
game/phase309_scorpion_showdown_payout_lock.js
game/phase308_scorpion_bot_response_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase309-scorpion-showdown-payout
```
