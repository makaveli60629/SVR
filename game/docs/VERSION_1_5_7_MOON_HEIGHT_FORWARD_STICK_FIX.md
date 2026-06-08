# Version 1.5.7 - Moon Height + Forward Stick Fix

## Scope
Game side only.

## Moon / Mars
- Raises Moon and Mars higher above the skyline.
- Keeps them large and visible.
- Uses texture slots:
  - game/assets/textures/moon.jpg
  - game/assets/textures/mars.jpg
- Runtime fallback creates real textured spheres if the scene exposes THREE and no planet is found.

## Controller / Stick
- Adds camera-forward stick locomotion shim.
- Forward stick uses current camera/head yaw, not controller sideways alignment.
- Backward goes directly behind the user.
- 45-degree forward stick moves 45 degrees relative to the user's current forward view.
- Snap turn remains 45 degrees.
- Runs only when a physical/gamepad stick axis is active.

## Protected
- Website/site untouched.
- Existing Reiki runtime files hash-protected.
- Lobby is not rebuilt.

## Test
https://svrpoker.com/game/?v=1-5-7-moon-forward-stick
