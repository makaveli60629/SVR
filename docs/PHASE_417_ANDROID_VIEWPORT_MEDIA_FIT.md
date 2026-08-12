# Phase 417 — Android Viewport Media Fit Lock

## Scope
Presentation-only Android/mobile media scaling hotfix. Poker rules, human-turn authority, Quest gameplay and APK policy are unchanged.

## Problem observed
Physical Android screenshots showed that phone/tablet content must remain clean across narrow portrait and short landscape viewports. Images added to mobile surfaces need a single rule set so logos, sponsor art, deck/burn art, profile portraits and future content media cannot overflow their containers or distort the layout.

## Fix
- Added `game/styles/phase417_android_viewport_media_fit.css`.
- `platform-device.js` loads the stylesheet only for non-Quest mobile `/game/` routes.
- Hero/launch images scale with `clamp()` plus dynamic viewport-height caps.
- Table sponsor/logo/deck/burn images use `object-fit: contain` and container overflow protection.
- User/profile portraits use `object-fit: cover` / centered background cropping.
- Future mobile content can use `.content-media` or `[data-svr-mobile-media]` to receive a one-screen height cap automatically.
- Portrait, narrow-phone and short-landscape breakpoints are included.

## Protected systems
- Phase 403 poker engine unchanged.
- Phase 414 human-turn rotation authority unchanged.
- Phase 415/416 human control and never-skip authorities unchanged.
- Quest Phase 396 route unchanged and explicitly excluded from the media-fit loader.
- APK remains `0.1.0-rc2`, code `2`, manual-only, no forced update or rebuild.

## QA target
No Android/mobile image may create horizontal overflow. Inserted content media must fit within its container and a bounded fraction of the active visual viewport while retaining its aspect ratio.
