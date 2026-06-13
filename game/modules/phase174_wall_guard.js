const LABEL = "UPDATE-3.0-PHASE-174-WALL-GUARD-LATE-CLEANUP-LOCK";

function distanceXZ(obj){
  try{
    const p = obj.getWorldPosition ? obj.getWorldPosition({ set(){}, x:0, y:0, z:0 }) : obj.position;
    return Math.hypot(p?.x || obj.position?.x || 0, p?.z || obj.position?.z || 0);
  }catch(_e){
    return Math.hypot(obj.position?.x || 0, obj.position?.z || 0);
  }
}
function shouldHide(obj){
  const n = String(obj.name || "");
  if(/PHASE173|PHASE174|SVR_REAL_SINGLE_OCTAGON|PHASE171_BIG_TEXTURED_MOON|PHASE171_TEXTURED_MARS|PHASE172|SPONSOR_MODULE/i.test(n)) return false;
  if(/wall|lobby.*ring|compact.*lobby|phase164|phase168|phase169|building|skyline|tower|city|adbuilding|bannerbuilding|billboard|earth|globe|planet/i.test(n)) return true;
  if(obj.isMesh && distanceXZ(obj) > 14 && distanceXZ(obj) < 80 && obj.position?.y < 24){
    const type = String(obj.geometry?.type || "");
    if(/BoxGeometry|PlaneGeometry|CylinderGeometry/i.test(type)) return true;
  }
  return false;
}
function runGuard(scene){
  let hidden = 0;
  const list = [];
  scene.traverse(o=>{ if(o !== scene && shouldHide(o)) list.push(o); });
  list.forEach(o=>{ if(o.visible !== false){ o.visible = false; hidden++; } });
  window.SVR_PHASE174_WALL_GUARD = {
    label: LABEL,
    active: true,
    hiddenThisPass: hidden,
    candidates: list.length,
    singleWall: !!window.SVR_PHASE173_SINGLE_WALL,
    checkedAt: new Date().toISOString()
  };
  return hidden;
}
export function installPhase174WallGuard(){
  const started = performance.now();
  let passes = 0;
  const timer = setInterval(()=>{
    const scene = window.__SVR_SCENE__;
    if(!scene && performance.now() - started > 15000){ clearInterval(timer); return; }
    if(!scene) return;
    passes++;
    const hidden = runGuard(scene);
    if(passes >= 16) clearInterval(timer);
    if(hidden) console.log(`[Phase174] wall guard hidden ${hidden} late objects`);
  }, 1000);
  window.addEventListener("keydown", e=>{ if(e.code === "F8" && window.__SVR_SCENE__) console.log("[Phase174] manual wall guard", runGuard(window.__SVR_SCENE__)); });
  console.log("[Phase174] wall guard active");
}
