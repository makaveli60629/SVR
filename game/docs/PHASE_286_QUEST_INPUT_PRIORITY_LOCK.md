# Phase 286 Quest Input Priority Lock

Build: `PHASE-286-QUEST-INPUT-PRIORITY-LOCK`

## Summary

Phase 286 protects Quest controller fallback movement when hand tracking is present.

## Fix

A new movement wrapper routes controller stick/button input to the existing controller locomotion path even if hand objects are also present.

## Files changed

```text
game/modules/movement_phase286_input_lock.js
game/modules/movement_phase228.js
game/index.html
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Protected work

- Phase 284 pillar obstruction scan preserved
- Phase 285 QA snapshot preserved
- Site untouched

## Test

```text
https://svrpoker.com/game/?v=phase286-quest-input-priority
```

## Quest checks

- right stick forward/back works even when hands are visible
- snap turn still works
- fist teleport remains available when controller input is idle
- teleport ray remains forward locked
