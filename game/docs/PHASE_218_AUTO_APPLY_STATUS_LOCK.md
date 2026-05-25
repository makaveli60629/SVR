# PHASE-236-VR-INPUT-DIAGNOSTIC-LOCK

Phase 236 hardens the one-command updater workflow and adds in-game status evidence for the auto-apply process.

## Test
Open `/game/?v=phase236-autoapplystatus` and press `I`.

## Locked
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` remains backup.
