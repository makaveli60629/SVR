# PHASE-148-WEBXR-POINTER-ALIGNMENT-LOCK

## Purpose

Phase 147 proved the WebXR dolly teleport path works. Phase 148 keeps that working teleport method and improves the right-controller floor pointer alignment.

## Files changed

- `game/index.html`
- `game/modules/phase148_webxr_pointer_alignment.js`
- `docs/PHASE-148-WEBXR-POINTER-ALIGNMENT-LOCK.md`
- `update/version.json`

## Locked rules

- WebXR only.
- Right controller only.
- No hands.
- No watch.
- No music.
- Do not move the world.
- Do not change XR reference spaces.
- Move the player dolly only.

## Pointer changes

- Uses the raw WebXR controller ray first.
- Uses the inverted ray only when it produces the better floor hit.
- Keeps the target in front of the user.
- Removes heavy smoothing so the marker follows the ray more tightly.
- Debug overlay shows the active aim mode.

## Test URL

```text
https://svrpoker.com/game/?v=phase148-pointer-alignment
```

## Pass criteria

- Teleport still works.
- Target does not appear behind the user.
- Target follows the right-controller pointer more accurately.

## Next

If the pointer is still off, the next phase should add a small calibration panel before rebuilding the full lobby.
