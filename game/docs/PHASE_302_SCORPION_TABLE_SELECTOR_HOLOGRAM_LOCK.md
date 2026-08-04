# Phase 302 Scorpion Table Selector Hologram Lock

Build: `PHASE-302-SCORPION-TABLE-SELECTOR-HOLOGRAM-LOCK`

## Summary

Phase 302 is game-side only. The public root page remains locked and untouched.

## Fix

Adds a Scorpion table selector hologram near the Scorpion route area.

## Selector options

```text
7 = Scorpion Main
8 = Scorpion VIP
9 = Replay Table
```

## Behavior

- Adds readable hologram cards for Main, VIP, and Replay table choices.
- Adds floor selector rings and hologram beams.
- Dispatches `svr-scorpion-table-selected` when a table is selected.
- Also dispatches `svr-portal-selected` to keep existing private-room routing active.

## Runtime globals

```text
window.SVR_PHASE302_SCORPION_TABLE_SELECTOR_HOLOGRAM_LOCK
window.SVR_PHASE302_LAST_SCORPION_TABLE
```

## Files changed

```text
game/phase302_scorpion_table_selector_hologram_lock.js
game/phase301_xr_storefront_route_execution_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase302-scorpion-table-selector
```
