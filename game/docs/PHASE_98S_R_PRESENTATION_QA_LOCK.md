# Phase 98S-R - Presentation QA Lock and Rollback Guard

Date: 2026-06-02
Track: game and site QA

## Purpose

Lock the current presentation-safe state and prevent another broad visual overlay from being added before screenshots confirm exact placement problems.

## Current safe game state

- Active game page: Phase 98S-Q presentation-safe mode
- Active Reiki presentation: Phase 98S-O minimal Reiki polish
- Active store patch: Phase 98S-P approval placeholders
- Messy lobby storefront/ad overlay: disabled
- Runtime snap guard: preserved
- Moon/Mars patch: preserved
- Android two-stick controls: preserved

## Do not reload before visual QA

Do not re-enable:

- `game/modules/lobby_ads_portals_patch.js`

That overlay caused visual clutter and should stay disabled unless rebuilt from screenshots with exact coordinates.

## Safe presentation links

Game presentation mode:

`/game/?v=phase98sq-presentation-safe&present=1`

Game test mode:

`/game/?v=phase98sq-presentation-safe`

Store page:

`/site/store.html?v=phase98sp-store-placeholders`

Homepage banner:

`/site/index.html?v=phase98sl-banner-cleanup`

## QA checklist

1. Lobby looks clean at spawn.
2. No misplaced storefront/ad objects appear in the lobby.
3. Reiki area is visible and not cluttered.
4. Reiki hologram is one flat display.
5. Reiki audio is silent from spawn.
6. Reiki audio only becomes audible inside the Reiki room/audio zone.
7. Moon and Mars do not block or wash out the scene.
8. Android sticks still appear on Android.
9. Store page includes the Reiki Wellness Book placeholder after runtime script loads.
10. Homepage first banner shows the SVR welcome banner.

## Next allowed work

Only surgical fixes based on screenshots or exact placement values.

Recommended screenshot set:

- Lobby spawn view
- Reiki room entrance
- Reiki hologram close view
- Moon/Mars sky view
- Android mobile controls view
- Store page product area

## Rollback note

If the lobby is still cluttered after deploy, verify that `game/index.html` does not load `lobby_ads_portals_patch.js`. If it appears in the script list, remove it again before making any other visual changes.
