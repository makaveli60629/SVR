# PHASE-145-GRAPHICS-CONTRAST-NO-MUSIC-TELEPORT-ALIGNMENT-LOCK

## Purpose

The user reported that the Quest build looked grainy/blurry, needed more contrast and original-style lobby/wall visual clarity, music needed to be completely removed, and teleport alignment was behind the player. The user also reported freezing on grip release.

## Files changed

- `game/modules/audio.js`
- `game/modules/core_scene.js`
- `game/modules/quest_fps_guard.js`
- `game/modules/floor_texture_overlay.js`
- `game/modules/teleport.js`
- `game/index.html`
- `docs/PHASE-145-GRAPHICS-CONTRAST-NO-MUSIC-TELEPORT-ALIGNMENT-LOCK.md`
- `update/version.json`

## Graphics clarity changes

- Increased Quest renderer baseline from emergency low-resolution mode to a clearer 0.58 scale.
- Reduced foveation from harsh emergency mode to 0.45 for better center/edge clarity.
- Re-enabled antialiasing.
- Switched tone mapping to no tone mapping for stronger direct contrast.
- Updated UI/HUD contrast to gold/black high-contrast styling.
- Replaced noisy/grainy floor overlay with a sharper high-contrast 1024 texture.
- Kept the scene performance guard, but it now preserves visuals unless freezes are severe.

## Music removal

- `game/modules/audio.js` now creates no audio element.
- Music start/toggle/prime/next methods are no-op disabled functions.
- Runtime global: `window.SVR_AUDIO_LOCK.disabled = true`.

## Teleport alignment changes

- The right-controller aim direction now auto-tests controller forward and reverse direction.
- The selected aim direction is the one that best points in the camera/player forward direction, preventing the floor target from appearing behind the player.
- Teleport marker remains a high-contrast generated SVR TELEPORT logo.

## Grip freeze change

- Grip no longer commits teleport.
- Grip is preview-only.
- Trigger release is the only teleport commit path for this phase.
- Teleport commit waits 120ms and then one animation frame before shifting the world root.

## Test URL

```text
https://svrpoker.com/game/?v=phase145-graphics-no-music-align
```

Hard refresh:

```text
Ctrl + F5
```

## Quest test order

1. Confirm build marker shows Phase 145.
2. Confirm music does not start.
3. Confirm graphics are sharper and less grainy.
4. Confirm teleport logo appears in front, not behind.
5. Hold grip: preview only, release should cancel without teleporting.
6. Hold trigger: show target; release trigger should teleport.
7. Report FPS/worst frame if freeze continues.

## Next if teleport still freezes

`PHASE-146-BARE-RIGHT-CONTROLLER-TRIGGER-ONLY-TELEPORT-DIAGNOSTIC-LOCK`.

That phase must remove lobby, watch, portals, texture floor, Moon/Mars, and all optional visuals to isolate the teleport movement itself.
