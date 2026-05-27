# PHASE 264 — Model Asset Restore and Path Lock

## Problem
Phase 263 proved the lobby can render with procedural fallbacks, but runtime logs still showed missing optional model paths:
- assets/models/legend_character.glb
- assets/models/legend_animated.glb
- assets/models/riki/plant/indoor_plant.obj
- assets/models/table.glb
- assets/models/sitting_pose.fbx

## Fix
Added:
- game/modules/phase264_model_asset_registry.js

This registry:
- identifies missing optional models
- keeps fallback-first mode active
- exposes window.SVR_MODEL_ASSET_REGISTRY
- exposes window.SVR_SHOULD_SKIP_MODEL_ASSET(path)
- disables known missing model references found in JS modules

## Locked Policy
Optional GLB/OBJ/FBX models must not block lobby render.
If a model is missing, use procedural fallback.
Only restore model paths after the actual optimized file exists in /game/assets/models/.

## Preserved
- Site untouched.
- Phase 263 procedural fallback table/legend/plant/seated placeholder.
- Store kiosk.
- Routes.
- Runtime shield safe loader.
- Interaction repair.

## Next Phase
PHASE-265-QUEST-MOVEMENT-TELEPORT-HARDENING-LOCK
