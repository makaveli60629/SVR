import * as THREE from "three";

const BUILD = "PHASE-119-REIKI-CORRECTLY-ORGANIZED-STOREFRONT-LOCK";
const STORE_CENTER = new THREE.Vector3(19.95, 0, 0);

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1000;
  c.height = opts.h || 480;
  const x = c.getContext("2d");
  const grad = x.createLinearGradient(0, 0, c.width, c.height);
  grad.addColorStop(0, opts.bg0 || "rgba(2,8,11,.96)");
  grad.addColorStop(.55, opts.bg1 || "rgba(12,4,24,.92)");
  grad.addColorStop(1, opts.bg2 || "rgba(2,26,24,.94)");
  x.fillStyle = grad;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(140,255,242,.84)";
  x.lineWidth = opts.line || 8;
  x.strokeRect(22, 22, c.width - 44, c.height - 44);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.shadow || "rgba(140,255,242,.58)";
  x.shadowBlur = 16;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 52px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 96, c.width - 80);
  x.shadowBlur = 7;
  x.fillStyle = opts.lineColor || "#cafff8";
  x.font = opts.lineFont || "800 27px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 178) + i * (opts.gap || 42), c.width - 90));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function addBox(root, name, size, pos, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  root.add(mesh);
  return mesh;
}

function addPlane(root, name, size, pos, material, rot = [0, 0, 0], order = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.renderOrder = order;
  root.add(mesh);
  return mesh;
}

function glassMaterial(opacity = .14) {
  return new THREE.MeshStandardMaterial({ color: 0x9ffff5, transparent: true, opacity, roughness: .04, metalness: .16, emissive: 0x16877b, emissiveIntensity: .22, side: THREE.DoubleSide, depthWrite: false });
}

function glowMaterial(color = 0x8ffff0, opacity = .35) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}

function loadTexture(urls) {
  const tex = new THREE.Texture();
  const loader = new THREE.TextureLoader();
  let index = 0;
  const next = () => {
    if (index >= urls.length) return;
    loader.load(urls[index++], (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      tex.copy(loaded);
      tex.needsUpdate = true;
    }, undefined, next);
  };
  next();
  return tex;
}

function addPlant(root, x, z, scale = .70, label = "") {
  const group = new THREE.Group();
  group.name = `SVR_PHASE119_PLANT_${label}`;
  group.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.16 * scale, .23 * scale, .30 * scale, 24), new THREE.MeshStandardMaterial({ color: 0x431316, roughness: .82 }));
  pot.position.y = .15 * scale;
  group.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f7a40, roughness: .66, emissive: 0x062714, emissiveIntensity: .14, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.085 * scale, 12, 8), leafMat);
    leaf.scale.set(.50, 1.75, .12);
    const a = i / 8 * Math.PI * 2;
    leaf.position.set(Math.cos(a) * .12 * scale, .50 * scale + (i % 3) * .055 * scale, Math.sin(a) * .12 * scale);
    leaf.rotation.set(.55, a, i % 2 ? .32 : -.32);
    group.add(leaf);
  }
  root.add(group);
  return group;
}

function addPole(root, x, z, label) {
  const silver = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: .92, roughness: .18, emissive: 0x151515, emissiveIntensity: .06 });
  const group = new THREE.Group();
  group.name = `SVR_PHASE119_POLE_${label}`;
  group.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.0, 20), silver);
  stem.position.y = .52;
  group.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 10), silver);
  cap.position.y = 1.06;
  group.add(cap);
  root.add(group);
  return group.position;
}

function addRope(root, a, b, label) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xb4001f, roughness: .36, metalness: .04, emissive: 0x5a0010, emissiveIntensity: .30 });
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const geo = new THREE.CylinderGeometry(.037, .037, len, 16);
  geo.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `SVR_PHASE119_ROPE_${label}`;
  mesh.position.set((a.x + b.x) / 2, 1.0, (a.z + b.z) / 2);
  mesh.rotation.y = Math.atan2(b.z - a.z, b.x - a.x);
  root.add(mesh);
  return mesh;
}

function purgeReiki(scene) {
  const kill = [];
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if (/SVR_PHASE10[1-9].*REIKI|SVR_PHASE11[0-8].*REIKI|SVR_PHASE11[0-8].*Hologram|SVR_PHASE11[0-8].*SYMBOL|SVR_PHASE11[0-8].*CHAKRA|TRUEITIVE_BANNER|FOUNDER_PRESENTATION|CHAKRA_WALL/i.test(n)) kill.push(obj);
  });
  let removed = 0;
  kill.forEach((obj) => { if (obj.parent) { obj.parent.remove(obj); removed++; } });
  document.querySelectorAll("video").forEach((v) => {
    const src = String(v.currentSrc || v.src || "").toLowerCase();
    if (src.includes("reiki_hologram") || src.includes("hologram")) { try { v.pause(); v.remove(); } catch {} }
  });
  return removed;
}

function addStoreShell(root) {
  const glass = glassMaterial(.13);
  const trim = new THREE.MeshStandardMaterial({ color: 0xd2d8dd, metalness: .86, roughness: .20, emissive: 0x1b2d30, emissiveIntensity: .22 });
  const carpet = new THREE.MeshStandardMaterial({ color: 0x980019, roughness: .86, metalness: .02, emissive: 0x2d0008, emissiveIntensity: .22, side: THREE.DoubleSide });
  const W = 14.2, H = 6.25, F = 1.04, B = -2.92, S = W / 2, GAP = 4.95, GW = (W - GAP) / 2;
  const LX = -(GAP / 2 + GW / 2), RX = (GAP / 2 + GW / 2), MID = (F + B) / 2;

  addBox(root, "SVR_PHASE119_TOP_HEADER", [W, .20, .30], [0, H, F], trim);
  addBox(root, "SVR_PHASE119_BOTTOM_TRACK", [W, .075, .22], [0, .34, F], trim);
  addBox(root, "SVR_PHASE119_LEFT_FRAME", [.20, H, .30], [-S, H / 2, F], trim);
  addBox(root, "SVR_PHASE119_RIGHT_FRAME", [.20, H, .30], [S, H / 2, F], trim);
  addBox(root, "SVR_PHASE119_LEFT_ENTRY_POST", [.16, H - .55, .28], [-GAP / 2, H / 2, F], trim);
  addBox(root, "SVR_PHASE119_RIGHT_ENTRY_POST", [.16, H - .55, .28], [GAP / 2, H / 2, F], trim);
  addPlane(root, "SVR_PHASE119_FRONT_GLASS_LEFT", [GW, H - .95], [LX, H / 2 + .08, F + .025], glass, [0, 0, 0], 90);
  addPlane(root, "SVR_PHASE119_FRONT_GLASS_RIGHT", [GW, H - .95], [RX, H / 2 + .08, F + .025], glass.clone(), [0, 0, 0], 90);
  addPlane(root, "SVR_PHASE119_LEFT_SIDE_GLASS", [F - B, H - 1.1], [-S + .04, H / 2 + .08, MID], glass.clone(), [0, Math.PI / 2, 0], 88);
  addPlane(root, "SVR_PHASE119_RIGHT_SIDE_GLASS", [F - B, H - 1.1], [S - .04, H / 2 + .08, MID], glass.clone(), [0, -Math.PI / 2, 0], 88);

  addPlane(root, "SVR_PHASE119_RED_CARPET_OPEN_WALKWAY", [4.55, 9.15], [0, .02, 3.08], carpet, [-Math.PI / 2, 0, 0], 12);
  const zs = [1.1, 2.35, 3.6, 4.85, 6.1];
  const left = zs.map((z, i) => addPole(root, -2.28, z, `L${i}`));
  const right = zs.map((z, i) => addPole(root, 2.28, z, `R${i}`));
  for (let i = 0; i < zs.length - 1; i++) { addRope(root, left[i], left[i + 1], `L${i}`); addRope(root, right[i], right[i + 1], `R${i}`); }

  addPlant(root, -5.88, -2.06, .74, "back-left");
  addPlant(root, 5.88, -2.06, .74, "back-right");
  addPlant(root, -3.05, 6.25, .70, "entry-left");
  addPlant(root, 3.05, 6.25, .70, "entry-right");
  addPlant(root, -5.92, .78, .58, "left-mid");
  addPlant(root, 5.92, .78, .58, "right-mid");

  addPlane(root, "SVR_PHASE119_MAIN_SIGN", [5.05, .92], [0, 5.98, F + .08], new THREE.MeshBasicMaterial({ map: makeTexture("REIKI / RIKI STOREFRONT", ["organized presentation path", "approval pending"], { w: 1200, h: 320, titleFont: "900 48px system-ui,Arial", lineFont: "800 25px system-ui,Arial", titleY: 88, startY: 172, gap: 42, border: "rgba(255,80,100,.78)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 240);
}

function addLeftInfoBehindGlass(root) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE119_LEFT_WALKWAY_INFO_BEHIND_GLASS";
  group.position.set(-3.65, 0, .02);
  group.rotation.y = .10;
  root.add(group);
  const founderTex = loadTexture(["./assets/ui/trueitive-founder.png", "../game/assets/ui/trueitive-founder.png"]);
  const logoTex = loadTexture(["./assets/ui/trueitive-logo.png", "../game/assets/ui/trueitive-logo.png"]);
  const glow = addPlane(group, "SVR_PHASE119_LEFT_INFO_SOFT_GLOW", [2.48, 4.55], [0, 2.75, -.08], glowMaterial(0x8ffff0, .09), [0, 0, 0], 205);
  const logo = addPlane(group, "SVR_PHASE119_LEFT_LOGO_PANEL", [1.66, .82], [0, 4.50, .04], new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .92 }), [0, 0, 0], 230);
  const founder = addPlane(group, "SVR_PHASE119_LEFT_FOUNDER_PANEL", [1.04, 1.46], [0, 3.22, .05], new THREE.MeshBasicMaterial({ map: founderTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .82 }), [0, 0, 0], 230);
  addPlane(group, "SVR_PHASE119_LEFT_ABOUT_PANEL", [2.15, 1.34], [0, 1.62, .06], new THREE.MeshBasicMaterial({ map: makeTexture("ABOUT", ["founder intro", "wellness preview", "private-room path", "presentation only"], { w: 800, h: 460, titleFont: "900 46px system-ui,Arial", lineFont: "800 23px system-ui,Arial", titleY: 76, startY: 148, gap: 42, border: "rgba(145,255,240,.72)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  group.userData.tick = (t) => { glow.material.opacity = .075 + Math.sin(t * .002) * .018; logo.position.y = 4.50 + Math.sin(t * .0017) * .018; founder.position.y = 3.22 + Math.sin(t * .0014 + 1) * .015; };
  return group;
}

function addRightSymbolWall(root) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE119_RIGHT_GLOWING_SYMBOL_WALL";
  group.position.set(3.65, 0, -.42);
  group.rotation.y = -.10;
  root.add(group);
  addPlane(group, "SVR_PHASE119_SYMBOL_WALL_GLOW_BACKGROUND", [2.72, 4.9], [0, 3.02, -.08], glowMaterial(0x7b4dff, .11), [0, 0, 0], 205);
  const symbols = [["根",0xff3148],["丹",0xff8a2d],["陽",0xffd447],["心",0x36e875],["声",0x38c9ff],["眼",0x7270ff],["冠",0xd696ff]];
  symbols.forEach(([kanji, color], i) => {
    const y = 4.75 - i * .48;
    const disk = new THREE.Mesh(new THREE.CircleGeometry(.22, 48), glowMaterial(color, .50));
    disk.name = `SVR_PHASE119_SYMBOL_DISC_${i}`;
    disk.position.set(-.68, y, .04);
    group.add(disk);
    addPlane(group, `SVR_PHASE119_KANJI_${i}`, [.58, .28], [-.05, y, .06], new THREE.MeshBasicMaterial({ map: makeTexture(kanji, [], { w: 300, h: 150, titleFont: "900 66px system-ui,Arial", titleY: 74, border: "rgba(255,255,255,.35)", line: 4 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  });
  addPlane(group, "SVR_PHASE119_RIGHT_JAPANESE_TEXT", [2.34, .72], [0, 1.08, .06], new THREE.MeshBasicMaterial({ map: makeTexture("霊気 • 癒し", ["調和 • 光 • 平和"], { w: 900, h: 300, titleFont: "900 54px system-ui,Arial", lineFont: "800 25px system-ui,Arial", titleY: 86, startY: 180, border: "rgba(145,255,240,.70)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  return group;
}

function addCenterVideoAndPortal(root, scene, gotoScene) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE119_CENTER_VIDEO_AND_END_PORTAL";
  group.position.set(0, 0, -.58);
  root.add(group);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.56, .82, .15, 56), new THREE.MeshStandardMaterial({ color: 0x061315, emissive: 0x0b8178, emissiveIntensity: .36, metalness: .82, roughness: .24 }));
  base.position.y = .54;
  group.add(base);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.17, .58, 2.16, 56, 1, true), glowMaterial(0x8ffff0, .08));
  beam.position.y = 1.42;
  group.add(beam);
  const mat = new THREE.MeshBasicMaterial({ map: makeTexture("REIKI VIDEO", ["single preview", "does not block path"], { w: 820, h: 1040, titleY: 170, startY: 305 }), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.00, 1.84), mat);
  panel.name = "SVR_PHASE119_VIDEO_HOLOGRAM_PANEL";
  panel.position.set(0, 1.58, .12);
  panel.renderOrder = 250;
  group.add(panel);

  const video = document.createElement("video");
  video.src = "/site/assets/video/reiki_hologram.mp4";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.style.display = "none";
  video.volume = .45;
  document.body.appendChild(video);
  const unlock = () => { video.muted = false; video.play().catch(() => {}); };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  video.addEventListener("loadeddata", () => video.play().catch(() => {}));
  video.load();
  const vt = new THREE.VideoTexture(video);
  vt.colorSpace = THREE.SRGBColorSpace;

  const portal = new THREE.Group();
  portal.name = "SVR_PHASE119_ABOUT_PRIVATE_ROOM_PORTAL";
  portal.position.set(0, 0, -2.46);
  root.add(portal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.84, .026, 12, 96), glowMaterial(0x8ffff0, .66));
  ring.position.set(0, 1.52, .04);
  portal.add(ring);
  addPlane(portal, "SVR_PHASE119_ABOUT_PORTAL_BACK", [2.20, 2.78], [0, 1.58, 0], glassMaterial(.13), [0, 0, 0], 95);
  addPlane(portal, "SVR_PHASE119_ABOUT_PORTAL_SIGN", [2.58, .72], [0, 3.25, .08], new THREE.MeshBasicMaterial({ map: makeTexture("ABOUT / PRIVATE ROOM", ["walk here after preview", "tap portal to enter"], { w: 900, h: 300, titleFont: "900 42px system-ui,Arial", lineFont: "800 24px system-ui,Arial", titleY: 80, startY: 158, gap: 40 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  portal.userData.activate = () => { if (gotoScene?.("reikiRoom")) return; window.location.href = "./reiki.html?v=phase119-about-portal"; };

  const camWorld = new THREE.Vector3();
  const panelWorld = new THREE.Vector3();
  group.userData.tick = (t) => {
    if (video.readyState >= 2 && mat.map !== vt) { mat.map = vt; mat.needsUpdate = true; }
    panel.getWorldPosition(panelWorld);
    const cam = scene.userData._camera;
    if (cam?.getWorldPosition) cam.getWorldPosition(camWorld);
    const dist = camWorld.distanceTo(panelWorld);
    video.volume = clamp(dist < 8 ? .50 + ((8 - dist) / 6.7) * .42 : .12, .10, .92);
    beam.material.opacity = .055 + (.5 + .5 * Math.sin(t * .0025)) * .06;
    ring.rotation.z = t * .0008;
  };
  return group;
}

export function applyReikiPhase119OrganizedStorefront(scene, { log = console.log, gotoScene = null } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE119_REIKI_ORGANIZED_LOCK")) return null;
  const removed = purgeReiki(scene);

  const master = new THREE.Group();
  master.name = "SVR_PHASE119_REIKI_ORGANIZED_LOCK";
  scene.add(master);

  const root = new THREE.Group();
  root.name = "SVR_PHASE119_REIKI_STORE_FRONT_REBUILT_ORGANIZED";
  root.position.copy(STORE_CENTER);
  root.lookAt(root.position.clone().add(new THREE.Vector3(-1, 0, 0)));
  master.add(root);

  addStoreShell(root);
  const leftInfo = addLeftInfoBehindGlass(root);
  const rightSymbols = addRightSymbolWall(root);
  const center = addCenterVideoAndPortal(root, scene, gotoScene);

  const oldPanel = document.getElementById("svr-position-panel");
  if (oldPanel) oldPanel.remove();
  const panel = document.createElement("div");
  panel.id = "svr-position-panel";
  panel.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:320px;background:rgba(0,0,0,.74);border:1px solid rgba(140,255,242,.68);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(panel);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    leftInfo?.userData?.tick?.(t);
    center?.userData?.tick?.(t);
    rightSymbols.children.forEach((o, i) => { if (o.material?.opacity && /DISC|GLOW/.test(o.name || "")) o.material.opacity = Math.max(.06, o.material.opacity + Math.sin(t * .002 + i) * .0015); });
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    panel.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nLeft: info behind glass\nRight: glowing symbol wall\nCenter: one small video hologram\nEnd: About/private room portal\nRemoved old Reiki clutter: ${removed}`;
  };

  scene.userData.SVR_PHASE119_REIKI_LOCK = { build: BUILD, removed };
  window.SVR_PHASE119_REIKI_LOCK = scene.userData.SVR_PHASE119_REIKI_LOCK;
  log?.("Phase 119 organized Reiki storefront loaded", scene.userData.SVR_PHASE119_REIKI_LOCK);
  return master;
}
