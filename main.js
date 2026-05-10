import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createWristWatch } from "./modules/watch.js";
import { createAudioPlaylist } from "./modules/audio.js";

const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
const EMBED = IN_IFRAME || params.has("embed");
const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director";
const AUTOCAM = IN_IFRAME || params.has("autocam") || PREVIEW;

const $status = document.getElementById("status");
const $mode = document.getElementById("mode");
const $log = document.getElementById("log");
const $err = document.getElementById("err");
const $toggleLog = document.getElementById("toggleLog");
const $toggleJoints = document.getElementById("toggleJoints");

function log(...args){
  const line = args.map(a => typeof a === "string" ? a : JSON.stringify(a, null, 2)).join(" ");
  $log.textContent += line + "\n";
  $log.scrollTop = $log.scrollHeight;
}

$toggleLog.addEventListener("click", ()=>{
  $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none";
});

if (AUTOCAM) document.body.classList.add("preview-mode");

const { scene, camera, renderer } = createCore({ containerId: "app" });
scene.userData._camera = camera;
camera.position.set(0, 1.6, 4.8);
camera.lookAt(0, 1.15, 0);


window.addEventListener("error", (e)=>{
  if (!renderer.xr.isPresenting && $err) $err.style.display = "block";
  if ($err) $err.textContent = "RUNTIME ERROR:\n" + (e?.error?.stack || e?.message || String(e));
});
window.addEventListener("unhandledrejection", (e)=>{
  if (!renderer.xr.isPresenting && $err) $err.style.display = "block";
  if ($err) $err.textContent = "UNHANDLED PROMISE REJECTION:\n" + (e?.reason?.stack || e?.reason || String(e));
});

const desktop = AUTOCAM ? null : createDesktopControls({ camera, domElement: renderer.domElement });
$status.textContent = "Loading world…";
const world = await buildSkylineRoom(scene, { log, renderer });
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius } = world;

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });

const audio = createAudioPlaylist({
  tracks: [
    { title: "Midnight Felt", url: "./audio/midnight_felt.wav" },
    { title: "Orbit Lounge", url: "./audio/orbit_lounge.wav" }
  ],
  onState: (state)=>{
    if (!$status || renderer.xr.isPresenting) return;
    if (state.error){
      $status.textContent = `Audio: ${state.error}`;
      return;
    }
    if (state.enabled){
      $status.textContent = `Now Playing: ${state.trackTitle}`;
      return;
    }
    $status.textContent = state.primed ? `Music Ready: ${state.trackTitle}` : `Audio Locked: tap once to unlock`;
  }
});

let seated = false;
let seatIndex = -1;
let cash = 50000;

function currentHeadXZ(){
  if (renderer.xr.isPresenting){
    const xrCam = renderer.xr.getCamera(camera);
    const p = new THREE.Vector3();
    xrCam.getWorldPosition(p);
    return p;
  }
  return camera.position.clone();
}

function inTableZone(){
  const p = currentHeadXZ();
  return new THREE.Vector2(p.x - tableCenter.x, p.z - tableCenter.z).length() <= joinRadius;
}

function seatLabel(){
  return seatIndex >= 0 ? seats[seatIndex]?.label || `Seat ${seatIndex + 1}` : "Standing";
}

function moveDesktopToSeat(seat){
  camera.position.set(seat.x, 1.18, seat.z);
  camera.lookAt(0, 1.0, 0);
}


function computeXRSeatYOffset(targetEyeY = 1.18){
  const xrCam = renderer.xr.getCamera(camera);
  const head = new THREE.Vector3();
  xrCam.getWorldPosition(head);
  return THREE.MathUtils.clamp(head.y - targetEyeY, -0.10, 0.55);
}

function joinTable(){
  if (!inTableZone()) return false;
  const p = currentHeadXZ();
  const openSeatIndices = seats
    .map((seat, idx)=>({ seat, idx }))
    .filter(({ seat })=> seat.label !== "Dealer Side" && !seat.occupiedByBot);
  if (!openSeatIndices.length) return false;
  let best = openSeatIndices[0].idx;
  let bestDist = Infinity;
  const preferred = openSeatIndices.find(({ seat })=> seat.label === "South Edge");
  if (preferred){
    best = preferred.idx;
    bestDist = Math.hypot(p.x - preferred.seat.x, p.z - preferred.seat.z);
  }
  openSeatIndices.forEach(({ seat, idx })=>{
    const d = Math.hypot(p.x - seat.x, p.z - seat.z);
    if (preferred && idx !== preferred.idx && d > bestDist - 0.35) return;
    if (d < bestDist){ bestDist = d; best = idx; }
  });
  seatIndex = best;
  seated = true;
  const seat = seats[best];
  if (renderer.xr.isPresenting){
    tp.setPlayerPose(seat.x, computeXRSeatYOffset(1.18), seat.z);
  } else {
    moveDesktopToSeat(seat);
  }
  $mode.textContent = `Seat: ${seat.label}`;
  return true;
}

function leaveTable(){
  seated = false;
  seatIndex = -1;
  if (renderer.xr.isPresenting){
    tp.setPlayerPose(0, 0, 4.8);
  } else {
    camera.position.set(0, 1.6, 4.8);
    camera.lookAt(0, 1.15, 0);
  }
  return true;
}


window.addEventListener("keydown", async (e)=>{
  if (renderer.xr.isPresenting || e.repeat) return;
  if (e.code === "KeyM") await audio.toggle();
  if (e.code === "KeyN") await audio.next();
  if (e.code === "KeyJ") joinTable();
  if (e.code === "KeyL") leaveTable();
  if (e.code === "KeyT") tp.toggleMode();
});

const watch = createWristWatch({
  scene,
  camera,
  renderer,
  getState: ()=>({
    cash,
    seated,
    seatLabel: seatLabel(),
    inTableZone: inTableZone(),
    audioEnabled: audio.getState().enabled,
    audioPrimed: audio.getState().primed,
    audioError: audio.getState().error,
    trackTitle: audio.getState().trackTitle,
    teleportEnabled: tp.getState().mode
  }),
  actions: {
    toggleAudio: ()=>audio.toggle(),
    nextTrack: ()=>audio.next(),
    toggleTeleport: ()=>tp.toggleMode(),
    joinTable,
    leaveTable
  }
});

$toggleJoints.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

$status.textContent = "Loading logo…";
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);

$status.textContent = AUTOCAM ? "Live preview ready" : "Ready. Enter VR.";
$mode.textContent = AUTOCAM ? "CAM 3 director" : "Hands: waiting…";

function setHudVisible(visible){
  const hud = document.getElementById("hud");
  if (hud) hud.style.display = (visible && !AUTOCAM) ? "flex" : "none";
  if ($log) $log.style.display = "none";
  if ($err) $err.style.display = "none";
}

if (AUTOCAM) setHudVisible(false);

renderer.xr.addEventListener("sessionstart", async ()=>{
  setHudVisible(false);
  await audio.prime();
  await audio.start();
  await tp.onSessionStart();
});
renderer.xr.addEventListener("sessionend", ()=>{
  setHudVisible(true);
});

let tPrev = performance.now();
const previewTarget = new THREE.Vector3(0, 1.25, 0);
const previewPos = new THREE.Vector3();
const previewShots = [
  { y: 1.62, r: previewOrbitRadius - 3.5, speed: 0.030, sway: 0.015, lookY: 1.02, targetX: 0.0, targetZ: 0.0, leadX: 0.14, leadZ: 0.08 },
  { y: 1.68, r: previewOrbitRadius - 3.0, speed: -0.024, sway: 0.018, lookY: 1.04, targetX: 0.1, targetZ: -0.1, leadX: -0.10, leadZ: 0.12 },
  { y: 1.64, r: previewOrbitRadius - 2.6, speed: 0.022, sway: 0.018, lookY: 1.03, targetX: -0.12, targetZ: 0.04, leadX: 0.10, leadZ: -0.08 }
];

renderer.setAnimationLoop(()=>{
  const now = performance.now();
  const dt = Math.min((now - tPrev) / 1000, 0.033);
  tPrev = now;

  if (!renderer.xr.isPresenting){
    if (!AUTOCAM) desktop.update(dt);
    else {
      const shotIndex = Math.floor(now / 9000) % previewShots.length;
      const shot = previewShots[shotIndex];
      const orbitT = now * 0.001 * shot.speed;
      previewPos.set(
        Math.cos(orbitT) * shot.r + shot.leadX * Math.sin(now * 0.00047),
        shot.y + Math.sin(now * 0.0014 + shotIndex) * shot.sway,
        Math.sin(orbitT) * shot.r + shot.leadZ * Math.cos(now * 0.00053)
      );
      previewTarget.set(shot.targetX, shot.lookY, shot.targetZ);
      camera.position.lerp(previewPos, 0.06);
      camera.lookAt(previewTarget);
    }
    scene.userData._camera = camera;
  } else {
    scene.userData._camera = renderer.xr.getCamera(camera);
  }

  if (scene.userData._tickWorld) scene.userData._tickWorld(dt);

  const left = hands.getLeft();
  const right = hands.getRight();

  hands.update(dt);
  hands.updateDebug();
  watch.update(dt, left, right);

  if (!AUTOCAM || renderer.xr.isPresenting){
    tp.update({
      leftHand: left,
      rightHand: right,
      statusCb: (text)=>{ if ($status) $status.textContent = text; },
      modeCb: (text)=>{ if ($mode) $mode.textContent = text; }
    });
  }

  renderer.render(scene, camera);
});

const canvasEl = renderer.domElement;
canvasEl.addEventListener("pointerdown", async ()=>{
  const st = audio.getState();
  if (!st.enabled) await audio.start();
}, { passive: true });
canvasEl.addEventListener("webglcontextlost", (e)=>{
  e.preventDefault();
  log("[ERR] WebGL context lost. Reloading…");
  if ($status) $status.textContent = "WebGL context lost (reloading…)";
  setTimeout(()=>location.reload(), 500);
}, false);
