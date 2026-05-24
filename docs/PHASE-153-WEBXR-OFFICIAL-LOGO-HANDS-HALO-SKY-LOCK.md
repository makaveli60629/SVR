# PHASE-153-WEBXR-OFFICIAL-LOGO-HANDS-HALO-SKY-LOCK

## Purpose

Phase 153 fixes the Phase 152 feedback: always use the official ScarlettVR Poker brand logo, make the fist halo visible while purple fire is active, improve the glove/hand texture look, and make Moon/Mars more visible with texture support.

## Files changed

- `game/index.html`
- `game/modules/phase153_webxr_official_logo_hands_sky.js`
- `docs/PHASE-153-WEBXR-OFFICIAL-LOGO-HANDS-HALO-SKY-LOCK.md`
- `update/version.json`

## Brand rule

Always use the official SVR/ScarlettVR Poker logo from the project root:

```text
../logo.png
```

Only sponsor/partner/marketing areas may use another brand, and those must remain modular and removable.

## Fixes

- Official logo is now used for the wall brand panel.
- Official logo is now used for the teleport halo marker.
- Hand proxy now uses a procedural glove texture instead of plain spheres.
- Purple fire is smaller and does not hide the teleport halo.
- Fist mode forces a visible forward halo so the user can aim.
- Fist release still uses the proven WebXR dolly teleport method.
- Moon and Mars are enlarged, high in the sky, and use texture paths:
  - `./assets/texture/moon_diffuse.png`
  - `./assets/texture/mars/diffuse_1k.jpg`
- Purple star sky remains active.

## Preserved stable base

- Phase 151 heading movement fix.
- 45-degree snap turn.
- Forward/back movement with dolly yaw.
- Table center block.
- Right-controller fallback.
- No music.
- No watch yet.
- No world/root movement.
- No XR reference-space mutation.

## Test URL

```text
https://svrpoker.com/game/?v=phase153-official-logo-hands-sky
```

## Test order

1. Confirm Phase 153 loads.
2. Confirm official uploaded purple ScarlettVR Poker logo appears on wall.
3. Confirm teleport halo uses official logo.
4. Confirm Moon/Mars are visible high in the sky.
5. Confirm right-controller movement and snap-turn still work.
6. Enable hand tracking.
7. Make fist: purple fire and visible halo should both appear.
8. Open hand: teleport should commit.

## Next phase

If Phase 153 passes, Phase 154 should reintroduce lobby portals one by one on this base.
