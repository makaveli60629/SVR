# Phase 183 — Arch Top Block Connection Lock

## Scope
Game-side only. Website/site untouched.

## Fix
- Turned the top arch blocks so their long axis aligns between each pair of lobby columns.
- Rebuilt each top block as a connected beam between both column capitals.
- Added connector capital plates at the top of each column.
- Added a subtle underglow beneath each beam so the connection is easier to read in Quest and desktop preview.
- Preserved the expanded original-wall lobby from Phase 182.

## Locked behavior
- Top blocks should no longer float sideways or appear disconnected.
- Each arch pair should read as one connected doorway/arch element.
- No website files changed.
- Poker table, watch, teleport, storefront buttons, private scene routes, Moon/Mars, and lobby wall expansion remain preserved.

## Files changed
- `game/index.html`
- `game/phase176_boot.js`
- `game/modules/phase179_centerpiece_guidance.js`
- `game/docs/BUILD_VERSION.json`
