# PHASE-232-BRIDGE-ALIAS-RECOVERY-LOCK

## Purpose
Phase 232 adds a Pilot Feedback Export panel so testers can capture one JSON bundle containing build marker, URL, browser/device info, shortcut panel availability, and typed tester notes.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase232-feedbackexport` and press `F4`.
