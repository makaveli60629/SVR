# PHASE-140-TEXTURE-FLOOR-RESTORE-NO-SKY-LOCK

## Purpose

Phase 140 restores a visible textured lobby floor while keeping the sky disabled for teleport stability. The user requested the textured floor back, but teleport freezing must remain the priority.

## Files changed

- `game/modules/floor_texture_overlay.js`
- `game/index.html`
- `docs/PHASE-140-TEXTURE-FLOOR-RESTORE-NO-SKY-LOCK.md`
- `update/version.json`

## What changed

- Added `floor_texture_overlay.js` as a separate removable module.
- Added a procedural user-style textured floor overlay.
- Kept the Phase 139 no-sky rule.
- Kept table safe ring overlay.
- Kept teleport-safe lobby structure.
- Did not re-enable Moon/Mars/animated sky.

## Why a separate module

The floor texture is now isolated from the lobby rebuild file. If it causes any issue, it can be removed from `game/index.html` without damaging the lobby, teleport, movement, watch, or poker systems.

## Runtime global

- `window.SVR_PHASE140_TEXTURE_FLOOR`

## Test URL

```text
https://svrpoker.com/game/?v=phase140-texture-floor
```

Hard refresh:

```text
Ctrl + F5
```

## Quest test checklist

- Textured floor appears.
- Sky remains disabled.
- Teleport does not freeze.
- Watch still appears with hand tracking.
- Portal buttons still move the user around the lobby.

## Next phase

`PHASE-141-POKER-GAMEPLAY-TABLE-STATE-LOCK`

Poker should only proceed after the no-sky textured floor build is confirmed stable.
