# Phase 141 — Quest Movement + Teleport Final Lock

## Scope

Game-side only. `/site` and public website files are not changed.

## Purpose

This phase finalizes the Quest/Oculus locomotion and teleport control layer after Phase 140 removed blocking deal displays.

## Required behavior

- Right stick up/down moves forward/back using the headset/camera direction.
- Right stick left/right remains 45 degree snap turn.
- Controller button hold aims teleport and release commits teleport.
- A / grip / trigger are accepted as controller hold-release teleport inputs through the existing base teleport button reader.
- Hand fist/grip gesture hold aims teleport and release commits teleport.
- Pinch-only teleport is blocked to prevent accidental movement.
- Controller meshes stay hidden while hand/proxy representations, watch, teleport arc, target, and rings remain available.
- Poker-action hover still blocks teleport near poker buttons.
- Phase 140 deal-display cleanup remains loaded before this phase.

## Files changed

```text
game/modules/movement_phase135_playability_control_lock.js
game/phase141_quest_movement_teleport_final_lock.js
game/index.html
deploy-health.json
game/docs/PHASE_141_QUEST_MOVEMENT_TELEPORT_FINAL_LOCK.md
```

## QA command

After deploy, run:

```js
window.SVR_RUN_PHASE141_QUEST_CONTROL_AUDIT()
```

Expected:

```text
badge: PHASE 141 • QUEST CONTROL LOCK
rightStickForwardBackHeadDirection: true
snapTurn45: true
controllerButtonHoldAimReleaseTeleport: true
fistGripHoldAimReleaseTeleport: true
pinchOnlyLeapBlocked: true
siteTouched: false
```

## Oculus test checklist

1. Hard-refresh `/game/?v=phase141-quest-control`.
2. Confirm badge says `PHASE 141 • QUEST CONTROL LOCK`.
3. Use right stick up/down while looking at different angles. Forward should follow where the headset faces.
4. Use right stick left/right. Snap turn should be 45 degrees.
5. Hold A / grip / trigger. Teleport arc/target should remain visible while held.
6. Release A / grip / trigger. Teleport should commit once.
7. Use fist/grip hand gesture hold. Arc should show.
8. Release fist/grip. Teleport should commit once.
9. Pinch only should not accidentally teleport.
10. Controller models should not appear as bulky visible controllers.

## Protected

- Do not touch `/site`.
- Do not change room/storefront structure.
- Do not reintroduce Phase 315/316 deal displays.
- Do not replace the lobby baseline.
