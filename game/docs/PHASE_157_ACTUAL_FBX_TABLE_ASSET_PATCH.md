# Phase 157 — Actual FBX Table Asset Patch

## Scope

Game-side only. Website/site files are not changed.

## Purpose

This patch supplies the actual uploaded `table.fbx` asset for the existing Phase 157 table loader.

## Why this patch exists

The earlier procedural Table 2 module created a green/blue blinking table and did not match the uploaded model. The runtime source now disables the blinking procedural table and expects the real asset at:

```text
game/assets/table.fbx
```

## Files included

```text
game/assets/table.fbx
game/docs/PHASE_157_ACTUAL_FBX_TABLE_ASSET_PATCH.md
```

## Expected runtime

Run in console:

```js
window.SVR_RUN_PHASE157_TABLE_AUDIT()
```

Expected:

```text
noBlink: true
actualFbxPreferred: true
fbxLoaded: true
```

## Protected

- Site untouched.
- Poker logic preserved.
- Dealer body remains disabled.
- Existing stools/seat guides preserved.
- Package remains small: uploaded `table.fbx` is about 583 KB.
