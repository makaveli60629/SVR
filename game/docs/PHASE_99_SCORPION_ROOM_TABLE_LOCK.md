# Phase 99 — Scorpion Room Table Lock

## Purpose
The Scorpion poker table must live inside the Scorpion Game Room/private VR room, not as a store-front/lobby-only prop.

## Fixes
- Re-locked build label to `PHASE-99-SCORPION-ROOM-TABLE-LOCK`.
- Added a guaranteed visible Scorpion table base inside the Scorpion Game Room.
- Loads the real table asset from `assets/models/table.glb` / `table.fbx` when available.
- Keeps the procedural Scorpion table/felt visible as a guaranteed base so the room never appears empty if the GLB is dark, slow, or missing.
- Added a Scorpion table to the Phase 98/99 VR scene pod so the VR route also shows a table immediately.
- Preserved Phase 97/98 private room portal routes and back-to-lobby safety.
- Site/website side untouched.

## Locked rule
The store/lobby can show only a clean portal or kiosk preview. The actual Scorpion poker table belongs inside the Scorpion private game room.
