const LABEL = "UPDATE-3.0-PHASE-186B-DEPLOY-SYNC-CLEANUP-HOTFIX";

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
function isObject3D(v){ return !!v && typeof v === "object" && (v.isObject3D || "visible" in v || typeof v.traverse === "function"); }
function shouldKeep(obj){
  const n = String(obj?.name || "");
  return KEEP_PATTERNS.some(rx=>rx.test(n));
}
function shouldHide(obj){
  if(!isObject3D(obj) || obj.isScene || shouldKeep(obj)) return false;
  const n = String(obj.name || "");
  return REMOVE_PATTERNS.some(rx=>rx.test(n));
}
function safeHide(v){
  if(!isObject3D(v)) return 0;
  let count = 0;
  if(v.visible !== false){ v.visible = false; count++; }
  if(typeof v.traverse === "function"){
    v.traverse(child=>{ if(child && child !== v && child.visible !== false){ child.visible = false; count++; } });
  }
  return count;
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
          hidden += safeHide(scene.userData[key]);
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
  console.log("[Phase186B] deploy sync cleanup hotfix active");
  return timer;
}
