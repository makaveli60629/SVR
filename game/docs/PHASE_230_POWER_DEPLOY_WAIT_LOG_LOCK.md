# PHASE-238-HAND-TELEPORT-PINCH-DESTINATION-LOCK

## Purpose
Phase 238 adds a Power Deploy Wait Log panel and a stronger PowerShell deploy script that can trigger GitHub Actions, wait for the newest run, and show the final run list.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase238-powerwait` and press `F7`.
