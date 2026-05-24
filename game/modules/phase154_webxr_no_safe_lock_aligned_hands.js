import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE = "PHASE-154-WEBXR-NO-SAFE-LOCK-ALIGNED-HANDS-LOCK";
const BRAND_LOGO_URL = "../logo.png";
const SNAP = Math.PI / 4;

const app = document.getElementById("app") || document.body;
const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
function setStatus(t){ if(statusEl) statusEl.textContent = t; }
function setMode(t){ if(modeEl) modeEl.textContent = t; }

const debug = document.createElement("div");
debug.style.cssText = "position:fixed;left:12px;top:54px;z-index:90;padding:7px 10px;border:1px solid #b48cff;border-radius:12px;background:rgba(0,0,0,.82);color:#e6d7ff;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none";
debug.textContent = "Phase 154 booting";
document.body.appendChild(debug);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03030a);

const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.06, 260);
camera.position.set(0, 1.62, 0);
const dolly = new THREE.Group();
dolly.name = "SVR_PHASE154_WEBXR_DOLLY_LOCKED_BASE";
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
function tex(url, rx=1, ry=1){
  const t = loader.load(url, undefined, undefined, ()=>{});
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}
function canvasTex(draw, w=512, h=512){
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); draw(x, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function starTex(){
  return canvasTex((x)=>{
    const bg=x.createLinearGradient(0,0,0,512);
    bg.addColorStop(0,"#020014"); bg.addColorStop(.45,"#07001d"); bg.addColorStop(1,"#000007");
    x.fillStyle=bg; x.fillRect(0,0,1024,512);
    let seed=99191; const rnd=()=>{seed=(seed*48271)%2147483647; return seed/2147483647;};
    for(let i=0;i<950;i++){ const y=rnd()*395; const a=.24+rnd()*.70; const s=rnd()<.05?2:1; x.fillStyle=`rgba(255,255,255,${a})`; x.fillRect(rnd()*1024,y,s,s); }
    x.fillStyle="rgba(124,44,255,.22)"; x.fillRect(0,350,1024,120);
  },1024,512);
}
function glowTex(color="rgba(180,140,255,.9)"){
  return canvasTex((x)=>{ const g=x.createRadialGradient(256,256,8,256,256,250); g.addColorStop(0,color); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,512,512); });
}
function gloveTex(){
  return canvasTex((x)=>{
    const g=x.createLinearGradient(0,0,512,512);
    g.addColorStop(0,"#160626"); g.addColorStop(.35,"#6425a8"); g.addColorStop(.70,"#0b1735"); g.addColorStop(1,"#06020b");
    x.fillStyle=g; x.fillRect(0,0,512,512);
    x.strokeStyle="rgba(255,255,255,.18)"; x.lineWidth=10;
    for(let i=0;i<10;i++){ x.beginPath(); x.moveTo(-40,i*55); x.bezierCurveTo(140,i*44,340,i*74,560,i*34); x.stroke(); }
    x.strokeStyle="rgba(0,230,255,.35)"; x.lineWidth=9; x.strokeRect(38,38,436,436);
    x.strokeStyle="rgba(246,226,127,.30)"; x.lineWidth=5; x.beginPath(); x.arc(256,256,155,0,Math.PI*2); x.stroke();
  });
}

const officialLogo = tex(BRAND_LOGO_URL,1,1);
officialLogo.wrapS = THREE.ClampToEdgeWrapping;
officialLogo.wrapT = THREE.ClampToEdgeWrapping;
const logoMat = new THREE.MeshBasicMaterial({ map:officialLogo, transparent:true, depthWrite:false, side:THREE.DoubleSide, toneMapped:false });

const sky = new THREE.Mesh(new THREE.SphereGeometry(700,36,18), new THREE.MeshBasicMaterial({ map:starTex(), side:THREE.BackSide, depthWrite:false, fog:false }));
sky.frustumCulled = false; sky.name = "SVR_PHASE154_PURPLE_STAR_SKY"; scene.add(sky);
const moon = new THREE.Mesh(new THREE.SphereGeometry(10.5,40,24), new THREE.MeshBasicMaterial({ map:tex("./assets/texture/moon_diffuse.png"), color:0xffffff, fog:false, toneMapped:false }));
moon.name="SVR_PHASE154_TEXTURED_MOON_HIGH_NORTH"; moon.position.set(-42,66,-112); scene.add(moon);
const mars = new THREE.Mesh(new THREE.SphereGeometry(6.5,32,20), new THREE.MeshBasicMaterial({ map:tex("./assets/texture/mars/diffuse_1k.jpg"), color:0xffaa72, fog:false, toneMapped:false }));
mars.name="SVR_PHASE154_TEXTURED_MARS_HIGH_EAST"; mars.position.set(100,54,-48); scene.add(mars);
const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex("rgba(255,255,255,.7)"), color:0xdfe8ff, transparent:true, opacity:.45, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
moonHalo.scale.set(46,46,1); moon.add(moonHalo);
const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex("rgba(255,120,80,.7)"), color:0xff9b6b, transparent:true, opacity:.32, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
marsHalo.scale.set(32,32,1); mars.add(marsHalo);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(36,36), new THREE.MeshBasicMaterial({ map:tex("./assets/texture/slate_basecolor.jpg",6,6), side:THREE.FrontSide }));
floor.rotation.x = -Math.PI/2; scene.add(floor);
const wallMat = new THREE.MeshBasicMaterial({ map:tex("./assets/texture/stonebrick_wall_basecolor.png",2,1), side:THREE.DoubleSide });
[[0,-17,0],[-17,0,Math.PI/2],[17,0,-Math.PI/2]].forEach(([x,z,r])=>{ const w=new THREE.Mesh(new THREE.PlaneGeometry(10,4.2), wallMat); w.position.set(x,2.2,z); w.rotation.y=r; scene.add(w); });
const brandWall = new THREE.Mesh(new THREE.PlaneGeometry(5.8,5.8), logoMat.clone());
brandWall.name = "SVR_PHASE154_OFFICIAL_LOGO_WALL"; brandWall.position.set(0,2.65,-16.9); brandWall.renderOrder=30; scene.add(brandWall);
const table = new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,.22,64), new THREE.MeshBasicMaterial({ map:tex("./assets/texture/tablefelt.png") }));
table.position.set(0,.55,0); scene.add(table);
scene.add(new THREE.HemisphereLight(0xffffff,0x111122,.92));

const targetGroup = new THREE.Group(); targetGroup.visible=false; scene.add(targetGroup);
const targetLogo = new THREE.Mesh(new THREE.CircleGeometry(.95,72), logoMat.clone());
targetLogo.rotation.x=-Math.PI/2; targetLogo.renderOrder=1200; targetGroup.add(targetLogo);
const targetRing = new THREE.Mesh(new THREE.RingGeometry(1.08,1.52,80), new THREE.MeshBasicMaterial({ color:0xb48cff, transparent:true, opacity:1, depthTest:false, depthWrite:false, side:THREE.DoubleSide, toneMapped:false }));
targetRing.rotation.x=-Math.PI/2; targetRing.position.y=.018; targetRing.renderOrder=1201; targetGroup.add(targetRing);
const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]), new THREE.LineBasicMaterial({ color:0xe6d7ff, transparent:true, opacity:1, depthTest:false, depthWrite:false }));
line.visible=false; line.renderOrder=1202; scene.add(line);

let rc=null,gp=null,armed=false,armedBy="none",valid=false,cd=0,selectHeld=false,snapCd=0,aimMode="none",stickPair="none",handMode="none";
for(let i=0;i<2;i++){
  const c=renderer.xr.getController(i); c.visible=false; dolly.add(c);
  c.addEventListener("connected",e=>{ c.inputSource=e.data; if(e.data?.handedness==="right"){ rc=c; gp=e.data.gamepad||null; setStatus("Right controller connected"); }});
  c.addEventListener("disconnected",()=>{ if(rc===c){ rc=null; gp=null; }});
  c.addEventListener("selectstart",()=>{ if(c!==rc)return; selectHeld=true; arm("trigger"); });
  c.addEventListener("selectend",()=>{ if(c!==rc)return; selectHeld=false; if(armed&&valid) commit("selectend"); disarm(); });
  c.addEventListener("squeezestart",()=>{ if(c!==rc)return; arm("grip-preview"); });
  c.addEventListener("squeezeend",()=>{ if(c!==rc)return; if(armedBy==="grip-preview"&&!selectHeld) disarm(); });
}

const gloveMap = gloveTex();
function handMat(kind){ return new THREE.MeshBasicMaterial({ map:gloveMap, color:kind==="wrist"?0x7b35ff:0xb48cff, transparent:true, opacity:.96, depthTest:true, depthWrite:false, toneMapped:false }); }
const jointKeys=["wrist","thumb-tip","index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"];
const handState=[];
for(let i=0;i<2;i++){
  const hand=renderer.xr.getHand(i); hand.visible=false; dolly.add(hand);
  const vis=new THREE.Group(); vis.name="SVR_PHASE154_TEXTURED_HAND_VIS_"+i; scene.add(vis);
  const meshes={};
  jointKeys.forEach(k=>{ const radius=k==="wrist"?.055:.032; const m=new THREE.Mesh(new THREE.SphereGeometry(radius,14,10),handMat(k)); m.visible=false; m.renderOrder=850; vis.add(m); meshes[k]=m; });
  const palm=new THREE.Mesh(new THREE.SphereGeometry(.075,16,10),handMat("wrist")); palm.scale.set(1.2,.72,1); palm.visible=false; vis.add(palm);
  const fire=new THREE.Mesh(new THREE.SphereGeometry(.075,18,12), new THREE.MeshBasicMaterial({ color:0xb000ff, transparent:true, opacity:.62, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false }));
  fire.visible=false; fire.renderOrder=900; scene.add(fire);
  handState.push({hand,vis,meshes,palm,fire,fist:false,wasFist:false,started:0,aimOrigin:new THREE.Vector3(),aimDir:new THREE.Vector3(0,-.35,-1),hasAim:false});
}

const origin=new THREE.Vector3(),dirA=new THREE.Vector3(),dirB=new THREE.Vector3(),rawP=new THREE.Vector3(),invP=new THREE.Vector3(),fallback=new THREE.Vector3(),camPos=new THREE.Vector3(),camFwd=new THREE.Vector3(),finalP=new THREE.Vector3(),head=new THREE.Vector3(),head2=new THREE.Vector3(),mv=new THREE.Vector3(),wristP=new THREE.Vector3(),tipP=new THREE.Vector3(),midP=new THREE.Vector3(),q=new THREE.Quaternion();
let last=performance.now(),acc=0,samples=0,worst=0,report=performance.now(),tw=false,gw=false,t0=0;
function getGP(){ return gp||rc?.inputSource?.gamepad; }
function button(i){ return getGP()?.buttons?.[i]?.value||0; }
function axes(){ return getGP()?.axes||[]; }
function dz(v){ return Math.abs(v)<.14?0:v; }
function xrCam(){ return renderer.xr.isPresenting?renderer.xr.getCamera(camera):camera; }
function stick(){ const a=axes(); const p0={x:dz(a[0]||0),y:dz(a[1]||0),n:"01"},p1={x:dz(a[2]||0),y:dz(a[3]||0),n:"23"}; const s=Math.hypot(p1.x,p1.y)>Math.hypot(p0.x,p0.y)?p1:p0; stickPair=s.n; return s; }
function clamp(){ dolly.position.x=THREE.MathUtils.clamp(dolly.position.x,-15,15); dolly.position.z=THREE.MathUtils.clamp(dolly.position.z,-15,15); }
function headingForward(){ mv.set(-Math.sin(dolly.rotation.y),0,-Math.cos(dolly.rotation.y)).normalize(); return mv; }
function arm(k){ if(performance.now()<cd) return; armed=true; armedBy=k; setStatus(k==="hand-fist"?"Fist aim active: logo halo visible":k==="grip-preview"?"Grip preview only":"Trigger aiming"); }
function disarm(){ armed=false; armedBy="none"; valid=false; targetGroup.visible=false; line.visible=false; }
function snap(a){ const x=xrCam(); x.getWorldPosition(head); dolly.rotation.y+=a; dolly.updateMatrixWorld(true); x.getWorldPosition(head2); dolly.position.x+=head.x-head2.x; dolly.position.z+=head.z-head2.z; clamp(); setStatus(a>0?"Snap right 45":"Snap left 45"); }
function move(dt){ if(!renderer.xr.isPresenting||armed)return; const s=stick(),ax=Math.abs(s.x),ay=Math.abs(s.y),now=performance.now(); if(ax>.72&&ax>ay*1.35&&now>snapCd){ snap(Math.sign(s.x)*-SNAP); snapCd=now+420; return; } if(ay>.14){ dolly.position.addScaledVector(headingForward(),-s.y*dt*1.55); clamp(); } }
function floorHit(o,d,out){ if(Math.abs(d.y)<.035)return false; const t=-o.y/d.y; if(!isFinite(t)||t<.08||t>13)return false; out.copy(o).addScaledVector(d,t); out.y=0; return true; }
function score(p){ const vx=p.x-camPos.x,vz=p.z-camPos.z,front=vx*camFwd.x+vz*camFwd.z,dist=Math.hypot(vx,vz); return front<-.25?-9999:front*2-Math.abs(dist-4.2)*.25; }
function computeTarget(useHand=false){ const x=xrCam(); x.getWorldPosition(camPos); x.getWorldDirection(camFwd); camFwd.y=0; if(camFwd.lengthSq()<.001)camFwd.copy(headingForward()); camFwd.normalize(); fallback.copy(camPos).addScaledVector(camFwd,4.2).setY(0);
  if(useHand){
    const active=handState.find(h=>h.fist&&h.hasAim);
    if(active){
      origin.copy(active.aimOrigin);
      dirA.copy(active.aimDir);
      if(!floorHit(origin,dirA,finalP)) finalP.copy(origin).addScaledVector(dirA,4.2).setY(0);
      aimMode="hand-wrist-ray";
    } else { finalP.copy(fallback); aimMode="hand-fallback"; }
  } else if(!rc){ finalP.copy(fallback); aimMode="fallback"; }
  else {
    rc.updateWorldMatrix(true,false); rc.getWorldPosition(origin); rc.getWorldDirection(dirA); dirA.normalize(); dirB.copy(dirA).multiplyScalar(-1);
    const okA=floorHit(origin,dirA,rawP), okB=floorHit(origin,dirB,invP), scA=okA?score(rawP):-9999, scB=okB?score(invP):-9999;
    if(scA>=scB&&okA){ finalP.copy(rawP); aimMode="raw"; }
    else if(okB){ finalP.copy(invP); aimMode="inverted"; }
    else { finalP.copy(fallback); aimMode="fallback"; }
  }
  const vx=finalP.x-camPos.x,vz=finalP.z-camPos.z;
  if(vx*camFwd.x+vz*camFwd.z<.35){ finalP.copy(fallback); aimMode+="+front-correct"; }
  finalP.x=THREE.MathUtils.clamp(finalP.x,-15,15); finalP.z=THREE.MathUtils.clamp(finalP.z,-15,15); finalP.y=0; valid=true; return true;
}
function showTarget(useHand=false){ if(!computeTarget(useHand))return; targetGroup.visible=true; line.visible=true; targetGroup.position.set(finalP.x,.074,finalP.z); const p=line.geometry.attributes.position; p.setXYZ(0,origin.x||camPos.x,origin.y||1.2,origin.z||camPos.z); p.setXYZ(1,finalP.x,.16,finalP.z); p.needsUpdate=true; }
function commit(reason){ if(performance.now()<cd||!valid)return; cd=performance.now()+850; const x=xrCam(); x.getWorldPosition(head); dolly.position.x+=finalP.x-head.x; dolly.position.z+=finalP.z-head.z; clamp(); window.SVR_PHASE154_LAST_TELEPORT={reason,aimMode,target:{x:finalP.x,z:finalP.z},dolly:{x:dolly.position.x,z:dolly.position.z},at:new Date().toISOString()}; setStatus("Teleported"); setMode("Dolly moved"); }
function controllerInput(){ const tr=button(0),gr=button(1); if(tr>.18&&!tw){t0=performance.now(); arm("trigger");} if(tw&&tr<=.10){ if(performance.now()-t0>90&&armed&&valid)commit("trigger-release"); if(armedBy!=="grip-preview"&&armedBy!=="hand-fist")disarm(); } if(gr>.25&&!gw)arm("grip-preview"); if(gw&&gr<=.12&&!selectHeld&&armedBy==="grip-preview")disarm(); tw=tr>.18; gw=gr>.25; }
function updateHands(){ handMode="none"; handState.forEach((s,i)=>{ const wrist=s.hand.joints?.wrist; let shown=false; s.hasAim=false; if(wrist){ wrist.getWorldPosition(wristP); wrist.getWorldQuaternion(q); s.aimOrigin.copy(wristP); s.aimDir.set(0,-0.22,-1).applyQuaternion(q).normalize(); if(s.aimDir.y>-0.08) s.aimDir.y=-0.28; s.aimDir.normalize(); s.hasAim=true; s.meshes.wrist.position.copy(wristP); s.meshes.wrist.visible=true; s.palm.position.copy(wristP); s.palm.visible=true; shown=true; let curled=0,total=0; ["index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"].forEach(k=>{ const j=s.hand.joints?.[k]; if(j){ j.getWorldPosition(tipP); s.meshes[k].position.copy(tipP); s.meshes[k].visible=true; total++; if(tipP.distanceTo(wristP)<.145) curled++; }}); const th=s.hand.joints?.["thumb-tip"]; if(th){ th.getWorldPosition(tipP); s.meshes["thumb-tip"].position.copy(tipP); s.meshes["thumb-tip"].visible=true; } s.fist=total>=3 && curled>=3; s.fire.visible=s.fist; if(s.fist){ s.fire.position.copy(wristP); s.fire.position.y += .035; s.fire.scale.setScalar(.78+Math.sin(performance.now()*.014)*.07); handMode=i===0?"left-fist":"right-fist"; if(!s.wasFist){ s.started=performance.now(); arm("hand-fist"); } } if(s.wasFist && !s.fist && armedBy==="hand-fist"){ if(performance.now()-s.started>180 && valid) commit("hand-fist-release"); disarm(); } s.wasFist=s.fist; } Object.values(s.meshes).forEach(m=>{ if(!shown)m.visible=false; }); if(!shown)s.palm.visible=false; if(!s.fist)s.fire.visible=false; }); }

addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
renderer.xr.addEventListener("sessionstart",()=>{ setStatus("Phase 154 WebXR ready"); setMode("No safe lock + aligned hands"); });
renderer.setAnimationLoop(()=>{ const now=performance.now(),dt=Math.min((now-last)/1000,.05); last=now; move(dt); controllerInput(); updateHands(); if(armed) showTarget(armedBy==="hand-fist"); moon.rotation.y+=dt*.05; mars.rotation.y+=dt*.06; acc+=dt; samples++; worst=Math.max(worst,dt*1000); if(now-report>1000){ const fps=(1/Math.max(acc/samples,.001)).toFixed(1); debug.textContent=`PHASE 154 NO SAFE LOCK / ALIGNED HANDS\nFPS ${fps} • worst ${worst.toFixed(0)}ms\nDolly ${dolly.position.x.toFixed(2)}, ${dolly.position.z.toFixed(2)} • Yaw ${(THREE.MathUtils.radToDeg(dolly.rotation.y)%360).toFixed(0)}\nStick axes${stickPair} • Hand ${handMode}\nAim ${aimMode}\nTarget ${valid?finalP.x.toFixed(2)+", "+finalP.z.toFixed(2):"none"}`; acc=0; samples=0; worst=0; report=now; } renderer.render(scene,camera); });

window.SVR_PHASE154_WEBXR_NO_SAFE_LOCK_ALIGNED_HANDS={phase:PHASE,brandRule:"Official root logo.png always, except modular sponsor/partner/marketing zones",safeLockRemoved:true,centerBlockRemoved:true,handAim:"wrist-oriented floor ray instead of center/camera-only aim",controllerAim:"raw/inverted floor ray without table magnet",base:"Phase 151 heading/no-center-lock movement preserved",noMusic:true,noWatch:true,worldMoved:false,referenceSpaceMutated:false,nextBuild:"PHASE-155-PORTALS-ON-NO-SAFE-LOCK-HANDS-BASE"};
setStatus("Phase 154 ready"); setMode("No safe lock + aligned hands");
