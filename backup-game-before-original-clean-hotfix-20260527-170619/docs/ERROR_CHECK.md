# Error Check

## Static syntax check
All JavaScript source files passed `node --check` in this phase.

Checked files:
- `main.js`
- `modules/asset_base.js`
- `modules/audio.js`
- `modules/config.js`
- `modules/core_scene.js`
- `modules/desktop_controls.js`
- `modules/gestures.js`
- `modules/hands.js`
- `modules/teleport.js`
- `modules/watch.js`
- `modules/world_skyline.js`

## What this does NOT prove
- Does not guarantee Quest runtime behavior
- Does not guarantee WebXR performance
- Does not guarantee interaction polish in-headset
- Does not replace a player audit

## Recommended player audit order
1. Watch alignment
2. Watch button response
3. Teleport on/off from watch
4. Table/felt visibility
5. Six-seat hover card readability
6. Reiki area visibility and placement
7. Live preview autocam
8. Frame-rate / blinking / freeze check
