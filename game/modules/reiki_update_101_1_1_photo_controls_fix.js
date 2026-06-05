import * as THREE from "three";
import { REIKI_INFO_PHOTO } from "../assets/reiki-info-photo.js";

const BUILD = "RICI-UPDATE-101-1-1-PHOTO-CONTROLS-BLINK-FIX";

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

export function applyRiciUpdate101PhotoControlsFix(scene, { log = console.log } = {}) {
  const root = scene?.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK");
  if (!root || root.getObjectByName("SVR_RICI_UPDATE_101_PHOTO_FIX_LOCK")) return null;
  const lock = new THREE.Group();
  lock.name = "SVR_RICI_UPDATE_101_PHOTO_FIX_LOCK";
  root.add(lock);

  // Stop the strong blinking/glow effect. Keep the hologram readable and stable.
  root.traverse((obj) => {
    if (/CARD_BACKGLOW|HOLOGRAM_BEAM/i.test(obj.name || "")) {
      obj.visible = false;
      if (obj.material) {
        obj.material.opacity = 0.02;
        obj.material.transparent = true;
        obj.material.needsUpdate = true;
      }
    }
    if (/ACTIVE_HOLOGRAM_CARD/i.test(obj.name || "") && obj.material) {
      obj.material.opacity = 0.98;
      obj.material.needsUpdate = true;
    }
  });

  addPhoto(root, "SVR_RICI_UPDATE_101_REIKI_INFO_PHOTO", [-5.95, 2.52, -3.23], [0, 0, 0], [1.12, 1.60]);
  addPhoto(root, "SVR_RICI_UPDATE_101_REIKI_HOLO_PHOTO", [-1.44, 1.77, -1.34], [0, 0.25, 0], [0.72, 1.03]);
  addInfoPanel(root);

  window.SVR_RICI_UPDATE_101_PHOTO_FIX = { build: BUILD, photoAdded: true, blinkingReduced: true };
  log?.("RICI photo and blink control overlay loaded", window.SVR_RICI_UPDATE_101_PHOTO_FIX);
  return lock;
}
