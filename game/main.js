import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createAudioPlaylist } from "./modules/audio.js";
import { createWristWatch } from "./modules/watch.js";
import { CONFIG } from "./modules/config.js";
import { createViewPerformanceManager } from "./modules/view_performance_manager.js";
import { buildStableLobby } from "./modules/lobby_stable_refine.js";

const PHASE_BUILD = "PHASE-133-STABLE-LOBBY-REFINE-REBASE-LOCK";
const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director";
const AUTOCAM = IN_IFRAME || params.has("autocam") || PREVIEW;

window.SVR_BUILD_PHASE = PHASE_BUILD;
window.SVR_CURRENT_GAME_PHASE = PHASE_BUILD;
window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
document.documentElement.dataset.svrBuild = PHASE_BUILD;

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
function setMode(text){ if (!$mode || text === lastModeText) return; lastModeText = text; $mode.textContent = text; }
function log(...args){
  const line = args.map(a => typeof a === "string" ? a : JSON.stringify(a, null, 2)).join(" ");
  if ($log){ $log.textContent += line + "\n"; $log.scrollTop = $log.scrollHeight; }
}

$toggleLog?.addEventListener("click", ()=>{ $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none"; });
if (AUTOCAM) document.body.classList.add("preview-mode");

const { scene, camera, renderer } = createCore({ containerId: "app" });
scene.userData._camera = camera;
const worldRoot = new THREE.Group();
worldRoot.name = "SVR_WORLD_ROOT_PHASE133_STABLE";
scene.add(worldRoot);
window.SVR_WORLD_ROOT = worldRoot;

function forceSafeDesktopSpawn(){
  if (renderer?.xr?.isPresenting) return;
  camera.position.set(CONFIG.SPAWN_X, 1.6, CONFIG.SPAWN_Z);
  camera.lookAt(0, 1.32, -8);
  camera.updateProjectionMatrix?.();
}
forceSafeDesktopSpawn();

window.addEventListener("error", (e)=>{ if (!renderer.xr.isPresenting && $err) $err.style.display = "block"; if ($err) $err.textContent = "RUNTIME ERROR:\n" + (e?.error?.stack || e?.message || String(e)); });
window.addEventListener("unhandledrejection", (e)=>{ if (!renderer.xr.isPresenting && $err) $err.style.display = "block"; if ($err) $err.textContent = "UNHANDLED PROMISE REJECTION:\n" + (e?.reason?.stack || e?.reason || String(e)); });

const desktop = AUTOCAM ? null : createDesktopControls({ camera, domElement: renderer.domElement });
const perf = createViewPerformanceManager({ renderer, scene, camera, worldRoot, statusCb: (text)=>setStatus(text, { force:true }) });
setStatus("Loading stable lobby…", { force: true });
const world = buildStableLobby(worldRoot, { renderer, log });
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius, sceneTargets = {} } = world;
forceSafeDesktopSpawn();
window.SVR_SCENE_TARGETS = sceneTargets;

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, worldRoot, log });
const audio = createAudioPlaylist({
  tracks: [
    { title: "Lobby 07", url: "./assets/audio/07.mp3" },
    { title: "Reiki Time Hub", url: "./assets/audio/reiki_time_hub.mp3" },
    { title: "SVR After Dark", url: "./assets/audio/svr_after_dark.mp3" }
  ],
  onState: (state)=>{
    if (!$status || renderer.xr.isPresenting) return;
    if (state.error){ setStatus(`Audio: ${state.error}`); return; }
    if (state.enabled){ setStatus(`Now Playing: ${state.trackTitle}`); return; }
    setStatus(state.primed ? `Music Ready: ${state.trackTitle}` : `Audio Locked: tap once to unlock`);
  }
});

let seated = false;
let seatIndex = -1;
let cash = 50000;

function currentHeadXZ(){ return renderer.xr.isPresenting ? new THREE.Vector3(tp.getPlayerPose().x, 0, tp.getPlayerPose().z) : camera.position.clone(); }
function inTableZone(){ const p = currentHeadXZ(); return new THREE.Vector2(p.x - tableCenter.x, p.z - tableCenter.z).length() <= (joinRadius + 0.7); }
function seatLabel(){ return seatIndex >= 0 ? seats[seatIndex]?.label || `Seat ${seatIndex + 1}` : "Standing"; }
function moveDesktopToSeat(seat){ camera.position.set(seat.x, 1.12, seat.z); camera.lookAt(0, 1.0, 0); }
function joinTable(){
  if (!inTableZone()) return false;
  const p = currentHeadXZ();
  let best = 3;
  let bestDist = Infinity;
  seats.forEach((seat, idx)=>{
    if (seat.label === "Dealer Side") return;
    const d = Math.hypot(p.x - seat.x, p.z - seat.z);
    if (d < bestDist){ bestDist = d; best = idx; }
  });
  seatIndex = best;
  seated = true;
  const seat = seats[best];
  if (renderer.xr.isPresenting) tp.setPlayerPose(seat.x, -0.42, seat.z);
  else moveDesktopToSeat(seat);
  setMode(`Seat: ${seat.label}`);
  return true;
}
function leaveTable(){
  seated = false;
  seatIndex = -1;
  if (renderer.xr.isPresenting) tp.setPlayerPose(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
  else forceSafeDesktopSpawn();
  return true;
}
function movePlayerToSpot(target, lookTarget = null){
  if (!target) return;
  if (renderer.xr.isPresenting) tp.setPlayerPose(target.x, 0, target.z);
  else { camera.position.set(target.x, 1.6, target.z); if (lookTarget) camera.lookAt(lookTarget.x, 1.45, lookTarget.z); }
}
function gotoScene(key){
  const rec = sceneTargets?.[key];
  if (!rec?.pos){ setStatus(`Route unavailable: ${key}`, { force:true }); return false; }
  movePlayerToSpot(rec.pos, rec.look || null);
  setStatus(`Quick jump: ${key}`, { force: true });
  return true;
}

$sceneButtons.forEach((btn)=>btn.addEventListener("click", ()=>{ const key = btn.dataset.scene; if (key) gotoScene(key); }));
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
  if (e.code === "Digit9") gotoScene("reikiRoom");
  if (e.code === "Digit0") gotoScene("pgaDrive");
  if (e.code === "KeyK") gotoScene("chipPutt");
  if (e.code === "KeyO") gotoScene("storeRoom");
  if (e.code === "KeyB") gotoScene("smokerLounge");
});

const watch = createWristWatch({
  scene, camera, renderer,
  getState: ()=>({ audioEnabled: audio.getState().enabled, trackTitle: audio.getState().trackTitle || "Lobby 07", cash, seated, inTableZone: inTableZone(), seatLabel: seatLabel(), teleportEnabled: tp.isEnabled ? tp.isEnabled() : true }),
  actions: { toggleAudio: ()=>audio.toggle(), nextTrack: ()=>audio.next(), joinTable, leaveTable, toggleTeleport: ()=>tp.toggleMode(), goLobby: ()=>gotoScene("lobby"), goTable: ()=>gotoScene("table"), goSeat: ()=>gotoScene("seat"), goReiki: ()=>gotoScene("reiki"), goPga: ()=>gotoScene("pga"), goLegend: ()=>gotoScene("legends"), goSponsor: ()=>gotoScene("sponsor"), goScorpion: ()=>gotoScene("scorpion"), goReikiRoom: ()=>gotoScene("reikiRoom"), goPgaDrive: ()=>gotoScene("pgaDrive"), goChipPutt: ()=>gotoScene("chipPutt"), goStoreRoom: ()=>gotoScene("storeRoom"), goSmokerLounge: ()=>gotoScene("smokerLounge") }
});

$toggleJoints?.addEventListener("click", ()=>{ const on = hands.toggleDebug(); $toggleJoints.textContent = on ? "Joints On" : "Joints"; });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);
setStatus(AUTOCAM ? "Live preview ready" : "Ready. Phase 133 stable refined lobby active.", { force: true });
setMode(AUTOCAM ? "CAM 3 director" : "Hands/controllers ready");

function setHudVisible(visible){
  const hud = document.getElementById("hud");
  if (hud) hud.style.display = (visible && !AUTOCAM) ? "flex" : "none";
  if ($log) $log.style.display = "none";
  if ($err) $err.style.display = "none";
}
if (AUTOCAM) setHudVisible(false);
if (renderer.xr.isPresenting) document.getElementById("sceneNav")?.style.setProperty("display","none");
renderer.xr.addEventListener("sessionstart", async ()=>{ setHudVisible(false); document.getElementById("sceneNav")?.style.setProperty("display","none"); await audio.prime(); await audio.start(); await tp.onSessionStart(); });
renderer.xr.addEventListener("sessionend", ()=>{ tp.onSessionEnd?.(); setHudVisible(true); const nav = document.getElementById("sceneNav"); if (nav && !AUTOCAM) nav.style.display = "flex"; forceSafeDesktopSpawn(); });

let tPrev = performance.now();
const previewTarget = new THREE.Vector3(0, 1.25, 0);
const previewPos = new THREE.Vector3();
renderer.setAnimationLoop(()=>{
  const now = performance.now();
  const dt = Math.min((now - tPrev) / 1000, 0.033);
  tPrev = now;
  perf.update(dt);
  world.update?.(dt);
  if (!renderer.xr.isPresenting){
    if (!AUTOCAM) desktop.update(dt);
    else {
      const orbitT = now * 0.000035;
      previewPos.set(Math.cos(orbitT)*18, 1.72, Math.sin(orbitT)*18);
      previewTarget.set(0,1.16,0);
      camera.position.lerp(previewPos, 0.055);
      camera.lookAt(previewTarget);
    }
    scene.userData._camera = camera;
  } else scene.userData._camera = renderer.xr.getCamera(camera);
  hands.update(dt);
  hands.updateDebug();
  const leftHand = hands.getLeftHand();
  const rightHand = hands.getRightHand();
  const leftController = hands.getLeftController();
  const rightController = hands.getRightController();
  if (!AUTOCAM || renderer.xr.isPresenting) tp.update({ dt, leftHand, rightHand, leftController, rightController, statusCb: (text)=>setStatus(text), modeCb: (text)=>setMode(text) });
  if (watch) watch.update(dt, leftHand, rightHand);
  renderer.render(scene, camera);
});

renderer.domElement.addEventListener("pointerdown", async ()=>{ const st = audio.getState(); if (!st.enabled) await audio.start(); }, { passive: true });
renderer.domElement.addEventListener("webglcontextlost", (e)=>{ e.preventDefault(); log("[ERR] WebGL context lost. Reloading…"); setStatus("WebGL context lost (reloading…)", { force: true }); setTimeout(()=>location.reload(), 500); }, false);
