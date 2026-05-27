# PHASE 276 — Original Lobby Only Freeze Fix

This phase keeps the original lobby and hides duplicate/fallback/second lobby geometry.

Console checks:

window.SVR_PHASE276_ORIGINAL_LOBBY_ONLY
window.SVR_PHASE276_REMOVE_DUPLICATE
window.SVR_HAND_TELEPORT_STATE

Important fields:
- keptLobby
- hiddenObjects
- hiddenNames
- hiddenDuplicateFloors
- sceneFound
