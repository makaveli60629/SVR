import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE = "PHASE-174-RECOVERY-BOOT-PRIVATE-SCENE-HOTFIX-LOCK";
const ROOM = 22;
const ROUTES = {
  REIKI: "./private-scene.html?scene=reiki&v=phase174",
  PGA: "./private-scene.html?scene=pga&v=phase174",
  SCORPION: "./private-scene.html?scene=scorpion&v=phase174",
  STORE: "../site/store.html",
  LOUNGE: "./private-scene.html?scene=lounge&v=phase174"
};
const PORTALS = [
  ["REIKI", -10, -17, 0xb48cff],
  ["PGA", 0, -18, 0x7ff5c7],
  ["SCORPION", 10, -17, 0xff5572],
  ["STORE", -18, 0, 0x00ddff],
  ["LOUNGE", 18, 0, 0xf6e27f]
];
window.SVR_BUILD_PHASE = PHASE;
window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
window.SVR_PHASE174_RECOVERY_LOBBY = { phase: PHASE, siteTouched: false, gameTouched: true, privateSceneRestored: true, noMusic: true };

const app = document.getElementById("app") || document.body;
const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
const status = t => { if (statusEl) statusEl.textContent = t; };
const mode = t => { if (modeEl) modeEl.textContent = t; };
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020108);
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.06, 300);
camera.position.set(0, 1.62, 0);
const dolly = new THREE.Group();
dolly.position.set(0, 0, 8.5);
dolly.add(camera);
scene.add(dolly);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 0.7));
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
try { renderer.xr.setFramebufferScaleFactor(0.7); renderer.xr.setFoveation(0.55); } catch {}
app.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer, { requiredFeatures: ["local-floor"], optionalFeatures: ["hand-tracking", "bounded-floor"] }));

function ctex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function floorTex(){ return ctex(512,512,(x,w,h)=>{ x.fillStyle="#10081b"; x.fillRect(0,0,w,h); for(let i=0;i<10;i++){ x.strokeStyle=i%2?"rgba(180,140,255,.35)":"rgba(246,226,127,.20)"; x.lineWidth=3; x.strokeRect(i*28,i*28,w-i*56,h-i*56); } }); }
function wallTex(){ return ctex(512,512,(x,w,h)=>{ const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,"#1b0632"); g.addColorStop(1,"#020106"); x.fillStyle=g; x.fillRect(0,0,w,h); x.strokeStyle="rgba(180,140,255,.42)"; x.lineWidth=3; for(let y=20;y<h;y+=52){ x.beginPath(); x.moveTo(0,y); x.lineTo(w,y+18); x.stroke(); } }); }
function labelTex(t){ return ctex(512,160,(x,w,h)=>{ x.fillStyle="rgba(0,0,0,.88)"; x.fillRect(12,18,w-24,h-36); x.strokeStyle="#b48cff"; x.lineWidth=5; x.strokeRect(24,30,w-48,h-60); x.fillStyle="#fff"; x.textAlign="center"; x.textBaseline="middle"; x.font="900 42px system-ui"; x.fillText(t,w/2,h/2); }); }
const logoTex = new THREE.TextureLoader().load("../logo.png");
logoTex.colorSpace = THREE.SRGBColorSpace;
const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM*2, ROOM*2), new THREE.MeshBasicMaterial({ map: floorTex(), toneMapped: false }));
floor.rotation.x = -Math.PI/2;
scene.add(floor);
const wallMat = new THREE.MeshBasicMaterial({ map: wallTex(), side: THREE.DoubleSide, toneMapped: false });
function wall(x,z,r){ const m=new THREE.Mesh(new THREE.PlaneGeometry(ROOM*2,6.5), wallMat); m.position.set(x,3.25,z); m.rotation.y=r; scene.add(m); }
wall(0,-ROOM,0); wall(0,ROOM,Math.PI); wall(ROOM,0,-Math.PI/2); wall(-ROOM,0,Math.PI/2);
function box(x,y,z,sx,sy,sz,col){ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .82 })); m.position.set(x,y,z); scene.add(m); return m; }
[[-ROOM,-ROOM],[ROOM,-ROOM],[-ROOM,ROOM],[ROOM,ROOM]].forEach(p=>box(p[0],3.25,p[1],.55,6.5,.55,0xb48cff));
box(0,6.55,-ROOM,ROOM*2,.12,.18,0xf6e27f); box(0,6.55,ROOM,ROOM*2,.12,.18,0xf6e27f); box(ROOM,6.55,0,.18,.12,ROOM*2,0xf6e27f); box(-ROOM,6.55,0,.18,.12,ROOM*2,0xf6e27f);
const brand = new THREE.Mesh(new THREE.PlaneGeometry(7,7), logoMat.clone()); brand.position.set(0,3.4,-ROOM+.05); scene.add(brand);
const table = new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,.24,64), new THREE.MeshBasicMaterial({ color: 0x0f4737 })); table.position.set(0,.55,0); scene.add(table);
const tableLogo = new THREE.Mesh(new THREE.CircleGeometry(.72,48), logoMat.clone()); tableLogo.rotation.x=-Math.PI/2; tableLogo.position.set(0,.69,0); scene.add(tableLogo);
const moon = new THREE.Mesh(new THREE.SphereGeometry(11,32,16), new THREE.MeshBasicMaterial({ color: 0xdfe3ee })); moon.position.set(-74,84,-145); scene.add(moon);
const mars = new THREE.Mesh(new THREE.SphereGeometry(7,28,14), new THREE.MeshBasicMaterial({ color: 0xc86d42 })); mars.position.set(116,74,-96); scene.add(mars);
scene.add(new THREE.HemisphereLight(0xffffff,0x151020,.95));
const portals=[];
for (const p of PORTALS) { const g=new THREE.Group(); g.position.set(p[1],.08,p[2]); scene.add(g); const ring=new THREE.Mesh(new THREE.RingGeometry(.85,1.18,64),new THREE.MeshBasicMaterial({ color:p[3], transparent:true, opacity:.82, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x=-Math.PI/2; g.add(ring); const disk=new THREE.Mesh(new THREE.CircleGeometry(.65,44), logoMat.clone()); disk.rotation.x=-Math.PI/2; disk.position.y=.014; g.add(disk); const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.5,1.1),new THREE.MeshBasicMaterial({ map:labelTex(p[0]), transparent:true, side:THREE.DoubleSide })); sign.position.set(0,1.55,0); sign.lookAt(0,1.55,8.5); g.add(sign); portals.push({ name:p[0], x:p[1], z:p[2], route:ROUTES[p[0]], ring }); }
const target = new THREE.Mesh(new THREE.RingGeometry(.9,1.22,64), new THREE.MeshBasicMaterial({ color:0xb48cff, transparent:true, opacity:.95, side:THREE.DoubleSide, depthTest:false, depthWrite:false })); target.rotation.x=-Math.PI/2; target.visible=false; scene.add(target);
let rc=null,gp=null,armed=false,valid=false,hover=null,tr=false,gr=false,snapCd=0,cd=0;
const o=new THREE.Vector3(),d=new THREE.Vector3(),a=new THREE.Vector3(),fin=new THREE.Vector3(),cp=new THREE.Vector3(),cf=new THREE.Vector3(),mv=new THREE.Vector3(),hb=new THREE.Vector3(),ha=new THREE.Vector3();
for(let i=0;i<2;i++){ const c=renderer.xr.getController(i); c.visible=false; dolly.add(c); c.addEventListener("connected",e=>{ c.inputSource=e.data; if(e.data?.handedness==="right"){ rc=c; gp=e.data.gamepad||null; status("Right controller connected"); }}); c.addEventListener("selectstart",()=>{ if(c===rc) armed=true; }); c.addEventListener("selectend",()=>{ if(c===rc){ if(valid) commit("select"); armed=false; target.visible=false; }}); }
function xrc(){ return renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera; }
function pad(){ return gp || rc?.inputSource?.gamepad; }
function btn(i){ return pad()?.buttons?.[i]?.value || 0; }
function dz(v){ return Math.abs(v)<.14?0:v; }
function stick(){ const ax=pad()?.axes||[]; const p0={x:dz(ax[0]||0),y:dz(ax[1]||0)}, p1={x:dz(ax[2]||0),y:dz(ax[3]||0)}; return Math.hypot(p1.x,p1.y)>=Math.hypot(p0.x,p0.y)?p1:p0; }
function clamp(){ dolly.position.x=THREE.MathUtils.clamp(dolly.position.x,-ROOM+2,ROOM-2); dolly.position.z=THREE.MathUtils.clamp(dolly.position.z,-ROOM+2,ROOM-2); }
function forward(){ return mv.set(-Math.sin(dolly.rotation.y),0,-Math.cos(dolly.rotation.y)).normalize(); }
function snap(v){ const cam=xrc(); cam.getWorldPosition(hb); dolly.rotation.y+=v; dolly.updateMatrixWorld(true); cam.getWorldPosition(ha); dolly.position.x+=hb.x-ha.x; dolly.position.z+=hb.z-ha.z; clamp(); }
function move(dt){ if(!renderer.xr.isPresenting||armed) return; const s=stick(), ax=Math.abs(s.x), ay=Math.abs(s.y), now=performance.now(); if(ax>.72&&ax>ay*1.35&&now>snapCd){ snap(Math.sign(s.x)*-SNAP); snapCd=now+420; return; } if(ay>.14){ dolly.position.addScaledVector(forward(),-s.y*dt*1.65); clamp(); } }
function aim(){ const cam=xrc(); cam.getWorldPosition(cp); cam.getWorldDirection(cf); cf.y=0; if(cf.lengthSq()<.001) cf.copy(forward()); cf.normalize(); if(rc){ rc.updateWorldMatrix(true,false); rc.getWorldPosition(o); rc.getWorldDirection(d); d.normalize(); const t=-o.y/d.y; if(isFinite(t)&&t>.08&&t<14) fin.copy(o).addScaledVector(d,t).setY(0); else fin.copy(cp).addScaledVector(cf,4.2).setY(0); } else fin.copy(cp).addScaledVector(cf,4.2).setY(0); fin.x=THREE.MathUtils.clamp(fin.x,-ROOM+2,ROOM-2); fin.z=THREE.MathUtils.clamp(fin.z,-ROOM+2,ROOM-2); valid=true; hover=null; for(const p of portals){ if(Math.hypot(fin.x-p.x,fin.z-p.z)<1.45){ hover=p; break; } } target.position.set(fin.x,.08,fin.z); target.visible=true; }
function commit(reason){ if(performance.now()<cd) return; cd=performance.now()+700; const cam=xrc(); cam.getWorldPosition(hb); dolly.position.x+=fin.x-hb.x; dolly.position.z+=fin.z-hb.z; clamp(); if(hover){ window.SVR_PHASE174_LAST_PORTAL={name:hover.name,route:hover.route,reason,at:new Date().toISOString()}; location.href=hover.route; } }
function controller(){ const b0=btn(0), b1=btn(1); if(b0>.18&&!tr) armed=true; if(tr&&b0<=.1){ if(valid) commit("trigger-release"); armed=false; target.visible=false; } if(b1>.25&&!gr) armed=true; if(gr&&b1<=.12){ armed=false; target.visible=false; } tr=b0>.18; gr=b1>.25; }
const nav=document.createElement("div"); nav.style.cssText="position:fixed;left:12px;right:12px;bottom:12px;z-index:50;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"; nav.innerHTML=PORTALS.map(p=>'<button data-p="'+p[0]+'" style="border:1px solid #b48cff;border-radius:999px;background:rgba(0,0,0,.75);color:#fff;padding:8px 12px;font-weight:900">'+p[0]+'</button>').join(""); document.body.appendChild(nav); nav.onclick=e=>{ const b=e.target.closest("button"); if(!b)return; location.href=ROUTES[b.dataset.p]; };
const dbg=document.createElement("div"); dbg.style.cssText="position:fixed;left:12px;top:54px;z-index:45;padding:8px 10px;border:1px solid #7ff5c7;border-radius:12px;background:rgba(0,0,0,.72);color:#eafff7;font:900 12px system-ui;white-space:pre-wrap"; document.body.appendChild(dbg);
addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
let last=performance.now(),acc=0,samp=0,worst=0,rep=performance.now();
renderer.setAnimationLoop(()=>{ const now=performance.now(), dt=Math.min((now-last)/1000,.05); last=now; move(dt); controller(); if(armed) aim(); moon.rotation.y+=dt*.05; mars.rotation.y+=dt*.06; const t=now*.00006; moon.position.x=-74*Math.cos(t); moon.position.z=-135+22*Math.sin(t); mars.position.x=116*Math.cos(t*.82); mars.position.z=-96+28*Math.sin(t*.82); acc+=dt; samp++; worst=Math.max(worst,dt*1000); if(now-rep>1000){ dbg.textContent=PHASE+"\nFPS "+(1/Math.max(acc/samp,.001)).toFixed(1)+" worst "+worst.toFixed(0)+"ms\nPortal "+(hover?.name||"none"); acc=0;samp=0;worst=0;rep=now; } renderer.render(scene,camera); });
status("Phase 174 recovery lobby loaded"); mode("Boot fixed"); const bp=[...document.querySelectorAll(".pill")].find(x=>/BUILD:/.test(x.textContent||"")); if(bp) bp.textContent="BUILD: PHASE-174";
