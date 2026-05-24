import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE = "PHASE-152-WEBXR-HANDS-PURPLE-FIRE-SKY-BRAND-LOCK";
const SNAP = Math.PI / 4;
const TABLE_BLOCK = 2.85;
const app = document.getElementById("app") || document.body;
const statusEl = document.getElementById("status"), modeEl = document.getElementById("mode");
const setStatus = t => { if (statusEl) statusEl.textContent = t; };
const setMode = t => { if (modeEl) modeEl.textContent = t; };

const debug = document.createElement("div");
debug.style.cssText = "position:fixed;left:12px;top:54px;z-index:90;padding:7px 10px;border:1px solid #b48cff;border-radius:12px;background:rgba(0,0,0,.82);color:#e6d7ff;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none";
debug.textContent = "Phase 152 booting";
document.body.appendChild(debug);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03030a);
const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.06, 220);
camera.position.set(0, 1.62, 0);
const dolly = new THREE.Group();
dolly.name = "SVR_PHASE152_WEBXR_DOLLY_LOCKED_BASE";
dolly.position.set(0, 0, 7.5);
dolly.add(camera);
scene.add(dolly);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, depth:true, stencil:false, powerPreference:"high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 0.68));
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
try { renderer.xr.setFramebufferScaleFactor?.(0.68); renderer.xr.setFoveation?.(0.30); } catch {}
app.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer, { requiredFeatures:["local-floor"], optionalFeatures:["bounded-floor", "hand-tracking"] }));

const loader = new THREE.TextureLoader();
function loadTex(url, rx=1, ry=1){ const t=loader.load(url,undefined,undefined,()=>{}); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); t.anisotropy=4; return t; }
function canvasTex(draw, w=512, h=512){ const c=document.createElement("canvas"); c.width=w; c.height=h; const x=c.getContext("2d"); draw(x,c); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
function brandTex(){ return canvasTex((x,c)=>{ const g=x.createRadialGradient(256,256,10,256,256,245); g.addColorStop(0,"#ffffff"); g.addColorStop(.18,"#d9c2ff"); g.addColorStop(.48,"#7c2cff"); g.addColorStop(.82,"#26004f"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,512,512); x.strokeStyle="#f6e27f"; x.lineWidth=18; x.beginPath(); x.arc(256,256,164,0,Math.PI*2); x.stroke(); x.fillStyle="#fff"; x.font="900 116px system-ui,Arial"; x.textAlign="center"; x.textBaseline="middle"; x.fillText("SVR",256,235); x.fillStyle="#f6e27f"; x.font="900 42px system-ui,Arial"; x.fillText("POKER",256,320); },512,512); }
function starTex(){ return canvasTex((x,c)=>{ const bg=x.createLinearGradient(0,0,0,512); bg.addColorStop(0,"#020014"); bg.addColorStop(.45,"#07001d"); bg.addColorStop(1,"#000007"); x.fillStyle=bg; x.fillRect(0,0,1024,512); let s=7331; const rnd=()=>{s=(s*48271)%2147483647; return s/2147483647;}; for(let i=0;i<850;i++){ const y=rnd()*360; const a=.25+rnd()*.65; const sz=rnd()<.05?2:1; x.fillStyle=`rgba(255,255,255,${a})`; x.fillRect(rnd()*1024,y,sz,sz); } x.fillStyle="rgba(124,44,255,.20)"; x.fillRect(0,350,1024,120); },1024,512); }
function handMat(color){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.92, depthTest:true, depthWrite:false, toneMapped:false }); }

const sky = new THREE.Mesh(new THREE.SphereGeometry(620,36,18), new THREE.MeshBasicMaterial({ map:starTex(), side:THREE.BackSide, depthWrite:false, fog:false }));
sky.name = "SVR_PHASE152_PURPLE_STAR_SKY"; sky.frustumCulled=false; scene.add(sky);
const moon = new THREE.Mesh(new THREE.SphereGeometry(8.5,32,20), new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/moon_diffuse.png"), color:0xffffff, fog:false }));
moon.name="SVR_PHASE152_TEXTURE_MOON_HIGH_NORTH"; moon.position.set(-48,58,-108); scene.add(moon);
const mars = new THREE.Mesh(new THREE.SphereGeometry(5.2,28,18), new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/mars/diffuse_1k.jpg"), color:0xff9a6a, fog:false }));
mars.name="SVR_PHASE152_TEXTURE_MARS_HIGH_EAST"; mars.position.set(92,46,-44); scene.add(mars);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(36,36), new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/slate_basecolor.jpg",6,6), side:THREE.FrontSide }));
floor.rotation.x=-Math.PI/2; scene.add(floor);
const wallMat = new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/stonebrick_wall_basecolor.png",2,1), side:THREE.DoubleSide });
[[0,-17,0],[-17,0,Math.PI/2],[17,0,-Math.PI/2]].forEach(([x,z,r],i)=>{ const w=new THREE.Mesh(new THREE.PlaneGeometry(10,4.2), wallMat); w.position.set(x,2.2,z); w.rotation.y=r; scene.add(w); });
const brand = new THREE.Mesh(new THREE.PlaneGeometry(4.8,4.8), new THREE.MeshBasicMaterial({ map:brandTex(), transparent:true, depthWrite:false, side:THREE.DoubleSide }));
brand.name="SVR_PHASE152_PURPLE_BRAND_LOGO"; brand.position.set(0,2.55,-16.92); brand.renderOrder=25; scene.add(brand);
const table = new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,.22,64), new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/tablefelt.png") }));
table.position.set(0,.55,0); scene.add(table);
const centerBlock = new THREE.Mesh(new THREE.RingGeometry(TABLE_BLOCK,TABLE_BLOCK+.08,96), new THREE.MeshBasicMaterial({ color:0xff5572, transparent:true, opacity:.30, side:THREE.DoubleSide, depthWrite:false }));
centerBlock.rotation.x=-Math.PI/2; centerBlock.position.y=.055; scene.add(centerBlock);
scene.add(new THREE.HemisphereLight(0xffffff,0x111122,.92));

const targetGroup = new THREE.Group(); targetGroup.visible=false; scene.add(targetGroup);
const targetLogo = new THREE.Mesh(new THREE.CircleGeometry(.88,72), new THREE.MeshBasicMaterial({ map:brandTex(), transparent:true, depthTest:false, depthWrite:false, side:THREE.DoubleSide }));
targetLogo.rotation.x=-Math.PI/2; targetLogo.renderOrder=1000; targetGroup.add(targetLogo);
const targetRing = new THREE.Mesh(new THREE.RingGeometry(1.06,1.43,80), new THREE.MeshBasicMaterial({ color:0xb48cff, transparent:true, opacity:1, depthTest:false, depthWrite:false, side:THREE.DoubleSide }));
targetRing.rotation.x=-Math.PI/2; targetRing.position.y=.012; targetRing.renderOrder=1001; targetGroup.add(targetRing);
const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]), new THREE.LineBasicMaterial({ color:0xe6d7ff, transparent:true, opacity:1, depthTest:false, depthWrite:false }));
line.visible=false; line.renderOrder=1002; scene.add(line);

let rc=null,gp=null,armed=false,armedBy="none",valid=false,cd=0,selectHeld=false,snapCd=0,aimMode="none",stickPair="none",handMode="none";
for(let i=0;i<2;i++){
  const c=renderer.xr.getController(i); c.visible=false; dolly.add(c);
  c.addEventListener("connected",e=>{ c.inputSource=e.data; if(e.data?.handedness==="right"){ rc=c; gp=e.data.gamepad||null; setStatus("Right controller connected"); }});
  c.addEventListener("disconnected",()=>{ if(rc===c){rc=null;gp=null;} });
  c.addEventListener("selectstart",()=>{ if(c!==rc)return; selectHeld=true; arm("trigger"); });
  c.addEventListener("selectend",()=>{ if(c!==rc)return; selectHeld=false; if(armed&&valid) commit("selectend"); disarm(); });
  c.addEventListener("squeezestart",()=>{ if(c!==rc)return; arm("grip-preview"); });
  c.addEventListener("squeezeend",()=>{ if(c!==rc)return; if(armedBy==="grip-preview"&&!selectHeld) disarm(); });
}

const handState=[];
const jointKeys=["wrist","thumb-tip","index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"];
for(let i=0;i<2;i++){
  const hand=renderer.xr.getHand(i); hand.visible=false; dolly.add(hand);
  const vis=new THREE.Group(); vis.name="SVR_PHASE152_HAND_VIS_"+i; scene.add(vis);
  const meshes={};
  jointKeys.forEach(k=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(k==="wrist"?.045:.028,12,8),handMat(k==="wrist"?0x2b164d:0x8d5dff)); m.visible=false; m.renderOrder=800; vis.add(m); meshes[k]=m; });
  const fire=new THREE.Mesh(new THREE.SphereGeometry(.12,18,12), new THREE.MeshBasicMaterial({ color:0xb000ff, transparent:true, opacity:.82, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending })); fire.visible=false; fire.renderOrder=900; scene.add(fire);
  handState.push({hand,vis,meshes,fire,fist:false,wasFist:false,started:0});
}

const origin=new THREE.Vector3(),dirA=new THREE.Vector3(),dirB=new THREE.Vector3(),rawP=new THREE.Vector3(),invP=new THREE.Vector3(),fallback=new THREE.Vector3(),camPos=new THREE.Vector3(),camFwd=new THREE.Vector3(),finalP=new THREE.Vector3(),head=new THREE.Vector3(),head2=new THREE.Vector3(),mv=new THREE.Vector3(),tmp=new THREE.Vector3(),wristP=new THREE.Vector3(),tipP=new THREE.Vector3();
let last=performance.now(),acc=0,samples=0,worst=0,report=performance.now(),tw=false,gw=false,t0=0;
function getGP(){ return gp||rc?.inputSource?.gamepad; } function button(i){ return getGP()?.buttons?.[i]?.value||0; } function axes(){ return getGP()?.axes||[]; }
function dz(v){ return Math.abs(v)<.14?0:v; } function xrCam(){ return renderer.xr.isPresenting?renderer.xr.getCamera(camera):camera; }
function stick(){ const a=axes(); const p0={x:dz(a[0]||0),y:dz(a[1]||0),n:"01"},p1={x:dz(a[2]||0),y:dz(a[3]||0),n:"23"}; const s=Math.hypot(p1.x,p1.y)>Math.hypot(p0.x,p0.y)?p1:p0; stickPair=s.n; return s; }
function clamp(){ dolly.position.x=THREE.MathUtils.clamp(dolly.position.x,-15,15); dolly.position.z=THREE.MathUtils.clamp(dolly.position.z,-15,15); }
function headingForward(){ mv.set(-Math.sin(dolly.rotation.y),0,-Math.cos(dolly.rotation.y)).normalize(); return mv; }
function arm(k){ if(performance.now()<cd) return; armed=true; armedBy=k; setStatus(k==="hand-fist"?"Fist purple fire: open hand to teleport":k==="grip-preview"?"Grip preview only":"Trigger aiming"); }
function disarm(){ armed=false; armedBy="none"; valid=false; targetGroup.visible=false; line.visible=false; }
function snap(a){ const x=xrCam(); x.getWorldPosition(head); dolly.rotation.y+=a; dolly.updateMatrixWorld(true); x.getWorldPosition(head2); dolly.position.x+=head.x-head2.x; dolly.position.z+=head.z-head2.z; clamp(); setStatus(a>0?"Snap right 45":"Snap left 45"); }
function move(dt){ if(!renderer.xr.isPresenting||armed)return; const s=stick(),ax=Math.abs(s.x),ay=Math.abs(s.y),now=performance.now(); if(ax>.72&&ax>ay*1.35&&now>snapCd){ snap(Math.sign(s.x)*-SNAP); snapCd=now+420; return; } if(ay>.14){ dolly.position.addScaledVector(headingForward(),-s.y*dt*1.55); clamp(); } }
function floorHit(o,d,out){ if(Math.abs(d.y)<.035)return false; const t=-o.y/d.y; if(!isFinite(t)||t<.08||t>13)return false; out.copy(o).addScaledVector(d,t); out.y=0; return true; }
function score(p){ const vx=p.x-camPos.x,vz=p.z-camPos.z,front=vx*camFwd.x+vz*camFwd.z,dist=Math.hypot(vx,vz); return front<-.25?-9999:front*2-Math.abs(dist-4.2)*.25; }
function isCenterBlocked(){ return Math.hypot(finalP.x,finalP.z)<TABLE_BLOCK; }
function computeTarget(useView=false){ const x=xrCam(); x.getWorldPosition(camPos); x.getWorldDirection(camFwd); camFwd.y=0; if(camFwd.lengthSq()<.001)camFwd.copy(headingForward()); camFwd.normalize(); fallback.copy(camPos).addScaledVector(camFwd,4.2).setY(0); if(useView||!rc){ finalP.copy(fallback); aimMode=useView?"hand-view-forward":"fallback"; } else { rc.updateWorldMatrix(true,false); rc.getWorldPosition(origin); rc.getWorldDirection(dirA); dirA.normalize(); dirB.copy(dirA).multiplyScalar(-1); const okA=floorHit(origin,dirA,rawP), okB=floorHit(origin,dirB,invP), scA=okA?score(rawP):-9999, scB=okB?score(invP):-9999; if(scA>=scB&&okA){finalP.copy(rawP); aimMode="raw";} else if(okB){finalP.copy(invP); aimMode="inverted";} else {finalP.copy(fallback); aimMode="fallback";} }
  const vx=finalP.x-camPos.x,vz=finalP.z-camPos.z; if(vx*camFwd.x+vz*camFwd.z<.45){ finalP.copy(fallback); aimMode="front-clamp"; } finalP.x=THREE.MathUtils.clamp(finalP.x,-15,15); finalP.z=THREE.MathUtils.clamp(finalP.z,-15,15); finalP.y=0; valid=!isCenterBlocked(); if(!valid){ targetGroup.visible=false; line.visible=false; setStatus("Table center blocked: aim outside ring"); } return valid; }
function showTarget(useView=false){ if(!computeTarget(useView))return; targetGroup.visible=true; line.visible=true; targetGroup.position.set(finalP.x,.066,finalP.z); const p=line.geometry.attributes.position; p.setXYZ(0,origin.x||camPos.x,origin.y||1.2,origin.z||camPos.z); p.setXYZ(1,finalP.x,.12,finalP.z); p.needsUpdate=true; }
function commit(reason){ if(performance.now()<cd||!valid)return; cd=performance.now()+850; const x=xrCam(); x.getWorldPosition(head); dolly.position.x+=finalP.x-head.x; dolly.position.z+=finalP.z-head.z; clamp(); window.SVR_PHASE152_LAST_TELEPORT={reason,aimMode,target:{x:finalP.x,z:finalP.z},dolly:{x:dolly.position.x,z:dolly.position.z},at:new Date().toISOString()}; setStatus("Teleported"); setMode("Dolly moved"); }
function controllerInput(){ const tr=button(0),gr=button(1); if(tr>.18&&!tw){t0=performance.now(); arm("trigger");} if(tw&&tr<=.10){ if(performance.now()-t0>90&&armed&&valid)commit("trigger-release"); if(armedBy!=="grip-preview"&&armedBy!=="hand-fist")disarm(); } if(gr>.25&&!gw)arm("grip-preview"); if(gw&&gr<=.12&&!selectHeld&&armedBy==="grip-preview")disarm(); tw=tr>.18; gw=gr>.25; }
function updateHands(){ handMode="none"; handState.forEach((s,i)=>{ const wrist=s.hand.joints?.wrist; let shown=false; if(wrist){ wrist.getWorldPosition(wristP); s.meshes.wrist.position.copy(wristP); s.meshes.wrist.visible=true; shown=true; let curled=0,total=0; ["index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"].forEach(k=>{ const j=s.hand.joints?.[k]; if(j){ j.getWorldPosition(tipP); s.meshes[k].position.copy(tipP); s.meshes[k].visible=true; total++; if(tipP.distanceTo(wristP)<.145) curled++; }}); ["thumb-tip"].forEach(k=>{ const j=s.hand.joints?.[k]; if(j){ j.getWorldPosition(tipP); s.meshes[k].position.copy(tipP); s.meshes[k].visible=true; }}); s.fist=total>=3 && curled>=3; s.fire.visible=s.fist; if(s.fist){ s.fire.position.copy(wristP); s.fire.scale.setScalar(1+Math.sin(performance.now()*.012)*.10); handMode=i===0?"left-fist":"right-fist"; if(!s.wasFist){ s.started=performance.now(); arm("hand-fist"); } } if(s.wasFist && !s.fist && armedBy==="hand-fist"){ if(performance.now()-s.started>180 && valid) commit("hand-fist-release"); disarm(); } s.wasFist=s.fist; } Object.values(s.meshes).forEach(m=>{ if(!shown) m.visible=false; }); if(!s.fist) s.fire.visible=false; }); }

addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
renderer.xr.addEventListener("sessionstart",()=>{ setStatus("Phase 152 WebXR ready"); setMode("Controller + hands"); });
renderer.setAnimationLoop(()=>{ const now=performance.now(),dt=Math.min((now-last)/1000,.05); last=now; move(dt); controllerInput(); updateHands(); if(armed) showTarget(armedBy==="hand-fist"); moon.rotation.y+=dt*.05; mars.rotation.y+=dt*.06; acc+=dt; samples++; worst=Math.max(worst,dt*1000); if(now-report>1000){ const fps=(1/Math.max(acc/samples,.001)).toFixed(1); debug.textContent=`PHASE 152 HANDS/SKY/BRAND\nFPS ${fps} • worst ${worst.toFixed(0)}ms\nDolly ${dolly.position.x.toFixed(2)}, ${dolly.position.z.toFixed(2)} • Yaw ${(THREE.MathUtils.radToDeg(dolly.rotation.y)%360).toFixed(0)}\nStick axes${stickPair} • Hand ${handMode}\nAim ${aimMode}\nTarget ${valid?finalP.x.toFixed(2)+", "+finalP.z.toFixed(2):"none"}`; acc=0; samples=0; worst=0; report=now; } renderer.render(scene,camera); });
window.SVR_PHASE152_WEBXR_HANDS_SKY_BRAND={phase:PHASE,base:"Phase 151 heading/no-center-lock preserved",hands:"visible low-poly joint gloves; fist shows purple fire; fist release teleports",brand:"procedural purple SVR logo added to wall and target",sky:"purple star sky plus textured Moon and Mars",noMusic:true,noWatch:true,worldMoved:false,referenceSpaceMutated:false,nextBuild:"PHASE-153-RESTORE-LOBBY-PORTALS-ON-WORKING-HANDS-BASE"};
setStatus("Phase 152 ready"); setMode("Hands + sky + brand");
