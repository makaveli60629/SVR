# PHASE-154-WEBXR-NO-SAFE-LOCK-ALIGNED-HANDS-LOCK

## Purpose

The user reported that Phase 153 still aimed from/near the center and that the center safe lock was still influencing the teleport hologram. Phase 154 removes the table/center safe lock entirely and aligns fist aiming from the hand/wrist ray.

## Files changed

- `game/index.html`
- `game/modules/phase154_webxr_no_safe_lock_aligned_hands.js`
- `docs/PHASE-154-WEBXR-NO-SAFE-LOCK-ALIGNED-HANDS-LOCK.md`
- `update/version.json`

## Fixes

- Removed table safe lock behavior.
- Removed center block behavior from targeting.
- Removed target hiding or pushing caused by the center/table radius.
- Controller targeting uses the controller ray without table magnet logic.
- Hand/fist targeting uses a wrist-oriented floor ray instead of camera-center-only aiming.
- Official root `logo.png` remains the brand and teleport logo.
- Purple fire remains smaller so it does not cover the halo.
- Textured Moon and Mars remain active.

## Locked base preserved

- WebXR dolly movement.
- Right-controller fallback.
- 45-degree snap turn.
- Forward/back movement by dolly yaw.
- No music.
- No watch yet.
- No world/root movement.
- No XR reference-space mutation.

## Test URL

```text
https://svrpoker.com/game/?v=phase154-aligned-hands
```

## Test order

1. Confirm Phase 154 loads.
2. Hold grip/trigger and aim near table center.
3. Confirm halo does not magnet/pull/hide from center lock.
4. Confirm halo follows controller ray better.
5. Enable hand tracking.
6. Make fist: purple fire and logo halo should show.
7. Move hand/wrist: halo should move with hand aim, not stay at center.
8. Open/release fist: teleport commits.
