import * as THREE from "three";

const LABEL = "PHASE-297-LOBBY-GEOMETRY-POLISH-ALIGNMENT-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const STONE = 0xd6c2a4;
const BACKPLATE = 0x05070c;
const REAR_Z = -16.54;
const SIDE_Z = 6.22;
const DISPLAY_RENDER_ORDER = 160;
const FRAME_RENDER_ORDER = 42;
const PORTAL_RENDER_ORDER = 180;
const MIN_OPENING_GAP = 3.20;

const REAR_BAYS = [
  { key:"rear_west", centerX:-12, width:3.72, z:REAR_Z, ry:0, label:"REAR WEST" },
  { key:"rear_mid_west", centerX:-6, width:3.72, z:REAR_Z, ry:0, label:"REAR MID WEST" },
  { key:"rear_center", centerX:0, width:3.72, z:REAR_Z, ry:0, label:"REAR CENTER" },
  { key:"rear_mid_east", centerX:6, width:3.72, z:REAR_Z, ry:0, label:"REAR MID EAST" },
  { key:"rear_east", centerX:12, width:3.72, z:REAR_Z, ry:0, label:"REAR EAST" }
];

const SIDE_BAYS = [
  { key:"side_wellness", centerX:-7.9, width:4.18, z:SIDE_Z, ry:Math.PI, label:"WELLNESS" },
  { key:"side_store", centerX:7.9, width:4.18, z:SIDE_Z, ry:Math.PI, label:"STORE" }
];

const ALL_BAYS = [...REAR_BAYS, ...SIDE_BAYS];

function standardMat(color, emissive = 0x000000, intensity = 0.10){
  return new THREE.MeshStandardMaterial({ color, roughness:.54, metalness:.10, emissive, emissiveIntensity:intensity });
}

function glowMat(color, opacity=.50){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}

function darkPanelMat(opacity=.62){
  return new THREE.MeshBasicMaterial({ color:BACKPLATE, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false });
}

function isDisplayLikeName(name){
  return /SIGN|DISPLAY|PANEL|PORTAL|HOLOGRAM|STORE|REIKI|PGA|SCORPION|SPONSOR|INFO|ARCH_BAY|PROMPT|ZONE|BOARD|SCREEN/i.test(name || "");
}

function inBayOpening(obj, bay, extra = 0.30){
  if (!obj?.position) return false;
  const x = Number(obj.position.x || 0);
  const z = Number(obj.position.z || 0);
  return Math.abs(x - bay.centerX) <= (bay.width * 0.5 + extra) && Math.abs(z - bay.z) <= 1.95;
}

function hideBlockingOldColumns(scene){
  let hidden = 0;
  scene.traverse((obj)=>{
    if (!obj?.position || obj.userData?.phase297DoorwayFrame) return;
    const n = String(obj.name || "").toUpperCase();
    const isColumn = /COLUMN|PILLAR|ARCH_POST|ROMAN_CANOPY|REAR_ORDERED_COLUMN|REAR_COLUMN/.test(n);
    if (!isColumn) return;
    const blocksAnyBay = ALL_BAYS.some((bay)=>inBayOpening(obj, bay, 0.16));
    const oldRearColumn = obj.position.z < -10.4 && /COLUMN|PILLAR/.test(n);
    const redCarpetBlock = Math.abs(obj.position.x || 0) < 1.15 && obj.position.z > -7.0 && obj.position.z < 8.5;
    if (blocksAnyBay || oldRearColumn || redCarpetBlock){
      if (obj.visible !== false) hidden += 1;
      obj.visible = false;
      obj.userData.phase297HiddenDoorwayObstruction = true;
      obj.traverse?.((child)=>{ child.visible = false; child.userData.phase297HiddenDoorwayObstruction = true; });
    }
  });
  return hidden;
}

function protectDisplays(scene){
  let protectedCount = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "");
    if (!isDisplayLikeName(n) || !obj?.position || obj.userData?.phase297DoorwayFrame) return;
    const nearBay = ALL_BAYS.some((bay)=>inBayOpening(obj, bay, 1.20));
    if (!nearBay) return;
    obj.renderOrder = Math.max(obj.renderOrder || 0, DISPLAY_RENDER_ORDER);
    obj.userData.phase297DisplayReadabilityProtected = true;
    obj.userData.phase297NoPillarOverlap = true;
    obj.traverse?.((child)=>{
      child.renderOrder = Math.max(child.renderOrder || 0, DISPLAY_RENDER_ORDER);
      child.userData.phase297DisplayReadabilityProtected = true;
      child.userData.phase297NoPillarOverlap = true;
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
  group.name = `${name}_PILLAR_EDGE_CLEAR`;
  group.userData.phase297DoorwayFrame = true;
  const stone = standardMat(STONE, 0x160d05, .14);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(.20, 4.46, .18), stone);
  shaft.name = `${name}_SLIM_OUTER_SHAFT_NO_TEXT_OVERLAP`;
  shaft.position.y = 2.30;
  const base = new THREE.Mesh(new THREE.BoxGeometry(.46, .18, .30), stone);
  base.name = `${name}_BASE_OUTSIDE_DISPLAY_EDGE`;
  base.position.y = .09;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(.50, .20, .32), stone);
  cap.name = `${name}_CAP_OUTSIDE_DISPLAY_EDGE`;
  cap.position.y = 4.62;
  const neon = new THREE.Mesh(new THREE.BoxGeometry(.026, 4.10, .040), glowMat(CYAN, .32));
  neon.name = `${name}_THIN_EDGE_LIGHT`;
  neon.position.set(.135, 2.34, .030);
  const goldToe = new THREE.Mesh(new THREE.BoxGeometry(.34, .030, .045), glowMat(GOLD, .38));
  goldToe.name = `${name}_LOWER_ALIGNMENT_MARK`;
  goldToe.position.y = .38;
  group.add(shaft, base, cap, neon, goldToe);
  group.traverse((child)=>{ child.userData.phase297DoorwayFrame = true; child.renderOrder = FRAME_RENDER_ORDER; });
  return group;
}

function makeArchTop(name, width){
  const group = new THREE.Group();
  group.name = `${name}_UPSIDE_DOWN_U_POLISHED_ARCH_TOP`;
  group.userData.phase297DoorwayFrame = true;
  const stone = standardMat(STONE, 0x160d05, .14);
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + .70, .24, .20), stone);
  top.name = `${name}_TOP_BEAM_ABOVE_READABLE_DISPLAY`;
  top.position.y = 4.96;
  const glow = new THREE.Mesh(new THREE.BoxGeometry(width + .46, .040, .048), glowMat(GOLD, .42));
  glow.name = `${name}_TOP_GOLD_POLISH_LINE`;
  glow.position.y = 5.125;
  const innerGlow = new THREE.Mesh(new THREE.BoxGeometry(width - .32, .030, .040), glowMat(CYAN, .28));
  innerGlow.name = `${name}_INNER_CYAN_OPENING_GUIDE`;
  innerGlow.position.y = 4.60;
  group.add(top, glow, innerGlow);
  group.traverse((child)=>{ child.userData.phase297DoorwayFrame = true; child.renderOrder = FRAME_RENDER_ORDER + 1; });
  return group;
}

function makeBackplate(name, width){
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(width - .18, 3.92), darkPanelMat(.48));
  plate.name = `${name}_READABILITY_BACKPLATE_BEHIND_DISPLAY`;
  plate.position.set(0, 2.54, -0.045);
  plate.renderOrder = 8;
  plate.userData.phase297DoorwayFrame = true;
  plate.userData.phase297ReadabilityBackplate = true;
  return plate;
}

function makeBayFrame(scene, bay){
  const name = `PHASE297_ARCH_DOORWAY_${bay.key}`;
  let root = scene.getObjectByName(name);
  if (!root){
    root = new THREE.Group();
    root.name = name;
    root.userData.phase297DoorwayFrame = true;
    scene.add(root);
    const backplate = makeBackplate(name, bay.width);
    const left = makePillar(`${name}_LEFT`);
    const right = makePillar(`${name}_RIGHT`);
    const arch = makeArchTop(name, bay.width);
    root.add(backplate, left, right, arch);
  }

  root.visible = true;
  root.position.set(bay.centerX, 0, bay.z);
  root.rotation.set(0, bay.ry || 0, 0);
  root.scale.set(1,1,1);

  const half = Math.max(MIN_OPENING_GAP * 0.5, bay.width * 0.5);
  const left = root.children.find((child)=>child.name.includes("_LEFT_"));
  const right = root.children.find((child)=>child.name.includes("_RIGHT_"));
  const arch = root.children.find((child)=>child.name.includes("POLISHED_ARCH_TOP"));
  const backplate = root.children.find((child)=>child.name.includes("READABILITY_BACKPLATE"));
  if (left) left.position.set(-half - .40, 0, 0);
  if (right) right.position.set(half + .40, 0, 0);
  if (arch) arch.position.set(0, 0, -0.020);
  if (backplate){
    backplate.position.set(0, 2.54, -0.055);
    backplate.scale.set(1,1,1);
  }

  root.traverse((child)=>{
    child.visible = true;
    child.userData.phase297DoorwayFrame = true;
    child.userData.phase297PlacementRule = "Pillars sit outside display edges; arch top above display; backplate behind display; portal opening remains clear.";
  });
  root.updateMatrixWorld(true);
  return { root, openingGap: (half + .40) * 2, leftX: bay.centerX - half - .40, rightX: bay.centerX + half + .40 };
}

function markPortalClearance(scene){
  let marked = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "").toUpperCase();
    if (!/PORTAL|ZONE|HITBOX|RING|PROMPT/.test(n) || !obj?.position) return;
    obj.userData.phase297PortalClearanceProtected = true;
    obj.userData.phase297NoFrameOverlap = true;
    obj.renderOrder = Math.max(obj.renderOrder || 0, PORTAL_RENDER_ORDER);
    marked += 1;
  });
  return marked;
}

function polishGlassRopesPlants(scene){
  let adjusted = 0;
  scene.traverse((obj)=>{
    if (!obj?.position || obj.userData?.phase297DoorwayFrame) return;
    const n = String(obj.name || "").toUpperCase();
    if (!/GLASS|ROPE|PLANT|POST/.test(n)) return;
    const overlapsBay = ALL_BAYS.some((bay)=>inBayOpening(obj, bay, 0.44));
    if (!overlapsBay) return;
    obj.userData.phase297DisplayClearanceAdjusted = true;
    if (/GLASS/.test(n)) obj.renderOrder = Math.min(obj.renderOrder || 20, 20);
    if (/ROPE|PLANT|POST/.test(n)){
      const sign = obj.position.x >= 0 ? 1 : -1;
      obj.position.x += sign * 0.10;
    }
    adjusted += 1;
  });
  return adjusted;
}

function apply(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const hiddenObstructions = hideBlockingOldColumns(scene);
  const frameResults = ALL_BAYS.map((bay)=>makeBayFrame(scene, bay));
  const displaysProtected = protectDisplays(scene);
  const portalsProtected = markPortalClearance(scene);
  const decorAdjusted = polishGlassRopesPlants(scene);
  window.SVR_PHASE297_LOBBY_GEOMETRY_POLISH_ALIGNMENT_LOCK = {
    build: LABEL,
    active: true,
    siteTouched: false,
    publicRootTouched: false,
    pokerLogicTouched: false,
    locomotionTouched: false,
    watchTouched: false,
    moonMarsTouched: false,
    frameCount: frameResults.length,
    bayKeys: ALL_BAYS.map((bay)=>bay.key),
    measuredOpenings: frameResults.map(({root, openingGap, leftX, rightX})=>({ name:root.name, openingGap:Number(openingGap.toFixed(2)), leftX:Number(leftX.toFixed(2)), rightX:Number(rightX.toFixed(2)) })),
    minimumOpeningGap: MIN_OPENING_GAP,
    hiddenObstructions,
    displaysProtected,
    portalsProtected,
    decorAdjusted,
    rule: "Tight polished geometry: readable display inside doorway, pillars outside edges, arch above panel, backplate behind panel, portal/walk path clear.",
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (apply() || tries > 220) clearInterval(timer); }, 125);
[400,900,1500,2400,3600,5200,8000,12000,18000,24000,32000].forEach((delay)=>setTimeout(apply, delay));
