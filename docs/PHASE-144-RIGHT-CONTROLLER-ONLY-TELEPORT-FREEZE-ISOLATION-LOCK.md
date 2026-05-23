# PHASE-144-RIGHT-CONTROLLER-ONLY-TELEPORT-FREEZE-ISOLATION-LOCK

## Purpose

The user reported that hand tracking freezes, controller movement works better, grip/trigger teleport is not showing reliably, and teleport still freezes. Phase 144 isolates input to the right Quest controller only.

## Files changed

- `game/modules/hands.js`
- `game/modules/teleport.js`
- `game/index.html`
- `docs/PHASE-144-RIGHT-CONTROLLER-ONLY-TELEPORT-FREEZE-ISOLATION-LOCK.md`
- `update/version.json`

## Critical changes

- Disabled hand-tracking output for this phase.
- Ignored left controller for this phase.
- Right controller proxy remains hidden visually but active for input.
- Teleport now uses right trigger/grip only.
- A/B buttons remain disabled for teleport.
- Added generated high-contrast SVR TELEPORT logo target.
- Added yellow teleport ring and cyan aim line.
- Teleport commit waits 80ms plus one animation frame before moving the world root.
- Controller movement remains right-controller-only.

## Why

This phase isolates the freeze path. If hand tracking was causing freezes, removing hands from the runtime loop should improve stability. If teleport still freezes with only the right controller, the freeze is likely in world-root movement or scene load, not hand tracking.

## Test URL

```text
https://svrpoker.com/game/?v=phase144-right-controller-only
```

Hard refresh:

```text
Ctrl + F5
```

## Quest test checklist

1. Use only the right controller.
2. Confirm forward/back movement works.
3. Confirm left/right or snap-turn works.
4. Hold right trigger or grip.
5. Confirm the SVR TELEPORT logo appears on the floor.
6. Release trigger/grip.
7. Confirm whether teleport moves without freezing.
8. Do not use hand tracking in this phase.

## Next if still freezing

`PHASE-145-BARE-TELEPORT-ONLY-DIAGNOSTIC-LOCK`

That phase must load no lobby, no watch, no portals, no texture floor, no audio, and no Moon/Mars. It should test only a flat floor, right controller movement, and teleport.
