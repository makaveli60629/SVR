# PHASE-238-HAND-TELEPORT-PINCH-DESTINATION-LOCK

## Purpose
Phase 238 adds a Pilot Feedback Export panel so testers can capture one JSON bundle containing build marker, URL, browser/device info, shortcut panel availability, and typed tester notes.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.
- Site additions are internal admin-only helpers.

## Test
Open `/game/?v=phase238-feedbackexport` and press `F4`.
