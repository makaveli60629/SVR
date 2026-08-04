const LABEL = "PHASE-284-PILLAR-OBSTRUCTION-SCAN-LOCK";
const REAR_Z = -16.46;
const JAMB_COLUMNS = {
  PHASE200_REAR_ORDERED_COLUMN_1: [-15.4, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_2: [-9.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_3: [-3.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_4: [3.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_5: [9.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_6: [15.4, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_7: [18.55, -16.48]
};
const DOOR_CENTERS = [-12, -6, 0, 6, 12];

function mark(){
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  try { document.body?.setAttribute("data-build", LABEL); } catch {}
  const status = document.getElementById("status");
  if (status) status.textContent = `Ready. ${LABEL}`;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_PHASE284_PILLAR_OBSTRUCTION_SCAN_LOCK = {
    build: LABEL,
    active: true,
    rearZ: REAR_Z,
    duplicateRearColumnScan: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
}
function forceMatrix(obj){
  obj.matrixAutoUpdate = true;
  obj.updateMatrix?.();
  obj.updateMatrixWorld?.(true);
  obj.traverse?.((child)=>{
    child.matrixAutoUpdate = true;
    child.updateMatrix?.();
    child.updateMatrixWorld?.(true);
  });
}
function slimColumn(obj, x, z){
  obj.visible = true;
  obj.position.x = x;
  obj.position.z = z;
  obj.scale.x = 0.24;
  obj.scale.z = 0.22;
  obj.userData.phase284DoorwayClear = true;
  obj.traverse?.((child)=>{
    child.visible = true;
    const n = String(child.name || "").toUpperCase();
    if (n.includes("CAP") || n.includes("BASE")){
      child.scale.x = Math.min(child.scale.x, 0.26);
      child.scale.z = Math.min(child.scale.z, 0.28);
    }
  });
  forceMatrix(obj);
}
function isNearDoorCenter(x){
  return DOOR_CENTERS.some((center)=>Math.abs(x - center) < 1.05);
}
function isRearColumn(obj){
  const n = String(obj.name || "").toUpperCase();
  return n.includes("COLUMN") && obj.position && obj.position.z < -10.8;
}
function apply(){
  mark();
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  Object.entries(JAMB_COLUMNS).forEach(([name, pos])=>{
    const obj = scene.getObjectByName(name);
    if (obj) slimColumn(obj, pos[0], pos[1]);
  });
  const hidden = [];
  scene.traverse((obj)=>{
    if (!isRearColumn(obj)) return;
    const name = String(obj.name || "");
    if (Object.prototype.hasOwnProperty.call(JAMB_COLUMNS, name)) return;
    const x = Number(obj.position.x || 0);
    if (isNearDoorCenter(x)){
      obj.visible = false;
      obj.userData.phase284HiddenDoorObstruction = true;
      hidden.push(name || "unnamed-column");
      obj.traverse?.((child)=>{ child.visible = false; child.userData.phase284HiddenDoorObstruction = true; });
      forceMatrix(obj);
    }
  });
  scene.updateMatrixWorld?.(true);
  window.SVR_PHASE284_PILLAR_OBSTRUCTION_SCAN_LOCK.applied = true;
  window.SVR_PHASE284_PILLAR_OBSTRUCTION_SCAN_LOCK.hiddenDoorObstructions = hidden.slice(0,20);
  window.SVR_PHASE283_PILLAR_MATRIX_APPLY_LOCK = window.SVR_PHASE284_PILLAR_OBSTRUCTION_SCAN_LOCK;
  window.SVR_PHASE281_PILLAR_FINAL_WALL_FLUSH_LOCK = window.SVR_PHASE284_PILLAR_OBSTRUCTION_SCAN_LOCK;
  window.SVR_RELEASE_BOOT?.("phase284-pillar-obstruction-scan-loaded");
  return true;
}
apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (apply() || tries > 180) clearInterval(timer); }, 100);
[250,600,1200,2400,4200,7200,10000,14000,18000,22000].forEach((t)=>setTimeout(apply,t));
