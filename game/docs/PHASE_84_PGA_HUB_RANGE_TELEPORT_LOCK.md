# Phase 84 — PGA Hub Range Teleport Lock

Game-side only patch. Website/site files are untouched.

## Fixes
- Rebuilt the Juan Espejo PGA Hub storefront so the profile text and portrait are no longer clipped/cut in half.
- Reduced panel sizes and moved the portrait into a framed, centered area.
- Added two clear glowing PGA teleport pads on the storefront turf:
  - Drive Range
  - Chip + Putt
- Stored route metadata in `scene.userData.SVR_PGA_HUB_ROUTES`.
- Preserved the lobby baseline and private-scene rule.

## Routes
- Drive Range: `./range.html?v=phase84-pga-drive-from-hub`
- Chip + Putt: `./chip-putt.html?v=phase84-pga-chip-putt-from-hub`

## Protected
- No website edits.
- No root Matrix page edits.
- No game lobby replacement.
- No unapproved Reiki branding.
