# Phase 166 — FBX Table Surface Anchor Lock

## Scope
Game-side only. Public website/site remains untouched.

## Purpose
After the table-area cleanup, the next step is to keep the visual table clean while preparing stable invisible anchor coordinates for cards, chips, pot, dealer button, and player-card placement.

## Locked behavior
- The real FBX table remains the only visible table authority.
- No fake procedural table geometry is allowed.
- No visible chairs, stool guide rings, or floating poker panel should be rebuilt around the table.
- Gameplay anchor coordinates are calculated from the FBX table bounding box.
- The anchor module creates data only; it does not create visible objects.

## Runtime globals
- `window.SVR_PHASE166_FBX_TABLE_SURFACE_ANCHOR_LOCK`
- `window.SVR_TABLE_ANCHORS`
- `window.SVR_RUN_PHASE166_TABLE_AUDIT()`

## Test URL
`/game/?v=phase166-table-anchor`

## QA checklist
- Confirm the fake table remains gone.
- Confirm the FBX table remains visible.
- Confirm no seats/stools/chairs/poker-panel clutter returns.
- In browser console, run `SVR_RUN_PHASE166_TABLE_AUDIT()` and confirm `anchorsReady: true` once the FBX loads.
