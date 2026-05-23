# PHASE-137-MOVEMENT-LOCOMOTION-TELEPORT-MODULE-LOCK

## Purpose

Phase 137 locks the movement, locomotion, and teleport module path for SVR-Version 0.1. This phase focuses on making player movement predictable, modular, and safer for Meta Quest WebXR performance.

## Files changed

- `game/modules/locomotion_lock.js`
- `game/modules/teleport.js`
- `docs/PHASE-137-MOVEMENT-LOCOMOTION-TELEPORT-MODULE-LOCK.md`

## Movement lock

- Left stick: camera-forward movement.
- Right controller fallback: left-stick pair can move if left input is unavailable.
- Right stick: 45-degree snap turn target.
- Deadzone applied to reduce drift.
- Hot path uses reusable vector/object state to reduce garbage collection spikes.

## Teleport lock

- Controller fallback: hold trigger/A/grip to aim, release to teleport.
- Hand tracking: fist toggles purple fire teleport aim mode.
- Hand tracking: release pinch commits teleport.
- Watch button can still toggle teleport mode through `actions.toggleTeleport`.
- Teleport method remains world-root shift, not XR reference-space mutation.
- Goal: avoid Quest/WebXR freezing from reference-space changes.

## Performance lock

- Reused objects in `locomotion_lock.js` hot paths.
- Reused clamp target in `teleport.js` instead of allocating a new vector each aim frame.
- Controller aim reuses controller origin/direction vectors.
- Movement calculations avoid new vector creation in the repeated controller movement path.

## Runtime globals

- `window.SVR_LOCOMOTION_LOCK`
- `window.SVR_PHASE137_TELEPORT_LOCK`
- `window.SVR_PHASE129_TELEPORT_FIX` remains aliased for backward compatibility.

## Test procedure

Open:

```text
https://svrpoker.com/game/?v=phase137-locomotion-teleport
```

Then hard refresh:

```text
Ctrl + F5
```

Desktop checks:

- Lobby loads.
- Floor remains visible.
- Scene buttons still jump to portal areas.
- Watch still loads when hand tracking is available.

Quest checks:

- No visible controller models.
- Stick movement works.
- Snap turn works in 45-degree increments.
- Hold trigger/A/grip to show teleport target.
- Release trigger/A/grip to teleport.
- Fist toggles hand teleport mode.
- Pinch release commits hand teleport.
- Teleport does not freeze the session.

## Next phase

`PHASE-138-WATCH-UI-INPUT-BRIDGE-LOCK`

Target:

- Make watch clearer and more reliable.
- Add route buttons for core hubs.
- Add visible state for teleport/movement/account/admin readiness.
- Preserve locked watch placement and facing rules.
