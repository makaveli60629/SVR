# Version 1.6.6 - Celestial Bodies Neon Lock

## Scope
Game side only.

## What changed
- Added game/modules/celestial-bodies.js.
- Registers A-Frame component celestial-sky.
- Injects the component onto <a-scene> automatically.
- Removes old sky module script tags from game/index.html.
- Keeps exactly one sky controller active.
- Moon and Mars use high placement, large scale, and neon directional lighting.

## Locked positions
- Moon: position -280 4500 -3200, scale 340 340 340
- Mars: position 260 4500 -3700, scale 300 300 300

## Lighting
- Moon edge light: purple neon #9B30FF
- Mars edge light: magenta/crimson neon #FF007F

## Protection
- Reiki room untouched.
- Site untouched.
- Lobby baseline not rebuilt.
- Existing Reiki runtime files hash-protected.

## Test
https://svrpoker.com/game/?v=1-6-6-celestial-neon-lock
