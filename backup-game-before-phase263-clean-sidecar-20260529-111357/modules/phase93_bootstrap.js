import { installPhase93LobbyRepair } from "./phase93_lobby_repair.js";
import { textureExistingMoonMars, ensureNorthSkyMoonMars, tickTexturedMoonMars } from "./moon_mars_textured.js";

const PHASE98 = "PHASE-98-QUEST-STABILITY-WATCH-FIST-PERFORMANCE-LOCK";

async function loadThree(){
  try{ return await import("three"); }
  catch(err){ console.warn(`[${PHASE98}] three import failed`, err); return null; }
}

const THREE = await loadThree();

if (THREE?.WebGLRenderer && !THREE.WebGLRenderer.prototype.__phase98Patched){
  const originalRender = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.__phase98Patched = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    try{
      if (scene && !scene.userData?.phase93RepairApi){
        // selfTick false prevents a second repair loop. The render hook handles lightweight updates.
        installPhase93LobbyRepair({ scene, world: null, log: console.log, selfTick: false });
      }
      if (scene && !scene.userData?.phase97NorthSkyPlanets){
        textureExistingMoonMars(scene);
        ensureNorthSkyMoonMars(scene);
        scene.userData.phase97NorthSkyPlanets = true;
      }
      if (scene?.userData?.phase93RepairApi) scene.userData.phase93RepairApi.update(0.016);
      if (scene) tickTexturedMoonMars(scene, 0.016);
      if (scene?.userData) scene.userData._camera = camera;
    }catch(err){ console.warn(`[${PHASE98}] render hook repair failed`, err); }
    return originalRender.call(this, scene, camera);
  };
  console.log(`[${PHASE98}] render hook installed`);
}
