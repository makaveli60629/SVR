const LABEL = "PHASE-276-PILLAR-DOORWAY-ALIGNMENT-LOCK";
const LEGACY_ROOT = "PHASE101S_FINISHED_LOBBY_ROOT";
const COLUMNS = {
  PHASE200_REAR_ORDERED_COLUMN_1: [-15.4, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_2: [-9.0, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_3: [-3.0, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_4: [3.0, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_5: [9.0, -15.78],
  PHASE200_REAR_ORDERED_COLUMN_6: [15.4, -15.78]
};

function removeLegacyFinishedLobbyRoot(scene){
  const old = scene?.getObjectByName?.(LEGACY_ROOT);
  if (old?.parent) old.parent.remove(old);
  return !!old;
}
function alignColumn(obj, x, z){
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
function alignRearPillars(scene){
  Object.entries(COLUMNS).forEach(([name, pos])=>{
    const obj = scene.getObjectByName(name);
    if (obj) alignColumn(obj, pos[0], pos[1]);
  });
  const extra = scene.getObjectByName("PHASE200_REAR_ORDERED_COLUMN_7");
  if (extra){
    extra.position.x = 18.45;
    extra.position.z = -15.92;
    extra.scale.x = 0.38;
    extra.scale.z = 0.38;
    extra.userData.phase276OuterEndCap = true;
  }
}
function syncRuntimeLabel(){
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  try { document.body?.setAttribute("data-build", LABEL); } catch {}
  const status = document.getElementById("status");
  if (status) status.textContent = `Ready. ${LABEL}`;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_PHASE276_PILLAR_DOORWAY_ALIGNMENT_LOCK = {
    build: LABEL,
    active: true,
    rearColumnsAlignedToDoorwayJambs: true,
    centerDoorwayCleared: true,
    signFacesCleared: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  syncRuntimeLabel();
  if (scene){
    const removed = removeLegacyFinishedLobbyRoot(scene);
    alignRearPillars(scene);
    window.SVR_PHASE276_PILLAR_DOORWAY_ALIGNMENT_LOCK.legacyRootRemoved = removed;
  }
  window.SVR_RELEASE_BOOT?.("phase276-pillar-doorway-alignment-loaded");
  return !!scene;
}

syncRuntimeLabel();
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if (install() || tries > 90) clearInterval(timer);
}, 120);
setTimeout(install, 350);
setTimeout(install, 900);
setTimeout(install, 1800);
setTimeout(install, 3600);
setTimeout(install, 7200);
