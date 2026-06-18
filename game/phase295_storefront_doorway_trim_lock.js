import * as THREE from "three";

const LABEL = "PHASE-296-LOBBY-ARCH-DOORWAY-ALIGNMENT-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const STONE = 0xd6c2a4;
const REAR_Z = -16.46;
const SIDE_Z = 6.15;
const DISPLAY_RENDER_ORDER = 120;

const REAR_BAYS = [
  { key:"rear_west", centerX:-12, width:3.55, z:REAR_Z, ry:0, label:"REAR WEST" },
  { key:"rear_mid_west", centerX:-6, width:3.55, z:REAR_Z, ry:0, label:"REAR MID WEST" },
  { key:"rear_center", centerX:0, width:3.55, z:REAR_Z, ry:0, label:"REAR CENTER" },
  { key:"rear_mid_east", centerX:6, width:3.55, z:REAR_Z, ry:0, label:"REAR MID EAST" },
  { key:"rear_east", centerX:12, width:3.55, z:REAR_Z, ry:0, label:"REAR EAST" }
];

const SIDE_BAYS = [
  { key:"side_wellness", centerX:-7.9, width:3.95, z:SIDE_Z, ry:Math.PI, label:"WELLNESS" },
  { key:"side_store", centerX:7.9, width:3.95, z:SIDE_Z, ry:Math.PI, label:"STORE" }
];

const ALL_BAYS = [...REAR_BAYS, ...SIDE_BAYS];

function standardMat(color, emissive = 0x000000, intensity = 0.10){
  return new THREE.MeshStandardMaterial({ color, roughness:.58, metalness:.08, emissive, emissiveIntensity:intensity });
}

function glowMat(color, opacity=.50){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}

function isDisplayLikeName(name){
  return /SIGN|DISPLAY|PANEL|PORTAL|HOLOGRAM|STORE|REIKI|PGA|SCORPION|SPONSOR|INFO|ARCH_BAY|PROMPT|ZONE/i.test(name || "");
}

function inBayOpening(obj, bay, extra = 0.30){
  if (!obj?.position) return false;
  const x = Number(obj.position.x || 0);
  const z = Number(obj.position.z || 0);
  return Math.abs(x - bay.centerX) <= (bay.width * 0.5 + extra) && Math.abs(z - bay.z) <= 1.85;
}

function hideBlockingOldColumns(scene){
  let hidden = 0;
  scene.traverse((obj)=>{
    if (!obj?.position || obj.userData?.phase296DoorwayFrame) return;
    const n = String(obj.name || "").toUpperCase();
    const isColumn = /COLUMN|PILLAR|ARCH_POST|ROMAN_CANOPY|REAR_ORDERED_COLUMN|REAR_COLUMN/.test(n);
    if (!isColumn) return;
    const blocksAnyBay = ALL_BAYS.some((bay)=>inBayOpening(obj, bay, 0.12));
    const oldRearColumn = obj.position.z < -10.6 && /COLUMN|PILLAR/.test(n);
    if (blocksAnyBay || oldRearColumn){
      if (obj.visible !== false) hidden += 1;
      obj.visible = false;
      obj.userData.phase296HiddenDoorwayObstruction = true;
      obj.traverse?.((child)=>{ child.visible = false; child.userData.phase296HiddenDoorwayObstruction = true; });
    }
  });
  return hidden;
}

function protectDisplays(scene){
  let protectedCount = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "");
    if (!isDisplayLikeName(n) || !obj?.position || obj.userData?.phase296DoorwayFrame) return;
    const nearBay = ALL_BAYS.some((bay)=>inBayOpening(obj, bay, 1.10));
    if (!nearBay) return;
    obj.renderOrder = Math.max(obj.renderOrder || 0, DISPLAY_RENDER_ORDER);
    obj.userData.phase296DisplayReadabilityProtected = true;
    obj.traverse?.((child)=>{
      child.renderOrder = Math.max(child.renderOrder || 0, DISPLAY_RENDER_ORDER);
      child.userData.phase296DisplayReadabilityProtected = true;
      if (child.material){
        if (Array.isArray(child.material)) child.material.forEach((m)=>{ if(m){ m.depthWrite = false; m.needsUpdate = true; }});
        else { child.material.depthWrite = false; child.material.needsUpdate = true; }
      }
    });
    protectedCount += 1;
  });
  return protectedCount;
}

function makePillar(name){
  const group = new THREE.Group();
  group.name = `${name}_PILLAR`;
  group.userData.phase296DoorwayFrame = true;
  const stone = standardMat(STONE, 0x140b03, .12);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(.24, 4.58, .20), stone);
  shaft.name = `${name}_SLIM_OUTER_SHAFT`;
  shaft.position.y = 2.35;
  const base = new THREE.Mesh(new THREE.BoxGeometry(.52, .20, .34), stone);
  base.name = `${name}_BASE_CLEAR_OF_DISPLAY`;
  base.position.y = .10;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(.56, .22, .36), stone);
  cap.name = `${name}_CAP_CLEAR_OF_DISPLAY`;
  cap.position.y = 4.70;
  const neon = new THREE.Mesh(new THREE.BoxGeometry(.032, 4.22, .045), glowMat(CYAN, .36));
  neon.name = `${name}_EDGE_LIGHT`;
  neon.position.set(.16, 2.40, .035);
  group.add(shaft, base, cap, neon);
  group.traverse((child)=>{ child.userData.phase296DoorwayFrame = true; child.renderOrder = 15; });
  return group;
}

function makeArchTop(name, width){
  const group = new THREE.Group();
  group.name = `${name}_UPSIDE_DOWN_U_ARCH_TOP`;
  group.userData.phase296DoorwayFrame = true;
  const stone = standardMat(STONE, 0x140b03, .12);
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + .52, .26, .22), stone);
  top.name = `${name}_TOP_BEAM_ABOVE_DISPLAY`;
  top.position.y = 5.03;
  const glow = new THREE.Mesh(new THREE.BoxGeometry(width + .28, .045, .052), glowMat(GOLD, .50));
  glow.name = `${name}_TOP_GOLD_READABILITY_LINE`;
  glow.position.y = 5.205;
  const innerGlow = new THREE.Mesh(new THREE.BoxGeometry(width - .40, .032, .045), glowMat(CYAN, .32));
  innerGlow.name = `${name}_INNER_CYAN_ARCH_OPENING_LINE`;
  innerGlow.position.y = 4.71;
  group.add(top, glow, innerGlow);
  group.traverse((child)=>{ child.userData.phase296DoorwayFrame = true; child.renderOrder = 16; });
  return group;
}

function makeBayFrame(scene, bay){
  const name = `PHASE296_ARCH_DOORWAY_${bay.key}`;
  let root = scene.getObjectByName(name);
  if (!root){
    root = new THREE.Group();
    root.name = name;
    root.userData.phase296DoorwayFrame = true;
    scene.add(root);
    const left = makePillar(`${name}_LEFT`);
    const right = makePillar(`${name}_RIGHT`);
    const arch = makeArchTop(name, bay.width);
    root.add(left, right, arch);
  }

  root.visible = true;
  root.position.set(bay.centerX, 0, bay.z);
  root.rotation.set(0, bay.ry || 0, 0);
  root.scale.set(1,1,1);

  const half = bay.width * 0.5;
  const left = root.children.find((child)=>child.name.includes("_LEFT_"));
  const right = root.children.find((child)=>child.name.includes("_RIGHT_"));
  const arch = root.children.find((child)=>child.name.includes("UPSIDE_DOWN_U_ARCH_TOP"));
  if (left) left.position.set(-half - .34, 0, 0);
  if (right) right.position.set(half + .34, 0, 0);
  if (arch) arch.position.set(0, 0, 0);

  root.traverse((child)=>{
    child.visible = true;
    child.userData.phase296DoorwayFrame = true;
    child.userData.phase296PlacementRule = "archWidth > displayWidth; pillars sit outside display edges; display stays inside doorway opening";
  });
  root.updateMatrixWorld(true);
  return root;
}

function markPortalClearance(scene){
  let marked = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "").toUpperCase();
    if (!/PORTAL|ZONE|HITBOX|RING|PROMPT/.test(n) || !obj?.position) return;
    obj.userData.phase296PortalClearanceProtected = true;
    obj.renderOrder = Math.max(obj.renderOrder || 0, 130);
    marked += 1;
  });
  return marked;
}

function apply(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const hiddenObstructions = hideBlockingOldColumns(scene);
  const frames = ALL_BAYS.map((bay)=>makeBayFrame(scene, bay));
  const displaysProtected = protectDisplays(scene);
  const portalsProtected = markPortalClearance(scene);
  window.SVR_PHASE296_LOBBY_ARCH_DOORWAY_ALIGNMENT_LOCK = {
    build: LABEL,
    active: true,
    siteTouched: false,
    publicRootTouched: false,
    pokerLogicTouched: false,
    locomotionTouched: false,
    watchTouched: false,
    moonMarsTouched: false,
    frameCount: frames.length,
    bayKeys: ALL_BAYS.map((bay)=>bay.key),
    hiddenObstructions,
    displaysProtected,
    portalsProtected,
    rule: "Pillars frame left/right display edges; upside-down U arch wraps around display; no pillar in front of writing or portal trigger.",
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (apply() || tries > 180) clearInterval(timer); }, 150);
[500,1200,2400,4800,8000,12000,18000,24000].forEach((delay)=>setTimeout(apply, delay));
