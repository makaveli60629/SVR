# PHASE 279 — Poker Spawn View Final Cleanup

Fixes:
- Removes duplicate/second/fallback lobby.
- Disables old visual/debug modules that caused crowded overlays.
- Moves hand history and showdown HUD higher.
- Raises and enlarges community cards.
- Clears spawn point view.
- Stabilizes blinking floor and z-fighting.

Console check:

window.SVR_PHASE279_POKER_SPAWN_VIEW

Fields:
- sceneFound
- hiddenCount
- hiddenNames
- environmentRoots
- keptEnvironment
- movedHandHistory
- communityCardsMoved
- clearedSpawnView
- hiddenDuplicateFloors
