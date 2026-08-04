# Phase 342 — Adaptive Performance and Asset Pipeline Lock

## Build
`PHASE-342-ADAPTIVE-PERFORMANCE-ASSET-PIPELINE-LOCK`

## Runtime budgets

| Platform | Target FPS | Start ratio | Minimum | Maximum | Draw calls | Triangles |
|---|---:|---:|---:|---:|---:|---:|
| Android | 45 | 0.92 | 0.68 | 1.05 | 260 | 360,000 |
| Quest | 72 | 0.92 | 0.72 | 1.15 | 230 | 320,000 |
| Desktop | 60 | 1.25 | 1.00 | 1.75 | 560 | 950,000 |
| Camera 3 | 30 | 0.82 | 0.65 | 1.00 | 150 | 200,000 |

Quality changes require sustained pressure. A single slow frame does not lower resolution. Healthy windows can gradually restore quality.

## Runtime optimization
- Frustum culling is enabled for meshes.
- Shadows are disabled on Android, Quest, and Camera 3.
- Diagnostic and helper geometry is suppressed.
- Mobile/Quest material precision is set to `mediump` where supported.
- Texture anisotropy is capped by platform.
- Texture uploads and shader programs are prewarmed.
- Quest framebuffer scale is set before XR presentation and foveation is maximized.
- Monitoring pauses when the document is hidden.

## Asset pipeline
- `game/tools/phase342_asset_audit.mjs` inventories models, textures, audio, binary duplicates, and largest files.
- `.github/workflows/phase342-performance-audit.yml` runs after merges to `main` and uploads the current audit.
- `.github/workflows/phase342-asset-pipeline.yml` is a manual conversion workflow for GLB/glTF assets.
- Existing GLB/glTF files are optimized with Meshopt and WebP output.
- FBX/OBJ/DAE files are recorded in the conversion queue for source-authoring conversion.

## Manual update policy
- Automatic update banners are disabled.
- Background checks may record that a deployment exists, but cannot show a prompt.
- The panel opens only through `window.SVR_CHECK_FOR_APP_UPDATE()`.
- APK remains `0.1.0-rc1`, version code `1`.

## Runtime QA
```js
window.SVR_PHASE342_AUDIT()
window.SVR_PHASE342_SET_QUALITY('low')
window.SVR_PHASE342_SET_QUALITY('balanced')
window.SVR_PHASE342_SET_QUALITY('high')
window.SVR_PHASE342_REPREWARM()
window.SVR_ASSET_LOAD_METRICS
window.SVR_CHECK_FOR_APP_UPDATE()
```

## Protected scope
- The uploaded FBX table remains the table authority.
- Phase 341 remains the card and table-coordinate authority.
- Phase 336 remains the poker ledger authority.
- No forced APK update is introduced.
- No claim of completed server-authoritative multiplayer.
