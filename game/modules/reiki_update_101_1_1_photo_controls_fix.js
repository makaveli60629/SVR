import * as THREE from "three";
import { REIKI_INFO_PHOTO } from "../assets/reiki-info-photo.js";

const BUILD = "RICI-UPDATE-101-1-1-PHOTO-CONTROLS-BLINK-FIX";
const LUXURY_BUILD = "REIKI-LUXURY-ENTRY-CLEANUP-1-2";
const VIDEO_PRIMARY = "../site/assets/video/reiki_hologram.mp4";
const VIDEO_FALLBACK = "./assets/video/reiki_hologram.mp4";

function photoMaterial() {
  const tex = new THREE.TextureLoader().load(REIKI_INFO_PHOTO);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.98, side: THREE.DoubleSide, depthWrite: false });
}

function panelTexture(title, lines = []) {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 360;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "rgba(0,8,12,.96)");
  g.addColorStop(1, "rgba(18,4,24,.94)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(0,255,204,.86)";
  x.lineWidth = 8;
  x.strokeRect(18, 18, c.width - 36, c.height - 36);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(0,255,204,.55)";
  x.shadowBlur = 12;
  x.fillStyle = "#ffffff";
  x.font = "900 48px system-ui,Arial";
  x.fillText(title, c.width / 2, 86, c.width - 70);
  x.shadowBlur = 4;
  x.fillStyle = "#dffff8";
  x.font = "760 28px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, 162 + i * 44, c.width - 76));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makePanel(title, lines) {
  return new THREE.MeshBasicMaterial({ map: panelTexture(title, lines), transparent: true, opacity: 0.96, side: THREE.DoubleSide, depthWrite: false });
}

function addPhoto(root, name, position, rotation = [0, 0, 0], size = [1.12, 1.60]) {
  if (root.getObjectByName(name)) return;
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(size[0] + 0.12, size[1] + 0.12), new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
  frame.name = name + "_FRAME";
  frame.position.set(position[0], position[1], position[2] - 0.01);
  frame.rotation.set(rotation[0], rotation[1], rotation[2]);
  frame.renderOrder = 342;
  root.add(frame);

  const photo = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), photoMaterial());
  photo.name = name;
  photo.position.set(...position);
  photo.rotation.set(rotation[0], rotation[1], rotation[2]);
  photo.renderOrder = 345;
  root.add(photo);
}

function addInfoPanel(root) {
  if (root.getObjectByName("SVR_RICI_UPDATE_101_REIKI_INFO_PHOTO_LABEL")) return;
  const mat = makePanel("REIKI INFO", ["Presentation photo added", "Approval notice remains active", "Client packet can swap image"]);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.08), mat);
  panel.name = "SVR_RICI_UPDATE_101_REIKI_INFO_PHOTO_LABEL";
  panel.position.set(-4.92, 0.98, -3.235);
  panel.renderOrder = 346;
  root.add(panel);
}

function addVideoHologram(root) {
  if (root.getObjectByName("SVR_RICI_UPDATE_101_REIKI_HOLOGRAM_VIDEO")) return;

  ["SVR_RICI_UPDATE_101_REIKI_HOLO_PHOTO", "SVR_RICI_UPDATE_101_REIKI_HOLO_PHOTO_FRAME"].forEach((name) => {
    const old = root.getObjectByName(name);
    if (old) old.visible = false;
  });

  const video = document.createElement("video");
  video.id = "svr-reiki-hologram-video";
  video.src = VIDEO_PRIMARY;
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = "auto";
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.style.display = "none";
  video.addEventListener("error", () => {
    if (!video.src.includes("/game/assets/video/")) {
      video.src = VIDEO_FALLBACK;
      video.load();
      video.play().catch(() => {});
    }
  }, { once: true });
  document.body.appendChild(video);

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(1.08, 1.52),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false })
  );
  frame.name = "SVR_RICI_UPDATE_101_REIKI_HOLOGRAM_VIDEO_FRAME";
  frame.position.set(-1.44, 1.77, -1.355);
  frame.rotation.set(0, 0.25, 0);
  frame.renderOrder = 348;
  root.add(frame);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.94, 1.34),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.96, side: THREE.DoubleSide, depthWrite: false })
  );
  mesh.name = "SVR_RICI_UPDATE_101_REIKI_HOLOGRAM_VIDEO";
  mesh.position.set(-1.44, 1.77, -1.34);
  mesh.rotation.set(0, 0.25, 0);
  mesh.renderOrder = 350;
  root.add(mesh);

  const baseGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.48, 0.54, 80),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  baseGlow.name = "SVR_RICI_UPDATE_101_REIKI_VIDEO_BASE_GLOW";
  baseGlow.rotation.x = -Math.PI / 2;
  baseGlow.position.set(-1.44, 0.18, -1.34);
  baseGlow.renderOrder = 349;
  root.add(baseGlow);

  const prompt = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.34), makePanel("VIDEO", ["tap / click for sound"]));
  prompt.name = "SVR_RICI_UPDATE_101_REIKI_VIDEO_PROMPT";
  prompt.position.set(-1.44, 0.72, -1.29);
  prompt.rotation.set(0, 0.25, 0);
  prompt.renderOrder = 351;
  root.add(prompt);

  function playMuted() {
    video.muted = true;
    video.volume = 0.0;
    video.play().catch(() => {});
  }
  function playWithSound() {
    video.muted = false;
    video.volume = 0.72;
    video.play().catch(() => {});
  }

  video.play().catch(playMuted);
  window.addEventListener("pointerdown", playWithSound, { passive: true });
  window.addEventListener("keydown", (e) => { if (e.code === "KeyV") playWithSound(); });
  window.SVR_REIKI_HOLOGRAM_VIDEO = { play: playWithSound, mute: playMuted, element: video, primary: VIDEO_PRIMARY, fallback: VIDEO_FALLBACK, restored: true };
}

function goldMaterial(opacity = 0.92) {
  return new THREE.MeshStandardMaterial({ color: 0xffd36a, roughness: 0.24, metalness: 0.88, emissive: 0x382000, emissiveIntensity: 0.20, transparent: opacity < 1, opacity });
}
function cyanGlowMaterial(opacity = 0.34) {
  return new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}
function greenMaterial() { return new THREE.MeshStandardMaterial({ color: 0x279457, roughness: 0.72, metalness: 0.02, emissive: 0x062a18, emissiveIntensity: 0.13, side: THREE.DoubleSide }); }
function potMaterial() { return new THREE.MeshStandardMaterial({ color: 0x2a1714, roughness: 0.70, metalness: 0.18, emissive: 0x080303, emissiveIntensity: 0.05 }); }

function addLuxuryBox(root, name, size, pos, mat) {
  if (root.getObjectByName(name)) return null;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.renderOrder = 330;
  root.add(mesh);
  return mesh;
}

function addLuxuryPlant(root, x, z, label, scale = 1) {
  if (root.getObjectByName(`SVR_REIKI_LUXURY_PLANT_${label}`)) return;
  const group = new THREE.Group();
  group.name = `SVR_REIKI_LUXURY_PLANT_${label}`;
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  root.add(group);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.34, 28), potMaterial());
  pot.name = `SVR_REIKI_LUXURY_POT_${label}`;
  pot.position.y = 0.17;
  group.add(pot);
  const leafMat = greenMaterial();
  for (let i = 0; i < 12; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), leafMat);
    leaf.name = `SVR_REIKI_LUXURY_LEAF_${label}_${i}`;
    leaf.scale.set(0.42, 1.45 + (i % 4) * 0.12, 0.10);
    const a = (i / 12) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.15, 0.52 + (i % 4) * 0.045, Math.sin(a) * 0.15);
    leaf.rotation.set(0.56, a, i % 2 ? 0.32 : -0.32);
    group.add(leaf);
  }
}

function localPositionFromWorld(root, object) {
  const world = new THREE.Vector3();
  object.getWorldPosition(world);
  return root.worldToLocal(world.clone());
}

function hideObjectTree(obj) {
  let node = obj;
  while (node?.parent && !/SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK/i.test(node.parent.name || "")) {
    if (/PLANT|POT|LEAF|TREE|DECOR/i.test(node.parent.name || "")) node = node.parent;
    else break;
  }
  node.visible = false;
  node.traverse?.((child) => { child.visible = false; });
}

function clearCarpetAndThreshold(scene, root) {
  root.updateWorldMatrix(true, true);
  const hidden = [];
  root.traverse((obj) => {
    const name = String(obj.name || "");
    if (/BOTTOM_GLASS_TRACK|THRESHOLD|FLOOR_TRACK|LOWER_TRACK/i.test(name)) {
      obj.visible = false;
      hidden.push(name);
    }
  });
  scene.traverse((obj) => {
    if (!obj || obj === scene || obj === root) return;
    const name = String(obj.name || "");
    if (!/PLANT|POT|LEAF|TREE|DECOR/i.test(name)) return;
    const p = localPositionFromWorld(root, obj);
    const inCarpetCenter = Math.abs(p.x) < 1.95 && p.z > -0.45 && p.z < 7.85 && p.y < 2.2;
    if (inCarpetCenter) {
      hideObjectTree(obj);
      hidden.push(name || obj.type);
    }
  });
  return hidden.length;
}

function addLuxuryEntryPolish(root) {
  if (root.getObjectByName("SVR_REIKI_LUXURY_ENTRY_LOCK")) return;
  const lock = new THREE.Group();
  lock.name = "SVR_REIKI_LUXURY_ENTRY_LOCK";
  root.add(lock);
  addLuxuryBox(lock, "SVR_REIKI_LUXURY_LEFT_GOLD_CARPET_INLAY", [0.055, 0.018, 7.55], [-2.64, 0.045, 3.88], goldMaterial(0.96));
  addLuxuryBox(lock, "SVR_REIKI_LUXURY_RIGHT_GOLD_CARPET_INLAY", [0.055, 0.018, 7.55], [2.64, 0.045, 3.88], goldMaterial(0.96));
  addLuxuryBox(lock, "SVR_REIKI_LUXURY_LEFT_CYAN_EDGE", [0.035, 0.012, 6.75], [-2.78, 0.052, 3.62], cyanGlowMaterial(0.44));
  addLuxuryBox(lock, "SVR_REIKI_LUXURY_RIGHT_CYAN_EDGE", [0.035, 0.012, 6.75], [2.78, 0.052, 3.62], cyanGlowMaterial(0.44));
  addLuxuryPlant(lock, -3.18, 1.25, "LEFT_FRONT", 0.78);
  addLuxuryPlant(lock, 3.18, 1.25, "RIGHT_FRONT", 0.78);
  addLuxuryPlant(lock, -3.48, 4.10, "LEFT_MID", 0.72);
  addLuxuryPlant(lock, 3.48, 4.10, "RIGHT_MID", 0.72);
  addLuxuryPlant(lock, -5.85, -2.45, "INSIDE_GALLERY_LEFT", 0.82);
  addLuxuryPlant(lock, 5.85, -2.45, "INSIDE_GALLERY_RIGHT", 0.82);
  const welcome = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.42), makePanel("WELCOME", ["clear aisle • luxury Reiki preview"]));
  welcome.name = "SVR_REIKI_LUXURY_WELCOME_STRIP";
  welcome.position.set(0, 0.30, 6.95);
  welcome.renderOrder = 360;
  lock.add(welcome);
}

export function applyRiciUpdate101PhotoControlsFix(scene, { log = console.log } = {}) {
  const root = scene?.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK");
  if (!root || root.getObjectByName("SVR_RICI_UPDATE_101_PHOTO_FIX_LOCK")) return null;
  const lock = new THREE.Group();
  lock.name = "SVR_RICI_UPDATE_101_PHOTO_FIX_LOCK";
  root.add(lock);

  root.traverse((obj) => {
    if (/CARD_BACKGLOW|HOLOGRAM_BEAM/i.test(obj.name || "")) {
      obj.visible = false;
      if (obj.material) { obj.material.opacity = 0.02; obj.material.transparent = true; obj.material.needsUpdate = true; }
    }
    if (/ACTIVE_HOLOGRAM_CARD/i.test(obj.name || "") && obj.material) { obj.material.opacity = 0.98; obj.material.needsUpdate = true; }
  });

  const cleared = clearCarpetAndThreshold(scene, root);
  addLuxuryEntryPolish(root);
  addPhoto(root, "SVR_RICI_UPDATE_101_REIKI_INFO_PHOTO", [-5.95, 2.52, -3.23], [0, 0, 0], [1.12, 1.60]);
  addVideoHologram(root);
  addInfoPanel(root);

  window.SVR_RICI_UPDATE_101_PHOTO_FIX = { build: BUILD, luxuryBuild: LUXURY_BUILD, photoAdded: true, videoRestored: true, blinkingReduced: true, carpetCleared: cleared };
  log?.("RICI photo, video hologram, blink control, and luxury entry cleanup loaded", window.SVR_RICI_UPDATE_101_PHOTO_FIX);
  return lock;
}
