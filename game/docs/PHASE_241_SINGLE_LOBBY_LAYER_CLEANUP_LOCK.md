# Phase 241 — Single Lobby Layer Cleanup Lock

## Problem fixed

The lobby was showing doubled architecture because multiple runtime geometry overlays were active at the same time:

- Phase 238 Roman canopy blueprint
- Phase 239 Roman canopy smoothing
- Phase 240 Grand Palace reference layer

This caused duplicate columns, duplicate canopy beams, stacked panels, and overlapping lobby structure.

## Fix

Phase 241 changes the game runtime to load only:

- `main.js`
- `phase237_runtime_watchdog_lock.js`
- `phase240_grand_palace_reference_lobby_lock.js`
- `phase241_single_lobby_layer_cleanup_lock.js`

Phase 238 and Phase 239 overlay scripts are no longer loaded by `game/index.html`.

## Cleanup guard

Added:

```text
phase241_single_lobby_layer_cleanup_lock.js
```

The cleanup script removes these duplicate roots if they exist from cache or a stale runtime:

```text
PHASE238_ROMAN_CANOPY_LOBBY_ARCH_ROOT
PHASE239_ROMAN_CANOPY_PILLAR_SMOOTHING_ROOT
```

It also prevents more than one Phase 240 root from remaining.

## Preserved

- Website untouched
- Main lobby preserved
- Phase 240 Grand Palace direction preserved
- Watch preserved
- Movement preserved
- Store portal preserved
- Private scene routing preserved
- Poker/table route preserved

## Test URL

```text
https://svrpoker.com/game/?v=phase241-single-layer-cleanup
```

Hard refresh after GitHub Pages deploy finishes.
