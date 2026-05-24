import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE = "PHASE-148-WEBXR-POINTER-ALIGNMENT-LOCK";
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

const debugEl = document.createElement("div");
debugEl.style.cssText = "position:fixed;left:12px;top:54px;z-index:90;max-width:calc(100vw - 24px);padding:7px 10px;border:1px solid #7ff5c7;border-radius:12px;background:rgba(0,0,0,.82);color:#7ff5c7;font:900 12px/1.35 system-ui;pointer-events:none;white-space:pre-wrap;";
debugEl.textContent = "WEBXR pointer alignment booting";
document.body.appendChild(debugEl);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);

const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.06, 160);
camera.position.set(0, 1.62, 0);

const dolly = new THREE.Group();
dolly.name = "SVR_PHASE148_WEBXR_PLAYER_DOLLY_MOVE_ONLY";
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
const floorTex = loadTex(TEXTURES.floor, 6, 6);
const wallTex = loadTex(TEXTURES.wall, 2, 1);
const feltTex = loadTex(TEXTURES.felt, 1, 1);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(36,36), new THREE.MeshBasicMaterial({ map:floorTex, color:0xffffff, side:THREE.FrontSide }));
floor.name = "SVR_PHASE148_REAL_TEXTURE_FLOOR_WEBXR";
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

function round(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); }
function labelTexture(title, sub){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.90)"; round(ctx,18,24,988,208,26); ctx.fill();
  ctx.strokeStyle = "#f6e27f"; ctx.lineWidth = 9; round(ctx,18,24,988,208,26); ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "900 70px system-ui,Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(title,512,102);
  ctx.fillStyle = "#7ff5c7"; ctx.font = "900 34px system-ui,Arial"; ctx.fillText(sub,512,166);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function wall(name,x,z,rot,title,sub){
  const group = new THREE.Group(); group.name = name; group.position.set(x,2.25,z); group.rotation.y = rot; scene.add(group);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(10.5,4.5), new THREE.MeshBasicMaterial({ map:wallTex, color:0xffffff, side:THREE.DoubleSide }));
  group.add(panel);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(8.2,1.45), new THREE.MeshBasicMaterial({ map:labelTexture(title,sub), transparent:true, depthWrite:false, side:THREE.DoubleSide }));
  label.position.set(0,.36,.03); label.renderOrder = 30; group.add(label);
}
wall("SVR_PHASE148_NORTH_WALL",0,-17,0,"POINTER ALIGNMENT","RAW WEBXR TARGET RAY");
wall("SVR_PHASE148_LEFT_WALL",-17,0,Math.PI/2,"RIGHT CONTROLLER ONLY","WORLD STAYS STILL");
wall("SVR_PHASE148_RIGHT_WALL",17,0,-Math.PI/2,"TRIGGER TELEPORT","GRIP PREVIEW ONLY");

const table = new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,.22,64), new THREE.MeshBasicMaterial({ map:feltTex, color:0xffffff }));
table.name = "SVR_PHASE148_SIMPLE_TEXTURE_TABLE"; table.position.set(0,.55,0); scene.add(table);
const tableRing = new THREE.Mesh(new THREE.RingGeometry(2.75,2.84,72), new THREE.MeshBasicMaterial({ color:0xf6e27f, transparent:true, opacity:.85, side:THREE.DoubleSide, depthWrite:false }));
tableRing.rotation.x = -Math.PI / 2; tableRing.position.y = .04; scene.add(tableRing);
scene.add(new THREE.HemisphereLight(0xffffff,0x111122,.90));

function makeTeleportLogo(){
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256,256,12,256,256,242);
  g.addColorStop(0,"#fff"); g.addColorStop(.18,"#00ff66"); g.addColorStop(.56,"#ffee00"); g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0,0,512,512);
  ctx.strokeStyle = "#000"; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(256,256,156,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle = "#000"; ctx.font = "900 104px system-ui,Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("SVR",256,228);
  ctx.font = "900 43px system-ui,Arial"; ctx.fillText("FINAL",256,308); ctx.fillText("DEST",256,358);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
const targetGroup = new THREE.Group(); targetGroup.name = "SVR_PHASE148_ALIGNED_FINAL_DEST_TARGET"; targetGroup.visible = false; scene.add(targetGroup);
const targetLogo = new THREE.Mesh(new THREE.CircleGeometry(.88,72), new THREE.MeshBasicMaterial({ map:makeTeleportLogo(), transparent:true, depthTest:false, depthWrite:false, side:THREE.DoubleSide }));
targetLogo.rotation.x = -Math.PI / 2; targetLogo.renderOrder = 1000; targetGroup.add(targetLogo);
const targetRing = new THREE.Mesh(new THREE.RingGeometry(1.06,1.43,80), new THREE.MeshBasicMaterial({ color:0xffff00, transparent:true, opacity:1, depthTest:false, depthWrite:false, side:THREE.DoubleSide }));
targetRing.rotation.x = -Math.PI / 2; targetRing.position.y = .012; targetRing.renderOrder = 1001; targetGroup.add(targetRing);
const aimLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0,0,-1)]), new THREE.LineBasicMaterial({ color:0x00ffff, transparent:true, opacity:1, depthTest:false, depthWrite:false }));
aimLine.visible = false; aimLine.renderOrder = 1002; scene.add(aimLine);

let rightController = null;
let rightGamepad = null;
let armed = false;
let armedBy = "none";
let targetValid = false;
let cooldownUntil = 0;
let selectHeld = false;

for(let i=0;i<2;i++){
  const c = renderer.xr.getController(i);
  c.visible = false;
  dolly.add(c);
  c.addEventListener("connected", e => {
    c.inputSource = e.data;
    c.visible = false;
    if(e.data?.handedness === "right"){
      rightController = c;
      rightGamepad = e.data.gamepad || null;
      status("Right WebXR controller connected");
      mode("Aligned target ray");
    }
  });
  c.addEventListener("disconnected", () => { if(rightController === c){ rightController = null; rightGamepad = null; } });
  c.addEventListener("selectstart", () => { if(c !== rightController) return; selectHeld = true; arm("trigger-selectstart"); });
  c.addEventListener("selectend", () => { if(c !== rightController) return; selectHeld = false; if(armed && targetValid) commitTeleport("selectend"); disarm(); });
  c.addEventListener("squeezestart", () => { if(c !== rightController) return; arm("grip-preview"); });
  c.addEventListener("squeezeend", () => { if(c !== rightController) return; if(armedBy === "grip-preview" && !selectHeld) disarm(); });
}

const origin = new THREE.Vector3();
const dirRaw = new THREE.Vector3();
const dirInv = new THREE.Vector3();
const chosenDir = new THREE.Vector3();
const pointRaw = new THREE.Vector3();
const pointInv = new THREE.Vector3();
const pointFallback = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camForward = new THREE.Vector3();
const finalTarget = new THREE.Vector3();
const headWorld = new THREE.Vector3();
const rightVec = new THREE.Vector3();
let triggerWas = false;
let triggerStart = 0;
let gripWas = false;
let lastTime = performance.now();
let acc = 0, samples = 0, worst = 0, lastReport = performance.now();
let aimMode = "none";

function button(idx){ const gp = rightGamepad || rightController?.inputSource?.gamepad; return gp?.buttons?.[idx]?.value || 0; }
function axes(){ const gp = rightGamepad || rightController?.inputSource?.gamepad; return gp?.axes || []; }
function dz(v){ return Math.abs(v) < .14 ? 0 : v; }
function getXRCamera(){ return renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera; }
function clampDolly(){ dolly.position.x = THREE.MathUtils.clamp(dolly.position.x,-15,15); dolly.position.z = THREE.MathUtils.clamp(dolly.position.z,-15,15); }
function arm(kind){ if(!rightController || performance.now() < cooldownUntil) return; armed = true; armedBy = kind; status(kind === "grip-preview" ? "Grip preview only" : "Trigger aiming: release to teleport"); }
function disarm(){ armed = false; armedBy = "none"; targetValid = false; targetGroup.visible = false; aimLine.visible = false; status("Right controller ready"); }
function updateMove(dt){
  if(renderer.xr.isPresenting && rightController && !armed){
    const a = axes();
    const x = dz(Math.abs(a[2]||0) > Math.abs(a[0]||0) ? (a[2]||0) : (a[0]||0));
    const y = dz(Math.abs(a[3]||0) > Math.abs(a[1]||0) ? (a[3]||0) : (a[1]||0));
    const xrCam = getXRCamera();
    xrCam.getWorldDirection(camForward); camForward.y = 0; if(camForward.lengthSq() < .001) camForward.set(0,0,-1); camForward.normalize();
    rightVec.set(camForward.z,0,-camForward.x).normalize();
    dolly.position.addScaledVector(camForward, -y * dt * 1.55);
    dolly.position.addScaledVector(rightVec, x * dt * 1.15);
    clampDolly();
  }
}
function floorHit(rayOrigin, rayDir, out){
  if(Math.abs(rayDir.y) < 0.035) return false;
  const t = -rayOrigin.y / rayDir.y;
  if(!isFinite(t) || t < .08 || t > 13.0) return false;
  out.copy(rayOrigin).addScaledVector(rayDir, t);
  out.y = 0;
  return true;
}
function scorePoint(p){
  const vx = p.x - camPos.x;
  const vz = p.z - camPos.z;
  const front = vx * camForward.x + vz * camForward.z;
  const dist = Math.hypot(vx, vz);
  if(front < -0.25) return -9999;
  return front * 2.0 - Math.abs(dist - 4.2) * 0.25;
}
function computeAlignedTarget(){
  const xrCam = getXRCamera();
  xrCam.getWorldPosition(camPos);
  xrCam.getWorldDirection(camForward);
  camForward.y = 0;
  if(camForward.lengthSq() < .001) camForward.set(0,0,-1);
  camForward.normalize();

  pointFallback.copy(camPos).addScaledVector(camForward,4.2);
  pointFallback.y = 0;

  if(!rightController){ finalTarget.copy(pointFallback); aimMode = "fallback-no-controller"; return true; }

  rightController.updateWorldMatrix(true,false);
  rightController.getWorldPosition(origin);
  rightController.getWorldDirection(dirRaw);
  dirRaw.normalize();
  dirInv.copy(dirRaw).multiplyScalar(-1);

  let rawOk = floorHit(origin, dirRaw, pointRaw);
  let invOk = floorHit(origin, dirInv, pointInv);
  let rawScore = rawOk ? scorePoint(pointRaw) : -9999;
  let invScore = invOk ? scorePoint(pointInv) : -9999;

  if(rawScore >= invScore && rawOk){ finalTarget.copy(pointRaw); chosenDir.copy(dirRaw); aimMode = "raw-target-ray"; }
  else if(invOk){ finalTarget.copy(pointInv); chosenDir.copy(dirInv); aimMode = "inverted-target-ray"; }
  else { finalTarget.copy(pointFallback); chosenDir.copy(camForward).setY(-0.32).normalize(); aimMode = "view-forward-fallback"; }

  // Keep target in front and not too far. This fixes visible alignment without sending the marker behind the user.
  const vx = finalTarget.x - camPos.x;
  const vz = finalTarget.z - camPos.z;
  const front = vx * camForward.x + vz * camForward.z;
  if(front < 0.45){ finalTarget.copy(pointFallback); aimMode = "front-clamp-fallback"; }

  finalTarget.x = THREE.MathUtils.clamp(finalTarget.x,-15,15);
  finalTarget.z = THREE.MathUtils.clamp(finalTarget.z,-15,15);
  finalTarget.y = 0;
  targetValid = true;
  return true;
}
function updateTargetVisual(){
  if(!computeAlignedTarget()){ targetGroup.visible = false; aimLine.visible = false; return; }
  targetGroup.visible = true;
  aimLine.visible = true;
  targetGroup.position.set(finalTarget.x,.066,finalTarget.z);
  const p = aimLine.geometry.attributes.position;
  p.setXYZ(0, origin.x || camPos.x, origin.y || 1.2, origin.z || camPos.z);
  p.setXYZ(1, finalTarget.x,.12,finalTarget.z);
  p.needsUpdate = true;
}
function commitTeleport(reason="trigger-release"){
  const now = performance.now();
  if(now < cooldownUntil || !targetValid) return;
  cooldownUntil = now + 850;
  const xrCam = getXRCamera();
  xrCam.getWorldPosition(headWorld);
  const dx = finalTarget.x - headWorld.x;
  const dz = finalTarget.z - headWorld.z;
  dolly.position.x += dx;
  dolly.position.z += dz;
  clampDolly();
  window.SVR_PHASE148_LAST_TELEPORT = { at:new Date().toISOString(), reason, aimMode, target:{x:finalTarget.x,z:finalTarget.z}, headBefore:{x:headWorld.x,z:headWorld.z}, delta:{x:dx,z:dz}, dolly:{x:dolly.position.x,z:dolly.position.z}, method:"webxr-dolly-rig-aligned-pointer" };
  status("Teleported to aligned destination");
  mode("WebXR dolly moved");
}
function pollInputFallback(){
  const tr = button(0);
  const grip = button(1);
  if(!rightController){ status("Waiting for right WebXR controller"); mode("No hands / no music"); return; }
  if(tr > .18 && !triggerWas){ triggerStart = performance.now(); arm("trigger-poll"); }
  if(triggerWas && tr <= .10){
    const held = performance.now() - triggerStart;
    if(held > 90 && armed && targetValid) commitTeleport("trigger-poll-release");
    if(armedBy !== "grip-preview") disarm();
  }
  if(grip > .25 && !gripWas){ arm("grip-preview"); }
  if(gripWas && grip <= .12 && !selectHeld){ disarm(); }
  triggerWas = tr > .18;
  gripWas = grip > .25;
}

addEventListener("resize", () => { camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
renderer.xr.addEventListener("sessionstart", () => { status("WebXR ready: aligned right controller"); mode("Trigger/select teleports"); });
renderer.xr.addEventListener("sessionend", () => { status("Desktop preview"); });

renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  updateMove(dt);
  pollInputFallback();
  if(armed) updateTargetVisual();
  acc += dt; samples += 1; worst = Math.max(worst, dt * 1000);
  if(now - lastReport > 1000){
    const fps = (1 / Math.max(acc / samples, .001)).toFixed(1);
    debugEl.textContent = `PHASE 148 POINTER ALIGN\nFPS ${fps} • worst ${worst.toFixed(0)}ms\nDolly ${dolly.position.x.toFixed(2)}, ${dolly.position.z.toFixed(2)}\nAim ${aimMode}\nTarget ${targetValid ? finalTarget.x.toFixed(2)+", "+finalTarget.z.toFixed(2) : "none"}`;
    acc = 0; samples = 0; worst = 0; lastReport = now;
  }
  renderer.render(scene,camera);
});

window.SVR_PHASE148_WEBXR_POINTER_ALIGNMENT = {
  phase:PHASE,
  noMain:true,
  noMusic:true,
  noHands:true,
  noWatch:true,
  rightControllerOnly:true,
  pointerAlignment:"raw WebXR target ray first, inverted ray only if valid, front-clamped fallback",
  noSmoothing:true,
  finalDestinationMethod:"move WebXR dolly so HMD lands on aligned target",
  worldMoved:false,
  referenceSpaceMutated:false
};
status("Phase 148 pointer alignment ready");
mode("Right controller only");
