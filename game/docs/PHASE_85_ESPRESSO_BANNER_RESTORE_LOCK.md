# PHASE-85-ESPRESSO-BANNER-RESTORE-LOCK

## Scope
Game-side only phase. Website/site files are untouched.

## Changes
- Restored the **Espresso with Cream** city advertising banner.
- Added a procedural cream/caramel coffee-banner texture in `game/modules/world_skyline.js`.
- Placed the banner back into the skyline/building ad rotation so it appears up on city buildings.
- Restored a matching Espresso with Cream panel near the active VR Store / sponsor display zone.
- Preserved Phase 84 database structure lock and secure API-only rule.
- Preserved private-scene routes and existing lobby baseline.

## Protected locks preserved
- No SQL passwords, Stripe secrets, admin passwords, or JWT secrets in the game frontend.
- Game talks to database only through secure backend API.
- Site/website not touched.
- Game package remains under 25 MB.
- Reiki sponsor/founder approval lock preserved.
- Existing private scenes preserved: Reiki, PGA Drive, Chip/Putt, VR Store, Smoker Lounge, Scorpion.

## Test checklist
1. Open `/game/?v=phase85-espresso`.
2. Confirm top-right build label shows `PHASE-85-ESPRESSO-BANNER-RESTORE-LOCK`.
3. Look at the city skyline/building billboards and confirm **ESPRESSO WITH CREAM** appears.
4. Confirm the VR Store/sponsor display zone includes a matching Espresso with Cream ad panel.
5. Confirm lobby still loads, watch/buttons still work, and private scene buttons still route.
6. Confirm no website files changed.
