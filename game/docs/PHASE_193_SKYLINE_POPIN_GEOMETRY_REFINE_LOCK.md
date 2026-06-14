# Phase 193 — Skyline Pop-in + Geometry Refine Lock

## Problem
During game load, older background building/skyline modules could briefly appear and then disappear after cleanup modules ran. That caused a visible pop-in/pop-out effect during loading.

## Cause
The old skyline/ad-building modules were still being created first, then later hidden by the Phase 187/186/192 cleanup chain. The cleanup worked, but it happened after the player could already see the geometry.

## Scope
Game-side only. Site untouched.

## Fix
- Added `game/phase193_preload_scene_filter.js` and loaded it before `main.js`.
- The preload filter sets:
  - `window.SVR_DISABLE_LEGACY_SKYLINE = true`
  - `window.SVR_REFINED_LOBBY_GEOMETRY = true`
- The preload filter patches Three.js object addition so legacy skyline/building/ad-building/old arena objects are hidden immediately as they are added.
- Updated `phase187_official_lobby_stabilizer.js` to set the same flags before main world boot.
- Added `game/modules/phase193_refined_lobby_geometry.js`.
- Added a clean rectangular modular room shell:
  - north/south/east/west clean walls
  - stable low architecture
  - column placements
  - wall-aligned Play / Wellness / PGA / Store / Scorpion labels
  - lightweight ceiling guide rings that do not behave like a second floor
- Preserved Phase 190 controller teleport forward fix.
- Preserved Phase 191 floor authority.
- Preserved Phase 192 HUD and lobby visual cleanup.

## Locked behavior
- Legacy skyline/background buildings should not flash during loading.
- Lobby should read as a cleaner walkable 3D room.
- Storefront modules should be wall-aligned.
- The middle floor remains open for movement and poker.
- No second-floor/canopy clutter should dominate the view.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase193-refine`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-193-SKYLINE-POPIN-GEOMETRY-REFINE-LOCK`.
- [ ] Watch loading from first paint: old skyline/buildings should not appear and disappear.
- [ ] Confirm clean rectangular room walls and columns appear.
- [ ] Confirm Play, Wellness, PGA, Store, and Scorpion wall labels are visible.
- [ ] Confirm floor remains stable and not duplicated.
- [ ] Confirm teleport and right-stick movement still work.
- [ ] In console, confirm `window.SVR_PHASE193_PRELOAD_FILTER.active === true`.
- [ ] In console, confirm `window.SVR_PHASE193_REFINED_GEOMETRY.locked === true`.

## Files changed
- `game/phase193_preload_scene_filter.js`
- `game/modules/phase193_refined_lobby_geometry.js`
- `game/phase187_official_lobby_stabilizer.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
