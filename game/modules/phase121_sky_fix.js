import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-4G-ULTRA-HIGH-MOON-MARS-STARS-LOCK";

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
  const count = kind === "mars" ? 110 : 180;
  for (let i = 0; i < count; i++) {
    const px = Math.random() * c.width, py = Math.random() * c.height;
    const rw = (kind === "mars" ? 16 : 8) + Math.random() * (kind === "mars" ? 120 : 70);
    const rh = rw * (0.25 + Math.random() * 0.48);
    x.save(); x.translate(px, py); x.rotate(Math.random() * Math.PI); x.beginPath(); x.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    x.fillStyle = kind === "mars" ? (Math.random() > 0.52 ? "rgba(66,20,10,.36)" : "rgba(255,196,112,.20)") : (Math.random() > 0.32 ? "rgba(45,44,42,.34)" : "rgba(255,255,230,.18)");
    x.fill(); x.restore();
  }
  if (kind === "moon") { x.fillStyle = "rgba(255,255,230,.14)"; for (let i = 0; i < 20; i++) { x.beginPath(); x.arc(Math.random() * c.width, Math.random() * c.height, 18 + Math.random() * 62, 0, Math.PI * 2); x.fill(); } }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(256, 256, 10, 256, 256, 250);
  g.addColorStop(0, "rgba(255,255,255,.98)"); g.addColorStop(0.22, "rgba(255,255,255,.34)"); g.addColorStop(0.58, "rgba(190,210,255,.13)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function hideDuplicateCelestials(scene) {
  const removed = [], hide = [];
  scene.traverse((o) => { if (!o || !o.parent) return; const name = String(o.name || ""); if (!SKY_NAMES.test(name) || KEEP_LOCK.test(name)) return; hide.push(o); });
  hide.forEach((o) => { if (o.parent) { removed.push(o.name || o.type); o.parent.remove(o); } });
  return removed;
}
function makeSphere(name, radius, texture, pos) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 88, 44), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, fog: false }));
  mesh.name = name; mesh.position.set(pos[0], pos[1], pos[2]); mesh.renderOrder = -30; mesh.frustumCulled = false; return mesh;
}
function makeGlow(name, color, scale, pos, opacity = 0.24) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  sprite.name = name; sprite.scale.setScalar(scale); sprite.position.set(pos[0], pos[1], pos[2]); sprite.renderOrder = -31; sprite.frustumCulled = false; return sprite;
}
function makeStars(root) {
  const geo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 520; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 260 + Math.random() * 220;
    const y = 150 + Math.random() * 260;
    pts.push(Math.cos(a) * r, y, Math.sin(a) * r);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdffcff, size: 0.9, transparent: true, opacity: 0.55, depthWrite: false, fog: false, toneMapped: false }));
  stars.name = "SVR_ULTRA_HIGH_SOFT_STARS_LOCK";
  stars.frustumCulled = false;
  root.add(stars);
  return stars;
}

export function applyPhase121SkyFix(scene, { log = console.log } = {}) {
  if (!scene) return null;
  const oldRoot = scene.getObjectByName("SVR_PHASE121_HIGH_SKY_LOCK") || scene.getObjectByName("SVR_PHASE121_HIGH_SLOW_MOON_MARS_LOCK");
  if (oldRoot?.parent) oldRoot.parent.remove(oldRoot);
  const removedDuplicates = hideDuplicateCelestials(scene);
  const root = new THREE.Group(); root.name = "SVR_PHASE121_HIGH_SKY_LOCK"; scene.add(root);

  const moonPos = [-132, 490, -560];
  const marsPos = [178, 456, -610];
  const moon = makeSphere("SVR_REAL_MOON_ULTRA_HIGH_TEXTURED_LOCK", 24.0, canvasPlanetTexture("moon"), moonPos);
  const mars = makeSphere("SVR_REAL_MARS_ULTRA_HIGH_TEXTURED_LOCK", 11.5, canvasPlanetTexture("mars"), marsPos);
  root.add(moon); root.add(mars);
  const moonGlow = makeGlow("SVR_REAL_MOON_ULTRA_HIGH_ATMOSPHERIC_GLOW_LOCK", 0xf4ead2, 106, moonPos, 0.38);
  const marsGlow = makeGlow("SVR_REAL_MARS_ULTRA_HIGH_SOFT_GLOW_LOCK", 0xff7a4f, 46, marsPos, 0.21);
  root.add(moonGlow); root.add(marsGlow);
  const stars = makeStars(root);
  const moonLight = new THREE.DirectionalLight(0xf2e4c8, 0.34); moonLight.name = "SVR_REAL_MOON_SOFT_SKY_LIGHT_LOCK"; moonLight.position.copy(moon.position); root.add(moonLight);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const time = performance.now() * 0.0000010;
    moon.rotation.y += 0.000026; moon.rotation.x += 0.000004; mars.rotation.y += 0.000020; stars.rotation.y += 0.000006;
    moon.position.x = moonPos[0] + Math.sin(time) * 0.95; moon.position.y = moonPos[1] + Math.sin(time * 0.72) * 0.42;
    mars.position.x = marsPos[0] + Math.sin(time + 1.4) * 0.70; mars.position.y = marsPos[1] + Math.sin(time * 0.70 + 0.8) * 0.36;
    moonGlow.position.copy(moon.position); marsGlow.position.copy(mars.position); moonLight.position.copy(moon.position);
  };
  window.SVR_PHASE121_SKY_FIX = { build: BUILD, duplicatesRemoved: removedDuplicates, moon: moon.position.toArray(), mars: mars.position.toArray(), speed: "locked very slow", ultraHighSky: true, moonTwiceHigher: true, largerMoon: true, singleMoon: true, singleMars: true, stars: true, unobstructed: true };
  scene.userData.SVR_PHASE121_SKY_FIX = window.SVR_PHASE121_SKY_FIX;
  log?.("Lobby Org 1.4G ultra-high Moon/Mars/stars lock loaded", window.SVR_PHASE121_SKY_FIX);
  return root;
}
