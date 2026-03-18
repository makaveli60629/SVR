# SVR Game Full Audit — Phase v2.1.7

- Package: `svr_game_full_audit_phase_v217_20260317_under25mb.zip`
- Size: `21.49 MB`
- Scope: game-only, site untouched

## Static audit results

- index: OK
- main: OK
- table.glb: OK
- table.fbx: OK
- claudia.fbx: OK
- walking.fbx: OK
- claudia_dif: OK
- slate_base: OK
- slate_norm: OK
- slate_rough: OK
- stone_wall_base: OK
- stone_wall_norm: OK
- stone_wall_rough: OK
- tablefelt: OK
- moon_diffuse: OK
- moon_bump: OK
- logo_ui: OK
- track_1: OK
- track_2: OK

## Fixes in this phase

- Replaced hand rendering with simpler visible hand visuals for tracked hands and controllers.
- Refined wrist watch placement farther along the forearm and biased the UI outward.
- Reworked sponsor/matrix walls to use live binary rain with sponsor labels.
- Brightened and brought Earth/Moon closer into the sky composition.
- Increased floor and wall texture tiling so the pattern reads smaller.
- Removed synthetic felt cap overlay; kept the real table surface visible.
- Raised demo cards and chips to reduce tabletop z-fighting/blinking.
- Kept four sponsor matrix walls: north main + south/east/west reserved.
- Added the uploaded logo as a local game asset at `assets/ui/logo.png`.

## Known limitation

- `card.fbx` was not present anywhere in the accessible uploaded files, so the dealer demo still uses procedural demo cards rather than a user-supplied card rig.
- Claudia placement and watch fit were refined in code, but this package was not live-tested in a Quest headset here.
