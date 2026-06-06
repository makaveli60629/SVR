# Phase 93 — Lobby Floor / Table / Locomotion / Sky Lock

## Scope
Game-side WebXR only. Website/site remains locked and untouched.

## User-reported issues fixed
- Blinking floor / floor shimmer.
- Duplicate green tabletop overlay covering the already-present table.
- Portals not aligned to their correct hub/storefront areas.
- Quest/controller forward movement reliability.
- Fist/pinch teleport locomotion not working.
- Moon and Mars not high enough in the sky.

## Files changed
- `game/index.html`
- `game/modules/teleport.js`
- `game/modules/phase93_lobby_repair.js`
- `game/modules/phase93_bootstrap.js`
- `game/docs/BUILD_VERSION.json`

## Runtime behavior
- Phase 93 bootstrap installs a render hook so the repair layer applies after the world has loaded.
- Floor overlays are slightly separated and polygon-offset to reduce z-fighting flicker.
- Duplicate green felt/tabletop overlays are neutralized to a dark material so the existing real table reads correctly.
- Portal objects are re-positioned toward the current Reiki/PGA/Sponsor/Scorpion hub targets when available.
- Moon and Mars are forced high and farther back in the sky.
- Teleport is now hold-to-aim and release-to-teleport:
  - Hand tracking: hold fist or pinch, aim, release.
  - Controller: hold A/grip/trigger, aim, release.
- Right controller stick supports forward/back movement and snap turn.

## Test URL

```text
https://svrpoker.com/game/?v=phase93-lobby-floor-table-locomotion-sky-lock
```

Expected visible build marker:

```text
BUILD: PHASE-93-LOBBY-FLOOR-TABLE-LOCOMOTION-SKY-LOCK
```
