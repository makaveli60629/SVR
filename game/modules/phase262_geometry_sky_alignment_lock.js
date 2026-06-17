import * as THREE from "three";

const LABEL = "PHASE-278-ROOT-PILLAR-DOORWAY-GEOMETRY-LOCK";

function objectName(obj){ return String(obj?.name || ""); }
function hideObject(obj){
  if (!obj) return;
  obj.visible = false;
  obj.userData.phase278Hidden = true;
  obj.traverse?.((child)=>{ child.visible = false; child.userData.phase278Hidden = true; });
}
function showObject(obj){
  if (!obj) return;
  obj.visible = true;
  obj.traverse?.((child)=>{ child.visible = true; });
}
function collect(scene, predicate){
  const out = [];
  scene.traverse((obj)=>{ if (predicate(obj)) out.push(obj); });
  return out;
}
function forEachMaterial(obj, cb){
  obj?.traverse?.((child)=>{
    const mats = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
    mats.forEach((mat)=>{ if (mat) cb(mat, child); });
  });
}
function softenMaterials(obj, opacity){
  forEachMaterial(obj, (mat)=>{
    mat.transparent = true;
    mat.opacity = Math.min(mat.opacity ?? 1, opacity);
    mat.depthWrite = false;
    mat.needsUpdate = true;
  });
}
function keepSinglePlanet(scene, token, keepName, applyPose){
  const matches = collect(scene, (obj)=>objectName(obj).toUpperCase().includes(token));
  let keep = scene.getObjectByName(keepName) || matches.find((obj)=>obj.isMesh || obj.isGroup) || null;
  matches.forEach((obj)=>{
    const name = objectName(obj).toUpperCase();
    if (name.startsWith("PHASE262_") || name.startsWith("PHASE263_") || name.startsWith("PHASE264_") || name.startsWith("PHASE265_") || name.startsWith("PHASE266_") || name.startsWith("PHASE278_")) return;
    if (obj === keep || keep?.parent === obj || obj.parent === keep) return;
    if (obj.isMesh || obj.isGroup || name.includes("LOCKED")) hideObject(obj);
  });
  if (keep){ showObject(keep); applyPose(keep); }
  return keep;
}
function hideUnsupportedOverlay(){
  try{
    if (!document.getElementById("phase278-clean-overlay-style")){
      const style = document.createElement("style");
      style.id = "phase278-clean-overlay-style";
      style.textContent = "[data-phase278-hidden='true']{display:none!important;visibility:hidden!important;opacity:0!important;}";
      document.head.appendChild(style);
    }
    Array.from(document.querySelectorAll("body *")).forEach((node)=>{
      const txt = String(node.textContent || "").trim().toUpperCase();
      if (txt === "VR NOT SUPPORTED" || txt.includes("VR NOT SUPPORTED")){
        node.style.display = "none";
        node.style.visibility = "hidden";
        node.style.opacity = "0";
        node.setAttribute("data-phase278-hidden", "true");
      }
    });
  }catch(_err){}
}
function alignStorefrontShells(scene){
  const root = scene.getObjectByName("PHASE202_STOREFRONT_SHELLS_ROOT");
  if (!root) return { storefrontRoot:false };

  const bayTokens = ["WELLNESS_ARCH_BAY", "PGA_ARCH_BAY", "PLAY_ARCH_BAY", "STORE_ARCH_BAY", "SCORPION_ARCH_BAY"];
  collect(scene, (obj)=>{
    const n = objectName(obj).toUpperCase();
    return n.startsWith("PHASE200_") && bayTokens.some((token)=>n.includes(token));
  }).forEach(hideObject);

  const shellPositions = {
    PHASE202_WELLNESS_STOREFRONT_SHELL: [-12, -13.58],
    PHASE202_PGA_STOREFRONT_SHELL: [-6, -13.58],
    PHASE202_PLAY_STOREFRONT_SHELL: [0, -13.58],
    PHASE202_STORE_STOREFRONT_SHELL: [6, -13.58],
    PHASE202_SCORPION_STOREFRONT_SHELL: [12, -13.58]
  };
  Object.entries(shellPositions).forEach(([name, [x,z]])=>{
    const obj = root.getObjectByName(name);
    if (obj){ obj.position.x = x; obj.position.z = z; }
  });

  const signPositions = {
    PHASE202_WELLNESS_STOREFRONT_SHELL_SIGN: [-12, 2.58, -12.64],
    PHASE202_PGA_STOREFRONT_SHELL_SIGN: [-6, 2.58, -12.64],
    PHASE202_PLAY_STOREFRONT_SHELL_SIGN: [0, 2.58, -12.64],
    PHASE202_STORE_STOREFRONT_SHELL_SIGN: [6, 2.58, -12.64],
    PHASE202_SCORPION_STOREFRONT_SHELL_SIGN: [12, 2.58, -12.64]
  };
  Object.entries(signPositions).forEach(([name, [x,y,z]])=>{
    const obj = root.getObjectByName(name);
    if (obj){ obj.position.set(x,y,z); obj.renderOrder = 190; }
  });

  [
    ["PHASE202_WELLNESS_HOLOGRAM_CAROUSEL_FRAME", -12, -11.94, 0.66],
    ["PHASE202_PGA_PRACTICE_PREVIEW_FRAME", -6, -11.98, 0.70],
    ["PHASE202_STORE_DISPLAY_RACKS", 6, -11.94, 0.52],
    ["PHASE202_SCORPION_PRIVATE_DOOR_FRAME", 12, -12.00, 0.70]
  ].forEach(([name, x, z, scale])=>{
    const obj = root.getObjectByName(name);
    if (obj){ obj.position.set(x,0,z); obj.scale.setScalar(scale); }
  });

  const storeRack = root.getObjectByName("PHASE202_STORE_DISPLAY_RACKS");
  if (storeRack){
    storeRack.traverse((obj)=>{ if (objectName(obj).includes("PRODUCT_PLINTH")) softenMaterials(obj, 0.22); });
  }
  return { storefrontRoot:true };
}
function alignColumns(scene){
  const doorwayMap = {
    PHASE200_REAR_ORDERED_COLUMN_1: [-15.4, -15.78],
    PHASE200_REAR_ORDERED_COLUMN_2: [-9.0, -15.78],
    PHASE200_REAR_ORDERED_COLUMN_3: [-3.0, -15.78],
    PHASE200_REAR_ORDERED_COLUMN_4: [3.0, -15.78],
    PHASE200_REAR_ORDERED_COLUMN_5: [9.0, -15.78],
    PHASE200_REAR_ORDERED_COLUMN_6: [15.4, -15.78],
    PHASE200_REAR_ORDERED_COLUMN_7: [18.45, -15.92]
  };
  Object.entries(doorwayMap).forEach(([name, [x,z]])=>{
    const obj = scene.getObjectByName(name);
    if (!obj) return;
    obj.visible = true;
    obj.position.x = x;
    obj.position.z = z;
    obj.scale.x = name.endsWith("_7") ? 0.38 : 0.42;
    obj.scale.z = name.endsWith("_7") ? 0.38 : 0.42;
    obj.userData.phase278AlignedToDoorwayJamb = true;
    obj.traverse((child)=>{
      const n = objectName(child).toUpperCase();
      if (n.includes("CAP") || n.includes("BASE")){
        child.scale.x = Math.min(child.scale.x, 0.44);
        child.scale.z = Math.min(child.scale.z, 0.54);
      }
    });
  });
}
function alignPlanets(scene){
  const moon = keepSinglePlanet(scene, "MOON", "PHASE200_SINGLE_VISIBLE_MOON_LOCKED", (obj)=>{
    obj.position.set(-10.4,19.2,-39.0);
    obj.scale.setScalar(0.60);
    obj.renderOrder = 5;
    obj.userData.phase278SkyLocked = true;
  });
  const mars = keepSinglePlanet(scene, "MARS", "PHASE200_SINGLE_VISIBLE_MARS_LOCKED", (obj)=>{
    obj.position.set(8.8,17.6,-42.0);
    obj.scale.setScalar(0.62);
    obj.renderOrder = 5;
    obj.userData.phase278SkyLocked = true;
  });
  const root = scene.getObjectByName("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene;
  let moonHalo = scene.getObjectByName("PHASE278_MOON_SOFT_HALO") || scene.getObjectByName("PHASE266_MOON_SOFT_HALO") || scene.getObjectByName("PHASE265_MOON_SOFT_HALO") || scene.getObjectByName("PHASE264_MOON_SOFT_HALO") || scene.getObjectByName("PHASE263_MOON_SOFT_HALO") || scene.getObjectByName("PHASE262_MOON_SOFT_HALO");
  if (moon && !moonHalo){
    moonHalo = new THREE.Mesh(new THREE.RingGeometry(0.90,1.18,96), new THREE.MeshBasicMaterial({ color:0xdde6ff, transparent:true, opacity:0.08, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
    moonHalo.name = "PHASE278_MOON_SOFT_HALO";
    root.add(moonHalo);
  }
  if (moon && moonHalo){ moonHalo.name = "PHASE278_MOON_SOFT_HALO"; moonHalo.visible = true; moonHalo.position.copy(moon.position); moonHalo.rotation.x = Math.PI * 0.5; }
  let marsHalo = scene.getObjectByName("PHASE278_MARS_SOFT_HALO") || scene.getObjectByName("PHASE266_MARS_SOFT_HALO") || scene.getObjectByName("PHASE265_MARS_SOFT_HALO") || scene.getObjectByName("PHASE264_MARS_SOFT_HALO") || scene.getObjectByName("PHASE263_MARS_SOFT_HALO") || scene.getObjectByName("PHASE262_MARS_SOFT_HALO");
  if (mars && !marsHalo){
    marsHalo = new THREE.Mesh(new THREE.RingGeometry(0.40,0.58,80), new THREE.MeshBasicMaterial({ color:0xff8b67, transparent:true, opacity:0.07, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
    marsHalo.name = "PHASE278_MARS_SOFT_HALO";
    root.add(marsHalo);
  }
  if (mars && marsHalo){ marsHalo.name = "PHASE278_MARS_SOFT_HALO"; marsHalo.visible = true; marsHalo.position.copy(mars.position); marsHalo.rotation.x = Math.PI * 0.5; }
  return { moon:!!moon, mars:!!mars };
}
function applyApprovalSafety(scene){
  const rejected = ["TRUEITIVE", "TRUITIVE", "SHYONA", "ROYSTON", "FOUNDER"];
  collect(scene, (obj)=>rejected.some((token)=>objectName(obj).toUpperCase().includes(token))).forEach(hideObject);
}
function applyQuestLod(scene, renderer){
  try{
    if (renderer?.setPixelRatio){ renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35)); }
    if (renderer?.shadowMap) renderer.shadowMap.enabled = false;
  }catch(_err){}

  const floorGrid = scene.getObjectByName("PHASE200_SUBTLE_ORDERED_FLOOR_GRID");
  if (floorGrid) hideObject(floorGrid);

  collect(scene, (obj)=>objectName(obj).toUpperCase().includes("STAR_FIELD")).forEach((obj)=>{
    if (obj.material){ obj.material.size = Math.min(obj.material.size || 0.038, 0.026); obj.material.opacity = Math.min(obj.material.opacity || 0.88, 0.58); obj.material.needsUpdate = true; }
  });

  collect(scene, (obj)=>{
    const n = objectName(obj).toUpperCase();
    return n.includes("LIGHT_BULB") || n.includes("LOWER_GLOW") || n.includes("UPPER_GLOW") || n.includes("NEON") || n.includes("CRESTRING");
  }).forEach((obj)=>softenMaterials(obj, 0.34));

  ["PHASE200_ORDERED_GRAND_LOBBY_ROOT", "PHASE202_STOREFRONT_SHELLS_ROOT"].forEach((name)=>{
    const root = scene.getObjectByName(name);
    root?.traverse((obj)=>{
      const n = objectName(obj).toUpperCase();
      if (!obj.isMesh || n.includes("MOON") || n.includes("MARS") || n.includes("HALO")) return;
      obj.updateMatrix();
      obj.matrixAutoUpdate = false;
    });
  });
}
function applyOnce(scene, renderer){
  hideUnsupportedOverlay();
  const shells = alignStorefrontShells(scene);
  alignColumns(scene);
  const planets = alignPlanets(scene);
  applyApprovalSafety(scene);
  applyQuestLod(scene, renderer);
  window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK = {
    label: LABEL,
    locked: true,
    columnsAlignedToDoorwayJambs: true,
    centerDoorwaysCleared: true,
    signFacesCleared: true,
    duplicatePhase200ArchPanelsHidden: true,
    storefrontGeometryTightened: !!shells.storefrontRoot,
    questLodCleanup: true,
    floorGridHidden: true,
    starFieldReduced: true,
    glowOpacityReduced: true,
    staticLobbyMeshesFrozen: true,
    moonHighBackLocked: planets.moon,
    marsHighBackLocked: planets.mars,
    noTruitiveRuntimePolicy: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE277_PILLAR_ALIGNMENT_BOOT_CACHE_LOCK = window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK;
  window.SVR_PHASE276_PILLAR_DOORWAY_ALIGNMENT_LOCK = window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK;
  window.SVR_PHASE266_QUEST_LOD_PERFORMANCE_CLEANUP_LOCK = window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK;
  window.SVR_PHASE265_PILLAR_SIGN_CLEARANCE_LOCK = window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK;
  window.SVR_PHASE264_QUEST_SCREENSHOT_MICRO_ALIGNMENT_LOCK = window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK;
  window.SVR_PHASE263_GEOMETRY_SKY_HARD_LOCK = window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK;
  window.SVR_PHASE262_GEOMETRY_SKY_LOCK = window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK;
}
export function installPhase262GeometrySkyAlignmentLock({ scene, renderer, log = console.log } = {}){
  if (!scene) return null;
  [0,120,360,800,1600,2800,5200,7600].forEach((delay)=>setTimeout(()=>applyOnce(scene, renderer), delay));
  log(`[Phase278] Root pillar doorway geometry lock installed`);
  return window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK || { label: LABEL, pending:true };
}
