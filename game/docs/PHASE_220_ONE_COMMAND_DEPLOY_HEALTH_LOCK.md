# PHASE-236-VR-INPUT-DIAGNOSTIC-LOCK

## Purpose
Phase 236 adds a simple one-command deploy health surface so the project can confirm whether the latest package is actually visible after GitHub Pages deploy.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase236-deployhealth` and press `M`.
