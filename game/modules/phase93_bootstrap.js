import { installPhase93LobbyRepair } from "./phase93_lobby_repair.js";

const PHASE93 = "PHASE-93-LOBBY-FLOOR-TABLE-LOCOMOTION-SKY-LOCK";

async function loadThree(){
  try{
    return await import("three");
  }catch(err){
    console.warn(`[${PHASE93}] three import failed`, err);
    return null;
  }
}

const THREE = await loadThree();

if (THREE?.WebGLRenderer && !THREE.WebGLRenderer.prototype.__phase93Patched){
  const originalRender = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.__phase93Patched = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    try{
      if (scene && !scene.userData?.phase93RepairApi){
        installPhase93LobbyRepair({ scene, world: null, log: console.log, selfTick: true });
      }
      if (scene?.userData) scene.userData._camera = camera;
    }catch(err){
      console.warn(`[${PHASE93}] render hook repair failed`, err);
    }
    return originalRender.call(this, scene, camera);
  };
  console.log(`[${PHASE93}] render hook installed`);
}
