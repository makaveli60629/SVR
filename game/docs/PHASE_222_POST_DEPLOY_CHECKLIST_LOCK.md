# PHASE-231-MAIN-IMPORT-RECOVERY-LOCK

## Purpose
Phase 231 adds a post-deploy checklist panel so the workflow can verify deployment, cache busting, and tester handoff after Auto Deploy.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase231-postdeploy` and press `E`.
