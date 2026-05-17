// Phase 85 optional helper for private scene files.
// Use from a private scene module after its THREE scene exists:
//   import { attachNpcAvatarsToScene } from "./modules/npc_scene_attach.js";
//   const npc = attachNpcAvatarsToScene({ scene, sceneKey: "reiki", renderer, log });

import { createNpcAvatarSystem } from "./npc_avatar_system.js";

export function attachNpcAvatarsToScene({ scene, sceneKey, seats = [], tableCenter = { x: 0, y: 0, z: 0 }, log } = {}){
  if (!scene) return null;
  return createNpcAvatarSystem({ scene, seats, tableCenter, currentScene: sceneKey, log });
}

export function exposeNpcSceneAttach(){
  if (typeof window !== "undefined") window.SVR_ATTACH_NPC_AVATARS = attachNpcAvatarsToScene;
}

exposeNpcSceneAttach();
