# PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK

## Purpose
Phase 242 adds a Pilot Feedback Export panel so testers can capture one JSON bundle containing build marker, URL, browser/device info, shortcut panel availability, and typed tester notes.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase242-feedbackexport` and press `F4`.
