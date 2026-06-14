# Phase 185 Official Lobby Look Lock

## Purpose

Make the generated luxury Roman VR casino lobby the official visual rule for the game lobby.

## Official rule

Every lobby module should follow this visual language:

- Roman luxury casino architecture.
- Curved tall wall.
- Upper banister walkway.
- Gold trim.
- Purple and cyan futuristic accents.
- Tier 1, Tier 2, and Tier 3 passive ad inventory.
- Center Play Game table selector.
- Wellness, PGA, Scorpion, Legends, Sponsor, and Daily Bonus hubs.
- Large moon and smaller Mars in the sky.
- Clean glossy floor with gold/cyan inlay rings.

## Added

- game/modules/phase185_official_lobby_look.js

## Updated

- game/phase176_boot.js

## Behavior

The Phase 185 module hides superseded visual overlay roots from previous exploratory phases and installs the official look root.

Preserved systems:

- hand history filter
- lobby bounds
- table selector API
- Quest movement and teleport
- controller fallback
- desktop testing

## Runtime marker

window.SVR_PHASE185_OFFICIAL_LOOK

## Test

/game/?v=phase185-official-look

## Checklist

1. Roman curved wall appears.
2. Upper banister walkway appears.
3. Tier 1/2/3 ad units are visible.
4. Center Play Game stage appears.
5. Store hubs are labeled.
6. Legends statues are aligned.
7. Moon and Mars are visible.
8. Old visual clutter from earlier phases is hidden.
9. Table selector still works.
10. Lobby movement bounds still work.

## Commits

- cb3023d02216b155a56d540b5a7ecd90c02708b1
- db41ca069b68f6074b7cf880a133701564aa0037
