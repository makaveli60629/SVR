import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-4H-REIKI-SCORPION-POLISH";

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1200;
  c.height = opts.h || 460;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "#130005");
  g.addColorStop(.52, opts.bg1 || "#2b0008");
  g.addColorStop(1, opts.bg2 || "#06070c");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(255,36,52,.96)";
  x.lineWidth = opts.line || 12;
  x.strokeRect(24, 24, c.width - 48, c.height - 48);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.shadow || "rgba(255,20,35,.72)";
  x.shadowBlur = 20;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 86px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 138, c.width - 90);
  x.shadowBlur = 6;
  x.fillStyle = opts.lineColor || "#ff4050";
  x.font = opts.lineFont || "900 44px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 260) + i * (opts.gap || 60), c.width - 110));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function basicMap(tex, opacity = .98) {
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
}
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? .52, metalness: opts.metalness ?? .18, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide, depthWrite: opts.depthWrite ?? true });
}
function glow(color, opacity = .18) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
}
function hideTree(obj) {
  if (!obj) return 0;
  let n = 0;
  obj.visible = false; n++;
  obj.traverse?.(c => { c.visible = false; n++; });
  return n;
}
function plane(root, name, size, pos, material, rot = [0,0,0], order = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.set(rot[0], rot[1], rot[2]);
  m.renderOrder = order;
  root.add(m);
  return m;
}
function box(root, name, size, pos, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  root.add(m);
  return m;
}
function cyl(root, name, radius, height, pos, material, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, seg), material);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  root.add(m);
  return m;
}
function addPlantCluster(root, x, z, label, scale = 1) {
  const g = new THREE.Group();
  g.name = `SVR_REIKI_PLANT_BED_CLUSTER_${label}`;
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  root.add(g);
  const soil = mat(0x1a100b, { roughness: .85, metalness: .02 });
  box(g, `SVR_REIKI_PLANT_BED_SOIL_${label}`, [1.12, .12, .34], [0, .06, 0], soil);
  const leafA = mat(0x2c9d58, { roughness: .78, emissive: 0x062514, emissiveIntensity: .14, side: THREE.DoubleSide });
  const leafB = mat(0x3bd676, { roughness: .78, emissive: 0x062514, emissiveIntensity: .12, side: THREE.DoubleSide });
  for (let i = 0; i < 10; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), i % 2 ? leafA : leafB);
    l.name = `SVR_REIKI_PLANT_BED_LEAF_${label}_${i}`;
    l.scale.set(.34, 1.15 + (i % 3) * .16, .10);
    l.position.set(-.45 + i * .10, .22 + (i % 3) * .03, (i % 2 ? .05 : -.05));
    l.rotation.set(.52, i * .33, i % 2 ? .26 : -.26);
    g.add(l);
  }
  return g;
}

function suppressScreenControls() {
  const overlay = document.getElementById("svr-rici-holo-controls");
  if (overlay) {
    overlay.style.display = "none";
    overlay.style.pointerEvents = "none";
    overlay.setAttribute("aria-hidden", "true");
  }
  const style = document.getElementById("svr-rici-holo-controls-style") || document.createElement("style");
  style.id = "svr-rici-holo-controls-style";
  style.textContent = `#svr-rici-holo-controls{display:none!important;pointer-events:none!important}`;
  if (!style.parentNode) document.head.appendChild(style);
  return !!overlay;
}

function polishReiki(scene) {
  const root = scene.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK");
  if (!root) return { found: false };
  let hidden = 0, adjusted = 0;
  root.traverse(obj => {
    const n = String(obj.name || "");
    if (/MAIN_SIGN|APPROVAL_SIGN_FRONT_LOCK/i.test(n)) hidden += hideTree(obj);
    if (/RED_ROPE_|POLE_STEM_|SILVER_POLE_|POLE_CAP_/i.test(n)) hidden += hideTree(obj);
    if (/PLANT_CARPET_SIDE|ASSET_PLANT_4|ASSET_PLANT_5/i.test(n)) hidden += hideTree(obj);
    if (/LEFT_INFO_WALL/i.test(n)) { obj.position.set(-3.85, 2.62, -3.00); obj.rotation.y = .34; obj.scale.set(1.10, 1.10, 1); obj.renderOrder = 920; adjusted++; }
    if (/RIGHT_PROFILE_WALL/i.test(n)) { obj.position.set(3.85, 2.62, -3.00); obj.rotation.y = -.34; obj.scale.set(1.10, 1.10, 1); obj.renderOrder = 920; adjusted++; }
    if (/ACTIVE_HOLOGRAM_CARD|CARD_BACKGLOW|HOLOGRAM_BEAM|ACTIVATION_RING|REIKI_HOLOGRAM_VIDEO|VIDEO/i.test(n)) { obj.renderOrder = Math.max(obj.renderOrder || 0, 940); obj.visible = true; adjusted++; }
  });
  const sign = plane(root, "SVR_REIKI_HUB_BIG_RED_APPROVAL_SIGN_14H", [6.9, 1.18], [0, 6.86, 1.35], basicMap(makeTexture("REIKI HUB", ["AWAITING APPROVAL"], { titleFont: "900 92px system-ui,Arial", lineFont: "900 48px system-ui,Arial", titleY: 136, startY: 282, border: "rgba(255,40,55,.98)", lineColor: "#ff4050" }), .99), [0, 0, 0], 980);
  sign.material.depthTest = false;
  const hint = plane(root, "SVR_REIKI_IN_WORLD_SMALL_CONTROL_HINT_14H", [1.85, .42], [0, .48, .82], basicMap(makeTexture("CONTROLS", ["Grip aim • Trigger / Slide"], { w: 900, h: 240, titleFont: "900 38px system-ui,Arial", lineFont: "800 24px system-ui,Arial", titleY: 72, startY: 145, border: "rgba(0,255,204,.75)", lineColor: "#dffff8", bg0: "#001212", bg1: "#05161c", bg2: "#070710" }), .90), [0, 0, 0], 930);
  hint.material.depthTest = false;
  [-3.05, 3.05].forEach((xSide, side) => {
    const zs = [1.15, 2.35, 3.55, 4.75, 5.95, 7.05];
    let prev = null;
    zs.forEach((z, i) => {
      const g = new THREE.Group();
      g.name = `SVR_REIKI_POLISHED_ROPE_POLE_${side}_${i}`;
      g.position.set(xSide, 0, z);
      root.add(g);
      cyl(g, `SVR_REIKI_POLISHED_POLE_STEM_${side}_${i}`, .042, 1.04, [0, .52, 0], mat(0xdedede, { roughness: .18, metalness: .88, emissive: 0x151515, emissiveIntensity: .05 }), 24);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(.10, 20, 10), mat(0xe8e8e8, { roughness: .18, metalness: .9 }));
      cap.name = `SVR_REIKI_POLISHED_POLE_CAP_${side}_${i}`; cap.position.y = 1.08; g.add(cap);
      if (prev) {
        const midZ = (prev.z + z) / 2;
        const len = Math.abs(z - prev.z);
        const rope = new THREE.Mesh(new THREE.TorusGeometry(len / 2, .025, 8, 48, Math.PI), mat(0xb4001f, { roughness: .4, emissive: 0x5a0010, emissiveIntensity: .30 }));
        rope.name = `SVR_REIKI_POLISHED_SAGGING_RED_ROPE_${side}_${i}`;
        rope.position.set(xSide, .96, midZ);
        rope.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        rope.scale.y = .20;
        root.add(rope);
      }
      prev = { x: xSide, z };
    });
  });
  for (let z = 1.25; z <= 7.0; z += .95) { addPlantCluster(root, -4.15, z, `L_${z.toFixed(1)}`, .75); addPlantCluster(root, 4.15, z, `R_${z.toFixed(1)}`, .75); }
  return { found: true, hidden, adjusted, sign: true, plantBeds: true, ropeSpread: true };
}

function addScorpionPortalTable(scene) {
  if (scene.getObjectByName("SVR_SCORPION_PORTAL_TABLE_14H_LOCK")) return { created: false, reason: "exists" };
  const root = new THREE.Group();
  root.name = "SVR_SCORPION_PORTAL_TABLE_14H_LOCK";
  root.position.set(18.9, 0, -7.2);
  root.lookAt(0, 1.2, 0);
  scene.add(root);
  const dark = mat(0x07070b, { roughness: .58, metalness: .20, emissive: 0x0a0308, emissiveIntensity: .10 });
  const red = mat(0xff1e3b, { roughness: .24, metalness: .34, emissive: 0x5b0010, emissiveIntensity: .45 });
  cyl(root, "SVR_SCORPION_PORTAL_TABLE_TOP", 1.08, .18, [0, .82, 0], dark, 64);
  cyl(root, "SVR_SCORPION_PORTAL_TABLE_BASE", .20, .82, [0, .41, 0], dark, 32);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.72, .018, 8, 80), glow(0xff1e3b, .55));
  ring.name = "SVR_SCORPION_ROOM_SELECT_HOLO_RING"; ring.position.set(0, 1.10, 0); ring.rotation.x = Math.PI / 2; root.add(ring);
  const panel = plane(root, "SVR_SCORPION_ROOM_SELECT_HOLOGRAM_PANEL", [1.65, .95], [0, 1.72, .05], basicMap(makeTexture("SCORPION ROOMS", ["select destination", "portal table"], { w: 900, h: 520, titleFont: "900 56px system-ui,Arial", lineFont: "850 30px system-ui,Arial", titleY: 120, startY: 235, gap: 58, border: "rgba(255,30,59,.96)", lineColor: "#ffdfe4" }), .96), [0, 0, 0], 940);
  panel.userData.activate = () => { const btn = document.querySelector('#sceneNav .scene-btn[data-scene="scorpionRoom"],#sceneNav .scene-btn[data-scene="scorpion"]'); if (btn) { btn.click(); return true; } window.location.href = "./scorpion.html?v=scorpion-table-14h"; return true; };
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.5), new THREE.MeshBasicMaterial({ color: 0x24000a, transparent: true, opacity: .20, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  seam.name = "SVR_REIKI_TO_SCORPION_SOFT_SEAM_14H"; seam.rotation.x = -Math.PI / 2; seam.position.set(0, .026, 1.9); root.add(seam);
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) { oldTick?.apply(this, args); const t = performance.now() * .001; ring.rotation.z += .01; panel.position.y = 1.72 + Math.sin(t * 1.6) * .035; };
  return { created: true };
}

function moveDirectory(scene) {
  const dir = scene.getObjectByName("SVR_PORTAL_PLAZA_DIRECTORY_12_LOCK");
  if (!dir) return false;
  dir.position.set(-14.6, 0, 14.8);
  dir.lookAt(0, 1.25, 0);
  dir.userData.SVR_MOVED_FOR_SCORPION_14H = true;
  return true;
}

export function applyReikiScorpionPolish14(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_REIKI_SCORPION_POLISH_14H_LOCK")) return null;
  const lock = new THREE.Group(); lock.name = "SVR_REIKI_SCORPION_POLISH_14H_LOCK"; scene.add(lock);
  const screenControlsHidden = suppressScreenControls();
  const reiki = polishReiki(scene);
  const scorpion = addScorpionPortalTable(scene);
  const directoryMoved = moveDirectory(scene);
  window.SVR_REIKI_SCORPION_POLISH_14H = { build: BUILD, screenControlsHidden, reiki, scorpion, directoryMoved, goal: "Reiki presentation readable, no screen-follow controls, polished red carpet, scorpion table hub" };
  scene.userData.SVR_REIKI_SCORPION_POLISH_14H = window.SVR_REIKI_SCORPION_POLISH_14H;
  log?.("Reiki/Scorpion polish 1.4H loaded", window.SVR_REIKI_SCORPION_POLISH_14H);
  return lock;
}
