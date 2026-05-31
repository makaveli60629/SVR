# Phase 84 — Teleport Locomotion Lock

Game-side only patch. Site files are untouched.

## Fixed

- Repaired controller locomotion selection so right-stick Y controls forward/back even when both controllers are connected.
- Preserved right-stick X 45-degree snap turn.
- Rebuilt teleport hold/release behavior for Quest/Oculus controller fallback.
- Added direct hold-to-aim teleport for A / grip / trigger. Release teleports only after the marker is stable.
- Added hand-tracking direct hold-to-aim fallback for fist or pinch. Release teleports only after the marker is stable.
- Added ray correction so controller/hand aim does not lock behind the player when a runtime reports the ray reversed.
- Added safe head-forward fallback so the floor marker stays in front instead of behind the camera.
- Reduced marker/glow churn to help stop floor blink/flicker.
- Watch update now uses controller-proxy hands when real hand tracking is unavailable.

## Controls

### Quest/Oculus controller

- Right stick up/down: move forward/back based on headset direction.
- Right stick left/right: 45-degree snap turn.
- Hold A, grip, trigger, or stick press: aim teleport marker.
- Release: teleport after stable aim.

### Hand tracking

- Hold pinch or fist: aim teleport marker.
- Release: teleport after stable aim.
- Fist-near-face toggle is still preserved as optional backup.

## Preserved

- Current lobby baseline.
- Game package only.
- Website/site untouched.
- No unapproved Reiki branding added.
- Existing scene routing/buttons preserved.
