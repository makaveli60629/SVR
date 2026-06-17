import * as THREE from "three";

const LABEL = "PHASE-262-NO-TRUITIVE-GEOMETRY-SKY-LOCK";

function objectName(obj){
  return String(obj?.name || "");
}
function disposeObject(obj){
  if (!obj) return;
  if (obj.geometry?.dispose) obj.geometry.dispose();
  const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
  mats.forEach((mat)=>{
    if (mat?.map?.dispose) mat.map.dispose();
    if (mat?.dispose) mat.dispose();
  });
}
function hideObject(obj){
  if (!obj) return;
  obj.visible = false;
  obj.userData.phase262Hidden = true;
  obj.traverse?.((child)=>{ child.visible = false; child.userData.phase262Hidden = true; });
}
function showObject(obj){
  if (!obj) return;
  obj.visible = true;
  obj.traverse?.((child)=>{ child.visible = true; });
}
function setTransparentSafety(obj, opacity = 0.10){
  obj?.traverse?.((child)=>{
    const mats = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
    mats.forEach((mat)=>{
      if (!mat) return;
      mat.transparent = true;
      mat.opacity = Math.min(mat.opacity ?? 1, opacity);
      mat.depthWrite = false;
      mat.needsUpdate = true;
    });
  });
}
function collect(scene, predicate){
  const out = [];
  scene.traverse((obj)=>{ if (predicate(obj)) out.push(obj); });
  return out;
}
function keepSinglePlanet(scene, token, keepName, applyPose){
  const matches = collect(scene, (obj)=>objectName(obj).toUpperCase().includes(token));
  let keep = scene.getObjectByName(keepName) || matches.find((obj)=>obj.isMesh || obj.isGroup) || null;
  matches.forEach((obj)=>{
    if (obj === keep || keep?.parent === obj || obj.parent === keep) return;
    // Avoid hiding documentation lights accidentally; only hide obvious mesh/group planet duplicates.
    if (obj.isMesh || obj.isGroup || objectName(obj).toUpperCase().includes("LOCKED")) hideObject(obj);
  });
  if (keep){
    showObject(keep);
    applyPose(keep);
  }
  return keep;
}
function alignStorefrontShells(scene){
  const root = scene.getObjectByName("PHASE202_STOREFRONT_SHELLS_ROOT");
  if (!root) return { storefrontRoot:false };

  // Hide old Phase200 arch labels/recesses behind the Phase202 storefront shells.
  const bayTokens = ["WELLNESS_ARCH_BAY", "PGA_ARCH_BAY", "PLAY_ARCH_BAY", "STORE_ARCH_BAY", "SCORPION_ARCH_BAY"];
  collect(scene, (obj)=>{
    const n = objectName(obj).toUpperCase();
    return n.startsWith("PHASE200_") && bayTokens.some((token)=>n.includes(token));
  }).forEach(hideObject);

  const shellPositions = {
    PHASE202_WELLNESS_STOREFRONT_SHELL: [-12, -13.18],
    PHASE202_PGA_STOREFRONT_SHELL: [-6, -13.18],
    PHASE202_PLAY_STOREFRONT_SHELL: [0, -13.18],
    PHASE202_STORE_STOREFRONT_SHELL: [6, -13.18],
    PHASE202_SCORPION_STOREFRONT_SHELL: [12, -13.18]
  };
  Object.entries(shellPositions).forEach(([name, [x,z]])=>{
    const obj = root.getObjectByName(name);
    if (!obj) return;
    obj.position.x = x;
    obj.position.z = z;
  });

  const trimTargets = [
    ["PHASE202_WELLNESS_HOLOGRAM_CAROUSEL_FRAME", -12, -11.48, 0.82],
    ["PHASE202_PGA_PRACTICE_PREVIEW_FRAME", -6, -11.52, 0.86],
    ["PHASE202_STORE_DISPLAY_RACKS", 6, -11.42, 0.78],
    ["PHASE202_SCORPION_PRIVATE_DOOR_FRAME", 12, -11.54, 0.88]
  ];
  trimTargets.forEach(([name, x, z, scale])=>{
    const obj = root.getObjectByName(name);
    if (!obj) return;
    obj.position.set(x, 0, z);
    obj.scale.setScalar(scale);
  });

  // Store display plinths were reading as duplicate black blocks in front of the store sign.
  const storeRack = root.getObjectByName("PHASE202_STORE_DISPLAY_RACKS");
  if (storeRack){
    storeRack.traverse((obj)=>{
      if (objectName(obj).includes("PRODUCT_PLINTH")) setTransparentSafety(obj, 0.72);
    });
  }
  return { storefrontRoot:true };
}
function alignColumns(scene){
  // Keep the Roman architecture, but prevent pillars from visually cutting the storefront faces.
  collect(scene, (obj)=>{
    const n = objectName(obj).toUpperCase();
    return n.includes("REAR_ORDERED_COLUMN") && (n.includes("_3") || n.includes("_4") || n.includes("_5"));
  }).forEach((obj)=>{
    obj.position.z = -16.42;
    obj.scale.x = 0.86;
    obj.scale.z = 0.86;
  });
}
function alignPlanets(scene){
  const moon = keepSinglePlanet(scene, "MOON", "PHASE200_SINGLE_VISIBLE_MOON_LOCKED", (obj)=>{
    obj.position.set(-8.4, 16.6, -31.5);
    obj.scale.setScalar(0.78);
    obj.renderOrder = 5;
    obj.userData.phase262SkyLocked = true;
  });
  const mars = keepSinglePlanet(scene, "MARS", "PHASE200_SINGLE_VISIBLE_MARS_LOCKED", (obj)=>{
    obj.position.set(6.8, 15.2, -35.0);
    obj.scale.setScalar(0.82);
    obj.renderOrder = 5;
    obj.userData.phase262SkyLocked = true;
  });

  const root = scene.getObjectByName("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene;
  if (moon && !scene.getObjectByName("PHASE262_MOON_SOFT_HALO")){
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.25, 1.62, 96),
      new THREE.MeshBasicMaterial({ color:0xdde6ff, transparent:true, opacity:0.11, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })
    );
    halo.name = "PHASE262_MOON_SOFT_HALO";
    halo.position.copy(moon.position);
    halo.rotation.x = Math.PI * 0.5;
    root.add(halo);
  }
  if (mars && !scene.getObjectByName("PHASE262_MARS_SOFT_HALO")){
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.88, 80),
      new THREE.MeshBasicMaterial({ color:0xff8b67, transparent:true, opacity:0.10, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })
    );
    halo.name = "PHASE262_MARS_SOFT_HALO";
    halo.position.copy(mars.position);
    halo.rotation.x = Math.PI * 0.5;
    root.add(halo);
  }
  return { moon:!!moon, mars:!!mars };
}
function hideUnsupportedOverlay(){
  try{
    const nodes = Array.from(document.querySelectorAll("body *"));
    nodes.forEach((node)=>{
      const txt = String(node.textContent || "").trim().toUpperCase();
      if (txt === "VR NOT SUPPORTED"){
        node.style.display = "none";
        node.setAttribute("data-phase262-hidden", "true");
      }
    });
  }catch(_err){ /* DOM cleanup is non-critical. */ }
}
function applyApprovalSafety(scene){
  // Runtime safety pass for rejected sponsor/founder paths.
  const rejected = ["TRUEITIVE", "TRUITIVE", "SHYONA", "ROYSTON", "FOUNDER"];
  collect(scene, (obj)=>rejected.some((token)=>objectName(obj).toUpperCase().includes(token))).forEach(hideObject);
}
function applyOnce(scene){
  hideUnsupportedOverlay();
  const shells = alignStorefrontShells(scene);
  alignColumns(scene);
  const planets = alignPlanets(scene);
  applyApprovalSafety(scene);
  window.SVR_PHASE262_GEOMETRY_SKY_LOCK = {
    label: LABEL,
    locked: true,
    duplicatePhase200ArchPanelsHidden: true,
    storefrontGeometryTightened: !!shells.storefrontRoot,
    moonHighBackLocked: planets.moon,
    marsHighBackLocked: planets.mars,
    noTruitiveRuntimePolicy: true,
    checkedAt: new Date().toISOString()
  };
}

export function installPhase262GeometrySkyAlignmentLock({ scene, log = console.log } = {}){
  if (!scene) return null;
  const delays = [0, 250, 900, 2200];
  delays.forEach((delay)=>setTimeout(()=>applyOnce(scene), delay));
  log(`[Phase262] geometry / duplicate storefront / moon-Mars alignment lock installed`);
  return window.SVR_PHASE262_GEOMETRY_SKY_LOCK || { label: LABEL, pending:true };
}
