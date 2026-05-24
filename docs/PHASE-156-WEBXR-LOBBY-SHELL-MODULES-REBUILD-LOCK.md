# PHASE-156-WEBXR-LOBBY-SHELL-MODULES-REBUILD-LOCK

## Purpose

Phase 156 starts replacing the real lobby around the working WebXR base. It adds perimeter walls, neon trims, corner pillars, module facades, official branding, and portal pads while preserving the stable locomotion, hands, and no-safe-lock behavior from earlier phases.

## Files changed

- `game/index.html`
- `game/modules/phase156_webxr_lobby_shell_modules.js`
- `docs/PHASE-156-WEBXR-LOBBY-SHELL-MODULES-REBUILD-LOCK.md`
- `update/version.json`

## Added

- Four perimeter lobby walls.
- Neon corner pillars.
- Wall trim accents.
- Official logo on north wall.
- Lightweight center poker table.
- Module facades for:
  - Reiki
  - PGA
  - Scorpion
  - Store
  - Lounge
  - Seat
- Portal pads for all active modules.

## Preserved

- Official root `logo.png` rule.
- WebXR dolly movement.
- Right-controller fallback.
- 45-degree snap turn.
- Forward/back movement by dolly heading.
- Hand tracking proxy.
- Fist purple fire.
- No safe lock / no center magnet.
- Moon/Mars/sky.
- No music.
- No watch yet.
- No world/root movement.
- No XR reference-space mutation.

## Test URL

```text
https://svrpoker.com/game/?v=phase156-lobby-shell-modules
```

## Test order

1. Confirm Phase 156 loads.
2. Confirm four walls appear around the lobby.
3. Confirm official logo remains visible.
4. Confirm module facades appear around the lobby.
5. Confirm portal pads remain selectable.
6. Confirm movement and snap-turn still work.
7. Confirm hand/fist teleport still works.
8. Confirm performance remains smooth.

## Next phase

Phase 157 should polish the lobby shell and wire private scene routes one at a time after this shell is confirmed stable.
