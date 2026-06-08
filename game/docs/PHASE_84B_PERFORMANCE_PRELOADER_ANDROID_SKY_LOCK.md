# Phase 84B — Performance Preloader + Android Stick + Moon/Mars Lock

## Scope
Game-side only. Website, site, backend, SQL, and admin API files are untouched.

## Build label
`PHASE-84B-PERFORMANCE-PRELOADER-ANDROID-SKY-LOCK`

## Included
- Added production loading/preloader overlay that fades out after the world, routes, logo, sky, and controls initialize.
- Added Android-only browser joystick module.
- Desktop browser hides Android/mobile controls.
- Quest/Oculus/WebXR hides Android/mobile controls and keeps VR input/controller fallback.
- Moon is larger, higher, textured, visible, and rotating.
- Mars is larger, higher, textured, visible, and orbits the Moon.
- Denser lightweight star sprites and stronger constellations.
- Reduced hot-path allocations in table-zone head checks.

## Protected
- No website edits.
- No backend/API edits.
- No multiplayer or NAF integration.
- No card-bending shader work.
- No lobby redesign.
