# PHASE-157-WEBXR-PRIVATE-SCENE-ROUTES-LOBBY-POLISH-LOCK

## Purpose

Phase 157 wires the lobby portal pads into lightweight private-scene routes while preserving the Phase 156 lobby shell and stable WebXR movement/hands base.

## Files changed

- `game/index.html`
- `game/modules/phase157_webxr_portal_routes_bridge.js`
- `game/private-scene.html`
- `docs/PHASE-157-WEBXR-PRIVATE-SCENE-ROUTES-LOBBY-POLISH-LOCK.md`
- `update/version.json`

## Preserved

- Phase 156 lobby shell.
- Four walls, module facades, portal pads.
- Official root `logo.png` rule.
- WebXR dolly movement.
- 45-degree snap turn.
- Forward/back movement by dolly heading.
- Hands/fist purple fire.
- No safe lock / no center magnet.
- Moon/Mars/sky.
- No music.
- No watch yet.

## Added

- Portal route bridge module.
- Lightweight `game/private-scene.html` placeholder route page.
- Portal routing map:
  - Reiki → `./private-scene.html?scene=reiki`
  - PGA → `./private-scene.html?scene=pga`
  - Scorpion → `./private-scene.html?scene=scorpion`
  - Store → `../site/store.html`
  - Lounge → `./private-scene.html?scene=lounge`
  - Seat → stays in lobby

## Test URL

```text
https://svrpoker.com/game/?v=phase157-private-routes
```

## Test order

1. Confirm Phase 157 loads.
2. Confirm lobby shell still appears.
3. Confirm movement, snap-turn, and hands still work.
4. Aim at Reiki/PGA/Scorpion/Lounge portal and release.
5. Confirm it routes to `private-scene.html` placeholder.
6. Return to lobby.
7. Test Store portal opens the store page.
8. Test Seat portal stays in the lobby.

## Next phase

Phase 158 should replace the placeholder private-scene page with real lightweight scenes one at a time, starting with Scorpion or Reiki depending on user priority.
