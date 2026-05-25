# PHASE-231-MAIN-IMPORT-RECOVERY-LOCK

## Purpose
Phase 231 adds a simple one-command deploy health surface so the project can confirm whether the latest package is actually visible after GitHub Pages deploy.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase231-deployhealth` and press `M`.
