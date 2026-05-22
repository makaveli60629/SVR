# Game/Data Phase 06 — Espresso Crema Ad Texture Lock

## Purpose
Adds the approved espresso cup photo into the game as the real texture for the existing espresso ad placement above the Reiki-side building.

## Scope
- Game-side asset only.
- Public Matrix launch page untouched.
- Website/site structure untouched.
- Game layout/poker/watch code untouched.

## Added files
- `game/assets/ui/espresso-with-cream-real.png`
- `game/assets/ui/espresso-with-crema-real.png`

## Runtime note
The current `world_skyline.js` already attempts to load:
`game/assets/ui/espresso-with-cream-real.png`

So this patch supplies the approved image at the expected path and lets the existing Phase 111 placement use it.
