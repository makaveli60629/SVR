# Issue 96 — Phase 190 Test Checklist

## Build
`UPDATE-3.0-PHASE-190-QUEST-CONTROLLER-FORWARD-TELEPORT-LOCK`

## Test URL
`https://svrpoker.com/game/?v=phase190-controller-forward`

## Quest test order
1. Enter VR session on Quest/Oculus.
2. Confirm build label shows Phase 190.
3. Hold A / grip / trigger on the right controller.
4. Confirm the purple teleport arc appears in front of the controller.
5. Point the controller left/right/down and confirm the ray follows the controller, not the headset.
6. Release to teleport.
7. Turn headset 45 degrees and press right stick forward.
8. Confirm movement goes forward as expected.
9. Confirm no instant accidental teleport.

## Pass criteria
- Ray does not appear behind the player unless the controller is physically aimed behind.
- Hold-to-aim and release-to-teleport are preserved.
- Right-stick forward/back and 45-degree snap turn remain working.

## Status
Patched. Hardware verification pending.
