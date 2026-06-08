# Version 1.5.9 - Lobby Outline Orbit Sky Lock

## Scope
Game side only.

## Fix
- Moon and Mars now orbit around the lobby/city outline.
- Orbit is very high in the sky so the planets remain visible above the building ring.
- Moon and Mars rotate on their own axes while orbiting.
- Building sightline corridor remains protected.
- Buildings inside the corridor are capped/lowered instead of deleted.
- Creates game/docs/LOBBY_ORBIT_SKY_LOCK.json.

## Orbit lock
- Moon: radius 1280, height 1020, scale 132.
- Mars: radius 1520, height 1080, scale 66.
- Both use north/up visible arc protection.

## Protected
- Website/site untouched.
- Existing Reiki runtime files hash-protected.
- Lobby baseline not rebuilt.
- Existing skyline tier lock preserved.

## Test
https://svrpoker.com/game/?v=1-5-9-lobby-orbit-sky
