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
  getState: () => ({
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
    toggleAudio: () => setStatus("Audio disabled globally; Reiki has low proximity audio.", { force: true }),
    nextTrack: activatePortal,
    openRikiHologram,
    joinTable,
    leaveTable,
    toggleTeleport: () => tp.toggleMode(),
    goLobby: () => gotoScene("lobby"),
    goTable: () => gotoScene("table"),
    goSeat: () => gotoScene("seat"),
    goReiki: () => gotoScene("reiki"),
    goPga: () => gotoScene("pga"),
    goLegend: () => gotoScene("legends"),
    goSponsor: () => gotoScene("sponsor"),
    goScorpion: () => gotoScene("scorpion"),
    goReikiRoom: () => gotoScene("reikiRoom")
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
if (renderer.xr.isPresenting) document.getElementById("sceneNav")?.style.setProperty("display", "none");
renderer.xr.addEventListener("sessionstart", async ()=>{
  setHudVisible(false);
  document.getElementById("sceneNav")?.style.setProperty("display", "none");
  await tp.onSessionStart();
});
renderer.xr.addEventListener("sessionend", ()=>{
  setHudVisible(true);
  const nav = document.getElementById("sceneNav");
  if (nav) nav.style.display = "flex";
});

const clock = new THREE.Clock();
let previewAngle = -0.85;
let lastSnapAt = 0;
let desktopSnapWarned = false;

function updateDesktopSnap(dt){
  if (!desktop || seated) return;
  let input = {};
  try {
    input = desktop.update?.(dt, roomClamp) || {};
  } catch (err) {
    if (!desktopSnapWarned) {
      desktopSnapWarned = true;
      console.warn("SVR desktop controls update skipped", err);
      setStatus("Desktop controls recovered from input warning.", { force: true });
    }
    return;
  }
  if (input.snapLeft || input.snapRight){
    const now = performance.now();
    if (now - lastSnapAt > 180){
      const yaw = (input.snapLeft ? 45 : -45) * Math.PI / 180;
      camera.rotation.y += yaw;
      lastSnapAt = now;
    }
  }
}

function updatePreviewCam(t){
  previewAngle += 0.010;
  const radius = THREE.MathUtils.clamp(previewOrbitRadius || 17.5, 8, 20);
  const y = THREE.MathUtils.clamp(2.25 + Math.sin(t * 0.38) * 0.25, 1.65, 3.2);
  const x = Math.cos(previewAngle) * radius;
  const z = Math.sin(previewAngle) * radius;
  camera.position.set(x, y, z);
  camera.lookAt(0, 1.18, 0);
}

function updatePositionPanel(){
  if (!$positionPanel || !positionPanelVisible || AUTOCAM) return;
  const p = currentHeadXZ();
  const yaw = cameraYawDeg();
  lastPositionSample = { x: p.x, y: p.y, z: p.z, yaw };
  const sceneKey = currentSceneKey || "lobby";
  const placement = `PLACEMENT ${sceneKey}: x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)}, z=${p.z.toFixed(2)}, yaw=${yaw.toFixed(1)}deg`;
  lastPlacementLine = placement;
  const active = activePortal ? `${activePortal.label} (${activePortal.distance.toFixed(2)}m)` : "none";
  $positionPanel.innerHTML = `<strong>SVR WALKING DIAGNOSTIC PANEL</strong>\n<span class="placementLine">${placement}</span>\n<span class="diagLine">scene: ${sceneKey}</span>\n<span class="diagLine">seat: ${seatLabel()}</span>\n<span class="diagLine">portal: ${active}</span>\n<span class="smallTip">P toggles this panel. C copies the placement line. E activates a nearby storefront portal.</span>`;
}

function updatePortals(){
  activePortal = findActivePortal();
  const text = activePortal ? `Portal ready: ${activePortal.label} — press E / watch action` : "Walk onto a storefront glow. Press E to enter.";
  if (!AUTOCAM && text !== lastPortalStatus){
    lastPortalStatus = text;
    setStatus(text);
  }
}

renderer.setAnimationLoop(()=>{
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  if (AUTOCAM) updatePreviewCam(t);
  updateDesktopSnap(dt);
  updatePortals();
  updatePositionPanel();
  hands.update(dt, t);
  tp.update(dt, t, hands);
  watch.update(dt, t, hands);
  world.update?.(dt, t);
  renderer.render(scene, camera);
});
