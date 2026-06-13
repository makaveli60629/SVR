# Phase 170 — Module Registry + Diagnostic Lock

## Objective
Create a control and diagnostic layer before adding more heavy visuals. This phase gives SVR a clear module map, runtime checks, FPS/spike visibility, and URL toggles for freeze isolation.

## Files Changed

### `game/modules/svr_module_registry_phase170.js`
New standalone runtime registry.

Adds:
- `window.SVR_MODULES`
- `window.SVR_PHASE170_REGISTRY`
- `window.SVR_PHASE170_TOGGLES`
- Platform detection: Quest / Android / Desktop
- FPS estimate
- last-frame time
- frame-spike counter
- pass/wait checks for:
  - game ready
  - freeze guard
  - Android smart lock
  - expanded lobby
  - left-to-right deal order
  - background building hiding
  - Quest teleport test status

### `game/index.html`
Updated loading screen/build label to Phase 170 and loads:

`./modules/svr_module_registry_phase170.js?v=phase170-module-registry-diagnostic-lock`

## How to Use Diagnostics

Open:

`/game/?phase170=1`

or

`/game/?diag=1`

or press `F9` on desktop to show/hide the diagnostic overlay.

## Freeze Isolation URL Toggles

The registry records these toggles now for isolation passes:

- `?lite=1`
- `?noPods=1`
- `?noCommand=1`
- `?noPoker=1`
- `?noReiki=1`
- `?noNpc=1`
- `?noFx=1`

Current phase records these values and exposes them in `window.SVR_PHASE170_TOGGLES`. The next isolation pass can wire these toggles directly into module installation if freezing persists.

## Locked Module Map

- Freeze Guard — locked
- Android Smart Controls — locked
- Quest Teleport — locked
- Controller Locomotion — locked
- Expanded Octagon Lobby — active
- Hub Pods — active
- Command Center — active
- Poker Demo — active
- Wrist Watch — active
- Background Buildings — disabled
- Nathan NPC — optional/heavy

## Test Checklist

1. Open `/game/?phase170=1`.
2. Confirm Phase 170 loading screen appears.
3. Confirm diagnostic overlay appears.
4. Check FPS and spike count.
5. Confirm `expandedLobby` check passes.
6. Confirm `dealOrder` check passes after poker demo starts.
7. On Android, confirm Android lock check passes.
8. On Quest, test hand teleport manually.

## Commits
- `9428462089a774e573e1d427110e9f3dcf35ac80` — Add Phase 170 module registry diagnostics.
- `084b2f63c2cf93c9325e76cc69724a32ae4b8cd0` — Wire Phase 170 module registry diagnostics.
