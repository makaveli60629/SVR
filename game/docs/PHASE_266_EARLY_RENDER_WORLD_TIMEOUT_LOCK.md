# PHASE 266 — Early Render World Timeout Lock

## Problem
Phase 265 showed Ready/Enter VR but the scene canvas stayed black.

## Root Cause
The visible shell was created before world loading, but the renderer animation loop did not start until after:
- buildSkylineRoom()
- assets
- store kiosk
- hands
- teleport
- audio
- watch
- logo

If buildSkylineRoom stalled or took too long, the shell existed but was never drawn.

## Fix
Added:
- game/modules/phase266_boot_render_guard.js

This module:
- starts an early render loop immediately
- renders the visible shell before world loading finishes
- creates a fallback world after timeout
- lets the full runtime continue loading
- preserves private routes and kiosk buttons

## Test Checklist
1. Build says Phase 266.
2. Black canvas is gone.
3. Visible shell appears quickly.
4. Route health still works.
5. Private scene buttons still work.
6. Enter VR button remains available.
7. Next phase can focus on movement/teleport hardening.

## Next Phase
PHASE-267-QUEST-MOVEMENT-TELEPORT-HARDENING-LOCK
