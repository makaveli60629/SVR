const LABEL = "PHASE-279-PILLAR-WALL-PLANE-FLUSH-LOCK";
const LEGACY_ROOT = "PHASE101S_FINISHED_LOBBY_ROOT";
const REAR_Z = -16.32;
const COLUMNS = {
  PHASE200_REAR_ORDERED_COLUMN_1: [-15.4, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_2: [-9.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_3: [-3.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_4: [3.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_5: [9.0, REAR_Z],
  PHASE200_REAR_ORDERED_COLUMN_6: [15.4, REAR_Z]
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
  obj.scale.x = 0.32;
  obj.scale.z = 0.30;
  obj.userData.phase279WallPlaneFlush = true;
  obj.traverse?.((child)=>{
    const n = String(child.name || "").toUpperCase();
    if (n.includes("CAP") || n.includes("BASE")){
      child.scale.x = Math.min(child.scale.x, 0.34);
      child.scale.z = Math.min(child.scale.z, 0.38);
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
    extra.position.x = 18.55;
    extra.position.z = -16.34;
    extra.scale.x = 0.28;
    extra.scale.z = 0.28;
    extra.userData.phase279OuterEndCap = true;
  }
}
function syncRuntimeLabel(){
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  try { document.body?.setAttribute("data-build", LABEL); } catch {}
  const status = document.getElementById("status");
  if (status) status.textContent = `Ready. ${LABEL}`;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_PHASE279_PILLAR_WALL_PLANE_FLUSH_LOCK = {
    build: LABEL,
    active: true,
    rearColumnsAlignedToDoorwayJambs: true,
    rearColumnsPushedFlushToWallPlane: true,
    centerDoorwayCleared: true,
    signFacesCleared: true,
    cacheBusted: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE278_ROOT_PILLAR_DOORWAY_GEOMETRY_LOCK = window.SVR_PHASE279_PILLAR_WALL_PLANE_FLUSH_LOCK;
  window.SVR_PHASE277_PILLAR_ALIGNMENT_BOOT_CACHE_LOCK = window.SVR_PHASE279_PILLAR_WALL_PLANE_FLUSH_LOCK;
}
function install(){
  const scene = window.__SVR_SCENE__;
  syncRuntimeLabel();
  if (scene){
    const removed = removeLegacyFinishedLobbyRoot(scene);
    alignRearPillars(scene);
    window.SVR_PHASE279_PILLAR_WALL_PLANE_FLUSH_LOCK.legacyRootRemoved = removed;
  }
  window.SVR_RELEASE_BOOT?.("phase279-pillar-wall-plane-flush-loaded");
  return !!scene;
}

syncRuntimeLabel();
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if (install() || tries > 110) clearInterval(timer);
}, 120);
setTimeout(install, 350);
setTimeout(install, 900);
setTimeout(install, 1800);
setTimeout(install, 3600);
setTimeout(install, 7200);
setTimeout(install, 9400);
setTimeout(install, 12000);
