# PHASE-85-TRUE-LOBBY-KIOSK-SCORPION-CELESTIAL-LOCK

## Scope
Game-side only. Website/root site remains untouched.

## Locked upgrades
- Added `game/modules/scene_celestial_lock.js` so Moon and Mars stay high above the lobby skyline.
- Added `game/modules/store_kiosk.js` with an in-game kiosk panel pointed at `https://svrpoker.com/site/store.html`.
- Added private scene route pages for Scorpion, Store Room, Reiki, PGA Drive, Chip/Putt, and Smoker Lounge.
- Added `game/modules/private_scene_common.js` so private rooms share Moon/Mars visibility and a stable preview/VR shell.
- Scorpion private room now includes a ready poker table scaffold with rail/felt/pass-line/chairs/chips.
- Replaced live Reiki sponsor/founder text with AWAITING APPROVAL placeholder language.

## Test checklist
1. Open `/game/?v=phase85`.
2. Confirm build label reads `PHASE-85-TRUE-LOBBY-KIOSK-SCORPION-CELESTIAL-LOCK`.
3. Confirm Moon and Mars are high above the skyline and not clipping buildings.
4. Confirm bottom nav has Store Kiosk and Store Room.
5. Press `0` for Store Kiosk, `O` to open the website store in a new tab.
6. Open `/game/scorpion.html` and confirm a private Scorpion poker table appears.
7. Confirm `/site` and root public page were not edited.
