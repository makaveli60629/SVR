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
  console.log("[SVR]", ...args);
  if (!$log) return;
  $log.textContent += line + "\n";
  $log.scrollTop = $log.scrollHeight;
}

$toggleLog?.addEventListener("click", ()=>{
  if (!$log) return;
  $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none";
});

if (AUTOCAM) document.body.classList.add("preview-mode");

function buildEmergencyLobby(scene, err){
  const group = new THREE.Group();
  group.name = "SVR_EMERGENCY_LOBBY_FALLBACK";
  scene.add(group);
  scene.background = new THREE.Color(0x010105);
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x050507, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(8, 14, 8);
  scene.add(key);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(24, 96),
    new THREE.MeshStandardMaterial({ color: 0x171326, roughness: 0.88, metalness: 0.02 })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(24, 24, 8, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x080914, side: THREE.BackSide, emissive: 0x140028, emissiveIntensity: 0.28 })
  );
  wall.position.y = 4;
  group.add(wall);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.55, 2.55, 0.18, 72),
    new THREE.MeshStandardMaterial({ color: 0x15391f, roughness: 0.8, metalness: 0.04, emissive: 0x061606, emissiveIntensity: 0.2 })
  );
  table.position.y = 0.9;
  group.add(table);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(2.62, 0.14, 16, 96),
    new THREE.MeshStandardMaterial({ color: 0x4a2817, roughness: 0.72, metalness: 0.08 })
  );
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 0.99;
  group.add(rail);

  const msgTex = (()=>{
    const c=document.createElement('canvas'); c.width=1400; c.height=520;
    const x=c.getContext('2d');
    x.fillStyle='rgba(0,0,0,0.86)'; x.fillRect(0,0,c.width,c.height);
    x.strokeStyle='rgba(180,140,255,0.95)'; x.lineWidth=12; x.strokeRect(18,18,c.width-36,c.height-36);
    x.fillStyle='#ffffff'; x.font='bold 76px system-ui, Arial'; x.fillText('SVR SAFE BOOT FALLBACK', 70, 115);
    x.fillStyle='#d7ffee'; x.font='42px system-ui, Arial'; x.fillText('Core lobby failed, but navigation stayed alive.', 70, 195);
    x.fillStyle='#ffc4c4'; x.font='32px ui-monospace, monospace';
    const lines = String(err?.message || err || 'Unknown error').slice(0,220).match(/.{1,70}/g) || [];
    let y=275; for (const line of lines){ x.fillText(line,70,y); y+=44; }
    const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
  })();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(6.4,2.38), new THREE.MeshBasicMaterial({ map: msgTex, side: THREE.DoubleSide }));
  board.position.set(0,2.45,-5.8);
  board.lookAt(0,1.7,0);
  group.add(board);

  const seats = [
    { x: 0, z: 3.05, label: 'Player Seat' },
    { x: 2.2, z: 1.55, label: 'Bot 1' },
    { x: 2.2, z: -1.55, label: 'Bot 2' },
    { x: 0, z: -3.05, label: 'Dealer Side' },
    { x: -2.2, z: -1.55, label: 'Bot 3' },
    { x: -2.2, z: 1.55, label: 'Bot 4' }
  ];
  return {
    roomClamp: 21,
    seats,
    tableCenter: new THREE.Vector3(0,0,0),
    joinRadius: 4.1,
    previewOrbitRadius: 8.2,
    sceneTargets: {
      lobby: { pos: new THREE.Vector3(0,0,4.8), look: new THREE.Vector3(0,1.4,0) },
      table: { pos: new THREE.Vector3(0,0,3.7), look: new THREE.Vector3(0,1.2,0) },
      seat: { pos: new THREE.Vector3(0,0,3.05), look: new THREE.Vector3(0,1.2,0) },
      reiki: { pos: new THREE.Vector3(5.2,0,0), look: new THREE.Vector3(0,1.5,0) },
      pga: { pos: new THREE.Vector3(-5.2,0,0), look: new THREE.Vector3(0,1.5,0) },
      legends: { pos: new THREE.Vector3(0,0,-5.2), look: new THREE.Vector3(0,1.5,0) },
      sponsor: { pos: new THREE.Vector3(0,0,5.2), look: new THREE.Vector3(0,1.5,0) },
      scorpion: { pos: new THREE.Vector3(-4,0,-4), look: new THREE.Vector3(0,1.4,0) }
    }
  };
}

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
let world;
try{
  world = await buildSkylineRoom(scene, { log, renderer });
}catch(err){
  console.error("[SVR] Primary lobby build failed; emergency fallback active", err);
  if ($err){
    $err.style.display = AUTOCAM ? "none" : "block";
    $err.textContent = "PRIMARY LOBBY BUILD FAILED — SAFE FALLBACK ACTIVE\n" + (err?.stack || err?.message || String(err));
  }
  setStatus("Safe boot fallback active — private routes still available", { force: true });
  world = buildEmergencyLobby(scene, err);
}
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

function openPrivateScene(url){
  if (!url) return false;
  setStatus(`Opening private scene…`, { force: true });
  window.location.href = url;
  return true;
}

$sceneButtons.forEach((btn)=>{
  btn.addEventListener("click", ()=>{
    const url = btn.dataset.url;
    const key = btn.dataset.scene;
    if (url) return openPrivateScene(url);
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
  if (e.code === "Digit8") openPrivateScene("./scorpion.html");
  if (e.code === "Digit9") openPrivateScene("./reiki.html");
  if (e.code === "Digit0") openPrivateScene("./pga-drive.html");
  if (e.code === "KeyO") openPrivateScene("./store-room.html");
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
    goScorpion: ()=>gotoScene("scorpion"),
    goReikiRoom: ()=>openPrivateScene("./reiki.html"),
    goPgaDrive: ()=>openPrivateScene("./pga-drive.html"),
    goChipPutt: ()=>openPrivateScene("./chip-putt.html"),
    goStore: ()=>openPrivateScene("./store-room.html"),
    goSmoker: ()=>openPrivateScene("./smoker-lounge.html")
  }
});

$toggleJoints?.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  if ($toggleJoints) $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logo…", { force: true });
const logoTexture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
tp.setLogoTexture(logoTexture);

setStatus(AUTOCAM ? "Live preview ready" : "Ready. Enter VR. Fist near face toggles teleport. Desktop scene buttons enabled. Wrist quick-jump enabled for Lobby/Seat/Reiki/PGA/Store/Private scenes.", { force: true });
setMode(AUTOCAM ? "CAM 3 director" : "Hands: waiting…");
window.dispatchEvent(new CustomEvent("SVR_READY", { detail: { build: window.SVR_BUILD_LABEL || "PHASE-90-UNLOCKED-APPLY-BOOT-LOCK" } }));

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
