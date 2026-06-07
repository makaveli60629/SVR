import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-4E-MOON-MARS-HIGH-HIGH-SKY-LOCK";

const SKY_NAMES = /MOON|MARS|PLANET|CELESTIAL|PHASE121|HIGH_TEXTURED/i;
const KEEP_LOCK = /SVR_PHASE121_HIGH_SKY_LOCK/i;

function canvasPlanetTexture(kind = "moon") {
  const c = document.createElement("canvas");
  c.width = 1536;
  c.height = 768;
  const x = c.getContext("2d");
  const bg = x.createRadialGradient(c.width * 0.34, c.height * 0.28, 8, c.width * 0.52, c.height * 0.52, c.width * 0.68);
  if (kind === "mars") {
    bg.addColorStop(0, "#ffc07a"); bg.addColorStop(0.32, "#c4663f"); bg.addColorStop(0.72, "#78331f"); bg.addColorStop(1, "#33160f");
  } else {
    bg.addColorStop(0, "#fffbe8"); bg.addColorStop(0.30, "#d9d3c6"); bg.addColorStop(0.70, "#8f8c86"); bg.addColorStop(1, "#454440");
  }
  x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  const count = kind === "mars" ? 95 : 150;
  for (let i = 0; i < count; i++) {
    const px = Math.random() * c.width, py = Math.random() * c.height;
    const rw = (kind === "mars" ? 16 : 8) + Math.random() * (kind === "mars" ? 110 : 64);
    const rh = rw * (0.25 + Math.random() * 0.48);
    x.save(); x.translate(px, py); x.rotate(Math.random() * Math.PI); x.beginPath(); x.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    x.fillStyle = kind === "mars" ? (Math.random() > 0.52 ? "rgba(66,20,10,.32)" : "rgba(255,196,112,.18)") : (Math.random() > 0.32 ? "rgba(45,44,42,.30)" : "rgba(255,255,230,.16)");
    x.fill(); x.restore();
  }
  if (kind === "moon") { x.fillStyle = "rgba(255,255,230,.12)"; for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(Math.random() * c.width, Math.random() * c.height, 18 + Math.random() * 56, 0, Math.PI * 2); x.fill(); } }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}

function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(256, 256, 10, 256, 256, 250);
  g.addColorStop(0, "rgba(255,255,255,.96)"); g.addColorStop(0.22, "rgba(255,255,255,.32)"); g.addColorStop(0.58, "rgba(190,210,255,.12)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

function hideDuplicateCelestials(scene) {
  const removed = [];
  const hide = [];
  scene.traverse((o) => { if (!o || !o.parent) return; const name = String(o.name || ""); if (!SKY_NAMES.test(name) || KEEP_LOCK.test(name)) return; hide.push(o); });
  hide.forEach((o) => { if (o.parent) { removed.push(o.name || o.type); o.parent.remove(o); } });
  return removed;
}

function makeSphere(name, radius, texture, pos) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 80, 40), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, fog: false }));
  mesh.name = name; mesh.position.set(pos[0], pos[1], pos[2]); mesh.renderOrder = -20; mesh.frustumCulled = false; return mesh;
}
function makeGlow(name, color, scale, pos, opacity = 0.24) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  sprite.name = name; sprite.scale.setScalar(scale); sprite.position.set(pos[0], pos[1], pos[2]); sprite.renderOrder = -21; sprite.frustumCulled = false; return sprite;
}

export function applyPhase121SkyFix(scene, { log = console.log } = {}) {
  if (!scene) return null;
  const oldRoot = scene.getObjectByName("SVR_PHASE121_HIGH_SKY_LOCK") || scene.getObjectByName("SVR_PHASE121_HIGH_SLOW_MOON_MARS_LOCK");
  if (oldRoot?.parent) oldRoot.parent.remove(oldRoot);
  const removedDuplicates = hideDuplicateCelestials(scene);
  const root = new THREE.Group(); root.name = "SVR_PHASE121_HIGH_SKY_LOCK"; scene.add(root);

  const moonPos = [-92, 245, -360];
  const marsPos = [122, 228, -390];
  const moon = makeSphere("SVR_REAL_MOON_HIGH_HIGH_TEXTURED_LOCK", 13.5, canvasPlanetTexture("moon"), moonPos);
  const mars = makeSphere("SVR_REAL_MARS_HIGH_HIGH_TEXTURED_LOCK", 7.2, canvasPlanetTexture("mars"), marsPos);
  root.add(moon); root.add(mars);
  const moonGlow = makeGlow("SVR_REAL_MOON_HIGH_HIGH_ATMOSPHERIC_GLOW_LOCK", 0xf4ead2, 58, moonPos, 0.34);
  const marsGlow = makeGlow("SVR_REAL_MARS_HIGH_HIGH_SOFT_GLOW_LOCK", 0xff7a4f, 26, marsPos, 0.19);
  root.add(moonGlow); root.add(marsGlow);
  const moonLight = new THREE.DirectionalLight(0xf2e4c8, 0.28); moonLight.name = "SVR_REAL_MOON_SOFT_SKY_LIGHT_LOCK"; moonLight.position.copy(moon.position); root.add(moonLight);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const time = performance.now() * 0.0000010;
    moon.rotation.y += 0.000028; moon.rotation.x += 0.000005; mars.rotation.y += 0.000022;
    moon.position.x = moonPos[0] + Math.sin(time) * 0.75; moon.position.y = moonPos[1] + Math.sin(time * 0.72) * 0.34;
    mars.position.x = marsPos[0] + Math.sin(time + 1.4) * 0.58; mars.position.y = marsPos[1] + Math.sin(time * 0.70 + 0.8) * 0.28;
    moonGlow.position.copy(moon.position); marsGlow.position.copy(mars.position); moonLight.position.copy(moon.position);
  };
  window.SVR_PHASE121_SKY_FIX = { build: BUILD, duplicatesRemoved: removedDuplicates, moon: moon.position.toArray(), mars: mars.position.toArray(), speed: "locked very slow", highHighSky: true, largerMoon: true, singleMoon: true, singleMars: true, unobstructed: true };
  scene.userData.SVR_PHASE121_SKY_FIX = window.SVR_PHASE121_SKY_FIX;
  log?.("Lobby Org 1.4E high-high Moon/Mars lock loaded", window.SVR_PHASE121_SKY_FIX);
  return root;
}
