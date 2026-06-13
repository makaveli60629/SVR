# Phase 171 — Clean Inner Octagon + Moon/Mars Lock

## Objective
Clean the lobby visually before adding any new background skyline work.

User direction:
- Remove all background buildings.
- Keep focus on the inner lobby.
- Make the octagon clean, connected, and not visually cluttered.
- Remove Earth for now.
- Add a large textured Moon.
- Add textured Mars.
- Keep visible gameplay modules inside the octagon.

## Added

### `game/modules/lobby_cleanup_sky_phase171.js`
New cleanup and sky module.

Responsibilities:
- Hide objects whose names match background building/skyline/tower/city/ad-building/billboard patterns.
- Hide Earth/globe/blue-planet objects.
- Force old Phase 123 ad-building ring to stay hidden.
- Add a large textured Moon in the north sky.
- Add a textured Mars in the high north sky.
- Animate Moon/Mars lightly with low-cost rotation.
- Expose runtime status at:
  - `window.SVR_PHASE171_CLEAN_LOBBY_SKY`

### `game/main.js`
- Imports `installPhase171LobbyCleanupSky`.
- New build label: `UPDATE-3.0-PHASE-171-CLEAN-INNER-OCTAGON-MOON-MARS-LOCK`.
- Installs Phase 171 after the expanded octagon module so cleanup runs last.
- Adds Phase 171 tick for Moon/Mars animation.
- Sets `window.__SVR_PHASE171_CLEAN_INNER_OCTAGON_LOCK__ = true`.

### `game/index.html`
- Loading screen updated to Phase 171.
- Cache bust updated to `phase171-clean-inner-octagon-moon-mars-lock`.

## Verification Checklist

1. Hard refresh `/game/`.
2. Confirm Phase 171 loading screen appears.
3. Confirm background buildings behind the walls are gone/hidden.
4. Confirm no Earth is visible.
5. Confirm large textured Moon is visible high in north sky.
6. Confirm Mars is visible near the Moon, smaller and textured.
7. Confirm inner octagon remains the visual focus.
8. Confirm hub pods remain inside the octagon.
9. Confirm no obvious wall/object overlap around octagon.
10. Confirm Quest locomotion and Android controls still work.

## Commits
- `6a4c5b91e86cedfbaa3eaa203d0c8df348216e19` — Add Phase 171 lobby cleanup moon Mars module.
- `8c0d85c1f7ea7119b187e800e3e41620fcf46f9e` — Install Phase 171 clean inner octagon and moon Mars lock.
- `d03964098206a5a3523ebab40a1f09f61a8ec0e2` — Update loading screen to Phase 171 clean inner octagon.
