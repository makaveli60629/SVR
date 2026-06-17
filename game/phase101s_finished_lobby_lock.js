const LABEL = "PHASE-281-PILLAR-FINAL-WALL-FLUSH-LOCK";
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
  document.title = `SVR Poker • ${LABEL}`;
  document.body?.setAttribute("data-build", LABEL);
  const status = document.getElementById("status");
  if (status) status.textContent = `Ready. ${LABEL}`;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_PHASE281_PILLAR_FINAL_WALL_FLUSH_LOCK = { build: LABEL, active: true, rearZ: REAR_Z, siteTouched: false, checkedAt: new Date().toISOString() };
}
function fit(obj, x, z){
  obj.visible = true;
  obj.position.x = x;
  obj.position.z = z;
  obj.scale.x = 0.26;
  obj.scale.z = 0.24;
  obj.userData.phase281FinalWallFlush = true;
  obj.traverse?.((child)=>{
    const n = String(child.name || "").toUpperCase();
    if (n.includes("CAP") || n.includes("BASE")){
      child.scale.x = Math.min(child.scale.x, 0.28);
      child.scale.z = Math.min(child.scale.z, 0.30);
    }
  });
}
function apply(){
  label();
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  Object.entries(COLUMNS).forEach(([name, p])=>{ const obj = scene.getObjectByName(name); if (obj) fit(obj, p[0], p[1]); });
  const extra = scene.getObjectByName("PHASE200_REAR_ORDERED_COLUMN_7");
  if (extra) fit(extra, 18.55, -16.44);
  window.SVR_PHASE281_PILLAR_FINAL_WALL_FLUSH_LOCK.applied = true;
  window.SVR_RELEASE_BOOT?.("phase281-pillar-final-wall-flush-loaded");
  return true;
}
apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (apply() || tries > 130) clearInterval(timer); }, 120);
[350,900,1800,3600,7200,9400,12000,15000].forEach((t)=>setTimeout(apply,t));
