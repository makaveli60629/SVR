import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-214-INPLACE-TURN-UPSTAIRS-FLOOR-BEAM-COLOR-LOCK";
const CYAN = 0x7ffcff;
const PURPLE = 0xb55cff;
const GOLD = 0xffd98a;
const GREEN = 0x8dffb4;

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE214 = {
    build: LABEL,
    active: true,
    inPlaceSnapTurn: true,
    upstairsFloors: true,
    matchedBeamColors: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
  ["hud","sceneNav","log","err","bootFallback","status","mode"].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.style.display = "none";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.visibility = "hidden";
  });
}
function floorY(x,z){
  const ax = Math.abs(x);
  if(ax >= 9.4 && ax <= 19.2 && z <= 9.5 && z >= -0.2) return THREE.MathUtils.clamp(((8.6-z)/8.0)*3.42,0,3.42);
  if(z <= -10.2 && z >= -16.1 && ax <= 19.4) return 3.42;
  if(ax >= 14.8 && ax <= 19.4 && z <= 7.2 && z >= -13.2) return 3.42;
  return 0;
}
function mat(color, opacity=.34){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function solidMat(color){ return new THREE.MeshStandardMaterial({ color, roughness:.72, metalness:.05, emissive:color, emissiveIntensity:.07 }); }
function addFloor(scene,name,x,z,sx,sz,color){
  if(scene.getObjectByName(name)) return;
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,.08,sz), solidMat(color));
  m.name = name;
  m.position.set(x,3.42,z);
  m.userData.svrUpperFloor = true;
  m.userData.svrFloorHeight = 3.42;
  scene.add(m);
  const edge = new THREE.Mesh(new THREE.RingGeometry(.9,1.02,96), mat(color,.42));
  edge.name = `${name}_CENTER_GLOW`;
  edge.position.set(x,3.48,z);
  edge.rotation.x = -Math.PI/2;
  edge.scale.set(sx*.33,sz*.33,1);
  scene.add(edge);
}
function addRamp(scene,name,x,z,rotY,color){
  if(scene.getObjectByName(name)) return;
  const g = new THREE.Group(); g.name = name; g.position.set(x,1.72,z); g.rotation.x = -0.47; g.rotation.y = rotY; scene.add(g);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.65,.10,8.6), mat(color,.36));
  ramp.name = `${name}_SOLID_VISIBLE_PATH`;
  g.add(ramp);
  const line = new THREE.Mesh(new THREE.BoxGeometry(.16,.04,8.65), mat(CYAN,.74));
  line.name = `${name}_CYAN_CENTER_LINE`;
  line.position.y = .08;
  g.add(line);
  const side1 = new THREE.Mesh(new THREE.BoxGeometry(.08,.08,8.55), mat(PURPLE,.56)); side1.position.x=-1.22; side1.position.y=.12; g.add(side1);
  const side2 = side1.clone(); side2.position.x=1.22; g.add(side2);
}
function addSign(scene,text,x,z,color){
  const name = `PHASE214_UPSTAIRS_SIGN_${text.replace(/\W+/g,"_")}`;
  if(scene.getObjectByName(name)) return;
  const c = document.createElement("canvas"); c.width=900; c.height=240; const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(1,4,10,.78)"; ctx.fillRect(0,0,900,240); ctx.strokeStyle=`#${color.toString(16).padStart(6,"0")}`; ctx.lineWidth=10; ctx.strokeRect(18,18,864,204);
  ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#fff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText(text,450,120);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4,.9), new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  mesh.name = name; mesh.position.set(x,4.8,z); scene.add(mesh);
}
function install(){
  stamp();
  window.SVR_PHASE214_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE213_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE212_FLOOR_HEIGHT = floorY;
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  addFloor(scene,"PHASE214_UPSTAIRS_REAR_MAIN_FLOOR",0,-13.05,34,5.2,0x12192a);
  addFloor(scene,"PHASE214_UPSTAIRS_LEFT_SIDE_FLOOR",-17.05,-3.0,4.2,19.5,0x111827);
  addFloor(scene,"PHASE214_UPSTAIRS_RIGHT_SIDE_FLOOR",17.05,-3.0,4.2,19.5,0x111827);
  addRamp(scene,"PHASE214_LEFT_FINAL_WALKABLE_STAIR_RAMP",-13.85,4.45,-0.38,GOLD);
  addRamp(scene,"PHASE214_RIGHT_FINAL_WALKABLE_STAIR_RAMP",13.85,4.45,0.38,GOLD);
  addSign(scene,"UPSTAIRS LOUNGE",0,-12.65,CYAN);
  addSign(scene,"EVENTS",-9.2,-12.65,GOLD);
  addSign(scene,"SPONSORS",9.2,-12.65,PURPLE);
  addSign(scene,"LEFT SKY WALK",-16.9,-3.0,CYAN);
  addSign(scene,"RIGHT SKY WALK",16.9,-3.0,CYAN);
  for(let i=0;i<10;i++){
    const nm = `PHASE214_MATCHED_UPSTAIRS_LIGHT_${i}`;
    if(scene.getObjectByName(nm)) continue;
    const light = new THREE.PointLight([CYAN,PURPLE,GOLD,GREEN][i%4],.42,8,2);
    light.name = nm;
    light.position.set(-17 + i*3.8,4.3,-12.4 + (i%2)*2.6);
    scene.add(light);
  }
  return true;
}
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>80) clearInterval(timer); },250);
[500,1600,3200,6400].forEach(ms=>setTimeout(install,ms));
