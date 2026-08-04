# Phase 318 Deal Path Pulse Lock

Build: `PHASE-318-DEAL-PATH-PULSE-LOCK`

## Summary

Phase 318 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds a visible pulse from the dealer origin to the active dealt seat.

## Behavior

- Listens for `svr-left-to-right-card-dealt`.
- Draws a curved pulse path from dealer origin to the active seat.
- Adds a target dot and ring at the receiving seat.
- Stores state in `window.SVR_PHASE318_DEAL_PATH_PULSE_STATE`.
- Adds `window.SVR_PHASE318_REFRESH_DEAL_PATH()`.
- Emits `svr-deal-path-pulse-updated`.

## Files changed

```text
game/phase318_deal_path_pulse_lock.js
game/phase317_deal_direction_table_arrows_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase318-deal-path
```
