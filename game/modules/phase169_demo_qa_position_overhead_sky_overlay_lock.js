import * as THREE from "three";

const LABEL = "PHASE-174-CLEAN-OVERLAY-REALISTIC-SKY-POSITION-LOCK";
const SKY_ROOT = "PHASE174_REALISTIC_MOON_MARS_SKY_ROOT";
const PANEL_ID = "svr-phase169-position-panel";
const OVERLAY_RE = /(black|square|face|vignette|iris|fade|oculus|screen).*overlay|overlay.*(black|square|face|vignette|iris|fade|oculus|screen)|black.*screen|screen.*black/i;
let scene=null,camera=null,renderer=null,panel=null,moon=null,mars=null,root=null,started=false;
let panelVisible=true, overhead=false, overheadHeight=9.5, savedPose=null;
let lastMouse={x:0,y:0,floor:null}, lastClick=null;
function isQuest(){return /Quest|Oculus|Meta Quest/i.test(navigator.userAgent||"");}
function isAndroid(){return /Android/i.test(navigator.userAgent||"");}
function desktopPanel(){return !isQuest()&&!isAndroid()&&window.self===window.top;}
function sceneRoot(s){return s?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT")||s;}
function fixed(n,d=2){return Number.isFinite(n)?Number(n).toFixed(d):"--";}
function deg(r){return fixed(THREE.MathUtils.radToDeg(r),1);}
function nowIso(){return new Date().toISOString();}
function makeMoonTexture(){
  const c=document.createElement("canvas"); c.width=1536; c.height=768; const x=c.getContext("2d");
  const g=x.createRadialGradient(610,310,30,768,384,760); g.addColorStop(0,"#f7f4e8"); g.addColorStop(.55,"#bdbab1"); g.addColorStop(1,"#565653"); x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<360;i++){ const px=Math.random()*c.width, py=Math.random()*c.height, r=4+Math.random()*34; x.globalAlpha=.12+Math.random()*.18; x.fillStyle=Math.random()>.55?"#3d3d3b":"#f3f0e4"; x.beginPath(); x.ellipse(px,py,r,r*(.65+Math.random()*.25),0,0,Math.PI*2); x.fill(); }
  x.globalAlpha=.10; x.fillStyle="#fff"; x.fillRect(0,0,c.width,c.height); x.globalAlpha=1;
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
function makeMarsTexture(){
  const c=document.createElement("canvas"); c.width=1536; c.height=768; const x=c.getContext("2d");
  const g=x.createRadialGradient(640,300,40,768,384,760); g.addColorStop(0,"#dd7b4d"); g.addColorStop(.55,"#9a321f"); g.addColorStop(1,"#36100b"); x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<260;i++){ const px=Math.random()*c.width, py=Math.random()*c.height, w=30+Math.random()*160, h=6+Math.random()*36; x.globalAlpha=.13+Math.random()*.16; x.fillStyle=Math.random()>.5?"#ffd0a2":"#4a140c"; x.beginPath(); x.ellipse(px,py,w,h,Math.random()*.6-.3,0,Math.PI*2); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
function purgeOldSky(rootObj){
  const kill=[]; rootObj?.traverse?.(o=>{ const n=String(o.name||""); if(/MOON|MARS|CONSTELLATION|GEOMETRY_SKY|MODULAR_STARFIELD|PHASE169_MODULAR|PHASE200_SINGLE_VISIBLE/i.test(n)) kill.push(o); });
  [...new Set(kill)].forEach(o=>o.parent?.remove(o)); return kill.length;
}
function createStars(g){
  const geo=new THREE.BufferGeometry(), pts=[];
  for(let i=0;i<2200;i++){ const r=55+Math.random()*80,a=Math.random()*Math.PI*2,y=10+Math.random()*36; pts.push(Math.cos(a)*r,y,Math.sin(a)*r); }
  geo.setAttribute("position",new THREE.Float32BufferAttribute(pts,3));
  const stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:.04,sizeAttenuation:true,transparent:true,opacity:.76}));
  stars.name="PHASE174_CLEAN_STARFIELD_NO_SQUIGGLE_LINES"; g.add(stars);
}
function installSky(){
  const rootObj=sceneRoot(scene); if(!rootObj) return null;
  const removed=purgeOldSky(rootObj); const old=rootObj.getObjectByName?.(SKY_ROOT); if(old) old.parent?.remove(old);
  const g=new THREE.Group(); g.name=SKY_ROOT; rootObj.add(g); createStars(g);
  moon=new THREE.Mesh(new THREE.SphereGeometry(3.5,96,64),new THREE.MeshStandardMaterial({map:makeMoonTexture(),roughness:.88,metalness:0,emissive:0x080808,emissiveIntensity:.045}));
  moon.name="PHASE174_REALISTIC_TEXTURED_MOON_DOUBLE_SIZE_HIGH"; moon.position.set(-5.8,18.2,-31.5); g.add(moon);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(3.72,64,32),new THREE.MeshBasicMaterial({color:0xdde8ff,transparent:true,opacity:.045,side:THREE.BackSide,depthWrite:false})); halo.name="PHASE174_SOFT_MOON_GLOW_LOW_RADIANCE"; moon.add(halo);
  mars=new THREE.Mesh(new THREE.SphereGeometry(1.25,80,48),new THREE.MeshStandardMaterial({map:makeMarsTexture(),roughness:.82,metalness:0,emissive:0x100302,emissiveIntensity:.055}));
  mars.name="PHASE174_REALISTIC_TEXTURED_MARS_HIGH"; mars.position.set(-.9,17.0,-29.0); g.add(mars);
  root=g; window.SVR_PHASE169_SKY_AUDIT={build:LABEL,realisticSky:true,noSquiggleLines:true,moonDoubleSize:true,moonHigher:true,marsHigher:true,oldSkyRemoved:removed,checkedAt:nowIso()}; return window.SVR_PHASE169_SKY_AUDIT;
}
function tickSky(){ if(!root||!moon||!mars)return; const tt=performance.now()*.001; moon.rotation.y=tt*.018; mars.position.set(moon.position.x+Math.cos(tt*.16)*4.6,moon.position.y-.35+Math.sin(tt*.19)*.22,moon.position.z+Math.sin(tt*.16)*4.6); mars.rotation.y=tt*.13; }
function purgeBlackOverlays(){
  const selectors=["#bootFallback","#svrPhaseBadge",".phase-label",".face-overlay",".black-overlay",".square-overlay",".vignette",".iris",".fade",".oculus-overlay","[data-overlay]","[data-svr-overlay]"]; let dom=0,mesh=0;
  for(const sel of selectors) document.querySelectorAll(sel).forEach(el=>{ if(el.id===PANEL_ID)return; el.style.display="none"; el.style.opacity="0"; el.style.visibility="hidden"; el.style.pointerEvents="none"; dom++; });
  scene?.traverse?.(o=>{ const n=String(o.name||""); if(OVERLAY_RE.test(n)){ o.visible=false; o.parent?.remove?.(o); mesh++; } });
  document.body?.classList?.add("svr-no-black-square-overlay","svr-xr-clean-view");
  window.SVR_PHASE169_OVERLAY_AUDIT={build:LABEL,blackSquareOverlayPurge:true,domHidden:dom,meshRemoved:mesh,checkedAt:nowIso()}; return window.SVR_PHASE169_OVERLAY_AUDIT;
}
function makePanel(){ if(!desktopPanel())return null; let el=document.getElementById(PANEL_ID); if(el)return el; el=document.createElement("div"); el.id=PANEL_ID; el.style.cssText="position:fixed;left:10px;top:10px;z-index:2147483647;width:310px;max-width:calc(100vw - 20px);padding:10px 12px;border:1px solid rgba(127,252,255,.75);border-radius:12px;background:rgba(0,0,0,.78);color:#dff;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre;pointer-events:none"; document.body.appendChild(el); return el; }
function updateFloorTarget(ev){ if(!renderer||!camera)return; const rect=renderer.domElement.getBoundingClientRect(); const mx=ev?ev.clientX:lastMouse.x,my=ev?ev.clientY:lastMouse.y; lastMouse.x=mx; lastMouse.y=my; const ndc=new THREE.Vector2(((mx-rect.left)/rect.width)*2-1,-(((my-rect.top)/rect.height)*2-1)); const ray=new THREE.Raycaster(); ray.setFromCamera(ndc,camera); const hit=new THREE.Vector3(); if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),hit)) lastMouse.floor=hit; }
function cameraAngles(){ return new THREE.Euler().setFromQuaternion(camera.quaternion,"YXZ"); }
function copyPosition(){ const a=cameraAngles(); const hit=lastClick||lastMouse.floor; const text=`camera=(${fixed(camera.position.x)}, ${fixed(camera.position.y)}, ${fixed(camera.position.z)}) yaw=${deg(a.y)} pitch=${deg(a.x)} target=${hit?`(${fixed(hit.x)}, 0, ${fixed(hit.z)})`:"none"}`; navigator.clipboard?.writeText?.(text); window.SVR_PHASE169_LAST_COPIED_POSITION=text; }
function toggleOverhead(){ if(!camera||!desktopPanel())return; overhead=!overhead; if(overhead){ savedPose={pos:camera.position.clone(),quat:camera.quaternion.clone()}; camera.position.set(0,overheadHeight,7.5); camera.lookAt(0,.2,.75); } else if(savedPose){ camera.position.copy(savedPose.pos); camera.quaternion.copy(savedPose.quat); } }
function setOverheadHeight(d){ overheadHeight=THREE.MathUtils.clamp(overheadHeight+d,2.2,22); if(overhead&&camera){camera.position.y=overheadHeight; camera.lookAt(0,.2,.75);} }
function updatePanel(){ if(!panel||!camera)return; panel.style.display=panelVisible?"block":"none"; const a=cameraAngles(),f=lastMouse.floor,c=lastClick; panel.textContent=["SVR POSITION DISPLAY — laptop only",`build: ${LABEL}`,`camera x:${fixed(camera.position.x)} y:${fixed(camera.position.y)} z:${fixed(camera.position.z)}`,`yaw:${deg(a.y)} pitch:${deg(a.x)}`,`mouse floor: ${f?`x:${fixed(f.x)} z:${fixed(f.z)}`:"--"}`,`last click:  ${c?`x:${fixed(c.x)} z:${fixed(c.z)}`:"--"}`,`overhead: ${overhead?"ON":"OFF"} height:${fixed(overheadHeight,1)}`,"keys: P panel | B bird view | PgUp/PgDn height | Shift+C copy"].join("\n"); }
function installPositionTools(){ if(!desktopPanel())return false; panel=makePanel(); renderer?.domElement?.addEventListener("pointermove",updateFloorTarget,{passive:true}); renderer?.domElement?.addEventListener("pointerdown",ev=>{updateFloorTarget(ev); if(lastMouse.floor) lastClick=lastMouse.floor.clone();},{passive:true}); window.addEventListener("keydown",ev=>{ if(ev.code==="KeyP")panelVisible=!panelVisible; if(ev.code==="KeyB")toggleOverhead(); if(ev.code==="PageUp")setOverheadHeight(.5); if(ev.code==="PageDown")setOverheadHeight(-.5); if(ev.shiftKey&&ev.code==="KeyC")copyPosition(); }); return true; }
function install(){ scene=window.__SVR_SCENE__; camera=window.__SVR_CAMERA__; renderer=window.__SVR_RENDERER__; if(!scene||!camera||!renderer)return false; const sky=installSky(); const panelOn=installPositionTools(); const overlay=purgeBlackOverlays(); window.SVR_PHASE169_DEMO_QA_POSITION_SKY_OVERLAY_MODULE_LOCK={build:LABEL,active:true,positionPanel:panelOn,realisticSky:true,overlay,sky,checkedAt:nowIso()}; window.SVR_RUN_PHASE169_POSITION_AUDIT=()=>window.SVR_PHASE169_DEMO_QA_POSITION_SKY_OVERLAY_MODULE_LOCK; window.SVR_RUN_PHASE169_OVERLAY_AUDIT=()=>window.SVR_PHASE169_OVERLAY_AUDIT; window.SVR_RUN_PHASE169_SKY_AUDIT=()=>window.SVR_PHASE169_SKY_AUDIT; window.SVR_LOCKED_FINAL_BUILD=LABEL; window.SVR_LIVE_BUILD_POINTER=LABEL; if(!started){started=true; setInterval(()=>{purgeBlackOverlays(); tickSky(); updatePanel();},250);} return true; }
[120,300,700,1300,2500,5000,9000].forEach(ms=>setTimeout(install,ms)); install();
