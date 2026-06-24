# Phase 158 — Actual FBX Table Scale + Orientation Lock

## Scope

Targeted game and site patch.

## Game fixes

- Removed the blinking green/blue procedural table fallback.
- Removed the duplicate geometric table surfaces.
- Kept the uploaded actual `game/assets/table.fbx` as the preferred table asset.
- Scaled the FBX table against the stool ring instead of using a hard-coded oversized scale.
- Added auto-orientation logic:
  - if the FBX imports upright like a wall, rotate it flat
  - if the long axis imports front/back, rotate it to align with the table/stool footprint
- Preserved stool guides as the sizing reference.
- Preserved poker logic and previous Quest/input locks.

## Site fixes

- Removed the floating top-right `Download App` button that was overlaying Reiki/sponsor content.
- Preserved the normal in-page/nav app button.
- Did not change the public Matrix launch page.

## Runtime QA

Open the game and run:

```js
window.SVR_RUN_PHASE158_TABLE_AUDIT()
```

Expected:

```text
actualFbxPreferred: true
actualFbxLoaded: true
geometricFallbackTablesRemoved: true
noBlink: true
stoolsPreserved: true
siteTouched: false
```

## Test URL

```text
https://svrpoker.com/game/?v=phase158-table-scale
```

## Protected

- Do not re-enable Phase 156 procedural texture table.
- Do not re-enable Phase 157 stable geometric fallback table.
- Do not resize the table without checking against stool ring radius.
- Do not touch backend or public root page.
