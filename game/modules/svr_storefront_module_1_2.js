import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-2-SVR-STOREFRONT-MODULE";
const ROOT_POS = new THREE.Vector3(-10.8, 0, -17.65);
const LOOK_AT = new THREE.Vector3(0, 1.2, 0);

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1024;
  c.height = opts.h || 1024;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "#05070d");
  g.addColorStop(0.55, opts.bg1 || "#120f26");
  g.addColorStop(1, opts.bg2 || "#061d22");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(180,140,255,.86)";
  x.lineWidth = 10;
  x.strokeRect(24, 24, c.width - 48, c.height - 48);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.glow || "rgba(180,140,255,.70)";
  x.shadowBlur = 22;
  x.fillStyle = "#ffffff";
  x.font = opts.titleFont || "900 72px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 140, c.width - 90);
  x.shadowBlur = 6;
  x.fillStyle = "#eaffff";
  x.font = opts.lineFont || "800 36px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 290) + i * (opts.gap || 74), c.width - 110));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.38,
    metalness: opts.metalness ?? 0.24,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0.0,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1,
    side: opts.side || THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true
  });
}
function basicMap(texture, opacity = 0.97) {
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
}
function addBox(root, name, size, pos, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  root.add(m);
  return m;
}
function addPanel(root, name, size, pos, texture, rot = [0,0,0]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), basicMap(texture));
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.set(rot[0], rot[1], rot[2]);
  m.renderOrder = 470;
  root.add(m);
  return m;
}
function addPlant(root, x, z, scale = 1) {
  const g = new THREE.Group();
  g.name = "SVR_STORE_PLANT_SIDE_ONLY";
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  root.add(g);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.36, 20), mat(0x271616, { roughness: 0.72, metalness: 0.08 }));
  pot.position.y = 0.18;
  g.add(pot);
  const leaf = mat(0x2f9b64, { roughness: 0.86, emissive: 0x052614, emissiveIntensity: 0.12, side: THREE.DoubleSide });
  for (let i = 0; i < 10; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), leaf);
    const a = i / 10 * Math.PI * 2;
    l.scale.set(0.36, 1.38, 0.10);
    l.position.set(Math.cos(a) * 0.16, 0.52 + (i % 3) * 0.05, Math.sin(a) * 0.16);
    l.rotation.set(0.52, a, i % 2 ? 0.28 : -0.28);
    g.add(l);
  }
}

export function applySvrStorefrontModule12(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_STOREFRONT_MODULE_12_LOCK")) return null;
  const root = new THREE.Group();
  root.name = "SVR_STOREFRONT_MODULE_12_LOCK";
  root.position.copy(ROOT_POS);
  root.lookAt(LOOK_AT);
  scene.add(root);

  const dark = mat(0x070b12, { roughness: 0.72, metalness: 0.12, emissive: 0x050818, emissiveIntensity: 0.18 });
  const purple = mat(0x5c45ff, { roughness: 0.22, metalness: 0.58, emissive: 0x19009a, emissiveIntensity: 0.75 });
  const cyan = mat(0x00ffcc, { roughness: 0.20, metalness: 0.54, emissive: 0x00ffcc, emissiveIntensity: 0.55 });
  const glass = mat(0xa7fff7, { opacity: 0.16, roughness: 0.04, metalness: 0.12, emissive: 0x1b7d78, emissiveIntensity: 0.18, side: THREE.DoubleSide, depthWrite: false });

  addBox(root, "SVR_STORE_BACK_WALL", [9.6, 4.6, 0.24], [0, 2.35, -1.28], dark);
  addBox(root, "SVR_STORE_TOP_TRIM", [10.0, 0.14, 0.32], [0, 4.72, -1.08], purple);
  addBox(root, "SVR_STORE_BOTTOM_TRIM", [10.0, 0.10, 0.32], [0, 0.18, -1.08], cyan);
  addBox(root, "SVR_STORE_LEFT_COLUMN", [0.18, 4.6, 0.32], [-4.9, 2.35, -1.08], purple);
  addBox(root, "SVR_STORE_RIGHT_COLUMN", [0.18, 4.6, 0.32], [4.9, 2.35, -1.08], purple);
  addBox(root, "SVR_STORE_GLASS_FRONT", [9.4, 3.6, 0.06], [0, 2.18, 0.28], glass);

  addPanel(root, "SVR_STORE_MAIN_SIGN", [4.25, 0.94], [0, 4.18, 0.34], makeTexture("SVR STORE", ["official hub preview", "memberships • merch • events"], { w: 1200, h: 360, titleFont: "900 76px system-ui,Arial", titleY: 98, startY: 205, gap: 45, border: "rgba(180,140,255,.92)" }));
  addPanel(root, "SVR_STORE_LEFT_INFO", [2.65, 3.05], [-3.0, 2.28, 0.36], makeTexture("MEMBERS", ["VIP access", "daily rewards", "event invites", "profile perks"], { border: "rgba(0,255,204,.86)", glow: "rgba(0,255,204,.70)" }));
  addPanel(root, "SVR_STORE_CENTER_INFO", [2.65, 3.05], [0, 2.28, 0.38], makeTexture("SVR WORLD", ["game preview", "storefronts", "sponsor hubs", "community goals"], { border: "rgba(255,209,92,.88)", glow: "rgba(255,209,92,.70)" }));
  addPanel(root, "SVR_STORE_RIGHT_INFO", [2.65, 3.05], [3.0, 2.28, 0.36], makeTexture("SHOP", ["future merch", "avatar gear", "table themes", "NO CHECKOUT LIVE"], { border: "rgba(180,140,255,.86)", glow: "rgba(180,140,255,.70)" }));

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.08, 96), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  ring.name = "SVR_STORE_INTERACTION_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.08, 1.25);
  ring.renderOrder = 480;
  root.add(ring);

  addPlant(root, -4.35, 0.85, 0.84);
  addPlant(root, 4.35, 0.85, 0.84);
  addPlant(root, -4.20, -1.02, 0.70);
  addPlant(root, 4.20, -1.02, 0.70);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now() * 0.001;
    ring.rotation.z += 0.0014;
    ring.material.opacity = 0.26 + Math.sin(t * 1.1) * 0.06;
  };

  window.SVR_STOREFRONT_MODULE_12 = {
    build: BUILD,
    position: ROOT_POS.toArray(),
    modularPacketReady: true,
    checkoutLive: false,
    databaseLive: false
  };
  scene.userData.SVR_STOREFRONT_MODULE_12 = window.SVR_STOREFRONT_MODULE_12;
  log?.("SVR storefront module 1.2 loaded", window.SVR_STOREFRONT_MODULE_12);
  return root;
}
