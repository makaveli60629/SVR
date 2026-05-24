# PHASE-147-WEBXR-DOLLY-RIG-TELEPORT-LOCK

## Purpose

The user clarified that this is WebXR. Phase 147 replaces the previous diagnostic with a strict WebXR dolly-rig teleport test.

## Files changed

- `game/index.html`
- `game/modules/phase147_webxr_dolly_teleport.js`
- `docs/PHASE-147-WEBXR-DOLLY-RIG-TELEPORT-LOCK.md`
- `update/version.json`

## WebXR rules locked

- Three.js + WebXR only.
- Meta Quest Browser target.
- `renderer.xr.enabled = true`.
- `local-floor` required feature.
- No native Oculus SDK assumptions.
- No Unity-style teleport system.
- No XR reference-space mutation.
- Do not move the scene/world.
- Move only the WebXR player dolly.

## What is intentionally disabled

- No `game/main.js`.
- No watch.
- No hand tracking.
- No audio/music.
- No portal routing.
- No old teleport module.
- No Moon/Mars.

## What remains enabled

- Right WebXR controller only.
- Right controller select/trigger events.
- Polling fallback for trigger button.
- Grip/squeeze preview only.
- Right-stick dolly movement.
- Real uploaded texture paths for floor/wall/table.
- High-contrast `SVR FINAL DEST` target.

## Final-destination method

Phase 147 moves the dolly so the WebXR headset world position lands on the target:

```text
dolly.position.x += target.x - headWorld.x
dolly.position.z += target.z - headWorld.z
```

The target and dolly positions are shown in the debug overlay.

## Test URL

```text
https://svrpoker.com/game/?v=phase147-webxr-dolly-teleport
```

## Test order

1. Confirm HUD says Phase 147.
2. Enter VR in Quest Browser.
3. Use right controller only.
4. Right stick moves the dolly.
5. Grip preview shows target but does not teleport.
6. Trigger/select hold shows target.
7. Trigger/select release commits teleport.
8. Debug overlay should show changed Dolly coordinates.

## Next if it works

Rebuild in this order:

1. Floor/walls/table only.
2. Moon/Mars as static lightweight module.
3. Watch only after controller teleport is stable.
4. Portal buttons.
5. Poker gameplay.

## Next if it fails

If Phase 147 does not move the headset to final destination, the fault is in WebXR controller event mapping, gamepad index mapping, or camera/dolly transform assumptions. The next phase should create visible controller-axis/button telemetry panels before adding any lobby feature back.
