# PHASE-85-PGA-UPDATE-LIVING-RANGE-LOCK

Game-side PGA update only. Website/site files are not touched.

## Corrections

- No A-Frame rewrite. Current modular Three.js/WebXR runtime is preserved.
- No controller removal. Meta hands first with Quest/Oculus controller fallback remains locked.
- Heavy HDR/FBX/GLB files are not forced into this patch.
- PGA gameplay remains in private range scenes, not the lobby.

## Added

- `game/modules/pga_phase85_update.js`
- Caddie Coach drone scoreboard
- Manual Day/Night environment toggle with `Y`
- `window.SVR_PGA_PHASE85.toggleEnvironment()` for future watch binding
- Face-to-ball laser guide
- Green/red square-face status
- Slow-grow divot decal system, 120-second fade
- Reactive bird sprites
- Shared wind vector
- Precision target ring

## Test

Open `https://svrpoker.com/game/range.html?v=phase85-pga-update` and press `Y` to toggle range lighting.
