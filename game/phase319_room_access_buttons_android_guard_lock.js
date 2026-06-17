import * as THREE from "three";

const LABEL="PHASE-319-ROOM-ACCESS-BUTTONS-ANDROID-GUARD-LOCK";
const STYLE_ID="svr-phase319-room-access-style";
const PANEL_ID="svr-phase319-room-buttons";
let installed=false;
const ROOMS=[
  {key:"lobby",label:"Lobby",target:"lobby",pos:{x:0,y:0,z:5.5}},
  {key:"poker",label:"Poker",target:"table-select",pos:{x:0,y:0,z:3.9}},
  {key:"reiki",label:"Reiki",target:"meditation-room",pos:{x:-12,y:0,z:-11.4}},
  {key:"pga",label:"PGA Range",target:"driving-range",pos:{x:-6,y:0,z:-11.4}},
  {key:"chip",label:"Chip/Putt",target:"chip-putt",pos:{x:-7.8,y:0,z:-8.4}},
  {key:"scorpion",label:"Scorpion",target:"private-room",pos:{x:12,y:0,z:-11.4}},
  {key:"store",label:"Store",target:"store-preview",pos:{x:6,y:0,z:-11.4}},
  {key:"lounge",label:"Lounge",target:"theater-lounge",pos:{x:15.35,y:0,z:5.8}}
];
function status(t){const e=document.getElementById("status");if(e)e.textContent=t;}
function isAndroid(){return /Android/i.test(navigator.userAgent||"");}
function setVh(){const h=Math.max(1,Math.floor(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight||720));document.documentElement.style.setProperty("--svr-vh",`${h}px`);}
function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
html,body{margin:0!important;width:100%!important;height:var(--svr-vh,100vh)!important;min-height:var(--svr-vh,100vh)!important;overflow:hidden!important;background:#02040b!important;touch-action:none!important;overscroll-behavior:none!important;}
#app,canvas{position:fixed!important;inset:0!important;width:100vw!important;height:var(--svr-vh,100vh)!important;min-height:var(--svr-vh,100vh)!important;background:#02040b!important;}
canvas{display:block!important;outline:none!important;transform:translateZ(0)!important;}
#${PANEL_ID}{position:fixed;right:calc(8px + env(safe-area-inset-right,0px));top:calc(8px + env(safe-area-inset-top,0px));z-index:99999;display:flex;flex-wrap:wrap;gap:6px;max-width:min(96vw,540px);justify-content:flex-end;pointer-events:auto;font-family:system-ui,Arial,sans-serif;}
#${PANEL_ID} button{border:1px solid rgba(127,252,255,.72);border-radius:12px;background:rgba(3,4,10,.78);color:#e8f4ff;font-weight:900;font-size:12px;line-height:1;padding:10px 12px;box-shadow:0 0 18px rgba(127,252,255,.16);touch-action:manipulation;user-select:none;-webkit-user-select:none;}
#${PANEL_ID} button:active{background:rgba(141,255,180,.28);color:#fff;}
@media(max-width:720px){#${PANEL_ID}{left:8px;right:8px;top:8px;justify-content:center}#${PANEL_ID} button{font-size:11px;padding:9px 9px;}}
`;document.head.appendChild(s);
}
function makePanel(){
  let p=document.getElementById(PANEL_ID);if(p)return p;
  p=document.createElement("div");p.id=PANEL_ID;p.setAttribute("aria-label","SVR room quick access");
  ROOMS.forEach(r=>{const b=document.createElement("button");b.type="button";b.textContent=r.label;b.dataset.target=r.target;b.addEventListener("click",ev=>{ev.preventDefault();goRoom(r);});b.addEventListener("touchstart",ev=>{ev.stopPropagation();},{passive:true});p.appendChild(b);});
  document.body.appendChild(p);return p;
}
function releaseBlackOverlays(){
  try{window.SVR_RELEASE_BOOT?.("phase319-room-access");}catch{}
  document.body.classList.add("boot-released","runtime-visible","overlay-released");
  ["safeStage","bootFallback"].forEach(id=>{const el=document.getElementById(id);if(el){el.style.display="none";el.style.opacity="0";el.style.visibility="hidden";el.style.pointerEvents="none";}});
}
function resizeRenderer(){
  setVh();
  const r=window.__SVR_RENDERER__,c=window.__SVR_CAMERA__;
  const w=Math.max(1,Math.floor(window.innerWidth||document.documentElement.clientWidth||1));
  const h=Math.max(1,Math.floor(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight||1));
  try{r?.setSize?.(w,h,false);if(r?.domElement){r.domElement.style.width="100vw";r.domElement.style.height=`${h}px`;r.domElement.style.background="#02040b";}if(r?.setClearColor)r.setClearColor(0x02040b,1);}catch(e){window.SVR_PHASE319_RESIZE_ERROR=String(e?.message||e);}
  try{if(c){c.aspect=w/h;c.updateProjectionMatrix?.();}}catch(e){}
}
function fallbackMove(pos){
  const cam=window.__SVR_CAMERA__;if(!cam)return false;
  cam.position.set(pos.x,1.65,pos.z);cam.lookAt(0,1.45,-2.5);return true;
}
function goRoom(room){
  releaseBlackOverlays();resizeRenderer();
  const detail={key:room.key,label:room.label,target:room.target,source:LABEL};
  let moved=false;
  try{if(window.SVR_PHASE301_EXECUTE_ROUTE&&room.target!=="lobby")moved=!!window.SVR_PHASE301_EXECUTE_ROUTE(detail);}catch(e){window.SVR_PHASE319_ROUTE_ERROR=String(e?.message||e);}
  if(!moved)moved=fallbackMove(room.pos);
  try{window.dispatchEvent(new CustomEvent("svr-portal-selected",{detail}));}catch{}
  window.SVR_PHASE319_LAST_ROOM_BUTTON={build:LABEL,...detail,moved,android:isAndroid(),siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  status(`Room button: ${room.label}`);
  return window.SVR_PHASE319_LAST_ROOM_BUTTON;
}
function installGuards(){
  const stop=e=>{if(e.target?.closest?.(`#${PANEL_ID}`))return;e.preventDefault();};
  window.addEventListener("touchmove",stop,{passive:false});
  window.addEventListener("resize",resizeRenderer,{passive:true});
  window.visualViewport?.addEventListener?.("resize",resizeRenderer,{passive:true});
  window.visualViewport?.addEventListener?.("scroll",resizeRenderer,{passive:true});
  ["pointerdown","touchstart","keydown"].forEach(ev=>window.addEventListener(ev,()=>{releaseBlackOverlays();resizeRenderer();},{passive:true}));
}
function install(){
  if(installed)return true;installed=true;
  setVh();injectStyle();makePanel();installGuards();resizeRenderer();releaseBlackOverlays();
  window.SVR_PHASE319_GO_ROOM=(key)=>{const r=ROOMS.find(x=>x.key===key||x.target===key||x.label.toLowerCase()===String(key).toLowerCase());return r?goRoom(r):null;};
  window.SVR_PHASE319_ROOM_ACCESS_BUTTONS_ANDROID_GUARD_LOCK={build:LABEL,active:true,roomCount:ROOMS.length,rooms:ROOMS.map(r=>({key:r.key,label:r.label,target:r.target})),androidGuard:true,fixes:"mobile viewport black-side guard plus desktop/android room buttons",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;status("Room access buttons armed");return true;
}
install();setInterval(()=>{install();resizeRenderer();},3000);
