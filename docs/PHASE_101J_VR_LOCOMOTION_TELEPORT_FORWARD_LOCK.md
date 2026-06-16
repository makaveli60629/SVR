# Phase 101J - VR Locomotion Smoke Test and Teleport Ray Forward Lock

## Purpose

Fix and lock the Quest/WebXR locomotion path so teleport aim and walking direction do not go behind or sideways relative to the player head/camera direction.

## Issues targeted

- Teleport ray can appear behind the player.
- Controller aim can choose the wrong controller axis.
- Hand aim can accept a weak backwards wrist/finger direction.
- Forward/back movement must always follow current head/camera direction.
- Quest smoke-test state must be visible from browser console.

## Patch applied

### New module

```text
game/modules/teleport_phase101j_forward_lock.js
```

This module is based on the existing Quest teleport runtime but adds a stronger forward lock:

- Controller teleport direction compares possible controller axes.
- Final aim direction is flattened to X/Z.
- If aim direction points behind the head/camera forward vector, it is forced to head-forward.
- If aim direction is weak/sideways, it blends back toward head-forward.
- Hand/fist teleport gets the same forward-direction lock.
- Walking still uses the XR head/camera forward vector.

### Movement export updated

```text
game/modules/movement_phase228.js
```

Now exports:

```text
./teleport_phase101j_forward_lock.js?v=phase101jforwardlock
```

## Debug / smoke-test objects

Use browser console while testing:

```text
window.SVR_PHASE101J_LOCOMOTION
window.SVR_PHASE101J_SMOKE
window.SVR_PHASE101J_AIM_FORWARD_LOCK
window.SVR_PHASE101J_MOVE_FORWARD_SOURCE
window.SVR_PHASE101J_MOVE_VECTOR
window.SVR_PHASE101J_LAST_TELEPORT
```

## Validation checklist

- [ ] Enter Quest WebXR.
- [ ] Hold controller grip/trigger.
- [ ] Teleport ray appears in front of player.
- [ ] Teleport ray does not appear behind the player.
- [ ] Release grip/trigger and teleport lands at target.
- [ ] Make fist with hand tracking.
- [ ] Fist ray appears in front of player.
- [ ] Release fist and teleport lands at target.
- [ ] Forward stick follows current head direction.
- [ ] Turn head 45 degrees, push forward, and confirm movement follows gaze.
- [ ] Snap-turn still turns in 45-degree steps.
- [ ] Android route is not modified.

## Locked rule

This phase changes Quest/WebXR movement only. It does not rebuild the lobby, website, sponsor modules, Android controls, or Unity-only logic.

## Commit name

```text
Phase 101J - VR Locomotion Smoke Test and Teleport Ray Forward Lock
```
