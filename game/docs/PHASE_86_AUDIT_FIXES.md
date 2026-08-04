# Phase 86 Audit + Fix Lock

## Fixed in this package
- Watch display now renders with dedicated front and back screen planes so the text is readable instead of mirrored.
- Pinch teleport now uses safer reference-space application with rollback on failure.
- Pinch teleport now requires a steadier target and a slightly longer hold before release.
- South wall info boards were refreshed with clearer community / tournament / sponsor messaging.
- Moon and Mars glow was reduced so surface textures read more clearly.
- Moon scale increased.
- Mars pushed farther back from the moon path.

## Audit notes
- The uploaded package still does **not** contain MP3 files in `game/assets/audio/`, so exact local asset-folder music could not be embedded from this workspace.
- Existing radio code can still use packaged audio, but the requested local MP3 files were not present in the uploaded zip.
- Rebuilt package kept the existing watch frame placement and boot path.

## Locked baseline after this pass
- Keep current watch frame placement.
- Keep boot-safe lobby baseline.
- Keep the restored Reiki hub and south wall board path as the working lobby baseline.
