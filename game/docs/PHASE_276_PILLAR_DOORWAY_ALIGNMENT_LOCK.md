# Phase 276 Pillar Doorway Alignment Lock

Build: `PHASE-276-PILLAR-DOORWAY-ALIGNMENT-LOCK`

## Screenshot issue

The rear Roman pillars were still visually sitting in front of storefront signs and doorway centers.

## Fix

Updated:

```text
game/phase101s_finished_lobby_lock.js
```

The late runtime shim now moves the rear pillars to doorway jamb positions:

```text
column 1: x -15.4
column 2: x -9.0
column 3: x -3.0
column 4: x 3.0
column 5: x 9.0
column 6: x 15.4
column 7: outer end cap
```

The pillars are also slimmed so the storefront signs and doorway centers remain visible.

## Protected work

- Phase 275 deploy workflow remains preserved.
- Quest cleanup remains preserved.
- Moon and Mars lock remains preserved.
- Site content untouched.

## Test

```text
https://svrpoker.com/game/?v=phase276-pillar-doorway-alignment
```
