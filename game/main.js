import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createAudioPlaylist } from "./modules/audio.js";
import { createWristWatch } from "./modules/watch.js";
import "./modules/optional_module_loader.js?v=phase245";

const BUILD_LABEL = "PHASE-245-FIXED-GIT-RUNGIT-HOTFIX-LOCK";
const BUILD_PHASE = 245;
window.SVR_MAIN_RUNTIME_STATE = { build: BUILD_LABEL, phase: BUILD_PHASE, startedAt: new Date().toISOString(), animationErrors: 0, subsystemErrors: {}, lastAnimationError: null };

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
  console.log("[SVR]", line);
  if (!$log) return;
  $log.textContent += line + "\n";
  $log.scrollTop = $log.scrollHeight;
}

$toggleLog?.addEventListener("click", ()=>{
  if (!$log) return;
  $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none";
});

if (AUTOCAM) document.body.classList.add("preview-mode");

const { scene, camera, renderer } = createCore({ containerId: "app" });
scene.userData._camera = camera;
camera.position.set(0, 1.6, 4.8);
camera.lookAt(0, 1.15, 0);

scene.background = new THREE.Color(0x02050b);

function createVisibleRecoveryScene(){
  const root = new THREE.Group();
  root.name = "SVR_VISIBLE_RECOVERY_SCENE_GUARD";
  root.visible = true;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 15),
    new THREE.MeshBasicMaterial({ color: 0x06140f, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.018, 0);
  root.add(floor);

  const grid = new THREE.GridHelper(15, 30, 0x00ffd5, 0x6d39ff);
  grid.name = "SVR_RECOVERY_NEON_GRID";
  grid.position.y = 0.028;
  grid.material.transparent = true;
  grid.material.opacity = 0.48;
  grid.renderOrder = -5;
  root.add(grid);

  const beacon = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.026, 10, 96),
    new THREE.MeshBasicMaterial({ color: 0x35f7ff, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  beacon.name = "SVR_RECOVERY_CENTER_RING";
  beacon.position.set(0, 1.22, 1.35);
  beacon.rotation.x = Math.PI * 0.5;
  root.add(beacon);

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0,0,1024,256);
  ctx.font = "bold 76px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#35f7ff";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "#eaffff";
  ctx.fillText("SVR RECOVERY VIEW", 512, 92);
  ctx.font = "bold 34px Arial, sans-serif";
  ctx.shadowColor = "#ff7a2f";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffd8a8";
  ctx.fillText("rendering protected â€¢ world can continue loading", 512, 162);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.75, 0.94),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  sign.name = "SVR_RECOVERY_SIGN";
  sign.position.set(0, 2.22, 1.34);
  root.add(sign);

  const lightA = new THREE.PointLight(0x35f7ff, 1.8, 10, 1.6);
  lightA.position.set(0, 2.4, 2.0);
  root.add(lightA);
  const lightB = new THREE.PointLight(0xff7a2f, 1.0, 7, 1.8);
  lightB.position.set(-2.2, 1.2, 1.2);
  root.add(lightB);

  scene.add(root);

  window.SVR_VISIBLE_RECOVERY_SCENE_GUARD = {
    build: BUILD_LABEL,
    phase: BUILD_PHASE,
    active: true,
    reason: "startup visibility guard",
    frames: 0,
    lastTick: null
  };

  return {
    root,
    beacon,
    sign,
    grid,
    tick(dt){
      const runtime = window.SVR_MAIN_RUNTIME_STATE || {};
      const hasErrors = !!(runtime.animationErrors || runtime.lastAnimationError);
      root.visible = true;
      const t = performance.now() * 0.001;
      beacon.rotation.z += (0.4 + (hasErrors ? 1.1 : 0.25)) * dt;
      beacon.material.opacity = hasErrors ? 0.94 : 0.42 + Math.sin(t * 2.2) * 0.08;
      sign.visible = hasErrors || performance.now() < 9500;
      grid.material.opacity = hasErrors ? 0.64 : 0.34;
      window.SVR_VISIBLE_RECOVERY_SCENE_GUARD = {
        build: BUILD_LABEL,
        phase: BUILD_PHASE,
        active: root.visible,
        errorMode: hasErrors,
        reason: hasErrors ? "runtime error visibility fallback" : "startup visibility guard",
        frames: (window.SVR_VISIBLE_RECOVERY_SCENE_GUARD?.frames || 0) + 1,
        lastTick: new Date().toISOString()
      };
    }
  };
}
const visibleRecovery = createVisibleRecoveryScene();


window.addEventListener("error", (e)=>{
  if (!renderer.xr.isPresenting && $err) $err.style.display = "block";
  if ($err) $err.textContent = "RUNTIME ERROR:\n" + (e?.error?.stack || e?.message || String(e));
});
window.addEventListener("unhandledrejection", (e)=>{
  if (!renderer.xr.isPresenting && $err) $err.style.display = "block";
  if ($err) $err.textContent = "UNHANDLED PROMISE REJECTION:\n" + (e?.reason?.stack || e?.reason || String(e));
});

const desktop = AUTOCAM ? null : createDesktopControls({ camera, domElement: renderer.domElement });
setStatus("Loading worldâ€¦", { force: true });
const world = await buildSkylineRoom(scene, { log, renderer });
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius, sceneTargets = {} } = world;

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });

const audio = createAudioPlaylist({
  tracks: [
    { title: "Lobby 07", url: "./assets/audio/07.mp3" }
  ],
  onState: (state)=>{
    if (!$status || renderer.xr.isPresenting) return;
    if (state.error){
      setStatus(`Audio: ${state.error}`);
      return;
    }
    if (state.enabled){
      setStatus(`Now Playing: ${state.trackTitle}`);
      return;
    }
    setStatus(state.primed ? `Music Ready: ${state.trackTitle}` : `Audio Locked: tap once to unlock`);
  }
});

let seated = false;
let seatIndex = -1;
let cash = 50000;

const pokerHudState = {
  build: BUILD_LABEL,
  actor: "TABLE",
  stage: "waiting",
  action: "waiting",
  remaining: 0,
  legal: { callAmount: 0, minRaise: 100, options: ["nextHand"] },
  decisionAid: { pressure: "WAITING", potOddsPct: 0, hint: "Waiting for poker state", callAmount: 0, pot: 0 },
  sidePots: [],
  allInPlayers: []
};
function updatePokerHud(partial = {}){
  if (partial.actor !== undefined) pokerHudState.actor = partial.actor;
  if (partial.stage !== undefined) pokerHudState.stage = partial.stage;
  if (partial.action !== undefined) pokerHudState.action = partial.action;
  if (partial.remaining !== undefined) pokerHudState.remaining = partial.remaining;
  if (partial.legal) pokerHudState.legal = { ...pokerHudState.legal, ...partial.legal };
  if (partial.decisionAid) pokerHudState.decisionAid = { ...pokerHudState.decisionAid, ...partial.decisionAid };
  if (partial.sidePots) pokerHudState.sidePots = partial.sidePots;
  if (partial.allInPlayers) pokerHudState.allInPlayers = partial.allInPlayers;
}
window.addEventListener("svr_watch_turn_indicator_update", (event)=>updatePokerHud(event.detail || {}));
window.addEventListener("svr_poker_legal_actions_update", (event)=>updatePokerHud(event.detail || {}));
window.addEventListener("svr_poker_decision_aid_update", (event)=>updatePokerHud(event.detail || {}));
window.addEventListener("svr_poker_side_pot_resolution", (event)=>updatePokerHud(event.detail || {}));
window.addEventListener("svr_poker_allin_update", (event)=>updatePokerHud(event.detail || {}));

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

function gotoScene(key){
  const rec = sceneTargets?.[key];
  if (!rec?.pos) return false;
  movePlayerToSpot(rec.pos, rec.look || null);
  setStatus(`Quick jump: ${key}`, { force: true });
  return true;
}

function openPrivatePage(url){
  if (!url) return false;
  window.location.href = url;
  return true;
}

function pokerAction(name){
  const actions = scene.userData?._pokerActions;
  const fn = actions?.[name];
  if (typeof fn === 'function') {
    fn();
    setStatus(`Poker: ${name}`, { force: true });
    return true;
  }
  setStatus('Poker controls loadingâ€¦', { force: true });
  return false;
}

$sceneButtons.forEach((btn)=>{
  btn.addEventListener("click", ()=>{
    const url = btn.dataset.url;
    const key = btn.dataset.scene;
    if (url) openPrivatePage(url);
    else if (key) gotoScene(key);
  });
});

window.addEventListener("keydown", async (e)=>{
  if (renderer.xr.isPresenting || e.repeat) return;
  if (e.code === "KeyM") await audio.toggle();
  if (e.code === "KeyN") await audio.next();
  if (e.code === "KeyJ") joinTable();
  if (e.code === "KeyL") leaveTable();
  if (e.code === "KeyT") tp.toggleMode();
  if (e.code === "KeyF") pokerAction("fold");
  if (e.code === "KeyC") pokerAction("call");
  if (e.code === "KeyR") pokerAction("raise");
  if (e.code === "KeyA") pokerAction("allIn");
  if (e.code === "KeyH") pokerAction("nextHand");
  if (e.code === "Digit1") gotoScene("lobby");
  if (e.code === "Digit2") gotoScene("seat");
  if (e.code === "Digit3") gotoScene("reiki");
  if (e.code === "Digit4") openPrivatePage("./reiki.html");
  if (e.code === "Digit5") gotoScene("pga");
  if (e.code === "Digit6") openPrivatePage("./pga-drive.html");
  if (e.code === "Digit7") openPrivatePage("./chip-putt.html");
  if (e.code === "Digit8") openPrivatePage("./store-room.html");
  if (e.code === "Digit9") openPrivatePage("./scorpion.html");
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
    teleportEnabled: tp.isEnabled ? tp.isEnabled() : true,
    poker: {
      actor: pokerHudState.actor,
      stage: pokerHudState.stage,
      action: pokerHudState.action,
      remaining: pokerHudState.remaining,
      legal: { ...pokerHudState.legal },
      decisionAid: { ...pokerHudState.decisionAid },
      sidePots: pokerHudState.sidePots,
      allInPlayers: pokerHudState.allInPlayers
    }
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
    goLegend: ()=>gotoScene("legends"),
    goSponsor: ()=>gotoScene("sponsor"),
    goScorpion: ()=>gotoScene("scorpion"),
    goReikiRoom: ()=>openPrivatePage("./reiki.html"),
    goPgaDrive: ()=>openPrivatePage("./pga-drive.html"),
    goPgaShort: ()=>openPrivatePage("./chip-putt.html"),
    goStoreRoom: ()=>openPrivatePage("./store-room.html"),
    goSmoker: ()=>openPrivatePage("./smoker-lounge.html"),
    goScorpionRoom: ()=>openPrivatePage("./scorpion.html"),
    pokerFold: ()=>pokerAction("fold"),
    pokerCall: ()=>pokerAction("call"),
    pokerRaise: ()=>pokerAction("raise"),
    pokerAllIn: ()=>pokerAction("allIn"),
    pokerNextHand: ()=>pokerAction("nextHand")
  }
});

$toggleJoints?.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  if ($toggleJoints) $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logoâ€¦", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);

window.dispatchEvent(new CustomEvent("svr_runtime_telemetry", { detail: { event: "boot_ready", preview: AUTOCAM, build: BUILD_LABEL } }));
window.dispatchEvent(new CustomEvent("svr_game_ready", { detail: { build: BUILD_LABEL, preview: AUTOCAM, at: new Date().toISOString() } }));
setStatus(AUTOCAM ? "Live preview ready" : "Ready. Enter VR. Hold grip/A/trigger to aim teleport, release to teleport. Poker keys: F/C/R/A/H. QA keys: Q/V/T/U/W/G/X/Y. Private scene buttons enabled.", { force: true });
setMode(AUTOCAM ? "CAM 3 director" : "Hands: waitingâ€¦");

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
  await audio.prime();
  await audio.start();
  await tp.onSessionStart();
});
renderer.xr.addEventListener("sessionend", ()=>{
  setHudVisible(true);
  const nav = document.getElementById("sceneNav");
  if (nav && !AUTOCAM) nav.style.display = "flex";
});


function ensureMainRuntimeState(){
  if (!window.SVR_MAIN_RUNTIME_STATE) {
    window.SVR_MAIN_RUNTIME_STATE = {
      build: BUILD_LABEL,
      phase: BUILD_PHASE,
      startedAt: new Date().toISOString(),
      animationErrors: 0,
      subsystemErrors: {},
      lastAnimationError: null
    };
  }
  if (!window.SVR_MAIN_RUNTIME_STATE.subsystemErrors) window.SVR_MAIN_RUNTIME_STATE.subsystemErrors = {};
  return window.SVR_MAIN_RUNTIME_STATE;
}

function recordLoopError(source, error){
  const message = error?.stack || error?.message || String(error);
  const state = ensureMainRuntimeState();
  state.animationErrors += 1;
  const prev = state.subsystemErrors[source] || { count: 0 };
  state.subsystemErrors[source] = {
    count: (prev.count || 0) + 1,
    at: new Date().toISOString(),
    message
  };
  state.lastAnimationError = {
    source,
    at: new Date().toISOString(),
    message,
    count: state.animationErrors
  };
  console.error(`[SVR ${source} runtime error]`, error);
  try {
    window.dispatchEvent(new CustomEvent("svr_main_runtime_error", {
      detail: { build: BUILD_LABEL, phase: BUILD_PHASE, source, message, count: state.animationErrors }
    }));
  } catch(_e) {}
  try {
    window.SVR_RUNTIME_CRASH_SHIELD?.record?.("main_loop_" + source, error, { build: BUILD_LABEL, phase: BUILD_PHASE, source });
  } catch(_e) {}
  try {
    setStatus(`Runtime shield isolated ${source} error`, { force: true, minGap: 0 });
  } catch(_e) {}
  return false;
}

function safeLoopStep(source, fn){
  try {
    return fn();
  } catch(error) {
    recordLoopError(source, error);
    return null;
  }
}

function emergencyRenderFrame(){
  try {
    if (typeof visibleRecovery !== "undefined") {
      visibleRecovery?.tick?.(0.016);
    }
    renderer.render(scene, camera);
    return true;
  } catch(error) {
    recordLoopError("emergency_renderer_render", error);
    return false;
  }
}
let tPrev = performance.now();
const previewTarget = new THREE.Vector3(0, 1.25, 0);
const previewPos = new THREE.Vector3();
const previewShots = [
  { y: 1.62, r: previewOrbitRadius - 3.5, speed: 0.030, sway: 0.015, lookY: 1.02, targetX: 0.0, targetZ: 0.0, leadX: 0.14, leadZ: 0.08 },
  { y: 1.68, r: previewOrbitRadius - 3.0, speed: -0.024, sway: 0.018, lookY: 1.04, targetX: 0.1, targetZ: -0.1, leadX: -0.10, leadZ: 0.12 },
  { y: 1.64, r: previewOrbitRadius - 2.6, speed: 0.022, sway: 0.018, lookY: 1.03, targetX: -0.12, targetZ: 0.04, leadX: 0.10, leadZ: -0.08 }
];

renderer.setAnimationLoop(()=>{
  try {
  const now = performance.now();
  const dt = Math.min((now - tPrev) / 1000, 0.033);
  tPrev = now;

  if (!renderer.xr.isPresenting){
    if (!AUTOCAM && desktop) desktop.update(dt);
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

  safeLoopStep("world_tick", ()=>{ if (scene.userData._tickWorld) scene.userData._tickWorld(dt); });

  safeLoopStep("hands_update", ()=>hands.update(dt));
  safeLoopStep("hands_debug", ()=>hands.updateDebug());

  const leftHand = hands.getLeftHand();
  const rightHand = hands.getRightHand();
  const leftController = hands.getLeftController();
  const rightController = hands.getRightController();
  if (!AUTOCAM || renderer.xr.isPresenting){
    safeLoopStep("teleport_update", ()=>tp.update({
      dt,
      leftHand,
      rightHand,
      leftController,
      rightController,
      statusCb: (text)=>{ setStatus(text); },
      modeCb: (text)=>{ setMode(text); }
    }));
  }

  safeLoopStep("watch_update", ()=>{ if (watch) watch.update(dt, leftHand, rightHand); });

  safeLoopStep("visible_recovery_tick", ()=>visibleRecovery?.tick?.(dt));
  safeLoopStep("renderer_render", ()=>renderer.render(scene, camera));
  } catch (error) {
    const message = error?.stack || error?.message || String(error);
    if (!window.SVR_MAIN_RUNTIME_STATE) {
      window.SVR_MAIN_RUNTIME_STATE = { build: BUILD_LABEL, phase: BUILD_PHASE, startedAt: new Date().toISOString(), animationErrors: 0, subsystemErrors: {}, lastAnimationError: null };
    }
    ensureMainRuntimeState().animationErrors += 1;
    ensureMainRuntimeState().lastAnimationError = {
      at: new Date().toISOString(),
      message,
      count: window.SVR_MAIN_RUNTIME_STATE.animationErrors
    };
    console.error("[SVR main animation error]", error);
    window.dispatchEvent(new CustomEvent("svr_main_runtime_error", {
      detail: { build: BUILD_LABEL, phase: BUILD_PHASE, message, count: window.SVR_MAIN_RUNTIME_STATE.animationErrors }
    }));

    const shield = window.SVR_RUNTIME_CRASH_SHIELD;
    if (shield?.handleAnimationError?.(error, { phase: BUILD_PHASE, build: BUILD_LABEL, module: "main.animationLoop" })) { emergencyRenderFrame(); return; }

    setStatus("Runtime recovered â€¢ check Logs", { force: true, minGap: 0 });
    if (!renderer.xr.isPresenting && $err) {
      $err.style.display = "block";
      $err.textContent = "RUNTIME ERROR RECOVERED:\n" + message;
    }
    emergencyRenderFrame();
    return;
  }
});

const canvasEl = renderer.domElement;
canvasEl.addEventListener("pointerdown", async ()=>{
  const st = audio.getState();
  if (!st.enabled) await audio.start();
}, { passive: true });
canvasEl.addEventListener("webglcontextlost", (e)=>{
  e.preventDefault();
  log("[ERR] WebGL context lost. Reloadingâ€¦");
  setStatus("WebGL context lost (reloadingâ€¦)", { force: true });
  setTimeout(()=>location.reload(), 500);
}, false);








