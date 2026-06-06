# Phase 94 — Reiki Portal Hologram Lock

## Scope
Game/WebXR only. Website/site remains locked and untouched.

## Added
- `game/modules/reiki_hologram.js`
- Procedural glowing Reiki-symbol hologram mounted on the `PORTAL_reikiRoom` object.
- Visible title label: `REIKI ROOM`.
- Subtitle: `PRIVATE MEDITATION PORTAL`.

## Preserved
- Phase 93 floor blink repair.
- Phase 93 duplicate tabletop neutralization.
- Phase 93 portal alignment.
- Phase 93 Quest stick and fist/pinch teleport locomotion fixes.
- Reiki remains a private scene route, not a full room inside the lobby.

## Test
Open:

```text
https://svrpoker.com/game/?v=phase94-reiki-hologram
```

Then verify:

- Build label shows `PHASE-94-REIKI-PORTAL-HOLOGRAM-LOCK`.
- Reiki Room portal has a floating cyan hologram.
- Hologram reads `REIKI ROOM`.
- Reiki Room button still routes to the private Reiki room.
