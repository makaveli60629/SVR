# Phase 188 — Consolidated Architecture Authority Lock

## Scope
Game-side only. No website or site edits.

## Purpose
Replace the stacked stair/balcony/wall/portal phases with one clean architecture authority module to reduce desktop bouncing, load overhead, and duplicate geometry.

## Boot cleanup
`game/index.html` now loads a curated architecture stack:
- core boot/recovery
- main runtime
- FBX table locks
- poker demo simulation
- sky/overlay cleanup
- teleport authority
- watch teleport guard
- Phase 188 consolidated architecture authority
- Android/Quest recovery and performance modules

Removed from default boot:
- Phase 178 structure layer
- Phase 180 walkable layer
- Phase 185 stair/balcony layer
- Phase 186 safety layer
- Phase 187 wall/portal-only layer
- audit-only marker/status layers

## Phase 188 module
Adds `game/modules/phase188_consolidated_architecture_authority_lock.js`.

It handles in one module:
- south missing wall
- Vibes Theater portal storefront
- Smokers Lounge portal storefront
- full perimeter balcony/walkway
- curved wall-hugging stair from the left-wall screenshot start area
- wall connector geometry
- inside glass balcony edge
- textured stair and walkway materials
- single desktop/XR height-follow loop
- balanced portal magnet hover assist

## Runtime audit
```js
SVR_RUN_PHASE188_ARCHITECTURE_AUDIT()
```

## Portal activation hook
```js
SVR_ACTIVATE_PHASE188_PORTAL()
```

## Test URL
`/game/?v=phase188-consolidated-architecture`

## QA checklist
- Desktop should load without up/down bouncing.
- Only one architecture layer should be present.
- Stairs should still exist against the left wall.
- Perimeter balcony should still exist.
- South wall should exist.
- Vibes Theater and Smokers Lounge should appear on the south wall.
- Portal hover should be soft magnetic, not sticky.
