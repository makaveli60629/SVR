# Issue 96 — Phase 190 Patch Note

## Issue
`[launch-blocker][vr] Fix Quest right-controller teleport forward`

## Patch
Phase 190 updates the browser/WebXR game-side teleport implementation so Quest/Oculus controller aiming uses the WebXR controller target ray direction instead of the older ambiguous `getWorldDirection()` behavior.

## Result expected
- Right controller ray points forward when the controller points forward.
- A / grip / trigger remains hold-to-aim, release-to-teleport.
- Right stick movement and snap turn stay active.
- No website files changed.

## Test URL
`https://svrpoker.com/game/?v=phase190-controller-forward`

## Status
Patched. Awaiting Quest hardware verification before closing issue #96.
