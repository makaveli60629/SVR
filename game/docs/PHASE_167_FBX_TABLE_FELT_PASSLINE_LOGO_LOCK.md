# Phase 167 — FBX Table Felt + Pass Line + Site Logo Lock

## Scope
Game-side only. Public website/site files remain untouched.

## Purpose
Add the visual poker surface back onto the real FBX table without recreating the fake geometry table.

## Added
- Green felt surface overlay on top of the FBX table.
- Poker pass line ring and inner guide line drawn into the felt texture.
- Center SVR site logo loaded from `/logo.png` or `/logo.webp`.
- Text fallback if the site logo cannot be loaded.

## Protected
- No fake/procedural table body is created.
- No chairs, stools, old poker panel, or table clutter is restored.
- The overlay is a thin top-surface texture only.
- Phase 164/166 cleanup remains active.

## Runtime globals
- `window.SVR_PHASE167_FBX_TABLE_FELT_PASSLINE_LOGO_LOCK`
- `window.SVR_RUN_PHASE167_TABLE_AUDIT()`

## Test URL
`/game/?v=phase167-felt-passline-logo`

## QA checklist
- Confirm the FBX table is still the only table body.
- Confirm green felt appears flat on top of the table.
- Confirm pass line is visible.
- Confirm SVR logo appears in the center.
- Confirm no fake table/chair/stool clutter returns.
