# PHASE-86-PGA-STABILITY-WATCH-LOCK

## Purpose

Fixes the PGA private range boot/stability issue and keeps the Phase 85 caddie-coach update safe.

## Scope

Game-side only. No website/site files are touched.

## Fixes

- Ensures `game/range.html` creates `phase85Pga` before the render loop.
- Makes the Phase 85 update tick safe with `phase85Pga?.update?.(dt)`.
- Preserves Caddie Coach drone, Day/Night toggle, divots, precision ring, birds, and alignment laser.
- Keeps Meta hand tracking and Quest/Oculus controller fallback.

## Test

```text
https://svrpoker.com/game/range.html?v=phase86-pga-stability
```

Controls:

```text
Y = Day/Night
R = reset ball
T = tracer on/off
L = lobby
```
