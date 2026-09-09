# Phase 449 — Quest Clean Automatic Boot

Phase 449 corrects the visible Quest startup flow and strengthens seated-table safety.

## Result

1. The runtime automatically loads the lobby, verifies the approved table and Eric, applies the table cleanup authorities, and locks teleportation.
2. The loading card has no manual Start Lobby or Load Lobby action.
3. A retry control is created only after both automatic attempts fail.
4. The WebXR Enter VR control is the only user action expected after readiness.
5. Direct Quest mode no longer hides the readiness screen before verification completes.
6. All teleport, hand-teleport, grip-teleport, watch-teleport, table-travel, movement, and locomotion flags are continuously locked false.
7. Teleport arcs, rings, reticles, pointers, and controls are hidden.
8. Seated height adapts toward an eye line 0.66 m above the actual table top, with bounded correction.

## Protected scope

The public marketing homepage and `site/**` are unchanged. This phase changes only the Quest game launcher/runtime, the existing Phase 446 seat guard, one new game module, tests, documentation, and its CI guard.
