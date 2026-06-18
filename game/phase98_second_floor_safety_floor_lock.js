import * as THREE from "three";

const LABEL = "PHASE-98-SECOND-FLOOR-SAFETY-FLOOR-LOCK";
const ROOT = "PHASE98_SECOND_FLOOR_SAFETY_FLOOR_ROOT";
const FLOOR_Y = 3.42;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xbd7cff;
let installed = false;

function mat(color, opacity=.72){
  return new THREE.MeshStandardMaterial({ color, roughness:.46, metalness:.12, emissive:color, emissiveIntensity:.055, transparent:true, opacity });
}
function glow(color, opacity=.22){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function makeFloor(root, name, x, z, w, d, color=0x101521){
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w,.12,d), mat(color,.86));
  floor.name = `PHASE98_SECOND_FLOOR_SAFE_SURFACE_${name}`;
  floor.position.set(x,FLOOR_Y,z);
  floor.receiveShadow = false;
  floor.userData.phase98SecondFloor = true;
  floor.userData.svrTeleportFloor = true;
  floor.userData.svrWalkable = true;
  root.add(floor);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(w+.08,.035,.08), glow(GOLD,.26));
  edge.name = `PHASE98_SECOND_FLOOR_GOLD_FRONT_EDGE_${name}`;
  edge.position.set(x,FLOOR_Y+.09,z+d/2);
  edge.renderOrder = 425;
  root.add(edge);
  return floor;
}
function makeRail(root, name, x, z, w, d){
  const front = new THREE.Mesh(new THREE.BoxGeometry(w,.10,.08), glow(CYAN,.18));
  front.name = `PHASE98_SECOND_FLOOR_LOW_SAFETY_RAIL_${name}_FRONT`;
  front.position.set(x,FLOOR_Y+.62,z+d/2);
  front.renderOrder = 426;
  root.add(front);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w,.08,.06), glow(PURPLE,.12));
  back.name = `PHASE98_SECOND_FLOOR_REAR_VISIBILITY_RAIL_${name}_BACK`;
  back.position.set(x,FLOOR_Y+.66,z-d/2);
  back.renderOrder = 426;
  root.add(back);
}
function addLandingMarker(root, name, x, z){
  const ring = new THREE.Mesh(new THREE.RingGeometry(.48,.72,64), glow(CYAN,.28));
  ring.name = `PHASE98_SECOND_FLOOR_TELEPORT_LANDING_RING_${name}`;
  ring.rotation.x = -Math.PI/2;
  ring.position.set(x,FLOOR_Y+.095,z);
  ring.renderOrder = 430;
  ring.userData.svrMagnetTarget = true;
  ring.userData.phase98SecondFloorLanding = true;
  root.add(ring);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.18,40), glow(GOLD,.36));
  dot.name = `PHASE98_SECOND_FLOOR_TELEPORT_LANDING_DOT_${name}`;
  dot.rotation.x = -Math.PI/2;
  dot.position.set(x,FLOOR_Y+.105,z);
  dot.renderOrder = 431;
  dot.userData.svrMagnetTarget = true;
  root.add(dot);
}
function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);

  makeFloor(root,"REAR_BALCONY",0,-13.25,31.5,6.55,0x101521);
  makeRail(root,"REAR_BALCONY",0,-13.25,31.5,6.55);
  makeFloor(root,"LEFT_BALCONY",-17.15,-3.05,5.15,20.9,0x0e1420);
  makeRail(root,"LEFT_BALCONY",-17.15,-3.05,5.15,20.9);
  makeFloor(root,"RIGHT_BALCONY",17.15,-3.05,5.15,20.9,0x0e1420);
  makeRail(root,"RIGHT_BALCONY",17.15,-3.05,5.15,20.9);

  addLandingMarker(root,"REAR_CENTER",0,-12.2);
  addLandingMarker(root,"REAR_LEFT",-7.2,-12.2);
  addLandingMarker(root,"REAR_RIGHT",7.2,-12.2);
  addLandingMarker(root,"LEFT_SIDE",-16.25,-2.1);
  addLandingMarker(root,"RIGHT_SIDE",16.25,-2.1);

  window.SVR_PHASE98_SECOND_FLOOR_SAFETY_FLOOR_LOCK = {
    build: LABEL,
    active: true,
    floorY: FLOOR_Y,
    surfaces: ["rear balcony", "left balcony", "right balcony"],
    teleportLandingRings: 5,
    magnetTargets: true,
    reason: "Second floor/balcony now has visible walkable surfaces so teleport does not land in dark air.",
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementLogicTouched:false,
    privateScenesTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  installed = true;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install() || tries > 180) clearInterval(timer); },300);
[1200,3200,6800,12000,19000].forEach((d)=>setTimeout(install,d));
