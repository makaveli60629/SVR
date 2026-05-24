import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE = "PHASE-153-WEBXR-OFFICIAL-LOGO-HANDS-HALO-SKY-LOCK";
const SNAP = Math.PI / 4;
const TABLE_BLOCK = 2.85;
const BRAND_LOGO_URL = "../logo.png";

const app = document.getElementById("app") || document.body;
const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
const setStatus = (t) => { if (statusEl) statusEl.textContent = t; };
const setMode = (t) => { if (modeEl) modeEl.textContent = t; };

const debug = document.createElement("div");
debug.style.cssText = "position:fixed;left:12px;top:54px;z-index:90;padding:7px 10px;border:1px solid #b48cff;border-radius:12px;background:rgba(0,0,0,.82);color:#e6d7ff;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none";
debug.textContent = "Phase 153 booting";
document.body.appendChild(debug);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03030a);

const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.06, 260);
camera.position.set(0, 1.62, 0);

const dolly = new THREE.Group();
dolly.name = "SVR_PHASE153_WEBXR_DOLLY_LOCKED_BASE";
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
function loadTex(url, rx=1, ry=1, onErrorFallback=null){
  const tex = loader.load(url, (t)=>{ t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; }, undefined, ()=>{
    if (onErrorFallback) onErrorFallback();
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = 4;
  return tex;
}
function canvasTex(draw, w=512, h=512){
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); draw(ctx, c);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function fallbackBrandTex(){
  return canvasTex((x)=>{
    const g=x.createRadialGradient(256,256,10,256,256,245);
    g.addColorStop(0,"#ffffff"); g.addColorStop(.18,"#d9c2ff"); g.addColorStop(.48,"#7c2cff"); g.addColorStop(.82,"#26004f"); g.addColorStop(1,"rgba(0,0,0,0)");
    x.fillStyle=g; x.fillRect(0,0,512,512);
    x.strokeStyle="#f6e27f"; x.lineWidth=18; x.beginPath(); x.arc(256,256,164,0,Math.PI*2); x.stroke();
    x.fillStyle="#fff"; x.font="900 116px system-ui,Arial"; x.textAlign="center"; x.textBaseline="middle"; x.fillText("SVR",256,235);
    x.fillStyle="#f6e27f"; x.font="900 42px system-ui,Arial"; x.fillText("POKER",256,320);
  });
}
function officialBrandTexture(){
  const tex = loadTex(BRAND_LOGO_URL, 1, 1);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  window.SVR_PHASE153_BRAND_LOGO_URL = BRAND_LOGO_URL;
  return tex;
}
function starTex(){
  return canvasTex((x)=>{
    const bg=x.createLinearGradient(0,0,0,512);
    bg.addColorStop(0,"#020014"); bg.addColorStop(.45,"#07001d"); bg.addColorStop(1,"#000007");
    x.fillStyle=bg; x.fillRect(0,0,1024,512);
    let seed=7331; const rnd=()=>{seed=(seed*48271)%2147483647; return seed/2147483647;};
    for(let i=0;i<900;i++){ const y=rnd()*390; const a=.25+rnd()*.68; const s=rnd()<.05?2:1; x.fillStyle=`rgba(255,255,255,${a})`; x.fillRect(rnd()*1024,y,s,s); }
    x.fillStyle="rgba(124,44,255,.22)"; x.fillRect(0,350,1024,120);
  },1024,512);
}
function planetFallback(kind){
  return canvasTex((x,c)=>{
    const g=x.createRadialGradient(190,160,20,256,256,245);
    if(kind==="moon"){
      g.addColorStop(0,"#ffffff"); g.addColorStop(.45,"#aeb6c8"); g.addColorStop(1,"#22283a");
    } else {
      g.addColorStop(0,"#ffcf8c"); g.addColorStop(.45,"#d66a3a"); g.addColorStop(1,"#3c120b");
    }
    x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
    x.fillStyle=kind==="moon"?"rgba(20,20,30,.22)":"rgba(80,20,5,.25)";
    for(let i=0;i<34;i++){ x.beginPath(); x.arc(Math.random()*512,Math.random()*512,8+Math.random()*32,0,Math.PI*2); x.fill(); }
  });
}
function gloveTexture(){
  return canvasTex((x,c)=>{
    const g=x.createLinearGradient(0,0,512,512);
    g.addColorStop(0,"#1a082e"); g.addColorStop(.35,"#53208f"); g.addColorStop(.72,"#0c1630"); g.addColorStop(1,"#090411");
    x.fillStyle=g; x.fillRect(0,0,512,512);
    x.strokeStyle="rgba(255,255,255,.16)"; x.lineWidth=12;
    for(let i=0;i<10;i++){ x.beginPath(); x.moveTo(-50,i*58); x.bezierCurveTo(130,i*48,330,i*70,560,i*36); x.stroke(); }
    x.strokeStyle="rgba(180,140,255,.45)"; x.lineWidth=8; x.strokeRect(42,42,428,428);
    x.fillStyle="rgba(0,220,255,.30)"; x.fillRect(0,240,512,45);
  });
}

const brandMap = officialBrandTexture();
const brandMat = new THREE.MeshBasicMaterial({ map:brandMap, transparent:true, depthWrite:false, side:THREE.DoubleSide, toneMapped:false });

const sky = new THREE.Mesh(new THREE.SphereGeometry(680,36,18), new THREE.MeshBasicMaterial({ map:starTex(), side:THREE.BackSide, depthWrite:false, fog:false }));
sky.name = "SVR_PHASE153_PURPLE_STAR_SKY"; sky.frustumCulled = false; scene.add(sky);

const moonMat = new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/moon_diffuse.png"), color:0xffffff, fog:false, toneMapped:false });
const moon = new THREE.Mesh(new THREE.SphereGeometry(10.5,40,24), moonMat);
moon.name = "SVR_PHASE153_TEXTURED_MOON_HIGH_NORTH"; moon.position.set(-42,66,-112); scene.add(moon);
const marsMat = new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/mars/diffuse_1k.jpg"), color:0xffaa72, fog:false, toneMapped:false });
const mars = new THREE.Mesh(new THREE.SphereGeometry(6.5,32,20), marsMat);
mars.name = "SVR_PHASE153_TEXTURED_MARS_HIGH_EAST"; mars.position.set(100,54,-48); scene.add(mars);
const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:canvasTex((x)=>{ const g=x.createRadialGradient(256,256,8,256,256,250); g.addColorStop(0,"rgba(255,255,255,.7)"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,512,512); }), color:0xdfe8ff, transparent:true, opacity:.45, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
moonHalo.scale.set(46,46,1); moon.add(moonHalo);
const marsHalo = moonHalo.clone(); marsHalo.material = moonHalo.material.clone(); marsHalo.material.color.set(0xff9b6b); marsHalo.material.opacity=.32; marsHalo.scale.set(32,32,1); mars.add(marsHalo);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(36,36), new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/slate_basecolor.jpg",6,6), side:THREE.FrontSide }));
floor.rotation.x = -Math.PI/2; scene.add(floor);
const wallMat = new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/stonebrick_wall_basecolor.png",2,1), side:THREE.DoubleSide });
[[0,-17,0],[-17,0,Math.PI/2],[17,0,-Math.PI/2]].forEach(([x,z,r],i)=>{ const w=new THREE.Mesh(new THREE.PlaneGeometry(10,4.2), wallMat); w.position.set(x,2.2,z); w.rotation.y=r; scene.add(w); });
const brandWall = new THREE.Mesh(new THREE.PlaneGeometry(5.8,5.8), brandMat.clone());
brandWall.name = "SVR_PHASE153_OFFICIAL_BRAND_LOGO_WALL"; brandWall.position.set(0,2.65,-16.9); brandWall.renderOrder=30; scene.add(brandWall);
const table = new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,.22,64), new THREE.MeshBasicMaterial({ map:loadTex("./assets/texture/tablefelt.png") }));
table.position.set(0,.55,0); scene.add(table);
const centerBlock = new THREE.Mesh(new THREE.RingGeometry(TABLE_BLOCK,TABLE_BLOCK+.08,96), new THREE.MeshBasicMaterial({ color:0xff5572, transparent:true, opacity:.30, side:THREE.DoubleSide, depthWrite:false }));
centerBlock.rotation.x=-Math.PI/2; centerBlock.position.y=.055; scene.add(centerBlock);
scene.add(new THREE.HemisphereLight(0xffffff,0x111122,.92));

const targetGroup = new THREE.Group(); targetGroup.visible=false; scene.add(targetGroup);
const targetLogo = new THREE.Mesh(new THREE.CircleGeometry(.95,72), brandMat.clone());
targetLogo.rotation.x=-Math.PI/2; targetLogo.renderOrder=1200; targetGroup.add(targetLogo);
const targetRing = new THREE.Mesh(new THREE.RingGeometry(1.08,1.52,80), new THREE.MeshBasicMaterial({ color:0xb48cff, transparent:true, opacity:1, depthTest:false, depthWrite:false, side:THREE.DoubleSide, toneMapped:false }));
targetRing.rotation.x=-Math.PI/2; targetRing.position.y=.018; targetRing.renderOrder=1201; targetGroup.add(targetRing);
const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]), new THREE.LineBasicMaterial({ color:0xe6d7ff, transparent:true, opacity:1, depthTest:false, depthWrite:false }));
line.visible=false; line.renderOrder=1202; scene.add(line);

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

const gloveMap = gloveTexture();
function handMaterial(kind){ return new THREE.MeshBasicMaterial({ map:gloveMap, color:kind==="wrist"?0x7b35ff:0xb48cff, transparent:true, opacity:.96, depthTest:true, depthWrite:false, toneMapped:false }); }
const jointKeys=["wrist","thumb-tip","index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"];
const handState=[];
for(let i=0;i<2;i++){
  const hand=renderer.xr.getHand(i); hand.visible=false; dolly.add(hand);
  const vis=new THREE.Group(); vis.name="SVR_PHASE153_TEXTURED_HAND_VIS_"+i; scene.add(vis);
  const meshes={};
  jointKeys.forEach(k=>{ const radius = k === "wrist" ? 0.055 : 0.032; const m=new THREE.Mesh(new THREE.SphereGeometry(radius,14,10),handMaterial(k)); m.visible=false; m.renderOrder=850; vis.add(m); meshes[k]=m; });
  const palm = new THREE.Mesh(new THREE.SphereGeometry(.075,16,10), handMaterial("wrist")); palm.scale.set(1.2,.72,1.0); palm.visible=false; vis.add(palm);
  const fire=new THREE.Mesh(new THREE.SphereGeometry(.085,18,12), new THREE.MeshBasicMaterial({ color:0xb000ff, transparent:true, opacity:.72, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false }));
  fire.visible=false; fire.renderOrder=900; scene.add(fire);
  handState.push({hand,vis,meshes,palm,fire,fist:false,wasFist:false,started:0});
}

const origin=new THREE.Vector3(),dirA=new THREE.Vector3(),dirB=new THREE.Vector3(),rawP=new THREE.Vector3(),invP=new THREE.Vector3(),fallback=new THREE.Vector3(),camPos=new THREE.Vector3(),camFwd=new THREE.Vector3(),finalP=new THREE.Vector3(),head=new THREE.Vector3(),head2=new THREE.Vector3(),mv=new THREE.Vector3(),wristP=new THREE.Vector3(),tipP=new THREE.Vector3();
let last=performance.now(),acc=0,samples=0,worst=0,report=performance.now(),tw=false,gw=false,t0=0;
function getGP(){ return gp||rc?.inputSource?.gamepad; }
function button(i){ return getGP()?.buttons?.[i]?.value||0; }
function axes(){ return getGP()?.axes||[]; }
function dz(v){ return Math.abs(v)<.14?0:v; }
function xrCam(){ return renderer.xr.isPresenting?renderer.xr.getCamera(camera):camera; }
function stick(){ const a=axes(); const p0={x:dz(a[0]||0),y:dz(a[1]||0),n:"01"},p1={x:dz(a[2]||0),y:dz(a[3]||0),n:"23"}; const s=Math.hypot(p1.x,p1.y)>Math.hypot(p0.x,p0.y)?p1:p0; stickPair=s.n; return s; }
function clamp(){ dolly.position.x=THREE.MathUtils.clamp(dolly.position.x,-15,15); dolly.position.z=THREE.MathUtils.clamp(dolly.position.z,-15,15); }
function headingForward(){ mv.set(-Math.sin(dolly.rotation.y),0,-Math.cos(dolly.rotation.y)).normalize(); return mv; }
function arm(k){ if(performance.now()<cd) return; armed=true; armedBy=k; setStatus(k==="hand-fist"?"Fist fire active: halo should show":k==="grip-preview"?"Grip preview only":"Trigger aiming"); }
function disarm(){ armed=false; armedBy="none"; valid=false; targetGroup.visible=false; line.visible=false; }
function snap(a){ const x=xrCam(); x.getWorldPosition(head); dolly.rotation.y+=a; dolly.updateMatrixWorld(true); x.getWorldPosition(head2); dolly.position.x+=head.x-head2.x; dolly.position.z+=head.z-head2.z; clamp(); setStatus(a>0?"Snap right 45":"Snap left 45"); }
function move(dt){ if(!renderer.xr.isPresenting||armed)return; const s=stick(),ax=Math.abs(s.x),ay=Math.abs(s.y),now=performance.now(); if(ax>.72&&ax>ay*1.35&&now>snapCd){ snap(Math.sign(s.x)*-SNAP); snapCd=now+420; return; } if(ay>.14){ dolly.position.addScaledVector(headingForward(),-s.y*dt*1.55); clamp(); } }
function floorHit(o,d,out){ if(Math.abs(d.y)<.035)return false; const t=-o.y/d.y; if(!isFinite(t)||t<.08||t>13)return false; out.copy(o).addScaledVector(d,t); out.y=0; return true; }
function score(p){ const vx=p.x-camPos.x,vz=p.z-camPos.z,front=vx*camFwd.x+vz*camFwd.z,dist=Math.hypot(vx,vz); return front<-.25?-9999:front*2-Math.abs(dist-4.2)*.25; }
function isCenterBlocked(){ return Math.hypot(finalP.x,finalP.z)<TABLE_BLOCK; }
function pushHandTargetOutsideCenter(){ const dir = camFwd.clone(); dir.y=0; if(dir.lengthSq()<.001)dir.copy(headingForward()); dir.normalize(); finalP.set(dir.x*(TABLE_BLOCK+.85),0,dir.z*(TABLE_BLOCK+.85)); aimMode += "+hand-center-clear"; }
function computeTarget(useHandView=false){ const x=xrCam(); x.getWorldPosition(camPos); x.getWorldDirection(camFwd); camFwd.y=0; if(camFwd.lengthSq()<.001)camFwd.copy(headingForward()); camFwd.normalize(); fallback.copy(camPos).addScaledVector(camFwd,4.2).setY(0); if(useHandView||!rc){ finalP.copy(fallback); aimMode=useHandView?"hand-view-forward":"fallback"; } else { rc.updateWorldMatrix(true,false); rc.getWorldPosition(origin); rc.getWorldDirection(dirA); dirA.normalize(); dirB.copy(dirA).multiplyScalar(-1); const okA=floorHit(origin,dirA,rawP), okB=floorHit(origin,dirB,invP), scA=okA?score(rawP):-9999, scB=okB?score(invP):-9999; if(scA>=scB&&okA){finalP.copy(rawP); aimMode="raw";} else if(okB){finalP.copy(invP); aimMode="inverted";} else {finalP.copy(fallback); aimMode="fallback";} }
  const vx=finalP.x-camPos.x,vz=finalP.z-camPos.z; if(vx*camFwd.x+vz*camFwd.z<.45){ finalP.copy(fallback); aimMode="front-clamp"; }
  finalP.x=THREE.MathUtils.clamp(finalP.x,-15,15); finalP.z=THREE.MathUtils.clamp(finalP.z,-15,15); finalP.y=0;
  if(isCenterBlocked()){
    if(useHandView) pushHandTargetOutsideCenter();
    else { valid=false; targetGroup.visible=false; line.visible=false; setStatus("Table center blocked: aim outside ring"); return false; }
  }
  valid=true; return true;
}
function showTarget(useHandView=false){ if(!computeTarget(useHandView))return; targetGroup.visible=true; line.visible=true; targetGroup.position.set(finalP.x,.074,finalP.z); const p=line.geometry.attributes.position; p.setXYZ(0,origin.x||camPos.x,origin.y||1.2,origin.z||camPos.z); p.setXYZ(1,finalP.x,.16,finalP.z); p.needsUpdate=true; }
function commit(reason){ if(performance.now()<cd||!valid)return; cd=performance.now()+850; const x=xrCam(); x.getWorldPosition(head); dolly.position.x+=finalP.x-head.x; dolly.position.z+=finalP.z-head.z; clamp(); window.SVR_PHASE153_LAST_TELEPORT={reason,aimMode,target:{x:finalP.x,z:finalP.z},dolly:{x:dolly.position.x,z:dolly.position.z},at:new Date().toISOString()}; setStatus("Teleported"); setMode("Dolly moved"); }
function controllerInput(){ const tr=button(0),gr=button(1); if(tr>.18&&!tw){t0=performance.now(); arm("trigger");} if(tw&&tr<=.10){ if(performance.now()-t0>90&&armed&&valid)commit("trigger-release"); if(armedBy!=="grip-preview"&&armedBy!=="hand-fist")disarm(); } if(gr>.25&&!gw)arm("grip-preview"); if(gw&&gr<=.12&&!selectHeld&&armedBy==="grip-preview")disarm(); tw=tr>.18; gw=gr>.25; }
function updateHands(){ handMode="none"; handState.forEach((s,i)=>{ const wrist=s.hand.joints?.wrist; let shown=false; if(wrist){ wrist.getWorldPosition(wristP); s.meshes.wrist.position.copy(wristP); s.meshes.wrist.visible=true; s.palm.position.copy(wristP); s.palm.visible=true; shown=true; let curled=0,total=0; ["index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"].forEach(k=>{ const j=s.hand.joints?.[k]; if(j){ j.getWorldPosition(tipP); s.meshes[k].position.copy(tipP); s.meshes[k].visible=true; total++; if(tipP.distanceTo(wristP)<.145) curled++; }}); const th=s.hand.joints?.["thumb-tip"]; if(th){ th.getWorldPosition(tipP); s.meshes["thumb-tip"].position.copy(tipP); s.meshes["thumb-tip"].visible=true; } s.fist=total>=3 && curled>=3; s.fire.visible=s.fist; if(s.fist){ s.fire.position.copy(wristP); s.fire.position.y += .035; s.fire.scale.setScalar(.88+Math.sin(performance.now()*.014)*.08); handMode=i===0?"left-fist":"right-fist"; if(!s.wasFist){ s.started=performance.now(); arm("hand-fist"); } } if(s.wasFist && !s.fist && armedBy==="hand-fist"){ if(performance.now()-s.started>180 && valid) commit("hand-fist-release"); disarm(); } s.wasFist=s.fist; } Object.values(s.meshes).forEach(m=>{ if(!shown)m.visible=false; }); if(!shown)s.palm.visible=false; if(!s.fist)s.fire.visible=false; }); }

addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
renderer.xr.addEventListener("sessionstart",()=>{ setStatus("Phase 153 WebXR ready"); setMode("Official logo + hands"); });
renderer.setAnimationLoop(()=>{ const now=performance.now(),dt=Math.min((now-last)/1000,.05); last=now; move(dt); controllerInput(); updateHands(); if(armed) showTarget(armedBy==="hand-fist"); moon.rotation.y+=dt*.05; mars.rotation.y+=dt*.06; acc+=dt; samples++; worst=Math.max(worst,dt*1000); if(now-report>1000){ const fps=(1/Math.max(acc/samples,.001)).toFixed(1); debug.textContent=`PHASE 153 OFFICIAL LOGO/HANDS/SKY\nFPS ${fps} • worst ${worst.toFixed(0)}ms\nDolly ${dolly.position.x.toFixed(2)}, ${dolly.position.z.toFixed(2)} • Yaw ${(THREE.MathUtils.radToDeg(dolly.rotation.y)%360).toFixed(0)}\nStick axes${stickPair} • Hand ${handMode}\nAim ${aimMode}\nTarget ${valid?finalP.x.toFixed(2)+", "+finalP.z.toFixed(2):"none"}`; acc=0; samples=0; worst=0; report=now; } renderer.render(scene,camera); });
window.SVR_PHASE153_WEBXR_OFFICIAL_LOGO_HANDS_SKY={phase:PHASE,brandRule:"Always use official root logo.png unless area is a marketing sponsor/partner module",officialLogo:BRAND_LOGO_URL,hands:"textured glove proxy, fist purple fire, fist halo visible",sky:"textured Moon and Mars enlarged/high with purple star sky",base:"Phase 151 heading/no-center-lock preserved",noMusic:true,noWatch:true,worldMoved:false,referenceSpaceMutated:false,nextBuild:"PHASE-154-PORTALS-ON-OFFICIAL-LOGO-HANDS-BASE"};
setStatus("Phase 153 ready"); setMode("Official logo + hands + sky");
