import * as THREE from "three";

const PHASE96 = "PHASE-96-QUEST-FLOOR-HAND-TELEPORT-HOTFIX";
let installedForScene = new WeakSet();

function isMesh(obj){ return !!obj?.isMesh && !!obj.geometry; }
function isSprite(obj){ return !!obj?.isSprite; }
function isPointLight(obj){ return !!obj?.isPointLight; }

function boxInfo(obj){
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

function setMatFlag(mat, fn){
  if (Array.isArray(mat)) mat.forEach(fn);
  else if (mat) fn(mat);
}

function isProtectedFloorObject(obj){
  const n = String(obj.name || "").toLowerCase();
  if (/portal|gate|ring|pointer|teleport|marker|stand here|stance|ball/.test(n)) return true;
  let p = obj.parent;
  while (p){
    const pn = String(p.name || "").toLowerCase();
    if (/portal|gate|teleport|pga|reiki|scorpion|store|lounge/.test(pn)) return true;
    if (p.userData?.portalKey) return true;
    p = p.parent;
  }
  return !!obj.userData?.portalKey;
}

function stabilizeFloorOverlays(scene){
  let floorOverlayIndex = 0;
  scene.traverse((obj)=>{
    if (!isMesh(obj)) return;
    const { size, center } = boxInfo(obj);
    if (center.y > 0.060 || size.x < 0.30 || size.z < 0.30 || size.y > 0.09) return;
    if (isProtectedFloorObject(obj)) return;
    const material = obj.material;
    const transparent = Array.isArray(material) ? material.some(m=>m?.transparent || m?.opacity < 0.96) : !!(material?.transparent || material?.opacity < 0.96);
    const floorLike = /CircleGeometry|PlaneGeometry|ShapeGeometry|RingGeometry/.test(String(obj.geometry?.type || "")) || transparent;
    if (!floorLike) return;

    // Quest-safe: large low transparent floor glows z-fight badly. Disable those entirely.
    const largeBlinkRisk = transparent && size.x > 1.35 && size.z > 1.35 && center.y < 0.035;
    const duplicateLogoOrGlow = transparent && size.x > 2.2 && size.z > 1.6;
    if (largeBlinkRisk || duplicateLogoOrGlow){
      obj.visible = false;
      obj.userData.phase96FloorHidden = true;
      return;
    }

    if (!obj.userData.phase96FloorStable){
      obj.position.y = Math.max(obj.position.y + 0.018 + floorOverlayIndex * 0.006, 0.055 + floorOverlayIndex * 0.006);
      obj.userData.phase96FloorStable = true;
    }
    obj.renderOrder = -80 + floorOverlayIndex;
    setMatFlag(obj.material, (mat)=>{
      mat.depthWrite = true;
      mat.depthTest = true;
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -20 - floorOverlayIndex;
      mat.polygonOffsetUnits = -20 - floorOverlayIndex;
      mat.needsUpdate = true;
    });
    floorOverlayIndex += 1;
  });
}

function darkenDuplicateGreenTableTop(scene){
  let fixed = 0;
  scene.traverse((obj)=>{
    if (!isMesh(obj)) return;
    const { size, center } = boxInfo(obj);
    const flatTableCandidate = center.y > 0.78 && center.y < 1.08 && size.x > 2.8 && size.x < 5.6 && size.z > 1.7 && size.z < 3.9 && size.y < 0.20;
    if (!flatTableCandidate) return;
    setMatFlag(obj.material, (mat)=>{
      const c = mat.color;
      const looksGreen = c && c.g > c.r * 1.18 && c.g > c.b * 1.02;
      const isPlainFelt = !!mat.map || looksGreen;
      if (!isPlainFelt && fixed > 0) return;
      mat.color?.set?.(0x15101a);
      mat.emissive?.set?.(0x050306);
      mat.emissiveIntensity = Math.min(mat.emissiveIntensity || 0.02, 0.035);
      mat.roughness = Math.max(mat.roughness || 0.7, 0.9);
      mat.metalness = 0.0;
      mat.depthWrite = true;
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -1;
      mat.polygonOffsetUnits = -1;
      mat.needsUpdate = true;
      fixed += 1;
    });
    obj.userData.phase96TableTopNeutralized = true;
  });
}

function faceCenter(group){
  if (!group) return;
  group.rotation.y = Math.atan2(-group.position.x, -group.position.z);
}

function movePortal(scene, key, x, z, y = 0){
  const group = scene.getObjectByName(`PORTAL_${key}`);
  if (!group) return false;
  group.position.set(x, y, z);
  faceCenter(group);
  group.userData.phase96Aligned = true;
  return true;
}

function alignPortals(scene, world){
  const reikiTarget = world?.sceneTargets?.reiki?.pos;
  const pgaTarget = world?.sceneTargets?.pga?.pos;
  const sponsorTarget = world?.sceneTargets?.sponsor?.pos;
  const scorpionTarget = world?.sceneTargets?.scorpion?.pos;
  movePortal(scene, "reikiRoom", reikiTarget?.x ?? -7.35, reikiTarget?.z ?? -2.65);
  movePortal(scene, "pgaDrive", pgaTarget?.x ?? 7.35, pgaTarget?.z ?? -3.25);
  movePortal(scene, "pgaChipPutt", (pgaTarget?.x ?? 7.35) + 1.08, (pgaTarget?.z ?? -3.25) + 1.38);
  movePortal(scene, "storeRoom", sponsorTarget?.x ? sponsorTarget.x * 0.95 : -8.35, sponsorTarget?.z ? sponsorTarget.z * 0.95 : 1.25);
  movePortal(scene, "smokerLounge", -7.85, 3.55);
  movePortal(scene, "scorpion", scorpionTarget?.x ?? 7.85, scorpionTarget?.z ?? 3.55);
}

function classifyPlanet(mesh){
  if (!isMesh(mesh)) return null;
  if (!/SphereGeometry/.test(String(mesh.geometry?.type || ""))) return null;
  if (mesh.position.z > -40 || mesh.position.y < 15) return null;
  const c = mesh.material?.color;
  if (!c) return null;
  if (c.r > 0.70 && c.g > 0.65 && c.b > 0.65) return "moon";
  if (c.r > 0.50 && c.g > 0.16 && c.g < 0.58 && c.b < 0.46) return "mars";
  return null;
}

function moveNearbyDecor(scene, oldPos, newPos){
  scene.traverse((obj)=>{
    if (!obj?.position || isMesh(obj)) return;
    if (!(isSprite(obj) || isPointLight(obj))) return;
    if (obj.position.distanceTo(oldPos) > 3.5) return;
    obj.position.copy(newPos);
  });
}

function raisePlanets(scene){
  const t = scene.userData._time || performance.now() * 0.001;
  scene.traverse((obj)=>{
    const kind = classifyPlanet(obj);
    if (!kind) return;
    const oldPos = obj.position.clone();
    if (kind === "moon") obj.position.set(-70 + Math.sin(t * 0.016) * 8.0, 104 + Math.sin(t * 0.05) * 1.8, -238 + Math.cos(t * 0.014) * 8.0);
    else if (kind === "mars") obj.position.set(84 + Math.sin(t * 0.013 + 1.4) * 9.0, 118 + Math.sin(t * 0.04 + 0.8) * 1.5, -282 + Math.cos(t * 0.011 + 0.4) * 9.0);
    obj.frustumCulled = false;
    obj.visible = true;
    moveNearbyDecor(scene, oldPos, obj.position);
  });
}

export function installPhase93LobbyRepair({ scene, world, log = console.log, selfTick = true } = {}){
  if (!scene) return null;
  if (installedForScene.has(scene)) return scene.userData.phase93RepairApi || null;
  installedForScene.add(scene);
  try{
    stabilizeFloorOverlays(scene);
    darkenDuplicateGreenTableTop(scene);
    alignPortals(scene, world);
    raisePlanets(scene);
    scene.userData.phase93Repair = PHASE96;
    log?.(`[${PHASE96}] Quest floor/portal/sky repair installed`);
  }catch(err){ console.warn(`[${PHASE96}] install failed`, err); }

  let accum = 0;
  let last = performance.now();
  const api = {
    update(dt = 0.016){
      accum += dt;
      raisePlanets(scene);
      if (accum > 0.85){
        stabilizeFloorOverlays(scene);
        darkenDuplicateGreenTableTop(scene);
        alignPortals(scene, world);
        accum = 0;
      }
    }
  };
  scene.userData.phase93RepairApi = api;

  if (selfTick){
    const tick = ()=>{
      if (!scene.userData.phase93RepairApi) return;
      const now = performance.now();
      api.update(Math.min((now - last) / 1000, 0.05));
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  return api;
}
