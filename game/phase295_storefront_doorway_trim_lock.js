import * as THREE from "three";

const LABEL = "PHASE-84-LOBBY-VISUAL-MATCH-PORTAL-POLISH-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const VIOLET = 0x9c6dff;
const STONE = 0xd8c2a4;
const SHADOW_STONE = 0x6b5a48;
const BACKPLATE = 0x03050b;
const REAR_Z = -16.58;
const SIDE_Z = 6.24;
const DISPLAY_RENDER_ORDER = 180;
const FRAME_RENDER_ORDER = 46;
const PORTAL_RENDER_ORDER = 210;
const MIN_OPENING_GAP = 3.40;
const WALKWAY_HALF_WIDTH = 1.35;

const REAR_BAYS = [
  { key:"rear_west", centerX:-12, width:3.92, z:REAR_Z, ry:0, label:"WELLNESS" },
  { key:"rear_mid_west", centerX:-6, width:3.88, z:REAR_Z, ry:0, label:"PLAY" },
  { key:"rear_center", centerX:0, width:4.08, z:REAR_Z, ry:0, label:"PLAY GAME" },
  { key:"rear_mid_east", centerX:6, width:3.88, z:REAR_Z, ry:0, label:"PGA" },
  { key:"rear_east", centerX:12, width:3.92, z:REAR_Z, ry:0, label:"SCORPION" }
];

const SIDE_BAYS = [
  { key:"side_wellness", centerX:-8.15, width:4.28, z:SIDE_Z, ry:Math.PI, label:"WELLNESS HUB" },
  { key:"side_store", centerX:8.15, width:4.28, z:SIDE_Z, ry:Math.PI, label:"STORE / SPONSOR" }
];

const ALL_BAYS = [...REAR_BAYS, ...SIDE_BAYS];

function standardMat(color, emissive = 0x000000, intensity = 0.10){
  return new THREE.MeshStandardMaterial({ color, roughness:.50, metalness:.14, emissive, emissiveIntensity:intensity });
}

function glowMat(color, opacity=.50){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}

function darkPanelMat(opacity=.66){
  return new THREE.MeshBasicMaterial({ color:BACKPLATE, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false });
}

function isDisplayLikeName(name){
  return /SIGN|DISPLAY|PANEL|PORTAL|HOLOGRAM|STORE|REIKI|WELLNESS|PGA|SCORPION|SPONSOR|INFO|ARCH_BAY|PROMPT|ZONE|BOARD|SCREEN|JUMBOTRON|BANNER|BUTTON|LEGEND/i.test(name || "");
}

function inBayOpening(obj, bay, extra = 0.30){
  if (!obj?.position) return false;
  const x = Number(obj.position.x || 0);
  const z = Number(obj.position.z || 0);
  return Math.abs(x - bay.centerX) <= (bay.width * 0.5 + extra) && Math.abs(z - bay.z) <= 2.10;
}

function hideBlockingOldColumns(scene){
  let hidden = 0;
  scene.traverse((obj)=>{
    if (!obj?.position || obj.userData?.phase84DoorwayFrame) return;
    const n = String(obj.name || "").toUpperCase();
    const isColumn = /COLUMN|PILLAR|ARCH_POST|ROMAN_CANOPY|REAR_ORDERED_COLUMN|REAR_COLUMN/.test(n);
    if (!isColumn) return;
    const blocksAnyBay = ALL_BAYS.some((bay)=>inBayOpening(obj, bay, 0.20));
    const oldRearColumn = obj.position.z < -10.25 && /COLUMN|PILLAR/.test(n);
    const redCarpetBlock = Math.abs(obj.position.x || 0) < WALKWAY_HALF_WIDTH && obj.position.z > -7.0 && obj.position.z < 8.75;
    if (blocksAnyBay || oldRearColumn || redCarpetBlock){
      if (obj.visible !== false) hidden += 1;
      obj.visible = false;
      obj.userData.phase84HiddenDoorwayObstruction = true;
      obj.traverse?.((child)=>{ child.visible = false; child.userData.phase84HiddenDoorwayObstruction = true; });
    }
  });
  return hidden;
}

function protectDisplays(scene){
  let protectedCount = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "");
    if (!isDisplayLikeName(n) || !obj?.position || obj.userData?.phase84DoorwayFrame) return;
    const nearBay = ALL_BAYS.some((bay)=>inBayOpening(obj, bay, 1.36));
    if (!nearBay) return;
    obj.renderOrder = Math.max(obj.renderOrder || 0, DISPLAY_RENDER_ORDER);
    obj.userData.phase84DisplayReadabilityProtected = true;
    obj.userData.phase84NoPillarOverlap = true;
    obj.traverse?.((child)=>{
      child.renderOrder = Math.max(child.renderOrder || 0, DISPLAY_RENDER_ORDER);
      child.userData.phase84DisplayReadabilityProtected = true;
      child.userData.phase84NoPillarOverlap = true;
      if (child.material){
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m)=>{ if(m){ m.depthWrite = false; m.needsUpdate = true; }});
      }
    });
    protectedCount += 1;
  });
  return protectedCount;
}

function makePillar(name, sideSign){
  const group = new THREE.Group();
  group.name = `${name}_CASINO_PILLAR_OUTSIDE_TEXT`;
  group.userData.phase84DoorwayFrame = true;
  const stone = standardMat(STONE, 0x1b1007, .16);
  const shadow = standardMat(SHADOW_STONE, 0x090603, .08);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(.24, 4.72, .20), stone);
  shaft.name = `${name}_SLIM_SHAFT_CLEAR_OF_DISPLAY`;
  shaft.position.y = 2.42;
  const innerShadow = new THREE.Mesh(new THREE.BoxGeometry(.050, 4.40, .030), shadow);
  innerShadow.name = `${name}_INNER_DEPTH_SHADOW`;
  innerShadow.position.set(-sideSign * .146, 2.46, .040);
  const base = new THREE.Mesh(new THREE.BoxGeometry(.58, .22, .36), stone);
  base.name = `${name}_WIDE_BASE_OFF_WALKWAY`;
  base.position.y = .11;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(.62, .24, .38), stone);
  cap.name = `${name}_CAP_OUTSIDE_DISPLAY_EDGE`;
  cap.position.y = 4.86;
  const neon = new THREE.Mesh(new THREE.BoxGeometry(.032, 4.22, .046), glowMat(CYAN, .34));
  neon.name = `${name}_THIN_CYAN_EDGE_LIGHT`;
  neon.position.set(sideSign * .158, 2.48, .040);
  const goldToe = new THREE.Mesh(new THREE.BoxGeometry(.40, .034, .052), glowMat(GOLD, .44));
  goldToe.name = `${name}_LOWER_GOLD_ALIGNMENT_MARK`;
  goldToe.position.y = .42;
  const violetAccent = new THREE.Mesh(new THREE.BoxGeometry(.030, 3.60, .036), glowMat(VIOLET, .24));
  violetAccent.name = `${name}_PURPLE_LOBBY_ACCENT`;
  violetAccent.position.set(-sideSign * .185, 2.50, .046);
  group.add(shaft, innerShadow, base, cap, neon, goldToe, violetAccent);
  group.traverse((child)=>{ child.userData.phase84DoorwayFrame = true; child.renderOrder = FRAME_RENDER_ORDER; });
  return group;
}

function makeArchTop(name, width){
  const group = new THREE.Group();
  group.name = `${name}_CURVED_CASINO_ARCH_TOP`;
  group.userData.phase84DoorwayFrame = true;
  const stone = standardMat(STONE, 0x1b1007, .16);
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + .88, .26, .22), stone);
  top.name = `${name}_TOP_BEAM_ABOVE_READABLE_PANEL`;
  top.position.y = 5.06;
  const innerBeam = new THREE.Mesh(new THREE.BoxGeometry(width - .10, .055, .060), glowMat(GOLD, .48));
  innerBeam.name = `${name}_INNER_GOLD_ARCH_LINE`;
  innerBeam.position.y = 4.71;
  const outerGlow = new THREE.Mesh(new THREE.BoxGeometry(width + .58, .046, .060), glowMat(VIOLET, .27));
  outerGlow.name = `${name}_OUTER_PURPLE_ARCH_GLOW`;
  outerGlow.position.y = 5.24;
  const crown = new THREE.Mesh(new THREE.BoxGeometry(width * .36, .12, .050), glowMat(GOLD, .26));
  crown.name = `${name}_CENTER_CROWN_GLOW`;
  crown.position.y = 5.43;
  group.add(top, innerBeam, outerGlow, crown);
  group.traverse((child)=>{ child.userData.phase84DoorwayFrame = true; child.renderOrder = FRAME_RENDER_ORDER + 1; });
  return group;
}

function makeBackplate(name, width){
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(width - .10, 4.12), darkPanelMat(.52));
  plate.name = `${name}_DARK_READABILITY_BACKPLATE`;
  plate.position.set(0, 2.62, -0.060);
  plate.renderOrder = 8;
  plate.userData.phase84DoorwayFrame = true;
  plate.userData.phase84ReadabilityBackplate = true;
  return plate;
}

function makeThreshold(name, width){
  const group = new THREE.Group();
  group.name = `${name}_FLOOR_THRESHOLD_POLISH`;
  group.userData.phase84DoorwayFrame = true;
  const sill = new THREE.Mesh(new THREE.BoxGeometry(width + .34, .030, .060), glowMat(GOLD, .28));
  sill.name = `${name}_GOLD_PORTAL_THRESHOLD`;
  sill.position.set(0, .035, .045);
  const inset = new THREE.Mesh(new THREE.BoxGeometry(width - .28, .020, .052), glowMat(CYAN, .18));
  inset.name = `${name}_CYAN_SAFE_ENTRY_LINE`;
  inset.position.set(0, .058, .080);
  group.add(sill, inset);
  group.traverse((child)=>{ child.userData.phase84DoorwayFrame = true; child.renderOrder = FRAME_RENDER_ORDER + 2; });
  return group;
}

function makeBayFrame(scene, bay){
  const name = `PHASE84_ARCH_PORTAL_${bay.key}`;
  let root = scene.getObjectByName(name);
  if (!root){
    root = new THREE.Group();
    root.name = name;
    root.userData.phase84DoorwayFrame = true;
    scene.add(root);
    root.add(makeBackplate(name, bay.width));
    root.add(makePillar(`${name}_LEFT`, -1));
    root.add(makePillar(`${name}_RIGHT`, 1));
    root.add(makeArchTop(name, bay.width));
    root.add(makeThreshold(name, bay.width));
  }
  root.visible = true;
  root.position.set(bay.centerX, 0, bay.z);
  root.rotation.set(0, bay.ry || 0, 0);
  root.scale.set(1,1,1);

  const half = Math.max(MIN_OPENING_GAP * 0.5, bay.width * 0.5);
  const left = root.children.find((child)=>child.name.includes("_LEFT_"));
  const right = root.children.find((child)=>child.name.includes("_RIGHT_"));
  const arch = root.children.find((child)=>child.name.includes("CURVED_CASINO_ARCH_TOP"));
  const backplate = root.children.find((child)=>child.name.includes("DARK_READABILITY_BACKPLATE"));
  const threshold = root.children.find((child)=>child.name.includes("FLOOR_THRESHOLD_POLISH"));
  if (left) left.position.set(-half - .46, 0, 0);
  if (right) right.position.set(half + .46, 0, 0);
  if (arch) arch.position.set(0, 0, -0.024);
  if (backplate) backplate.position.set(0, 2.62, -0.064);
  if (threshold) threshold.position.set(0, 0, .045);

  root.traverse((child)=>{
    child.visible = true;
    child.userData.phase84DoorwayFrame = true;
    child.userData.phase84PlacementRule = "Screenshot match: luxury arch frames display, pillars outside text, threshold clear, private portal remains reachable.";
  });
  root.updateMatrixWorld(true);
  return { root, openingGap: (half + .46) * 2, leftX: bay.centerX - half - .46, rightX: bay.centerX + half + .46 };
}

function markPortalClearance(scene){
  let marked = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "").toUpperCase();
    if (!/PORTAL|ZONE|HITBOX|RING|PROMPT|BUTTON|WELLNESS|REIKI|PGA|LEGEND|SPONSOR|SCORPION|SEAT|LOBBY/.test(n) || !obj?.position) return;
    obj.userData.phase84PortalClearanceProtected = true;
    obj.userData.phase84NoFrameOverlap = true;
    obj.renderOrder = Math.max(obj.renderOrder || 0, PORTAL_RENDER_ORDER);
    marked += 1;
  });
  return marked;
}

function polishGlassRopesPlants(scene){
  let adjusted = 0;
  scene.traverse((obj)=>{
    if (!obj?.position || obj.userData?.phase84DoorwayFrame) return;
    const n = String(obj.name || "").toUpperCase();
    if (!/GLASS|ROPE|PLANT|POST|STANCHION|STATUE/.test(n)) return;
    const overlapsBay = ALL_BAYS.some((bay)=>inBayOpening(obj, bay, 0.54));
    if (!overlapsBay) return;
    obj.userData.phase84DisplayClearanceAdjusted = true;
    if (/GLASS/.test(n)) obj.renderOrder = Math.min(obj.renderOrder || 20, 20);
    if (/ROPE|PLANT|POST|STANCHION/.test(n)){
      const sign = obj.position.x >= 0 ? 1 : -1;
      obj.position.x += sign * 0.14;
    }
    adjusted += 1;
  });
  return adjusted;
}

function protectCentralWalkway(scene){
  let protectedCount = 0;
  scene.traverse((obj)=>{
    if (!obj?.position || obj.userData?.phase84DoorwayFrame) return;
    const n = String(obj.name || "").toUpperCase();
    if (!/PLANT|ROPE|POST|PILLAR|COLUMN|SIGN|BOARD|SCREEN/.test(n)) return;
    const inWalkway = Math.abs(obj.position.x || 0) < WALKWAY_HALF_WIDTH && obj.position.z > -8.0 && obj.position.z < 8.6;
    if (!inWalkway) return;
    obj.userData.phase84WalkwayProtected = true;
    if (/PLANT|ROPE|POST|PILLAR|COLUMN/.test(n)){
      const sign = obj.position.x >= 0 ? 1 : -1;
      obj.position.x += sign * .22;
    }
    protectedCount += 1;
  });
  return protectedCount;
}

function apply(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const hiddenObstructions = hideBlockingOldColumns(scene);
  const frameResults = ALL_BAYS.map((bay)=>makeBayFrame(scene, bay));
  const displaysProtected = protectDisplays(scene);
  const portalsProtected = markPortalClearance(scene);
  const decorAdjusted = polishGlassRopesPlants(scene);
  const walkwayProtected = protectCentralWalkway(scene);
  window.SVR_PHASE84_LOBBY_VISUAL_MATCH_PORTAL_POLISH_LOCK = {
    build: LABEL,
    active: true,
    screenshotTarget: "grand curved casino lobby with arched storefronts, readable jumbotrons, high Moon/Mars, clean portal buttons",
    siteTouched: false,
    publicRootTouched: false,
    pokerLogicTouched: false,
    locomotionTouched: false,
    watchTouched: false,
    privateSceneRoutingTouched: false,
    moonMarsTouched: false,
    frameCount: frameResults.length,
    bayKeys: ALL_BAYS.map((bay)=>bay.key),
    measuredOpenings: frameResults.map(({root, openingGap, leftX, rightX})=>({ name:root.name, openingGap:Number(openingGap.toFixed(2)), leftX:Number(leftX.toFixed(2)), rightX:Number(rightX.toFixed(2)) })),
    minimumOpeningGap: MIN_OPENING_GAP,
    hiddenObstructions,
    displaysProtected,
    portalsProtected,
    decorAdjusted,
    walkwayProtected,
    rule: "Lobby stays as-is: only polish arch geometry/readability/clearance. Private rooms stay outside lobby. No site changes.",
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (apply() || tries > 240) clearInterval(timer); }, 125);
[400,900,1500,2400,3600,5200,8000,12000,18000,24000,32000,42000].forEach((delay)=>setTimeout(apply, delay));
