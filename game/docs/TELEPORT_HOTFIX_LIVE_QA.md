# Teleport Hotfix Live QA — Phase 105

## Desktop smoke test

- Load `/game/?v=phase105-teleport-hotfix`.
- Confirm no black screen.
- Press and hold `T` to show teleport aiming marker.
- Release `T` and confirm marker clears.

## Quest controller test

- Enter VR.
- Hold grip: teleport marker appears.
- Release grip: teleport commits if valid floor target exists.
- Hold A: teleport marker appears where supported.
- Release A: teleport commits where supported.
- Hold trigger/select: fallback marker appears where supported.
- Release trigger/select: fallback commits where supported.
- Right stick up/down still moves forward/back.
- Right stick left/right still snap-turns 45 degrees.

## Hand tracking test

- Hold fist/clench: teleport marker appears.
- Release fist/clench: teleport commits if valid floor target exists.
- Losing tracking cancels safely.
- Teleport never stays stuck armed.
- Teleport never stays stuck disabled.

## Regression check

- Watch remains visible.
- Scorpion table still loads.
- Cards still deal left-to-right.
- No website files changed.
- No SQL/backend files changed.
