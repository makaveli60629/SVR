import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createWristWatch } from "./modules/watch.js";
import { installLobbyVisibilityLock } from "./modules/lobby_visibility_lock.js";

const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director";
const AUTOCAM = IN_IFRAME || params.has("autocam") || PREVIEW;
const AUDIO_DISABLED = true;

const $status = document.getElementById("status");
const $mode = document.getElementById("mode");
const $log = document.getElementById("log");
const $err = document.getElementById("err");
const $toggleLog = document.getElementById("toggleLog");
const $toggleJoints = document.getElementById("toggleJoints");
const $togglePosition = document.getElementById("togglePosition");
const $copyPosition = document.getElementById("copyPosition");
const $positionPanel = document.getElementById("positionPanel");
const $positionToast = document.getElementById("positionToast");
const $sceneButtons = Array.from(document.querySelectorAll("#sceneNav .scene-btn"));
let positionPanelVisible = params.has("pos") || params.has("debug") || params.has("place");
let lastPlacementLine = "";
let lastPositionSample = null;

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
  if (!$log) return;
  $log.textContent += line + "\n";
  $log.scrollTop = $log.scrollHeight;
}

function showToast(text = "Position copied"){
  if (!$positionToast) return;
  $positionToast.textContent = text;
  $positionToast.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>{ $positionToast.style.display = "none"; }, 1350);
}

async function copyCurrentPosition(){
  if (!lastPlacementLine) return;
  try {
    await navigator.clipboard.writeText(lastPlacementLine);
    showToast("Position copied");
  } catch {
    showToast("Read position line to me");
  }
}

$toggleLog?.addEventListener("click", ()=>{
  $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none";
});
$togglePosition?.addEventListener("click", ()=>{
  positionPanelVisible = !positionPanelVisible;
  if ($positionPanel) $positionPanel.style.display = positionPanelVisible ? "block" : "none";
});
$copyPosition?.addEventListener("click", copyCurrentPosition);

if (AUTOCAM) document.body.classList.add("preview-mode");
if ($positionPanel) $positionPanel.style.display = (positionPanelVisible && !AUTOCAM) ? "block" : "none";

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
setStatus("Loading world...", { force: true });
const world = await buildSkylineRoom(scene, { log, renderer });
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius, sceneTargets = {} } = world;
const lobbyVisibilityLock = installLobbyVisibilityLock({ scene });
const portalTargets = Array.isArray(lobbyVisibilityLock?.portals) ? lobbyVisibilityLock.portals : [];

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });

window.SVR_AUDIO_DISABLED = true;
let seated = false;
let seatIndex = -1;
let cash = 50000;
let currentSceneKey = "lobby";
let activePortal = null;
let lastPortalStatus = "";

function currentHeadXZ(){
  if (renderer.xr.isPresenting){
    const xrCam = renderer.xr.getCamera(camera);
    const p = new THREE.Vector3();
    xrCam.getWorldPosition(p);
    return p;
  }
  return camera.position.clone();
}
function cameraYawDeg(){
  const dir = new THREE.Vector3();
  const cam = renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera;
  cam.getWorldDirection(dir);
  return THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z));
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
  currentSceneKey = "seat";
  const seat = seats[best];
  if (renderer.xr.isPresenting) tp.setPlayerPose(seat.x, -0.42, seat.z);
  else moveDesktopToSeat(seat);
  setMode(`Seat: ${seat.label}`);
  return true;
}
function leaveTable(){
  seated = false;
  seatIndex = -1;
  currentSceneKey = "lobby";
  if (renderer.xr.isPresenting) tp.setPlayerPose(0, 0, 4.8);
  else { camera.position.set(0, 1.6, 4.8); camera.lookAt(0, 1.15, 0); }
  return true;
}
function movePlayerToSpot(target, lookTarget = null){
  if (!target) return;
  if (renderer.xr.isPresenting) tp.setPlayerPose(target.x, 0, target.z);
  else { camera.position.set(target.x, 1.6, target.z); if (lookTarget) camera.lookAt(lookTarget.x, 1.45, lookTarget.z); }
}
function gotoScene(key){
  const rec = sceneTargets?.[key];
  if (!rec?.pos) return false;
  currentSceneKey = key;
  movePlayerToSpot(rec.pos, rec.look || null);
  setStatus(`Quick jump: ${key}`, { force: true });
  return true;
}
function openRikiHologram(){
  setStatus("Reiki hologram is in the Reiki storefront audio zone.", { force: true });
  gotoScene("reiki");
  return true;
}
function findActivePortal(){
  const p = currentHeadXZ();
  let best = null;
  let bestDist = Infinity;
  for (const portal of portalTargets){
    if (!portal?.position) continue;
    const d = Math.hypot(p.x - portal.position.x, p.z - portal.position.z);
    if (d < 1.55 && d < bestDist){ best = portal; bestDist = d; }
  }
  return best ? { ...best, distance: bestDist } : null;
}
function activatePortal(){
  const portal = activePortal || findActivePortal();
  if (!portal){ setStatus("No portal in range. Walk onto a storefront glow.", { force: true }); return false; }
  if (portal.key === "reiki") lobbyVisibilityLock?.primeReikiAudio?.();
  if (portal.route){
    setStatus(`Opening ${portal.label}...`, { force: true });
    window.location.href = portal.route;
    return true;
  }
  const target = portal.target || portal.key;
  const ok = gotoScene(target);
  setStatus(ok ? `Portal activated: ${portal.label}` : `Portal target not ready: ${portal.label}`, { force: true });
  return ok;
}

$sceneButtons.forEach((btn)=>{
  btn.addEventListener("click", ()=>{
    const key = btn.dataset.scene;
    if (key) gotoScene(key);
  });
});

window.addEventListener("keydown", async (e)=>{
  if (renderer.xr.isPresenting || e.repeat) return;
  if (e.code === "KeyM") setStatus("Audio disabled globally; Reiki has low proximity audio.", { force: true });
  if (e.code === "KeyN") setStatus("Audio disabled globally; Reiki has low proximity audio.", { force: true });
  if (e.code === "KeyP") { positionPanelVisible = !positionPanelVisible; if ($positionPanel) $positionPanel.style.display = positionPanelVisible ? "block" : "none"; }
  if (e.code === "KeyC") copyCurrentPosition();
  if (e.code === "KeyE") activatePortal();
  if (e.code === "KeyJ") joinTable();
  if (e.code === "KeyL") leaveTable();
  if (e.code === "KeyT") tp.toggleMode();
  if (e.code === "Digit1") gotoScene("lobby");
  if (e.code === "Digit2") gotoScene("seat");
  if (e.code === "Digit3") gotoScene("reiki");
  if (e.code === "Digit4") gotoScene("reikiRoom");
  if (e.code === "Digit5") gotoScene("pga");
  if (e.code === "Digit6") gotoScene("legends");
  if (e.code === "Digit7") gotoScene("sponsor");
  if (e.code === "Digit8") gotoScene("scorpion");
});

const watch = createWristWatch({
  scene, camera, renderer,
  getState: ()=>({
    audioEnabled: false,
    trackTitle: activePortal ? `Portal: ${activePortal.label}` : "Audio off",
    audioDisabled: AUDIO_DISABLED,
    cash,
    seated,
    inTableZone: inTableZone(),
    seatLabel: seatLabel(),
    teleportEnabled: tp.isEnabled ? tp.isEnabled() : true
  }),
  actions: {
    toggleAudio: ()=>setStatus("Audio disabled globally; Reiki has low proximity audio.", { force: true }),
    nextTrack: activatePortal,
    openRikiHologram,
    joinTable,
    leaveTable,
    toggleTeleport: ()=>tp.toggleMode(),
    goLobby: ()=>gotoScene("lobby"),
    goTable: ()=>gotoScene("table"),
    goSeat: ()=>gotoScene("seat"),
    goReiki: ()=>gotoScene("reiki"),
    goPga: ()=>gotoScene("pga"),
    goLegend: ()=>gotoScene("legends"),
    goSponsor: ()=>gotoScene("sponsor"),
    goScorpion: ()=>gotoScene("scorpion"),
    goReikiRoom: ()=>gotoScene("reikiRoom")
  }
});

$toggleJoints?.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logo...", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);
setStatus(AUTOCAM ? "CAM 3 walkthrough ready" : "Ready. Walking position panel active. Press P / C. Press E near storefront.", { force: true });
setMode(AUTOCAM ? "CAM 3 hub walkthrough" : "Hands: waiting...");

function setHudVisible(visible){
  const hud = document.getElementById("hud");
  if (hud) hud.style.display = (visible && !AUTOCAM) ? "flex" : "none";
  if ($log) $log.style.display = "none";
  if ($err) $err.style.display = "none";
  if ($positionPanel) $positionPanel.style.display = (visible && positionPanelVisible && !AUTOCAM) ? "block" : "none";
}

if (AUTOCAM) setHudVisible(false);
if (renderer.xr.isPresenting) document.getElementById("sceneNav")?.style.setProperty("display","none");
renderer.xr.addEventListener("sessionstart", async ()=>{
  setHudVisible(false);
  document.getElementById("sceneNav")?.style.setProperty("display","none");
  await tp.onSessionStart();
});
renderer.xr.addEventListener("sessionend", ()=>{
  setHudVisible(true);
  const nav = document.getElementById("sceneNav");
  if (nav && !AUTOCAM) nav.style.display = "flex";
});

const fmt = (n)=>Number(n || 0).toFixed(2);
function updatePositionPanel(now){
  if (!$positionPanel || !positionPanelVisible || AUTOCAM) return;
  const p = currentHeadXZ();
  const yaw = cameraYawDeg();
  const portalNames = portalTargets.map(p=>p.label).join(", ") || "none";
  const reikiState = lobbyVisibilityLock?.getReikiAudioState?.() || null;
  const nearestPortal = activePortal || findActivePortal();
  const speed = lastPositionSample ? Math.hypot(p.x - lastPositionSample.x, p.z - lastPositionSample.z) / Math.max(0.001, (now - lastPositionSample.t) / 1000) : 0;
  lastPositionSample = { x: p.x, z: p.z, t: now };
  lastPlacementLine = `PLACE HERE: x ${fmt(p.x)} / y ${fmt(p.y)} / z ${fmt(p.z)} / yaw ${fmt(yaw)} / scene ${currentSceneKey}`;
  $positionPanel.innerHTML = `<strong>SVR WALKING DIAGNOSTIC PANEL</strong>\n` +
    `<span class="placementLine">${lastPlacementLine}</span>\n` +
    `Build: Camera Update / Phase 98R\n` +
    `Scene: ${currentSceneKey}\n` +
    `<span class="diagLine">Camera/player: x ${fmt(p.x)} / y ${fmt(p.y)} / z ${fmt(p.z)}</span>\n` +
    `Facing yaw: ${fmt(yaw)} deg\n` +
    `Move speed: ${fmt(speed)} units/sec\n` +
    `Table center: x ${fmt(tableCenter.x)} / z ${fmt(tableCenter.z)}\n` +
    `Seat: ${seatLabel()}\n` +
    `Table zone: ${inTableZone() ? "YES" : "NO"}\n` +
    `Nearest/active portal: ${nearestPortal ? `${nearestPortal.label} (${fmt(nearestPortal.distance || 0)}m)` : "none"}\n` +
    `Portal targets: ${portalNames}\n` +
    `Reiki video: ${reikiState?.videoOn ? "ON" : "WAIT"}\n` +
    `Reiki audio: ${reikiState ? (reikiState.near ? "NEAR" : "FAR") : "OFF"}\n` +
    `Reiki primed: ${reikiState?.primed ? "YES" : "NO"}\n` +
    `Reiki volume: ${fmt(reikiState?.volume || 0)} / ${fmt(reikiState?.maxVolume || 0)}\n` +
    `Teleport: ${tp.isEnabled ? (tp.isEnabled() ? "ON" : "OFF") : "READY"}\n` +
    `Audio: GLOBAL OFF / REIKI LOW ZONE\n\n` +
    `<button id="panelCopyBtn" type="button">Copy PLACE HERE line</button>\n` +
    `<span class="smallTip">Press P to show/hide • Press C to copy • Stand where you want an object, then send me the PLACE HERE line.</span>`;
  const btn = document.getElementById("panelCopyBtn");
  if (btn) btn.onclick = copyCurrentPosition;
}

let tPrev = performance.now();
const previewTarget = new THREE.Vector3(0, 1.25, 0);
const previewPos = new THREE.Vector3();
const previewLook = new THREE.Vector3();
const previewFrom = new THREE.Vector3();
const previewTo = new THREE.Vector3();
const previewLookFrom = new THREE.Vector3();
const previewLookTo = new THREE.Vector3();
const previewRoute = [
  { name:"Lobby opening hero", duration:6500, pos:[0,3.20,12.5], look:[0,1.25,0] },
  { name:"Poker table approach", duration:7000, pos:[-4.8,2.25,7.0], look:[0,1.10,0] },
  { name:"Table sweep", duration:7600, pos:[5.6,2.18,4.9], look:[0,1.05,0] },
  { name:"Reiki portal approach", duration:7200, pos:[-4.7,2.05,-6.7], look:[-5.6,1.8,-9.15] },
  { name:"Reiki glass room reveal", duration:8200, pos:[15.0,2.25,-2.4], look:[20.69,1.85,-5.40] },
  { name:"Reiki hologram close look", duration:9200, pos:[18.3,2.05,-2.25], look:[20.69,1.78,-5.40] },
  { name:"Reiki wide showroom", duration:7600, pos:[23.7,2.55,-1.8], look:[19.25,1.75,-4.90] },
  { name:"PGA hub", duration:6500, pos:[1.8,2.20,-5.7], look:[0,1.75,-9.25] },
  { name:"Smoker lounge hub", duration:6500, pos:[7.8,2.15,-5.9], look:[5.6,1.75,-9.15] },
  { name:"SVR store hub", duration:7000, pos:[-6.7,2.25,2.5], look:[-9.25,1.75,0.8] },
  { name:"Scorpion room portal", duration:7000, pos:[6.9,2.25,2.6], look:[9.25,1.75,0.8] },
  { name:"Final lobby skyline sweep", duration:8500, pos:[0,4.15,14.8], look:[0,1.45,0] }
];
const routeDuration = previewRoute.reduce((sum, shot)=>sum + shot.duration, 0);
function smoothStep01(v){
  const x = THREE.MathUtils.clamp(v, 0, 1);
  return x * x * (3 - 2 * x);
}
function updatePreviewCamera(now){
  let t = now % routeDuration;
  let index = 0;
  for (; index < previewRoute.length; index++){
    if (t <= previewRoute[index].duration) break;
    t -= previewRoute[index].duration;
  }
  const a = previewRoute[index % previewRoute.length];
  const b = previewRoute[(index + 1) % previewRoute.length];
  const k = smoothStep01(t / Math.max(1, a.duration));
  previewFrom.fromArray(a.pos);
  previewTo.fromArray(b.pos);
  previewLookFrom.fromArray(a.look);
  previewLookTo.fromArray(b.look);
  previewPos.lerpVectors(previewFrom, previewTo, k);
  previewLook.lerpVectors(previewLookFrom, previewLookTo, k);
  previewPos.y += Math.sin(now * 0.0012) * 0.045;
  previewLook.y += Math.sin(now * 0.0009 + 1.2) * 0.025;
  camera.position.lerp(previewPos, 0.065);
  previewTarget.lerp(previewLook, 0.10);
  camera.lookAt(previewTarget);
}

renderer.setAnimationLoop(()=>{
  const now = performance.now();
  const dt = Math.min((now - tPrev) / 1000, 0.033);
  tPrev = now;
  if (!renderer.xr.isPresenting){
    if (!AUTOCAM) desktop.update(dt);
    else updatePreviewCamera(now);
    scene.userData._camera = camera;
  } else scene.userData._camera = renderer.xr.getCamera(camera);
  if (scene.userData._tickWorld) scene.userData._tickWorld(dt);
  lobbyVisibilityLock?.update?.(now * 0.001, dt);
  activePortal = findActivePortal();
  if (activePortal){
    const msg = `Portal ready: ${activePortal.label} — press E`;
    if (msg !== lastPortalStatus){ setStatus(msg, { force: true }); lastPortalStatus = msg; }
  } else lastPortalStatus = "";
  hands.update(dt);
  hands.updateDebug();
  const leftHand = hands.getLeftHand();
  const rightHand = hands.getRightHand();
  const leftController = hands.getLeftController();
  const rightController = hands.getRightController();
  if (!AUTOCAM || renderer.xr.isPresenting) tp.update({ dt, leftHand, rightHand, leftController, rightController, statusCb: (text)=>{ setStatus(text); }, modeCb: (text)=>{ setMode(text); } });
  if (watch) watch.update(dt, leftHand, rightHand);
  updatePositionPanel(now);
  renderer.render(scene, camera);
});

const canvasEl = renderer.domElement;
canvasEl.addEventListener("pointerdown", async ()=>{
  lobbyVisibilityLock?.primeReikiAudio?.();
  setStatus("Reiki audio primed. Walk near Reiki storefront for low audio.", { force: true });
}, { passive: true });
canvasEl.addEventListener("webglcontextlost", (e)=>{
  e.preventDefault();
  log("[ERR] WebGL context lost. Reloading...");
  setStatus("WebGL context lost (reloading...)", { force: true });
  setTimeout(()=>location.reload(), 500);
}, false);
