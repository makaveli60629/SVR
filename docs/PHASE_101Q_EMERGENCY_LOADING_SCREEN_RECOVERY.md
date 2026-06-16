# Phase 101Q - Emergency Loading Screen Recovery

## Purpose

Fix the live game getting stuck on the loading screen.

## Problem

The game page was still depending on the full module chain to complete before the boot overlay disappeared. If a late module errored, stalled, or imported slowly, the visible page could remain stuck on the boot card.

## Patch applied

### Updated game entry

File:

```text
game/index.html
```

Changes:

- Added a non-module hard boot guard before module scripts.
- Added `window.SVR_RELEASE_BOOT(reason)`.
- Added absolute timeout release.
- Added error and unhandled promise rejection release.
- Removed old Phase 257/258/259 preload scripts from the primary boot path.
- Kept `main.js` as the core runtime.
- Kept Phase 260 as the final geometry/current-stack layer.

Primary script path now:

```text
phase101_boot_load_screen_recovery.js
phase101_partial_runtime_render_guard.js
phase101_render_marker_cleanup.js
main.js
phase260_roman_canopy_archway_final_lock.js
```

### Updated boot recovery script

File:

```text
game/phase101_boot_load_screen_recovery.js
```

Changes:

- Calls `window.SVR_RELEASE_BOOT(reason)` when available.
- Forces `body.boot-released`.
- Sets `window.__SVR_GAME_READY__ = true` when releasing the loader.
- Creates a boot-safe fallback renderer if no real scene appears.
- Absolute release at 6.2 seconds to prevent any stuck boot overlay.

## Debug objects

Use browser console:

```text
window.SVR_PHASE101Q_BOOT_GUARD
window.SVR_PHASE101_BOOT_RECOVERY
window.__SVR_GAME_READY__
window.__SVR_SCENE__
window.__SVR_RENDERER__
```

## Validation URL

Use:

```text
https://svrpoker.com/game/index.html?v=phase101q-boot-recovery
```

Expected:

- Loading screen disappears within 6 seconds even if a late module fails.
- Main scene appears if runtime loads.
- Boot-safe fallback appears if runtime fails.
- No permanent stuck boot card.

## Locked rule

This phase only fixes boot/loading reliability. It does not change admin, Android movement, sponsor content, or Unity logic.

## Commit name

```text
Phase 101Q - Emergency Loading Screen Recovery
```
