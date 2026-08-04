# Phase 175 — Runtime Authority Cache Bust Lock

## Scope
Game-side only. No website or site file edits.

## Purpose
Phase 175 updates the boot file so the game loads the newest active modules with fresh cache keys.

## Changes
- `game/index.html` is now a cleaner module activator.
- Active module query strings are updated to `phase175`.
- Runtime authority audit module added.
- Phase 174 teleport logic stays active through the teleport module path.
- Phase 174 table/felt/logo logic stays active through the table cleanup module path.
- Phase 174 clean sky and overlay logic stays active through the sky module path.

## Runtime audit
```js
SVR_RUN_PHASE175_LIVE_AUDIT()
```

## Test URL
`/game/?v=phase175-runtime-authority`
