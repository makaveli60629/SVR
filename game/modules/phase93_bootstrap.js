import { installPhase93LobbyRepair } from "./phase93_lobby_repair.js";
import { textureExistingMoonMars, tickTexturedMoonMars } from "./moon_mars_textured.js";

const PHASE95 = "PHASE-95-TEXTURED-MOON-MARS-ALL-ROOMS-LOCK";

async function loadThree(){
  try{
    return await import("three");
  }catch(err){
    console.warn(`[${PHASE95}] three import failed`, err);
    return null;
  }
}

const THREE = await loadThree();

if (THREE?.WebGLRenderer && !THREE.WebGLRenderer.prototype.__phase95Patched){
  const originalRender = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.__phase95Patched = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    try{
      if (scene && !scene.userData?.phase93RepairApi){
        installPhase93LobbyRepair({ scene, world: null, log: console.log, selfTick: true });
      }
      if (scene && !scene.userData?.phase95TexturedPlanets){
        textureExistingMoonMars(scene);
        scene.userData.phase95TexturedPlanets = true;
      }
      if (scene) tickTexturedMoonMars(scene, 0.016);
      if (scene?.userData) scene.userData._camera = camera;
    }catch(err){
      console.warn(`[${PHASE95}] render hook repair failed`, err);
    }
    return originalRender.call(this, scene, camera);
  };
  console.log(`[${PHASE95}] render hook installed`);
}
