import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createAudioPlaylist } from "./modules/audio.js";
import { createWristWatch } from "./modules/watch.js";

const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
const EMBED = IN_IFRAME || params.has("embed");
const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director";
const AUTOCAM = IN_IFRAME || params.has("autocam") || PREVIEW;

const $status = document.getElementById("status");
const $mode = document.getElementById("mode");
const $log = document.getElementById("log");
const $err = document.getElementById("err");
const $posPanel = document.getElementById("posPanel");
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
  toggle: async ()=>({ enabled:false, trackTitle:"Music Disabled" }),
  next: async ()=>({ enabled:false, trackTitle:"Music Disabled" }),
  prime: async ()=>({ enabled:false, trackTitle:"Music Disabled" }),
  start: async ()=>({ enabled:false, trackTitle:"Music Disabled" }),
  stop: async ()=>({ enabled:false, trackTitle:"Music Disabled" }),
  getState: ()=>({ enabled:false, primed:false, trackTitle:"Music Disabled", error:null })
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
  if (key === "reikiAbout") return openReikiAboutPage();
  if (PRIVATE_SCENE_PAGES[key]) return openPrivateScenePage(key);
  const rec = sceneTargets?.[key];
  if (!rec?.pos) return false;
  movePlayerToSpot(rec.pos, rec.look || null);
  setStatus(`Quick jump: ${key}`, { force: true });
  return true;
}


const PRIVATE_SCENE_PAGES = {
  reikiPrivate: "./reiki.html?v=phase92",
  pgaDrive: "./pga-drive.html?v=phase92",
  chipPutt: "./chip-putt.html?v=phase92",
  storeRoom: "./store-room.html?v=phase92",
  smokerLounge: "./smoker-lounge.html?v=phase92",
  scorpionRoom: "./scorpion.html?v=phase92"
};

function openPrivateScenePage(key){
  const href = PRIVATE_SCENE_PAGES[key];
  if (!href) return false;
  window.location.href = href;
  return true;
}

function openReikiVideoPortal(){
  if (!isInReikiArea()){
    setStatus("Reiki hologram stays paused and only activates from the Reiki storefront. Jump to Reiki first.", { force: true });
    return false;
  }
  window.location.href = "./reiki-video-portal.html?v=phase92-reiki-hologram-pause-lock&zone=reiki";
  return true;
}

function openReikiAboutPage(){
  const url = "https://svrpoker.com/site/reiki-about.html";
  window.open(url, "_blank", "noopener,noreferrer");
  setStatus("Reiki About page opened in a safe browser tab.", { force: true });
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
  group.name = "Reiki Wall Hologram Portal";
  const target = sceneTargets?.reikiRoom?.pos || sceneTargets?.reiki?.pos || new THREE.Vector3(-6, 0, -2.5);
  group.position.set(target.x + 1.25, 1.78, target.z - 1.38);
  group.lookAt(sceneTargets?.reiki?.look || new THREE.Vector3(0, 1.35, 0));
  const mat = new THREE.MeshBasicMaterial({ color: 0x34fff4, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xb46cff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.05), mat);
  pane.userData.href = "./reiki-video-portal.html?v=phase92-reiki-hologram-pause-lock&zone=reiki";
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
  ctx.fillText("REIKI HOLOGRAM", 512, 150);
  ctx.fillStyle = "#ffdddd"; ctx.font = "bold 42px system-ui, Arial"; ctx.fillText("AWAITING APPROVAL", 512, 232);
  ctx.fillStyle = "#bffcff"; ctx.font = "30px system-ui, Arial"; ctx.fillText("Paused by wall / plant", 512, 308);
  ctx.fillText("Only plays from Reiki area", 512, 360);
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

function createReikiCenterVideoHologram(){
  const rec = sceneTargets?.reikiRoom || sceneTargets?.reiki;
  if (!rec?.pos) return null;

  const group = new THREE.Group();
  group.name = "Reiki Center Playing Hologram";
  group.position.copy(rec.pos).setY(1.92);
  if (rec.look) group.lookAt(rec.look.x, 1.55, rec.look.z);

  const video = document.createElement("video");
  video.src = "./assets/video/reiki_hologram.mp4";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.dataset.svrRole = "reiki-center-hologram";
  video.play().catch(()=>{});

  const videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace;
  videoTex.minFilter = THREE.LinearFilter;
  videoTex.magFilter = THREE.LinearFilter;

  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.35, 1.88),
    new THREE.MeshBasicMaterial({ map: videoTex, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false })
  );
  pane.userData.href = "./reiki-video-portal.html?v=phase92-reiki-hologram-aligned&zone=reiki";
  pane.renderOrder = 30;
  group.add(pane);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.58, 2.08),
    new THREE.MeshBasicMaterial({ color: 0x58fff4, transparent: true, opacity: 0.14, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.position.z = -0.018;
  glow.renderOrder = 29;
  group.add(glow);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.96, 0.024, 14, 128),
    new THREE.MeshBasicMaterial({ color: 0xb56cff, transparent: true, opacity: 0.78, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.scale.set(1.78, 1.00, 1);
  ring.position.z = 0.035;
  ring.renderOrder = 31;
  group.add(ring);

  const base = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 72),
    new THREE.MeshBasicMaterial({ color: 0x58fff4, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  base.rotation.x = -Math.PI * 0.5;
  base.position.set(0, -1.12, 0.06);
  group.add(base);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 1024; labelCanvas.height = 180;
  const ctx = labelCanvas.getContext("2d");
  ctx.fillStyle = "rgba(0,8,18,.80)"; ctx.fillRect(0,0,1024,180);
  ctx.strokeStyle = "rgba(88,255,244,.95)"; ctx.lineWidth = 8; ctx.strokeRect(18,18,988,144);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#eaffff"; ctx.font = "bold 50px system-ui, Arial"; ctx.fillText("REIKI HOLOGRAM • VISUAL LOOP", 512, 70);
  ctx.fillStyle = "#ffdede"; ctx.font = "bold 30px system-ui, Arial"; ctx.fillText("AWAITING APPROVAL • TAP FOR SOUND PORTAL", 512, 124);
  const labelTex = new THREE.CanvasTexture(labelCanvas); labelTex.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(3.25, 0.58), new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  label.position.set(0, 1.22, 0.05);
  label.renderOrder = 32;
  group.add(label);

  const light = new THREE.PointLight(0x58fff4, 2.2, 10, 1.7);
  light.position.set(0, 0.2, 0.55);
  group.add(light);

  scene.add(group);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (ev)=>{
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects([pane, label], false)[0];
    if (hit) openReikiVideoPortal();
  });

  return { group, video };
}

function formatVec(v){
  if (!v) return "missing";
  return `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`;
}

function updatePositionPanel(){
  if (!$posPanel) return;
  const p = currentHeadXZ();
  const ordered = ["lobby","seat","reiki","reikiRoom","store","storeRoom","smokerLounge","scorpion","pga","pgaWall"];
  const rows = ordered.map((key)=>{
    const rec = sceneTargets?.[key];
    return `${key.padEnd(12)} ${rec?.pos ? formatVec(rec.pos) : "missing"}`;
  });
  $posPanel.innerHTML = `<b>Position Panel</b>\nPLAYER       ${formatVec(p)}\n${rows.join("\n")}\n\nKeys: 4 Reiki • 9 Reiki Video • O Store • About button opens site page`;
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
  if (e.code === "KeyA") openReikiAboutPage();
  if (e.code === "KeyD") gotoScene("pgaDrive");
  if (e.code === "KeyC") gotoScene("chipPutt");
  if (e.code === "KeyU") gotoScene("smokerLounge");
});

const watch = createWristWatch({
  scene,
  camera,
  renderer,
  getState: ()=>({
    audioEnabled: audio.getState().enabled,
    trackTitle: audio.getState().trackTitle || "Lobby 07",
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
    goStoreRoom: ()=>gotoScene("storeRoom"),
    goPgaDrive: ()=>gotoScene("pgaDrive"),
    goChipPutt: ()=>gotoScene("chipPutt"),
    goLounge: ()=>gotoScene("smokerLounge"),
    goLegend: ()=>gotoScene("legends"),
    goSponsor: ()=>gotoScene("sponsor"),
    goScorpion: ()=>gotoScene("scorpion"),
    goReikiRoom: ()=>openReikiVideoPortal(),
    goReikiAbout: ()=>openReikiAboutPage()
  }
});

createInactiveReikiPortal();
const reikiCenterHologram = createReikiCenterVideoHologram();
createStoreWebPortal();

$toggleJoints.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logo…", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);

setStatus(AUTOCAM ? "Live preview ready" : "Phase 92 ready. Reiki hologram centered, Reiki About shortcut added, position panel restored, Moon and Mars locked high.", { force: true });
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
  await audio.prime();
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

  updatePositionPanel();
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
