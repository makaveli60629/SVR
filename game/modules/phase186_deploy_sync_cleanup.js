const LABEL = "UPDATE-3.0-PHASE-186-DEPLOY-SYNC-CLEANUP-LOCK";

const REMOVE_PATTERNS = [
  /building/i,
  /skyline/i,
  /tower/i,
  /city/i,
  /adbuilding/i,
  /bannerbuilding/i,
  /phase123/i,
  /phase164/i,
  /background.*store/i,
  /background.*building/i,
  /old.*moon/i,
  /fake.*moon/i,
  /old.*mars/i,
  /fake.*mars/i,
  /picture.*sky/i,
  /sky.*picture/i
];
const KEEP_PATTERNS = [
  /PHASE185/i,
  /PHASE184/i,
  /PHASE183/i,
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
function shouldKeep(obj){
  const n = String(obj?.name || "");
  return KEEP_PATTERNS.some(rx=>rx.test(n));
}
function shouldHide(obj){
  if(!obj || obj.isScene || shouldKeep(obj)) return false;
  const n = String(obj.name || "");
  return REMOVE_PATTERNS.some(rx=>rx.test(n));
}
export function installPhase186DeploySyncCleanup(){
  const started = performance.now();
  let hidden = 0;
  const timer = setInterval(()=>{
    const scene = window.__SVR_SCENE__;
    if(!scene && performance.now() - started > 18000){ clearInterval(timer); return; }
    if(!scene) return;
    scene.traverse(obj=>{
      if(shouldHide(obj) && obj.visible !== false){ obj.visible = false; hidden++; }
    });
    if(scene.userData){
      for(const key of Object.keys(scene.userData)){
        if(/phase123|adBanners|skyline|building|tower|city/i.test(key)){
          const v = scene.userData[key];
          if(v && v.visible !== false){ v.visible = false; hidden++; }
        }
      }
    }
    window.SVR_PHASE186_DEPLOY_SYNC = {
      label: LABEL,
      locked: true,
      activeLook: window.SVR_PHASE185_OFFICIAL_LOOK || null,
      hiddenBackgroundObjects: hidden,
      officialLookLoaded: !!window.SVR_PHASE185_OFFICIAL_LOOK,
      checkedAt: new Date().toISOString()
    };
  }, 700);
  console.log("[Phase186] deploy sync cleanup active");
  return timer;
}
