import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-4F-PORTAL-STOREFRONT-NEAT-LAYOUT";
const CENTER = new THREE.Vector3(0, 1.25, 0);

const LAYOUT = {
  reiki: { name: "SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK", pos: [14.8, 0, -8.8], label: "REIKI / WELLNESS", color: 0x36ff88 },
  store: { name: "SVR_STOREFRONT_MODULE_12_LOCK", pos: [-12.8, 0, -10.4], label: "SVR STORE", color: 0xb48cff },
  pga: { name: "SVR_PGA_GOLF_STOREFRONT_14_LOCK", pos: [-18.4, 0, -3.6], label: "PGA GOLF", color: 0x42ff8d },
  espresso: { name: "SVR_PHASE113_COFFEE_STAND_ASSEMBLED", pos: [12.4, 0, -17.2], label: "DAILY GIVEAWAY", color: 0xffd15c },
  espressoStore: { name: "SVR_ESPRESSO_DAILY_CASH_STORE_12_LOCK", pos: [17.2, 0, -12.6], label: "ESPRESSO", color: 0xffd15c },
  portal: { name: "SVR_PORTAL_PLAZA_DIRECTORY_12_LOCK", pos: [0, 0, 15.4], label: "PORTAL DIRECTORY", color: 0x8ffff0 }
};

function lookAtCenter(obj) {
  if (!obj) return;
  const p = obj.position.clone();
  obj.lookAt(CENTER.x, CENTER.y, CENTER.z);
  obj.position.copy(p);
}
function moveObject(scene, cfg) {
  const obj = scene.getObjectByName(cfg.name);
  if (!obj) return false;
  obj.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
  lookAtCenter(obj);
  obj.userData.SVR_LAYOUT_14F_LOCKED = true;
  return true;
}
function makeTexture(title, sub, color = "#8ffff0") {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 260;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "rgba(0,8,12,.94)");
  g.addColorStop(1, "rgba(8,10,28,.92)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = color;
  x.lineWidth = 8;
  x.strokeRect(14, 14, c.width - 28, c.height - 28);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = color;
  x.shadowBlur = 16;
  x.fillStyle = "#ffffff";
  x.font = "900 46px system-ui,Arial";
  x.fillText(title, c.width / 2, 86, c.width - 58);
  x.shadowBlur = 4;
  x.fillStyle = "#eaffff";
  x.font = "800 27px system-ui,Arial";
  x.fillText(sub, c.width / 2, 158, c.width - 58);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function addLabel(scene, key, cfg) {
  const old = scene.getObjectByName(`SVR_LAYOUT_14F_LABEL_${key}`);
  if (old?.parent) old.parent.remove(old);
  const mat = new THREE.MeshBasicMaterial({ map: makeTexture(cfg.label, "organized hub zone", `#${cfg.color.toString(16).padStart(6, "0")}`), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.9, .82), mat);
  mesh.name = `SVR_LAYOUT_14F_LABEL_${key}`;
  mesh.position.set(cfg.pos[0], 3.05, cfg.pos[2] + 0.62);
  mesh.renderOrder = 820;
  mesh.lookAt(0, 2.2, 0);
  scene.add(mesh);
  return mesh;
}
function addFloorPath(scene) {
  const old = scene.getObjectByName("SVR_LAYOUT_14F_CENTER_PORTAL_PATH_LOCK");
  if (old?.parent) old.parent.remove(old);
  const root = new THREE.Group();
  root.name = "SVR_LAYOUT_14F_CENTER_PORTAL_PATH_LOCK";
  scene.add(root);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .095, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.38, 96), mat.clone());
  ring.name = "SVR_LAYOUT_14F_CENTER_WALK_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .028;
  root.add(ring);
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: .082, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const lanes = [
    [0, 0, 0, 12.5],
    [10.2, 0, -8.8, 0],
    [-10.8, 0, -10.0, 0],
    [-15.2, 0, -3.2, 0],
    [12.0, 0, -13.0, 0]
  ];
  lanes.forEach((l, i) => {
    const geo = new THREE.PlaneGeometry(i === 0 ? 2.2 : 1.45, i === 0 ? Math.abs(l[3]) : Math.hypot(l[0], l[2]));
    const m = new THREE.Mesh(geo, laneMat.clone());
    m.name = `SVR_LAYOUT_14F_CLEAR_WALK_LANE_${i + 1}`;
    m.rotation.x = -Math.PI / 2;
    if (i === 0) m.position.set(0, .032, 6.2);
    else {
      m.position.set(l[0] / 2, .033, l[2] / 2);
      m.rotation.z = Math.atan2(l[0], l[2]);
    }
    root.add(m);
  });
  return root;
}
function hideMessyDuplicates(scene) {
  let hidden = 0;
  const seen = new Set();
  const keepNames = new Set(Object.values(LAYOUT).map(v => v.name));
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if (!/STOREFRONT|STORE|PORTAL|DIRECTORY|COFFEE|ESPRESSO|PGA|REIKI|RICI/i.test(n)) return;
    if (keepNames.has(n)) return;
    if (/LABEL_|CENTER_PORTAL_PATH|CAROUSEL|BUTTON|RING|VIDEO|HOLOGRAM|SIGN|CARD|GLOW|MOON|MARS/i.test(n)) return;
    if (seen.has(obj.uuid)) return;
    seen.add(obj.uuid);
    if (/OLD|PHASE112_COFFEE_STAND_RELOCATED|MESSY|DUPLICATE|WALL_SIGN|SPREAD/i.test(n)) { obj.visible = false; hidden++; }
  });
  return hidden;
}

export function applyLobbyPortalStoreLayout14(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_LOBBY_PORTAL_STORE_LAYOUT_14_LOCK")) return null;
  const lock = new THREE.Group();
  lock.name = "SVR_LOBBY_PORTAL_STORE_LAYOUT_14_LOCK";
  scene.add(lock);

  const moved = {};
  for (const [key, cfg] of Object.entries(LAYOUT)) {
    moved[key] = moveObject(scene, cfg);
    if (moved[key]) addLabel(scene, key, cfg);
  }
  const path = addFloorPath(scene);
  lock.add(path);
  const hiddenMessyDuplicates = hideMessyDuplicates(scene);

  window.SVR_LOBBY_PORTAL_STORE_LAYOUT_14 = {
    build: BUILD,
    moved,
    hiddenMessyDuplicates,
    layout: Object.fromEntries(Object.entries(LAYOUT).map(([k, v]) => [k, { name: v.name, pos: v.pos, label: v.label }])),
    goal: "portal/storefronts organized into clear user-friendly zones"
  };
  scene.userData.SVR_LOBBY_PORTAL_STORE_LAYOUT_14 = window.SVR_LOBBY_PORTAL_STORE_LAYOUT_14;
  log?.("Lobby portal/store layout 1.4F loaded", window.SVR_LOBBY_PORTAL_STORE_LAYOUT_14);
  return lock;
}
