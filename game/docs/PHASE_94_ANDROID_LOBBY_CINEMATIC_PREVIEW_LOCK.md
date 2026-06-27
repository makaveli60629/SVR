# Phase 94 — Android Lobby Cinematic Preview Lock

Game-side only. Site untouched.

## User context

The user is away from the computer and only has an Android phone available. This phase is preview-focused rather than deep VR/table interaction work.

## Added

- `game/modules/phase94_android_lobby_cinematic_preview_lock.js`

## Updated

- `game/index.html`

## Purpose

Create a professional Android-friendly lobby preview using the existing live game page.

## Behavior

- Runs automatically on Android/mobile.
- Also runs when URL includes `preview`, `cam3`, or `phase94`.
- Loads late after the existing lobby/game stack.
- Hides diagnostic/display clutter where safe.
- Keeps table, logo, moon, Mars, portals, storefronts, chairs, NPCs, and sponsor hubs visible.
- Adds fallback preview elements if the scene does not expose named objects:
  - moon
  - Mars
  - Reiki storefront marker
  - PGA storefront marker
  - SVR lounge marker
  - SVR store marker
  - Android preview label
  - SVR poker logo plate on the table
- Moves the camera through a cinematic path to show:
  - lobby entry angle
  - moon/sky moment
  - storefront/portal sides
  - table/logo center
- Adds a small Android preview HUD.

## Runtime controls

```js
SVR_RUN_PHASE94_PREVIEW_AUDIT()
SVR_PHASE94_PREVIEW_ON()
SVR_PHASE94_PREVIEW_OFF()
```

## Test URL

`/game/?v=phase94-android-lobby-cinematic-preview-lock&preview=1`

## Main live URL

`/game/?v=phase94-android-lobby-cinematic-preview-lock`

## Acceptance checks on Android

- Page opens without needing a computer.
- Camera moves automatically.
- Display clutter is reduced.
- Moon/sky moment is visible.
- Storefront/portal markers are visible.
- Table and SVR table logo are visible.
- The page is presentable as a live preview.

## Notes

This is a preview-only polish phase. It does not attempt deep Quest interaction tuning, seated table calibration, or hand/controller logic work.
