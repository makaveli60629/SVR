# Version 1.6.7 - Glass Wall + Celestial Position Lock

## Scope
Game side only.

## Fix
- Positions the glass wall attached to the storefront wall.
- Removes/hides glass detected on the red-carpet path.
- Keeps red carpet clear.
- Adds wall-attached left/right glass panels plus top arch trim.
- Forces Moon/Mars high in the sky:
  - Moon: [-320, 5200, -3600], scale 360
  - Mars: [300, 5200, -4100], scale 300
- Injects this module last so old sky modules do not win.

## Protected
- Reiki room untouched.
- Website/site untouched.
- Lobby baseline not rebuilt.
- Existing Reiki files hash-protected.

## Test
https://svrpoker.com/game/?v=1-6-7-glass-wall-celestial
