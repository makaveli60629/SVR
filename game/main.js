import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createWristWatch } from "./modules/watch.js";
import { applyReikiCleanCarousel113 } from "./modules/update_3_0_reiki_clean_carousel_113.js";
import { applyPhase119ReikiTrueitiveStorefrontFinal } from "./modules/reiki_phase119_trueitive_storefront_final.js";
import "./modules/asset_registry_phase122.js";

const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
const EMBED = IN_IFRAME || params.has("embed");
const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director";
const AUTOCAM = IN_IFRAME || params.has("autocam") || PREVIEW;
window.SVR_PHASE106 = { build: 'UPDATE-3.0-PHASE-122-GLOVES-EARTH-ASSET-ADD-LOCK', source: '1.4G Reiki storefront backup with Phase 120 yaw-only alignment and high Moon/Mars lock' };

const $status = document.getElementById("status");
const $mode = document.getElementById("mode");
const $log = document.getElementById("log");
const $err = document.getElementById("err");
const $toggleLog = document.getElementById("toggleLog");
const $toggleJoints = document.getElementById("toggleJoints");
const $sceneButtons = Array.from(document.querySelectorAll("#sceneNav .scene-btn"));

let lastStatusText = "";
let lastStatusAt = 0;
function setStatus(text, { force = false, minGap = 180 } = {}){
  if (!$status) return;
  const now = performance.now();
  if (!force && text === lastStatusText) return;
  if (!force && lastStatusText && now - lastStatusAt < minGap) return;
  lastStatusText = text;
  lastStatusAt = now;
  $status.textContent = text;
}

let lastModeText = "";
function setMode(text){
  if (!$mode || text === lastModeText) return;
  lastModeText = text;
  $mode.textContent = text;
}

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
setStatus("Loading world…", { force: true });
const world = await buildSkylineRoom(scene, { log, renderer });
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius, sceneTargets = {} } = world;

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });

const audio = {
  toggle: async ()=>({ enabled:false, trackTitle:'Music Disabled' }),
  next: async ()=>({ enabled:false, trackTitle:'Music Disabled' }),
  prime: async ()=>({ enabled:false, trackTitle:'Music Disabled' }),
  start: async ()=>({ enabled:false, trackTitle:'Music Disabled' }),
  stop: async ()=>({ enabled:false, trackTitle:'Music Disabled' }),
  getState: ()=>({ enabled:false, primed:false, trackTitle:'Music Disabled', error:null })
};
window.SVR_AUDIO_DISABLED = true;

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
  return new THREE.Vector2(p.x - tableCenter.x, p.z - tableCenter.z).length() <= (joinRadius + 0.7);
}

function seatLabel(){
  return seatIndex >= 0 ? seats[seatIndex]?.label || `Seat ${seatIndex + 1}` : "Standing";
}

function moveDesktopToSeat(seat){
  camera.position.set(seat.x, 1.12, seat.z);
  camera.lookAt(0, 1.0, 0);
}

function joinTable(){
  if (!inTableZone()) return false;
  const p = currentHeadXZ();
  let best = 0;
  let bestDist = Infinity;
  seats.forEach((seat, idx)=>{
    if (seat.label === "Dealer Side") return;
    const d = Math.hypot(p.x - seat.x, p.z - seat.z);
    if (d < bestDist){ bestDist = d; best = idx; }
  });
  seatIndex = best;
  seated = true;
  const seat = seats[best];
  if (renderer.xr.isPresenting){
    tp.setPlayerPose(seat.x, -0.42, seat.z);
  } else {
    moveDesktopToSeat(seat);
  }
  setMode(`Seat: ${seat.label}`);
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

function movePlayerToSpot(target, lookTarget = null){
  if (!target) return;
  if (renderer.xr.isPresenting){
    tp.setPlayerPose(target.x, 0, target.z);
  } else {
    camera.position.set(target.x, 1.6, target.z);
    if (lookTarget) camera.lookAt(lookTarget.x, 1.45, lookTarget.z);
  }
}

function distanceToTarget(key){
  const rec = sceneTargets?.[key];
  if (!rec?.pos) return Infinity;
  const p = currentHeadXZ();
  return Math.hypot(p.x - rec.pos.x, p.z - rec.pos.z);
}

function isInReikiArea(){
  return distanceToTarget("reiki") <= 3.6 || distanceToTarget("reikiRoom") <= 4.2;
}

function gotoScene(key){
  if (key === "reikiVideoPortal") return openReikiVideoPortal();
  const rec = sceneTargets?.[key];
  if (!rec?.pos) return false;
  movePlayerToSpot(rec.pos, rec.look || null);
  setStatus(`Quick jump: ${key}`, { force: true });
  return true;
}


function openReikiVideoPortal(){
  if (!isInReikiArea()){
    setStatus("Reiki hologram stays paused and only activates from the Reiki storefront. Jump to Reiki first.", { force: true });
    return false;
  }
  window.location.href = "./reiki-video-portal.html?v=phase105-reiki-reference-restore&zone=reiki";
  return true;
}

function openStorePortal(){
  const url = "https://svrpoker.com/site/store.html";
  window.open(url, "_blank", "noopener,noreferrer");
  setStatus("SVR Store portal opened in a safe browser tab.", { force: true });
  return true;
}

function createStoreWebPortal(){
  const rec = sceneTargets?.store || sceneTargets?.sponsor;
  if (!rec?.pos) return null;
  const group = new THREE.Group();
  group.name = "SVR Store Web Portal";
  group.position.set(rec.pos.x + 0.35, 1.7, rec.pos.z - 0.35);
  if (rec.look) group.lookAt(rec.look.x, 1.45, rec.look.z);

  const glowMat = new THREE.MeshBasicMaterial({ color: 0x5ef7ff, transparent: true, opacity: 0.20, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.12), glowMat);
  pane.userData.href = "https://svrpoker.com/site/store.html";
  group.add(pane);
  const frame = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.018, 12, 112),
    new THREE.MeshBasicMaterial({ color: 0x9b5cff, transparent: true, opacity: 0.66, side: THREE.DoubleSide })
  );
  frame.scale.set(1.42, 0.72, 1);
  frame.position.z = 0.025;
  group.add(frame);

  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 650;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0,0,1200,650);
  grad.addColorStop(0, "rgba(3,12,20,.95)"); grad.addColorStop(1, "rgba(18,8,34,.96)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,1200,650);
  ctx.strokeStyle = "rgba(94,247,255,.94)"; ctx.lineWidth = 14; ctx.strokeRect(28,28,1144,594);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 76px system-ui, Arial"; ctx.fillText("SVR STORE PORTAL", 600, 150);
  ctx.fillStyle = "#9ffcff"; ctx.font = "bold 44px system-ui, Arial"; ctx.fillText("VR-friendly web store preview", 600, 245);
  ctx.fillStyle = "#d9d4ff"; ctx.font = "34px system-ui, Arial"; ctx.fillText("https://svrpoker.com/site/store.html", 600, 340);
  ctx.fillStyle = "#ffdd88"; ctx.font = "bold 34px system-ui, Arial"; ctx.fillText("Click / tap to open", 600, 445);
  ctx.fillStyle = "#bffcff"; ctx.font = "28px system-ui, Arial"; ctx.fillText("Store opens outside the game so the lobby stays smooth", 600, 505);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.08), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  panel.position.z = 0.035;
  group.add(panel);
  scene.add(group);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (ev)=>{
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects([pane, panel], false)[0];
    if (hit) openStorePortal();
  });
  return group;
}

function createInactiveReikiPortal(){
  const group = new THREE.Group();
  group.name = "Inactive Reiki Video Portal";
  const target = sceneTargets?.reiki?.pos || new THREE.Vector3(-6, 0, -2.5);
  group.position.set(target.x + 1.55, 1.65, target.z + 0.15);
  group.lookAt(0, 1.35, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0x34fff4, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xb46cff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.05), mat);
  pane.userData.href = "./reiki-video-portal.html?v=phase105-reiki-reference-restore&zone=reiki";
  group.add(pane);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.018, 12, 96), frameMat);
  ring.position.z = 0.02;
  ring.scale.set(1.42, .78, 1);
  group.add(ring);
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,1024,512);
  ctx.fillStyle = "rgba(0,8,18,.74)"; ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle = "rgba(88,255,244,.92)"; ctx.lineWidth = 10; ctx.strokeRect(24,24,976,464);
  ctx.fillStyle = "#eaffff"; ctx.font = "bold 58px system-ui, Arial"; ctx.textAlign = "center";
  ctx.fillText("REIKI VIDEO PORTAL", 512, 150);
  ctx.fillStyle = "#ffdddd"; ctx.font = "bold 42px system-ui, Arial"; ctx.fillText("AWAITING APPROVAL", 512, 232);
  ctx.fillStyle = "#bffcff"; ctx.font = "30px system-ui, Arial"; ctx.fillText("Paused hologram portal", 512, 308);
  ctx.fillText("Play only inside Reiki area", 512, 360);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const text = new THREE.Mesh(new THREE.PlaneGeometry(1.75, .88), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  text.position.z = 0.03; group.add(text);
  scene.add(group);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (ev)=>{
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects([pane, text], false)[0];
    if(hit) openReikiVideoPortal();
  });
  return group;
}


$sceneButtons.forEach((btn)=>{
  btn.addEventListener("click", ()=>{
    const key = btn.dataset.scene;
    if (key) gotoScene(key);
  });
});

window.addEventListener("keydown", async (e)=>{
  if (renderer.xr.isPresenting || e.repeat) return;
  if (e.code === "KeyM") await audio.toggle();
  if (e.code === "KeyN") await audio.next();
  if (e.code === "KeyJ") joinTable();
  if (e.code === "KeyL") leaveTable();
  if (e.code === "KeyT") tp.toggleMode();
  if (e.code === "Digit1") gotoScene("lobby");
  if (e.code === "Digit2") gotoScene("table");
  if (e.code === "Digit3") gotoScene("seat");
  if (e.code === "Digit4") gotoScene("reiki");
  if (e.code === "Digit5") gotoScene("pga");
  if (e.code === "Digit6") gotoScene("legends");
  if (e.code === "Digit7") gotoScene("sponsor");
  if (e.code === "Digit8") gotoScene("scorpion");
  if (e.code === "Digit9") openReikiVideoPortal();
  if (e.code === "Digit0") gotoScene("store");
  if (e.code === "KeyO") openStorePortal();
});

const watch = createWristWatch({
  scene,
  camera,
  renderer,
  getState: ()=>({
    audioEnabled: audio.getState().enabled,
    trackTitle: audio.getState().trackTitle || "Music Disabled",
    cash,
    seated,
    inTableZone: inTableZone(),
    seatLabel: seatLabel(),
    teleportEnabled: tp.isEnabled ? tp.isEnabled() : true
  }),
  actions: {
    toggleAudio: ()=>audio.toggle(),
    nextTrack: ()=>audio.next(),
    joinTable,
    leaveTable,
    toggleTeleport: ()=>tp.toggleMode(),
    goLobby: ()=>gotoScene("lobby"),
    goTable: ()=>gotoScene("table"),
    goSeat: ()=>gotoScene("seat"),
    goReiki: ()=>gotoScene("reiki"),
    goPga: ()=>gotoScene("pga"),
    goStore: ()=>gotoScene("store"),
    openStore: ()=>openStorePortal(),
    goLegend: ()=>gotoScene("legends"),
    goSponsor: ()=>gotoScene("sponsor"),
    goScorpion: ()=>gotoScene("scorpion"),
    goReikiRoom: ()=>openReikiVideoPortal()
  }
});

/* Phase 113: do not stack the old inactive portal or Phase 106 large panel over the Reiki storefront. */
createStoreWebPortal();
applyReikiCleanCarousel113({ scene, camera, renderer, sceneTargets, setStatus, log });
applyPhase119ReikiTrueitiveStorefrontFinal({ scene, camera, sceneTargets, setStatus, log });

$toggleJoints.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logo…", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);

window.__SVR_GAME_READY__ = true;
const __svrBootFallback = document.getElementById('bootFallback'); if (__svrBootFallback){ __svrBootFallback.style.opacity='0'; __svrBootFallback.style.pointerEvents='none'; setTimeout(()=>{__svrBootFallback.style.display='none';},420); }
setStatus(AUTOCAM ? "Live preview ready" : "Ready. Enter VR. Right stick moves/snaps. Music disabled. Phase 120 Reiki storefront alignment locked. Store portal ready.", { force: true });
setMode(AUTOCAM ? "CAM 3 director" : "Hands: waiting…");

function setHudVisible(visible){
  const hud = document.getElementById("hud");
  if (hud) hud.style.display = (visible && !AUTOCAM) ? "flex" : "none";
  if ($log) $log.style.display = "none";
  if ($err) $err.style.display = "none";
}

if (AUTOCAM) setHudVisible(false);
if (renderer.xr.isPresenting) document.getElementById("sceneNav")?.style.setProperty("display","none");

renderer.xr.addEventListener("sessionstart", async ()=>{
  setHudVisible(false);
  document.getElementById("sceneNav")?.style.setProperty("display","none");
  // Audio is intentionally primed only. Lobby music stays OFF until the user presses
  // M or the wrist-watch MUSIC button. Reiki hologram audio stays isolated to the
  // Reiki video portal.
  // Phase 105: music removed by request; no audio prime/autoplay.
  await tp.onSessionStart();
});
renderer.xr.addEventListener("sessionend", ()=>{
  setHudVisible(true);
  const nav = document.getElementById("sceneNav");
  if (nav && !AUTOCAM) nav.style.display = "flex";
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

  hands.update(dt);
  hands.updateDebug();

  const leftHand = hands.getLeftHand();
  const rightHand = hands.getRightHand();
  const leftController = hands.getLeftController();
  const rightController = hands.getRightController();
  if (!AUTOCAM || renderer.xr.isPresenting){
    tp.update({
      dt,
      leftHand,
      rightHand,
      leftController,
      rightController,
      statusCb: (text)=>{ setStatus(text); },
      modeCb: (text)=>{ setMode(text); }
    });
  }

  if (watch) watch.update(dt, leftHand, rightHand);

  renderer.render(scene, camera);
});

const canvasEl = renderer.domElement;
canvasEl.addEventListener("pointerdown", async ()=>{
  // User gesture primes browser audio unlock only. Lobby music still requires
  // explicit M key / watch MUSIC toggle.
  await audio.prime();
}, { passive: true });
canvasEl.addEventListener("webglcontextlost", (e)=>{
  e.preventDefault();
  log("[ERR] WebGL context lost. Reloading…");
  setStatus("WebGL context lost (reloading…)", { force: true });
  setTimeout(()=>location.reload(), 500);
}, false);
