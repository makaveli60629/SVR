import * as THREE from "three";

const BUILD = "RICI-UPDATE-101-1-1-MOTHER-MODULE-LOCK";
const STORE_ANCHOR = new THREE.Vector3(19.95, 0, 0);

function texture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1024;
  c.height = opts.h || 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(3,8,14,.96)");
  g.addColorStop(.55, opts.bg1 || "rgba(14,4,28,.94)");
  g.addColorStop(1, opts.bg2 || "rgba(2,32,28,.95)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(0,255,204,.82)";
  x.lineWidth = opts.line || 8;
  x.strokeRect(22, 22, c.width - 44, c.height - 44);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(0,255,204,.60)";
  x.shadowBlur = 16;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 54px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 92, c.width - 86);
  x.shadowBlur = 5;
  x.fillStyle = opts.lineColor || "#dffff8";
  x.font = opts.lineFont || "760 28px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 172) + i * (opts.gap || 42), c.width - 96));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function std(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? .55, metalness: opts.metalness ?? .15, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0, side: opts.side || THREE.FrontSide });
}
function glow(color = 0x00ffcc, opacity = .35) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}
function panel(tex, opacity = .96) {
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
}
function glass(opacity = .14) {
  return new THREE.MeshStandardMaterial({ color: 0x9ffff5, transparent: true, opacity, roughness: .04, metalness: .18, emissive: 0x0b5f58, emissiveIntensity: .24, side: THREE.DoubleSide, depthWrite: false });
}
function box(root, name, size, pos, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  root.add(m);
  return m;
}
function cyl(root, name, radius, height, pos, mat, segments = 40, openEnded = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments, 1, openEnded), mat);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  root.add(m);
  return m;
}
function plane(root, name, size, pos, mat, rot = [0, 0, 0], order = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.set(rot[0], rot[1], rot[2]);
  m.renderOrder = order;
  root.add(m);
  return m;
}

function purgeOldWellness(scene) {
  const remove = [];
  scene.traverse((o) => {
    const n = String(o.name || "");
    if (/REIKI|RIKI|RICI|CHAKRA|FOUNDER/i.test(n) && !/SVR_RICI_UPDATE_101/i.test(n)) remove.push(o);
  });
  let count = 0;
  remove.forEach((o) => { if (o.parent) { o.parent.remove(o); count++; } });
  document.querySelectorAll("video").forEach((v) => {
    const src = String(v.src || v.currentSrc || "").toLowerCase();
    if (src.includes("reiki") || src.includes("hologram")) { try { v.pause(); v.remove(); } catch {} }
  });
  return count;
}

function addPlant(root, x, z, label) {
  const g = new THREE.Group();
  g.name = `SVR_RICI_UPDATE_101_PLANT_${label}`;
  g.position.set(x, 0, z);
  root.add(g);
  cyl(g, `SVR_RICI_UPDATE_101_PLANT_POT_${label}`, .17, .34, [0, .17, 0], std(0x2a1b1b, { roughness: .78 }), 24);
  const leafMat = std(0x1f7a40, { roughness: .70, emissive: 0x062714, emissiveIntensity: .13 });
  for (let i = 0; i < 10; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), leafMat);
    leaf.name = `SVR_RICI_UPDATE_101_LEAF_${label}_${i}`;
    leaf.scale.set(.50, 1.75, .13);
    const a = i / 10 * Math.PI * 2;
    leaf.position.set(Math.cos(a) * .14, .56 + (i % 3) * .05, Math.sin(a) * .14);
    leaf.rotation.set(.55, a, i % 2 ? .34 : -.34);
    g.add(leaf);
  }
}
function addPole(root, x, z, label) {
  const silver = std(0xdadada, { roughness: .18, metalness: .92, emissive: 0x151515, emissiveIntensity: .06 });
  const g = new THREE.Group();
  g.name = `SVR_RICI_UPDATE_101_SILVER_POLE_${label}`;
  g.position.set(x, 0, z);
  root.add(g);
  cyl(g, `SVR_RICI_UPDATE_101_POLE_STEM_${label}`, .045, 1.05, [0, .525, 0], silver, 24);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.10, 24, 12), silver);
  cap.name = `SVR_RICI_UPDATE_101_POLE_CAP_${label}`;
  cap.position.y = 1.09;
  g.add(cap);
  return g.position;
}
function addRope(root, a, b, label) {
  const mat = std(0xb4001f, { roughness: .34, metalness: .04, emissive: 0x5a0010, emissiveIntensity: .30 });
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const geo = new THREE.CylinderGeometry(.038, .038, len, 16);
  geo.rotateZ(Math.PI / 2);
  const m = new THREE.Mesh(geo, mat);
  m.name = `SVR_RICI_UPDATE_101_RED_ROPE_${label}`;
  m.position.set((a.x + b.x) / 2, 1.02, (a.z + b.z) / 2);
  m.rotation.y = Math.atan2(b.z - a.z, b.x - a.x);
  root.add(m);
}

function buildStorefront(root, packet) {
  const shell = std(0x071018, { roughness: .78, metalness: .20, emissive: 0x020708, emissiveIntensity: .12 });
  const trim = std(0xd6dde2, { roughness: .20, metalness: .86, emissive: 0x1b2d30, emissiveIntensity: .22 });
  const carpet = std(0x960018, { roughness: .82, metalness: .02, emissive: 0x2d0008, emissiveIntensity: .22, side: THREE.DoubleSide });
  const W = 15.4, H = 6.2, F = 1.05, B = -3.30, GAP = 5.25, GW = (W - GAP) / 2, S = W / 2;
  const LX = -(GAP / 2 + GW / 2), RX = (GAP / 2 + GW / 2);
  box(root, "SVR_RICI_UPDATE_101_BACK_LEFT_WALL", [4.0, H, .30], [-4.75, H / 2, B], shell);
  box(root, "SVR_RICI_UPDATE_101_BACK_RIGHT_WALL", [4.0, H, .30], [4.75, H / 2, B], shell);
  box(root, "SVR_RICI_UPDATE_101_TOP_GLASS_HEADER", [W, .22, .34], [0, H, F], trim);
  box(root, "SVR_RICI_UPDATE_101_BOTTOM_GLASS_TRACK", [W, .09, .25], [0, .34, F], trim);
  box(root, "SVR_RICI_UPDATE_101_LEFT_FRAME", [.22, H, .34], [-S, H / 2, F], trim);
  box(root, "SVR_RICI_UPDATE_101_RIGHT_FRAME", [.22, H, .34], [S, H / 2, F], trim);
  box(root, "SVR_RICI_UPDATE_101_ENTRY_LEFT_POST", [.18, H - .55, .30], [-GAP / 2, H / 2, F], trim);
  box(root, "SVR_RICI_UPDATE_101_ENTRY_RIGHT_POST", [.18, H - .55, .30], [GAP / 2, H / 2, F], trim);
  plane(root, "SVR_RICI_UPDATE_101_FRONT_GLASS_LEFT", [GW, H - .95], [LX, H / 2 + .08, F + .025], glass(.13), [0, 0, 0], 95);
  plane(root, "SVR_RICI_UPDATE_101_FRONT_GLASS_RIGHT", [GW, H - .95], [RX, H / 2 + .08, F + .025], glass(.13), [0, 0, 0], 95);
  plane(root, "SVR_RICI_UPDATE_101_RED_CARPET_WALKWAY", [4.75, 9.80], [0, .02, 3.25], carpet, [-Math.PI / 2, 0, 0], 12);
  const zs = [1.05, 2.35, 3.65, 4.95, 6.25];
  const left = zs.map((z, i) => addPole(root, -2.42, z, `L${i}`));
  const right = zs.map((z, i) => addPole(root, 2.42, z, `R${i}`));
  for (let i = 0; i < zs.length - 1; i++) { addRope(root, left[i], left[i + 1], `L${i}`); addRope(root, right[i], right[i + 1], `R${i}`); }
  addPlant(root, -6.15, -2.25, "BACK_LEFT");
  addPlant(root, 6.15, -2.25, "BACK_RIGHT");
  addPlant(root, -3.25, 6.45, "ENTRY_LEFT");
  addPlant(root, 3.25, 6.45, "ENTRY_RIGHT");
  const approval = packet.approval?.approved ? "APPROVED" : "AWAITING APPROVAL";
  const title = packet.brand?.displayName || "RICI / REIKI HUB";
  const domain = packet.brand?.domain || "PARTNER DOMAIN PENDING";
  plane(root, "SVR_RICI_UPDATE_101_MAIN_SIGN", [5.70, .98], [0, 6.08, F + .08], panel(texture(title, [domain, approval], { w: 1300, h: 330, titleFont: "900 54px system-ui,Arial", lineFont: "900 28px system-ui,Arial", titleY: 88, startY: 178, gap: 44, border: packet.approval?.approved ? "rgba(0,255,204,.85)" : "rgba(255,40,55,.95)", lineColor: packet.approval?.approved ? "#cffff8" : "#ff4050" })), [0, 0, 0], 245);
  plane(root, "SVR_RICI_UPDATE_101_LEFT_INFO_WALL", [3.25, 3.8], [-4.95, 2.55, B + .04], panel(texture("PRESENTATION MOCKUP", ["Client content is modular", "Branding can be removed", "Packet-driven sponsor system", "No official approval yet"], { w: 1000, h: 980, titleFont: "900 48px system-ui,Arial", lineFont: "760 30px system-ui,Arial", titleY: 135, startY: 255, gap: 86, border: "rgba(255,40,55,.90)", lineColor: "#ffd8dc" })), [0, 0, 0], 235);
  plane(root, "SVR_RICI_UPDATE_101_RIGHT_PROFILE_WALL", [3.25, 3.8], [4.95, 2.55, B + .04], panel(texture("MODULAR HUB", ["Hologram carousel", "Portal destination", "VIP promo ready", "Nationwide packet ready"], { w: 1000, h: 980, titleFont: "900 48px system-ui,Arial", lineFont: "760 30px system-ui,Arial", titleY: 135, startY: 255, gap: 86 })), [0, 0, 0], 235);
}

function cardTexture(card, packet) {
  const approval = packet.approval?.approved ? "APPROVED PARTNER" : "AWAITING APPROVAL";
  return texture(card.title || "INFO", [...(card.lines || []), approval], { w: 900, h: 1160, titleFont: "900 58px system-ui,Arial", lineFont: "760 30px system-ui,Arial", titleY: 140, startY: 265, gap: 72, border: card.type === "portal" ? "rgba(0,204,255,.90)" : card.type === "promo" ? "rgba(255,212,80,.90)" : "rgba(0,255,204,.82)" });
}

function buildActivationRoom(root, scene, camera, renderer, gotoScene, packet) {
  const room = new THREE.Group();
  room.name = "SVR_RICI_UPDATE_101_ACTIVATION_CIRCLE_ROOM";
  room.position.set(0, 0, -1.65);
  root.add(room);
  const shell = std(0x050b11, { roughness: .55, metalness: .45, emissive: 0x001815, emissiveIntensity: .13 });
  cyl(room, "SVR_RICI_UPDATE_101_ACTIVATION_FLOOR", 1.95, .10, [0, .05, 0], shell, 96);
  cyl(room, "SVR_RICI_UPDATE_101_ACTIVATION_CEILING", 1.95, .08, [0, 4.85, 0], shell, 96);
  cyl(room, "SVR_RICI_UPDATE_101_HOLOGRAM_BEAM", .55, 3.0, [0, 1.6, 0], glow(0x00ffcc, .06), 64, true);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.72, 1.80, 128), glow(0x00ffcc, .86));
  ring.name = "SVR_RICI_UPDATE_101_ACTIVATION_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .12;
  room.add(ring);
  plane(room, "SVR_RICI_UPDATE_101_SWIPE_HELP", [2.4, .48], [0, 3.55, .15], panel(texture("SWIPE  ⇠  ⇢", ["Q / E or select arrows"], { w: 900, h: 220, titleFont: "900 42px system-ui,Arial", lineFont: "760 24px system-ui,Arial", titleY: 70, startY: 145, border: "rgba(255,255,255,.45)" }), .94), [0, 0, 0], 280);
  const fallbackCards = [
    { type: "video", title: "INTRO VIDEO", lines: ["Presentation media", "Narrow hologram format", "Tap once for audio"] },
    { type: "about", title: "ABOUT", lines: ["Wellness profile", "Partner info slot", "Approval-safe placeholder"] },
    { type: "symbols", title: "SYMBOLS", lines: ["Root • Sacral • Solar", "Heart • Throat • Vision", "Crown • Balance • Calm"] },
    { type: "services", title: "SERVICES", lines: ["Private sessions", "Energy balancing", "Guided meditation"] },
    { type: "store", title: "STORE PREVIEW", lines: ["Session packages", "Product cards", "Website store link"] },
    { type: "promo", title: "VIP PROMO", lines: ["Future profile rewards", "Coupon-ready", "No live discounts yet"] },
    { type: "portal", title: "ENTER ROOM", lines: ["Private room", "Meditation destination", "Activate portal"] }
  ];
  const cards = packet.carousel?.cards?.length ? packet.carousel.cards : fallbackCards;
  let active = 0;
  const cardMesh = plane(room, "SVR_RICI_UPDATE_101_ACTIVE_HOLOGRAM_CARD", [1.18, 1.75], [0, 1.72, .28], panel(cardTexture(cards[0], packet), .92), [0, 0, 0], 270);
  const cardGlow = plane(room, "SVR_RICI_UPDATE_101_CARD_BACKGLOW", [1.46, 2.05], [0, 1.72, .25], glow(0x00ffcc, .12), [0, 0, 0], 250);
  const prev = plane(room, "SVR_RICI_UPDATE_101_PREV_BUTTON", [.55, .55], [-1.25, 1.60, .22], panel(texture("⇠", ["PREV"], { w: 300, h: 300, titleFont: "900 96px system-ui,Arial", lineFont: "900 30px system-ui,Arial", titleY: 105, startY: 212 }), .95), [0, 0, 0], 285);
  const next = plane(room, "SVR_RICI_UPDATE_101_NEXT_BUTTON", [.55, .55], [1.25, 1.60, .22], panel(texture("⇢", ["NEXT"], { w: 300, h: 300, titleFont: "900 96px system-ui,Arial", lineFont: "900 30px system-ui,Arial", titleY: 105, startY: 212 }), .95), [0, 0, 0], 285);
  const activate = plane(room, "SVR_RICI_UPDATE_101_ACTIVATE_BUTTON", [1.35, .42], [0, .78, .26], panel(texture("ACTIVATE", ["selected card"], { w: 700, h: 240, titleFont: "900 46px system-ui,Arial", lineFont: "800 26px system-ui,Arial", titleY: 82, startY: 155, border: "rgba(0,204,255,.86)" }), .96), [0, 0, 0], 286);
  function setCard(i) { active = (i + cards.length) % cards.length; cardMesh.material.map = cardTexture(cards[active], packet); cardMesh.material.needsUpdate = true; }
  function activateCard() {
    const card = cards[active];
    if (card.type === "portal") { if (gotoScene?.("reikiRoom")) return; window.location.href = packet.portal?.href || "./reiki.html?v=rici-101-1-1"; }
    if (card.type === "store") window.open(packet.store?.url || "https://svrpoker.com/site/store.html", "_blank", "noopener,noreferrer");
  }
  prev.userData.activate = () => setCard(active - 1);
  next.userData.activate = () => setCard(active + 1);
  activate.userData.activate = () => activateCard();
  window.addEventListener("keydown", (e) => { if (e.code === "KeyQ") setCard(active - 1); if (e.code === "KeyE") setCard(active + 1); if (e.code === "Enter") activateCard(); });
  const clickables = [prev, next, activate];
  if (renderer?.domElement && camera) {
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    renderer.domElement.addEventListener("pointerdown", (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(clickables, true)[0];
      if (hit?.object?.userData?.activate) hit.object.userData.activate();
    }, { passive: true });
  }
  room.userData.tick = (t) => { ring.rotation.z = t * .00020; cardGlow.material.opacity = .10 + Math.sin(t * .002) * .035; cardMesh.position.y = 1.72 + Math.sin(t * .0018) * .025; };
  window.SVR_RICI_UPDATE_101_CAROUSEL = { next: () => setCard(active + 1), prev: () => setCard(active - 1), activate: activateCard, getActiveIndex: () => active, getActiveCard: () => cards[active] };
  return room;
}

async function loadPacket() {
  try {
    const res = await fetch("./config/reiki_update_101_1_1.packet.json", { cache: "no-store" });
    if (!res.ok) throw new Error("packet fetch failed");
    return await res.json();
  } catch {
    return { build: BUILD, approval: { approved: false, statusText: "AWAITING APPROVAL" }, brand: { displayName: "RICI / REIKI HUB", domain: "PARTNER DOMAIN PENDING" }, store: { url: "https://svrpoker.com/site/store.html" }, portal: { href: "./reiki.html?v=rici-101-1-1" } };
  }
}

export async function applyRiciUpdate101MotherModule(scene, { log = console.log, gotoScene = null, camera = null, renderer = null } = {}) {
  if (!scene || scene.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK")) return null;
  const packet = await loadPacket();
  const removed = purgeOldWellness(scene);
  const root = new THREE.Group();
  root.name = "SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK";
  root.position.copy(STORE_ANCHOR);
  root.lookAt(root.position.clone().add(new THREE.Vector3(-1, 0, 0)));
  scene.add(root);
  buildStorefront(root, packet);
  const activation = buildActivationRoom(root, scene, camera, renderer, gotoScene, packet);
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) { oldTick?.apply(this, args); activation.userData.tick?.(performance.now()); };
  window.SVR_RICI_UPDATE_101_1_1 = { build: BUILD, packet, removedOldObjects: removed, approvalSafe: !packet.approval?.approved, swappablePacket: true, nationwideReady: true };
  scene.userData.SVR_RICI_UPDATE_101_1_1 = window.SVR_RICI_UPDATE_101_1_1;
  log?.("RICI Update 101 / Reiki 1.1 mother module loaded", window.SVR_RICI_UPDATE_101_1_1);
  return root;
}
