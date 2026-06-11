# PHASE-248-DIRECT-LIVE-VIBEZ-COSMIC-FIX

## Why this patch exists
Live game was still serving Phase 247 and earlier 1.7 badges/overlays were fighting the new runtime.

## Fix
This patch edits game/index.html directly and injects an inline script so it cannot fail because of a missing module file.

## Visible checks
- Top-left badge: SVR PHASE 248 LIVE FIX ACTIVE
- Bottom-left position display
- SVR VIBEZ THEATER visible left/west from spawn
- Moon and Mars forced higher:
  - Moon: 0 260 -210, scale 95
  - Mars: 115 315 -195, scale 70

## Test
https://svrpoker.com/game/?v=phase-248-direct-live-vibez-cosmic-fix

## Marker
https://svrpoker.com/game/DEPLOY_MARKER_PHASE248.txt
