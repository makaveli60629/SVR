# Phase 303 Scorpion Buy-In Join Flow Lock

Build: `PHASE-303-SCORPION-BUYIN-JOIN-FLOW-LOCK`

## Summary

Phase 303 is game-side only. The public root page remains locked and untouched.

## Fix

Adds a confirmation layer after Scorpion table selection.

## Controls

```text
J = Join
S = Spectate
Escape = Cancel
```

## Behavior

- Listens for `svr-scorpion-table-selected`.
- Shows a readable confirmation panel with table title, mode, seats, and buy-in.
- Stores join/spectate state in `window.SVR_PHASE303_LAST_SCORPION_JOIN_FLOW`.
- Dispatches `svr-scorpion-table-join` when join or spectate is confirmed.
- Keeps existing `svr-portal-selected` route active when Join is confirmed.

## Runtime globals

```text
window.SVR_PHASE303_SCORPION_BUYIN_JOIN_FLOW_LOCK
window.SVR_PHASE303_LAST_SCORPION_JOIN_FLOW
```

## Files changed

```text
game/phase303_scorpion_buyin_join_flow_lock.js
game/phase302_scorpion_table_selector_hologram_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase303-scorpion-buyin-join
```
