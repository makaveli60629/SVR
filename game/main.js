import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands_phase228.js";
import { createTeleportRig } from "./modules/movement_phase228.js?v=phase169-locomotion-polish";
import { buildPhase195CleanLobbyWorld } from "./modules/phase195_clean_lobby_world.js";
import { installPhase201HubContentRestore } from "./modules/phase201_hub_content_restore.js";
import { installPhase202StorefrontShells } from "./modules/phase202_storefront_shells.js";
import { installPhase262GeometrySkyAlignmentLock } from "./modules/phase262_geometry_sky_alignment_lock.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createWristWatch } from "./modules/watch.js?v=phase99-clean-lobby-watch";
import { createPhase148QuestPerfPass } from "./modules/performance_phase148.js";
import { createAndroidSmartControls } from "./modules/android_smart_controls.js";
import { installPhase149LobbyFitAlignmentLock } from "./phase149_lobby_fit_alignment_lock.js";

const BUILD_LABEL = "PHASE-169-UNIFIED-LOCOMOTION-TELEPORT-POLISH-LOCK";
const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director";
const AUTOCAM = IN_IFRAME || params.has("autocam") || PREVIEW;
const ANDROID_SMART = /Android/i.test(navigator.userAgent || "") && !params.has("desktop") && !AUTOCAM;

window.SVR_DISABLE_LEGACY_SKYLINE = true;
window.SVR_REFINED_LOBBY_GEOMETRY = true;
window.SVR_BACKGROUND_BUILDINGS_REMOVED = true;
window.SVR_LOCKED_FINAL_BUILD = BUILD_LABEL;
window.SVR_NO_FACE_OVERLAY = true;
window.SVR_PHASE106 = { build: BUILD_LABEL, source: "Phase 149: lobby fit alignment lock, safe Android movement, corrected doorway geometry." };
window.SVR_PHASE228_MAIN_IMPORT_LOCK = { build: BUILD_LABEL, handsModule: "hands_phase228.js", movementModule: "movement_phase228.js?v=phase169-locomotion-polish", checkedAt: new Date().toISOString() };
window.SVR_PHASE169_LOCOMOTION_MAIN_IMPORT_LOCK = { build: BUILD_LABEL, unifiedHandsAndControllers: true, yAxisSafetyGuard: true, siteTouched: false, checkedAt: new Date().toISOString() };
window.SVR_PHASE294_LOCK = { build: BUILD_LABEL, phase293BaselinePreserved: true, noUnapprovedReikiBranding: true, rangeAliasAdded: true };
window.SVR_PHASE164_TABLE_AREA_AUTHORITY = { build: BUILD_LABEL, fakeGeometryTableRemoved: true, fbxTableOnly: true, siteTouched: false, checkedAt: new Date().toISOString() };
window.SVR_PHASE161_TABLE_FBX_FLOOR_LOCK = { build: BUILD_LABEL, geometryTableRemoved: true, fbxFloorAligned: true, siteTouched: false, checkedAt: new Date().toISOString() };

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
function log(...args){ if (!$log) return; const line = args.map(a => typeof a === "string" ? a : JSON.stringify(a, null, 2)).join(" "); $log.textContent += line + "\n"; $log.scrollTop = $log.scrollHeight; }
$toggleLog?.addEventListener("click", ()=>{ $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none"; });
if (AUTOCAM) document.body.classList.add("preview-mode");
if (ANDROID_SMART) document.body.classList.add("android-smart-client");

const { scene, camera, renderer } = createCore({ containerId: "app" });
const perf = createPhase148QuestPerfPass({ renderer, scene, log });
scene.userData._camera = camera;
window.__SVR_SCENE__ = scene;
window.__SVR_RENDERER__ = renderer;
window.__SVR_CAMERA__ = camera;
camera.position.set(0, 1.62, 7.2);
camera.lookAt(0, 1.45, -2.0);

window.addEventListener("error", (e)=>{ if (!renderer.xr.isPresenting && $err) $err.style.display = "block"; if ($err) $err.textContent = "RUNTIME ERROR:\n" + (e?.error?.stack || e?.message || String(e)); });
window.addEventListener("unhandledrejection", (e)=>{ if (!renderer.xr.isPresenting && $err) $err.style.display = "block"; if ($err) $err.textContent = "UNHANDLED PROMISE REJECTION:\n" + (e?.reason?.stack || e?.reason || String(e)); });

const desktop = (AUTOCAM || ANDROID_SMART) ? null : createDesktopControls({ camera, domElement: renderer.domElement });
setStatus("Loading clean expanded lobby…", { force: true });
const world = await buildPhase195CleanLobbyWorld(scene, { log, renderer });
window.SVR_WORLD_REF = world;
installPhase201HubContentRestore({ scene, camera, renderer, log });
installPhase202StorefrontShells({ scene, camera, renderer, log });
installPhase262GeometrySkyAlignmentLock({ scene, camera, renderer, log });
installPhase149LobbyFitAlignmentLock({ scene, camera, renderer, world });
setTimeout(()=>installPhase149LobbyFitAlignmentLock({ scene, camera, renderer, world }), 1200);
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius, sceneTargets = {} } = world;
const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });
const androidSmart = createAndroidSmartControls({ camera, renderer, roomClamp, enabled: ANDROID_SMART, setStatus, setMode });

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
function currentHeadXZ(){ if (renderer.xr.isPresenting){ const xrCam = renderer.xr.getCamera(camera); const p = new THREE.Vector3(); xrCam.getWorldPosition(p); return p; } return camera.position.clone(); }
function inTableZone(){ const p = currentHeadXZ(); return new THREE.Vector2(p.x - tableCenter.x, p.z - tableCenter.z).length() <= (joinRadius + 0.7); }
function seatLabel(){ return seatIndex >= 0 ? seats[seatIndex]?.label || `Seat ${seatIndex + 1}` : "Standing"; }
function moveDesktopToSeat(seat){ camera.position.set(seat.x, 1.12, seat.z); camera.lookAt(0, 1.0, 0.75); }
function joinTable(){
  if (!inTableZone()){ setStatus("Move closer to the poker table first.", { force:true }); return false; }
  const p = currentHeadXZ(); let best = 0; let bestDist = Infinity;
  seats.forEach((seat, idx)=>{ const d = Math.hypot(p.x - seat.x, p.z - seat.z); if (d < bestDist){ bestDist = d; best = idx; } });
  seatIndex = best; seated = true; const seat = seats[best];
  if (renderer.xr.isPresenting) tp.setPlayerPose(seat.x, -0.42, seat.z); else moveDesktopToSeat(seat);
  setMode(`Seat: ${seat.label}`); return true;
}
function leaveTable(){ seated = false; seatIndex = -1; if (renderer.xr.isPresenting) tp.setPlayerPose(0, 0, 7.2); else { camera.position.set(0, 1.62, 7.2); camera.lookAt(0, 1.45, -2.0); } return true; }
function movePlayerToSpot(target, lookTarget = null){ if (!target) return; if (renderer.xr.isPresenting) tp.setPlayerPose(target.x, 0, target.z); else { camera.position.set(target.x, 1.6, target.z); if (lookTarget) camera.lookAt(lookTarget.x, 1.45, lookTarget.z); } }
function gotoScene(key){ const rec = sceneTargets?.[key]; if (!rec?.pos) return false; movePlayerToSpot(rec.pos, rec.look || null); setStatus(`Quick jump: ${key}`, { force: true }); return true; }
function openStorePortal(){ const url = "https://svrpoker.com/site/store.html"; window.open(url, "_blank", "noopener,noreferrer"); setStatus("SVR Store portal opened.", { force: true }); return true; }
function createStoreWebPortal(){
  const rec = sceneTargets?.store; if (!rec?.pos) return null;
  const group = new THREE.Group(); group.name = "PHASE202_SVR_STORE_WEB_PORTAL"; group.position.set(rec.pos.x + 0.45, 1.55, rec.pos.z - 0.35); if (rec.look) group.lookAt(rec.look.x, 1.45, rec.look.z);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 1.02), new THREE.MeshBasicMaterial({ color:0x5ef7ff, transparent:true, opacity:0.18, side:THREE.DoubleSide, blending:THREE.AdditiveBlending })); pane.userData.href = "https://svrpoker.com/site/store.html"; group.add(pane);
  const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = 500; const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050713"; ctx.fillRect(0,0,900,500); ctx.strokeStyle = "#7ffcff"; ctx.lineWidth = 12; ctx.strokeRect(24,24,852,452); ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#fff"; ctx.font="900 58px system-ui,Arial"; ctx.fillText("SVR STORE",450,150); ctx.fillStyle="#ffdf8a"; ctx.font="800 34px system-ui,Arial"; ctx.fillText("Click to open web store",450,265); ctx.fillStyle="#bffcff"; ctx.font="700 24px system-ui,Arial"; ctx.fillText("Store opens outside the game",450,350);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.85,0.96), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide })); panel.position.z = 0.03; group.add(panel); scene.add(group);
  const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2(); renderer.domElement.addEventListener("pointerdown", (ev)=>{ const rect = renderer.domElement.getBoundingClientRect(); mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(mouse, camera); const hit = raycaster.intersectObjects([pane, panel], false)[0]; if (hit) openStorePortal(); });
  return group;
}
$sceneButtons.forEach((btn)=>{ btn.addEventListener("click", ()=>{ const key = btn.dataset.scene; if (key === "store") openStorePortal(); else if (key) gotoScene(key); }); });
window.addEventListener("keydown", async (e)=>{
  if (renderer.xr.isPresenting || e.repeat) return;
  if (e.code === "KeyJ") joinTable(); if (e.code === "KeyL") leaveTable(); if (e.code === "KeyT") tp.toggleMode(); if (e.code === "KeyO") openStorePortal();
  if (e.code === "Digit1") gotoScene("lobby"); if (e.code === "Digit2") gotoScene("table"); if (e.code === "Digit3") gotoScene("seat"); if (e.code === "Digit4") gotoScene("reiki"); if (e.code === "Digit5") gotoScene("pga"); if (e.code === "Digit6") gotoScene("legends"); if (e.code === "Digit7") gotoScene("sponsor"); if (e.code === "Digit8") gotoScene("scorpion"); if (e.code === "Digit0") openStorePortal();
});

const watch = createWristWatch({
  scene, camera, renderer,
  getState: ()=>( { audioEnabled: audio.getState().enabled, trackTitle: audio.getState().trackTitle || "Music Disabled", cash, seated, inTableZone: inTableZone(), seatLabel: seatLabel(), teleportEnabled: tp.isEnabled ? tp.isEnabled() : true }),
  actions: { toggleAudio: ()=>audio.toggle(), nextTrack: ()=>audio.next(), joinTable, leaveTable, toggleTeleport: ()=>tp.toggleMode(), goLobby: ()=>gotoScene("lobby"), goTable: ()=>gotoScene("table"), goSeat: ()=>gotoScene("seat"), goReiki: ()=>gotoScene("reiki"), goPga: ()=>gotoScene("pga"), goStore: ()=>gotoScene("store"), openStore: ()=>openStorePortal(), goLegend: ()=>gotoScene("legends"), goSponsor: ()=>gotoScene("sponsor"), goScorpion: ()=>gotoScene("scorpion"), goReikiRoom: ()=>gotoScene("reikiRoom") }
});
createStoreWebPortal();
installPhase262GeometrySkyAlignmentLock({ scene, camera, renderer, log });
$toggleJoints?.addEventListener("click", ()=>{ const on = hands.toggleDebug(); $toggleJoints.textContent = on ? "Joints On" : "Joints"; });

setStatus("Loading logo…", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);
window.SVR_PHASE208_PERFORMANCE_MAIN = true;
perf.lockSceneForQuest();

window.__SVR_GAME_READY__ = true;
window.__SVR_ANDROID_SMART_LOCK__ = ANDROID_SMART;
const __svrBootFallback = document.getElementById("bootFallback");
if (__svrBootFallback){ __svrBootFallback.style.opacity="0"; __svrBootFallback.style.pointerEvents="none"; setTimeout(()=>{__svrBootFallback.style.display="none";},420); }
setStatus(AUTOCAM ? "Live preview ready" : ANDROID_SMART ? `Ready. ${BUILD_LABEL} • Android safe movement` : `Ready. ${BUILD_LABEL}`, { force: true });
setMode(AUTOCAM ? "CAM 3 director" : ANDROID_SMART ? "Android safe movement locked" : "Hands: pinch and hold to aim, release to teleport");
function setHudVisible(visible){ const hud = document.getElementById("hud"); if (hud) hud.style.display = (visible && !AUTOCAM) ? "flex" : "none"; if ($log) $log.style.display = "none"; if ($err) $err.style.display = "none"; }
if (AUTOCAM) setHudVisible(false);
if (renderer.xr.isPresenting) document.getElementById("sceneNav")?.style.setProperty("display","none");
renderer.xr.addEventListener("sessionstart", async ()=>{ perf.onXRSessionStart(); setHudVisible(false); document.body.classList.add("xr-active"); document.getElementById("sceneNav")?.style.setProperty("display","none"); await tp.onSessionStart(); });
renderer.xr.addEventListener("sessionend", ()=>{ document.body.classList.remove("xr-active"); setHudVisible(true); const nav = document.getElementById("sceneNav"); if (nav && !AUTOCAM) nav.style.display = "flex"; });

let tPrev = performance.now();
const previewTarget = new THREE.Vector3(0, 1.55, -2.0);
const previewPos = new THREE.Vector3();
const previewShots = [
  { y: 1.78, r: previewOrbitRadius - 2.7, speed: 0.016, sway: 0.010, lookY: 1.42, targetX: 0.0, targetZ: -3.0, leadX: 0.10, leadZ: 0.08 },
  { y: 1.88, r: previewOrbitRadius - 2.1, speed: -0.013, sway: 0.012, lookY: 1.50, targetX: 0.0, targetZ: -5.2, leadX: -0.08, leadZ: 0.10 }
];
renderer.setAnimationLoop(()=>{
  const now = performance.now();
  const rawDt = Math.min((now - tPrev) / 1000, 0.20);
  const dt = Math.min(rawDt, 0.033);
  tPrev = now;
  perf.reportFrame?.(rawDt, (text)=>setStatus(text, { force: true }));
  const optionalTick = perf.optionalTickAllowed();
  if (!renderer.xr.isPresenting){
    if (!AUTOCAM && desktop) desktop.update(dt);
    if (!AUTOCAM && androidSmart?.isAndroid) androidSmart.update(dt);
    if (AUTOCAM){ const shotIndex = Math.floor(now / 9000) % previewShots.length; const shot = previewShots[shotIndex]; const orbitT = now * 0.001 * shot.speed; previewPos.set(Math.cos(orbitT) * shot.r + shot.leadX * Math.sin(now * 0.00047), shot.y + Math.sin(now * 0.0014 + shotIndex) * shot.sway, Math.sin(orbitT) * shot.r + shot.leadZ * Math.cos(now * 0.00053)); previewTarget.set(shot.targetX, shot.lookY, shot.targetZ); camera.position.lerp(previewPos, 0.06); camera.lookAt(previewTarget); }
    scene.userData._camera = camera;
  } else scene.userData._camera = renderer.xr.getCamera(camera);
  if (scene.userData._tickWorld) scene.userData._tickWorld(dt);
  hands.update(dt);
  if (optionalTick) hands.updateDebug();
  const leftHand = hands.getLeftHand(); const rightHand = hands.getRightHand(); const leftController = hands.getLeftController(); const rightController = hands.getRightController();
  if (!AUTOCAM || renderer.xr.isPresenting){ tp.update({ dt, leftHand, rightHand, leftController, rightController, statusCb:setStatus, modeCb:setMode }); }
  if (renderer.xr.isPresenting || !AUTOCAM) watch.update(dt, { leftHand, rightHand, leftController, rightController });
  renderer.render(scene, camera);
});
