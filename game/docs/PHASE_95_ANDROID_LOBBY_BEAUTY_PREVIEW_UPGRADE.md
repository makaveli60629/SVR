# Phase 95 — Android Lobby Beautification Preview Upgrade

Game-side only. Site untouched.

## Context

The user is away from the computer and only has Android access. This phase upgrades the live phone preview instead of attempting deep Quest/table interaction testing.

## Added

- `game/modules/phase95_android_lobby_beauty_preview_upgrade.js`

## Updated

- `game/index.html`

## Purpose

Make the Android lobby preview look more professional and investor-presentable while preserving Phase 94's Camera 3 cinematic preview behavior.

## Visual upgrades

- Richer purple/cyan/gold lighting.
- Darker cinematic background and light fog.
- Preview runway/carpet glow.
- Showroom-style storefront signs:
  - Reiki Hub
  - PGA Golf
  - SVR Lounge
  - SVR Store
- Skyline/building silhouettes with emissive window strips.
- Moon and Mars beauty markers.
- SVR poker logo plate and table spotlight.
- Soft starfield with subtle motion.
- Android beauty preview HUD.

## Runtime checks

```js
SVR_RUN_PHASE95_BEAUTY_AUDIT()
SVR_RUN_PHASE94_PREVIEW_AUDIT()
```

## Test URLs

`/game/?v=phase95-android-lobby-beauty-preview-upgrade&preview=1&beauty=1`

or live:

`/game/?v=phase95-android-lobby-beauty-preview-upgrade`

## Acceptance checks on Android

- The page loads as Phase 95.
- Camera preview still moves automatically.
- Lobby lighting looks richer.
- Storefront signs are visible.
- Skyline, moon, Mars, stars, and table logo are visible.
- The preview is cleaner and more professional than Phase 94.

## Protected

- No website/site files changed.
- No Quest hand/controller logic changed.
- No table calibration changed.
- This is preview-only polish.
