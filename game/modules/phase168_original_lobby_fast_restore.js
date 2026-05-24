import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE = "PHASE-168-ORIGINAL-LOBBY-FAST-RESTORE-LOCK";
const LOGO_URL = "../logo.png";
const ROOM = 23;
const SNAP = Math.PI / 4;
const ROUTES = {
  REIKI: "./private-scene.html?scene=reiki&v=phase168-original-lobby-fast",
  PGA: "./private-scene.html?scene=pga&v=phase168-original-lobby-fast",
  SCORPION: "./private-scene.html?scene=scorpion&v=phase168-original-lobby-fast",
  STORE: "../site/store.html",
  LOUNGE: "./private-scene.html?scene=lounge&v=phase168-original-lobby-fast",
  SEAT: "#seat"
};
const PORTALS = [
  { name: "REIKI", x: -10.5, z: -18.2, color: 0xb48cff, sub: "PRIVATE MEDITATION" },
  { name: "PGA", x: 0, z: -19.2, color: 0x7ff5c7, sub: "PRIVATE GOLF" },
  { name: "SCORPION", x: 10.5, z: -18.2, color: 0xff5572, sub: "PRIVATE POKER" },
  { name: "STORE", x: -19.5, z: 0.5, color: 0x00ddff, sub: "SVR STORE" },
  { name: "LOUNGE", x: 19.5, z: 0.5, color: 0xf6e27f, sub: "SOCIAL LOUNGE" },
  { name: "SEAT", x: 0, z: 10.8, color: 0xffffff, sub: "POKER SEAT" }
];

window.SVR_BUILD_PHASE = PHASE;
window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
window.SVR_PHASE168_ORIGINAL_LOBBY_FAST = {
  phase: PHASE,
  siteTouched: false,
  gameTouched: true,
  purpose: "Fast original-style lobby restore with correct floor, walls, logo, portals, sky, Moon/Mars, and Quest-safe locomotion.",
  rules: {
    noMusic: true,
    noVisibleControllers: true,
    rightControllerMovement: true,
    snapTurnDegrees: 45,
    triggerReleaseTeleport: true,
    handFistTeleport: true,
    lobbyOnlyStorefronts: true,
    privateScenesStaySeparate: true,
    officialLogoOnly: true
  },
  routes: ROUTES,
  previousStableBuild: "PHASE-166-SCORPION-BET-LINE-CHIP-STACKS-REALISM-LOCK",
  nextBuild: "PHASE-169-LOBBY-ORIGINAL-ASSET-PASS-AND-POKERJS-LOCK"
};

const app = document.getElementById("app") || document.body;
const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
function setStatus(text) { if (statusEl) statusEl.textContent = text; }
function setMode(text) { if (modeEl) modeEl.textContent = text; }
function updateBuildPill(text) {
  const pill = [...document.querySelectorAll(".pill")].find(el => /BUILD:/.test(el.textContent || ""));
  if (pill) pill.textContent = text;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020108);
scene.matrixWorldAutoUpdate = true;

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.06, 320);
camera.position.set(0, 1.62, 0);

const dolly = new THREE.Group();
dolly.name = "SVR_PHASE168_SAFE_DOLLY_OUTSIDE_TABLE";
dolly.position.set(0, 0, 8.5);
dolly.add(camera);
scene.add(dolly);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  depth: true,
  stencil: false,
  powerPreference: "high-performance"
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 0.62));
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
try {
  renderer.xr.setFramebufferScaleFactor?.(0.62);
  renderer.xr.setFoveation?.(0.55);
} catch {}
app.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer, { requiredFeatures: ["local-floor"], optionalFeatures: ["bounded-floor", "hand-tracking"] }));

const loader = new THREE.TextureLoader();
function texture(url, rx = 1, ry = 1, srgb = true) {
  const t = loader.load(url, undefined, undefined, () => {});
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 2;
  return t;
}
function canvasTex(draw, w = 512, h = 512) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  draw(x, c);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function starMap() {
  return canvasTex((x, c) => {
    const g = x.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, "#050014");
    g.addColorStop(0.55, "#050019");
    g.addColorStop(1, "#000006");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    let seed = 90210;
    const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 700; i++) {
      const s = rnd() < 0.08 ? 2 : 1;
      x.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.72})`;
      x.fillRect(rnd() * c.width, rnd() * c.height * 0.72, s, s);
    }
    x.fillStyle = "rgba(124,44,255,.18)";
    x.fillRect(0, c.height * 0.70, c.width, c.height * 0.22);
  }, 1024, 512);
}
function glowMap(color) {
  return canvasTex(x => {
    const g = x.createRadialGradient(256, 256, 5, 256, 256, 252);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 512, 512);
  });
}
function labelMap(title, sub, color) {
  return canvasTex((x, c) => {
    x.clearRect(0, 0, c.width, c.height);
    x.fillStyle = "rgba(0,0,0,.90)";
    x.fillRect(28, 32, 968, 192);
    x.strokeStyle = color;
    x.lineWidth = 9;
    x.strokeRect(44, 50, 936, 156);
    x.fillStyle = "#ffffff";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = "900 64px system-ui,Arial";
    x.fillText(title, 512, 104);
    x.fillStyle = "#e6d7ff";
    x.font = "900 30px system-ui,Arial";
    x.fillText(sub, 512, 168);
  }, 1024, 256);
}
function handTex() {
  return canvasTex(x => {
    const g = x.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, "#13031f");
    g.addColorStop(0.38, "#6425a8");
    g.addColorStop(0.72, "#0b1735");
    g.addColorStop(1, "#05020a");
    x.fillStyle = g;
    x.fillRect(0, 0, 512, 512);
    x.strokeStyle = "rgba(0,230,255,.30)";
    x.lineWidth = 9;
    x.strokeRect(38, 38, 436, 436);
    x.strokeStyle = "rgba(255,255,255,.18)";
    for (let i = 0; i < 10; i++) {
      x.beginPath();
      x.moveTo(-30, i * 55);
      x.bezierCurveTo(130, i * 42, 330, i * 75, 555, i * 34);
      x.stroke();
    }
  });
}

const logoTex = texture(LOGO_URL, 1, 1);
logoTex.wrapS = logoTex.wrapT = THREE.ClampToEdgeWrapping;
const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });

const floorMat = new THREE.MeshBasicMaterial({ map: texture("./assets/texture/slate_basecolor.jpg", 7, 7), color: 0xffffff, toneMapped: false });
const wallMat = new THREE.MeshBasicMaterial({ map: texture("./assets/texture/stonebrick_wall_basecolor.png", 4, 1), side: THREE.DoubleSide, toneMapped: false });
const trimMat = new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.72, toneMapped: false });
const goldMat = new THREE.MeshBasicMaterial({ color: 0xf6e27f, transparent: true, opacity: 0.80, toneMapped: false });
const glassMat = new THREE.MeshBasicMaterial({ color: 0x0ad7ff, transparent: true, opacity: 0.13, side: THREE.DoubleSide, toneMapped: false });

const sky = new THREE.Mesh(new THREE.SphereGeometry(780, 32, 16), new THREE.MeshBasicMaterial({ map: starMap(), side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }));
sky.frustumCulled = false;
scene.add(sky);

const moon = new THREE.Mesh(new THREE.SphereGeometry(12, 36, 18), new THREE.MeshBasicMaterial({ map: texture("./assets/texture/moon_diffuse.png", 1, 1), color: 0xffffff, fog: false, toneMapped: false }));
moon.position.set(-72, 82, -150);
scene.add(moon);
const mars = new THREE.Mesh(new THREE.SphereGeometry(7.5, 30, 16), new THREE.MeshBasicMaterial({ map: texture("./assets/texture/mars/diffuse_1k.jpg", 1, 1), color: 0xffb07a, fog: false, toneMapped: false }));
mars.position.set(120, 72, -92);
scene.add(mars);
const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap("rgba(255,255,255,.72)"), color: 0xdfe8ff, transparent: true, opacity: 0.38, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
moonGlow.scale.set(54, 54, 1);
moon.add(moonGlow);
const marsGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap("rgba(255,100,70,.72)"), color: 0xff9b6b, transparent: true, opacity: 0.30, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
marsGlow.scale.set(34, 34, 1);
mars.add(marsGlow);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM * 2, ROOM * 2), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.name = "SVR_PHASE168_CORRECT_TEXTURE_FLOOR_RESTORED";
scene.add(floor);

function wall(name, x, z, ry, w = ROOM * 2, h = 6.6) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
  m.name = name;
  m.position.set(x, h / 2, z);
  m.rotation.y = ry;
  scene.add(m);
  return m;
}
wall("SVR_PHASE168_NORTH_ORIGINAL_LOBBY_WALL", 0, -ROOM, 0);
wall("SVR_PHASE168_SOUTH_ORIGINAL_LOBBY_WALL", 0, ROOM, Math.PI);
wall("SVR_PHASE168_EAST_ORIGINAL_LOBBY_WALL", ROOM, 0, -Math.PI / 2);
wall("SVR_PHASE168_WEST_ORIGINAL_LOBBY_WALL", -ROOM, 0, Math.PI / 2);

function box(name, x, y, z, sx, sy, sz, mat) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  b.name = name;
  b.position.set(x, y, z);
  scene.add(b);
  return b;
}
[[-ROOM, -ROOM], [ROOM, -ROOM], [-ROOM, ROOM], [ROOM, ROOM]].forEach(([x, z], i) => box(`SVR_PHASE168_CORNER_PILLAR_${i}`, x, 3.3, z, 0.55, 6.6, 0.55, trimMat));
box("SVR_PHASE168_NORTH_GOLD_TRIM", 0, 6.66, -ROOM + 0.02, ROOM * 2, 0.12, 0.18, goldMat);
box("SVR_PHASE168_SOUTH_GOLD_TRIM", 0, 6.66, ROOM - 0.02, ROOM * 2, 0.12, 0.18, goldMat);
box("SVR_PHASE168_EAST_GOLD_TRIM", ROOM - 0.02, 6.66, 0, 0.18, 0.12, ROOM * 2, goldMat);
box("SVR_PHASE168_WEST_GOLD_TRIM", -ROOM + 0.02, 6.66, 0, 0.18, 0.12, ROOM * 2, goldMat);

const brand = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), logoMat.clone());
brand.name = "SVR_PHASE168_OFFICIAL_LOGO_NORTH_WALL";
brand.position.set(0, 3.45, -ROOM + 0.045);
brand.renderOrder = 50;
scene.add(brand);

const skylineMatA = new THREE.MeshBasicMaterial({ map: texture("./assets/texture/BuildingsHighRise0558_download600.jpg", 3, 1), side: THREE.DoubleSide, toneMapped: false });
const skylineMatB = new THREE.MeshBasicMaterial({ map: texture("./assets/texture/BuildingsHighRise0551_1_download600.jpg", 4, 1), side: THREE.DoubleSide, toneMapped: false });
function skyline(name, x, z, ry, mat) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(ROOM * 2.2, 9.2), mat);
  s.name = name;
  s.position.set(x, 8.2, z);
  s.rotation.y = ry;
  scene.add(s);
}
skyline("SVR_PHASE168_NORTH_SKYLINE_RESTORE", 0, -ROOM - 0.15, 0, skylineMatA);
skyline("SVR_PHASE168_EAST_SKYLINE_RESTORE", ROOM + 0.15, 0, -Math.PI / 2, skylineMatB);
skyline("SVR_PHASE168_WEST_SKYLINE_RESTORE", -ROOM - 0.15, 0, Math.PI / 2, skylineMatB);

const table = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.24, 64), new THREE.MeshBasicMaterial({ map: texture("./assets/texture/tablefelt.png", 1, 1), color: 0xffffff, toneMapped: false }));
table.name = "SVR_PHASE168_CENTER_POKER_SHOWPIECE";
table.position.set(0, 0.55, 0);
scene.add(table);
const tableLogo = new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), logoMat.clone());
tableLogo.rotation.x = -Math.PI / 2;
tableLogo.position.set(0, 0.682, 0);
tableLogo.renderOrder = 60;
scene.add(tableLogo);
const tableRail = new THREE.Mesh(new THREE.RingGeometry(2.72, 2.88, 72), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.54, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
tableRail.rotation.x = -Math.PI / 2;
tableRail.position.y = 0.70;
scene.add(tableRail);

const portalMeshes = [];
function makePortal(p) {
  const route = ROUTES[p.name];
  const group = new THREE.Group();
  group.name = `SVR_PHASE168_PORTAL_${p.name}`;
  group.position.set(p.x, 0.08, p.z);
  scene.add(group);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.90, 1.22, 64), new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  const disk = new THREE.Mesh(new THREE.CircleGeometry(0.72, 42), logoMat.clone());
  disk.rotation.x = -Math.PI / 2;
  disk.position.y = 0.014;
  disk.renderOrder = 80;
  group.add(disk);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.05), new THREE.MeshBasicMaterial({ map: labelMap(p.name, p.sub, `#${p.color.toString(16).padStart(6, "0")}`), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  sign.position.set(0, 1.65, 0);
  sign.lookAt(0, 1.65, 8.5);
  group.add(sign);

  let faceX = p.x, faceZ = p.z, faceRy = 0;
  if (p.z < -12) { faceZ = -ROOM + 0.13; faceRy = 0; }
  else if (p.x < -12) { faceX = -ROOM + 0.13; faceRy = Math.PI / 2; }
  else if (p.x > 12) { faceX = ROOM - 0.13; faceRy = -Math.PI / 2; }
  else { faceZ = ROOM - 0.13; faceRy = Math.PI; }

  const facade = new THREE.Group();
  facade.name = `SVR_PHASE168_STOREFRONT_${p.name}`;
  facade.position.set(faceX, 2.55, faceZ);
  facade.rotation.y = faceRy;
  scene.add(facade);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.7), glassMat);
  facade.add(glass);
  const facadeLogo = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), logoMat.clone());
  facadeLogo.position.set(0, 0.77, 0.035);
  facadeLogo.renderOrder = 70;
  facade.add(facadeLogo);
  const facadeText = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 0.90), new THREE.MeshBasicMaterial({ map: labelMap(p.name, route === "#seat" ? "LOBBY" : "PRIVATE ROUTE", `#${p.color.toString(16).padStart(6, "0")}`), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  facadeText.position.set(0, -0.90, 0.040);
  facadeText.renderOrder = 71;
  facade.add(facadeText);

  portalMeshes.push({ data: p, route, group, ring, disk });
}
PORTALS.forEach(makePortal);

const target = new THREE.Group();
target.visible = false;
scene.add(target);
const targetLogo = new THREE.Mesh(new THREE.CircleGeometry(0.92, 64), logoMat.clone());
targetLogo.rotation.x = -Math.PI / 2;
targetLogo.renderOrder = 1000;
target.add(targetLogo);
const targetRing = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.42, 72), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false }));
targetRing.rotation.x = -Math.PI / 2;
targetRing.position.y = 0.018;
targetRing.renderOrder = 1001;
target.add(targetRing);
const aimLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0xe6d7ff, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false }));
aimLine.visible = false;
aimLine.renderOrder = 1002;
scene.add(aimLine);

scene.add(new THREE.HemisphereLight(0xffffff, 0x151020, 0.92));

let rightController = null;
let gamepad = null;
let armed = false;
let armedBy = "none";
let valid = false;
let cooldownUntil = 0;
let triggerDown = false;
let gripDown = false;
let selectHeld = false;
let snapCooldown = 0;
let hoverPortal = null;
let lastRouteKey = "";
let routeTimer = null;
const origin = new THREE.Vector3();
const dir = new THREE.Vector3();
const dirInv = new THREE.Vector3();
const hitA = new THREE.Vector3();
const hitB = new THREE.Vector3();
const fallback = new THREE.Vector3();
const final = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camForward = new THREE.Vector3();
const moveVec = new THREE.Vector3();
const headBefore = new THREE.Vector3();
const headAfter = new THREE.Vector3();
const wristP = new THREE.Vector3();
const tipP = new THREE.Vector3();
const q = new THREE.Quaternion();

for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  c.visible = false;
  dolly.add(c);
  c.addEventListener("connected", e => {
    c.inputSource = e.data;
    if (e.data?.handedness === "right") {
      rightController = c;
      gamepad = e.data.gamepad || null;
      setStatus("Right controller connected");
    }
  });
  c.addEventListener("disconnected", () => {
    if (rightController === c) { rightController = null; gamepad = null; }
  });
  c.addEventListener("selectstart", () => {
    if (c !== rightController) return;
    selectHeld = true;
    arm("trigger");
  });
  c.addEventListener("selectend", () => {
    if (c !== rightController) return;
    selectHeld = false;
    if (armed && valid) commitTeleport("selectend");
    disarm();
  });
  c.addEventListener("squeezestart", () => { if (c === rightController) arm("grip-preview"); });
  c.addEventListener("squeezeend", () => { if (c === rightController && armedBy === "grip-preview" && !selectHeld) disarm(); });
}

const handTexture = handTex();
const handStates = [];
const jointNames = ["wrist", "thumb-tip", "index-finger-tip", "middle-finger-tip", "ring-finger-tip", "pinky-finger-tip"];
function handMaterial(kind) {
  return new THREE.MeshBasicMaterial({ map: handTexture, color: kind === "wrist" ? 0x7b35ff : 0xb48cff, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
}
for (let i = 0; i < 2; i++) {
  const hand = renderer.xr.getHand(i);
  hand.visible = false;
  dolly.add(hand);
  const vis = new THREE.Group();
  scene.add(vis);
  const meshes = {};
  jointNames.forEach(j => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(j === "wrist" ? 0.055 : 0.031, 12, 8), handMaterial(j));
    m.visible = false;
    vis.add(m);
    meshes[j] = m;
  });
  const fire = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 10), new THREE.MeshBasicMaterial({ color: 0xb000ff, transparent: true, opacity: 0.62, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  fire.visible = false;
  scene.add(fire);
  handStates.push({ hand, meshes, fire, fist: false, wasFist: false, fistStart: 0, aimOrigin: new THREE.Vector3(), aimDir: new THREE.Vector3(0, -0.30, -1), hasAim: false });
}

const hud = document.createElement("div");
hud.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:120;max-width:calc(100vw - 24px);padding:9px 12px;border:1px solid rgba(180,140,255,.95);border-radius:14px;background:rgba(0,0,0,.84);color:#e6d7ff;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none;box-shadow:0 12px 34px rgba(0,0,0,.55)";
hud.textContent = "PHASE 168 FAST ORIGINAL LOBBY\nCorrect floor/walls/logo/portals restored. Site untouched.";
document.body.appendChild(hud);

const debug = document.createElement("div");
debug.style.cssText = "position:fixed;left:12px;top:54px;z-index:90;padding:7px 10px;border:1px solid #b48cff;border-radius:12px;background:rgba(0,0,0,.74);color:#e6d7ff;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none";
debug.textContent = "Phase 168 booting";
document.body.appendChild(debug);

function xrCam() { return renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera; }
function getGP() { return gamepad || rightController?.inputSource?.gamepad; }
function button(i) { return getGP()?.buttons?.[i]?.value || 0; }
function axes() { return getGP()?.axes || []; }
function dz(v) { return Math.abs(v) < 0.14 ? 0 : v; }
function activeStick() {
  const a = axes();
  const p0 = { x: dz(a[0] || 0), y: dz(a[1] || 0), name: "01" };
  const p1 = { x: dz(a[2] || 0), y: dz(a[3] || 0), name: "23" };
  return Math.hypot(p1.x, p1.y) >= Math.hypot(p0.x, p0.y) ? p1 : p0;
}
function clampDolly() {
  dolly.position.x = THREE.MathUtils.clamp(dolly.position.x, -ROOM + 2.5, ROOM - 2.5);
  dolly.position.z = THREE.MathUtils.clamp(dolly.position.z, -ROOM + 2.5, ROOM - 2.5);
}
function headingForward() {
  moveVec.set(-Math.sin(dolly.rotation.y), 0, -Math.cos(dolly.rotation.y)).normalize();
  return moveVec;
}
function snapTurn(amount) {
  const c = xrCam();
  c.getWorldPosition(headBefore);
  dolly.rotation.y += amount;
  dolly.updateMatrixWorld(true);
  c.getWorldPosition(headAfter);
  dolly.position.x += headBefore.x - headAfter.x;
  dolly.position.z += headBefore.z - headAfter.z;
  clampDolly();
  setStatus(amount > 0 ? "Snap right 45" : "Snap left 45");
}
function move(dt) {
  if (!renderer.xr.isPresenting || armed) return;
  const s = activeStick();
  const ax = Math.abs(s.x);
  const ay = Math.abs(s.y);
  const now = performance.now();
  if (ax > 0.72 && ax > ay * 1.35 && now > snapCooldown) {
    snapTurn(Math.sign(s.x) * -SNAP);
    snapCooldown = now + 420;
    return;
  }
  if (ay > 0.14) {
    dolly.position.addScaledVector(headingForward(), -s.y * dt * 1.65);
    clampDolly();
  }
}
function floorHit(o, d, out) {
  if (Math.abs(d.y) < 0.035) return false;
  const t = -o.y / d.y;
  if (!isFinite(t) || t < 0.08 || t > 14) return false;
  out.copy(o).addScaledVector(d, t);
  out.y = 0;
  return true;
}
function scorePoint(p) {
  const vx = p.x - camPos.x;
  const vz = p.z - camPos.z;
  const front = vx * camForward.x + vz * camForward.z;
  const dist = Math.hypot(vx, vz);
  return front < -0.25 ? -9999 : front * 2 - Math.abs(dist - 4.3) * 0.24;
}
function findPortal() {
  hoverPortal = null;
  for (const p of portalMeshes) {
    if (Math.hypot(final.x - p.data.x, final.z - p.data.z) < 1.42) { hoverPortal = p; break; }
  }
  portalMeshes.forEach(p => {
    p.ring.material.opacity = p === hoverPortal ? 1 : 0.62;
    p.disk.material.opacity = p === hoverPortal ? 0.96 : 0.72;
  });
  return hoverPortal;
}
function arm(kind) {
  if (performance.now() < cooldownUntil) return;
  armed = true;
  armedBy = kind;
  setStatus(kind === "hand-fist" ? "Fist aim active" : kind === "grip-preview" ? "Grip preview active" : "Trigger aim active");
}
function disarm() {
  armed = false;
  armedBy = "none";
  valid = false;
  target.visible = false;
  aimLine.visible = false;
}
function computeTarget(useHand = false) {
  const c = xrCam();
  c.getWorldPosition(camPos);
  c.getWorldDirection(camForward);
  camForward.y = 0;
  if (camForward.lengthSq() < 0.001) camForward.copy(headingForward());
  camForward.normalize();
  fallback.copy(camPos).addScaledVector(camForward, 4.3).setY(0);

  if (useHand) {
    const h = handStates.find(s => s.fist && s.hasAim);
    if (h) {
      origin.copy(h.aimOrigin);
      dir.copy(h.aimDir);
      if (!floorHit(origin, dir, final)) final.copy(origin).addScaledVector(dir, 4.3).setY(0);
    } else final.copy(fallback);
  } else if (rightController) {
    rightController.updateWorldMatrix(true, false);
    rightController.getWorldPosition(origin);
    rightController.getWorldDirection(dir);
    dir.normalize();
    dirInv.copy(dir).multiplyScalar(-1);
    const okA = floorHit(origin, dir, hitA);
    const okB = floorHit(origin, dirInv, hitB);
    const scA = okA ? scorePoint(hitA) : -9999;
    const scB = okB ? scorePoint(hitB) : -9999;
    if (okA && scA >= scB) final.copy(hitA);
    else if (okB) final.copy(hitB);
    else final.copy(fallback);
  } else final.copy(fallback);

  const vx = final.x - camPos.x;
  const vz = final.z - camPos.z;
  if (vx * camForward.x + vz * camForward.z < 0.35) final.copy(fallback);
  final.x = THREE.MathUtils.clamp(final.x, -ROOM + 2.0, ROOM - 2.0);
  final.z = THREE.MathUtils.clamp(final.z, -ROOM + 2.0, ROOM - 2.0);
  final.y = 0;
  valid = true;
  findPortal();
  return true;
}
function showTarget(useHand = false) {
  if (!computeTarget(useHand)) return;
  target.visible = true;
  aimLine.visible = true;
  target.position.set(final.x, 0.075, final.z);
  const attr = aimLine.geometry.attributes.position;
  const ox = origin.x || camPos.x;
  const oy = origin.y || 1.2;
  const oz = origin.z || camPos.z;
  attr.setXYZ(0, ox, oy, oz);
  attr.setXYZ(1, final.x, 0.16, final.z);
  attr.needsUpdate = true;
}
function routePortal(portal, reason) {
  if (!portal) return;
  const name = portal.data.name;
  const url = portal.route;
  const key = `${name}|${reason}|${Date.now()}`;
  lastRouteKey = key;
  window.SVR_PHASE168_LAST_PORTAL = { name, url, reason, at: new Date().toISOString() };
  if (url === "#seat") {
    dolly.position.set(0, 0, 8.5);
    setStatus("Returned to safe front player seat");
    setMode("Seat lock");
    return;
  }
  clearTimeout(routeTimer);
  hud.textContent = `PHASE 168 FAST ORIGINAL LOBBY\n${name} selected → routing now.`;
  setStatus(`Routing to ${name}`);
  setMode("Private room route");
  routeTimer = setTimeout(() => {
    if (lastRouteKey === key) window.location.href = url;
  }, 260);
}
function commitTeleport(reason) {
  if (performance.now() < cooldownUntil || !valid) return;
  cooldownUntil = performance.now() + 720;
  const c = xrCam();
  c.getWorldPosition(headBefore);
  dolly.position.x += final.x - headBefore.x;
  dolly.position.z += final.z - headBefore.z;
  clampDolly();
  const portal = findPortal();
  if (portal) routePortal(portal, reason);
  else {
    setStatus("Teleported");
    setMode("Lobby movement");
  }
  window.SVR_PHASE168_LAST_TELEPORT = { reason, target: { x: final.x, z: final.z }, portal: portal?.data?.name || null, at: new Date().toISOString() };
}
function controllerInput() {
  const tr = button(0);
  const gr = button(1);
  if (tr > 0.18 && !triggerDown) arm("trigger");
  if (triggerDown && tr <= 0.10) {
    if (armed && valid) commitTeleport("trigger-release");
    if (armedBy !== "grip-preview" && armedBy !== "hand-fist") disarm();
  }
  if (gr > 0.25 && !gripDown) arm("grip-preview");
  if (gripDown && gr <= 0.12 && !selectHeld && armedBy === "grip-preview") disarm();
  triggerDown = tr > 0.18;
  gripDown = gr > 0.25;
}
function updateHands() {
  handStates.forEach(s => {
    const wrist = s.hand.joints?.wrist;
    let shown = false;
    s.hasAim = false;
    if (wrist) {
      wrist.getWorldPosition(wristP);
      wrist.getWorldQuaternion(q);
      s.aimOrigin.copy(wristP);
      s.aimDir.set(0, -0.22, -1).applyQuaternion(q).normalize();
      if (s.aimDir.y > -0.08) s.aimDir.y = -0.30;
      s.aimDir.normalize();
      s.hasAim = true;
      s.meshes.wrist.position.copy(wristP);
      s.meshes.wrist.visible = true;
      shown = true;
      let curled = 0, total = 0;
      ["index-finger-tip", "middle-finger-tip", "ring-finger-tip", "pinky-finger-tip"].forEach(j => {
        const joint = s.hand.joints?.[j];
        if (!joint) return;
        joint.getWorldPosition(tipP);
        s.meshes[j].position.copy(tipP);
        s.meshes[j].visible = true;
        total++;
        if (tipP.distanceTo(wristP) < 0.145) curled++;
      });
      const thumb = s.hand.joints?.["thumb-tip"];
      if (thumb) {
        thumb.getWorldPosition(tipP);
        s.meshes["thumb-tip"].position.copy(tipP);
        s.meshes["thumb-tip"].visible = true;
      }
      s.fist = total >= 3 && curled >= 3;
      s.fire.visible = s.fist;
      if (s.fist) {
        s.fire.position.copy(wristP);
        s.fire.position.y += 0.035;
        s.fire.scale.setScalar(0.78 + Math.sin(performance.now() * 0.014) * 0.07);
        if (!s.wasFist) { s.fistStart = performance.now(); arm("hand-fist"); }
      }
      if (s.wasFist && !s.fist && armedBy === "hand-fist") {
        if (performance.now() - s.fistStart > 180 && valid) commitTeleport("hand-fist-release");
        disarm();
      }
      s.wasFist = s.fist;
    }
    Object.values(s.meshes).forEach(m => { if (!shown) m.visible = false; });
    if (!s.fist) s.fire.visible = false;
  });
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
renderer.xr.addEventListener("sessionstart", () => {
  setStatus("Phase 168 WebXR ready");
  setMode("Original lobby fast lock");
});

let last = performance.now();
let acc = 0, samples = 0, worst = 0, report = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  move(dt);
  controllerInput();
  updateHands();
  if (armed) showTarget(armedBy === "hand-fist");
  moon.rotation.y += dt * 0.055;
  mars.rotation.y += dt * 0.062;
  const t = now * 0.00006;
  moon.position.x = -72 * Math.cos(t) - 18 * Math.sin(t);
  moon.position.z = -132 + 22 * Math.sin(t);
  mars.position.x = 112 * Math.cos(t * 0.82);
  mars.position.z = -95 + 28 * Math.sin(t * 0.82);
  portalMeshes.forEach((p, i) => { p.ring.rotation.z += dt * (0.34 + i * 0.015); });
  acc += dt; samples++; worst = Math.max(worst, dt * 1000);
  if (now - report > 1000) {
    const fps = (1 / Math.max(acc / samples, 0.001)).toFixed(1);
    debug.textContent = `${PHASE}\nFPS ${fps} • worst ${worst.toFixed(0)}ms\nDolly ${dolly.position.x.toFixed(2)}, ${dolly.position.z.toFixed(2)} • Yaw ${(THREE.MathUtils.radToDeg(dolly.rotation.y) % 360).toFixed(0)}\nPortal ${hoverPortal?.data?.name || "none"}\nTarget ${valid ? final.x.toFixed(2) + ", " + final.z.toFixed(2) : "none"}`;
    acc = 0; samples = 0; worst = 0; report = now;
  }
  renderer.render(scene, camera);
});

setStatus("Phase 168 original lobby restored");
setMode("Fast original lobby lock");
updateBuildPill("BUILD: PHASE-168");
