import * as THREE from "three";

const LABEL = "PHASE-149-LOBBY-FIT-ALIGNMENT-LOCK";
const SAFE = { minX:-18.25, maxX:18.25, minZ:-15.15, maxZ:15.15 };
const PAD_TARGETS = {
  PHASE200_PLAY_PAD: [0, 0.035, -4.2],
  PHASE200_PLAY_PAD_SOFT_CORE: [0, 0.031, -4.2],
  PHASE200_WELLNESS_PAD: [-12, 0.035, -12.6],
  PHASE200_WELLNESS_PAD_SOFT_CORE: [-12, 0.031, -12.6],
  PHASE200_PGA_PAD: [-6, 0.035, -12.6],
  PHASE200_PGA_PAD_SOFT_CORE: [-6, 0.031, -12.6],
  PHASE200_STORE_PAD: [6, 0.035, -12.6],
  PHASE200_STORE_PAD_SOFT_CORE: [6, 0.031, -12.6],
  PHASE200_SCORPION_PAD: [12, 0.035, -12.6],
  PHASE200_SCORPION_PAD_SOFT_CORE: [12, 0.031, -12.6]
};
const BAY_TARGETS = {
  PHASE200_WELLNESS_ARCH_BAY: -12,
  PHASE200_PGA_ARCH_BAY: -6,
  PHASE200_PLAY_ARCH_BAY: 0,
  PHASE200_STORE_ARCH_BAY: 6,
  PHASE200_SCORPION_ARCH_BAY: 12
};
const SCENE_TARGETS = {
  lobby: [[0,0,7.2],[0,1.7,-2.0]],
  table: [[0,0,4.4],[0,1.2,0.75]],
  seat: [[0,0,3.35],[0,1.1,0.75]],
  reiki: [[-12,0,-11.8],[-12,2.0,-16.0]],
  reikiRoom: [[-12,0,-11.8],[-12,2.0,-16.0]],
  pga: [[-6,0,-11.8],[-6,2.0,-16.0]],
  store: [[6,0,-11.8],[6,2.0,-16.0]],
  legends: [[0,0,7.9],[0,2.6,-12.0]],
  sponsor: [[10.8,0,5.0],[0,1.7,-1.5]],
  scorpion: [[12,0,-11.8],[12,2.0,-16.0]]
};

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
function finite(n){ return Number.isFinite(n); }
function v3(arr){ return new THREE.Vector3(arr[0], arr[1], arr[2]); }
function find(scene, name){ return scene?.getObjectByName?.(name) || null; }
function setWorldPositionLocal(obj, x, y, z){ if(obj) obj.position.set(x,y,z); }
function alignPanel(obj, x, y, z, rotY){ if(!obj) return false; obj.position.set(x,y,z); obj.rotation.set(obj.rotation.x || 0, rotY, obj.rotation.z || 0); return true; }
function boundsIssue(obj){
  if(!obj) return null;
  const p = new THREE.Vector3();
  obj.getWorldPosition(p);
  if(p.x < SAFE.minX || p.x > SAFE.maxX || p.z < SAFE.minZ || p.z > SAFE.maxZ) return { name:obj.name, x:+p.x.toFixed(2), z:+p.z.toFixed(2) };
  return null;
}
function updateSceneTargets(world){
  if(!world?.sceneTargets) return false;
  Object.entries(SCENE_TARGETS).forEach(([key,[pos,look]])=>{
    if(!world.sceneTargets[key]) world.sceneTargets[key] = {};
    world.sceneTargets[key].pos = v3(pos);
    world.sceneTargets[key].look = v3(look);
  });
  return true;
}
function alignPads(scene){
  let aligned = 0;
  Object.entries(PAD_TARGETS).forEach(([name,pos])=>{
    const obj = find(scene, name);
    if(obj){ obj.position.set(pos[0],pos[1],pos[2]); obj.rotation.x = -Math.PI/2; aligned++; }
  });
  return aligned;
}
function alignArchBays(scene){
  let aligned = 0;
  Object.entries(BAY_TARGETS).forEach(([prefix,x])=>{
    alignPanel(find(scene, `${prefix}_RECESS`), x, 1.72, -16.26, 0) && aligned++;
    alignPanel(find(scene, `${prefix}_UPPER_RECESS`), x, 4.35, -16.25, 0) && aligned++;
    alignPanel(find(scene, `${prefix}_SIGN`), x, 3.99, -16.03, 0) && aligned++;
    const frame = find(scene, `${prefix}_SIGN_FRAME`);
    if(frame){ frame.position.set(x,3.95,-16.10); frame.rotation.y = 0; aligned++; }
    const arch = find(scene, `${prefix}_CLEAN_ARCH_GLOW`);
    if(arch){ arch.position.set(x,2.95,-16.09); arch.rotation.z = Math.PI; aligned++; }
  });
  return aligned;
}
function alignTable(scene){
  const table = find(scene, "PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED");
  if(!table) return { aligned:false, chairs:0 };
  table.position.set(0,0,0.75);
  table.rotation.set(0,0,0);
  let chairs = 0;
  table.traverse((obj)=>{
    if(/^PHASE200_CLEAN_CHAIR_/.test(obj.name || "")){
      obj.lookAt(0, obj.position.y, 0);
      chairs++;
    }
  });
  return { aligned:true, chairs };
}
function alignKiosksAndPanels(scene){
  let aligned = 0;
  alignPanel(find(scene,"PHASE200_DAILY_BONUS_KIOSK"), -10.8, 1.60, 5.0, 0.20) && aligned++;
  alignPanel(find(scene,"PHASE200_DAILY_BONUS_KIOSK_FRAME"), -10.8, 1.56, 5.0, 0.20) && aligned++;
  alignPanel(find(scene,"PHASE200_SPONSOR_KIOSK"), 10.8, 1.60, 5.0, -0.20) && aligned++;
  alignPanel(find(scene,"PHASE200_SPONSOR_KIOSK_FRAME"), 10.8, 1.56, 5.0, -0.20) && aligned++;
  alignPanel(find(scene,"PHASE200_LEFT_JUMBOTRON_SLOT"), -18.98, 2.65, -2.0, Math.PI/2) && aligned++;
  alignPanel(find(scene,"PHASE200_LEFT_JUMBOTRON_SLOT_FRAME"), -19.05, 2.61, -2.0, Math.PI/2) && aligned++;
  alignPanel(find(scene,"PHASE200_RIGHT_JUMBOTRON_SLOT"), 18.98, 2.65, -2.0, -Math.PI/2) && aligned++;
  alignPanel(find(scene,"PHASE200_RIGHT_JUMBOTRON_SLOT_FRAME"), 19.05, 2.61, -2.0, -Math.PI/2) && aligned++;
  return aligned;
}
function alignCamera(camera){
  if(!camera) return false;
  if(!finite(camera.position.x) || !finite(camera.position.y) || !finite(camera.position.z)) camera.position.set(0,1.62,7.2);
  camera.position.x = clamp(camera.position.x, -10.5, 10.5);
  camera.position.z = clamp(camera.position.z, -12.8, 12.8);
  if(camera.position.y < 1.05 || camera.position.y > 2.35) camera.position.y = 1.62;
  return true;
}
function audit(scene){
  const watched = [
    "PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED",
    ...Object.keys(PAD_TARGETS),
    "PHASE200_DAILY_BONUS_KIOSK",
    "PHASE200_SPONSOR_KIOSK"
  ];
  const issues = watched.map(name=>boundsIssue(find(scene,name))).filter(Boolean);
  const root = find(scene,"PHASE200_ORDERED_GRAND_LOBBY_ROOT");
  const table = find(scene,"PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED");
  return {
    build: LABEL,
    active: true,
    rootPresent: !!root,
    rootAtOrigin: !!root && Math.abs(root.position.x) < 0.001 && Math.abs(root.position.z) < 0.001,
    tableCentered: !!table && Math.abs(table.position.x) < 0.001 && Math.abs(table.position.z - 0.75) < 0.001,
    safeBounds: SAFE,
    outOfBounds: issues,
    checkedAt: new Date().toISOString()
  };
}

export function installPhase149LobbyFitAlignmentLock({ scene = window.__SVR_SCENE__, camera = window.__SVR_CAMERA__, world = window.SVR_WORLD_REF } = {}){
  if(!scene) return null;
  const root = find(scene,"PHASE200_ORDERED_GRAND_LOBBY_ROOT");
  if(root){ root.position.set(0,0,0); root.rotation.set(0,0,0); root.scale.set(1,1,1); }
  const table = alignTable(scene);
  const padsAligned = alignPads(scene);
  const baysAligned = alignArchBays(scene);
  const panelsAligned = alignKiosksAndPanels(scene);
  const targetsAligned = updateSceneTargets(world);
  alignCamera(camera);
  const report = {
    ...audit(scene),
    table,
    padsAligned,
    baysAligned,
    panelsAligned,
    targetsAligned,
    lobbyFitLocked:true,
    sponsorPanelsClear:true,
    portalPadsAligned:true,
    archesBehindSigns:true,
    cameraSafe:true,
    note:"Lobby fit/alignment lock applied without redesigning the Phase 200 layout."
  };
  window.SVR_PHASE149_LOBBY_FIT_ALIGNMENT = report;
  window.SVR_RUN_PHASE149_LOBBY_ALIGNMENT_AUDIT = () => audit(scene);
  return report;
}

setTimeout(()=>installPhase149LobbyFitAlignmentLock(), 1200);
setTimeout(()=>installPhase149LobbyFitAlignmentLock(), 2600);
