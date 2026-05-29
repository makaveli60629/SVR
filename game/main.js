import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createAudioPlaylist } from "./modules/audio.js";
import { createWristWatch } from "./modules/watch.js";
import { createPortal, openPrivateScene, installPortalClickHandler } from "./modules/scene_portal_router.js";

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

function withBootTimeout(promise, ms, label = "operation"){
  let timer = null;
  return Promise.race([
    promise,
    new Promise((_, reject)=>{
      timer = setTimeout(()=>reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    })
  ]).finally(()=>{ if (timer) clearTimeout(timer); });
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
setStatus("Loading worldâ€¦", { force: true });
let world;
try {
  world = await withBootTimeout(buildSkylineRoom(scene, { log, renderer }), 5500, "world build");
} catch (err) {
  console.error(err);
  log("[BOOT-SAFE] world build failed, using emergency lobby shell", err?.message || err);
  setStatus("Boot-safe lobby loaded â€” world module recovered", { force: true });
  const g = new THREE.Group();
  scene.add(g);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(18, 64), new THREE.MeshBasicMaterial({ color: 0x111018 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.18, 64), new THREE.MeshBasicMaterial({ color: 0x104034 }));
  table.position.y = 0.9;
  scene.add(table);
  const makeBootPlanet = (name, radius, color, glowColor, x, y, z)=>{
    const group = new THREE.Group();
    group.name = `${name}_HIGH_SKY_BOOT_SAFE`;
    const body = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32), new THREE.MeshStandardMaterial({ color, roughness: 0.82, emissive: glowColor, emissiveIntensity: 0.10 }));
    body.frustumCulled = false;
    group.add(body);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ color: glowColor, transparent: true, opacity: 0.23, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(radius * 10, radius * 10, 1);
    group.add(halo);
    const light = new THREE.PointLight(glowColor, name === 'Moon' ? 3.1 : 2.2, radius * 100, 1.4);
    group.add(light);
    group.position.set(x, y, z);
    group.userData.body = body;
    scene.add(group);
    return group;
  };
  const moon = makeBootPlanet('Moon', 3.7, 0xf3f6ff, 0xdbeaff, -68, 38, -148);
  const mars = makeBootPlanet('Mars', 2.0, 0xd97954, 0xff986d, 76, 43, -172);
  scene.userData._bootPlanetTick = (dt)=>{
    const t = (scene.userData._bootPlanetTime = (scene.userData._bootPlanetTime || 0) + dt);
    moon.position.set(-68 + Math.sin(t * 0.025) * 10, 38 + Math.sin(t * 0.060) * 1.4, -148 + Math.cos(t * 0.025) * 10);
    mars.position.set(76 + Math.sin(t * 0.019 + 1.4) * 12, 43 + Math.sin(t * 0.050) * 1.1, -172 + Math.cos(t * 0.019 + 1.4) * 12);
    moon.userData.body.rotation.y += dt * 0.075;
    mars.userData.body.rotation.y += dt * 0.062;
  };
  world = {
    roomClamp: (p)=>p,
    seats: [{x:0,z:2.9,label:"Player Seat"},{x:2.3,z:1.3,label:"Bot 1"},{x:2.3,z:-1.3,label:"Bot 2"},{x:0,z:-2.9,label:"Bot 3"},{x:-2.3,z:-1.3,label:"Bot 4"},{x:-2.3,z:1.3,label:"Bot 5"}],
    tableCenter: new THREE.Vector3(0,0,0),
    joinRadius: 4.5,
    previewOrbitRadius: 10,
    sceneTargets: { lobby:{pos:{x:0,z:4.8},look:{x:0,z:0}}, seat:{pos:{x:0,z:2.9},look:{x:0,z:0}}, reiki:{pos:{x:-7,z:-4},look:{x:0,z:0}}, pga:{pos:{x:7,z:-4},look:{x:0,z:0}}, sponsor:{pos:{x:0,z:-8},look:{x:0,z:0}}, scorpion:{pos:{x:6,z:6},look:{x:0,z:0}}, legends:{pos:{x:-6,z:6},look:{x:0,z:0}} }
  };
}
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius, sceneTargets = {} } = world;
window.SVR_GAME = { scene, camera, renderer, world, player };

// Phase 91: direct labeled lobby portals. Full experiences remain separate pages.
createPortal({ scene, label: "REIKI ROOM", sublabel: "PRIVATE MEDITATION", position: new THREE.Vector3(-6.2, 0, -4.8), rotationY: 0.72, key: "reikiRoom", color: 0xff4058 });
createPortal({ scene, label: "PGA DRIVE", sublabel: "PRIVATE RANGE", position: new THREE.Vector3(6.2, 0, -4.8), rotationY: -0.72, key: "pgaDrive", color: 0x7ff5c7 });
createPortal({ scene, label: "CHIP + PUTT", sublabel: "PRIVATE SHORT GAME", position: new THREE.Vector3(8.1, 0, -1.5), rotationY: -1.05, key: "pgaChipPutt", color: 0x95ff9f });
createPortal({ scene, label: "SVR STORE", sublabel: "WEB PORTAL ROOM", position: new THREE.Vector3(-8.1, 0, -1.5), rotationY: 1.05, key: "storeRoom", color: 0xb48cff });
createPortal({ scene, label: "LOUNGE", sublabel: "PRIVATE SOCIAL ROOM", position: new THREE.Vector3(-7.8, 0, 2.2), rotationY: 1.34, key: "smokerLounge", color: 0xffb86b });
createPortal({ scene, label: "ENTER SCORPION ROOM", sublabel: "PRIVATE POKER SCENE", position: new THREE.Vector3(7.8, 0, 2.2), rotationY: -1.34, key: "scorpion", color: 0xd3a13b });
installPortalClickHandler({ camera, scene, domElement: renderer.domElement });

const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });

const audio = createAudioPlaylist({
  tracks: [
    { title: "Lobby 07", url: "./assets/audio/07.mp3" },
    
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
  if (["reikiRoom","pgaDrive","pgaChipPutt","chipPutt","storeRoom","smokerLounge","scorpion"].includes(key)) return openPrivateScene(key);
  const rec = sceneTargets?.[key];
  if (!rec?.pos) return false;
  movePlayerToSpot(rec.pos, rec.look || null);
  setStatus(`Quick jump: ${key}`, { force: true });
  return true;
}

$sceneButtons.forEach((btn)=>{
  btn.addEventListener("click", ()=>{
    const privateKey = btn.dataset.private;
    const key = btn.dataset.scene;
    if (privateKey) openPrivateScene(privateKey);
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
  if (e.code === "Digit1") gotoScene("lobby");
  if (e.code === "Digit2") gotoScene("table");
  if (e.code === "Digit3") gotoScene("seat");
  if (e.code === "Digit4") gotoScene("reiki");
  if (e.code === "Digit5") gotoScene("pga");
  if (e.code === "Digit6") gotoScene("legends");
  if (e.code === "Digit7") gotoScene("sponsor");
  if (e.code === "Digit8") openPrivateScene("scorpion");
  if (e.code === "Digit9") openPrivateScene("reikiRoom");
  if (e.code === "Digit0") openPrivateScene("pgaDrive");
  if (e.code === "Minus") openPrivateScene("pgaChipPutt");
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
    goLegend: ()=>gotoScene("legends"),
    goSponsor: ()=>gotoScene("sponsor"),
    goScorpion: ()=>openPrivateScene("scorpion"),
    goReikiRoom: ()=>openPrivateScene("reikiRoom"),
    goPgaDrive: ()=>openPrivateScene("pgaDrive"),
    goPgaChipPutt: ()=>openPrivateScene("pgaChipPutt")
  }
});

$toggleJoints.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logoâ€¦", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);

setStatus(AUTOCAM ? "Live preview ready" : "Ready. Enter VR. Fist near face toggles teleport. Desktop scene buttons enabled. Wrist quick-jump enabled for Lobby/Table/Reiki/PGA/Legend/Sponsor/Scorpion.", { force: true });
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
  await audio.prime(); audio.stop();
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
  if (scene.userData._bootPlanetTick) scene.userData._bootPlanetTick(dt);

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
  const st = audio.getState();
  audio.stop();
}, { passive: true });
canvasEl.addEventListener("webglcontextlost", (e)=>{
  e.preventDefault();
  log("[ERR] WebGL context lost. Reloadingâ€¦");
  setStatus("WebGL context lost (reloadingâ€¦)", { force: true });
  setTimeout(()=>location.reload(), 500);
}, false);

