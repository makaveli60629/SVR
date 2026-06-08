# Phase 84A — Android Stick + Moon/Mars Auto Deploy

## Scope
Game-side only. Website/site files remain untouched.

## Locked goals
- Android browser only: show mobile joystick controls.
- Desktop browser: hide Android/mobile joystick controls.
- Quest/Oculus/WebXR: hide Android/mobile joystick controls and rely on VR input/controller fallback.
- Moon must be bigger, higher, textured, visible, rotating.
- Mars must be bigger, higher, textured, visible, and orbiting the Moon.
- Duplicate geometry-only Moon/Mars props must remain disabled/removed.
- Keep lobby/private scene routing intact.
- Keep package under 25 MB.

## Deploy note
This commit is an auto-deploy trigger and phase lock note. The game runtime ZIP must be rebuilt with this exact phase label before final lock:

PHASE-84A-ANDROID-STICK-MOON-MARS-VISIBILITY-LOCK
