# PHASE-158-WEBXR-PRIVATE-SCENE-ROOMS-ONE-BY-ONE-LOCK

## Purpose

Phase 158 replaces the Phase 157 private-scene placeholder with lightweight WebXR private rooms. This keeps the lobby stable while beginning real room reconstruction one module at a time.

## Files changed

- `game/index.html`
- `game/private-scene.html`
- `game/modules/phase158_webxr_private_routes_bridge.js`
- `game/modules/private_scene_runtime_phase158.js`
- `docs/PHASE-158-WEBXR-PRIVATE-SCENE-ROOMS-ONE-BY-ONE-LOCK.md`
- `update/version.json`

## Added private rooms

- Reiki Room
- PGA Range
- Scorpion Room
- Lounge

## Room contents

- Each private scene has its own lightweight walls, floor, official SVR logo, sign, return portal, and room-specific starter props.
- Scorpion has a single private poker table test.
- PGA has a range mat and ball.
- Reiki uses SVR awaiting-approval placeholder language only.
- Lounge has lightweight social seating.

## Preserved

- Main lobby stays based on Phase 156.
- Official root `logo.png` branding.
- Store still routes to `../site/store.html`.
- Music remains off.
- No watch yet.
- Private rooms remain modular.

## Test URL

```text
https://svrpoker.com/game/?v=phase158-private-rooms
```

## Test order

1. Confirm Phase 158 lobby loads.
2. Select Reiki portal and confirm a WebXR private Reiki room opens.
3. Return to lobby.
4. Select PGA portal and confirm a private range opens.
5. Return to lobby.
6. Select Scorpion portal and confirm a private room with one table opens.
7. Return to lobby.
8. Select Lounge portal and confirm a private lounge opens.
9. Confirm Store still opens the site store.

## Next phase

Phase 159 should prioritize the Scorpion private poker room gameplay and card/table polish.
