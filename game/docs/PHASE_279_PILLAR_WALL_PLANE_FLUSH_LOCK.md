# Phase 279 Pillar Wall Plane Flush Lock

Build: `PHASE-279-PILLAR-WALL-PLANE-FLUSH-LOCK`

## Summary

Phase 279 pushes the rear pillars back closer to the wall plane and slims them down so they no longer stand in front of the storefront signs.

## Main change

Updated:

```text
game/phase101s_finished_lobby_lock.js
```

## Pillar correction

- rear z moved to `-16.32`
- pillar x scale reduced to `0.32`
- pillar z scale reduced to `0.30`
- caps and bases reduced so signs remain visible
- extra right end column moved to an outer end-cap position
- late alignment reruns through 12 seconds so it wins after other lobby modules load

## Test

```text
https://svrpoker.com/game/?v=phase279-pillar-wall-plane-flush
```
