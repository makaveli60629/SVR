import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-4J-REIKI-ANCHOR-STORE-LOCK";
const CENTER = new THREE.Vector3(0, 1.25, 0);

const LAYOUT = {
  reiki: { name: "SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK", pos: [19.95, 0, 0], yaw: -Math.PI / 2, label: "REIKI / WELLNESS", color: 0x36ff88, keep: true },
  store: { name: "SVR_STOREFRONT_MODULE_12_LOCK", pos: [15.84, 0, -16.44], label: "SVR STORE", color: 0xb48cff, keep: true },
  pga: { name: "SVR_PGA_GOLF_STOREFRONT_14_LOCK", pos: [-18.4, 0, -3.6], label: "PGA GOLF", color: 0x42ff8d, keep: true },
  portal: { name: "SVR_PORTAL_PLAZA_DIRECTORY_12_LOCK", pos: [0, 0, 15.4], label: "PORTAL DIRECTORY", color: 0x8ffff0, keep: true }
};

function faceLobby(obj, cfg) {
  if (!obj) return;
  if (Number.isFinite(cfg.yaw)) { obj.rotation.set(0, cfg.yaw, 0); return; }
  const p = obj.position.clone();
  obj.lookAt(CENTER.x, CENTER.y, CENTER.z);
  obj.position.copy(p);
}
function moveObject(scene, cfg) {
  const obj = scene.getObjectByName(cfg.name);
  if (!obj) return false;
  obj.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
  faceLobby(obj, cfg);
  obj.userData.SVR_LAYOUT_14J_LOCKED = true;
  return true;
}
function makeTexture(title, sub, color = "#8ffff0") {
  const c = document.createElement("canvas"); c.width = 900; c.height = 260;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "rgba(0,8,12,.94)"); g.addColorStop(1, "rgba(8,10,28,.92)");
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = color; x.lineWidth = 8; x.strokeRect(14, 14, c.width - 28, c.height - 28);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = color; x.shadowBlur = 16;
  x.fillStyle = "#ffffff"; x.font = "900 46px system-ui,Arial"; x.fillText(title, c.width / 2, 86, c.width - 58);
  x.shadowBlur = 4; x.fillStyle = "#eaffff"; x.font = "800 27px system-ui,Arial"; x.fillText(sub, c.width / 2, 158, c.width - 58);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
function addLabel(scene, key, cfg) {
  [`SVR_LAYOUT_14F_LABEL_${key}`, `SVR_LAYOUT_14G_LABEL_${key}`, `SVR_LAYOUT_14J_LABEL_${key}`].forEach(name => { const old = scene.getObjectByName(name); if (old?.parent) old.parent.remove(old); });
  const mat = new THREE.MeshBasicMaterial({ map: makeTexture(cfg.label, key === "store" ? "locked old coffee ad zone" : "locked hub zone", `#${cfg.color.toString(16).padStart(6, "0")}`), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.9, .82), mat);
  mesh.name = `SVR_LAYOUT_14J_LABEL_${key}`;
  mesh.position.set(cfg.pos[0], 3.05, cfg.pos[2] + 0.62);
  mesh.renderOrder = 820;
  mesh.lookAt(0, 2.2, 0);
  scene.add(mesh);
  return mesh;
}
function addFloorPath(scene) {
  ["SVR_LAYOUT_14F_CENTER_PORTAL_PATH_LOCK", "SVR_LAYOUT_14G_CENTER_PORTAL_PATH_LOCK", "SVR_LAYOUT_14J_CENTER_PORTAL_PATH_LOCK"].forEach(name => { const old = scene.getObjectByName(name); if (old?.parent) old.parent.remove(old); });
  const root = new THREE.Group(); root.name = "SVR_LAYOUT_14J_CENTER_PORTAL_PATH_LOCK"; scene.add(root);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .065, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.0, 5.22, 96), mat.clone());
  ring.name = "SVR_LAYOUT_14J_CENTER_WALK_RING"; ring.rotation.x = -Math.PI / 2; ring.position.y = .028; root.add(ring);
  return root;
}
function hideTree(obj) { if (!obj) return 0; let count = 0; obj.visible = false; count++; obj.traverse?.(c => { c.visible = false; count++; }); return count; }
function hideRemovedZones(scene) {
  let hidden = 0;
  const names = ["SVR_PHASE113_COFFEE_STAND_ASSEMBLED", "SVR_ESPRESSO_DAILY_CASH_STORE_12_LOCK", "SVR_PHASE112_COFFEE_STAND_RELOCATED"];
  names.forEach(name => { hidden += hideTree(scene.getObjectByName(name)); });
  scene.traverse(obj => {
    const n = String(obj.name || "");
    if (/ESPRESSO|WHIPPED|CREAM|COFFEE_STAND|DAILY_CASH_STORE/i.test(n)) hidden += hideTree(obj);
    if (/SVR_UPDATE3_PORTAL_.*PGA|SVR_PORTAL_BUTTON_.*PGA|PGA.*PORTAL/i.test(n) && !/SVR_PGA_GOLF_STOREFRONT_14_LOCK|SVR_PGA_CAROUSEL|SVR_PGA_INTERACTION/i.test(n)) hidden += hideTree(obj);
    if (/RICI|RICKY|RICKI/i.test(n) && /SIGN|BANNER|MARQUEE/i.test(n) && !/REIKI_HUB_BIG_RED_APPROVAL_SIGN_14H/i.test(n)) hidden += hideTree(obj);
  });
  return hidden;
}
function openReikiSightline(scene) {
  const root = scene.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK");
  if (!root) return 0;
  let adjusted = 0;
  root.traverse(obj => {
    const n = String(obj.name || "");
    if (/MAIN_SIGN|APPROVAL_SIGN_FRONT_LOCK|TOP_GLASS_HEADER/i.test(n) && !/REIKI_HUB_BIG_RED_APPROVAL_SIGN_14H/i.test(n)) {
      obj.visible = false;
      adjusted++;
    }
    if (/ACTIVE_HOLOGRAM_CARD|REIKI_HOLOGRAM_VIDEO|REIKI_HOLOGRAM_VIDEO_FRAME|VIDEO_PROMPT|HOLOGRAM_BEAM|ACTIVATION_RING/i.test(n)) {
      obj.renderOrder = Math.max(obj.renderOrder || 0, 930);
      obj.visible = true;
      adjusted++;
    }
  });
  return adjusted;
}
function installAnchorGuard(scene) {
  if (scene.userData.SVR_REIKI_ANCHOR_GUARD_14J) return false;
  scene.userData.SVR_REIKI_ANCHOR_GUARD_14J = true;
  const oldTick = scene.onBeforeRender;
  let tick = 0;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    tick++;
    if (tick % 20 !== 0) return;
    const reiki = scene.getObjectByName(LAYOUT.reiki.name);
    const store = scene.getObjectByName(LAYOUT.store.name);
    if (reiki) { reiki.position.set(...LAYOUT.reiki.pos); reiki.rotation.set(0, LAYOUT.reiki.yaw, 0); }
    if (store) { store.position.set(...LAYOUT.store.pos); faceLobby(store, LAYOUT.store); }
  };
  return true;
}

export function applyLobbyPortalStoreLayout14(scene, { log = console.log } = {}) {
  if (!scene) return null;
  const oldLock = scene.getObjectByName("SVR_LOBBY_PORTAL_STORE_LAYOUT_14_LOCK");
  if (oldLock?.parent) oldLock.parent.remove(oldLock);
  const lock = new THREE.Group(); lock.name = "SVR_LOBBY_PORTAL_STORE_LAYOUT_14_LOCK"; scene.add(lock);
  const moved = {};
  for (const [key, cfg] of Object.entries(LAYOUT)) { moved[key] = moveObject(scene, cfg); if (moved[key]) addLabel(scene, key, cfg); }
  const path = addFloorPath(scene); lock.add(path);
  const hiddenRemovedZones = hideRemovedZones(scene);
  const reikiSightlineAdjusted = openReikiSightline(scene);
  const anchorGuardInstalled = installAnchorGuard(scene);
  window.SVR_LOBBY_PORTAL_STORE_LAYOUT_14 = { build: BUILD, moved, hiddenRemovedZones, reikiSightlineAdjusted, anchorGuardInstalled, layout: Object.fromEntries(Object.entries(LAYOUT).map(([k, v]) => [k, { name: v.name, pos: v.pos, label: v.label }])), goal: "permanently lock Reiki/store anchors and suppress misspelled/duplicate signs" };
  scene.userData.SVR_LOBBY_PORTAL_STORE_LAYOUT_14 = window.SVR_LOBBY_PORTAL_STORE_LAYOUT_14;
  log?.("Reiki/store anchor lock 1.4J loaded", window.SVR_LOBBY_PORTAL_STORE_LAYOUT_14);
  return lock;
}
