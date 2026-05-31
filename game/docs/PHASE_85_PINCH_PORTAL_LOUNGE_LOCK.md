# Phase 85 — Pinch Release Portal Lounge Lock

## Scope
Game-side only. Website/site files are not touched.

## Fixed
- Refined hand pinch/fist teleport release so the target is latched while aiming and release fires from the last stable marker.
- Reduced release timing friction for hand tracking and controller fallback.
- Preserved right-stick forward/back movement and 45° snap turn.
- Added all portal routes to the desktop scene bar and wrist watch.
- Added a new SVR Lounge storefront in the lobby.
- Added private route pages for Reiki Room, PGA Drive, Chip/Putt, VR Store, Lounge Room, and Scorpion Room.
- Removed unapproved Reiki sponsor/founder runtime branding/assets and replaced them with SVR AWAITING APPROVAL placeholders.

## Portal routes
- Lobby
- Table
- Seat
- Reiki Hub
- Reiki Room
- PGA Hub
- PGA Drive
- Chip/Putt
- VR Store
- Lounge storefront
- Lounge Room
- Legend
- Sponsor
- Scorpion

## Test checklist
1. In Quest, hold pinch/fist, aim, and release. Teleport should fire from the visible marker.
2. Hold A/grip/trigger, aim, and release. Marker should remain in front, not behind.
3. Desktop bottom buttons should show all major portals.
4. Wrist watch should expose the expanded portal set.
5. Lounge storefront should be visible in the lobby and Lounge Room should open a private page.
