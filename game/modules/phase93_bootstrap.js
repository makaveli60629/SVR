import { installPhase93LobbyRepair } from "./phase93_lobby_repair.js";
import { textureExistingMoonMars, ensureNorthSkyMoonMars, tickTexturedMoonMars } from "./moon_mars_textured.js";

const PHASE97 = "PHASE-97-NORTH-SKY-MOON-MARS-VISIBLE-LOCK";

async function loadThree(){
  try{
    return await import("three");
  }catch(err){
    console.warn(`[${PHASE97}] three import failed`, err);
    return null;
  }
}

const THREE = await loadThree();

if (THREE?.WebGLRenderer && !THREE.WebGLRenderer.prototype.__phase97Patched){
  const originalRender = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.__phase97Patched = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    try{
      if (scene && !scene.userData?.phase93RepairApi){
        installPhase93LobbyRepair({ scene, world: null, log: console.log, selfTick: true });
      }
      if (scene && !scene.userData?.phase97NorthSkyPlanets){
        textureExistingMoonMars(scene);
        ensureNorthSkyMoonMars(scene);
        scene.userData.phase97NorthSkyPlanets = true;
      }
      if (scene) tickTexturedMoonMars(scene, 0.016);
      if (scene?.userData) scene.userData._camera = camera;
    }catch(err){
      console.warn(`[${PHASE97}] render hook repair failed`, err);
    }
    return originalRender.call(this, scene, camera);
  };
  console.log(`[${PHASE97}] render hook installed`);
}
