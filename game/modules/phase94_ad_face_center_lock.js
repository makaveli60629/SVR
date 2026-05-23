import * as THREE from "three";

// PHASE-94-AD-FACE-CENTER-LOCK
// Keeps building/wall ad planes mounted on the wall while making the readable/front side face the lobby center.
// This prevents Espresso / sponsor words from facing into the wall or reading backward from the player view.

const PHASE = "PHASE-94-AD-FACE-CENTER-LOCK";
const scenes = new Set();
const CENTER = new THREE.Vector3(0, 0, 0);
const WORLD_POS = new THREE.Vector3();
const CENTER_DIR = new THREE.Vector3();
const FRONT_DIR = new THREE.Vector3();
const patched = { sceneAdd: false };

function nameOf(obj){
  return String(obj?.name || "").toLowerCase();
}

function mapHint(obj){
  const data = obj?.material?.map?.source?.data;
  return String(data?.dataset?.name || data?.src || data?.currentSrc || data?.href || "").toLowerCase();
}

function isAdSurface(obj){
  if (!obj?.isMesh || !obj.geometry?.parameters || !obj.material?.map) return false;
  const p = obj.geometry.parameters;
  const w = Number(p.width || 0);
  const h = Number(p.height || 0);
  if (!w || !h) return false;
  const label = `${nameOf(obj)} ${mapHint(obj)}`;
  const namedAd = /espresso|sponsor|billboard|ad|poster|store|banner|phase91/.test(label);
  const likelyTallBuildingAd = obj.position.y > 6.5 && h >= 4.0 && w >= 1.5;
  const likelyLobbyWallAd = obj.position.y > 1.2 && w >= 2.0 && h >= .7 && /wall|building|lobby|espresso|sponsor|billboard|ad|banner/.test(label);
  return namedAd || likelyTallBuildingAd || likelyLobbyWallAd;
}

function makeFrontFaceCenter(obj){
  if (!isAdSurface(obj)) return;

  obj.getWorldPosition(WORLD_POS);
  CENTER_DIR.set(-WORLD_POS.x, 0, -WORLD_POS.z);
  if (CENTER_DIR.lengthSq() < 0.001) return;
  CENTER_DIR.normalize();

  // Keep only the yaw orientation so the panel remains vertically mounted to the wall/building.
  obj.rotation.x = 0;
  obj.rotation.z = 0;
  obj.rotation.y = Math.atan2(CENTER_DIR.x, CENTER_DIR.z);

  // Confirm the PlaneGeometry front normal (+Z) is pointed toward the lobby center.
  obj.updateMatrixWorld(true);
  FRONT_DIR.set(0, 0, 1).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion())).normalize();
  if (FRONT_DIR.dot(CENTER_DIR) < 0){
    obj.rotation.y += Math.PI;
    obj.updateMatrixWorld(true);
  }

  // Move the panel a hair toward the center so it sits on top of the wall and does not flicker inside it.
  obj.position.x += CENTER_DIR.x * 0.018;
  obj.position.z += CENTER_DIR.z * 0.018;

  if (obj.material){
    obj.material.side = THREE.FrontSide;
    obj.material.depthWrite = true;
    obj.material.depthTest = true;
    obj.material.needsUpdate = true;
  }
  if (obj.material?.map){
    obj.material.map.flipY = true;
    obj.material.map.wrapS = THREE.ClampToEdgeWrapping;
    obj.material.map.wrapT = THREE.ClampToEdgeWrapping;
    obj.material.map.repeat.set(1, 1);
    obj.material.map.offset.set(0, 0);
    obj.material.map.needsUpdate = true;
  }
  obj.renderOrder = Math.max(obj.renderOrder || 0, 48);
  obj.userData.phase94FaceCenter = true;
}

function patchScene(scene){
  if (!scene) return;
  scene.traverse((obj)=>{
    if (!obj.userData?.phase94FaceCenter) makeFrontFaceCenter(obj);
  });
  window.SVR_PHASE94_AD_FACE_CENTER = {
    phase: PHASE,
    status: "wall-mounted ads readable from lobby center",
    textureSide: "front-side-to-player"
  };
}

function tick(){
  for (const scene of scenes) patchScene(scene);
  requestAnimationFrame(tick);
}

if (!patched.sceneAdd){
  patched.sceneAdd = true;
  const originalAdd = THREE.Scene.prototype.add;
  THREE.Scene.prototype.add = function phase94SceneAdd(...objects){
    scenes.add(this);
    return originalAdd.apply(this, objects);
  };
}

requestAnimationFrame(tick);
console.log(`[SVR] ${PHASE} loaded`);
