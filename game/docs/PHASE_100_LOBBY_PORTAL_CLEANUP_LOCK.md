# Phase 100 — Lobby Portal Cleanup Lock

## User feedback addressed

- Phase 99 loaded and showed improvements, but there were too many teleport portal pads.
- Lobby must show only one portal per storefront/hub, and that portal should route to the matching private scene.
- Full private scenes should not be displayed as extra pods inside the main lobby.
- Moon and Mars were not visible enough in the lobby.
- Scorpion storefront/game room should use one display table only, as a showroom/portal, while real Scorpion gameplay is routed to a private gameplay room.
- Espresso with Cream ad should sit on a tall building behind/aligned with the Reiki hub wall.
- Watch needs a working HOLO button.
- Fist/chinch hand teleport was not working reliably and must be restored.

## Locked changes

- Build label updated to `PHASE-100-LOBBY-PORTAL-CLEANUP-LOCK`.
- Disabled Phase 98 extra VR scene pods/floor pads to reduce portal clutter.
- Kept only single storefront portal routes for lobby entry points.
- Removed visible `BACK TO LOBBY` floor portal markers from the lobby/private route marker set; watch Lobby button remains the clean return route.
- Added a separate Scorpion private gameplay room outside the main lobby layout.
- Kept Scorpion showroom/front table as display-only portal presentation.
- Added Espresso with Cream tall building wall advertisement behind the Reiki hub.
- Moved Moon and Mars closer/larger as a fail-safe visible lobby sky lock.
- Added watch `HOLO ON / HOLO OFF` button.
- Restored fist/chinch hand teleport even when controller fallback proxies are present.

## Rules preserved

- Site/website side untouched.
- Game-side-only update.
- Quest/Oculus controller fallback preserved.
- Meta hand tracking preserved.
- Storefronts remain modular and sponsor-ready.
- Reiki branding remains approval-placeholder only.
- `game.zip` must stay under 25 MB.
