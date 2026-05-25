# PHASE-235-VR-INPUT-SPAWN-CLEAR-LOCK

## Purpose
Phase 235 adds a post-deploy checklist panel so the workflow can verify deployment, cache busting, and tester handoff after Auto Deploy.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase235-postdeploy` and press `E`.
