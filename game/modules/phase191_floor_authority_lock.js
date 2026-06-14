import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-199-GRAND-ATRIUM-FLOOR-AUTHORITY-LOCK";
const OFFICIAL_VISUAL_FLOORS = ["PHASE185_OFFICIAL_POLISHED_MARBLE_FLOOR", "PHASE195_ONE_VISUAL_FLOOR"];

function isOfficialVisualFloor(name){
  return OFFICIAL_VISUAL_FLOORS.includes(String(name || ""));
}

function isAllowedFloorDecoration(name){
  return /PHASE199_|PHASE198_UPSTAIRS|PHASE198_.*PAD|PHASE198_CENTER_CARPET_PATH|PHASE198_ROOM_TRIM|PHASE195_SUBTLE_FLOOR_GRID|PHASE195_.*PAD|PHASE185_FLOOR_INLAY_RING|Teleport|TELEPORT|Portal|PORTAL|PAD|Pointer|POINTER|Ring|RING|Watch|Hand|Controller/i.test(String(name || ""));
}

function isDuplicateFloorLike(obj){
  if (!obj?.isMesh) return false;
  const name = String(obj.name || "");
  if (isOfficialVisualFloor(name) || isAllowedFloorDecoration(name)) return false;
  if (/PHASE188_SECOND_FLOOR|PHASE188_VISIBLE_SECOND_FLOOR|PHASE188_UPPER_FLOOR|PHASE189_HARD_VISIBLE_SECOND_FLOOR|PHASE189_REAL_STAIR|PHASE189_UPPER_FLOOR|PHASE189_UPPER_STORE/i.test(name)) return true;
  if (/PHASE185_RECESSED_PLAY_GAME_STAGE|PHASE185_UPPER_STOREFRONT_WALKWAY_RING|PHASE185_ROMAN_BALCONY_BANISTER_RING/i.test(name)) return true;
  if (/floor|deck|walkway|ground|recessed|stage/i.test(name)) return true;
  const type = String(obj.geometry?.type || "");
  const y = obj.getWorldPosition ? obj.getWorldPosition(new THREE.Vector3()).y : (obj.position?.y || 0);
  const flatLarge = /CircleGeometry|PlaneGeometry|RingGeometry|TorusGeometry/i.test(type) && y > -0.12 && y < 3.8;
  return flatLarge && /floor|deck|walkway|stage|ring/i.test(name);
}

function scanAndLock(scene){
  let official = null;
  let hidden = 0;
  let visibleFloorLike = [];

  scene.traverse(obj=>{
    const name = String(obj.name || "");
    if (isOfficialVisualFloor(name)){
      official = obj;
      obj.visible = true;
      obj.userData.svrFloorAuthority = "visual-floor";
      obj.userData.svrCollisionAuthority = false;
      obj.userData.svrTeleportAuthority = false;
      obj.renderOrder = -10;
      return;
    }
    if (isDuplicateFloorLike(obj)){
      if (obj.visible !== false){ hidden++; }
      obj.visible = false;
      obj.userData.svrDuplicateFloorHidden = true;
      return;
    }
    if (obj?.isMesh && /floor|deck|walkway|ground|stage/i.test(name)){
      visibleFloorLike.push(name || obj.type);
    }
  });

  window.SVR_PHASE191_FLOOR_AUTHORITY = {
    label: LABEL,
    locked: true,
    issue: 95,
    visualFloor: official ? String(official.name || "official") : "missing",
    collisionFloor: "math-y0-reference-space-only",
    teleportSurface: "teleport-ray-y0-plus-constrainLobbyBounds",
    upstairsVisualAllowed: true,
    grandAtriumStructureAllowed: true,
    hiddenDuplicateFloors: hidden,
    remainingFloorLikeNames: visibleFloorLike.slice(0, 18),
    checkedAt: new Date().toISOString()
  };

  return { official, hidden, visibleFloorLike };
}

export function installPhase191FloorAuthorityLock(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return null;
  const state = scanAndLock(scene);
  setTimeout(()=>scanAndLock(scene), 200);
  setTimeout(()=>scanAndLock(scene), 900);
  setInterval(()=>scanAndLock(scene), 1100);
  console.log(`[Phase199] floor authority locked; hidden duplicate floors=${state.hidden}`);
  return window.SVR_PHASE191_FLOOR_AUTHORITY;
}

export function autoInstallPhase191FloorAuthorityLock(){
  const start = performance.now();
  const id = setInterval(()=>{
    if (window.__SVR_SCENE__){
      clearInterval(id);
      installPhase191FloorAuthorityLock();
    } else if (performance.now() - start > 16000){
      clearInterval(id);
    }
  }, 350);
}
