# VERSION-1.7.5-COSMIC-VIBEZ-SINGLE-RUNTIME-LOCK

## Purpose
Fix the issue where multiple lobby/cosmic versions were running together and fighting each other.

## Fixes
- Removes old lobby polish scripts: 1.7.2, 1.7.3, 1.7.4.
- Removes old 1.6.x sky/celestial scripts from index.html.
- Adds one single runtime controller.
- Adds always-on position display.
- Restores visible SVR VIBEZ THEATER storefront.
- Locks Moon and Mars using close/large sky placement:
  - Moon: position [0, 180, -400], scale [50, 50, 50]
  - Mars: position [150, 220, -350], scale [35, 35, 35]
- Adds deep purple sky dome and star field.
- Adds deployment proof badge.

## Test
https://svrpoker.com/game/?v=1-7-5-cosmic-vibez-single-runtime

## Verify
- Top-left badge: SVR SINGLE RUNTIME LOCK ACTIVE
- Bottom-left always-on position display
- SVR VIBEZ THEATER on west side
- Moon and Mars high in sky and not clipped behind buildings
