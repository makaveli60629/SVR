import * as THREE from "three";

const LABEL="PHASE-321-UPDATE-3-1-STABILITY-QA-LOCK";
const STYLE_ID="svr-phase321-stability-style";
const PANEL_ID="svr-phase321-stability-panel";
let installed=false;
let lastRoom=null;
let lastMove=null;
let lastDeal=null;
let checks={};
function status(t){const e=document.getElementById("status");if(e)e.textContent=t;}
function h(){return Math.max(1,Math.floor(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight||720));}
function w(){return Math.max(1,Math.floor(window.innerWidth||document.documentElement.clientWidth||1));}
function fixViewport(){try{document.documentElement.style.setProperty("--svr-vh",`${h()}px`);window.SVR_PHASE320_RESIZE_VIEW?.();}catch(e){window.SVR_PHASE321_FIX_ERROR=String(e?.message||e);}}
function releaseOverlay(){try{window.SVR_RELEASE_BOOT?.("phase321-stability");}catch{}document.body.classList.add("boot-released","runtime-visible","overlay-released");["safeStage","bootFallback"].forEach(id=>{const el=document.getElementById(id);if(el){el.style.display="none";el.style.opacity="0";el.style.visibility="hidden";el.style.pointerEvents="none";}});}
function collect(){
  const canvas=document.querySelector("canvas");
  const r=window.__SVR_RENDERER__,c=window.__SVR_CAMERA__;
  const cw=canvas?.clientWidth||0,ch=canvas?.clientHeight||0;
  const dw=canvas?.width||0,dh=canvas?.height||0;
  const vw=w(),vh=h();
  const rendererReady=!!r&&!!canvas&&cw>Math.max(240,vw*.55)&&ch>Math.max(240,vh*.55);
  const cameraReady=!!c&&Number.isFinite(c.aspect)&&c.aspect>0.1;
  const viewportReady=vw>240&&vh>240&&cw>0&&ch>0;
  const roomButtonsReady=!!window.SVR_PHASE319_ROOM_ACCESS_BUTTONS_ANDROID_GUARD_LOCK&&!!document.getElementById("svr-phase319-room-buttons");
  const movementReady=!!window.SVR_PHASE320_ANDROID_DESKTOP_MOVEMENT_PAD_GUARD_LOCK&&!!document.getElementById("svr-phase320-move-pad");
  const pokerDealReady=!!window.SVR_POKER_LEFT_TO_RIGHT_DEAL_ENFORCED||!!window.SVR_LEFT_TO_RIGHT_DEAL_LOCK;
  const mobileCoverageReady=rendererReady&&viewportReady&&cameraReady;
  const desktopReady=rendererReady&&roomButtonsReady&&movementReady;
  const androidReady=mobileCoverageReady&&roomButtonsReady&&movementReady;
  const readyForPackage=desktopReady&&androidReady&&pokerDealReady;
  checks={build:LABEL,active:true,viewport:{w:vw,h:vh},canvas:{clientWidth:cw,clientHeight:ch,width:dw,height:dh},rendererReady,cameraReady,viewportReady,mobileCoverageReady,roomButtonsReady,movementReady,pokerDealReady,desktopReady,androidReady,readyForPackage,lastRoom,lastMove,lastDeal,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE321_UPDATE31_STABILITY_QA_STATE=checks;
  window.SVR_UPDATE31_READY_STATE=checks;
  if(!mobileCoverageReady)fixViewport();
  return checks;
}
function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
#${PANEL_ID}{position:fixed;left:calc(10px + env(safe-area-inset-left,0px));top:calc(92px + env(safe-area-inset-top,0px));z-index:99997;width:min(92vw,330px);border:1px solid rgba(141,255,180,.70);border-radius:16px;background:rgba(3,4,10,.74);color:#e8f4ff;font:700 12px/1.25 system-ui,Arial,sans-serif;padding:10px;box-shadow:0 0 22px rgba(141,255,180,.14);pointer-events:none;backdrop-filter:blur(6px)}
#${PANEL_ID} .t{font-size:13px;color:#8dffb4;font-weight:950;letter-spacing:.04em;margin-bottom:6px}#${PANEL_ID} .row{display:flex;justify-content:space-between;gap:8px;margin:3px 0}#${PANEL_ID} .ok{color:#8dffb4}#${PANEL_ID} .bad{color:#ffd98a}#${PANEL_ID} .ready{margin-top:6px;padding:5px;border-radius:10px;text-align:center;background:rgba(141,255,180,.16);color:#fff}#${PANEL_ID} .hold{margin-top:6px;padding:5px;border-radius:10px;text-align:center;background:rgba(255,217,138,.14);color:#ffd98a}
@media(max-width:720px){#${PANEL_ID}{top:auto;bottom:178px;left:8px;width:min(76vw,300px);font-size:11px}}
`;document.head.appendChild(s);
}
function yn(v){return `<span class="${v?'ok':'bad'}">${v?'YES':'WAIT'}</span>`;}
function drawDom(){
  injectStyle();let p=document.getElementById(PANEL_ID);if(!p){p=document.createElement("div");p.id=PANEL_ID;document.body.appendChild(p);}const s=checks.readyForPackage?"ready":"hold";
  p.innerHTML=`<div class="t">UPDATE 3.1 STABILITY QA</div><div class="row"><span>Canvas</span>${yn(checks.mobileCoverageReady)}</div><div class="row"><span>Rooms</span>${yn(checks.roomButtonsReady)}</div><div class="row"><span>Movement</span>${yn(checks.movementReady)}</div><div class="row"><span>Poker Deal</span>${yn(checks.pokerDealReady)}</div><div class="row"><span>Android</span>${yn(checks.androidReady)}</div><div class="row"><span>Desktop</span>${yn(checks.desktopReady)}</div><div class="${s}">${checks.readyForPackage?'READY FOR PACKAGE':'QA HOLD'}</div>`;
}
function audit(){releaseOverlay();const s=collect();drawDom();try{window.dispatchEvent(new CustomEvent("svr-update31-stability-qa",{detail:s}));}catch{}status(s.readyForPackage?"Update 3.1 stability QA ready":"Update 3.1 stability QA running");return s;}
function install(){
  if(installed)return true;installed=true;injectStyle();releaseOverlay();fixViewport();
  window.addEventListener("svr-portal-selected",e=>{lastRoom=e.detail||null;setTimeout(audit,120);});
  window.addEventListener("svr-deal-direction-arrows-updated",e=>{lastDeal=e.detail||null;setTimeout(audit,120);});
  window.addEventListener("svr-left-to-right-card-dealt",e=>{lastDeal=e.detail||null;setTimeout(audit,120);});
  window.addEventListener("resize",audit,{passive:true});window.visualViewport?.addEventListener?.("resize",audit,{passive:true});window.visualViewport?.addEventListener?.("scroll",audit,{passive:true});
  window.addEventListener("pointerdown",audit,{passive:true});window.addEventListener("keydown",audit,{passive:true});
  window.SVR_PHASE321_AUDIT_UPDATE31_STABILITY=audit;
  window.SVR_PHASE321_UPDATE31_STABILITY_QA_LOCK={build:LABEL,active:true,checks:["canvas","roomButtons","movementPad","pokerDeal","androidViewport","desktopPreview"],siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;audit();return true;
}
install();setInterval(audit,2500);
