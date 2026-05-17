// SVR Phase 84 — Avatar NPC Rig Intake Registry
// Game-side only. Site-side files must not import this module.

export const SVR_AVATAR_NPC_PHASE = "PHASE-84-AVATAR-NPC-RIG-INTAKE-LOCK";

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

export const NPC_SCENE_SPAWNS = Object.freeze([
  {
    id: "lobby-eric-walker",
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
    id: "lobby-carla-host",
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
    id: "reiki-mei-static",
    avatar: "mei",
    scene: "reiki",
    mode: "static_idle",
    label: "Mei Placeholder",
    position: { x: 0.0, y: 0, z: -5.8 },
    lookAt: { x: 0, y: 1.4, z: 0 },
    scaleBoost: 0.98
  }
]);

export const SCIFI_DOWNTOWN_RUNTIME_NOTE = Object.freeze({
  sourceZip: "whsjqj04ge-ScifiDowntowncity.zip",
  runtimeStatus: "source_only_not_loaded_by_default",
  reason: "The full OBJ is a private-scene background candidate and should be optimized before shipping live.",
  intendedScenes: ["scorpion_city_overlook", "future_sci_fi_private_scene"]
});
