const LABEL = "PHASE-101-SECOND-FLOOR-VISIBILITY-FINAL-QA-LOCK";
const ROOT = "PHASE101_SECOND_FLOOR_VISIBILITY_FINAL_QA_ROOT";

function findSecondFloor(scene){
  const items = [];
  scene.traverse((o)=>{
    const n = String(o.name || "");
    if(/PHASE98_SECOND_FLOOR|SECOND_FLOOR_SAFE_SURFACE|SECOND_FLOOR_SAFETY|BALCONY/i.test(n)) items.push(o);
  });
  return items;
}
function makeVisible(items){
  let restored = 0;
  items.forEach((o)=>{
    if(o.visible === false){ o.visible = true; restored++; }
    o.userData.phase101SecondFloorVisibilityProtected = true;
    if(o.isMesh){
      o.frustumCulled = false;
      o.renderOrder = Math.max(o.renderOrder || 0, 620);
      if(o.material){
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m)=>{ if(m){ m.needsUpdate = true; }});
      }
    }
  });
  return restored;
}
function visibleReport(items){
  const surfaces = items.filter((o)=>/SAFE_SURFACE|BALCONY/i.test(String(o.name || "")));
  const hidden = items.filter((o)=>o.visible === false).map((o)=>o.name || "unnamed");
  return {
    total: items.length,
    surfaces: surfaces.length,
    visible: items.filter((o)=>o.visible !== false).length,
    hidden,
    ok: items.length > 0 && surfaces.length >= 3 && hidden.length === 0
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  root.visible = false;
  scene.add(root);
  const items = findSecondFloor(scene);
  const restored = makeVisible(items);
  const report = visibleReport(items);
  window.SVR_PHASE101_SECOND_FLOOR_VISIBILITY_FINAL_QA_LOCK = {
    build: LABEL,
    active: true,
    secondFloorVisible: report.ok,
    restoredHiddenSecondFloorObjects: restored,
    report,
    loadedAfterPhase99Cleanup: true,
    loadedAfterPhase100QA: true,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    privateScenesTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE101_SECOND_FLOOR_QA = () => visibleReport(findSecondFloor(scene));
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 80) clearInterval(timer); }, 300);
[900,2000,4000,7000,11000].forEach((d)=>setTimeout(install,d));
