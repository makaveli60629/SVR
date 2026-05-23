# PHASE-131-GAME-CLEAN-BOOT-AUDIT-REPAIR-LOCK

Scope: game-only. Public website and `/site` were not touched.

## Problems reported

- Game still had many symptoms after several phase patches.
- Lobby appeared wrong after multiple independent overlay modules loaded at the same time.
- Floor could disappear or appear behind other render layers.
- Phase labels could remain stale in the visible HUD.
- Extra script modules in `game/index.html` could load duplicate runtime panels and old globals.
- Quest/browser cache could keep serving old module versions.

## Repair strategy

Phase 131 simplifies the boot path. Instead of loading many standalone script patches directly from `game/index.html`, the entry now loads only:

- `./main.js?v=phase131-clean-boot`
- `./modules/phase131_clean_boot_audit.js?v=phase131-clean-boot`

The feature modules are still imported from `main.js`, but duplicate standalone overlay scripts are removed from the HTML entry to prevent repeated collisions.

## Files updated

- `game/index.html`
- `game/modules/phase131_clean_boot_audit.js`
- `docs/PHASE-131-GAME-CLEAN-BOOT-AUDIT.md`

## Files already present from the immediate prior repair

- `game/modules/lobby_floor_recovery.js`
- `game/modules/high_sky_north_east.js`
- `game/modules/view_performance_manager.js`

## Phase 131 runtime globals

- `window.SVR_PHASE131_CLEAN_BOOT_AUDIT`
- `window.SVR_BUILD_PHASE`
- `window.SVR_CURRENT_GAME_PHASE`

## Expected result

- Visible build label shows `PHASE-131-GAME-CLEAN-BOOT-AUDIT-REPAIR-LOCK`.
- Duplicate runtime panels are reduced.
- Clean boot audit button appears at lower-left.
- Lobby floor recovery and orbit sky modules can be verified from the clean boot audit report.
- Site/public page remains untouched.

## Required test URL

Use a new cache buster:

`https://svrpoker.com/game/?v=phase131-clean-boot`

Then hard refresh with Ctrl+F5.
