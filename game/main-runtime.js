import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createAudioPlaylist } from "./modules/audio.js";
import { createWristWatch } from "./modules/watch.js";
import { PHASE_109_BUILD, routeLabel, PHASE_101_VR_RUNTIME_CORRECTION_LOCK, PHASE_106_HOLOCTX_BOOT_FIX_LOCK } from "./modules/private_room_registry.js";

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
  $log.textContent += line + "\n";
  $log.scrollTop = $log.scrollHeight;
}

$toggleLog.addEventListener("click", ()=>{
  $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none";
});

if (AUTOCAM) document.body.classList.add("preview-mode");

const { scene, camera, renderer } = createCore({ containerId: "app" });
window.__SVR_MAIN_STARTED = true;
window.__SVR_BOOT_STAGE = "core-created";
scene.userData._camera = camera;
camera.position.set(0, 1.6, 4.8);
camera.lookAt(0, 1.15, 0);

function makeBootTexture(message, sub = "Three.js/WebXR runtime loading") {
  const c = document.createElement("canvas");
  c.width = 1200; c.height = 520;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0, "#070714");
  g.addColorStop(1, "#2b0b3d");
  x.fillStyle = g;
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(139,255,220,.92)";
  x.lineWidth = 12;
  x.strokeRect(28,28,c.width-56,c.height-56);
  x.fillStyle = "#ffffff";
  x.font = "900 72px system-ui, Arial";
  x.textAlign = "center";
  x.fillText(message, c.width/2, 185);
  x.fillStyle = "#8fffe6";
  x.font = "700 38px system-ui, Arial";
  x.fillText(sub, c.width/2, 270);
  x.fillStyle = "#ffe986";
  x.font = "700 30px system-ui, Arial";
  x.fillText("Boot guard active: the screen should never stay black.", c.width/2, 345);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const bootGroup = new THREE.Group();
bootGroup.name = "PHASE_105_BOOT_SAFE_VISUAL";
const bootPanel = new THREE.Mesh(
  new THREE.PlaneGeometry(5.2, 2.25),
  new THREE.MeshBasicMaterial({ map: makeBootTexture("SVR POKER BOOTING", "Phase 105 safe loader"), transparent: true, side: THREE.DoubleSide, toneMapped: false })
);
bootPanel.position.set(0, 1.7, -3.4);
bootGroup.add(bootPanel);
const bootFloor = new THREE.Mesh(
  new THREE.CircleGeometry(4.6, 64),
  new THREE.MeshBasicMaterial({ color: 0x12051d, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
);
bootFloor.rotation.x = -Math.PI / 2;
bootFloor.position.y = -0.02;
bootGroup.add(bootFloor);
scene.add(bootGroup);
renderer.setAnimationLoop(()=>{
  bootGroup.rotation.y += 0.002;
  renderer.render(scene, camera);
});


window.addEventListener("error", (e)=>{
  if (!renderer.xr.isPresenting && $err) $err.style.display = "block";
  if ($err) $err.textContent = "RUNTIME ERROR:\n" + (e?.error?.stack || e?.message || String(e));
});
window.addEventListener("unhandledrejection", (e)=>{
  if (!renderer.xr.isPresenting && $err) $err.style.display = "block";
  if ($err) $err.textContent = "UNHANDLED PROMISE REJECTION:\n" + (e?.reason?.stack || e?.reason || String(e));
});

let world = null;
let desktop = null;
setStatus("Loading world…", { force: true });
window.__SVR_BOOT_STAGE = "world-loading";

function buildEmergencyWorld(){
  const root = new THREE.Group();
  root.name = "PHASE_105_EMERGENCY_WORLD_FALLBACK";
  const floor = new THREE.Mesh(new THREE.CircleGeometry(11, 96), new THREE.MeshBasicMaterial({ color: 0x15101f, side: THREE.DoubleSide }));
  floor.rotation.x = -Math.PI/2;
  root.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9.5, 0.035, 8, 160), new THREE.MeshBasicMaterial({ color: 0x9c5cff }));
  ring.rotation.x = Math.PI/2;
  ring.position.y = 0.02;
  root.add(ring);
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 1.65), new THREE.MeshStandardMaterial({ color: 0x19111f, emissive: 0x26003c, emissiveIntensity: 0.55, roughness: 0.55 }));
  table.position.set(0, 0.82, 0);
  root.add(table);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.018, 1.28), new THREE.MeshBasicMaterial({ color: 0x0d5c47 }));
  mat.position.set(0, 0.925, 0);
  root.add(mat);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 32), new THREE.MeshBasicMaterial({ color: 0xe7e7ee }));
  moon.position.set(-4, 7.2, -8);
  root.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.68, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff805c }));
  mars.position.set(4.8, 6.4, -8.6);
  root.add(mars);
  scene.add(root);
  const seats = [
    { label:"Front Player", x:0, z:2.55 },
    { label:"Bot Left", x:-2.35, z:0.6 },
    { label:"Bot Right", x:2.35, z:0.6 },
    { label:"Back", x:0, z:-2.35 }
  ];
  return {
    roomClamp: 9.2,
    tableCenter: new THREE.Vector3(0,0,0),
    seats,
    joinRadius: 4.8,
    previewOrbitRadius: 7.5,
    sceneTargets: {
      lobby: { pos: new THREE.Vector3(0,0,4.8), look: new THREE.Vector3(0,1.2,0) },
      table: { pos: new THREE.Vector3(0,0,3.0), look: new THREE.Vector3(0,1.05,0) },
      seat: { pos: new THREE.Vector3(0,0,2.55), look: new THREE.Vector3(0,1.0,0) },
      scorpion: { pos: new THREE.Vector3(0,0,2.55), look: new THREE.Vector3(0,1.0,0) },
      reikiRoom: { pos: new THREE.Vector3(-5,0,0), look: new THREE.Vector3(0,1.2,0) },
      pgaRange: { pos: new THREE.Vector3(5,0,0), look: new THREE.Vector3(0,1.2,0) },
      vrStore: { pos: new THREE.Vector3(0,0,-5), look: new THREE.Vector3(0,1.2,0) },
      smokerLounge: { pos: new THREE.Vector3(-5,0,-5), look: new THREE.Vector3(0,1.2,0) },
      spaceRoom: { pos: new THREE.Vector3(5,0,-5), look: new THREE.Vector3(0,1.2,0) }
    },
    portalLocks: [],
    vrScenes: []
  };
}

async function withBootTimeout(promise, ms){
  return await Promise.race([
    promise,
    new Promise((_, reject)=>setTimeout(()=>reject(new Error(`world boot timeout after ${ms}ms`)), ms))
  ]);
}

try {
  world = await withBootTimeout(buildSkylineRoom(scene, { log, renderer }), 18000);
  window.__SVR_BOOT_STAGE = "world-ready";
} catch (err) {
  console.error("[SVR] world boot failed; using emergency fallback", err);
  log("[BOOT SAFE] World build failed; using emergency fallback:", err?.message || String(err));
  setStatus("Boot safe fallback loaded", { force: true });
  world = buildEmergencyWorld();
  window.__SVR_BOOT_STAGE = "world-fallback";
}
if (bootGroup?.parent) bootGroup.parent.remove(bootGroup);
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius, sceneTargets = {}, portalLocks = [] } = world;
desktop = AUTOCAM ? null : createDesktopControls({ camera, domElement: renderer.domElement, roomClamp });

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });

const audio = createAudioPlaylist({
  tracks: [
    { title: "Lobby 07", url: "./assets/audio/07.mp3" },
    { title: "Reiki Time Hub", url: "./assets/audio/reiki_time_hub.mp3" },
    { title: "SVR After Dark", url: "./assets/audio/svr_after_dark.mp3" }
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
let holoMenuVisible = false;
// Phase 108: holo starts OFF; user turns it on from the physical watch HOLO button.

function toggleHoloMenu(){
  holoMenuVisible = !holoMenuVisible;
  const nav = document.getElementById("sceneNav");
  if (nav && !AUTOCAM && !renderer.xr.isPresenting) nav.style.display = "flex";
  setStatus(holoMenuVisible ? "WATCH HOLO ON" : "WATCH HOLO OFF", { force: true });
  return holoMenuVisible;
}

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
  setStatus(`Phase 108 VR route: ${routeLabel(key)}`, { force: true });
  return true;
}

let portalCooldownUntil = 0;
function checkPortalLocks(){
  if (AUTOCAM || !portalLocks?.length) return;
  const now = performance.now();
  if (now < portalCooldownUntil) return;
  const p = currentHeadXZ();
  for (const lock of portalLocks){
    if (!lock?.position || !lock?.destination) continue;
    const dx = p.x - lock.position.x;
    const dz = p.z - lock.position.z;
    const radius = lock.radius || 1.05;
    if ((dx * dx + dz * dz) <= radius * radius){
      if (gotoScene(lock.destination)){
        portalCooldownUntil = now + (lock.cooldownMs || 3200);
        setStatus(`VR portal locked: ${lock.label || lock.key} → ${routeLabel(lock.destination)}`, { force: true });
      }
      break;
    }
  }
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
  if (e.code === "Digit9") gotoScene("reikiRoom");
  if (e.code === "Digit0") gotoScene("scorpion");
  if (e.code === "KeyV") gotoScene("vrStore");
  if (e.code === "KeyO") gotoScene("smokerLounge");
  if (e.code === "KeyX") gotoScene("spaceRoom");
  if (e.code === "KeyR") gotoScene("pgaRange");
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
    locomotionEnabled: tp.isLocomotionEnabled ? tp.isLocomotionEnabled() : true,
    holoMenuVisible
  }),
  actions: {
    toggleAudio: ()=>audio.toggle(),
    nextTrack: ()=>audio.next(),
    joinTable,
    leaveTable,
    toggleTeleport: ()=>tp.toggleMode(),
    toggleLocomotion: ()=>tp.toggleLocomotion?.(),
    toggleHoloMenu,
    goLobby: ()=>gotoScene("lobby"),
    goTable: ()=>gotoScene("table"),
    goSeat: ()=>gotoScene("seat"),
    goReiki: ()=>gotoScene("reiki"),
    goPga: ()=>gotoScene("pga"),
    goLegend: ()=>gotoScene("legends"),
    goSponsor: ()=>gotoScene("sponsor"),
    goScorpion: ()=>gotoScene("scorpion"),
    goReikiRoom: ()=>gotoScene("reikiRoom"),
    goPgaRange: ()=>gotoScene("pgaRange"),
    goVrStore: ()=>gotoScene("vrStore"),
    goSmokerLounge: ()=>gotoScene("smokerLounge"),
    goSpaceRoom: ()=>gotoScene("spaceRoom")
  }
});

$toggleJoints.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logo…", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);

window.__SVR_RUNTIME_READY = true;
setStatus(AUTOCAM ? "Live preview ready" : `Ready. ${PHASE_109_BUILD}: watch holo starts off, hand teleport glow/release locked, locomotion toggle active.`, { force: true });
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
  await audio.prime();
  await audio.start();
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

  checkPortalLocks();

  if (watch) watch.update(dt, leftHand, rightHand);

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
