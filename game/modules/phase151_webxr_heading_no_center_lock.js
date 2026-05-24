import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE = "PHASE-151-WEBXR-HEADING-FIX-NO-CENTER-LOCK";
const TABLE_BLOCK = 2.85;
const SNAP = Math.PI / 4;
const app = document.getElementById("app") || document.body;
const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
const setStatus = (t)=>{ if(statusEl) statusEl.textContent = t; };
const setMode = (t)=>{ if(modeEl) modeEl.textContent = t; };

const debug = document.createElement("div");
debug.style.cssText = "position:fixed;left:12px;top:54px;z-index:90;padding:7px 10px;border:1px solid #7ff5c7;border-radius:12px;background:rgba(0,0,0,.82);color:#7ff5c7;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none";
debug.textContent = "Phase 151 booting";
document.body.appendChild(debug);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);
const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.06, 160);
camera.position.set(0, 1.62, 0);
const dolly = new THREE.Group();
dolly.name = "SVR_PHASE151_WEBXR_DOLLY_HEADING_LOCK";
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
document.body.appendChild(VRButton.createButton(renderer, { requiredFeatures:["local-floor"], optionalFeatures:["bounded-floor","hand-tracking"] }));

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
const floor = new THREE.Mesh(new THREE.PlaneGeometry(36,36), new THREE.MeshBasicMaterial({ map:tex("./assets/texture/slate_basecolor.jpg",6,6), side:THREE.FrontSide }));
floor.rotation.x = -Math.PI/2;
scene.add(floor);
const wallMat = new THREE.MeshBasicMaterial({ map:tex("./assets/texture/stonebrick_wall_basecolor.png",2,1), side:THREE.DoubleSide });
[[0,-17,0],[-17,0,Math.PI/2],[17,0,-Math.PI/2]].forEach(([x,z,r],i)=>{
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10,4.2), wallMat);
  wall.position.set(x,2.2,z);
  wall.rotation.y = r;
  wall.name = "SVR_PHASE151_WALL_" + i;
  scene.add(wall);
});
const table = new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,.22,64), new THREE.MeshBasicMaterial({ map:tex("./assets/texture/tablefelt.png") }));
table.position.set(0,.55,0);
scene.add(table);
const blockRing = new THREE.Mesh(new THREE.RingGeometry(TABLE_BLOCK, TABLE_BLOCK + .08, 96), new THREE.MeshBasicMaterial({ color:0xff5572, transparent:true, opacity:.32, side:THREE.DoubleSide, depthWrite:false }));
blockRing.rotation.x = -Math.PI/2;
blockRing.position.y = .055;
blockRing.name = "SVR_PHASE151_CENTER_BLOCK_RING_NO_LOCK";
scene.add(blockRing);
scene.add(new THREE.HemisphereLight(0xffffff,0x111122,.9));

function logoTexture(){
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  c.width = c.height = 512;
  const r = g.createRadialGradient(256,256,12,256,256,242);
  r.addColorStop(0,"#fff"); r.addColorStop(.18,"#00ff66"); r.addColorStop(.56,"#ffee00"); r.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle = r; g.fillRect(0,0,512,512);
  g.strokeStyle = "#000"; g.lineWidth = 18; g.beginPath(); g.arc(256,256,156,0,Math.PI*2); g.stroke();
  g.fillStyle = "#000"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 104px system-ui"; g.fillText("SVR",256,228);
  g.font = "900 43px system-ui"; g.fillText("FINAL",256,310); g.fillText("DEST",256,360);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const targetGroup = new THREE.Group();
targetGroup.visible = false;
scene.add(targetGroup);
const logo = new THREE.Mesh(new THREE.CircleGeometry(.88,72), new THREE.MeshBasicMaterial({ map:logoTexture(), transparent:true, depthTest:false, depthWrite:false, side:THREE.DoubleSide }));
logo.rotation.x = -Math.PI/2; logo.renderOrder = 1000; targetGroup.add(logo);
const halo = new THREE.Mesh(new THREE.RingGeometry(1.06,1.43,80), new THREE.MeshBasicMaterial({ color:0xffff00, transparent:true, opacity:1, depthTest:false, depthWrite:false, side:THREE.DoubleSide }));
halo.rotation.x = -Math.PI/2; halo.position.y = .012; halo.renderOrder = 1001; targetGroup.add(halo);
const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]), new THREE.LineBasicMaterial({ color:0x00ffff, transparent:true, opacity:1, depthTest:false, depthWrite:false }));
line.visible = false; line.renderOrder = 1002; scene.add(line);

let rc = null, gp = null, armed = false, armedBy = "none", valid = false, cooldownUntil = 0, selectHeld = false;
let snapCooldownUntil = 0, aimMode = "none", stickPair = "none", centerBlocked = false;
for(let i=0;i<2;i++){
  const c = renderer.xr.getController(i);
  c.visible = false;
  dolly.add(c);
  c.addEventListener("connected", e=>{ c.inputSource = e.data; if(e.data?.handedness === "right"){ rc = c; gp = e.data.gamepad || null; setStatus("Right controller connected"); }});
  c.addEventListener("disconnected", ()=>{ if(rc === c){ rc = null; gp = null; }});
  c.addEventListener("selectstart", ()=>{ if(c !== rc) return; selectHeld = true; arm("trigger"); });
  c.addEventListener("selectend", ()=>{ if(c !== rc) return; selectHeld = false; if(armed && valid) commit("selectend"); disarm(); });
  c.addEventListener("squeezestart", ()=>{ if(c !== rc) return; arm("grip-preview"); });
  c.addEventListener("squeezeend", ()=>{ if(c !== rc) return; if(armedBy === "grip-preview" && !selectHeld) disarm(); });
}

const origin = new THREE.Vector3(), dirA = new THREE.Vector3(), dirB = new THREE.Vector3();
const rawP = new THREE.Vector3(), invP = new THREE.Vector3(), fallback = new THREE.Vector3();
const camPos = new THREE.Vector3(), camFwd = new THREE.Vector3(), finalP = new THREE.Vector3();
const head = new THREE.Vector3(), head2 = new THREE.Vector3(), moveFwd = new THREE.Vector3();
let last = performance.now(), acc = 0, samples = 0, worst = 0, report = performance.now();
let triggerWas = false, gripWas = false, triggerStart = 0;

function getGP(){ return gp || rc?.inputSource?.gamepad; }
function button(i){ return getGP()?.buttons?.[i]?.value || 0; }
function axes(){ return getGP()?.axes || []; }
function dz(v){ return Math.abs(v) < .14 ? 0 : v; }
function stick(){
  const a = axes();
  const p0 = { x:dz(a[0]||0), y:dz(a[1]||0), n:"01" };
  const p1 = { x:dz(a[2]||0), y:dz(a[3]||0), n:"23" };
  const s = Math.hypot(p1.x,p1.y) > Math.hypot(p0.x,p0.y) ? p1 : p0;
  stickPair = s.n;
  return s;
}
function xrCam(){ return renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera; }
function clamp(){ dolly.position.x = THREE.MathUtils.clamp(dolly.position.x,-15,15); dolly.position.z = THREE.MathUtils.clamp(dolly.position.z,-15,15); }
function headingForward(){ moveFwd.set(-Math.sin(dolly.rotation.y), 0, -Math.cos(dolly.rotation.y)).normalize(); return moveFwd; }
function arm(k){ if(!rc || performance.now() < cooldownUntil) return; armed = true; armedBy = k; setStatus(k === "grip-preview" ? "Grip preview only" : "Trigger aiming"); }
function disarm(){ armed = false; armedBy = "none"; valid = false; centerBlocked = false; targetGroup.visible = false; line.visible = false; }
function snap(angle){
  const x = xrCam();
  x.getWorldPosition(head);
  dolly.rotation.y += angle;
  dolly.updateMatrixWorld(true);
  x.getWorldPosition(head2);
  dolly.position.x += head.x - head2.x;
  dolly.position.z += head.z - head2.z;
  clamp();
  setStatus(angle > 0 ? "Snap right 45" : "Snap left 45");
}
function move(dt){
  if(!renderer.xr.isPresenting || !rc || armed) return;
  const s = stick();
  const ax = Math.abs(s.x), ay = Math.abs(s.y), now = performance.now();
  if(ax > .72 && ax > ay * 1.35 && now > snapCooldownUntil){ snap(Math.sign(s.x) * -SNAP); snapCooldownUntil = now + 420; return; }
  if(ay > .14){ dolly.position.addScaledVector(headingForward(), -s.y * dt * 1.55); clamp(); }
}
function floorHit(o,d,out){ if(Math.abs(d.y) < .035) return false; const t = -o.y / d.y; if(!isFinite(t) || t < .08 || t > 13) return false; out.copy(o).addScaledVector(d,t); out.y = 0; return true; }
function score(p){ const vx = p.x - camPos.x, vz = p.z - camPos.z, front = vx*camFwd.x + vz*camFwd.z, dist = Math.hypot(vx,vz); return front < -.25 ? -9999 : front*2 - Math.abs(dist-4.2)*.25; }
function isCenterBlocked(){ return Math.hypot(finalP.x, finalP.z) < TABLE_BLOCK; }
function computeTarget(){
  centerBlocked = false;
  const x = xrCam();
  x.getWorldPosition(camPos);
  x.getWorldDirection(camFwd);
  camFwd.y = 0;
  if(camFwd.lengthSq() < .001) camFwd.copy(headingForward());
  camFwd.normalize();
  fallback.copy(camPos).addScaledVector(camFwd,4.2).setY(0);
  if(!rc){ finalP.copy(fallback); aimMode = "fallback"; }
  else {
    rc.updateWorldMatrix(true,false);
    rc.getWorldPosition(origin);
    rc.getWorldDirection(dirA);
    dirA.normalize();
    dirB.copy(dirA).multiplyScalar(-1);
    const okA = floorHit(origin,dirA,rawP), okB = floorHit(origin,dirB,invP);
    const scA = okA ? score(rawP) : -9999, scB = okB ? score(invP) : -9999;
    if(scA >= scB && okA){ finalP.copy(rawP); aimMode = "raw"; }
    else if(okB){ finalP.copy(invP); aimMode = "inverted"; }
    else { finalP.copy(fallback); aimMode = "fallback"; }
  }
  const vx = finalP.x - camPos.x, vz = finalP.z - camPos.z;
  if(vx*camFwd.x + vz*camFwd.z < .45){ finalP.copy(fallback); aimMode = "front-clamp"; }
  finalP.x = THREE.MathUtils.clamp(finalP.x,-15,15);
  finalP.z = THREE.MathUtils.clamp(finalP.z,-15,15);
  finalP.y = 0;
  if(isCenterBlocked()){
    centerBlocked = true;
    valid = false;
    aimMode += "+center-blocked-no-lock";
    return false;
  }
  valid = true;
  return true;
}
function showTarget(){
  if(!computeTarget()){
    targetGroup.visible = false;
    line.visible = false;
    if(centerBlocked) setStatus("Table center blocked: aim outside ring");
    return;
  }
  targetGroup.visible = true;
  line.visible = true;
  targetGroup.position.set(finalP.x,.066,finalP.z);
  const p = line.geometry.attributes.position;
  p.setXYZ(0, origin.x || camPos.x, origin.y || 1.2, origin.z || camPos.z);
  p.setXYZ(1, finalP.x, .12, finalP.z);
  p.needsUpdate = true;
}
function commit(reason){
  const now = performance.now();
  if(now < cooldownUntil || !valid || centerBlocked) return;
  cooldownUntil = now + 850;
  const x = xrCam();
  x.getWorldPosition(head);
  dolly.position.x += finalP.x - head.x;
  dolly.position.z += finalP.z - head.z;
  clamp();
  window.SVR_PHASE151_LAST_TELEPORT = { reason, aimMode, target:{x:finalP.x,z:finalP.z}, dolly:{x:dolly.position.x,z:dolly.position.z}, at:new Date().toISOString() };
  setStatus("Teleported");
  setMode("Dolly moved");
}
function input(){
  const tr = button(0), gr = button(1);
  if(!rc){ setStatus("Waiting for right WebXR controller"); return; }
  if(tr > .18 && !triggerWas){ triggerStart = performance.now(); arm("trigger"); }
  if(triggerWas && tr <= .10){ if(performance.now() - triggerStart > 90 && armed && valid) commit("trigger-release"); if(armedBy !== "grip-preview") disarm(); }
  if(gr > .25 && !gripWas) arm("grip-preview");
  if(gripWas && gr <= .12 && !selectHeld) disarm();
  triggerWas = tr > .18;
  gripWas = gr > .25;
}

addEventListener("resize", ()=>{ camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
renderer.xr.addEventListener("sessionstart", ()=>{ setStatus("Phase 151 WebXR ready"); setMode("Yaw heading forward fixed"); });
renderer.setAnimationLoop(()=>{
  const now = performance.now(), dt = Math.min((now-last)/1000,.05);
  last = now;
  move(dt);
  input();
  if(armed) showTarget();
  acc += dt; samples++; worst = Math.max(worst,dt*1000);
  if(now-report > 1000){
    const fps = (1/Math.max(acc/samples,.001)).toFixed(1);
    debug.textContent = `PHASE 151 HEADING / NO CENTER LOCK\nFPS ${fps} • worst ${worst.toFixed(0)}ms\nDolly ${dolly.position.x.toFixed(2)}, ${dolly.position.z.toFixed(2)} • Yaw ${(THREE.MathUtils.radToDeg(dolly.rotation.y)%360).toFixed(0)}\nStick axes${stickPair}\nAim ${aimMode}\nTarget ${valid?finalP.x.toFixed(2)+", "+finalP.z.toFixed(2):"none"}`;
    acc = 0; samples = 0; worst = 0; report = now;
  }
  renderer.render(scene,camera);
});
window.SVR_PHASE151_WEBXR_HEADING_NO_CENTER_LOCK = { phase:PHASE, snapTurnDegrees:45, movementFix:"forward uses dolly yaw heading, not XR camera direction", centerFix:"table center blocks target instead of magnet locking", nextBuild:"PHASE-152-HANDS-FIST-PURPLE-FIRE", noMusic:true, noWatch:true, worldMoved:false, referenceSpaceMutated:false };
setStatus("Phase 151 ready"); setMode("Right controller only");
