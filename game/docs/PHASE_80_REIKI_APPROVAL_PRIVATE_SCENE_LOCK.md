# Phase 80 — Reiki Approval Private Scene Lock

## Scope
- Game-side only.
- Website/site untouched.
- Lobby preserved as the baseline.
- Reiki storefront stays in the lobby as a portal/storefront only.
- Full Reiki meditation experience is now a separate private scene at `game/reiki.html`.

## Reiki approval lock
- Removed live runtime references to unapproved Reiki sponsor/founder branding.
- Removed live runtime use of unapproved sponsor images and external sponsor website text.
- Reiki panels now use SVR placeholder language and red `AWAITING APPROVAL` treatment.
- Deleted unapproved Reiki sponsor media payloads from the package.

## Private room
- Added `game/reiki.html` as a lightweight private Reiki meditation scene.
- Includes trees, breathing orb, moon, Mars, stars, approval lock panels, and return-to-lobby button.

## Preserved
- Main lobby.
- Poker table.
- PGA hub/private-scene paths.
- Watch route buttons.
- Quest/WebXR controller fallback code.
- Game package under 25 MB.
