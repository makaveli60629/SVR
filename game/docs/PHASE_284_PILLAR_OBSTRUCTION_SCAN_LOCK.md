# Phase 284 Pillar Obstruction Scan Lock

Build: `PHASE-284-PILLAR-OBSTRUCTION-SCAN-LOCK`

## Summary

Phase 284 adds a rear-column obstruction scan after load.

## Fix

The runtime now:

- keeps intended rear jamb pillars slimmed and pushed back
- forces matrix updates after alignment
- scans rear column objects
- hides duplicate columns found near doorway centers
- reruns through 22 seconds after load so late lobby modules cannot restore blockers

## Files changed

```text
game/phase101s_finished_lobby_lock.js
game/index.html
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase284-pillar-obstruction-scan
```
