# Phase 123 — Ad Banner Buildings 8 Facing Table Lock

## Build label
UPDATE-3.0-PHASE-123-AD-BANNER-BUILDINGS-8-FACING-TABLE-LOCK

## Scope
Game-side only. Site/public pages remain untouched.

## Owner request
Create ad banner buildings only — exactly 8 of them — facing the poker table, using the existing SVR banner style.

## Locked behavior
- Exactly 8 table-facing ad banner buildings are added.
- Buildings are placed around the lobby perimeter inside the room so the wall does not hide them.
- Every banner/tower faces the table center.
- The removed background city/building ring remains removed.
- These are sponsor/ad surfaces, not generic skyline filler.
- Each banner uses the SVR neon banner treatment and existing logo texture.
- Quest performance remains protected: lightweight box/plane geometry and canvas textures only.

## Banner set
1. Scarlett / main ad
2. SVR Store
3. Reiki Hub
4. PGA Golf
5. Tournament
6. Charity / Impact
7. Scorpion Room
8. Sponsor Available

## Protected locks
- Do not restore the full background skyline/building ring.
- Do not touch the public website/site files.
- Do not remove Reiki storefront/hologram work.
- Do not turn lobby music back on.
- Keep Moon/Mars high.
- Keep Phase 122 asset registry.
