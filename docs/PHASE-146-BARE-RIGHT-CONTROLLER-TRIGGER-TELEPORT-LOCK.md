# PHASE-146-BARE-RIGHT-CONTROLLER-TRIGGER-TELEPORT-LOCK

## Purpose

Phase 146 is a true bare diagnostic phase because Phase 145 still failed to teleport to the final destination. This phase removes the full main runtime path and tests only the right Quest controller, movement, and trigger-release teleport.

## Files changed

- `game/index.html`
- `game/modules/phase146_bare_right_teleport.js`
- `docs/PHASE-146-BARE-RIGHT-CONTROLLER-TRIGGER-TELEPORT-LOCK.md`
- `update/version.json`

## What is intentionally disabled

- No `game/main.js` runtime.
- No watch.
- No hand tracking.
- No music/audio.
- No portals.
- No private scene routing.
- No heavy lobby modules.
- No Moon/Mars.
- No old teleport module.

## What remains enabled

- Three.js WebXR scene.
- Right Quest controller only.
- Right stick movement.
- Trigger hold to aim.
- Trigger release to teleport.
- Grip preview only.
- Uploaded original-style real texture paths:
  - `game/assets/texture/slate_basecolor.jpg`
  - `game/assets/texture/stonebrick_wall_basecolor.png`
  - `game/assets/texture/tablefelt.png`
- High-contrast SVR FINAL DEST teleport target.

## Final-destination teleport method

Instead of moving the entire world root, Phase 146 moves the player rig so the XR camera/head lands exactly on the teleport target:

```text
rig.position.x += target.x - headWorld.x
rig.position.z += target.z - headWorld.z
```

This should directly address the issue where the target disappeared but the user did not arrive at the final destination.

## Test URL

```text
https://svrpoker.com/game/?v=phase146-bare-right-trigger-teleport
```

Hard refresh / clear Quest Browser cache if the old phase appears.

## Quest test order

1. Open Phase 146 URL.
2. Confirm HUD says Phase 146.
3. Use right controller only.
4. Move with right stick.
5. Hold grip: preview target only.
6. Release grip: target cancels, no teleport.
7. Hold trigger: target appears.
8. Release trigger: camera should move to final destination.

## Next decision

If Phase 146 works, re-add systems one at a time:

1. Real lobby floor/walls.
2. Table.
3. Moon/Mars.
4. Watch.
5. Portals.
6. Poker gameplay.

If Phase 146 still fails, the problem is in controller input mapping or WebXR headset movement assumptions, not the lobby modules.
