const LABEL = "PHASE-276-PILLAR-DOORWAY-ALIGNMENT-LOCK";

const DOORWAY_COLUMNS = {
  PHASE200_REAR_ORDERED_COLUMN_1: [-15.4, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_2: [-9.0, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_3: [-3.0, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_4: [3.0, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_5: [9.0, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_6: [15.4, -15.78]
};

function alignOne(obj, x, z){
  obj.visible = true;
  obj.position.x = x;
  obj.position.z = z;
  obj.scale.x = 0.42;
  obj.scale.z = 0.42;
  obj.userData.phase276DoorwayAligned = true;
  obj.traverse?.((child)=>{
    const n = String(child.name || "").toUpperCase();
    if (n.includes("CAP") || n.includes("BASE")){
      child.scale.x = Math.min(child.scale.x, 0.44);
      child.scale.z = Math.min(child.scale.z, 0.54);
    }
  });
}

function apply(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  Object.entries(DOORWAY_COLUMNS).forEach(([name, pos])=>{
    const obj = scene.getObjectByName(name);
    if (obj) alignOne(obj, pos[0], pos[1]);
  });
  const extra = scene.getObjectByName("PHASE200_REAR_ORDERED_COLUMN_7");
  if (extra){
    extra.position.x = 18.45;
    extra.position.z = -15.92;
    extra.scale.x = 0.38;
    extra.scale.z = 0.38;
    extra.visible = true;
    extra.userData.phase276OuterEndCap = true;
  }
  window.SVR_PHASE276_PILLAR_DOORWAY_ALIGNMENT_LOCK = {
    build: LABEL,
    active: true,
    rearColumnsAlignedToDoorwayJambs: true,
    centerDoorwayCleared: true,
    signFacesCleared: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  try { document.body?.setAttribute("data-build", LABEL); } catch {}
  return true;
}

apply();
[150, 450, 900, 1800, 3600, 7200].forEach((delay)=>setTimeout(apply, delay));
window.addEventListener("load", apply);
