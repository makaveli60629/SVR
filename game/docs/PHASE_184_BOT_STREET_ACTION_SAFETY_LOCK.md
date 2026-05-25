# Phase 199 — Bot Street Action Safety Lock

## Build
`PHASE-235-VR-INPUT-SPAWN-CLEAR-LOCK`

## Purpose
This phase locks the poker runtime against scheduled bot-action errors and hardens street betting events before the next polish pass.

## Fixed
- Corrected the preflop bot action ordering so `actionName` is declared before contribution logic runs.
- Added guarded execution around scheduled poker steps so one runtime issue cannot black-screen or freeze the hand loop.
- Added bot-action safety telemetry for preflop, flop, turn, and river.
- Corrected river action logging to record the actual paid amount instead of the requested amount.

## Preserved
- Public Matrix launch page untouched.
- Dealer body disabled; invisible card/deal logic preserved.
- Side-pot, all-in contribution, muck/fold eligibility, winning-card reveal, action log, and hand history locks preserved.
- Game package remains under 25 MB.
