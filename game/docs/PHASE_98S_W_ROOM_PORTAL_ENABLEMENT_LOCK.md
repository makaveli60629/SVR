# Phase 98S-W — Room Portal Enablement Lock

Date: 2026-06-02
Track: game-side presentation-safe routing

## Purpose

Enable the other private-room routes and portal/navigation routing without rebuilding the lobby or adding another broad visual overlay.

## Files changed

- `game/modules/room_portal_routes_lock.js`
- `game/pga-chip-putt.html`
- `game/reiki-room.html`
- `game/index.html`
- `game/docs/PHASE_98S_W_ROOM_PORTAL_ENABLEMENT_LOCK.md`

## Existing room pages verified

- `game/scorpion.html`
- `game/pga-drive.html`
- `game/smoker-lounge.html`
- `game/store-room.html`

## New room pages added

- `game/pga-chip-putt.html`
- `game/reiki-room.html`

## Routes enabled

- Scorpion Room: `./scorpion.html?v=phase98sw-room-portals`
- PGA Drive: `./pga-drive.html?v=phase98sw-room-portals`
- PGA Chip/Putt: `./pga-chip-putt.html?v=phase98sw-room-portals`
- Reiki Room: `./reiki-room.html?v=phase98sw-room-portals`
- Smoker Lounge: `./smoker-lounge.html?v=phase98sw-room-portals`
- VR Store Room: `./store-room.html?v=phase98sw-room-portals`

## Important protection

This phase does not re-enable the bad lobby storefront/ad overlay.

Do not re-enable:

`game/modules/lobby_ads_portals_patch.js`

## Preserved

- Presentation-safe mode
- Reiki minimal polish
- Reiki no-audio-from-spawn containment
- Moon/Mars patch
- Android controls
- Scorpion playable room page
- Main lobby baseline

## Runtime debug object

`window.SVR_ROOM_PORTAL_ROUTES_LOCK`

Expected:

```js
{
  phase: '98S-W',
  installed: true,
  visualOverlayAdded: false,
  lobbyGeometryMoved: false,
  badStorefrontOverlayStillDisabled: true
}
```

## Test links

Main game presentation:

`/game/?v=phase98sw-room-portals&present=1`

Room pages:

`/game/scorpion.html?v=phase98sw-room-portals`
`/game/pga-drive.html?v=phase98sw-room-portals`
`/game/pga-chip-putt.html?v=phase98sw-room-portals`
`/game/reiki-room.html?v=phase98sw-room-portals`
`/game/smoker-lounge.html?v=phase98sw-room-portals`
`/game/store-room.html?v=phase98sw-room-portals`

## QA checklist

1. Main lobby opens.
2. Presentation mode still hides debug HUD with `present=1`.
3. Scorpion button opens Scorpion Room.
4. PGA Drive button opens PGA Drive.
5. PGA Chip/Putt button opens Chip/Putt page.
6. Reiki Room button opens Reiki private room.
7. Smoker button opens Smoker Lounge.
8. VR Store button opens Store Room.
9. Back to Lobby buttons return to `game/index.html`.
10. No messy lobby storefront overlay appears.
