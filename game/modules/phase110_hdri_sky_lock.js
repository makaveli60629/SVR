import * as THREE from "three";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

// PHASE-110-HDRI-NIGHT-SKY-LOBBY-LOCK
// Uses the uploaded asset backup ZIP already in the repo:
// /assets/assets backup/nightSkyHDRI008_2K.zip
// Extracts NightSkyHDRI008_2K_TONEMAPPED.jpg and applies it as the lobby sky.

const PHASE = "PHASE-110-HDRI-NIGHT-SKY-LOBBY-LOCK";
const ZIP_URLS = [
  "../assets/assets%20backup/nightSkyHDRI008_2K.zip?v=phase110-hdri-sky",
  "/assets/assets%20backup/nightSkyHDRI008_2K.zip?v=phase110-hdri-sky"
];
const JPG_NAME = "NightSkyHDRI008_2K_TONEMAPPED.jpg";
const PNG_NAME = "NightSkyHDRI008.png";
const scenes = new Set();
let built = false;
let texturePromise = null;

async function loadZipArrayBuffer(){
  let lastError = null;
  for (const url of ZIP_URLS){
    try{
      const res = await fetch(url, { cache:"force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.arrayBuffer();
    }catch(err){
      lastError = err;
    }
  }
  throw lastError || new Error("Night sky zip not found");
}

async function loadHdriSkyTexture(){
  if (texturePromise) return texturePromise;
  texturePromise = (async()=>{
    const buffer = await loadZipArrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const file = zip.file(JPG_NAME) || zip.file(PNG_NAME);
    if (!file) throw new Error(`Missing ${JPG_NAME} in night sky ZIP`);
    const blob = await file.async("blob");
    const url = URL.createObjectURL(blob);
    const texture = await new Promise((resolve, reject)=>{
      new THREE.TextureLoader().load(url, resolve, undefined, reject);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return { texture, objectUrl:url };
  })();
  return texturePromise;
}

function removeOldSkyObjects(scene){
  const kill = [];
  scene.traverse((obj)=>{
    const name = String(obj.name || "").toUpperCase();
    if (name.includes("SKY") || name.includes("MOON") || name.includes("MARS")){
      if (!name.includes("PHASE110")) kill.push(obj);
    }
  });
  for (const obj of kill){
    if (obj.parent){
      obj.parent.remove(obj);
      obj.geometry?.dispose?.();
      if (Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose?.());
      else obj.material?.dispose?.();
    }
  }
}

async function applySky(scene){
  if (!scene || scene.userData.phase110HdriSkyApplied) return;
  scene.userData.phase110HdriSkyApplied = true;
  try{
    const { texture } = await loadHdriSkyTexture();
    removeOldSkyObjects(scene);
    scene.background = texture;
    scene.environment = texture;

    // Add a large inside-out sky dome so desktop and WebXR both show the replacement sky.
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1200, 48, 24),
      new THREE.MeshBasicMaterial({ map:texture, side:THREE.BackSide, depthWrite:false, depthTest:false, fog:false, toneMapped:false })
    );
    dome.name = "PHASE110_HDRI_NIGHT_SKY_DOME_LOCK";
    dome.frustumCulled = false;
    dome.renderOrder = -999;
    scene.add(dome);

    window.SVR_HDRI_SKY_LOCK = {
      phase: PHASE,
      applied: true,
      sourceZip: "assets/assets backup/nightSkyHDRI008_2K.zip",
      texture: JPG_NAME,
      removedOldSky: true,
      at: new Date().toISOString()
    };
    console.log(`[SVR] ${PHASE} applied`, window.SVR_HDRI_SKY_LOCK);
  }catch(error){
    scene.userData.phase110HdriSkyApplied = false;
    window.SVR_HDRI_SKY_LOCK = { phase: PHASE, applied:false, error:error?.message || String(error), at:new Date().toISOString() };
    console.warn(`[SVR] ${PHASE} failed`, error);
  }
}

function scan(){
  for (const scene of scenes){
    if (!built && scene.children?.length > 8){ built = true; applySky(scene); }
  }
  if (!built) setTimeout(()=>requestAnimationFrame(scan), 250);
}

const originalAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function phase110SceneAdd(...objects){
  scenes.add(this);
  return originalAdd.apply(this, objects);
};

requestAnimationFrame(scan);
console.log(`[SVR] ${PHASE} loaded`);
