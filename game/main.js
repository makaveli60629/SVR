import * as THREE from "three";
import { createCore } from "./modules/core_scene.js";
import { createDesktopControls } from "./modules/desktop_controls.js";
import { createHands } from "./modules/hands.js";
import { createTeleportRig } from "./modules/teleport.js";
import { buildSkylineRoom } from "./modules/world_skyline.js";
import { assetUrls, loadFirstTexture } from "./modules/asset_base.js";
import { createAudioPlaylist } from "./modules/audio.js";
import { createWristWatch } from "./modules/watch.js";
import { installSvrEventBus } from "./modules/svr_event_bus.js";

const BOOT_BUILD = "PHASE-98-BOOT-SAFE-WORLD-FALLBACK";

function delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
async function withTimeout(promise, ms, label, fallbackFactory){
  let timer = null;
  try{
    return await Promise.race([
      promise,
      new Promise((resolve)=>{
        timer = setTimeout(()=>resolve({ __svrTimeout: true, label }), ms);
      })
    ]).then((value)=>{
      if (value?.__svrTimeout){
        console.warn(`[SVR BOOT] ${label} timeout after ${ms}ms; using fallback.`);
        return fallbackFactory ? fallbackFactory() : null;
      }
      return value;
    });
  }catch(err){
    console.warn(`[SVR BOOT] ${label} failed; using fallback.`, err);
    return fallbackFactory ? fallbackFactory(err) : null;
  }finally{
    if (timer) clearTimeout(timer);
  }
}

function makeLabelTexture(title, subtitle = ""){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#070612");
  g.addColorStop(1, "#170524");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(105,232,255,.9)";
  x.lineWidth = 18;
  x.strokeRect(26, 26, c.width - 52, c.height - 52);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#ffffff";
  x.font = "900 82px system-ui, Arial";
  x.fillText(title, c.width / 2, 210);
  x.fillStyle = "#d7c5ff";
  x.font = "700 40px system-ui, Arial";
  x.fillText(subtitle, c.width / 2, 312);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createFallbackWorld(scene, log = console.log){
  window.__SVR_BOOT_FALLBACK = true;
  log("[BOOT SAFE] Using fallback lobby because full world did not finish booting.");
  const R = 12;
  const tableCenter = new THREE.Vector3(0, 0, 0);
  scene.background = new THREE.Color(0x050508);

  const hemi = new THREE.HemisphereLight(0x99ccff, 0x241428, 1.18);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 8, 5);
  scene.add(key);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(R, 96),
    new THREE.MeshStandardMaterial({ color: 0x16101f, roughness: 0.92, metalness: 0.02 })
  );
  floor.rotation.x = -Math.PI * 0.5;
  scene.add(floor);

  const grid = new THREE.GridHelper(R * 2, 24, 0x5b40aa, 0x242040);
  grid.position.y = 0.012;
  scene.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0b0913, roughness: 0.86, emissive: 0x12051c, emissiveIntensity: 0.12, side: THREE.DoubleSide });
  const wallSpecs = [
    [0, 2.2, -R, 0],
    [0, 2.2, R, Math.PI],
    [-R, 2.2, 0, Math.PI * 0.5],
    [R, 2.2, 0, -Math.PI * 0.5]
  ];
  wallSpecs.forEach(([x,y,z,rot])=>{
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, 4.4), wallMat.clone());
    wall.position.set(x,y,z);
    wall.rotation.y = rot;
    scene.add(wall);
  });

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.25, 0.18, 64),
    new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.9, metalness: 0.03, emissive: 0x190025, emissiveIntensity: 0.18 })
  );
  table.position.y = 0.82;
  table.scale.z = 0.68;
  scene.add(table);

  const felt = new THREE.Mesh(
    new THREE.CircleGeometry(1.92, 64),
    new THREE.MeshStandardMaterial({ color: 0x22102f, roughness: 0.95, emissive: 0x120018, emissiveIntensity: 0.12, side: THREE.DoubleSide })
  );
  felt.rotation.x = -Math.PI * 0.5;
  felt.scale.z = 0.66;
  felt.position.y = 0.925;
  scene.add(felt);

  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.55, 1.25),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture("SVR POKER", "BOOT SAFE LOBBY"), transparent: true, side: THREE.DoubleSide })
  );
  logo.position.set(0, 2.9, -R + 0.05);
  scene.add(logo);

  const portalNames = [
    ["PGA HUB", -6.6, 2.5, -R + 0.08],
    ["VR STORE", 6.6, 2.5, -R + 0.08],
    ["SCORPION", -6.6, 2.5, R - 0.08],
    ["LOUNGE", 6.6, 2.5, R - 0.08]
  ];
  portalNames.forEach(([name,x,y,z])=>{
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.18),
      new THREE.MeshBasicMaterial({ map: makeLabelTexture(name, "portal route preserved"), transparent: true, side: THREE.DoubleSide })
    );
    p.position.set(x,y,z);
    if (z > 0) p.rotation.y = Math.PI;
    scene.add(p);
  });

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 48, 24),
    new THREE.MeshBasicMaterial({ color: 0xe9e6ff })
  );
  moon.position.set(-5.5, 9.0, -18);
  scene.add(moon);
  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 40, 20),
    new THREE.MeshBasicMaterial({ color: 0xd76b3a })
  );
  mars.position.set(5.8, 8.2, -21);
  scene.add(mars);

  const seats = [
    { label: "Open South Seat", x: 0, z: 3.25 },
    { label: "Left Seat", x: -3.15, z: 0.4 },
    { label: "Right Seat", x: 3.15, z: 0.4 },
    { label: "North Seat", x: 0, z: -3.25 }
  ];
  seats.forEach((seat)=>{
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.028, 10, 40),
      new THREE.MeshBasicMaterial({ color: 0x69e8ff, transparent: true, opacity: 0.82 })
    );
    marker.rotation.x = Math.PI * 0.5;
    marker.position.set(seat.x, 0.045, seat.z);
    scene.add(marker);
  });

  const roomClamp = (x, z)=>({
    x: Math.max(-R + 1.0, Math.min(R - 1.0, x)),
    z: Math.max(-R + 1.0, Math.min(R - 1.0, z))
  });
  const sceneTargets = {
    lobby: { pos: new THREE.Vector3(0, 0, 4.8), look: tableCenter },
    table: { pos: new THREE.Vector3(0, 0, 3.25), look: tableCenter },
    seat: { pos: new THREE.Vector3(0, 0, 3.25), look: tableCenter },
    pga: { pos: new THREE.Vector3(-6.6, 0, -9.2), look: new THREE.Vector3(-6.6, 1.5, -12) },
    store: { pos: new THREE.Vector3(6.6, 0, -9.2), look: new THREE.Vector3(6.6, 1.5, -12) },
    scorpion: { url: "./scorpion.html" },
    reikiRoom: { url: "./reiki.html" },
    pgaDrive: { url: "./range.html" },
    chipPutt: { url: "./chip-putt.html" },
    loungeRoom: { url: "./lounge.html" }
  };

  scene.userData._tickWorld = (dt)=>{
    moon.rotation.y += dt * 0.04;
    mars.rotation.y += dt * 0.06;
  };

  return { roomClamp, seats, tableCenter, joinRadius: 4.4, previewOrbitRadius: 8.8, sceneTargets };
}

window.svrBootStage?.("Installing SVR event bus…");
installSvrEventBus();

const params = new URLSearchParams(location.search);
const IN_IFRAME = window.self !== window.top;
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
  window.svrBootStage?.(text);
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
  if ($log){
    $log.textContent += line + "\n";
    $log.scrollTop = $log.scrollHeight;
  }
  console.log("[SVR]", ...args);
}

$toggleLog?.addEventListener("click", ()=>{
  $log.style.display = ($log.style.display === "none" || !$log.style.display) ? "block" : "none";
});

if (AUTOCAM) document.body.classList.add("preview-mode");

setStatus("Creating renderer…", { force: true });
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

setStatus("Loading world with boot-safe timeout…", { force: true });
const world = await withTimeout(
  buildSkylineRoom(scene, { log, renderer }),
  8500,
  "Full skyline world",
  ()=>createFallbackWorld(scene, log)
);
const { roomClamp, seats, tableCenter, joinRadius, previewOrbitRadius = 8.8, sceneTargets = {} } = world || createFallbackWorld(scene, log);

setStatus("Loading hands and teleport…", { force: true });
const hands = createHands({ scene, renderer, log });
const tp = createTeleportRig({ scene, renderer, camera, roomClamp, log });

setStatus("Loading audio…", { force: true });
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
function moveDesktopToSeat(seat){ camera.position.set(seat.x, 1.12, seat.z); camera.lookAt(tableCenter.x, 1.0, tableCenter.z); }
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
  return true;
}
function leaveTable(){
  seated = false;
  seatIndex = -1;
  if (renderer.xr.isPresenting) tp.setPlayerPose(0, 0, 4.8);
  else { camera.position.set(0, 1.6, 4.8); camera.lookAt(tableCenter.x, 1.15, tableCenter.z); }
  return true;
}
function movePlayerToSpot(target, lookTarget = null){
  if (!target) return;
  if (renderer.xr.isPresenting) tp.setPlayerPose(target.x, 0, target.z);
  else {
    camera.position.set(target.x, 1.6, target.z);
    if (lookTarget) camera.lookAt(lookTarget.x, 1.45, lookTarget.z);
  }
}
function gotoScene(key){
  const rec = sceneTargets?.[key];
  if (!rec) return false;
  if (rec.url){ setStatus(`Opening portal: ${key}`, { force: true }); window.location.href = rec.url; return true; }
  if (!rec.pos) return false;
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
  if (e.code === "Digit0") gotoScene("lounge");
  if (e.code === "Minus") gotoScene("store");
  if (e.code === "Equal") gotoScene("loungeRoom");
});

setStatus("Loading watch…", { force: true });
let watch = null;
try{
  watch = createWristWatch({
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
      toggleAudio: ()=>audio.toggle(), nextTrack: ()=>audio.next(), joinTable, leaveTable, toggleTeleport: ()=>tp.toggleMode(),
      goLobby: ()=>gotoScene("lobby"), goTable: ()=>gotoScene("table"), goSeat: ()=>gotoScene("seat"), goReiki: ()=>gotoScene("reiki"),
      goPga: ()=>gotoScene("pga"), goLegend: ()=>gotoScene("legends"), goSponsor: ()=>gotoScene("sponsor"), goScorpion: ()=>gotoScene("scorpion"),
      goReikiRoom: ()=>gotoScene("reikiRoom"), goPgaDrive: ()=>gotoScene("pgaDrive"), goChipPutt: ()=>gotoScene("chipPutt"),
      goStore: ()=>gotoScene("store"), goLounge: ()=>gotoScene("lounge"), goLoungeRoom: ()=>gotoScene("loungeRoom")
    }
  });
}catch(err){
  log("[BOOT SAFE] Watch failed but game will continue", err?.message || err);
  watch = { update(){} };
}

$toggleJoints?.addEventListener("click", ()=>{
  const on = hands.toggleDebug();
  $toggleJoints.textContent = on ? "Joints On" : "Joints";
});

setStatus("Loading logo with timeout…", { force: true });
const logoTexture = await withTimeout(
  loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace }),
  2200,
  "Logo texture",
  ()=>null
);
if (logoTexture) tp.setLogoTexture(logoTexture);

setStatus(AUTOCAM ? "Live preview ready" : `Ready (${BOOT_BUILD}). Enter VR. Hold pinch/fist/A/grip/trigger to aim; release to teleport.`, { force: true });
setMode(AUTOCAM ? "CAM 3 director" : (window.__SVR_BOOT_FALLBACK ? "Boot-safe lobby" : "Hands: waiting…"));
window.svrBootReady?.();

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
  try{
    const now = performance.now();
    const dt = Math.min((now - tPrev) / 1000, 0.033);
    tPrev = now;
    if (!renderer.xr.isPresenting){
      if (!AUTOCAM && desktop) desktop.update(dt);
      else if (AUTOCAM){
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
      tp.update({ dt, leftHand, rightHand, leftController, rightController, statusCb: (text)=>setStatus(text), modeCb: (text)=>setMode(text) });
    }
    if (watch) watch.update(dt, hands.getLeft(), hands.getRight());
    renderer.render(scene, camera);
  }catch(err){
    log("[ANIMATION ERROR]", err?.stack || err?.message || err);
  }
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
