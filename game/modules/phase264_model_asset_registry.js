/*
 * SVR Phase 264 — Model Asset Restore and Path Lock
 * Central asset registry so missing optional models do not keep breaking/blanking the lobby.
 */
const BUILD = "PHASE-270-ASSET-PATH-LOADER-SMOOTH-LOCK";

export const SVR_MODEL_ASSET_REGISTRY = {
  build: BUILD,
  mode: "fallback-first",
  siteTouched: false,

  missingOptionalModels: [
    "DISABLED_PHASE264_MISSING_ASSET/assets/models/legend_character.glb",
    "DISABLED_PHASE264_MISSING_ASSET/assets/models/legend_animated.glb",
    "DISABLED_PHASE264_MISSING_ASSET/assets/models/riki/plant/indoor_plant.obj",
    "DISABLED_PHASE264_MISSING_ASSET/assets/models/table.glb",
    "DISABLED_PHASE264_MISSING_ASSET/assets/models/sitting_pose.fbx"
  ],

  fallbackPolicy: {
    table: "use phase263 procedural poker table",
    legend: "use phase263 procedural legend placeholder",
    plant: "use phase263 procedural plant placeholder",
    sittingPose: "use phase263 procedural seated placeholder"
  },

  disabledUntilPresent: {
    legend_character_glb: true,
    legend_animated_glb: true,
    indoor_plant_obj: true,
    table_glb: true,
    sitting_pose_fbx: true
  }
};

export function shouldSkipModelAsset(urlOrPath){
  const path = String(urlOrPath || "").replace(/^\.?\//, "");
  return SVR_MODEL_ASSET_REGISTRY.missingOptionalModels.some(missing => path.includes(missing));
}

export function registerModelAssetLock(){
  window.SVR_MODEL_ASSET_REGISTRY = SVR_MODEL_ASSET_REGISTRY;
  window.SVR_SHOULD_SKIP_MODEL_ASSET = shouldSkipModelAsset;

  try {
    window.dispatchEvent(new CustomEvent("svr_model_asset_registry_ready", {
      detail: SVR_MODEL_ASSET_REGISTRY
    }));
  } catch(_) {}

  return SVR_MODEL_ASSET_REGISTRY;
}










