# Phase 85 — Portal Enable + Solid Lobby Optimization Lock

## Goal

Enable the lobby portals as usable selectable pads while making the lobby cleaner, more solid, and faster to read/load. This is game-only work.

## Changed files

- `game/phase85_portal_enable_solid_lobby_lock.js`
- `game/phase101t_lobby_interaction_portal_qa_lock.js`
- `game/docs/PHASE_85_PORTAL_ENABLE_SOLID_LOBBY_LOCK.md`

## Runtime label

`PHASE-85-PORTAL-ENABLE-SOLID-LOBBY-LOCK`

## What Phase 85 does

- Adds solid selectable portal pads in the lobby.
- Adds readable portal labels for:
  - Lobby
  - Seat
  - Wellness
  - PGA
  - Legend
  - Sponsor
  - Scorpion
  - Store
- Makes portal pads clickable by desktop/touch raycast.
- Adds XR controller `selectend` raycast support for portal pads.
- Adds `window.SVR_GO_PORTAL(key)` for QA/direct route testing.
- Connects Wellness/Reiki to `./reiki.html`.
- Connects PGA to `./range.html`.
- Connects Store/Sponsor to `https://svrpoker.com/site/store.html`.
- Keeps existing main runtime keyboard/watch/local routing intact.
- Marks lobby signs, jumbotrons, banners, panels, and portal labels as readable/solid.
- Hides duplicate/debug/temp objects when they conflict with the current solid lobby.
- Adds telemetry at `window.SVR_PHASE85_PORTAL_ENABLE_SOLID_LOBBY_LOCK`.

## Loading / performance cleanup

- Does not add heavy assets.
- Uses small procedural canvas textures for portal labels.
- Uses lightweight ring/circle/plane geometry.
- Avoids rewriting the lobby.
- Avoids loading any new FBX/GLB payload.

## Protected systems

- Website and `/site` were not edited.
- Public Matrix page was not edited.
- Poker logic was not edited.
- Dealer/cards/chips were not edited.
- Watch UI was not edited.
- Quest locomotion was not edited.
- Moon/Mars modules were not edited.
- Private scene files were not edited.

## QA checklist

- Click/tap Wellness portal: should open the Reiki private scene.
- Click/tap PGA portal: should open the PGA/range private scene.
- Click/tap Store/Sponsor portal: should open the website store in a new tab.
- Select portal in VR using controller ray/select: portal should activate.
- Confirm lobby remains visually clean.
- Confirm center carpet/walkway remains open.
- Confirm no full private scene appears inside the lobby.

## Test URL

`/game/?v=phase85-portal-solid-lock`
