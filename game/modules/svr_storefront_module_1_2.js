import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-3-SVR-STOREFRONT-CAROUSEL-GIVEAWAY-KIOSK";
const ROOT_POS = new THREE.Vector3(-10.8, 0, -17.65);
const LOOK_AT = new THREE.Vector3(0, 1.2, 0);

const CARDS = [
  { title: "SVR STORE", lines: ["official hub preview", "one clean carousel", "memberships • merch • events", "NO LIVE CHECKOUT"] },
  { title: "DAILY GIVEAWAY", lines: ["5,000 chip reward placeholder", "profile hook ready", "one claim per day planned", "testing mode only"] },
  { title: "MEMBERSHIP", lines: ["VIP access", "event invites", "profile perks", "future member rewards"] },
  { title: "AVATAR GEAR", lines: ["gloves", "watch skins", "table themes", "cosmetic preview only"] },
  { title: "EVENTS", lines: ["weekend games", "monthly showcase", "sponsor-funded promos", "rules/legal review required"] }
];

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1024;
  c.height = opts.h || 1024;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "#05070d");
  g.addColorStop(0.55, opts.bg1 || "#110d25");
  g.addColorStop(1, opts.bg2 || "#061d22");
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(180,140,255,.88)";
  x.lineWidth = 12; x.strokeRect(26, 26, c.width - 52, c.height - 52);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = opts.glow || "rgba(180,140,255,.72)"; x.shadowBlur = 24;
  x.fillStyle = "#ffffff"; x.font = opts.titleFont || "900 78px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 132, c.width - 90);
  x.shadowBlur = 7; x.fillStyle = opts.lineColor || "#eaffff"; x.font = opts.lineFont || "800 40px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 285) + i * (opts.gap || 78), c.width - 110));
  if (opts.footer) {
    x.fillStyle = opts.footerColor || "rgba(255,255,255,.68)"; x.font = "900 28px system-ui,Arial";
    x.fillText(opts.footer, c.width / 2, c.height - 90, c.width - 110);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function logoTexture() {
  return makeTexture("SVR", ["DAILY", "GIVEAWAY"], { w: 720, h: 720, titleFont: "900 170px system-ui,Arial", titleY: 190, startY: 390, gap: 76, border: "rgba(0,255,204,.92)", glow: "rgba(0,255,204,.8)", bg0: "#02070a", bg1: "#090525", bg2: "#041d1b" });
}
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.38, metalness: opts.metalness ?? 0.24, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide, depthWrite: opts.depthWrite ?? true });
}
function basicMap(texture, opacity = 0.97) { return new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }); }
function glow(color, opacity = .16) { return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }); }
function addBox(root, name, size, pos, material) { const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material); m.name = name; m.position.set(pos[0], pos[1], pos[2]); root.add(m); return m; }
function addPanel(root, name, size, pos, texture, opacity = .97) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), basicMap(texture, opacity)); m.name = name; m.position.set(pos[0], pos[1], pos[2]); m.renderOrder = 470; root.add(m); return m; }
function addPlant(root, x, z, scale = 1) {
  const g = new THREE.Group(); g.name = "SVR_STORE_PLANT_SIDE_ONLY"; g.position.set(x, 0, z); g.scale.setScalar(scale); root.add(g);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.36, 20), mat(0x271616, { roughness: 0.72, metalness: 0.08 })); pot.position.y = 0.18; g.add(pot);
  const leaf = mat(0x2f9b64, { roughness: 0.86, emissive: 0x052614, emissiveIntensity: 0.12, side: THREE.DoubleSide });
  for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), leaf); const a = i / 10 * Math.PI * 2; l.scale.set(0.36, 1.38, 0.10); l.position.set(Math.cos(a) * 0.16, 0.52 + (i % 3) * 0.05, Math.sin(a) * 0.16); l.rotation.set(0.52, a, i % 2 ? 0.28 : -0.28); g.add(l); }
}

export function applySvrStorefrontModule12(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_STOREFRONT_MODULE_12_LOCK")) return null;
  const root = new THREE.Group(); root.name = "SVR_STOREFRONT_MODULE_12_LOCK"; root.position.copy(ROOT_POS); root.lookAt(LOOK_AT); scene.add(root);

  const dark = mat(0x070b12, { roughness: 0.72, metalness: 0.12, emissive: 0x050818, emissiveIntensity: 0.18 });
  const purple = mat(0x5c45ff, { roughness: 0.22, metalness: 0.58, emissive: 0x19009a, emissiveIntensity: 0.75 });
  const cyan = mat(0x00ffcc, { roughness: 0.20, metalness: 0.54, emissive: 0x00ffcc, emissiveIntensity: 0.55 });
  const gold = mat(0xffd15c, { roughness: 0.24, metalness: 0.54, emissive: 0x6b3a00, emissiveIntensity: 0.32 });
  const glass = mat(0xa7fff7, { opacity: 0.14, roughness: 0.04, metalness: 0.12, emissive: 0x1b7d78, emissiveIntensity: 0.18, side: THREE.DoubleSide, depthWrite: false });

  addBox(root, "SVR_STORE_BACK_WALL_CLEAN", [9.6, 4.6, 0.24], [0, 2.35, -1.28], dark);
  addBox(root, "SVR_STORE_TOP_TRIM_CLEAN", [10.0, 0.14, 0.32], [0, 4.72, -1.08], purple);
  addBox(root, "SVR_STORE_BOTTOM_TRIM_CLEAN", [10.0, 0.10, 0.32], [0, 0.18, -1.08], cyan);
  addBox(root, "SVR_STORE_LEFT_COLUMN_CLEAN", [0.18, 4.6, 0.32], [-4.9, 2.35, -1.08], purple);
  addBox(root, "SVR_STORE_RIGHT_COLUMN_CLEAN", [0.18, 4.6, 0.32], [4.9, 2.35, -1.08], purple);
  addBox(root, "SVR_STORE_GLASS_FRONT_CLEAN", [9.4, 3.6, 0.06], [0, 2.18, 0.28], glass);

  addPanel(root, "SVR_STORE_FRONT_MARQUEE_CLEAN", [5.2, .96], [0, 4.18, .38], makeTexture("SVR STORE", ["premium storefront hub", "store carousel + daily giveaway"], { w: 1200, h: 360, titleFont: "900 78px system-ui,Arial", titleY: 98, startY: 210, gap: 46, border: "rgba(180,140,255,.94)" }), .98);

  const carousel = addPanel(root, "SVR_STORE_SINGLE_CAROUSEL_PANEL", [3.45, 3.05], [-1.32, 2.32, .44], makeTexture(CARDS[0].title, CARDS[0].lines, { footer: "SLIDE / ACTION READY" }), .98);
  let active = 0;
  function setCard(i) {
    active = (i + CARDS.length) % CARDS.length;
    const card = CARDS[active];
    carousel.material.map = makeTexture(card.title, card.lines, { border: active === 1 ? "rgba(255,209,92,.92)" : "rgba(180,140,255,.88)", glow: active === 1 ? "rgba(255,209,92,.75)" : "rgba(180,140,255,.72)", footer: `CARD ${active + 1} / ${CARDS.length}` });
    carousel.material.needsUpdate = true;
    window.SVR_STORE_CAROUSEL_12_ACTIVE = { index: active, card };
  }

  const kiosk = new THREE.Group(); kiosk.name = "SVR_DAILY_GIVEAWAY_KIOSK_LOCK"; kiosk.position.set(2.35, 0, .72); root.add(kiosk);
  addBox(kiosk, "SVR_DAILY_GIVEAWAY_KIOSK_BASE", [1.52, .22, 1.08], [0, .11, 0], dark);
  addBox(kiosk, "SVR_DAILY_GIVEAWAY_KIOSK_BODY", [1.26, 1.05, .82], [0, .72, 0], mat(0x090d18, { roughness: .55, metalness: .18, emissive: 0x080014, emissiveIntensity: .16 }));
  addBox(kiosk, "SVR_DAILY_GIVEAWAY_KIOSK_COUNTER", [1.58, .14, 1.02], [0, 1.27, 0], gold);
  addPanel(kiosk, "SVR_DAILY_GIVEAWAY_KIOSK_LABEL", [1.25, .42], [0, 1.67, .48], makeTexture("DAILY GIVEAWAY", ["claim preview"], { w: 900, h: 300, titleFont: "900 46px system-ui,Arial", titleY: 88, startY: 175, gap: 42, border: "rgba(255,209,92,.92)", glow: "rgba(255,209,92,.70)" }), .98);
  const holoGlow = new THREE.Mesh(new THREE.RingGeometry(.62, .78, 96), glow(0x00ffcc, .30)); holoGlow.name = "SVR_DAILY_GIVEAWAY_TWIRL_HOLO_RING"; holoGlow.rotation.x = -Math.PI / 2; holoGlow.position.set(0, 2.05, 0); kiosk.add(holoGlow);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), basicMap(logoTexture(), .94)); logo.name = "SVR_DAILY_GIVEAWAY_TWIRLING_LOGO"; logo.position.set(0, 2.18, 0); logo.renderOrder = 490; kiosk.add(logo);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(.68, 32, 16), glow(0x00ffcc, .08)); halo.name = "SVR_DAILY_GIVEAWAY_SOFT_HOLOGRAM_DOME"; halo.position.set(0, 2.18, 0); kiosk.add(halo);

  const prev = addPanel(root, "SVR_STORE_CAROUSEL_PREV_BUTTON", [.72, .38], [-3.48, .98, .58], makeTexture("◀", ["SLIDE"], { w: 420, h: 260, titleFont: "900 90px system-ui,Arial", titleY: 88, startY: 172, gap: 38, border: "rgba(0,255,204,.88)" }), .96);
  const next = addPanel(root, "SVR_STORE_CAROUSEL_NEXT_BUTTON", [.72, .38], [.86, .98, .58], makeTexture("▶", ["SLIDE"], { w: 420, h: 260, titleFont: "900 90px system-ui,Arial", titleY: 88, startY: 172, gap: 38, border: "rgba(0,255,204,.88)" }), .96);
  const action = addPanel(root, "SVR_STORE_CAROUSEL_ACTION_BUTTON", [1.06, .38], [-1.32, .98, .59], makeTexture("ACTION", ["open later"], { w: 520, h: 260, titleFont: "900 52px system-ui,Arial", titleY: 82, startY: 164, gap: 38, border: "rgba(255,209,92,.88)", glow: "rgba(255,209,92,.65)" }), .96);
  prev.userData.activate = () => setCard(active - 1);
  next.userData.activate = () => setCard(active + 1);
  action.userData.activate = () => { if (CARDS[active]?.title === "DAILY GIVEAWAY") window.SVR_DAILY_GIVEAWAY_SELECTED = true; else window.open("/site/store.html", "_blank", "noopener,noreferrer"); };

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.08, 96), glow(0xb48cff, .35)); ring.name = "SVR_STORE_INTERACTION_RING"; ring.rotation.x = -Math.PI / 2; ring.position.set(-1.32, 0.08, 1.32); ring.renderOrder = 480; root.add(ring);
  addPlant(root, -4.35, 0.85, 0.84); addPlant(root, 4.35, 0.85, 0.84);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now() * 0.001;
    ring.rotation.z += 0.0014; ring.material.opacity = 0.26 + Math.sin(t * 1.1) * 0.06;
    holoGlow.rotation.z += 0.006; logo.rotation.y += 0.012; halo.material.opacity = 0.055 + Math.sin(t * 2.0) * 0.018;
  };

  window.SVR_STORE_CAROUSEL_12 = { build: BUILD, cards: CARDS, setCard, next: () => setCard(active + 1), prev: () => setCard(active - 1), getActive: () => ({ index: active, card: CARDS[active] }) };
  window.SVR_STOREFRONT_MODULE_12 = { build: BUILD, position: ROOT_POS.toArray(), consolidatedCarousel: true, dailyGiveawayKiosk: true, modularPacketReady: true, checkoutLive: false, databaseLive: false };
  scene.userData.SVR_STOREFRONT_MODULE_12 = window.SVR_STOREFRONT_MODULE_12;
  log?.("SVR storefront carousel/giveaway kiosk 1.3 loaded", window.SVR_STOREFRONT_MODULE_12);
  return root;
}
