import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createAudioPlaylist } from "./modules/audio.js";
import { createWristWatch } from "./modules/watch.js";
import { createAndroidControls } from "./modules/android_controls.js";

const BUILD = "LOBBY-ORG-1-2-CAM3-LIVE-PREVIEW-ROUTE";
const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director" || params.get("cam") === "cam3" || params.get("cam") === "preview";
const AUTOCAM = IN_IFRAME || params.has("autocam") || PREVIEW;

const $status = document.getElementById("status");
const $mode = document.getElementById("mode");
const $log = document.getElementById("log");
const $err = document.getElementById("err");
const $toggleLog = document.getElementById("toggleLog");
const $toggleJoints = document.getElementById("toggleJoints");
const $sceneButtons = Array.from(document.querySelectorAll("#sceneNav .scene-btn"));
const $splashStep = document.getElementById("splashStep");
const $splashFill = document.getElementById("splashFill");
const $splashHint = document.getElementById("splashHint");

let lastStatusText = "";
let lastStatusAt = 0;
let splashProgress = 4;
function setSplash(text, pct = splashProgress, hint = null) {
  splashProgress = Math.max(splashProgress, Math.min(100, pct));
  if ($splashStep) $splashStep.textContent = text;
  if ($splashFill) $splashFill.style.width = `${splashProgress}%`;
  if (hint && $splashHint) $splashHint.textContent = hint;
}
function hideSplash(reason = "ready") {
  setSplash("Lobby ready", 100, "You can enter VR now. Extra showroom modules continue safely in the background.");
  window.SVR_SPLASH_READY_REASON = reason;
  setTimeout(() => document.body.classList.add("svr-ready"), 180);
}
function setStatus(text, { force = false, minGap = 180 } = {}) {
  if (!$status) return;
  const now = performance.now();
  if (!force && text === lastStatusText) return;
  if (!force && lastStatusText && now - lastStatusAt < minGap) return;
  lastStatusText = text;
  lastStatusAt = now;
  $status.textContent = text;
  if (!document.body.classList.contains("svr-ready")) setSplash(text, splashProgress + 2);
}
function setMode(text) { if ($mode) $mode.textContent = text; }
function log(...args) {
  const line = args.map(a => typeof a === "string" ? a : JSON.stringify(a, null, 2)).join(" ");
  console.log("[SVR]", ...args);
  if ($log) { $log.textContent += line + "\n"; $log.scrollTop = $log.scrollHeight; }
}
async function safeImport(label, path, fn, pct = null) {
  try {
    if (pct !== null) setSplash(`Loading ${label}...`, pct);
    const mod = await import(path);
    await fn(mod);
    log(`${label}: loaded`);
    if (pct !== null) setSplash(`${label} loaded`, pct + 4);
    return true;
  } catch (err) {
    const message = err?.stack || err?.message || String(err);
    log(`${label}: failed safely`, message);
    window[`SVR_${label.replace(/\W+/g, "_").toUpperCase()}_ERROR`] = message;
    if (pct !== null) setSplash(`${label} skipped safely`, pct + 3);
    return false;
  }
}
function idle(fn, delay = 120) { if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 1600 }); else setTimeout(fn, delay); }

setSplash("Preparing splash screen...", 8);
$toggleLog?.addEventListener("click", () => { $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none"; });
if (AUTOCAM) document.body.classList.add("preview-mode");

setSplash("Starting WebXR renderer...", 14);
const { scene, camera, renderer } = createCore({ containerId: "app" });
scene.userData._camera = camera;
window.SVR_CAMERA = camera;
camera.position.set(0, 1.6, 4.8);
camera.lookAt(0, 1.15, 0);
setSplash("Renderer ready", 23);

window.addEventListener("error", e => {
  if (!renderer.xr.isPresenting && $err) $err.style.display = "block";
  if ($err) $err.textContent = "RUNTIME ERROR:\n" + (e?.error?.stack || e?.message || String(e));
  log("Runtime error", e?.error?.stack || e?.message || String(e));
  if (!document.body.classList.contains("svr-ready")) setSplash("Error caught — safe boot screen active", 100, "Open Logs for details. The loader prevented a blank boot screen.");
});
window.addEventListener("unhandledrejection", e => {
  if (!renderer.xr.isPresenting && $err) $err.style.display = "block";
  if ($err) $err.textContent = "UNHANDLED PROMISE REJECTION:\n" + (e?.reason?.stack || e?.reason || String(e));
  log("Unhandled rejection", e?.reason?.stack || e?.reason || String(e));
  if (!document.body.classList.contains("svr-ready")) setSplash("Promise error caught — safe boot screen active", 100, "Open Logs for details. The loader prevented a blank boot screen.");
});

const desktop = AUTOCAM ? null : createDesktopControls({ camera, domElement: renderer.domElement });
setStatus("Loading core world...", { force: true });
setSplash("Building lobby shell...", 32);
const world = await buildSkylineRoom(scene, { log, renderer });
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius, sceneTargets = {} } = world;
setSplash("Lobby shell ready", 52);

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });
const audio = createAudioPlaylist({
  tracks: [{ title: "Lobby 07", url: "./assets/audio/07.mp3" }],
  onState: state => {
    if (!$status || renderer.xr.isPresenting) return;
    if (state.error) { setStatus(`Audio: ${state.error}`); return; }
    if (state.enabled) { setStatus(`Now Playing: ${state.trackTitle}`); return; }
    setStatus(state.primed ? `Music Ready: ${state.trackTitle}` : "Audio Locked: tap once to unlock");
  }
});
setSplash("Input systems ready", 60);

let seated = false;
let seatIndex = -1;
let cash = 50000;
function currentHeadXZ() { if (renderer.xr.isPresenting) { const xrCam = renderer.xr.getCamera(camera); const p = new THREE.Vector3(); xrCam.getWorldPosition(p); return p; } return camera.position.clone(); }
function inTableZone() { const p = currentHeadXZ(); return new THREE.Vector2(p.x - tableCenter.x, p.z - tableCenter.z).length() <= (joinRadius + 0.7); }
function seatLabel() { return seatIndex >= 0 ? seats[seatIndex]?.label || `Seat ${seatIndex + 1}` : "Standing"; }
function moveDesktopToSeat(seat) { camera.position.set(seat.x, 1.12, seat.z); camera.lookAt(0, 1.0, 0); }
function joinTable() {
  if (!inTableZone()) return false;
  const p = currentHeadXZ(); let best = 0, bestDist = Infinity;
  seats.forEach((seat, idx) => { if (seat.label === "Dealer Side") return; const d = Math.hypot(p.x - seat.x, p.z - seat.z); if (d < bestDist) { bestDist = d; best = idx; } });
  seatIndex = best; seated = true; const seat = seats[best];
  if (renderer.xr.isPresenting) tp.setPlayerPose(seat.x, -0.42, seat.z); else moveDesktopToSeat(seat);
  setMode(`Seat: ${seat.label}`); return true;
}
function leaveTable() { seated = false; seatIndex = -1; if (renderer.xr.isPresenting) tp.setPlayerPose(0, 0, 4.8); else { camera.position.set(0, 1.6, 4.8); camera.lookAt(0, 1.15, 0); } return true; }
function movePlayerToSpot(target, lookTarget = null) { if (!target) return; if (renderer.xr.isPresenting) tp.setPlayerPose(target.x, 0, target.z); else { camera.position.set(target.x, 1.6, target.z); if (lookTarget) camera.lookAt(lookTarget.x, 1.45, lookTarget.z); } }
function gotoScene(key) { const rec = sceneTargets?.[key]; if (rec?.href) { window.location.href = rec.href; return true; } if (!rec?.pos) return false; movePlayerToSpot(rec.pos, rec.look || null); setStatus(`Quick jump: ${key}`, { force: true }); return true; }

const androidControls = createAndroidControls({ camera, renderer, gotoScene, joinTable, leaveTable, setStatus });
$sceneButtons.forEach(btn => btn.addEventListener("click", () => { const key = btn.dataset.scene; if (key) gotoScene(key); }));
window.addEventListener("keydown", async e => {
  if (renderer.xr.isPresenting || e.repeat) return;
  if (e.code === "KeyM") await audio.toggle(); if (e.code === "KeyN") await audio.next(); if (e.code === "KeyJ") joinTable(); if (e.code === "KeyL") leaveTable(); if (e.code === "KeyT") tp.toggleMode();
  if (e.code === "Digit1") gotoScene("lobby"); if (e.code === "Digit2") gotoScene("table"); if (e.code === "Digit3") gotoScene("seat"); if (e.code === "Digit4") gotoScene("reiki"); if (e.code === "Digit5") gotoScene("pga"); if (e.code === "Digit6") gotoScene("legends"); if (e.code === "Digit7") gotoScene("sponsor"); if (e.code === "Digit8") gotoScene("scorpion"); if (e.code === "Digit9") gotoScene("reikiRoom"); if (e.code === "Digit0") gotoScene("pgaDrive"); if (e.code === "Minus") gotoScene("chipPutt"); if (e.code === "Equal") gotoScene("vrStore");
});

const watch = createWristWatch({
  scene, camera, renderer,
  getState: () => ({ audioEnabled: audio.getState().enabled, trackTitle: audio.getState().trackTitle || "Lobby 07", cash, seated, inTableZone: inTableZone(), seatLabel: seatLabel(), teleportEnabled: tp.isEnabled ? tp.isEnabled() : true }),
  actions: { toggleAudio: () => audio.toggle(), nextTrack: () => audio.next(), joinTable, leaveTable, toggleTeleport: () => tp.toggleMode(), goLobby: () => gotoScene("lobby"), goTable: () => gotoScene("table"), goSeat: () => gotoScene("seat"), goReiki: () => gotoScene("reiki"), goPga: () => gotoScene("pga"), goLegend: () => gotoScene("legends"), goSponsor: () => gotoScene("sponsor"), goScorpion: () => gotoScene("scorpion"), goReikiRoom: () => gotoScene("reikiRoom"), goPgaDrive: () => gotoScene("pgaDrive"), goChipPutt: () => gotoScene("chipPutt"), goVrStore: () => gotoScene("vrStore") }
});
$toggleJoints?.addEventListener("click", () => { const on = hands.toggleDebug(); $toggleJoints.textContent = on ? "Joints On" : "Joints"; });

setStatus("Loading logo...", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);
setMode(AUTOCAM ? "CAM 3 live preview" : "Hands: waiting...");
window.SVR_RICI_UPDATE_101_SAFE_BOOT = { build: BUILD };
setStatus("Ready. Core lobby loaded. Showroom modules staging...", { force: true });
setSplash("Core lobby ready", 76, "You can enter while extra skyline and sponsor modules finish loading.");

function loadShowroomModules() {
  safeImport("Phase 121 Sky", "./modules/phase121_sky_fix.js", m => m.applyPhase121SkyFix?.(scene, { log }), 78)
    .then(() => safeImport("Phase 121 OBJ Skyline", "./modules/obj_skyline_loader.js", m => m.applyObjSkylineBackground?.(scene, { log }), 82))
    .then(() => safeImport("Update 3 Portals", "./modules/update_3_0_present_moment.js", m => m.applyUpdate30PresentMoment?.({ scene, camera, renderer, world, sceneTargets, setStatus, log, gotoScene }), 86))
    .then(() => safeImport("Controller Pointer Bridge 1.2", "./modules/controller_pointer_bridge_1_2.js", m => m.applyControllerPointerBridge12?.(scene, { log }), 89))
    .then(() => safeImport("RICI Update 101 Reiki 1.1 Mother Module", "./modules/reiki_update_101_1_1_mother_module.js", m => m.applyRiciUpdate101MotherModule?.(scene, { log, gotoScene, camera, renderer }), 92))
    .then(() => safeImport("RICI Photo Controls Fix", "./modules/reiki_update_101_1_1_photo_controls_fix.js", m => m.applyRiciUpdate101PhotoControlsFix?.(scene, { log }), 95))
    .then(() => safeImport("Coffee Phase113", "./modules/coffee_stand_phase112.js", m => m.applyPhase112CoffeeStandMove?.(scene, { log }), 97))
    .then(() => { setStatus("Ready. Lobby Organization 1.2 fully loaded.", { force: true }); hideSplash("all-modules-loaded"); })
    .catch(() => hideSplash("module-chain-safe-fallback"));
}
setTimeout(() => hideSplash("core-lobby-ready"), 1100);
idle(loadShowroomModules, 180);

function setHudVisible(visible) { const hud = document.getElementById("hud"); if (hud) hud.style.display = (visible && !AUTOCAM) ? "flex" : "none"; if ($log) $log.style.display = "none"; if ($err) $err.style.display = "none"; }
if (AUTOCAM) setHudVisible(false);
if (renderer.xr.isPresenting) document.getElementById("sceneNav")?.style.setProperty("display", "none");
renderer.xr.addEventListener("sessionstart", async () => { document.body.classList.add("svr-ready"); setHudVisible(false); document.getElementById("sceneNav")?.style.setProperty("display", "none"); await audio.prime(); await audio.start(); await tp.onSessionStart(); });
renderer.xr.addEventListener("sessionend", () => { setHudVisible(true); const nav = document.getElementById("sceneNav"); if (nav && !AUTOCAM) nav.style.display = "flex"; });

let tPrev = performance.now();
const previewTarget = new THREE.Vector3(0, 1.25, 0);
const previewPos = new THREE.Vector3();
const camA = new THREE.Vector3();
const camB = new THREE.Vector3();
const lookA = new THREE.Vector3();
const lookB = new THREE.Vector3();
function v(x, y, z) { return new THREE.Vector3(x, y, z); }
function eased(x) { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); }
const cam3Route = [
  { label: "Poker table hero", dur: 4.0, pos: v(0.0, 4.4, 13.5), look: v(0.0, 1.05, 0.0) },
  { label: "Seated gameplay pass", dur: 3.8, pos: v(7.7, 2.15, 6.4), look: v(0.0, 1.02, 0.0) },
  { label: "Reiki storefront", dur: 4.2, pos: v(15.2, 2.6, 4.0), look: v(10.4, 1.65, -0.3) },
  { label: "Portal directory", dur: 3.6, pos: v(-13.2, 2.7, 8.7), look: v(-18.3, 2.5, 0.2) },
  { label: "PGA and sponsor wall", dur: 3.8, pos: v(-9.4, 2.7, -13.8), look: v(-17.0, 2.6, -17.0) },
  { label: "Coffee and store corner", dur: 3.5, pos: v(10.8, 2.35, -11.8), look: v(15.8, 1.45, -16.4) },
  { label: "Skyline ads and moon", dur: 4.2, pos: v(0.0, 8.5, 18.0), look: v(-36.0, 68.0, -150.0) },
  { label: "Full lobby overview", dur: 4.2, pos: v(-11.5, 5.25, 13.2), look: v(0.0, 1.45, -2.4) }
];
const routeTotal = cam3Route.reduce((sum, shot) => sum + shot.dur, 0);
function updateCam3(now) {
  const t = (now * 0.001) % routeTotal;
  let acc = 0;
  let index = 0;
  for (let i = 0; i < cam3Route.length; i++) {
    if (t <= acc + cam3Route[i].dur) { index = i; break; }
    acc += cam3Route[i].dur;
  }
  const shot = cam3Route[index];
  const next = cam3Route[(index + 1) % cam3Route.length];
  const k = eased((t - acc) / shot.dur);
  camA.copy(shot.pos);
  camB.copy(next.pos);
  lookA.copy(shot.look);
  lookB.copy(next.look);
  previewPos.lerpVectors(camA, camB, k);
  previewTarget.lerpVectors(lookA, lookB, k);
  previewPos.y += Math.sin(now * 0.00075 + index) * 0.10;
  previewTarget.y += Math.sin(now * 0.00055 + index) * 0.04;
  camera.position.lerp(previewPos, 0.085);
  camera.lookAt(previewTarget);
  if (window.SVR_CAM3_LIVE_PREVIEW?.shot !== shot.label) window.SVR_CAM3_LIVE_PREVIEW = { build: BUILD, shot: shot.label, index: index + 1, total: cam3Route.length, loopSeconds: Math.round(routeTotal) };
}
window.SVR_CAM3_LIVE_PREVIEW = { build: BUILD, route: "short showroom loop", shots: cam3Route.map(s => s.label), loopSeconds: Math.round(routeTotal) };

renderer.setAnimationLoop(() => {
  const now = performance.now(); const dt = Math.min((now - tPrev) / 1000, 0.033); tPrev = now;
  if (!renderer.xr.isPresenting) { if (!AUTOCAM) desktop?.update(dt); else updateCam3(now); androidControls.update(dt); scene.userData._camera = camera; }
  else scene.userData._camera = renderer.xr.getCamera(camera);
  if (scene.userData._tickWorld) scene.userData._tickWorld(dt);
  hands.update(dt); hands.updateDebug();
  const leftHand = hands.getLeftHand(); const rightHand = hands.getRightHand(); const leftController = hands.getLeftController(); const rightController = hands.getRightController();
  if (!AUTOCAM || renderer.xr.isPresenting) tp.update({ dt, leftHand, rightHand, leftController, rightController, statusCb: text => setStatus(text), modeCb: text => setMode(text) });
  if (watch) watch.update(dt, leftHand, rightHand);
  renderer.render(scene, camera);
});
const canvasEl = renderer.domElement;
canvasEl.addEventListener("pointerdown", async () => { document.body.classList.add("svr-ready"); const st = audio.getState(); if (!st.enabled) await audio.start(); }, { passive: true });
canvasEl.addEventListener("webglcontextlost", e => { e.preventDefault(); log("[ERR] WebGL context lost. Reloading..."); setStatus("WebGL context lost (reloading...)", { force: true }); setTimeout(() => location.reload(), 500); }, false);
