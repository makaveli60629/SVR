import * as THREE from "three";

const LABEL="PHASE-320-ANDROID-DESKTOP-MOVEMENT-PAD-GUARD-LOCK";
const STYLE_ID="svr-phase320-move-pad-style";
const PAD_ID="svr-phase320-move-pad";
let installed=false;
let lastTick=0;
const hold={f:false,b:false,l:false,r:false};
function status(t){const e=document.getElementById("status");if(e)e.textContent=t;}
function setVh(){const h=Math.max(1,Math.floor(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight||720));document.documentElement.style.setProperty("--svr-vh",`${h}px`);return h;}
function resize(){
  const h=setVh();const w=Math.max(1,Math.floor(window.innerWidth||document.documentElement.clientWidth||1));
  const r=window.__SVR_RENDERER__,c=window.__SVR_CAMERA__;
  try{r?.setSize?.(w,h,false);if(r?.domElement){r.domElement.style.width="100vw";r.domElement.style.height=`${h}px`;r.domElement.style.background="#02040b";}r?.setClearColor?.(0x02040b,1);}catch(e){window.SVR_PHASE320_RESIZE_ERROR=String(e?.message||e);}
  try{if(c){c.aspect=w/h;c.updateProjectionMatrix?.();}}catch(e){}
}
function release(){try{window.SVR_RELEASE_BOOT?.("phase320-move-pad");}catch{}document.body.classList.add("boot-released","runtime-visible","overlay-released");["safeStage","bootFallback"].forEach(id=>{const e=document.getElementById(id);if(e){e.style.display="none";e.style.opacity="0";e.style.visibility="hidden";e.style.pointerEvents="none";}});}
function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
html,body,#app,canvas{background:#02040b!important;overscroll-behavior:none!important;touch-action:none!important;}
#${PAD_ID}{position:fixed;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:99998;display:grid;grid-template-columns:56px 56px 56px;grid-template-rows:48px 48px 48px;gap:7px;pointer-events:auto;font-family:system-ui,Arial,sans-serif;}
#${PAD_ID} button{border:1px solid rgba(255,217,138,.72);border-radius:14px;background:rgba(3,4,10,.74);color:#fff;font-size:22px;font-weight:900;box-shadow:0 0 18px rgba(255,217,138,.12);touch-action:manipulation;user-select:none;-webkit-user-select:none;}
#${PAD_ID} button[data-k="f"]{grid-column:2;grid-row:1}#${PAD_ID} button[data-k="l"]{grid-column:1;grid-row:2}#${PAD_ID} button[data-k="r"]{grid-column:3;grid-row:2}#${PAD_ID} button[data-k="b"]{grid-column:2;grid-row:3}#${PAD_ID} button[data-k="snapl"]{grid-column:1;grid-row:3;font-size:13px}#${PAD_ID} button[data-k="snapr"]{grid-column:3;grid-row:3;font-size:13px}
#${PAD_ID} button.svr-active{background:rgba(141,255,180,.32);border-color:#8dffb4;}
@media(min-width:900px){#${PAD_ID}{opacity:.72}#${PAD_ID}:hover{opacity:1}}
`;document.head.appendChild(s);
}
function makePad(){
  let p=document.getElementById(PAD_ID);if(p)return p;
  p=document.createElement("div");p.id=PAD_ID;p.setAttribute("aria-label","SVR movement pad");
  const specs=[['f','▲'],['l','◀'],['r','▶'],['b','▼'],['snapl','↶'],['snapr','↷']];
  specs.forEach(([k,t])=>{const b=document.createElement("button");b.type="button";b.dataset.k=k;b.textContent=t;b.addEventListener("pointerdown",e=>press(e,k,b));b.addEventListener("pointerup",e=>lift(e,k,b));b.addEventListener("pointercancel",e=>lift(e,k,b));b.addEventListener("pointerleave",e=>lift(e,k,b));b.addEventListener("touchstart",e=>e.stopPropagation(),{passive:true});p.appendChild(b);});
  document.body.appendChild(p);return p;
}
function press(e,k,b){e.preventDefault();e.stopPropagation();release();resize();if(k==="snapl")return snap(-Math.PI/4);if(k==="snapr")return snap(Math.PI/4);hold[k]=true;b.classList.add("svr-active");}
function lift(e,k,b){e.preventDefault();e.stopPropagation();hold[k]=false;b.classList.remove("svr-active");}
function cam(){return window.__SVR_CAMERA__||null;}
function api(){return window.SVR_TELEPORT_RIG_API||window.__SVR_TELEPORT_RIG__||window.SVR_PHASE101J_TELEPORT_API||null;}
function pos(){const c=cam();if(!c)return new THREE.Vector3();const v=new THREE.Vector3();c.getWorldPosition(v);return v;}
function setXZ(x,z){const a=api();try{if(a?.setPlayerXZ)return !!a.setPlayerXZ(x,z);if(a?.setPlayerPose)return !!a.setPlayerPose(x,0,z);}catch(e){window.SVR_PHASE320_API_MOVE_ERROR=String(e?.message||e);}const c=cam();if(c){c.position.x=x;c.position.z=z;return true;}return false;}
function direction(){const c=cam();const d=new THREE.Vector3(0,0,-1);if(c)c.getWorldDirection(d);d.y=0;if(d.lengthSq()<.0001)d.set(0,0,-1);return d.normalize();}
function rightVec(){const d=direction();return new THREE.Vector3(d.z,0,-d.x).normalize();}
function snap(rad){const c=cam();if(!c)return false;c.rotation.y-=rad;window.SVR_PHASE320_LAST_SNAP={build:LABEL,rad,checkedAt:new Date().toISOString()};return true;}
function tick(t){
  requestAnimationFrame(tick);if(!lastTick)lastTick=t;const dt=Math.min(.05,Math.max(.001,(t-lastTick)/1000));lastTick=t;
  const f=(hold.f?1:0)-(hold.b?1:0),side=(hold.r?1:0)-(hold.l?1:0);if(!f&&!side)return;
  release();resize();const p=pos();const d=direction();const rv=rightVec();const speed=2.4;const nx=p.x+(d.x*f+rv.x*side)*speed*dt;const nz=p.z+(d.z*f+rv.z*side)*speed*dt;const moved=setXZ(nx,nz);
  window.SVR_PHASE320_LAST_MOVEMENT={build:LABEL,active:true,moved,x:nx,z:nz,input:{forward:f,side},siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
}
function keys(e,on){const k=e.key?.toLowerCase?.();if(["w","arrowup"].includes(k))hold.f=on;if(["s","arrowdown"].includes(k))hold.b=on;if(["a","arrowleft"].includes(k))hold.l=on;if(["d","arrowright"].includes(k))hold.r=on;if(on&&["q"].includes(k))snap(-Math.PI/4);if(on&&["e"].includes(k))snap(Math.PI/4);}
function install(){
  if(installed)return true;installed=true;injectStyle();makePad();resize();release();
  window.addEventListener("resize",resize,{passive:true});window.visualViewport?.addEventListener?.("resize",resize,{passive:true});window.visualViewport?.addEventListener?.("scroll",resize,{passive:true});
  window.addEventListener("keydown",e=>keys(e,true));window.addEventListener("keyup",e=>keys(e,false));
  window.SVR_PHASE320_ANDROID_DESKTOP_MOVEMENT_PAD_GUARD_LOCK={build:LABEL,active:true,controls:"WASD/arrow keys plus on-screen pad",androidGuard:true,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE320_RESIZE_VIEW=resize;window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;status("Android/Desktop movement pad armed");requestAnimationFrame(tick);return true;
}
install();setInterval(()=>{install();resize();},3000);
