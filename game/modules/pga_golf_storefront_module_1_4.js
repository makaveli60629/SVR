import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-4A-PGA-GOLF-STOREFRONT-MODULE";
const ROOT_POS = new THREE.Vector3(-17.25, 0, -13.85);
const LOOK_AT = new THREE.Vector3(0, 1.2, 0);

const CARDS = [
  { title: "PGA GOLF TRAINING", lines: ["driving range preview", "coach profile module", "lesson funnel placeholder", "APPROVAL/CONTENT REVIEW"] },
  { title: "JUAN E. ESPEJO", lines: ["PGA professional profile", "Miraville Golf Academy", "bio/details slot", "review before final"] },
  { title: "DRIVING RANGE", lines: ["teleport-ready route", "club physics preview", "stance tutorial planned", "Quest-safe scene next"] },
  { title: "CHIP + PUTT", lines: ["short-game practice", "target drills", "scoring board placeholder", "future training module"] },
  { title: "LESSON BOOKING", lines: ["future booking link", "no payment live", "no database live", "admin owner later"] }
];

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1024;
  c.height = opts.h || 1024;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "#031018");
  g.addColorStop(.55, opts.bg1 || "#061b2d");
  g.addColorStop(1, opts.bg2 || "#061e16");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(112,183,255,.90)";
  x.lineWidth = 12;
  x.strokeRect(26, 26, c.width - 52, c.height - 52);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.glow || "rgba(112,183,255,.72)";
  x.shadowBlur = 24;
  x.fillStyle = "#ffffff";
  x.font = opts.titleFont || "900 72px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 132, c.width - 92);
  x.shadowBlur = 7;
  x.fillStyle = opts.lineColor || "#eaffff";
  x.font = opts.lineFont || "800 38px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 286) + i * (opts.gap || 78), c.width - 110));
  if (opts.footer) {
    x.fillStyle = "rgba(255,255,255,.68)";
    x.font = "900 28px system-ui,Arial";
    x.fillText(opts.footer, c.width / 2, c.height - 92, c.width - 110);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? .38, metalness: opts.metalness ?? .24, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide, depthWrite: opts.depthWrite ?? true });
}
function basicMap(texture, opacity = .97) { return new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }); }
function glow(color, opacity = .16) { return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }); }
function addBox(root, name, size, pos, material) { const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material); m.name = name; m.position.set(pos[0], pos[1], pos[2]); root.add(m); return m; }
function addPanel(root, name, size, pos, texture, opacity = .98) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), basicMap(texture, opacity)); m.name = name; m.position.set(pos[0], pos[1], pos[2]); m.renderOrder = 500; root.add(m); return m; }
function addTee(root, x, z) {
  const g = new THREE.Group();
  g.name = "SVR_PGA_TEE_PROP";
  g.position.set(x, 0, z);
  root.add(g);
  const tee = new THREE.Mesh(new THREE.CylinderGeometry(.035, .055, .42, 16), mat(0xf4f4e8, { roughness: .44 }));
  tee.position.y = .21;
  g.add(tee);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.105, 24, 12), mat(0xffffff, { roughness: .32, metalness: .02 }));
  ball.position.y = .50;
  g.add(ball);
  return g;
}
function addClub(root, x, z, rot = 0) {
  const g = new THREE.Group();
  g.name = "SVR_PGA_CLUB_PROP";
  g.position.set(x, .85, z);
  g.rotation.z = rot;
  root.add(g);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1.55, 10), mat(0xbfc7d5, { roughness: .25, metalness: .65 }));
  shaft.rotation.z = .42;
  g.add(shaft);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.42, .14, .18), mat(0x20242a, { roughness: .30, metalness: .52 }));
  head.position.set(.33, -.68, 0);
  head.rotation.z = .12;
  g.add(head);
}

export function applyPgaGolfStorefront14(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PGA_GOLF_STOREFRONT_14_LOCK")) return null;
  const root = new THREE.Group();
  root.name = "SVR_PGA_GOLF_STOREFRONT_14_LOCK";
  root.position.copy(ROOT_POS);
  root.lookAt(LOOK_AT);
  scene.add(root);

  const dark = mat(0x061018, { roughness: .72, metalness: .12, emissive: 0x031121, emissiveIntensity: .18 });
  const blue = mat(0x70b7ff, { roughness: .22, metalness: .58, emissive: 0x003b8a, emissiveIntensity: .72 });
  const green = mat(0x42ff8d, { roughness: .24, metalness: .42, emissive: 0x0c7935, emissiveIntensity: .52 });
  const gold = mat(0xffd15c, { roughness: .24, metalness: .54, emissive: 0x6b3a00, emissiveIntensity: .24 });
  const glass = mat(0xa7fff7, { opacity: .13, roughness: .04, metalness: .12, emissive: 0x1b7d78, emissiveIntensity: .16, side: THREE.DoubleSide, depthWrite: false });

  addBox(root, "SVR_PGA_BACK_WALL", [9.8, 4.55, .24], [0, 2.34, -1.25], dark);
  addBox(root, "SVR_PGA_GLASS_FRONT", [9.45, 3.55, .06], [0, 2.16, .30], glass);
  addBox(root, "SVR_PGA_TOP_TRIM", [10.15, .14, .32], [0, 4.70, -1.05], blue);
  addBox(root, "SVR_PGA_BOTTOM_TRIM", [10.15, .10, .32], [0, .18, -1.05], green);
  addBox(root, "SVR_PGA_LEFT_COLUMN", [.18, 4.6, .32], [-4.95, 2.34, -1.05], blue);
  addBox(root, "SVR_PGA_RIGHT_COLUMN", [.18, 4.6, .32], [4.95, 2.34, -1.05], blue);
  addPanel(root, "SVR_PGA_MAIN_MARQUEE", [5.55, .96], [0, 4.16, .40], makeTexture("PGA GOLF HUB", ["training range • short game • lessons"], { w: 1250, h: 360, titleFont: "900 78px system-ui,Arial", titleY: 98, startY: 218, gap: 46, border: "rgba(112,183,255,.94)" }));

  const carousel = addPanel(root, "SVR_PGA_SINGLE_CAROUSEL_PANEL", [3.55, 3.05], [-1.18, 2.30, .46], makeTexture(CARDS[0].title, CARDS[0].lines, { footer: "SLIDE / ACTION READY" }));
  let active = 0;
  function setCard(i) {
    active = (i + CARDS.length) % CARDS.length;
    const card = CARDS[active];
    carousel.material.map = makeTexture(card.title, card.lines, { border: active === 2 ? "rgba(66,255,141,.92)" : "rgba(112,183,255,.90)", glow: active === 2 ? "rgba(66,255,141,.70)" : "rgba(112,183,255,.72)", footer: `CARD ${active + 1} / ${CARDS.length}` });
    carousel.material.needsUpdate = true;
    window.SVR_PGA_CAROUSEL_14_ACTIVE = { index: active, card };
  }
  function activateCard() {
    const title = CARDS[active]?.title || "";
    if (/DRIVING/i.test(title)) { const b = document.querySelector('#sceneNav .scene-btn[data-scene="pgaDrive"]'); if (b) { b.click(); return true; } window.location.href = "./pga.html?v=pga-storefront-14"; return true; }
    if (/CHIP/i.test(title)) { const b = document.querySelector('#sceneNav .scene-btn[data-scene="chipPutt"]'); if (b) { b.click(); return true; } window.location.href = "./pga.html?mode=chip-putt&v=pga-storefront-14"; return true; }
    window.SVR_PGA_STORE_ACTION_SELECTED = { index: active, title, at: Date.now() };
    return true;
  }

  const kiosk = new THREE.Group();
  kiosk.name = "SVR_PGA_RANGE_KIOSK_LOCK";
  kiosk.position.set(2.42, 0, .72);
  root.add(kiosk);
  addBox(kiosk, "SVR_PGA_RANGE_KIOSK_BASE", [1.60, .22, 1.08], [0, .11, 0], dark);
  addBox(kiosk, "SVR_PGA_RANGE_KIOSK_BODY", [1.32, 1.08, .82], [0, .72, 0], mat(0x08131c, { roughness: .55, metalness: .18, emissive: 0x001d44, emissiveIntensity: .20 }));
  addBox(kiosk, "SVR_PGA_RANGE_KIOSK_COUNTER", [1.64, .14, 1.02], [0, 1.28, 0], gold);
  addPanel(kiosk, "SVR_PGA_RANGE_KIOSK_LABEL", [1.28, .42], [0, 1.68, .48], makeTexture("DRIVING RANGE", ["enter preview"], { w: 900, h: 300, titleFont: "900 44px system-ui,Arial", titleY: 88, startY: 176, gap: 42, border: "rgba(66,255,141,.92)", glow: "rgba(66,255,141,.70)" }));
  const holo = new THREE.Mesh(new THREE.TorusGeometry(.46, .018, 8, 64), glow(0x42ff8d, .42));
  holo.name = "SVR_PGA_TWIRLING_GOLF_HOLOGRAM";
  holo.position.set(0, 2.18, 0);
  kiosk.add(holo);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.19, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .92, toneMapped: false }));
  ball.name = "SVR_PGA_TWIRLING_GOLF_BALL";
  ball.position.set(0, 2.18, 0);
  kiosk.add(ball);

  const prev = addPanel(root, "SVR_PGA_CAROUSEL_PREV_BUTTON", [.72, .38], [-3.38, .98, .58], makeTexture("◀", ["SLIDE"], { w: 420, h: 260, titleFont: "900 90px system-ui,Arial", titleY: 88, startY: 172, gap: 38, border: "rgba(112,183,255,.88)" }), .96);
  const next = addPanel(root, "SVR_PGA_CAROUSEL_NEXT_BUTTON", [.72, .38], [.98, .98, .58], makeTexture("▶", ["SLIDE"], { w: 420, h: 260, titleFont: "900 90px system-ui,Arial", titleY: 88, startY: 172, gap: 38, border: "rgba(112,183,255,.88)" }), .96);
  const action = addPanel(root, "SVR_PGA_CAROUSEL_ACTION_BUTTON", [1.06, .38], [-1.18, .98, .60], makeTexture("ACTION", ["open route"], { w: 520, h: 260, titleFont: "900 52px system-ui,Arial", titleY: 82, startY: 164, gap: 38, border: "rgba(66,255,141,.88)", glow: "rgba(66,255,141,.65)" }), .96);
  prev.userData.activate = () => setCard(active - 1);
  next.userData.activate = () => setCard(active + 1);
  action.userData.activate = activateCard;

  const ring = new THREE.Mesh(new THREE.RingGeometry(.94, 1.10, 96), glow(0x42ff8d, .35));
  ring.name = "SVR_PGA_INTERACTION_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(-1.18, .08, 1.34);
  ring.renderOrder = 500;
  root.add(ring);

  addTee(root, 3.85, 1.08);
  addClub(root, 4.18, .82, -.24);

  const camPos = new THREE.Vector3();
  const local = new THREE.Vector3();
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now() * .001;
    const cam = scene.userData?._camera || window.SVR_CAMERA || window.SVR_MAIN_CAMERA;
    if (cam?.getWorldPosition) { cam.getWorldPosition(camPos); local.copy(root.worldToLocal(camPos.clone())); window.SVR_PGA_INTERACTION_ACTIVE = Math.hypot(local.x - ring.position.x, local.z - ring.position.z) < 2.25; } else window.SVR_PGA_INTERACTION_ACTIVE = false;
    ring.rotation.z += .0014;
    ring.material.opacity = window.SVR_PGA_INTERACTION_ACTIVE ? .54 : .26 + Math.sin(t * 1.1) * .06;
    holo.rotation.x += .012;
    holo.rotation.y += .018;
    ball.position.y = 2.18 + Math.sin(t * 2.2) * .045;
  };

  window.SVR_PGA_CAROUSEL_14 = { build: BUILD, cards: CARDS, setCard, next: () => setCard(active + 1), prev: () => setCard(active - 1), activate: activateCard, getActive: () => ({ index: active, card: CARDS[active] }) };
  window.SVR_PGA_GOLF_STOREFRONT_14 = { build: BUILD, position: ROOT_POS.toArray(), interactionZone: true, carousel: true, routeButtons: ["pgaDrive", "chipPutt"], checkoutLive: false, databaseLive: false };
  scene.userData.SVR_PGA_GOLF_STOREFRONT_14 = window.SVR_PGA_GOLF_STOREFRONT_14;
  log?.("PGA golf storefront module 1.4A loaded", window.SVR_PGA_GOLF_STOREFRONT_14);
  return root;
}
