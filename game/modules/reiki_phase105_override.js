const BUILD = "PHASE-108-REIKI-BLACK-WALL-REMOVED-LOCK";

export function applyReikiPhase105Override(scene, { log = console.log } = {}) {
  if (!scene) return null;

  [
    "SVR_PHASE105_OUTWARD_FINAL_LOCK",
    "SVR_PHASE104_REIKI_EXPANDED_HOLOGRAM_RED_CARPET_LOCK",
    "SVR_PHASE103_REIKI_EXPANDED_GLASS_STOREFRONT_LOCK",
    "SVR_PHASE102_REIKI_FLUSH_GLASS_STOREFRONT_LOCK",
    "SVR_UPDATE3_REIKI_ALIGNED_GLASS_PLANTS_PLANETS_LOCK",
    "SVR_UPDATE3_REIKI_PREMIUM_INWARD_RAIL_GLASS_AUDIO_LOCK",
    "SVR_UPDATE3_REIKI_EXPANDED_GLASS_WALL_RED_CARPET_ROPE_LOCK"
  ].forEach((name) => {
    const object = scene.getObjectByName(name);
    if (object && object.parent) object.parent.remove(object);
  });

  scene.userData.SVR_PHASE108_BLACK_WALL_REMOVED = BUILD;
  window.SVR_PHASE108_BLACK_WALL_REMOVED = BUILD;
  log?.("Phase 108 active: old Reiki black-wall overlay removed. Current visible glass storefront comes from reiki_storefront_3_0.js.");
  return { build: BUILD };
}
