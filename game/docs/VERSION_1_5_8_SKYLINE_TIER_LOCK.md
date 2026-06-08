# Version 1.5.8 - Permanent Skyline Tier Lock

## Scope
Game side only.

## Fixes
- Raises Moon and Mars high enough for reliable viewing above the skyline.
- Adds a permanent Moon/Mars clear sightline corridor.
- Buildings inside the corridor are capped/lowered instead of removed.
- Adds runtime tier metadata to detected building/tower/banner/megatron objects.
- Creates game/docs/SKYLINE_TIER_LOCK.json so future phases know:
  - which building tier is which
  - where each tier belongs
  - which corridor must stay clear
  - which objects are locked
- Prevents buildings from blocking Moon/Mars view when the user looks north/up.

## Locked tier rules
- Tier 1: primary megatron / major sponsor anchors; tall but must stay out of Moon/Mars corridor.
- Tier 2: mid banner buildings; medium height only.
- Tier 3: low banner/city filler; never blocks skyline planets.
- Sky corridor: no building, billboard, portal, or hologram may block Moon/Mars.

## Protected
- Website/site untouched.
- Existing Reiki runtime files hash-protected.
- Lobby baseline not rebuilt.

## Test
https://svrpoker.com/game/?v=1-5-8-skyline-tier-lock
