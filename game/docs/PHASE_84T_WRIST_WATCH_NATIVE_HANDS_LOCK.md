# Phase 84T — Wrist Watch Native Hands Lock

## Scope
Game-side only. Website untouched.

## Implemented
- Premium left-wrist watch quick view remains visible on native Meta hand tracking and hidden-controller hand proxy fallback.
- Quick view displays real-world time, player balance, username, and competitive rank.
- Added physical white side button on the watch frame. Pinch/touch it to open or close the full watch menu.
- Full menu preserves scene/audio/teleport/table controls.
- Default VR controller models remain hidden.
- Controller fallback uses textured hand-style proxies instead of visible controller objects.
- Native Meta hand mesh receives project skin texture where available.

## Protected
- Existing skyline, ad buildings, Moon/Mars, stars, scene routing, teleport, audio, and table systems preserved.
- Quest/Oculus controller fallback preserved while keeping controller meshes hidden.
- No unapproved Reiki/Trueitive branding added.
