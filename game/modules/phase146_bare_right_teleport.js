import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE = "PHASE-146-BARE-RIGHT-CONTROLLER-TRIGGER-TELEPORT-LOCK";
const TEXTURES = {
  floor: "./assets/texture/slate_basecolor.jpg",
  wall: "./assets/texture/stonebrick_wall_basecolor.png",
  felt: "./assets/texture/tablefelt.png"
};

const app = document.getElementById("app") || document.body;
const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
function status(text){ if (statusEl) statusEl.textContent = text; }
function mode(text){ if (modeEl) modeEl.textContent = text; }

const fpsEl = document.createElement("div");
fpsEl.style.cssText = "position:fixed;left:12px;top:54px;z-index:90;padding:7px 10px;border:1px solid #66ddff;border-radius:999px;background:rgba(0,0,0,.78);color:#66ddff;font:900 12px system-ui;pointer-events:none;";
fpsEl.textContent = "FPS --";
document.body.appendChild(fpsEl);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);

const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.06, 120);
camera.position.set(0, 1.62, 0);

const rig = new THREE.Group();
rig.name = "SVR_PHASE146_PLAYER_RIG_FINAL_DESTINATION";
rig.position.set(0, 0, 7.5);
rig.add(camera);
scene.add(rig);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, depth:true, stencil:false, powerPreference:"high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 0.72));
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
try { renderer.xr.setFramebufferScaleFactor?.(0.72); renderer.xr.setFoveation?.(0.25); } catch {}
app.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer, { requiredFeatures:["local-floor"], optionalFeatures:["bounded-floor"] }));

const loader = new THREE.TextureLoader();
function loadTex(url, repeatX=1, repeatY=1){
  const t = loader.load(url, undefined, undefined, () => {});
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  return t;
}

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(34,34),
  new THREE.MeshBasicMaterial({ map:loadTex(TEXTURES.floor,7,7), color:0xffffff, side:THREE.FrontSide })
);
floor.name = "SVR_PHASE146_REAL_TEXTURE_FLOOR_FROM_UPLOADED_GAME_ZIP";
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

function round(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function labelTexture(title, sub){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.84)"; round(ctx,18,24,988,208,26); ctx.fill();
  ctx.strokeStyle = "#f6e27f"; ctx.lineWidth = 8; round(ctx,18,24,988,208,26); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = "900 72px system-ui,Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(title,512,104);
  ctx.fillStyle = "#7ff5c7"; ctx.font = "900 34px system-ui,Arial"; ctx.fillText(sub,512,166);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function wall(name,x,z,rot,title,sub){
  const group = new THREE.Group(); group.name = name; group.position.set(x,2.15,z); group.rotation.y = rot; scene.add(group);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(9,4.3), new THREE.MeshBasicMaterial({ map:loadTex(TEXTURES.wall,2,1), color:0xffffff, side:THREE.DoubleSide }));
  group.add(panel);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(7.2,1.45), new THREE.MeshBasicMaterial({ map:labelTexture(title,sub), transparent:true, depthWrite:false, side:THREE.DoubleSide }));
  label.position.set(0,.35,.025); label.renderOrder = 20; group.add(label);
}
wall("SVR_PHASE146_NORTH_WALL",0,-16,0,"SVR PHASE 146","BARE TELEPORT DIAGNOSTIC");
wall("SVR_PHASE146_LEFT_WALL",-16,0,Math.PI/2,"RIGHT CONTROLLER","TRIGGER TELEPORT ONLY");
wall("SVR_PHASE146_RIGHT_WALL",16,0,-Math.PI/2,"NO MUSIC • NO HANDS","FINAL DESTINATION TEST");

const table = new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.25,.22,64), new THREE.MeshBasicMaterial({ map:loadTex(TEXTURES.felt,1,1), color:0xffffff }));
table.name = "SVR_PHASE146_SIMPLE_TEXTURE_TABLE"; table.position.set(0,.55,0); scene.add(table);
const tableRing = new THREE.Mesh(new THREE.RingGeometry(2.7,2.78,64), new THREE.MeshBasicMaterial({ color:0xf6e27f, transparent:true, opacity:.75, side:THREE.DoubleSide, depthWrite:false }));
tableRing.rotation.x = -Math.PI / 2; tableRing.position.y = .04; scene.add(tableRing);
scene.add(new THREE.HemisphereLight(0xffffff,0x111122,.85));

function makeTeleportLogo(){
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256,256,12,256,256,238);
  g.addColorStop(0,"#fff"); g.addColorStop(.22,"#00ff66"); g.addColorStop(.58,"#ffee00"); g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0,0,512,512);
  ctx.strokeStyle = "#000"; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(256,256,154,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle = "#000"; ctx.font = "900 112px system-ui,Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("SVR",256,235);
  ctx.font = "900 42px system-ui,Arial"; ctx.fillText("FINAL DEST",256,322);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
const targetGroup = new THREE.Group(); targetGroup.name = "SVR_PHASE146_TELEPORT_TARGET_GROUP"; targetGroup.visible = false; scene.add(targetGroup);
const targetLogo = new THREE.Mesh(new THREE.CircleGeometry(.82,64), new THREE.MeshBasicMaterial({ map:makeTeleportLogo(), transparent:true, depthTest:false, depthWrite:false, side:THREE.DoubleSide }));
targetLogo.rotation.x = -Math.PI / 2; targetLogo.renderOrder = 1000; targetGroup.add(targetLogo);
const targetRing = new THREE.Mesh(new THREE.RingGeometry(.98,1.34,72), new THREE.MeshBasicMaterial({ color:0xffff00, transparent:true, opacity:1, depthTest:false, depthWrite:false, side:THREE.DoubleSide }));
targetRing.rotation.x = -Math.PI / 2; targetRing.position.y = .01; targetRing.renderOrder = 1001; targetGroup.add(targetRing);
const aimLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0,0,-1)]), new THREE.LineBasicMaterial({ color:0x00ffff, transparent:true, opacity:1, depthTest:false, depthWrite:false }));
aimLine.visible = false; aimLine.renderOrder = 1002; scene.add(aimLine);

let rightController = null;
let rightGamepad = null;
for(let i=0;i<2;i++){
  const c = renderer.xr.getController(i);
  c.visible = false;
  rig.add(c);
  c.addEventListener("connected", e => {
    if(e.data?.handedness === "right"){
      rightController = c;
      rightGamepad = e.data.gamepad || null;
      status("Right controller connected");
    }
  });
  c.addEventListener("disconnected", () => { if(rightController === c){ rightController = null; rightGamepad = null; } });
}

const q = new THREE.Quaternion();
const origin = new THREE.Vector3();
const dirA = new THREE.Vector3();
const dirB = new THREE.Vector3();
const dir = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camForward = new THREE.Vector3();
const target = new THREE.Vector3();
const finalTarget = new THREE.Vector3();
const headWorld = new THREE.Vector3();
const rightVec = new THREE.Vector3();
let triggerWas = false;
let triggerStart = 0;
let gripWas = false;
let armed = false;
let targetValid = false;
let cooldownUntil = 0;
let lastTime = performance.now();
let acc = 0, samples = 0, worst = 0, lastReport = performance.now();
function button(idx){ const gp = rightGamepad || rightController?.inputSource?.gamepad; return gp?.buttons?.[idx]?.value || 0; }
function axes(){ const gp = rightGamepad || rightController?.inputSource?.gamepad; return gp?.axes || []; }
function dz(v){ return Math.abs(v) < .14 ? 0 : v; }
function getXRCamera(){ return renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera; }
function updateMove(dt){
  if(renderer.xr.isPresenting && rightController && !armed){
    const a = axes();
    const x = dz(Math.abs(a[2]||0) > Math.abs(a[0]||0) ? (a[2]||0) : (a[0]||0));
    const y = dz(Math.abs(a[3]||0) > Math.abs(a[1]||0) ? (a[3]||0) : (a[1]||0));
    const xrCam = getXRCamera();
    xrCam.getWorldDirection(camForward); camForward.y = 0; if(camForward.lengthSq() < .001) camForward.set(0,0,-1); camForward.normalize();
    rightVec.set(camForward.z,0,-camForward.x).normalize();
    rig.position.addScaledVector(camForward, -y * dt * 1.55);
    rig.position.addScaledVector(rightVec, x * dt * 1.15);
    rig.position.x = THREE.MathUtils.clamp(rig.position.x,-14,14);
    rig.position.z = THREE.MathUtils.clamp(rig.position.z,-14,14);
  }
}
function computeTarget(){
  const xrCam = getXRCamera();
  xrCam.getWorldPosition(camPos);
  xrCam.getWorldDirection(camForward); camForward.y = 0; if(camForward.lengthSq() < .001) camForward.set(0,0,-1); camForward.normalize();
  if(!rightController){ target.copy(camPos).addScaledVector(camForward,4); target.y = 0; return true; }
  rightController.updateWorldMatrix(true,false);
  rightController.getWorldPosition(origin);
  rightController.getWorldQuaternion(q);
  dirA.set(0,0,-1).applyQuaternion(q).normalize();
  dirB.copy(dirA).multiplyScalar(-1);
  const scoreA = dirA.x * camForward.x + dirA.z * camForward.z;
  const scoreB = dirB.x * camForward.x + dirB.z * camForward.z;
  dir.copy(scoreB > scoreA ? dirB : dirA);
  if(dir.y > -0.10){ dir.copy(camForward); dir.y = -0.28; }
  dir.normalize();
  const t = origin.y / -dir.y;
  if(!isFinite(t) || t < .15) target.copy(camPos).addScaledVector(camForward,4.0);
  else target.copy(origin).addScaledVector(dir, Math.min(t,8.5));
  target.y = 0;
  const vToX = target.x - camPos.x;
  const vToZ = target.z - camPos.z;
  if(vToX * camForward.x + vToZ * camForward.z < 0.5) target.copy(camPos).addScaledVector(camForward,4.0).setY(0);
  target.x = THREE.MathUtils.clamp(target.x,-14,14);
  target.z = THREE.MathUtils.clamp(target.z,-14,14);
  return true;
}
function showTarget(on){ targetGroup.visible = on; aimLine.visible = on; }
function updateTargetVisual(){
  if(!computeTarget()){ showTarget(false); return; }
  if(!targetValid) finalTarget.copy(target); else finalTarget.lerp(target,.35);
  targetValid = true;
  showTarget(true);
  targetGroup.position.set(finalTarget.x,.065,finalTarget.z);
  const p = aimLine.geometry.attributes.position;
  p.setXYZ(0, origin.x || camPos.x, origin.y || 1.2, origin.z || camPos.z);
  p.setXYZ(1, finalTarget.x,.10,finalTarget.z);
  p.needsUpdate = true;
}
function commitTeleport(){
  const now = performance.now();
  if(now < cooldownUntil) return;
  cooldownUntil = now + 900;
  const xrCam = getXRCamera();
  xrCam.getWorldPosition(headWorld);
  rig.position.x += finalTarget.x - headWorld.x;
  rig.position.z += finalTarget.z - headWorld.z;
  rig.position.x = THREE.MathUtils.clamp(rig.position.x,-14,14);
  rig.position.z = THREE.MathUtils.clamp(rig.position.z,-14,14);
  window.SVR_PHASE146_LAST_TELEPORT = { at:new Date().toISOString(), target:{x:finalTarget.x,z:finalTarget.z}, headBefore:{x:headWorld.x,z:headWorld.z}, rig:{x:rig.position.x,z:rig.position.z}, method:"move-player-rig-to-final-destination" };
  status("Teleported to final destination");
  mode("Trigger release committed");
}
function updateInput(){
  const tr = button(0);
  const grip = button(1);
  if(!rightController){ status("Waiting for right controller"); mode("No hands / no music"); showTarget(false); return; }
  if(grip > .25 && !gripWas){ armed = true; status("Grip preview only"); }
  if(gripWas && grip <= .12){ if(tr <= .12){ armed = false; showTarget(false); targetValid = false; status("Grip canceled"); } }
  if(tr > .18 && !triggerWas){ armed = true; triggerStart = performance.now(); status("Trigger aiming"); }
  if(armed) updateTargetVisual(); else showTarget(false);
  if(triggerWas && tr <= .10){
    const held = performance.now() - triggerStart;
    if(held > 90 && targetValid) commitTeleport();
    armed = false; showTarget(false); targetValid = false;
  }
  triggerWas = tr > .18;
  gripWas = grip > .25;
}

addEventListener("resize", () => { camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
renderer.xr.addEventListener("sessionstart", () => { status("VR ready: right controller only"); mode("Trigger teleport only"); });
renderer.xr.addEventListener("sessionend", () => { status("Desktop preview"); });

renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  updateMove(dt);
  updateInput();
  acc += dt; samples += 1; worst = Math.max(worst, dt * 1000);
  if(now - lastReport > 1000){
    const fps = (1 / Math.max(acc / samples, .001)).toFixed(1);
    fpsEl.textContent = `FPS ${fps} • worst ${worst.toFixed(0)}ms`;
    acc = 0; samples = 0; worst = 0; lastReport = now;
  }
  renderer.render(scene,camera);
});

window.SVR_PHASE146_DIAGNOSTIC = { phase:PHASE, noMain:true, noMusic:true, noHands:true, noWatch:true, rightControllerOnly:true, triggerOnlyTeleport:true, gripPreviewOnly:true, movement:"right-stick rig movement", textureSource:"existing game/assets/texture from uploaded game.zip", finalDestinationMethod:"rig moves HMD to target" };
status("Phase 146 ready");
mode("Right controller only");
