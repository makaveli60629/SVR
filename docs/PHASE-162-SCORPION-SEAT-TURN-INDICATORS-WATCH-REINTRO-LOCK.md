# PHASE-162-SCORPION-SEAT-TURN-INDICATORS-WATCH-REINTRO-LOCK

## Purpose

Phase 162 adds Scorpion seat/turn indicators and carefully reintroduces the watch as a display-only mirror. It does not alter movement, teleport, hand tracking, XR reference spaces, or the stable WebXR dolly base.

## Files changed

- `game/private-scene.html`
- `game/modules/private_scene_runtime_phase162.js`
- `docs/PHASE-162-SCORPION-SEAT-TURN-INDICATORS-WATCH-REINTRO-LOCK.md`
- `update/version.json`

## Added

- Player active-seat indicator.
- Bot active-seat indicator.
- Dealer left-to-right indicator.
- Top turn banner.
- Display-only SVR watch HUD.
- Watch mirrors:
  - Street
  - Timer
  - Pot
  - Current turn
- Watch uses official `../logo.png`.

## Preserved

- Phase 161 table card/action layer.
- Phase 158 private scene runtime.
- Official logo branding.
- No music.
- No locomotion changes.
- No teleport changes.
- No XR reference-space mutation.

## Test URL

```text
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase162-watch-turn
```

## Next phase

Phase 163 should attach the watch into VR space carefully and mirror action buttons, without changing the teleport base.
