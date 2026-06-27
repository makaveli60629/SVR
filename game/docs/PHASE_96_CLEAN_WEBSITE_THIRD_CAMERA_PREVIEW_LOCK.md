# Phase 96 — Clean Website Third Camera Preview Lock

Game-side preview behavior only. Public Matrix site design untouched.

## Added

- `game/modules/phase96_clean_website_third_camera_preview_lock.js`

## Updated

- `game/modules/phase95_android_lobby_beauty_preview_upgrade.js`

## Purpose

The website live third-camera preview must show a clean professional lobby recording, not debug overlays, floating displays, signs, tags, labels, banners, or UI panels.

## Behavior

Phase 96 runs only when the game is opened in preview/director mode, including URLs with:

- `preview`
- `cam=director`
- `cam3`
- `autocam`
- `phase96`

## Clean preview rules

When third-camera preview is active, Phase 96 hides:

- DOM overlays
- HUDs
- debug panels
- audit panels
- floating labels
- tags
- text displays
- UI buttons
- badges
- signs
- banners
- diagnostic markers
- Phase 94/95 preview labels/sign panels

It preserves:

- lobby geometry
- table
- SVR table logo
- chips/cards/table elements
- moon/Mars/stars
- skyline/building silhouettes
- storefront/portal geometry
- chairs/NPCs/bots
- lighting/glow/runway elements

## Camera behavior

Phase 96 applies a slower professional camera path that tours:

- lobby entry view
- side storefront geometry
- moon/sky moment
- center table/SVR logo
- opposite side storefront geometry

## Runtime controls

```js
SVR_RUN_PHASE96_PREVIEW_AUDIT()
SVR_PHASE96_PREVIEW_ON()
SVR_PHASE96_PREVIEW_OFF()
```

## Test URL

```text
/game/?v=phase96-clean-third-camera-preview&preview=1&cam=director&autocam=1
```

## Website iframe target

```text
../game/index.html?preview=1&cam=director&autocam=1&v=phase96-clean-third-camera-preview
```

## Acceptance checks

- No visible website/game overlay in the preview frame.
- No debug/audit/build/HUD labels.
- No signs, labels, tags, banners, or display boards in camera view.
- Camera moves smoothly through the lobby.
- Moon/Mars, skyline, table, SVR table logo, and physical storefront geometry remain visible.
- Performance remains Android-friendly.
