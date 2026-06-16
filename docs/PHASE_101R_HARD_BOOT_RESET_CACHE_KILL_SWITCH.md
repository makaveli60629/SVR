# Phase 101R - Hard Boot Reset and Cache Kill Switch

## Purpose

Fix persistent loading-screen lock after Phase 101Q.

If the user still sees a stuck loading screen, the likely cause is old cached game entry files or a late module chain that still blocks visible runtime. Phase 101R replaces the game entry with a hard reset loader.

## Patch applied

Updated:

```text
game/index.html
```

New behavior:

- No visible legacy `bootFallback` dependency.
- Shows a safe visible Phase 101R stage immediately.
- Adds manual buttons:

```text
Start Lobby Now
Clear Game Cache
Reload Fresh
```

- Unregisters browser service workers if any exist.
- Clears Cache Storage if available.
- Dynamically loads runtime modules after the page is already visible.
- Releases visible stage with `window.SVR_RELEASE_BOOT(reason)`.
- Absolute release at 5.2 seconds.
- Keeps `main.js` as the core runtime.
- Loads Phase 260 geometry as a delayed polish layer after core runtime begins.

## Runtime load order

```text
phase101_boot_load_screen_recovery.js
phase101_partial_runtime_render_guard.js
phase101_render_marker_cleanup.js
main.js
phase260_roman_canopy_archway_final_lock.js delayed
```

## Debug objects

Console:

```text
window.SVR_PHASE101R_BOOT_RESET
window.__SVR_GAME_READY__
window.__SVR_SCENE__
window.__SVR_RENDERER__
```

## Validation URL

Use:

```text
https://svrpoker.com/game/index.html?v=phase101r-hard-reset
```

Expected:

- Phase 101R screen appears immediately.
- It should not show the old Phase 260/101N stuck loader.
- Lobby starts automatically.
- If not, click `Clear Game Cache`, then `Start Lobby Now`.

## Locked rule

This phase fixes boot reliability only. It does not change admin logic, Android movement, Quest movement, sponsor modules, or Unity logic.

## Commit name

```text
Phase 101R - Hard Boot Reset, Cache Kill Switch, Dynamic Runtime Loader
```
