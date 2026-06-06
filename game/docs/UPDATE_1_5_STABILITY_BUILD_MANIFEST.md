# SVR Poker — Update 1.5 Stability Build Manifest

## Build label
`UPDATE-1.5-STABILITY-BUILD`

## Scope
Game-side only. Public website/site files are not changed in this package.

## Corrected from wrong phase labels
This package supersedes the accidental Phase 84 runtime label and realigns the game runtime with Update 1.5.

## Runtime improvements
- Moon is larger, higher, textured, glowing, rotating, and above the skyline.
- Mars is slightly larger, higher, textured, glowing, rotating, and orbits the Moon.
- Legacy/duplicate geometry-only planet presentation remains disabled.
- More stars and constellation clusters are retained and slightly strengthened.
- Quest controller right-stick movement remains camera/head-forward based.
- Quest controller snap turn remains on right-stick X.
- Grip/squeeze aims teleport with SVR logo marker.
- Trigger commits teleport when aimed.
- A/B action laser protocol is retained from the controller module.
- Android and desktop behavior are not edited.
- Reiki storefront keeps approval-safe labels and fuller procedural plant/bush/hanging greenery polish.
- If shipped bot FBX fails to load, procedural seated avatar fallback keeps the table modelized instead of empty.

## Uploaded asset audit
The user supplied several source assets:
- `Rigged_Human_Male_3963076[1].zip` contains a rigged male FBX and BLEND source.
- `Character_animation.zip` contains a Maya animation scene.
- `Collection plant vol 297cg.rar` is a plant source archive.
- `3exbaw.zip` contains a large plant BLEND source.

These are useful as source/staging assets, but they are not shipped raw in this runtime ZIP because the game package must stay under 25 MB and browser runtime needs web-optimized GLB/texture assets. This build uses procedural/modelized fallback geometry and existing lightweight runtime assets while preserving the asset direction for later optimized GLB conversion.

## Next recommended asset step
Convert the rigged male and plant sources into optimized GLB assets outside the browser package, then add only compressed runtime-safe GLBs/textures into a later zip.
