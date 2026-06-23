# Phase 156 — Table 2 + Stool Texture Asset Lock

## Scope

Game-side only. Website/site files are not changed.

## Uploaded source

User uploaded:

```text
table2.zip
```

Archive contents included:

```text
Table 2/poker table.jpg
Table 2/stool.fbx
Table 2/table 2.max
Table 2/_maps_and_proxies/*.jpg
```

## Runtime decision

The uploaded archive is about 38 MB and includes:

- `stool.fbx` at about 17.86 MB
- `table 2.max` at about 12.28 MB
- many high-resolution JPG texture maps

The raw `.max` file cannot be used directly in the browser WebXR runtime. The raw FBX and full texture set would also risk breaking the permanent 25 MB deploy rule.

## What was added

Added:

```text
game/phase156_table2_stool_texture_lock.js
```

The module recreates the uploaded Table 2 look as a Quest-safe runtime table using lightweight Three.js geometry and compressed embedded texture materials derived from the uploaded texture set:

- blue/dark felt top from uploaded velvet texture material
- leather outer rail from uploaded leather texture material
- black cushion/stool seat material from uploaded fabric texture material
- wood table/stool legs from uploaded wood texture material
- gold pass line
- center SVR glow
- six stool visuals, including highlighted south/front open-player stool

## Protected

- Dealer body remains disabled/invisible.
- Poker logic is preserved.
- One south/front player seat remains open.
- Phase 155 lobby barrier/perimeter safety remains loaded.
- Phase 142 poker core remains loaded.
- Website/site untouched.
- Raw `.fbx` and `.max` were not copied to deployment.

## Runtime globals

```js
window.SVR_PHASE156_TABLE2_STOOL_TEXTURE_LOCK
window.SVR_RUN_PHASE156_TABLE2_AUDIT()
```

Expected audit:

```text
tableAdded: true
stoolVisualsAdded: 6
rawFbxCopied: false
rawMaxCopied: false
siteTouched: false
```

## Test URL

```text
https://svrpoker.com/game/?v=phase156-table2-stool-texture
```

## Notes

This phase intentionally favors a runtime-safe optimized table/stool implementation over adding raw DCC assets. A later offline conversion pass can convert `stool.fbx` and `table 2.max` into optimized `.glb` if a trusted converter is used and the final package remains under 25 MB.
