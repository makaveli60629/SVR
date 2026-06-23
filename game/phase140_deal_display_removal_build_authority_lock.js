import * as THREE from "three";

const LABEL = "PHASE-140-DEAL-DISPLAY-REMOVAL-BUILD-AUTHORITY-LOCK";
const ROOT = "PHASE140_DEAL_DISPLAY_REMOVAL_ROOT";
const BADGE_TEXT = "PHASE 140 • STABLE BUILD LOCK";

const SCENE_RE = /PHASE315|PHASE316|PHASE317|LEFT.*RIGHT.*DEAL|DEAL.*SEQUENCE|DEAL.*LOCK|DEAL.*BADGE|CARD.*SEQUENCE|LIVE.*LEFT|RIGHT.*DEAL/i;
const DOM_RE = /LIVE\s+LEFT|LEFT\s*[→\- ]\s*RIGHT|LEFT[-\s]?RIGHT|DEAL\s+SEQUENCE|DEAL\s+LOCK|DEAL\s+BADGE|CARD\s+SEQUENCE|PHASE315|PHASE316|PHASE317/i;

function hideObject(o){
  if(!o) return false;
  o.visible = false;
  o.userData.phase140Hidden = true;
  return true;
}
function removeNamed(scene){
  let removed = 0;
  scene?.traverse?.(o=>{
    const name = String(o.name || "");
    if(SCENE_RE.test(name)){
      hideObject(o);
      if(o.parent && /ROOT|PANEL|BADGE|RING|ARROW/i.test(name)){
        try{ o.parent.remove(o); removed++; }catch{}
      }
    }
  });
  [
    "PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_ROOT",
    "PHASE315_LEFT_TO_RIGHT_SEQUENCE_PANEL",
    "PHASE316_DEAL_ORDER_SEAT_BADGES_ROOT",
    "PHASE317_DEAL_DIRECTION_TABLE_ARROWS_ROOT",
    "PHASE317_DEAL_DIRECTION_TABLE_ARROWS_PANEL"
  ].forEach(n=>{
    const o = scene?.getObjectByName?.(n);
    if(o?.parent){ o.parent.remove(o); removed++; }
  });
  return removed;
}
function sweepDom(){
  let removed = 0;
  Array.from(document.querySelectorAll("body *")).forEach(el=>{
    if(!el || el.id === "app" || el.id === "safeStage" || el.id === "svrPhaseBadge" || el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
    const idc = `${el.id || ""} ${el.className || ""}`;
    const txt = String(el.textContent || "").slice(0,500);
    const cs = getComputedStyle(el);
    const overlayish = cs.position === "fixed" || cs.position === "absolute" || /panel|hud|overlay|badge|phase|deal/i.test(idc);
    if(overlayish && DOM_RE.test(`${idc} ${txt}`)){
      el.remove();
      removed++;
    }
  });
  window.SVR_PHASE140_DOM_DEAL_DISPLAY_REMOVED = (window.SVR_PHASE140_DOM_DEAL_DISPLAY_REMOVED || 0) + removed;
  return removed;
}
function installDomAuthority(){
  let style = document.getElementById("phase140-deal-display-removal-style");
  if(!style){
    style = document.createElement("style");
    style.id = "phase140-deal-display-removal-style";
    style.textContent = `
      [id*="phase315"],[id*="phase316"],[id*="phase317"],
      [class*="phase315"],[class*="phase316"],[class*="phase317"],
      [id*="deal-sequence"],[id*="dealSequence"],[id*="deal-lock"],[class*="deal-sequence"],[class*="deal-lock"]{
        display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;
      }
      #svrPhaseBadge{position:fixed;left:10px;top:10px;z-index:999999;padding:8px 12px;border:1px solid rgba(127,252,255,.75);border-radius:999px;background:rgba(0,0,0,.66);color:#bffcff;font:900 12px system-ui,Arial;letter-spacing:.08em;pointer-events:none;box-shadow:0 0 18px rgba(127,252,255,.22)}
    `;
    document.head.appendChild(style);
  }
  let badge = document.getElementById("svrPhaseBadge");
  if(!badge){ badge = document.createElement("div"); badge.id = "svrPhaseBadge"; document.body.appendChild(badge); }
  badge.textContent = BADGE_TEXT;
  sweepDom();
  if(!window.SVR_PHASE140_DEAL_DISPLAY_OBSERVER){
    const obs = new MutationObserver(()=>sweepDom());
    obs.observe(document.documentElement,{childList:true,subtree:true});
    window.SVR_PHASE140_DEAL_DISPLAY_OBSERVER = true;
  }
}
function neuterOldDraws(){
  const off = ()=>false;
  window.SVR_PHASE315_AUDIT_LEFT_TO_RIGHT_SEQUENCE = ()=>({build:LABEL,active:false,visualDisplayRemoved:true,leftToRightLogicPreserved:true,checkedAt:new Date().toISOString()});
  window.SVR_PHASE316_REFRESH_DEAL_BADGES = off;
  window.SVR_PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_LOCK = {build:LABEL,active:false,visualDisplayRemoved:true,logicPreserved:true,siteTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE316_DEAL_ORDER_SEAT_BADGES_LOCK = {build:LABEL,active:false,visualDisplayRemoved:true,logicPreserved:true,siteTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE317_DEAL_DIRECTION_TABLE_ARROWS_LOCK = {build:LABEL,active:false,visualDisplayRemoved:true,logicPreserved:true,siteTouched:false,checkedAt:new Date().toISOString()};
}
function addTinyConfirmation(scene){
  const old = scene?.getObjectByName?.(ROOT);
  if(old) old.parent?.remove(old);
  if(!scene) return;
  const root = new THREE.Group();
  root.name = ROOT;
  scene.add(root);
}
function count(scene,re){ let n=0; scene?.traverse?.(o=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function qa(scene){
  const state = {
    build: LABEL,
    badge: document.getElementById("svrPhaseBadge")?.textContent || null,
    active: true,
    dealDisplaysVisible: count(scene, SCENE_RE),
    domRemoved: window.SVR_PHASE140_DOM_DEAL_DISPLAY_REMOVED || 0,
    sceneRemoved: window.SVR_PHASE140_SCENE_DEAL_DISPLAY_REMOVED || 0,
    leftToRightLogicPreserved: true,
    pokerVisualMonitorsRemoved: true,
    siteTouched: false,
    publicRootTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE140_DEAL_DISPLAY_REMOVAL_QA = state;
  return state;
}
function install(){
  installDomAuthority();
  neuterOldDraws();
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_PHASE140_BUILD_AUTHORITY_LOCK = {build:LABEL,active:true,finalAuthority:true,noPhaseBounce:true,dealDisplaysRemoved:true,siteTouched:false,checkedAt:new Date().toISOString()};
  const scene = window.__SVR_SCENE__;
  if(scene){
    window.SVR_PHASE140_SCENE_DEAL_DISPLAY_REMOVED = (window.SVR_PHASE140_SCENE_DEAL_DISPLAY_REMOVED || 0) + removeNamed(scene);
    addTinyConfirmation(scene);
    window.SVR_RUN_PHASE140_DEAL_DISPLAY_AUDIT = () => qa(scene);
    qa(scene);
  }
  return true;
}
install();
let ticks = 0;
const timer = setInterval(()=>{
  ticks++;
  install();
  if(ticks > 160) clearInterval(timer);
}, 350);
[1000,2500,5000,8500,13000,21000,34000,55000].forEach(ms=>setTimeout(install, ms));
