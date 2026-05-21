# Phase 97 — Private Room Portal Hardening + Module Registry

## Locked purpose
This phase keeps the website untouched and only updates the game side. It builds on Phase 96 and hardens the route system so lobby storefronts do not forget their private-room destinations.

## Added
- `game/modules/private_room_registry.js`
  - single route registry for Scorpion, Reiki Room, PGA Range, VR Store, Smoker Lounge, and Space Room
  - sponsor/branding status metadata
  - route labels used by runtime status messages
- Phase 97 portal lock markers in the game world
  - Scorpion entry and back-to-lobby route
  - Reiki Room entry and back-to-lobby route
  - PGA Range entry and back-to-lobby route
  - VR Store entry and back-to-lobby route
  - Smoker Lounge entry and back-to-lobby route
  - Space Room / Moon-Mars deck entry and back-to-lobby route
- Proximity portal handling in `main.js`
  - player approaches route portal
  - route resolves to the correct private module target
  - cooldown prevents accidental bounce loops
- Desktop movement clamp
  - desktop preview/player movement is now clamped to the same safe room bounds used by teleport movement

## Preserved
- Phase 96 Scorpion front poker table
- Storefront stays a clean kiosk/portal preview
- Website/site files untouched
- Quest/VR path preserved
- Watch preserved
- Moon and Mars remain high and visible
- Reiki branding remains approval placeholder only
- `game.zip` rule remains under 25 MB

## Next recommended phase
Phase 98 should focus on **Scorpion poker gameplay lock**:
- action timer
- auto-check/auto-fold behavior
- player call staging
- table/watch turn indicators
- winner banner
- hand history strip
