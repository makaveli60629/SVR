import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const BUILD = "PHASE-115-OBJ-SKYLINE-PROCEDURAL-TEXTURE-LOCK";
const MODEL_PATHS = [
  "./assets/models/skyline/buildings_sprite.obj",
  "./assets/models/skyline/skyline_03.obj",
  "./assets/models/skyline/skyline_04.obj"
];

function hashString(input = "") {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return ((s >>> 0) / 4294967296);
  };
}

function makeWindowTexture(name, baseHex = "#1d3240", windowHex = "#82dfff") {
  const seed = hashString(name);
  const r = rand(seed);
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1024;
  const x = c.getContext("2d");
  const grad = x.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, baseHex);
  grad.addColorStop(0.48, "#0d1820");
  grad.addColorStop(1, "#060b10");
  x.fillStyle = grad;
  x.fillRect(0, 0, c.width, c.height);

  x.strokeStyle = "rgba(255,255,255,.045)";
  x.lineWidth = 2;
  for (let yy = 24; yy < c.height; yy += 44) {
    x.beginPath();
    x.moveTo(0, yy);
    x.lineTo(c.width, yy);
    x.stroke();
  }
  for (let xx = 28; xx < c.width; xx += 56) {
    x.beginPath();
    x.moveTo(xx, 0);
    x.lineTo(xx, c.height);
    x.stroke();
  }

  for (let row = 0; row < 22; row++) {
    for (let col = 0; col < 8; col++) {
      const on = r() > .42;
      const wx = 30 + col * 58 + r() * 8;
      const wy = 32 + row * 44 + r() * 7;
      const ww = 24 + r() * 10;
      const wh = 15 + r() * 9;
      x.fillStyle = on ? `rgba(${120 + r()*80|0},${205 + r()*35|0},${235 + r()*20|0},${.42 + r()*.38})` : "rgba(8,18,24,.75)";
      x.fillRect(wx, wy, ww, wh);
      if (on && r() > .72) {
        x.fillStyle = "rgba(255,232,160,.40)";
        x.fillRect(wx + 2, wy + 2, ww - 4, Math.max(2, wh * .25));
      }
    }
  }

  x.fillStyle = "rgba(0,0,0,.22)";
  for (let i = 0; i < 55; i++) {
    x.fillRect(r() * c.width, r() * c.height, 6 + r() * 28, 1 + r() * 4);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.4, 2.8);
  tex.anisotropy = 8;
  return tex;
}

function makeConcreteTexture(name) {
  const seed = hashString(name + "concrete");
  const r = rand(seed);
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#3b3e42";
  x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 1800; i++) {
    const v = 40 + r() * 90 | 0;
    x.fillStyle = `rgba(${v},${v},${v},${.05 + r()*.14})`;
    x.fillRect(r()*c.width, r()*c.height, 1 + r()*3, 1 + r()*3);
  }
  x.strokeStyle = "rgba(255,255,255,.06)";
  for (let y = 0; y < c.height; y += 56) { x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y + r()*8 - 4); x.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.2, 1.2);
  tex.anisotropy = 8;
  return tex;
}

const materialCache = new Map();
function materialForName(name = "Building") {
  const key = name || "Building";
  if (materialCache.has(key)) return materialCache.get(key).clone();
  const n = key.toLowerCase();
  const isTop = /top|roof|concrete|air_conditioner|sides/.test(n);
  const isBase = /base/.test(n);
  const palette = ["#1a2d38", "#243744", "#172832", "#26313e", "#222b36", "#16323c"];
  const base = palette[hashString(key) % palette.length];
  const map = isTop ? makeConcreteTexture(key) : makeWindowTexture(key, isBase ? "#102034" : base);
  const mat = new THREE.MeshStandardMaterial({
    map,
    color: 0xffffff,
    roughness: isTop ? .86 : .74,
    metalness: isTop ? .04 : .10,
    emissive: isTop ? 0x050505 : 0x082033,
    emissiveIntensity: isTop ? .08 : .22,
    side: THREE.DoubleSide
  });
  mat.name = `SVR_PHASE115_${key}`;
  materialCache.set(key, mat);
  return mat.clone();
}

function setObjectMaterial(object) {
  let meshIndex = 0;
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = true;
    const sourceName = child.material?.name || child.name || `Building_${meshIndex}`;
    child.material = materialForName(sourceName);
    meshIndex += 1;
  });
}

function boxSize(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

function normalizeBuilding(object, targetHeight = 34) {
  object.updateMatrixWorld(true);
  const { size } = boxSize(object);
  if (size.y > 0.0001) object.scale.multiplyScalar(targetHeight / size.y);
  object.updateMatrixWorld(true);
  const after = boxSize(object);
  object.position.x -= after.center.x;
  object.position.z -= after.center.z;
  object.position.y -= after.box.min.y;
  return object;
}

function cloneForSkyline(source, index, total) {
  const clone = source.clone(true);
  clone.name = `SVR_PHASE115_TEXTURED_OBJ_SKYLINE_BUILDING_${index + 1}`;
  const angle = (-138 + (276 / Math.max(1, total - 1)) * index) * THREE.MathUtils.DEG2RAD;
  const radius = 88 + (index % 4) * 9;
  const heightBoost = 0.88 + (index % 5) * 0.12;
  clone.scale.multiplyScalar(heightBoost);
  clone.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  clone.lookAt(0, 9, 0);
  clone.rotation.y += Math.PI;
  clone.userData.phase115Skyline = true;
  return clone;
}

function addFallbackSkyline(group) {
  const dark = new THREE.MeshStandardMaterial({ map: makeWindowTexture("fallback"), color: 0xffffff, roughness: 0.88, metalness: 0.02, emissive: 0x061c2a, emissiveIntensity: 0.22 });
  const accent = new THREE.MeshBasicMaterial({ color: 0x3edbff, transparent: true, opacity: 0.16, depthWrite: false });
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const radius = 92 + (i % 5) * 4;
    const h = 16 + (i % 9) * 3.2;
    const w = 3 + (i % 4) * 1.1;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.72), dark.clone());
    mesh.name = `SVR_PHASE115_FALLBACK_TEXTURED_SKYLINE_${i + 1}`;
    mesh.position.set(Math.cos(angle) * radius, h * 0.5, Math.sin(angle) * radius);
    mesh.lookAt(0, h * 0.5, 0);
    group.add(mesh);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.82, h * 0.62), accent.clone());
    glow.position.set(0, h * 0.1, -w * 0.37);
    mesh.add(glow);
  }
}

export async function applyObjSkylineBackground(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE115_TEXTURED_OBJ_SKYLINE_BACKGROUND_LOCK")) return null;
  const old = scene.getObjectByName("SVR_PHASE84_OBJ_SKYLINE_BACKGROUND_LOCK");
  if (old?.parent) old.parent.remove(old);

  const group = new THREE.Group();
  group.name = "SVR_PHASE115_TEXTURED_OBJ_SKYLINE_BACKGROUND_LOCK";
  group.userData.build = BUILD;
  scene.add(group);

  const loader = new OBJLoader();
  const sources = [];
  for (const path of MODEL_PATHS) {
    try {
      const obj = await loader.loadAsync(path);
      obj.name = `SVR_PHASE115_SOURCE_${path.split("/").pop()}`;
      setObjectMaterial(obj);
      normalizeBuilding(obj, 36 + sources.length * 5);
      sources.push(obj);
      log?.("Phase 115 textured OBJ skyline loaded", path);
    } catch (err) {
      log?.("Phase 115 OBJ skyline miss", path, err?.message || err);
    }
  }

  if (!sources.length) addFallbackSkyline(group);
  else {
    const placements = Math.min(12, sources.length * 4);
    for (let i = 0; i < placements; i++) group.add(cloneForSkyline(sources[i % sources.length], i, placements));
  }

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 960;
  labelCanvas.height = 230;
  const ctx = labelCanvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.62)";
  ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  ctx.strokeStyle = "rgba(140,255,242,.78)";
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, labelCanvas.width - 36, labelCanvas.height - 36);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#eaffff";
  ctx.font = "900 42px system-ui,Arial";
  ctx.fillText("TEXTURED OBJ SKYLINE", labelCanvas.width / 2, 82, labelCanvas.width - 80);
  ctx.font = "700 25px system-ui,Arial";
  ctx.fillText("procedural windows applied from OBJ material names", labelCanvas.width / 2, 142, labelCanvas.width - 80);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.72),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  label.name = "SVR_PHASE115_OBJ_SKYLINE_STATUS_LABEL";
  label.position.set(0, 11.2, -34.5);
  label.renderOrder = 180;
  group.add(label);

  window.SVR_PHASE115_OBJ_SKYLINE = { build: BUILD, modelCount: sources.length, placementCount: group.children.length };
  scene.userData.SVR_PHASE115_OBJ_SKYLINE = window.SVR_PHASE115_OBJ_SKYLINE;
  log?.("Phase 115 textured OBJ skyline background active", window.SVR_PHASE115_OBJ_SKYLINE);
  return group;
}
