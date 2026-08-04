import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-212-WALKABLE-STAIR-RAMP-LOCK";

function label(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE212 = {
    build: LABEL,
    active: true,
    walkableStairRamp: true,
    floorHeightAliasesInstalled: true,
    noBounceIndex: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function stairHeight(x,z){
  const ax = Math.abs(x);
  const onStairStrip = ax >= 11.0 && ax <= 17.2 && z <= 8.7 && z >= 0.65;
  if (onStairStrip){
    const t = THREE.MathUtils.clamp((8.15 - z) / 7.25, 0, 1);
    return THREE.MathUtils.clamp(t * 3.42, 0, 3.42);
  }
  const upperRear = z <= -10.85 && z >= -15.4 && ax <= 18.4;
  const upperSide = ax >= 15.25 && ax <= 18.45 && z <= 6.65 && z >= -12.45;
  if (upperRear || upperSide) return 3.42;
  return 0;
}

function installHeightAliases(){
  window.SVR_PHASE212_FLOOR_HEIGHT = stairHeight;
  window.SVR_PHASE211_FLOOR_HEIGHT = stairHeight;
  window.SVR_PHASE209_FLOOR_HEIGHT = stairHeight;
}

function addRamp(scene, side){
  const name = side < 0 ? "PHASE212_LEFT_WALKABLE_STAIR_RAMP" : "PHASE212_RIGHT_WALKABLE_STAIR_RAMP";
  if (scene.getObjectByName(name)) return;
  const group = new THREE.Group();
  group.name = name;
  const x = side < 0 ? -13.9 : 13.9;
  group.position.set(x, 1.72, 4.55);
  group.rotation.x = -0.49;
  group.rotation.y = side < 0 ? -0.38 : 0.38;
  const mat = new THREE.MeshBasicMaterial({ color:0xffd98a, transparent:true, opacity:0.20, side:THREE.DoubleSide, depthWrite:false });
  const ramp = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 7.75), mat);
  ramp.name = `${name}_VISIBLE_GOLD_PATH`;
  group.add(ramp);
  const lineMat = new THREE.LineBasicMaterial({ color:0x7ffcff, transparent:true, opacity:0.78, depthWrite:false });
  const pts = [];
  for(let i=0;i<=12;i++){
    const u = i / 12;
    pts.push(new THREE.Vector3(0, -3.6 + u*7.2, 0.035));
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
  line.name = `${name}_CENTER_GUIDE_LINE`;
  group.add(line);
  scene.add(group);
}

function markStairObjects(scene){
  scene.traverse(obj=>{
    const n = String(obj.name || "");
    if (/STAIR_STEP|UPSTAIRS_.*WALKWAY/i.test(n)){
      obj.userData.svrWalkableStair = true;
      obj.userData.svrFloorHeight = true;
      obj.visible = true;
    }
  });
}

function install(){
  label();
  installHeightAliases();
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  markStairObjects(scene);
  addRamp(scene, -1);
  addRamp(scene, 1);
  window.SVR_PHASE212_STAIR_TEST = {
    leftBottom: stairHeight(-13.1, 7.8),
    leftTop: stairHeight(-16.0, 1.1),
    rightBottom: stairHeight(13.1, 7.8),
    rightTop: stairHeight(16.0, 1.1),
    upperRear: stairHeight(0, -13.0),
    checkedAt: new Date().toISOString()
  };
  return true;
}

let tries = 0;
const timer = setInterval(()=>{ tries++; if (install() || tries > 80) clearInterval(timer); },250);
[100,700,1600,3000,5200].forEach(ms=>setTimeout(install,ms));
