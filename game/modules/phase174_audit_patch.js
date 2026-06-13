import * as THREE from "three";

function d(obj){
  const p = new THREE.Vector3();
  try{ obj.getWorldPosition(p); return Math.hypot(p.x,p.z); }
  catch(_e){ return Math.hypot(obj.position?.x || 0, obj.position?.z || 0); }
}
function keep(obj){
  const n = String(obj.name || "");
  return /PHASE173|PHASE174|PHASE171_BIG_TEXTURED_MOON|PHASE171_TEXTURED_MARS|PHASE172|SPONSOR_MODULE|Teleport|TELEPORT|Purple_Fist|Hand_Glow|WristWatch|Watch|Controller/i.test(n);
}
function hide(obj){
  const n = String(obj.name || "");
  if(keep(obj)) return false;
  if(/moon|mars|earth|globe|planet|wall|building|skyline|tower|city|billboard|adbuilding|bannerbuilding|phase164|phase168/i.test(n)) return true;
  if(obj.isMesh && d(obj) > 14 && d(obj) < 80 && (obj.position?.y || 0) < 24){
    const t = String(obj.geometry?.type || "");
    return /BoxGeometry|PlaneGeometry|CylinderGeometry|ExtrudeGeometry/i.test(t);
  }
  return false;
}
function pass(scene){
  let hidden = 0;
  const list = [];
  scene.traverse(o=>{ if(o !== scene && hide(o)) list.push(o); });
  list.forEach(o=>{ if(o.visible !== false){ o.visible = false; hidden++; } });
  window.SVR_PHASE174_AUDIT_PATCH = { active:true, hidden, candidates:list.length, checkedAt:new Date().toISOString() };
  return hidden;
}
export function installPhase174AuditPatch(){
  const t0 = performance.now();
  let n = 0;
  const id = setInterval(()=>{
    const scene = window.__SVR_SCENE__;
    if(!scene && performance.now() - t0 > 15000){ clearInterval(id); return; }
    if(!scene) return;
    n++;
    const hidden = pass(scene);
    if(hidden) console.log(`[Phase174A] audit patch hidden ${hidden}`);
    if(n > 20) clearInterval(id);
  }, 750);
  window.addEventListener("keydown", e=>{ if(e.code === "F7" && window.__SVR_SCENE__) console.log("[Phase174A] manual pass", pass(window.__SVR_SCENE__)); });
}
