# PHASE-163-SCORPION-WATCH-VR-ATTACH-ACTION-MIRROR-LOCK

## Purpose

Phase 163 carefully advances the watch from a display-only HUD into a safe floating VR-style watch proxy with action mirroring for Scorpion gameplay. This is still a non-invasive layer: it does not alter locomotion, teleport, hand tracking, WebXR dolly movement, or XR reference spaces.

## Files changed

- `game/private-scene.html`
- `game/modules/private_scene_runtime_phase163.js`
- `docs/PHASE-163-SCORPION-WATCH-VR-ATTACH-ACTION-MIRROR-LOCK.md`
- `update/version.json`

## Added

- Floating VR-style SVR watch proxy.
- Official `../logo.png` on watch face.
- Watch mirrors:
  - Street
  - Timer
  - Pot
  - Status
- Watch action mirror buttons:
  - Watch Check
  - Watch Call
  - Watch Raise +25
  - Watch Fold
- Buttons mirror Phase 161 table action buttons when available.

## Preserved

- Phase 162 turn indicators.
- Phase 161 table/action layer.
- Official logo branding.
- No music.
- No locomotion changes.
- No teleport changes.
- No hand tracking changes.
- No XR reference-space mutation.

## Test URL

```text
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase163-watch-action-mirror
```

## Next phase

Phase 164 should add hand history strip and stronger action-state records without changing movement or teleport.
