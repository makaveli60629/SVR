import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-175-LOBBY-POLISH-AUDIT-LOCK";
const KEEP_RE = /PHASE173|PHASE174|PHASE175|PHASE171_BIG_TEXTURED_MOON|PHASE171_TEXTURED_MARS|PHASE172|SPONSOR_MODULE|Teleport|TELEPORT|Purple_Fist|Hand_Glow|WristWatch|Watch|Controller|Hand/i;
const REMOVE_RE = /building|skyline|tower|city|adbuilding|bannerbuilding|billboard|phase123|phase164|phase168|phase169|compact.*wall|lobby.*wall|octagon.*wall|ring.*wall|earth|globe|planet|old.*moon|old.*mars|fake.*moon|fake.*mars/i;

function worldDistance(obj){
  const p = new THREE.Vector3();
  try{ obj.getWorldPosition(p); }catch(_e){ p.copy(obj.position || new THREE.Vector3()); }
  return Math.hypot(p.x,p.z);
}
function shouldRemove(obj){
  if(!obj || !obj.parent) return false;
  const n = String(obj.name || "");
  if(KEEP_RE.test(n)) return false;
  if(REMOVE_RE.test(n)) return true;
  if(obj.isMesh && worldDistance(obj) > 13.8 && worldDistance(obj) < 120 && (obj.position?.y || 0) < 28){
    const type = String(obj.geometry?.type || "");
    if(/BoxGeometry|PlaneGeometry|CylinderGeometry|ExtrudeGeometry/i.test(type)) return true;
  }
  return false;
}
function disposeTree(obj){
  obj.traverse?.(o=>{
    try{ o.geometry?.dispose?.(); }catch(_e){}
    try{
      const m = o.material;
      if(Array.isArray(m)) m.forEach(mm=>mm?.dispose?.()); else m?.dispose?.();
    }catch(_e){}
  });
}
function installCleanFloor(scene){
  if(scene.getObjectByName("PHASE175_CLEAN_OCTAGON_FLOOR_POLISH")) return;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12.75,8),
    new THREE.MeshBasicMaterial({ color:0x060913, transparent:true, opacity:.52, side:THREE.DoubleSide })
  );
  floor.name = "PHASE175_CLEAN_OCTAGON_FLOOR_POLISH";
  floor.rotation.x = -Math.PI/2;
  floor.rotation.z = Math.PI/8;
  floor.position.y = .021;
  scene.add(floor);
}
function removePass(scene){
  const targets = [];
  scene.traverse(o=>{ if(o !== scene && shouldRemove(o)) targets.push(o); });
  let removed = 0;
  for(const obj of targets){
    if(!obj.parent || KEEP_RE.test(String(obj.name||""))) continue;
    obj.parent.remove(obj);
    disposeTree(obj);
    removed++;
  }
  if(scene.userData){
    for(const key of Object.keys(scene.userData)){
      if(/phase123|phase164|phase168|phase169|adBanners|skyline|building/i.test(key)){
        const obj = scene.userData[key];
        if(obj?.parent){ obj.parent.remove(obj); disposeTree(obj); removed++; }
        scene.userData[key] = null;
      }
    }
  }
  installCleanFloor(scene);
  window.SVR_PHASE175_LOBBY_AUDIT = {
    label: LABEL,
    removedThisPass: removed,
    candidates: targets.length,
    singleWall: !!window.SVR_PHASE173_SINGLE_WALL,
    floorPolish: true,
    checkedAt: new Date().toISOString()
  };
  return removed;
}
export function installPhase175LobbyPolishAudit(){
  const started = performance.now();
  let passes = 0;
  const timer = setInterval(()=>{
    const scene = window.__SVR_SCENE__;
    if(!scene && performance.now() - started > 18000){ clearInterval(timer); return; }
    if(!scene) return;
    passes++;
    const removed = removePass(scene);
    if(removed) console.log(`[Phase175] removed ${removed} old lobby/background objects`);
    if(passes >= 30) clearInterval(timer);
  }, 700);
  window.addEventListener("keydown", e=>{ if(e.code === "F6" && window.__SVR_SCENE__) console.log("[Phase175] manual polish pass", removePass(window.__SVR_SCENE__)); });
  console.log("[Phase175] lobby polish audit active");
}
