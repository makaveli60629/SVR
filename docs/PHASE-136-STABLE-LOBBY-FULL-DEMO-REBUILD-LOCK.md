# PHASE-136-STABLE-LOBBY-FULL-DEMO-REBUILD-LOCK

## Purpose

Phase 136 is the first visible SVR-Version 0.1 rebuild phase after the Phase 135 workflow reset. The goal is to replace the thin emergency lobby with a clearer polished demo lobby while preserving Quest performance.

## Files changed

- `game/modules/lobby_stable_refine.js`
- `game/index.html`
- `docs/PHASE-136-STABLE-LOBBY-FULL-DEMO-REBUILD-LOCK.md`

## Main game runtime note

`game/main.js` still holds the Phase 133 marker in the current repo because the full replacement write was blocked by connector safety checks. The visible entry and lobby module are now Phase 136. If the HUD still shows Phase 133, update `game/main.js` locally by changing:

```js
const PHASE_BUILD = "PHASE-133-STABLE-LOBBY-REFINE-REBASE-LOCK";
```

to:

```js
const PHASE_BUILD = "PHASE-136-STABLE-LOBBY-FULL-DEMO-REBUILD-LOCK";
```

and update the world root name/status strings if desired.

## Visible rebuild targets

- Correct visible floor with SVR-Version 0.1 demo markings.
- Safe spawn pad facing north.
- North wall: SVR Poker Version 0.1.
- East wall: PGA.
- West wall: Reiki AWAITING APPROVAL.
- South wall: SVR Store / Profile / Sponsor / Impact.
- Scorpion show table in lobby.
- Portal signs for Reiki, PGA, Scorpion, Store, Lounge, Sponsor, and Impact.
- High orbit Moon and Mars.
- Watch/input/teleport systems remain loaded from the stable runtime.

## Performance rules preserved

- Lightweight Three.js/WebXR runtime.
- No heavy skyline rebuild in the main boot.
- MeshBasicMaterial where possible.
- Canvas textures generated once during build.
- No runtime object creation inside the sky tick except numeric updates.
- Quest foveation and framebuffer scaling are still set from renderer/performance modules.

## Test URL

```text
https://svrpoker.com/game/?v=phase136-full-demo-lobby
```

Hard refresh:

```text
Ctrl + F5
```

## Done criteria

- HUD / page title says Phase 136, or clean boot audit reports active Phase 136.
- Lobby visually shows more than the emergency table/chairs: walls, portal boards, floor markings, and portal hubs should be visible.
- Floor is visible.
- Spawn remains outside the table.
- Portal buttons still jump the camera around the lobby.
- Quest performance remains smooth enough to continue into Phase 137 movement/teleport lock.
