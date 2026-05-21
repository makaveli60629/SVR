import * as THREE from "three";
import "./modules/scorpion_integration_guard.js";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createAudioPlaylist } from "./modules/audio.js";
import { createWristWatch } from "./modules/watch.js";
import { createHologramMenu } from "./modules/hologram_menu.js";
import { createHologramDomFallback } from "./modules/hologram_dom_fallback.js";
import { applyWatchHardfix } from "./modules/watch_hardfix.js";
import { createNpcAvatarSystem } from "./modules/npc_avatar_system.js";
import { createPlayablePoker } from "./modules/playable_poker.js";
import "./modules/poker_action_hud.js";
import { runWebXREnforcerAudit, SVR_WEBXR_PHASE } from "./modules/webxr_enforcer.js";
import { buildTeleportRouteRegistry } from "./modules/teleport-router.js";

const PHASE_85_BUILD = "PHASE-84-HOLOGRAM-SPACE-ROUTING-LOCK";
const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
const EMBED = IN_IFRAME || params.has("embed");
const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director";
document.documentElement.dataset.svrBuild = PHASE_85_BUILD;
const AUTOCAM = IN_IFRAME || params.has("autocam") || PREVIEW;

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

const enforcerAudit = runWebXREnforcerAudit({ log });
const { scene, camera, renderer } = createCore({ containerId: "app" });
scene.userData.SVR_WEBXR_ENFORCER_AUDIT = enforcerAudit;
scene.userData.SVR_PHASE_85_BUILD = PHASE_85_BUILD;
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

if (!sceneTargets.pgaDrive) sceneTargets.pgaDrive = sceneTargets.pgaWall || sceneTargets.pga || sceneTargets.lobby;
if (!sceneTargets.chipPutt) sceneTargets.chipPutt = sceneTargets.pgaWall || sceneTargets.pga || sceneTargets.lobby;
if (!sceneTargets.storeRoom) sceneTargets.storeRoom = sceneTargets.sponsor || sceneTargets.lobby;
if (!sceneTargets.smokerLounge) sceneTargets.smokerLounge = sceneTargets.sponsor || sceneTargets.lobby;
if (!sceneTargets.reikiRoom) sceneTargets.reikiRoom = sceneTargets.reiki || sceneTargets.lobby;
if (!sceneTargets.spaceStation) sceneTargets.spaceStation = sceneTargets.sponsor || sceneTargets.lobby;
const teleportRouter = buildTeleportRouteRegistry(sceneTargets, seats, tableCenter);
Object.assign(sceneTargets, teleportRouter.legacySceneTargets);
window.SVR_TELEPORT_ROUTER = teleportRouter;
window.SVR_SCENE_TARGETS = sceneTargets;

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });
const npcAvatarSystem = createNpcAvatarSystem({ scene, seats, tableCenter, sceneTargets, currentScene: "lobby", log });
window.SVR_NPC_AVATAR_SYSTEM = npcAvatarSystem?.state || null;

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
let hologram = null;
let holoFallback = null;

const poker = createPlayablePoker({
  scene,
  tableCenter,
  seats,
  log,
  onState: (state)=>{
    cash = state?.playerStack ?? cash;
    if (state?.awaitingPlayer && !$status?.textContent?.includes("YOUR POKER TURN")){
      setStatus(`YOUR POKER TURN: ${state.toCall > 0 ? `Call $${state.toCall}` : "Check"} / Raise / Fold`, { force: true, minGap: 0 });
    }
  }
});
window.SVR_PLAYABLE_POKER = poker;

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

function seatLabel(){ return seatIndex >= 0 ? seats[seatIndex]?.label || `Seat ${seatIndex + 1}` : "Standing"; }
function moveDesktopToSeat(seat){ camera.position.set(seat.x, 1.12, seat.z); camera.lookAt(0, 1.0, 0); }

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
  if (renderer.xr.isPresenting) tp.setPlayerPose(seat.x, -0.42, seat.z);
  else moveDesktopToSeat(seat);
  setMode(`Seat: ${seat.label}`);
  setStatus("Poker controls: F Fold • C Check/Call • R Raise • A All-In • H Next Hand", { force: true });
  return true;
}

function leaveTable(){
  seated = false;
  seatIndex = -1;
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
  const routeKey = teleportRouter.normalizeRouteKey(key);
  const rec = teleportRouter.getRoute(routeKey) || sceneTargets?.[key];
  if (!rec?.pos){ setStatus(`Route unavailable: ${key}`, { force: true }); return false; }

  if (rec.scenePath && rec.privateScene){
    const path = rec.scenePath.replace(/^game\//, "./");
    window.SVR_LAST_ROUTE = { requested: key, routeKey, label: rec.label || routeKey, type: rec.type || "private_scene", privateScene: true, scenePath: rec.scenePath };
    setStatus(`Opening private scene: ${rec.label || routeKey}`, { force: true });
    setTimeout(()=>{ window.location.href = `${path}?v=phase84-private-route`; }, 80);
    return true;
  }

  movePlayerToSpot(rec.pos, rec.look || null);
  setStatus(`Quick jump: ${rec.label || routeKey}`, { force: true });
  window.SVR_LAST_ROUTE = { requested: key, routeKey, label: rec.label || routeKey, type: rec.type || "legacy", privateScene: !!rec.privateScene };
  return true;
}

$sceneButtons.forEach((btn)=>{ btn.addEventListener("click", ()=>{ const key = btn.dataset.scene; if (key) gotoScene(key); }); });

function getGameState(){
  return {
    audioEnabled: audio.getState().enabled,
    trackTitle: audio.getState().trackTitle || "Lobby 07",
    cash: poker.getState().playerStack ?? cash,
    seated,
    inTableZone: inTableZone(),
    seatLabel: seatLabel(),
    teleportEnabled: tp.isEnabled ? tp.isEnabled() : true,
    hologramVisible: !!hologram?.getState?.().visible || !!holoFallback?.getState?.().visible,
    poker: poker.getState()
  };
}

const watchActions = {
  toggleAudio: ()=>audio.toggle(),
  nextTrack: ()=>audio.next(),
  joinTable,
  leaveTable,
  toggleTeleport: ()=>tp.toggleMode(),
  toggleHologram: ()=>{
    const opened = hologram?.toggle("watch-holo-button");
    const visible3d = !!hologram?.getState?.().visible;
    if (!visible3d || !opened) return holoFallback?.toggle("watch-holo-fallback");
    return opened;
  },
  pokerFold: ()=>poker.fold(),
  pokerCall: ()=>poker.checkCall(),
  pokerRaise: ()=>poker.raise(),
  pokerRaiseHalfPot: ()=>poker.raiseHalfPot?.() || poker.raise?.(),
  pokerRaisePot: ()=>poker.raisePot?.() || poker.raise?.(),
  pokerAllIn: ()=>poker.allIn(),
  pokerNext: ()=>poker.nextHand(),
  goLobby: ()=>gotoScene("lobby"),
  goTable: ()=>gotoScene("main_poker_pit"),
  goSeat: ()=>gotoScene("seat_south_player"),
  goReiki: ()=>gotoScene("reiki_hub"),
  goPga: ()=>gotoScene("pga_hub"),
  goLegend: ()=>gotoScene("sponsor_wall"),
  goSponsor: ()=>gotoScene("sponsor_wall"),
  goScorpion: ()=>gotoScene("scorpion_room"),
  goReikiRoom: ()=>gotoScene("reiki_room"),
  goPgaDrive: ()=>gotoScene("pga_drive"),
  goChipPutt: ()=>gotoScene("pga_chip_putt"),
  goStoreRoom: ()=>gotoScene("vr_store"),
  goSmokerLounge: ()=>gotoScene("smoker_lounge"),
  goSpaceStation: ()=>gotoScene("space_station")
};

window.addEventListener("keydown", async (e)=>{
  if (renderer.xr.isPresenting || e.repeat) return;
  if (e.code === "KeyF") poker.fold();
  if (e.code === "KeyC") poker.checkCall();
  if (e.code === "KeyR") poker.raise();
  if (e.code === "KeyA") poker.allIn();
  if (e.code === "KeyH") poker.nextHand();
  if (e.code === "KeyM") await audio.toggle();
  if (e.code === "KeyN") await audio.next();
  if (e.code === "KeyJ") joinTable();
  if (e.code === "KeyL") leaveTable();
  if (e.code === "KeyT") tp.toggleMode();
  if (e.code === "KeyG") watchActions.toggleHologram();
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
  if (e.code === "KeyS") gotoScene("spaceStation");
});

const watch = createWristWatch({ scene, camera, renderer, getState: getGameState, actions: watchActions });
hologram = createHologramMenu({ scene, camera, renderer, getState: getGameState, actions: watchActions });
holoFallback = createHologramDomFallback({ getState: getGameState, actions: watchActions });
window.SVR_HOLOGRAM_MENU = hologram;
window.SVR_HOLOGRAM_DOM_FALLBACK = holoFallback;

$toggleJoints.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logo…", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);

setStatus(AUTOCAM ? "Live preview ready" : "Ready. Poker is playable. Wrist console + hologram menu enabled.", { force: true });
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
  document.getElementById("svrPokerHud")?.classList.add("svr-hidden");
  await audio.prime();
  await audio.start();
  await tp.onSessionStart();
});
renderer.xr.addEventListener("sessionend", ()=>{
  setHudVisible(true);
  const nav = document.getElementById("sceneNav");
  if (nav && !AUTOCAM) nav.style.display = "flex";
  document.getElementById("svrPokerHud")?.classList.remove("svr-hidden");
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
  if (npcAvatarSystem?.update) npcAvatarSystem.update(dt);
  if (poker?.update) poker.update(dt);

  hands.update(dt);
  hands.updateDebug();

  const leftHand = hands.getLeftHand();
  const rightHand = hands.getRightHand();
  const leftController = hands.getLeftController();
  const rightController = hands.getRightController();
  if (!AUTOCAM || renderer.xr.isPresenting){
    tp.update({ dt, leftHand, rightHand, leftController, rightController, statusCb: (text)=>{ setStatus(text); }, modeCb: (text)=>{ setMode(text); } });
  }

  if (watch) {
    watch.update(dt, leftHand, rightHand);
    applyWatchHardfix(watch.object, camera, renderer);
  }
  if (hologram) hologram.update(dt, leftHand, rightHand);

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
  setStatus("WebGL context lost (reloading…)", { force: true });
  setTimeout(()=>location.reload(), 500);
}, false);
