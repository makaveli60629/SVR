import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-193-PRELOAD-SKYLINE-POPIN-FILTER";

window.SVR_DISABLE_LEGACY_SKYLINE = true;
window.SVR_REFINED_LOBBY_GEOMETRY = true;
window.SVR_PHASE193_PRELOAD_FILTER = { label: LABEL, active: true, hiddenOnAdd: 0, checkedAt: new Date().toISOString() };

const BAD = [
  /PHASE123/i,
  /PHASE164/i,
  /PHASE168/i,
  /PHASE171/i,
  /PHASE173/i,
  /PHASE175/i,
  /PHASE176_LOBBY_ARENA/i,
  /PHASE176_JUMBOTRON/i,
  /PHASE183_ROMAN_MEZZANINE/i,
  /PHASE184_LOBBY_EXPERIENCE/i,
  /PHASE188/i,
  /PHASE189_HARD_VISIBLE_SECOND_FLOOR/i,
  /PHASE189_HARD_SECOND_FLOOR/i,
  /PHASE189_REAL_STAIR/i,
  /PHASE189_UPPER_FLOOR/i,
  /PHASE189_UPPER_STORE/i,
  /CENTER_SPECTATOR_RING/i,
  /CENTER_FEATURED_TABLE_STAGE/i,
  /adbuilding/i,
  /bannerbuilding/i,
  /background.*building/i,
  /building/i,
  /skyline/i,
  /tower/i,
  /city/i
];

const KEEP = [
  /PHASE193/i,
  /PHASE192/i,
  /PHASE191/i,
  /PHASE190/i,
  /PHASE185_OFFICIAL_POLISHED_MARBLE_FLOOR/i,
  /PHASE185_FLOOR_INLAY/i,
  /PHASE185_OFFICIAL_BIG_MOON/i,
  /PHASE185_OFFICIAL_MARS/i,
  /PHASE187/i,
  /PHASE181/i,
  /PHASE180/i,
  /PHASE178/i,
  /PHASE177/i,
  /PGA/i,
  /REIKI/i,
  /WELLNESS/i,
  /SPONSOR/i,
  /STORE/i,
  /SCORPION/i,
  /LEGEND/i,
  /Watch/i,
  /Wrist/i,
  /Teleport/i,
  /Hand/i,
  /Controller/i,
  /Moon/i,
  /Mars/i
];

function hasAny(name, list){
  const n = String(name || "");
  return list.some(rx=>rx.test(n));
}

function shouldHide(obj){
  if (!obj || obj.isScene) return false;
  const name = String(obj.name || "");
  if (!name || hasAny(name, KEEP)) return false;
  return hasAny(name, BAD);
}

function hideLegacy(obj){
  let count = 0;
  const apply = (node)=>{
    if (shouldHide(node) && node.visible !== false){
      node.visible = false;
      node.userData.svrPhase193PreloadHidden = true;
      count++;
    }
  };
  apply(obj);
  if (obj?.traverse) obj.traverse(apply);
  if (count){
    window.SVR_PHASE193_PRELOAD_FILTER.hiddenOnAdd += count;
    window.SVR_PHASE193_PRELOAD_FILTER.checkedAt = new Date().toISOString();
  }
  return count;
}

if (!THREE.Object3D.prototype.__svrPhase193AddPatched){
  const originalAdd = THREE.Object3D.prototype.add;
  THREE.Object3D.prototype.add = function(...objects){
    const result = originalAdd.apply(this, objects);
    objects.forEach(hideLegacy);
    return result;
  };
  THREE.Object3D.prototype.__svrPhase193AddPatched = true;
}

function scanExisting(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return;
  let hidden = 0;
  scene.traverse(obj=>{ hidden += hideLegacy(obj); });
  if (hidden){
    window.SVR_PHASE193_PRELOAD_FILTER.hiddenExisting = (window.SVR_PHASE193_PRELOAD_FILTER.hiddenExisting || 0) + hidden;
    window.SVR_PHASE193_PRELOAD_FILTER.checkedAt = new Date().toISOString();
  }
}

scanExisting();
setTimeout(scanExisting, 50);
setTimeout(scanExisting, 150);
setTimeout(scanExisting, 350);
setInterval(scanExisting, 700);
console.log("[Phase193] preload skyline pop-in filter active");
