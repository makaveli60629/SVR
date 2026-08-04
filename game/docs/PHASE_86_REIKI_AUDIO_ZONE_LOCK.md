# Phase 86 — Reiki Audio Zone + Lobby Music Toggle Lock

## Scope
Game-side only. Website/site untouched.

## Changes
- Lobby music is manual ON/OFF only.
- XR session no longer auto-starts lobby music.
- `M` key and watch MUSIC button toggle lobby music.
- Reiki hologram audio is isolated to `reiki-video-portal.html`.
- Reiki video portal is gated from the main lobby: user must be at/near the Reiki storefront before opening the hologram audio zone.
- The portal video starts muted and only makes sound after user action inside the portal.

## Preserved
- Lobby baseline.
- Site untouched.
- Reiki sponsor approval lock.
- Package under 25 MB target.
