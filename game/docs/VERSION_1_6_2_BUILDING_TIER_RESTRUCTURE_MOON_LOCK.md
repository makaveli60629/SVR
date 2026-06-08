# Version 1.6.2 - Building Tier Restructure + Moon 3000 / 340 Lock

## Scope
Game side only.

## Primary purpose
This phase restructures and locks the skyline buildings first, because the last sky changes looked like nothing changed when buildings still blocked the view.

## Building rules
- All skyline buildings are assigned a tier at runtime.
- Tier 1 = major sponsor megatron buildings.
- Tier 2 = mid sponsor banner buildings.
- Tier 3 = low city filler / local ad buildings.
- All tiers must be viewable from the lobby.
- No building may block Moon/Mars from the north/up lobby view.

## Moon / Mars values
- Moon height: 3000
- Moon size: 340
- Mars height: 3000
- Mars size: 340

## Added
- game/modules/svr_phase_1_6_2_building_tier_restructure_moon_lock.js
- game/docs/BUILDING_TIER_PERMANENT_LOCK.json
- game/docs/VERSION_1_6_2_BUILDING_TIER_RESTRUCTURE_MOON_LOCK.md

## Protected
- Website/site untouched.
- Existing Reiki runtime files hash-protected.
- Lobby baseline not rebuilt.
- Existing private scenes untouched.

## Test
https://svrpoker.com/game/?v=1-6-2-building-tier-moon340
