# Phase 161 â€” Geometry Table Removed + FBX Floor Alignment Lock

## Scope
Game-side only. Website/site is untouched.

## Fix
- Disables the Phase 155 procedural/geometric poker table fallback.
- Removes any regenerated PHASE155_*, PHASE156_TABLE2_*, PHASE157_STABLE_*, and PHASE158_* table objects.
- Preserves the actual uploaded FBX table authority.
- Pins the FBX table bounding-box bottom to floor Y=0.02 so it sits flat instead of floating or stacking over the geometry table.
- Adds runtime audit object: window.SVR_PHASE161_GEOMETRY_TABLE_REMOVED_FBX_FLOOR_LOCK.

## Protected
- Lobby layout preserved.
- Storefronts preserved.
- Watch/movement preserved.
- Poker core preserved.
- Site untouched.
