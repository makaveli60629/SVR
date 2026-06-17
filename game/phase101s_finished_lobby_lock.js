const LABEL = "PHASE-283-PILLAR-MATRIX-APPLY-LOCK";
const REAR_Z = -16.42;
const COLUMNS = {
  PHASE200_REAR_ORDERED_COLUMN_1: [-15.4, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_2: [-9.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_3: [-3.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_4: [3.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_5: [9.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_6: [15.4, REAR_Z]
};
function label(){
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  try { document.body?.setAttribute("data-build", LABEL); } catch {}
  const status = document.getElementById("status");
  if (status) status.textContent = `Ready. ${LABEL}`;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_PHASE283_PILLAR_MATRIX_APPLY_LOCK = {
    build: LABEL,
    active: true,
    rearZ: REAR_Z,
    matrixUpdateForced: true,
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
function fit(obj, x, z){
  obj.visible = true;
  obj.position.x = x;
  obj.position.z = z;
  obj.scale.x = 0.26;
  obj.scale.z = 0.24;
  obj.userData.phase283MatrixApplied = true;
  obj.traverse?.((child)=>{
    const n = String(child.name || "").toUpperCase();
    child.visible = true;
    if (n.includes("CAP") || n.includes("BASE")){
      child.scale.x = Math.min(child.scale.x, 0.28);
      child.scale.z = Math.min(child.scale.z, 0.30);
    }
  });
  forceMatrix(obj);
}
function apply(){
  label();
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  Object.entries(COLUMNS).forEach(([name, p])=>{
    const obj = scene.getObjectByName(name);
    if (obj) fit(obj, p[0], p[1]);
  });
  const extra = scene.getObjectByName("PHASE200_REAR_ORDERED_COLUMN_7");
  if (extra) fit(extra, 18.55, -16.44);
  scene.updateMatrixWorld?.(true);
  window.SVR_PHASE283_PILLAR_MATRIX_APPLY_LOCK.applied = true;
  window.SVR_PHASE281_PILLAR_FINAL_WALL_FLUSH_LOCK = window.SVR_PHASE283_PILLAR_MATRIX_APPLY_LOCK;
  window.SVR_RELEASE_BOOT?.("phase283-pillar-matrix-apply-loaded");
  return true;
}
apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (apply() || tries > 150) clearInterval(timer); }, 100);
[250,600,1200,2400,4200,7200,10000,14000,18000].forEach((t)=>setTimeout(apply,t));
