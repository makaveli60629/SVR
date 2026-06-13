# Phase 183 Roman Mezzanine Ads Lock

## Purpose

Create the upper Roman-style media ring requested for the lobby.

## Added

- game/modules/phase183_roman_mezzanine_ads.js

## Updated

- game/phase176_boot.js

## Features

- Raised upper wall band.
- Mid-level mezzanine walkway ring.
- Roman banister inner rail.
- Roman banister outer rail.
- Gold trim and cornice bands.
- Under-glow ring below the mezzanine.
- Upper storefront facade slots.
- Passive tiered ad units.

## Ad tiers

Tier 1:
- largest premium screens
- placed at four main directions
- automatic slide rotation

Tier 2:
- medium banner screens
- placed between premium units
- automatic slide rotation

Tier 3:
- smaller basic banner units
- repeated around the ring
- automatic slide rotation

## Slider rule

All ad units rotate automatically about every five seconds.

No touch interaction is added to these ad units. They are passive display inventory.

## Runtime marker

window.SVR_PHASE183_MEZZANINE_ADS

## Test

/game/?v=phase183-mezzanine

## Commits

- 7ffc85fb047a33ef234a20283d17237ca0007429
- 500f3900b860a4cd761e0dad0238893674cfa68c
