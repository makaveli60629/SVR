// PHASE-84S-STRATEGIC-AD-SKYLINE-SCENE-ROUTING-LOCK
// Runtime ad skyline lives in world_skyline.js addAlwaysVisibleEspressoAd().
// Strategic ad design: a few dedicated, front-facing Times Square/Shibuya/HK-inspired ad buildings.
export const BUILDING_AD_GRID_LOCK = {
  build: "PHASE-84S-STRATEGIC-AD-SKYLINE-SCENE-ROUTING-LOCK",
  siteTouched: false,
  approvalLock: "No unapproved Reiki sponsor/founder branding. Reiki remains SVR / AWAITING APPROVAL only.",
  strategy: "Premium ad skyline restored to a clean city look: Espresso placed beside the store/sponsor wall, front-facing tiered ad buildings, small tier-3 ribbons only in gap buildings, normal skyline behind ads.",
  slots: [
    "NE_STORE_SPONSOR_TIER1_ESPRESSO",
    "NE_STORE_SPONSOR_TIER2_SPONSOR",
    "NORTH_TIER2_ALL_IN",
    "EAST_TIER2_WIN_CASH",
    "SOUTH_SVR_PROMO",
    "WEST_PROMO",
    "TIER3_SMALL_RIBBON_GAP_BUILDINGS"
  ],
  privateScenes: [
    "game/pga-drive.html",
    "game/chip-putt.html",
    "game/reiki.html",
    "game/store-room.html",
    "game/smoker-lounge.html",
    "game/scorpion.html"
  ]
};
