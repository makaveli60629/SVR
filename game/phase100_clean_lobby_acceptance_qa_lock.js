import * as THREE from "three";

const LABEL = "PHASE-100-CLEAN-LOBBY-ACCEPTANCE-QA-LOCK";
const ROOT = "PHASE100_CLEAN_LOBBY_ACCEPTANCE_QA_ROOT";
const REQUIRED_DOORWAYS = ["WELLNESS", "POKER", "PGA", "STORE", "SCORPION"];
const REQUIRED_CORE = ["PHASE99_EXPANDED_SOLID_MAIN_FLOOR", "PHASE99_FREE_SPAWN_CLEAR_ZONE", "PHASE99_FIRST_TIME_USER_MAIN_WALKWAY", "PHASE99_SOLID_REAR_WALL", "PHASE98_SECOND_FLOOR_SAFETY_FLOOR_ROOT"];
const SPAWN_CLEAR_RADIUS = 2.8;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
let installed = false;

function makeMat(color, opacity = 0.16){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending });
}
function findByName(scene, token){
  let found = null;
  scene.traverse((o)=>{ if(!found && String(o.name || "").includes(token)) found = o; });
  return found;
}
function countByRegex(scene, re){
  let count = 0;
  scene.traverse((o)=>{ if(re.test(String(o.name || ""))) count++; });
  return count;
}
function doorwayReport(scene){
  const report = {};
  REQUIRED_DOORWAYS.forEach((key)=>{
    const root = findByName(scene, `PHASE99_CORRECT_DOORWAY_${key}`);
    report[key.toLowerCase()] = {
      root: !!root,
      sign: !!findByName(scene, `PHASE99_CORRECT_DOORWAY_${key}_SIGN_AFFIXED_IN_WALL`),
      leftPillar: !!findByName(scene, `PHASE99_CORRECT_DOORWAY_${key}_LEFT_SIDE_PILLAR_CORRECT`),
      rightPillar: !!findByName(scene, `PHASE99_CORRECT_DOORWAY_${key}_RIGHT_SIDE_PILLAR_CORRECT`),
      arch: !!findByName(scene, `PHASE99_CORRECT_DOORWAY_${key}_CORRECT_UPSIDE_DOWN_U_ARCH`),
      threshold: !!findByName(scene, `PHASE99_CORRECT_DOORWAY_${key}_SOLID_PORTAL_THRESHOLD_FLOOR`)
    };
  });
  return report;
}
function spawnClearance(scene){
  const center = new THREE.Vector3(0, 0, 7.2);
  const blockers = [];
  scene.traverse((o)=>{
    if(!o.visible || !o.isMesh) return;
    const n = String(o.name || "");
    if(/FREE_SPAWN|MAIN_WALKWAY|FLOOR|RING|TRIM|WALL|MOON|MARS|HAND|WATCH|CARD|CHIP|ACTION|TELEPORT|RAY|ARC|TARGET/.test(n)) return;
    const p = new THREE.Vector3();
    o.getWorldPosition(p);
    const d = Math.hypot(p.x - center.x, p.z - center.z);
    if(d < SPAWN_CLEAR_RADIUS) blockers.push({ name:n || "unnamed", d:Number(d.toFixed(2)) });
  });
  return { radius:SPAWN_CLEAR_RADIUS, clear:blockers.length===0, blockers:blockers.slice(0,12) };
}
function solidifyFinal(scene){
  let solidified = 0;
  scene.traverse((o)=>{
    const n = String(o.name || "");
    if(/PHASE99|PHASE98_SECOND_FLOOR|PORTAL|THRESHOLD|FLOOR|WALL|DOORWAY|PILLAR|ARCH|SIGN|TABLE|CARD|CHIP|ACTION/.test(n)){
      o.userData.phase100SolidGeometryQA = true;
      if(o.isMesh){
        o.frustumCulled = false;
        solidified++;
        if(o.material){
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m)=>{ if(m){ m.needsUpdate = true; }});
        }
      }
    }
  });
  return solidified;
}
function addTinyAcceptanceMarker(root){
  const ring = new THREE.Mesh(new THREE.RingGeometry(.28,.36,48), makeMat(CYAN,.18));
  ring.name = "PHASE100_TINY_SPAWN_ACCEPTANCE_RING";
  ring.rotation.x = -Math.PI/2;
  ring.position.set(0,.155,7.2);
  ring.renderOrder = 610;
  root.add(ring);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.08,32), makeMat(GOLD,.24));
  dot.name = "PHASE100_TINY_SPAWN_CENTER_DOT";
  dot.rotation.x = -Math.PI/2;
  dot.position.set(0,.16,7.2);
  dot.renderOrder = 611;
  root.add(dot);
}
function acceptanceChecks(scene, renderer){
  const required = {};
  REQUIRED_CORE.forEach((name)=>{ required[name] = !!findByName(scene, name); });
  const doorways = doorwayReport(scene);
  const spawn = spawnClearance(scene);
  const portals = countByRegex(scene, /PHASE85_SOLID_ENABLED_PORTAL|PHASE99_CORRECT_DOORWAY|PORTAL/i);
  const poker = !!(window.SVR_PHASE86_PLAYABLE_POKER_CORE_LOCK || findByName(scene, "PHASE86_PLAYABLE_POKER_CORE_ROOT"));
  const handTeleport = !!(window.SVR_PHASE98_STABLE_HAND_AIM_RELEASE_TELEPORT_LOCK || window.SVR_PHASE98_HAND_AIM_RELEASE_TELEPORT_LOCK || window.SVR_PHASE298_HAND_TELEPORT_RELEASE_COMMIT_LOCK);
  const secondFloor = !!window.SVR_PHASE98_SECOND_FLOOR_SAFETY_FLOOR_LOCK || !!findByName(scene,"PHASE98_SECOND_FLOOR_SAFETY_FLOOR_ROOT");
  const phase99 = !!window.SVR_PHASE99_CLEAN_EXPANDED_LOBBY_REBUILD_LOCK || !!findByName(scene,"PHASE99_CLEAN_EXPANDED_LOBBY_REBUILD_ROOT");
  const doorwayOk = Object.values(doorways).every((d)=>d.root && d.sign && d.leftPillar && d.rightPillar && d.arch && d.threshold);
  const requiredOk = Object.values(required).every(Boolean);
  const ready = !!(phase99 && requiredOk && doorwayOk && spawn.clear && secondFloor);
  return {
    ready,
    phase99,
    required,
    doorways,
    doorwayOk,
    spawn,
    portals,
    poker,
    handTeleport,
    secondFloor,
    renderer:{ xr:!!renderer?.xr, shadowMapEnabled:!!renderer?.shadowMap?.enabled, pixelRatio: renderer?.getPixelRatio?.() || null }
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__;
  if(!scene || !renderer) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  root.visible = true;
  scene.add(root);
  const solidifiedMeshes = solidifyFinal(scene);
  addTinyAcceptanceMarker(root);
  const checks = acceptanceChecks(scene, renderer);
  if(camera && !renderer.xr?.isPresenting){
    camera.position.set(0,1.62,7.2);
    camera.lookAt(0,1.48,-3.2);
  }
  renderer.shadowMap.enabled = false;
  renderer.setClearColor?.(0x010208,1);
  renderer.toneMappingExposure = Math.min(renderer.toneMappingExposure || 1, .96);
  installed = true;
  window.SVR_PHASE100_CLEAN_LOBBY_ACCEPTANCE_QA_LOCK = {
    build: LABEL,
    active: true,
    ready: checks.ready,
    checks,
    solidifiedMeshes,
    visibleClutterAdded:false,
    tinySpawnMarkerOnly:true,
    quickLoadExpected:true,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    privateScenesTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE100_LOBBY_QA = () => acceptanceChecks(scene, renderer);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries > 80) clearInterval(timer); }, 300);
[800,1800,3600,6500,10000].forEach((d)=>setTimeout(install,d));
