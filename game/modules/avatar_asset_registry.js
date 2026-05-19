// SVR Phase 126 — NPC Avatar Professional Polish Registry
// Game-side only. Site-side files must not import this module.

export const SVR_AVATAR_NPC_PHASE = "PHASE-126-NPC-AVATAR-PROFESSIONAL-POLISH-LOCK";

export const NPC_AVATAR_REGISTRY = Object.freeze({
  eric: {
    id: "eric",
    displayName: "Eric",
    status: "rigged_fbx_runtime_candidate",
    role: "male_npc_player_dealer_reference",
    fbx: "./assets/avatars/eric/eric.fbx",
    diffuse: "./assets/avatars/eric/textures/eric_dif_1k.jpg",
    normal: "./assets/avatars/eric/textures/eric_norm_1k.jpg",
    scale: 0.01,
    heightHint: 1.82,
    fallbackColor: 0x72a7ff
  },
  carla: {
    id: "carla",
    displayName: "Carla",
    status: "rigged_fbx_runtime_candidate",
    role: "female_npc_host_player",
    fbx: "./assets/avatars/carla/carla.fbx",
    diffuse: "./assets/avatars/carla/textures/carla_dif_1k.jpg",
    normal: "./assets/avatars/carla/textures/carla_norm_1k.jpg",
    scale: 0.01,
    heightHint: 1.72,
    fallbackColor: 0xff78d4
  },
  mei: {
    id: "mei",
    displayName: "Mei",
    status: "posed_static_fbx_candidate",
    role: "static_reiki_lounge_host_until_rerigged",
    fbx: "./assets/avatars/mei/mei.fbx",
    diffuse: "./assets/avatars/mei/textures/mei_dif_1k.jpg",
    normal: "./assets/avatars/mei/textures/mei_norm_1k.jpg",
    scale: 0.01,
    heightHint: 1.68,
    fallbackColor: 0xa0ffdf
  }
});

// Scene keys are intentionally generic so the same avatar module can be used in
// index.html, reiki.html, pga-drive.html/range.html, chip-putt.html,
// smoker-lounge.html, scorpion.html, and future private rooms.
export const NPC_SCENE_SPAWNS = Object.freeze([
  {
    id: "lobby-eric-patrol",
    avatar: "eric",
    scene: "lobby",
    mode: "walk_loop",
    label: "Eric NPC",
    path: [
      { x: -4.2, y: 0, z: 3.4 },
      { x: -2.6, y: 0, z: 1.8 },
      { x: -3.7, y: 0, z: -0.4 },
      { x: -5.0, y: 0, z: 1.5 }
    ],
    speed: 0.42,
    scaleBoost: 1.0
  },
  {
    id: "lobby-carla-host-patrol",
    avatar: "carla",
    scene: "lobby",
    mode: "walk_loop",
    label: "Carla Host",
    path: [
      { x: 4.4, y: 0, z: 3.0 },
      { x: 3.0, y: 0, z: 1.5 },
      { x: 4.8, y: 0, z: -0.2 },
      { x: 5.7, y: 0, z: 1.8 }
    ],
    speed: 0.36,
    scaleBoost: 1.0
  },
  {
    id: "poker-eric-seat-1",
    avatar: "eric",
    scene: "lobby",
    mode: "seated_poker",
    label: "Eric Bot",
    seatSlot: 1,
    scaleBoost: 0.94,
    idleStyle: "chip_reach"
  },
  {
    id: "poker-carla-seat-3",
    avatar: "carla",
    scene: "lobby",
    mode: "seated_poker",
    label: "Carla Bot",
    seatSlot: 3,
    scaleBoost: 0.92,
    idleStyle: "card_peek"
  },
  {
    id: "reiki-mei-guide",
    avatar: "mei",
    scene: "reiki",
    mode: "static_idle",
    label: "Mei Guide",
    position: { x: 0.0, y: 0, z: -5.8 },
    lookAt: { x: 0, y: 1.4, z: 0 },
    scaleBoost: 0.98,
    idleStyle: "calm_breath"
  },
  {
    id: "range-eric-coach",
    avatar: "eric",
    scene: "pga-drive",
    mode: "static_idle",
    label: "Range Coach",
    position: { x: -2.4, y: 0, z: -1.2 },
    lookAt: { x: 0, y: 1.2, z: -6.0 },
    scaleBoost: 0.96,
    idleStyle: "coach_point"
  },
  {
    id: "chipputt-carla-coach",
    avatar: "carla",
    scene: "chip-putt",
    mode: "static_idle",
    label: "Short Game Coach",
    position: { x: 2.2, y: 0, z: -1.0 },
    lookAt: { x: 0, y: 1.2, z: -4.0 },
    scaleBoost: 0.94,
    idleStyle: "coach_point"
  },
  {
    id: "lounge-carla-social",
    avatar: "carla",
    scene: "smoker-lounge",
    mode: "walk_loop",
    label: "Lounge Host",
    path: [
      { x: -2.8, y: 0, z: 1.8 },
      { x: -1.2, y: 0, z: -0.8 },
      { x: 1.6, y: 0, z: -0.6 },
      { x: 2.8, y: 0, z: 1.4 }
    ],
    speed: 0.28,
    scaleBoost: 0.94
  },
  {
    id: "scorpion-eric-security",
    avatar: "eric",
    scene: "scorpion",
    mode: "static_idle",
    label: "Scorpion Host",
    position: { x: -3.0, y: 0, z: 0.8 },
    lookAt: { x: 0, y: 1.3, z: 0 },
    scaleBoost: 0.96,
    idleStyle: "card_peek"
  },
  {
    id: "store-mei-display",
    avatar: "mei",
    scene: "store-room",
    mode: "static_idle",
    label: "Avatar Display",
    position: { x: 1.8, y: 0, z: -2.2 },
    lookAt: { x: 0, y: 1.3, z: 0 },
    scaleBoost: 0.95,
    idleStyle: "calm_breath"
  }
]);

export const NPC_SCENE_ALIASES = Object.freeze({
  "index": "lobby",
  "game": "lobby",
  "reiki": "reiki",
  "range": "pga-drive",
  "pga-drive": "pga-drive",
  "chip-putt": "chip-putt",
  "store-room": "store-room",
  "smoker-lounge": "smoker-lounge",
  "scorpion": "scorpion"
});

export const SCIFI_DOWNTOWN_RUNTIME_NOTE = Object.freeze({
  sourceZip: "whsjqj04ge-ScifiDowntowncity.zip",
  runtimeStatus: "source_only_not_loaded_by_default",
  reason: "The full OBJ is a private-scene background candidate and must be optimized before live loading.",
  intendedScenes: ["scorpion_city_overlook", "future_sci_fi_private_scene"],
  phase85Lock: "Do not load the raw OBJ in lobby runtime. Use only preview cards or optimized future GLB."
});
