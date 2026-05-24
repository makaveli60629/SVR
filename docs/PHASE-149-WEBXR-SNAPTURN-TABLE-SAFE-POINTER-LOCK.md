# PHASE-149-WEBXR-SNAPTURN-TABLE-SAFE-POINTER-LOCK

## Purpose

Phase 148 confirmed teleport works but the right stick snap-turn was missing and the teleport halo could lock onto the table center. Phase 149 keeps the working WebXR dolly teleport base and fixes those two issues before hands are reintroduced.

## Files changed

- `game/index.html`
- `game/modules/phase149_webxr_snapturn_table_pointer.js`
- `docs/PHASE-149-WEBXR-SNAPTURN-TABLE-SAFE-POINTER-LOCK.md`
- `update/version.json`

## Locked rules

- WebXR only.
- Right controller only.
- No hands yet.
- No watch yet.
- No music.
- Do not move the world.
- Do not mutate XR reference spaces.
- Move only the player dolly.

## Fixes

- Restored right-stick left/right 45-degree snap turn.
- Right-stick up/down remains forward/back movement.
- Right-stick left/right is snap-turn only, not strafe.
- Added a table-safe blocked radius so the teleport halo cannot remain stuck at the table center.
- If the ray hits inside the table blocked area, the target is pushed to a safe ring outside the table.
- Kept grip as preview only.
- Kept trigger/select release as teleport commit.

## Test URL

```text
https://svrpoker.com/game/?v=phase149-snapturn-table-safe
```

## Test order

1. Confirm HUD says Phase 149.
2. Right stick left/right should snap-turn 45 degrees.
3. Right stick up/down should move forward/back.
4. Hold grip and aim at the table center.
5. The halo should move to a safe ring outside the table, not stay frozen at the middle.
6. Hold trigger and release to teleport.

## Next phase

If Phase 149 passes, Phase 150 should add visible hands and fist purple-fire mode without changing the Phase 149 dolly teleport base.
