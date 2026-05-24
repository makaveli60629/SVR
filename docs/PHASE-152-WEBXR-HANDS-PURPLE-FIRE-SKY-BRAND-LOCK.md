# PHASE-152-WEBXR-HANDS-PURPLE-FIRE-SKY-BRAND-LOCK

## Purpose

Phase 152 adds the next requested visual layer after the Phase 151 locomotion base passed: visible hands, fist purple fire, purple SVR branding, Moon/Mars textures, and a purple star sky.

## Files changed

- `game/index.html`
- `game/modules/phase152_webxr_hands_sky_brand.js`
- `docs/PHASE-152-WEBXR-HANDS-PURPLE-FIRE-SKY-BRAND-LOCK.md`
- `update/version.json`

## Preserved from Phase 151

- WebXR dolly movement base.
- Right-controller movement and teleport fallback.
- 45-degree snap turn.
- Forward movement using dolly yaw heading.
- Table center blocked instead of magnet locked.
- No music.
- No watch yet.
- World/root is not moved.
- XR reference space is not mutated.

## Added

- Low-cost visible hand/joint proxy spheres.
- Warm purple glove-style hand material.
- Fist detection from tracked WebXR hand joints.
- Purple fire appears when a fist is detected.
- Fist opens/releases to commit teleport using the same dolly method.
- Procedural purple SVR brand logo on the north wall.
- Purple SVR logo used as teleport target logo.
- Purple star sky.
- Textured Moon using `./assets/texture/moon_diffuse.png`.
- Textured Mars using `./assets/texture/mars/diffuse_1k.jpg`.

## Important performance note

The uploaded glove/hand source assets are not loaded directly yet because they are large OBJ/STL source assets. Phase 152 uses removable low-cost proxy hands first so the stable locomotion base is not broken.

## Test URL

```text
https://svrpoker.com/game/?v=phase152-hands-sky-brand
```

## Test order

1. Confirm Phase 152 loads.
2. Confirm no music.
3. Confirm purple SVR logo appears on wall/teleport target.
4. Confirm Moon and Mars appear high in the sky.
5. Confirm right controller movement and 45-degree snap turn still work.
6. Show hands in Quest hand tracking.
7. Make fist: purple fire should appear.
8. Fist should show halo.
9. Open/release fist: should teleport using the same dolly method.

## Next phase

If Phase 152 passes, Phase 153 should reintroduce lobby portals one at a time on this working base.
