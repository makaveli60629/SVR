# PHASE-235-VR-INPUT-SPAWN-CLEAR-LOCK

## Purpose
Phase 235 adds a Power Deploy Wait Log panel and a stronger PowerShell deploy script that can trigger GitHub Actions, wait for the newest run, and show the final run list.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase235-powerwait` and press `F7`.
