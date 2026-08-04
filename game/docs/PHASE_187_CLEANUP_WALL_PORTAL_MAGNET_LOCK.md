# Phase 187 — Cleanup Wall Portal Magnet Lock

## Scope
Game-side only. No website or site edits.

## Purpose
Clean the boot stack after the stacked stair/balcony phases caused desktop bouncing and duplicate layered geometry.

## Cleanup
- `game/index.html` now uses a curated boot stack instead of loading every recent structure/QA phase.
- Removed duplicate visual/height modules from default boot:
  - Phase 178 structure layer
  - Phase 180 walkable layer
  - Phase 185 structure layer
  - Phase 186 safety layer
  - Phase 177 QA markers
  - Phase 175/176/179/181/182/183 audit-only layers
- New Phase 187 module removes old duplicate roots if they remain in the scene.

## Missing wall and storefronts
- Adds a real missing wall on the south side of the lobby.
- Adds Vibes Theater storefront on that wall.
- Adds Smokers Lounge storefront on that wall.
- Storefronts are framed as portal panels.

## Portal magnet logic
- Adds balanced magnetic targeting for portals.
- Magnet target is soft: it helps aim snap toward portals without forcing selection.
- Supports headset/controller forward ray direction.
- Exposes current hovered portal in runtime status.
- Activation can be called through `SVR_ACTIVATE_PHASE187_PORTAL()`.

## Runtime audit
```js
SVR_RUN_PHASE187_CLEANUP_AUDIT()
```

## Test URL
`/game/?v=phase187-clean-wall-portals`

## QA checklist
- Desktop should stop bouncing at load.
- Old duplicate stair/balcony layers should not stack.
- Missing south wall should be solid.
- Vibes Theater and Smokers Lounge should appear on that wall.
- Portal hover should feel slightly magnetic but not sticky.
