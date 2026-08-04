const LABEL="PHASE-322-UPDATE-3-1-FINAL-MANIFEST-PACK-PREP-LOCK";
const STYLE_ID="svr-phase322-final-style";
const PANEL_ID="svr-phase322-final-panel";
let installed=false;
function status(t){const e=document.getElementById("status");if(e)e.textContent=t;}
function readiness(){return window.SVR_UPDATE31_READY_STATE||window.SVR_PHASE321_UPDATE31_STABILITY_QA_STATE||{};}
function fileList(){return ["game/index.html","game/main.js","game/modules/poker_demo.js","game/phase319_room_access_buttons_android_guard_lock.js","game/phase320_android_desktop_movement_pad_guard_lock.js","game/phase321_update31_stability_qa_lock.js","game/docs/BUILD_VERSION.json","game/version.json","update/version.json"];}
function compute(){
  const qa=readiness();
  const gates={canvas:!!qa.mobileCoverageReady,rooms:!!qa.roomButtonsReady,movement:!!qa.movementReady,pokerDeal:!!qa.pokerDealReady,android:!!qa.androidReady,desktop:!!qa.desktopReady};
  const ready=Object.values(gates).every(Boolean);
  const state={build:LABEL,active:true,readyForZipPrep:ready,gates,qaBuild:qa.build||"pending",files:fileList(),zipRootRule:"index.html must stay at game zip root",phase323Chained:true,publicRootTouched:false,siteTouched:false,nextStep:ready?"create game.zip from game/ root":"complete device QA then create package",checkedAt:new Date().toISOString()};
  window.SVR_PHASE322_UPDATE31_FINAL_MANIFEST_PACK_PREP_STATE=state;
  window.SVR_UPDATE31_FINAL_PACK_PREP_STATE=state;
  return state;
}
function style(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`#${PANEL_ID}{position:fixed;right:10px;bottom:10px;z-index:99996;width:min(92vw,360px);border:1px solid rgba(127,252,255,.72);border-radius:16px;background:rgba(3,4,10,.76);color:#e8f4ff;font:700 12px/1.25 system-ui,Arial,sans-serif;padding:10px;box-shadow:0 0 22px rgba(127,252,255,.14);pointer-events:none}#${PANEL_ID} .t{font-size:13px;color:#7ffcff;font-weight:950;margin-bottom:6px}#${PANEL_ID} .row{display:flex;justify-content:space-between;gap:8px;margin:3px 0}#${PANEL_ID} .ok{color:#8dffb4}#${PANEL_ID} .bad{color:#ffd98a}#${PANEL_ID} .ready{margin-top:6px;padding:5px;border-radius:10px;text-align:center;background:rgba(141,255,180,.16);color:#fff}#${PANEL_ID} .hold{margin-top:6px;padding:5px;border-radius:10px;text-align:center;background:rgba(255,217,138,.14);color:#ffd98a}@media(max-width:720px){#${PANEL_ID}{right:8px;bottom:8px;width:min(82vw,330px)}}`;document.head.appendChild(s);
}
function yn(v){return `<span class="${v?'ok':'bad'}">${v?'PASS':'WAIT'}</span>`;}
function draw(){
  style();const st=compute();let p=document.getElementById(PANEL_ID);if(!p){p=document.createElement("div");p.id=PANEL_ID;document.body.appendChild(p);}const g=st.gates;
  p.innerHTML=`<div class="t">UPDATE 3.1 FINAL PREP</div><div class="row"><span>Canvas</span>${yn(g.canvas)}</div><div class="row"><span>Rooms</span>${yn(g.rooms)}</div><div class="row"><span>Movement</span>${yn(g.movement)}</div><div class="row"><span>Poker Deal</span>${yn(g.pokerDeal)}</div><div class="row"><span>Android</span>${yn(g.android)}</div><div class="row"><span>Desktop</span>${yn(g.desktop)}</div><div class="${st.readyForZipPrep?'ready':'hold'}">${st.readyForZipPrep?'READY FOR ZIP PREP':'QA HOLD'}</div>`;
  return st;
}
function audit(){const st=draw();try{window.dispatchEvent(new CustomEvent("svr-update31-final-prep",{detail:st}));}catch{}status(st.readyForZipPrep?"Update 3.1 ready for zip prep":"Update 3.1 final prep waiting on QA");return st;}
function install(){
  if(installed)return true;installed=true;
  window.addEventListener("svr-update31-stability-qa",()=>setTimeout(audit,100));
  window.SVR_PHASE322_AUDIT_UPDATE31_FINAL_PREP=audit;
  window.SVR_PHASE322_UPDATE31_FINAL_MANIFEST_PACK_PREP_LOCK={build:LABEL,active:true,source:"SVR_UPDATE31_READY_STATE",checks:["canvas","rooms","movement","pokerDeal","android","desktop"],phase323Chained:true,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;audit();return true;
}
install();setInterval(audit,3000);
import("./phase323_update31_gamezip_package_export_lock.js?v=phase323-gamezip-export").catch(e=>{window.SVR_PHASE323_IMPORT_ERROR=String(e?.message||e);});
