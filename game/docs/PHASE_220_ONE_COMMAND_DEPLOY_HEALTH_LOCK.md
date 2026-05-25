# PHASE-232-BRIDGE-ALIAS-RECOVERY-LOCK

## Purpose
Phase 232 adds a simple one-command deploy health surface so the project can confirm whether the latest package is actually visible after GitHub Pages deploy.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase232-deployhealth` and press `M`.
