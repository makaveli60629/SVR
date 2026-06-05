import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const BUILD = "LOBBY-ORG-1-2-SKYLINE-12-AD-TIER-LOCK";
const MODEL_PATHS = [
  "./assets/models/skyline/buildings_sprite.obj",
  "./assets/models/skyline/skyline_03.obj",
  "./assets/models/skyline/skyline_04.obj"
];

const AD_SLOTS = [
  { tier: 1, number: 1, brand: "ESPRESSO", title: "ESPRESSO WITH CREAM", sub: "Tier 1 Mega Ad" },
  { tier: 1, number: 2, brand: "REIKI", title: "REIKI HUB", sub: "Tier 1 Wellness Feature" },
  { tier: 1, number: 3, brand: "ALL-IN", title: "ALL-IN VR POKER", sub: "Tier 1 Game Feature" },
  { tier: 1, number: 4, brand: "SVR", title: "SVR POKER", sub: "Tier 1 Sponsor Slot" },

  { tier: 2, number: 5, brand: "ESPRESSO", title: "ESPRESSO STAND", sub: "Tier 2 Mid Banner" },
  { tier: 2, number: 6, brand: "REIKI", title: "REIKI STORE", sub: "Tier 2 Mid Banner" },
  { tier: 2, number: 7, brand: "ALL-IN", title: "ALL-IN EVENTS", sub: "Tier 2 Mid Banner" },
  { tier: 2, number: 8, brand: "SVR", title: "SPONSOR HUB", sub: "Tier 2 Mid Banner" },

  { tier: 3, number: 9, brand: "ESPRESSO", title: "COFFEE POP-UP", sub: "Tier 3 Small Banner" },
  { tier: 3, number: 10, brand: "REIKI", title: "WELLNESS PREVIEW", sub: "Tier 3 Small Banner" },
  { tier: 3, number: 11, brand: "ALL-IN", title: "TOURNAMENTS", sub: "Tier 3 Small Banner" },
  { tier: 3, number: 12, brand: "SVR", title: "FUTURE PARTNER", sub: "Tier 3 Small Banner" }
];

function hashString(input = "") {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rand(seed) {
  let s = seed >>> 0;
  return () => { s = Math.imul(1664525, s) + 1013904223; return ((s >>> 0) / 4294967296); };
}

function canvasTexture(w, h, painter) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  painter(x, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeWindowTexture(name = "building") {
  const seed = hashString(name);
  const r = rand(seed);
  return canvasTexture(512, 1024, (x, w, h) => {
    const grad = x.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#416f82");
    grad.addColorStop(0.42, "#2e5f73");
    grad.addColorStop(1, "#193b4c");
    x.fillStyle = grad;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(255,255,255,.12)";
    x.lineWidth = 2;
    for (let yy = 18; yy < h; yy += 38) { x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); }
    for (let xx = 26; xx < w; xx += 50) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, h); x.stroke(); }
    for (let row = 0; row < 24; row++) for (let col = 0; col < 9; col++) {
      const on = r() > 0.18;
      const wx = 24 + col * 52 + r() * 6;
      const wy = 28 + row * 40 + r() * 6;
      x.fillStyle = on ? `rgba(${155 + r()*70|0},${220 + r()*30|0},255,${0.60 + r()*0.32})` : "rgba(12,24,34,.68)";
      x.fillRect(wx, wy, 25 + r()*12, 16 + r()*8);
    }
  });
}

function makeRoofTexture(name = "roof") {
  const r = rand(hashString(name));
  return canvasTexture(512, 512, (x) => {
    x.fillStyle = "#737a82";
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1000; i++) {
      const v = 80 + r() * 90 | 0;
      x.fillStyle = `rgba(${v},${v},${v},${0.04 + r()*0.12})`;
      x.fillRect(r()*512, r()*512, 1 + r()*3, 1 + r()*3);
    }
  });
}

function makeAdTexture(slot) {
  const tierColor = slot.tier === 1 ? "#ffd15c" : slot.tier === 2 ? "#8ffff0" : "#b48cff";
  const brandColor = slot.brand === "REIKI" ? "#00ffcc" : slot.brand === "ESPRESSO" ? "#ffd28a" : slot.brand === "ALL-IN" ? "#ff5ac8" : "#9bd2ff";
  return canvasTexture(1024, 512, (x, w, h) => {
    const bg = x.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#05070d");
    bg.addColorStop(0.50, "#131022");
    bg.addColorStop(1, "#061d22");
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = tierColor;
    x.lineWidth = 18;
    x.strokeRect(20, 20, w - 40, h - 40);
    x.strokeStyle = "rgba(255,255,255,.16)";
    x.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      x.beginPath();
      x.moveTo(40 + i * 62, 42);
      x.lineTo(20 + i * 62, h - 42);
      x.stroke();
    }
    x.textAlign = "left";
    x.textBaseline = "middle";
    x.shadowColor = brandColor;
    x.shadowBlur = 20;
    x.fillStyle = brandColor;
    x.font = "900 66px system-ui, Arial";
    x.fillText(slot.brand, 64, 92, 520);
    x.shadowBlur = 8;
    x.fillStyle = "#ffffff";
    x.font = "900 54px system-ui, Arial";
    x.fillText(slot.title, 64, 214, 860);
    x.fillStyle = "#dffff8";
    x.font = "800 32px system-ui, Arial";
    x.fillText(slot.sub, 66, 294, 820);
    x.fillStyle = tierColor;
    x.font = "900 40px system-ui, Arial";
    x.fillText(`TIER ${slot.tier}  •  BUILDING ${slot.number}`, 66, 386, 800);
    x.textAlign = "right";
    x.fillStyle = "rgba(255,255,255,.92)";
    x.font = "900 92px system-ui, Arial";
    x.fillText(String(slot.number).padStart(2, "0"), w - 74, h - 92);
  });
}

function materialForName(name = "Building") {
  const n = String(name).toLowerCase();
  const roof = /top|roof|concrete|air_conditioner|side/.test(n);
  if (roof) return new THREE.MeshStandardMaterial({ map: makeRoofTexture(name), color: 0xffffff, roughness: 0.72, metalness: 0.06, emissive: 0x1b2226, emissiveIntensity: 0.18, side: THREE.DoubleSide });
  return new THREE.MeshBasicMaterial({ map: makeWindowTexture(name), color: 0xffffff, side: THREE.DoubleSide, toneMapped: false });
}

function setObjectMaterial(object) {
  let i = 0;
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = true;
    child.material = materialForName(child.material?.name || child.name || `building_${i++}`);
  });
}

function bounds(object) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

function makeUpright(object) {
  let { size } = bounds(object);
  if (size.z > size.y * 1.35 && size.z > size.x * 0.9) object.rotation.x = -Math.PI / 2;
  else if (size.x > size.y * 1.35 && size.x > size.z * 0.9) object.rotation.z = Math.PI / 2;
  object.updateMatrixWorld(true);
  return object;
}

function normalizeBuilding(object, targetHeight = 42) {
  makeUpright(object);
  let b = bounds(object);
  if (b.size.y > 0.0001) object.scale.multiplyScalar(targetHeight / b.size.y);
  object.updateMatrixWorld(true);
  b = bounds(object);
  object.position.x -= b.center.x;
  object.position.z -= b.center.z;
  object.position.y -= b.box.min.y;
  return object;
}

function createFallbackBuilding(index, height) {
  const g = new THREE.Group();
  g.name = `SVR_SKYLINE_TIER_BUILDING_FALLBACK_${index + 1}`;
  const w = index < 4 ? 8.4 : index < 8 ? 6.4 : 4.8;
  const d = index < 4 ? 4.8 : index < 8 ? 4.2 : 3.4;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), materialForName(`fallback_tier_${index + 1}`));
  body.name = `SVR_SKYLINE_BUILDING_BODY_${index + 1}`;
  body.position.y = height * 0.5;
  g.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, 0.55, d * 1.04), materialForName(`roof_tier_${index + 1}`));
  cap.name = `SVR_SKYLINE_BUILDING_ROOF_${index + 1}`;
  cap.position.y = height + 0.28;
  g.add(cap);
  return g;
}

function cloneSourceBuilding(source, index, height) {
  if (!source) return createFallbackBuilding(index, height);
  const clone = source.clone(true);
  clone.name = `SVR_SKYLINE_TIER_BUILDING_OBJ_${index + 1}`;
  normalizeBuilding(clone, height);
  return clone;
}

function addBillboard(root, slot, width, height, localY, localZ) {
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: makeAdTexture(slot), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
  );
  panel.name = `SVR_AD_TIER_${slot.tier}_BUILDING_${slot.number}_PANEL`;
  panel.position.set(0, localY, localZ);
  panel.renderOrder = 420 + slot.number;
  root.add(panel);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 0.34, height + 0.28),
    new THREE.MeshBasicMaterial({ color: slot.tier === 1 ? 0xffd15c : slot.tier === 2 ? 0x8ffff0 : 0xb48cff, transparent: true, opacity: slot.tier === 1 ? 0.16 : 0.10, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  );
  glow.name = `SVR_AD_TIER_${slot.tier}_BUILDING_${slot.number}_GLOW`;
  glow.position.set(0, localY, localZ - 0.018);
  glow.renderOrder = 419 + slot.number;
  root.add(glow);
}

function addTierLabel(root, slot, localY, localZ) {
  const tex = canvasTexture(512, 160, (x, w, h) => {
    x.fillStyle = "rgba(0,0,0,.72)";
    x.fillRect(0, 0, w, h);
    x.strokeStyle = slot.tier === 1 ? "#ffd15c" : slot.tier === 2 ? "#8ffff0" : "#b48cff";
    x.lineWidth = 8;
    x.strokeRect(8, 8, w - 16, h - 16);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#ffffff";
    x.font = "900 44px system-ui, Arial";
    x.fillText(`TIER ${slot.tier}`, w / 2, 54, w - 28);
    x.font = "900 32px system-ui, Arial";
    x.fillText(`BUILDING ${slot.number}`, w / 2, 108, w - 28);
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.25), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  label.name = `SVR_AD_TIER_${slot.tier}_BUILDING_${slot.number}_LABEL`;
  label.position.set(0, localY, localZ);
  label.renderOrder = 455 + slot.number;
  root.add(label);
}

function placeAdBuilding(source, slot, index) {
  const height = slot.tier === 1 ? 56 : slot.tier === 2 ? 43 : 31;
  const root = new THREE.Group();
  root.name = `SVR_AD_TIER_${slot.tier}_BUILDING_${slot.number}_ROOT`;

  const building = cloneSourceBuilding(source, index, height);
  building.name = `SVR_AD_TIER_${slot.tier}_BUILDING_${slot.number}_MODEL`;
  root.add(building);

  const angleDeg = -132 + index * 24;
  const angle = angleDeg * THREE.MathUtils.DEG2RAD;
  const radius = slot.tier === 1 ? 108 : slot.tier === 2 ? 101 : 94;
  root.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  root.rotation.y = Math.PI / 2 - angle;

  const adW = slot.tier === 1 ? 13.5 : slot.tier === 2 ? 10.5 : 7.8;
  const adH = slot.tier === 1 ? 6.7 : slot.tier === 2 ? 5.0 : 3.7;
  const adY = slot.tier === 1 ? height * 0.64 : slot.tier === 2 ? height * 0.62 : height * 0.60;
  const frontZ = slot.tier === 1 ? 3.05 : slot.tier === 2 ? 2.65 : 2.20;
  addBillboard(root, slot, adW, adH, adY, frontZ);
  addTierLabel(root, slot, adY - adH * 0.76, frontZ + 0.03);

  root.userData.SVR_AD_TIER = { tier: slot.tier, number: slot.number, title: slot.title, facing: "lobby-center", radius, angleDeg };
  return root;
}

function removeOldSkylineGroups(scene) {
  [
    "SVR_PHASE115_TEXTURED_OBJ_SKYLINE_BACKGROUND_LOCK",
    "SVR_PHASE84_OBJ_SKYLINE_BACKGROUND_LOCK",
    "SVR_PHASE121_ALIGNED_BRIGHT_OBJ_SKYLINE_LOCK",
    "SVR_SKYLINE_12_AD_TIER_LOCK"
  ].forEach((n) => {
    const o = scene.getObjectByName(n);
    if (o?.parent) o.parent.remove(o);
  });
}

export async function applyObjSkylineBackground(scene, { log = console.log } = {}) {
  if (!scene) return null;
  removeOldSkylineGroups(scene);

  const group = new THREE.Group();
  group.name = "SVR_SKYLINE_12_AD_TIER_LOCK";
  group.userData.build = BUILD;
  scene.add(group);

  const loader = new OBJLoader();
  const sources = [];
  for (const path of MODEL_PATHS) {
    try {
      const obj = await loader.loadAsync(path);
      obj.name = `SVR_SKYLINE_SOURCE_${path.split("/").pop()}`;
      setObjectMaterial(obj);
      normalizeBuilding(obj, 42 + sources.length * 6);
      sources.push(obj);
      log?.("Skyline real OBJ loaded and normalized", path);
    } catch (err) {
      log?.("Skyline OBJ miss; fallback remains available", path, err?.message || err);
    }
  }

  AD_SLOTS.forEach((slot, i) => {
    const source = sources.length ? sources[i % sources.length] : null;
    const b = placeAdBuilding(source, slot, i);
    group.add(b);
  });

  const ambient = new THREE.HemisphereLight(0xb8f7ff, 0x0b1018, 0.62);
  ambient.name = "SVR_SKYLINE_12_AD_TIER_LIGHT";
  group.add(ambient);

  window.SVR_PHASE121_OBJ_SKYLINE = {
    build: BUILD,
    realObjCount: sources.length,
    adBuildings: AD_SLOTS.length,
    tier1: 4,
    tier2: 4,
    tier3: 4,
    aligned: true,
    textured: true,
    adPanelsFaceLobby: true,
    noBlackPlaceholderIntent: true
  };
  scene.userData.SVR_PHASE121_OBJ_SKYLINE = window.SVR_PHASE121_OBJ_SKYLINE;
  log?.("Lobby Org 1.2 skyline 12 ad tier system active", window.SVR_PHASE121_OBJ_SKYLINE);
  return group;
}
