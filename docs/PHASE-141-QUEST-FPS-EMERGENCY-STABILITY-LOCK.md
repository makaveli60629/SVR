# PHASE-141-QUEST-FPS-EMERGENCY-STABILITY-LOCK

## Purpose

The user reported that the Quest build still freezes and is not usable. Phase 141 is an emergency performance phase focused on frame-rate measurement and hard Quest-safe renderer limits.

## Important note

The assistant cannot physically read live Quest headset telemetry from here. This phase adds in-game FPS/freeze instrumentation so the user can see the frame rate on screen and so `window.SVR_PHASE141_FPS_GUARD` records FPS, worst frame, and freeze count.

## Files changed

- `game/modules/core_scene.js`
- `game/modules/view_performance_manager.js`
- `game/modules/floor_texture_overlay.js`
- `game/modules/quest_fps_guard.js`
- `game/index.html`
- `docs/PHASE-141-QUEST-FPS-EMERGENCY-STABILITY-LOCK.md`
- `update/version.json`

## Emergency changes

- Lowered Quest renderer baseline to about 0.38 framebuffer/pixel scale.
- Added ultra-safe fallback down to about 0.32.
- Added panic fallback down to about 0.26 if freeze frames continue.
- Reduced camera far plane from thousands to 180 / 120 / 95 / 70 depending mode.
- Disabled fog in the performance manager.
- Reduced light intensity and removed shadows.
- Hid sprites in emergency performance mode.
- Reduced floor texture overlay from 1024 to 512.
- Disabled mipmap generation on the floor overlay.
- Added FPS/worst-frame overlay.
- Removed the stale Phase 131 clean-boot audit module from `game/index.html` load path for this performance test.

## Why

The live runtime still had several performance risks:

- The core/main runtime marker was stale at Phase 133.
- The camera far plane was very high in performance manager logic.
- The 1024 procedural floor overlay could add texture upload/memory pressure on Quest.
- The old audit module kept running extra DOM/audit work that is not needed for an FPS emergency test.

## Test URL

```text
https://svrpoker.com/game/?v=phase141-quest-fps
```

Hard refresh:

```text
Ctrl + F5
```

## Quest test checklist

1. Confirm the page shows `PHASE-141-QUEST-FPS-EMERGENCY-STABILITY-LOCK`.
2. Look for the FPS overlay near the top-left.
3. Record FPS and worst frame ms.
4. Test teleport without pressing every portal button.
5. If it still freezes, report:
   - FPS value
   - worst ms value
   - whether floor disappeared
   - whether it freezes before or after entering VR

## Next phase

If Phase 141 still freezes, Phase 142 must become a bare-minimum diagnostic scene with only floor, player movement, and teleport. No watch, no audio, no portals, no extra labels, no textured overlays.
