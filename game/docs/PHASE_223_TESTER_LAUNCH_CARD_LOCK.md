# PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK

## Purpose
Phase 244 adds a tester launch card so testers have one small panel with the URL, shortcut keys, checklist, and expected pass/fail notes.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase244-testercard` and press `C`.
