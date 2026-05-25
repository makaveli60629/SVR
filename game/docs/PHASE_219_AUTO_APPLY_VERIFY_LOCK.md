# PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK

## Purpose
Phase 242 adds a verification surface for the simplified one-command PowerShell updater.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase242-autoverify` and press `O`.
