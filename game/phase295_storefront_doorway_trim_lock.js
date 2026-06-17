import * as THREE from "three";

const LABEL = "PHASE-295-STOREFRONT-DOORWAY-TRIM-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const REAR_Z = -16.38;
const DOOR_CENTERS = [-12, -6, 0, 6, 12];
const DOOR_HALF_WIDTH = 1.78;
const EDGE_X = [-13.78, -10.22, -7.78, -4.22, -1.78, 1.78, 4.22, 7.78, 10.22, 13.78];

function mat(color, emissive = 0x000000, intensity = 0.10){
  return new THREE.MeshStandardMaterial({ color, roughness:.58, metalness:.08, emissive, emissiveIntensity:intensity });
}
function glow(color, opacity=.50){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function hideCenterObstructions(scene){
  let hidden = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "").toUpperCase();
    if (!n.includes("COLUMN") || !obj.position || obj.userData?.phase295DoorTrim) return;
    if (obj.position.z > -10.8) return;
    const x = Number(obj.position.x || 0);
    const blocksDoor = DOOR_CENTERS.some((center)=>Math.abs(x - center) < DOOR_HALF_WIDTH * 0.78);
    const oldRear = n.includes("REAR_ORDERED_COLUMN") || n.includes("REAR_COLUMN") || n.includes("PILLAR");
    if (blocksDoor || oldRear){
      if (obj.visible !== false) hidden += 1;
      obj.visible = false;
      obj.userData.phase295HiddenDoorwayObstruction = true;
      obj.traverse?.((child)=>{ child.visible = false; child.userData.phase295HiddenDoorwayObstruction = true; });
    }
  });
  return hidden;
}
function makeTrim(scene, x, index){
  let group = scene.getObjectByName(`PHASE295_DOORWAY_TRIM_${index}`);
  if (!group){
    group = new THREE.Group();
    group.name = `PHASE295_DOORWAY_TRIM_${index}`;
    group.userData.phase295DoorTrim = true;
    scene.add(group);
    const stone = mat(0xd6c2a4, 0x140b03, .12);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(.22, 4.62, .20), stone);
    shaft.name = `${group.name}_SLIM_SHAFT`;
    shaft.position.y = 2.36;
    shaft.userData.phase295DoorTrim = true;
    group.add(shaft);
    const base = new THREE.Mesh(new THREE.BoxGeometry(.44, .18, .30), stone);
    base.name = `${group.name}_LOWER_BASE`;
    base.position.y = .09;
    base.userData.phase295DoorTrim = true;
    group.add(base);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(.48, .20, .32), stone);
    cap.name = `${group.name}_UPPER_CAP`;
    cap.position.y = 4.76;
    cap.userData.phase295DoorTrim = true;
    group.add(cap);
    const neon = new THREE.Mesh(new THREE.BoxGeometry(.025, 4.35, .035), glow(CYAN, .42));
    neon.name = `${group.name}_CYAN_EDGE_LIGHT`;
    neon.position.set(.145, 2.42, .025);
    neon.userData.phase295DoorTrim = true;
    group.add(neon);
    const gold = new THREE.Mesh(new THREE.BoxGeometry(.34, .035, .05), glow(GOLD, .55));
    gold.name = `${group.name}_GOLD_HEADER_DOT`;
    gold.position.y = 4.98;
    gold.userData.phase295DoorTrim = true;
    group.add(gold);
  }
  group.visible = true;
  group.position.set(x, 0, REAR_Z);
  group.scale.set(1,1,1);
  group.traverse((child)=>{ child.visible = true; child.userData.phase295DoorTrim = true; });
  group.updateMatrixWorld(true);
  return group;
}
function clearSignSpace(scene){
  let panelsLifted = 0;
  DOOR_CENTERS.forEach((center)=>{
    scene.traverse((obj)=>{
      const n = String(obj.name || "").toUpperCase();
      if (!n.includes("SIGN") && !n.includes("ARCH_BAY")) return;
      if (!obj.position || Math.abs(obj.position.x - center) > 2.25 || obj.position.z > -12) return;
      obj.userData.phase295SignClearanceProtected = true;
      if (n.includes("SIGN")){
        obj.renderOrder = Math.max(obj.renderOrder || 0, 96);
        panelsLifted += 1;
      }
    });
  });
  return panelsLifted;
}
function apply(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const hiddenObstructions = hideCenterObstructions(scene);
  const trims = EDGE_X.map((x, i)=>makeTrim(scene, x, i + 1));
  const signsProtected = clearSignSpace(scene);
  window.SVR_PHASE295_STOREFRONT_DOORWAY_TRIM_LOCK = {
    build: LABEL,
    active: true,
    siteTouched: false,
    publicRootTouched: false,
    rearZ: REAR_Z,
    trimCount: trims.length,
    doorwayCenters: DOOR_CENTERS,
    hiddenObstructions,
    signsProtected,
    rule: "pillars frame doorway edges only; no pillars in sign centers",
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
