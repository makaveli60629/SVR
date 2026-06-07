import * as THREE from "three";

const BUILD = "PHASE-116-REIKI-WALKTHROUGH-GLASS-INFO-SYMBOLS-LOCK";
const STORE_CENTER = new THREE.Vector3(19.95, 0, 0);

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1100;
  c.height = opts.h || 560;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(2,8,11,.96)");
  g.addColorStop(.56, opts.bg1 || "rgba(14,4,25,.92)");
  g.addColorStop(1, opts.bg2 || "rgba(2,28,24,.94)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(140,255,242,.88)";
  x.lineWidth = opts.line || 8;
  x.strokeRect(22, 22, c.width - 44, c.height - 44);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.shadow || "rgba(140,255,242,.64)";
  x.shadowBlur = 18;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 54px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 104, c.width - 90);
  x.shadowBlur = 7;
  x.fillStyle = opts.lineColor || "#cafff8";
  x.font = opts.lineFont || "800 29px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 190) + i * (opts.gap || 44), c.width - 100));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function matGlass(opacity = .17) {
  return new THREE.MeshStandardMaterial({ color: 0x9ffff5, transparent: true, opacity, roughness: .04, metalness: .18, emissive: 0x1a8a7d, emissiveIntensity: .25, side: THREE.DoubleSide, depthWrite: false });
}

function matGlow(color = 0x8ffff0, opacity = .45) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}

function addBox(root, name, s, p, m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), m);
  mesh.name = name;
  mesh.position.set(p[0], p[1], p[2]);
  root.add(mesh);
  return mesh;
}

function addPlane(root, name, s, p, m, rot = [0, 0, 0], order = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s[0], s[1]), m);
  mesh.name = name;
  mesh.position.set(p[0], p[1], p[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.renderOrder = order;
  root.add(mesh);
  return mesh;
}

function loadTexture(urls) {
  const tex = new THREE.Texture();
  const loader = new THREE.TextureLoader();
  let i = 0;
  const next = () => {
    if (i >= urls.length) return;
    loader.load(urls[i++], (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      tex.copy(loaded);
      tex.needsUpdate = true;
    }, undefined, next);
  };
  next();
  return tex;
}

function addPlant(root, x, z, scale = .68, label = "") {
  const group = new THREE.Group();
  group.name = `SVR_PHASE116_PLANT_${label}`;
  group.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.16 * scale, .23 * scale, .30 * scale, 24), new THREE.MeshStandardMaterial({ color: 0x431316, roughness: .82 }));
  pot.position.y = .15 * scale;
  group.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f7a40, roughness: .66, emissive: 0x062714, emissiveIntensity: .14, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.085 * scale, 12, 8), leafMat);
    leaf.scale.set(.50, 1.7, .12);
    const a = i / 7 * Math.PI * 2;
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
  group.name = `SVR_PHASE116_POLE_${label}`;
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
  mesh.name = `SVR_PHASE116_ROPE_${label}`;
  mesh.position.set((a.x + b.x) / 2, 1.0, (a.z + b.z) / 2);
  mesh.rotation.y = Math.atan2(b.z - a.z, b.x - a.x);
  root.add(mesh);
  return mesh;
}

function purgeOldReiki(scene) {
  const removeNames = [
    "SVR_PHASE101_REIKI_PRESENTATION_SHOWCASE",
    "SVR_PHASE99_REIKI_PRESENTATION_HOLOGRAMS",
    "SVR_PHASE107_REIKI_STORE_VISIBLE_LOCK",
    "SVR_PHASE110_FINAL_POLISHED_HUB",
    "SVR_PHASE111_FINAL_POLISHED_HUB",
    "SVR_PHASE114_REIKI_DECLUTTER_LOCK",
    "SVR_PHASE114_CLEAN_REIKI_STOREFRONT",
    "SVR_PHASE110_ALIGNED_HOLOGRAMS_AT_POSITION_PANEL_LOCATION",
    "SVR_PHASE111_ALIGNED_HOLOGRAMS_AT_POSITION_PANEL_LOCATION",
    "SVR_PHASE110_REIKI_WALL_SYMBOLS_JAPANESE",
    "SVR_PHASE111_REIKI_WALL_SYMBOLS_JAPANESE"
  ];
  let removed = 0;
  removeNames.forEach((name) => { const obj = scene.getObjectByName(name); if (obj?.parent) { obj.parent.remove(obj); removed++; } });
  const kill = [];
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if (/SVR_PHASE10[1-9]_.*REIKI|SVR_PHASE11[0-4]_.*REIKI|SVR_PHASE11[0-4]_.*Hologram|SVR_PHASE11[0-4]_.*SYMBOL|TRUEITIVE_BANNER|FOUNDER_PRESENTATION|CHAKRA_WALL/i.test(n)) kill.push(obj);
  });
  kill.forEach((obj) => { if (obj.parent) { obj.parent.remove(obj); removed++; } });
  document.querySelectorAll("video").forEach((v) => { const src = String(v.currentSrc || v.src || "").toLowerCase(); if (src.includes("reiki_hologram") || src.includes("hologram")) { try { v.pause(); v.remove(); } catch {} } });
  return removed;
}

function addGlassStore(root) {
  const glass = matGlass(.16);
  const trim = new THREE.MeshStandardMaterial({ color: 0xd2d8dd, metalness: .86, roughness: .20, emissive: 0x1b2d30, emissiveIntensity: .24 });
  const carpet = new THREE.MeshStandardMaterial({ color: 0x940018, roughness: .86, metalness: .02, emissive: 0x2d0008, emissiveIntensity: .22, side: THREE.DoubleSide });
  const W = 13.8, H = 6.25, F = 1.02, B = -2.85, S = W / 2, GAP = 4.85, GW = (W - GAP) / 2;
  const LX = -(GAP / 2 + GW / 2), RX = (GAP / 2 + GW / 2), MID = (F + B) / 2;

  addBox(root, "SVR_PHASE116_TOP_HEADER", [W, .20, .30], [0, H, F], trim);
  addBox(root, "SVR_PHASE116_BOTTOM_TRACK", [W, .075, .22], [0, .34, F], trim);
  addBox(root, "SVR_PHASE116_LEFT_FRAME", [.20, H, .30], [-S, H / 2, F], trim);
  addBox(root, "SVR_PHASE116_RIGHT_FRAME", [.20, H, .30], [S, H / 2, F], trim);
  addBox(root, "SVR_PHASE116_LEFT_ENTRY_POST", [.16, H - .55, .28], [-GAP / 2, H / 2, F], trim);
  addBox(root, "SVR_PHASE116_RIGHT_ENTRY_POST", [.16, H - .55, .28], [GAP / 2, H / 2, F], trim);
  addPlane(root, "SVR_PHASE116_FRONT_GLASS_LEFT", [GW, H - .95], [LX, H / 2 + .08, F + .025], glass, [0, 0, 0], 90);
  addPlane(root, "SVR_PHASE116_FRONT_GLASS_RIGHT", [GW, H - .95], [RX, H / 2 + .08, F + .025], glass.clone(), [0, 0, 0], 90);
  addPlane(root, "SVR_PHASE116_LEFT_SIDE_GLASS", [F - B, H - 1.1], [-S + .04, H / 2 + .08, MID], glass.clone(), [0, Math.PI / 2, 0], 88);
  addPlane(root, "SVR_PHASE116_RIGHT_SIDE_GLASS", [F - B, H - 1.1], [S - .04, H / 2 + .08, MID], glass.clone(), [0, -Math.PI / 2, 0], 88);
  addPlane(root, "SVR_PHASE116_RED_CARPET_WALKTHROUGH", [4.65, 8.9], [0, .02, 3.05], carpet, [-Math.PI / 2, 0, 0], 12);

  const zs = [1.05, 2.2, 3.35, 4.5, 5.65];
  const left = zs.map((z, i) => addPole(root, -2.32, z, `L${i}`));
  const right = zs.map((z, i) => addPole(root, 2.32, z, `R${i}`));
  for (let i = 0; i < zs.length - 1; i++) { addRope(root, left[i], left[i + 1], `L${i}`); addRope(root, right[i], right[i + 1], `R${i}`); }
  [[-5.95, -2.0, "backL"], [5.95, -2.0, "backR"], [-3.0, 5.9, "entryL"], [3.0, 5.9, "entryR"]].forEach(([x, z, label]) => addPlant(root, x, z, .72, label));
  addPlane(root, "SVR_PHASE116_MAIN_SIGN", [4.95, .90], [0, 5.95, F + .08], new THREE.MeshBasicMaterial({ map: makeTexture("REIKI / RIKI STOREFRONT", ["walkthrough presentation", "approval pending"], { w: 1200, h: 320, titleFont: "900 49px system-ui,Arial", lineFont: "800 25px system-ui,Arial", titleY: 88, startY: 172, gap: 42, border: "rgba(255,80,100,.78)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 240);
}

function addLeftGlassInfo(root) {
  const founderTex = loadTexture(["./assets/ui/trueitive-founder.png", "../game/assets/ui/trueitive-founder.png"]);
  const logoTex = loadTexture(["./assets/ui/trueitive-logo.png", "../game/assets/ui/trueitive-logo.png"]);
  const left = new THREE.Group();
  left.name = "SVR_PHASE116_LEFT_INFO_BEHIND_GLASS";
  left.position.set(-3.55, 0, .18);
  left.rotation.y = .08;
  root.add(left);
  const glow = addPlane(left, "SVR_PHASE116_LEFT_INFO_GLOW_BACKDROP", [2.45, 4.4], [0, 2.75, -.06], matGlow(0x8ffff0, .10), [0, 0, 0], 210);
  const logo = addPlane(left, "SVR_PHASE116_LEFT_LOGO_HOLOGRAM", [1.68, .82], [0, 4.48, .04], new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .92 }), [0, 0, 0], 230);
  const founder = addPlane(left, "SVR_PHASE116_LEFT_FOUNDER_INFO", [1.04, 1.46], [0, 3.28, .05], new THREE.MeshBasicMaterial({ map: founderTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .82 }), [0, 0, 0], 230);
  addPlane(left, "SVR_PHASE116_LEFT_ABOUT_TEXT", [2.15, 1.28], [0, 1.72, .06], new THREE.MeshBasicMaterial({ map: makeTexture("ABOUT", ["founder intro", "wellness preview", "approval pending"], { w: 800, h: 420, titleFont: "900 48px system-ui,Arial", lineFont: "800 25px system-ui,Arial", titleY: 85, startY: 168, gap: 48, border: "rgba(145,255,240,.72)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  left.userData.tick = (t) => { glow.material.opacity = .08 + Math.sin(t * .002) * .025; logo.position.y = 4.48 + Math.sin(t * .0018) * .025; founder.position.y = 3.28 + Math.sin(t * .0014 + 1) * .018; };
  return left;
}

function addRightSymbolWall(root) {
  const wall = new THREE.Group();
  wall.name = "SVR_PHASE116_RIGHT_SYMBOL_WALL_GLOWING_BACKGROUND";
  wall.position.set(3.55, 0, -.38);
  wall.rotation.y = -.08;
  root.add(wall);
  addPlane(wall, "SVR_PHASE116_SYMBOL_GLOW_BACKGROUND", [2.65, 4.8], [0, 3.0, -.08], matGlow(0x7b4dff, .13), [0, 0, 0], 210);
  const symbols = [["根",0xff3148],["丹",0xff8a2d],["陽",0xffd447],["心",0x36e875],["声",0x38c9ff],["眼",0x7270ff],["冠",0xd696ff]];
  symbols.forEach(([kanji, color], i) => {
    const y = 4.75 - i * .48;
    const disk = new THREE.Mesh(new THREE.CircleGeometry(.22, 48), matGlow(color, .56));
    disk.name = `SVR_PHASE116_RIGHT_SYMBOL_DISC_${i}`;
    disk.position.set(-.68, y, .04);
    wall.add(disk);
    addPlane(wall, `SVR_PHASE116_RIGHT_SYMBOL_KANJI_${i}`, [.58, .28], [-.05, y, .06], new THREE.MeshBasicMaterial({ map: makeTexture(kanji, [], { w: 300, h: 150, titleFont: "900 66px system-ui,Arial", titleY: 74, border: "rgba(255,255,255,.35)", line: 4 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  });
  addPlane(wall, "SVR_PHASE116_RIGHT_JAPANESE_WRITING", [2.30, .72], [0, 1.12, .06], new THREE.MeshBasicMaterial({ map: makeTexture("霊気 • 癒し", ["調和 • 光 • 平和"], { w: 900, h: 300, titleFont: "900 54px system-ui,Arial", lineFont: "800 25px system-ui,Arial", titleY: 86, startY: 180, border: "rgba(145,255,240,.70)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  wall.userData.tick = (t) => { wall.children.forEach((o, i) => { if (o.material?.opacity) o.material.opacity = Math.max(.08, o.material.opacity + Math.sin(t * .002 + i) * .002); }); };
  return wall;
}

function addVideoAndEndPortal(root) {
  const center = new THREE.Group();
  center.name = "SVR_PHASE116_CENTER_WALKWAY_VIDEO_AND_PORTAL";
  center.position.set(0, 0, -.45);
  root.add(center);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.62, .92, .16, 56), new THREE.MeshStandardMaterial({ color: 0x061315, emissive: 0x0b8178, emissiveIntensity: .38, metalness: .82, roughness: .24 }));
  base.position.y = .56;
  center.add(base);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.18, .68, 2.36, 56, 1, true), matGlow(0x8ffff0, .09));
  beam.position.y = 1.48;
  center.add(beam);
  const mat = new THREE.MeshBasicMaterial({ map: makeTexture("REIKI VIDEO", ["walk down the carpet", "audio starts after tap"], { w: 820, h: 1040, titleY: 170, startY: 305 }), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.94), mat);
  panel.name = "SVR_PHASE116_CENTER_VIDEO_HOLOGRAM";
  panel.position.set(0, 1.68, .13);
  panel.renderOrder = 250;
  center.add(panel);
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
  const camWorld = new THREE.Vector3(), meshWorld = new THREE.Vector3();

  const portal = new THREE.Group();
  portal.name = "SVR_PHASE116_ABOUT_PORTAL_END_OF_CARPET";
  portal.position.set(0, 0, -2.24);
  root.add(portal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.86, .026, 12, 96), matGlow(0x8ffff0, .68));
  ring.position.set(0, 1.54, .04);
  portal.add(ring);
  addPlane(portal, "SVR_PHASE116_ABOUT_PORTAL_BACK", [2.28, 2.88], [0, 1.62, 0], matGlass(.14), [0, 0, 0], 95);
  addPlane(portal, "SVR_PHASE116_ABOUT_PORTAL_SIGN", [2.58, .74], [0, 3.32, .08], new THREE.MeshBasicMaterial({ map: makeTexture("ABOUT / PRIVATE ROOM", ["walk here after preview", "tap portal to enter"], { w: 900, h: 300, titleFont: "900 42px system-ui,Arial", lineFont: "800 24px system-ui,Arial", titleY: 80, startY: 158, gap: 40 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  portal.userData.activate = () => { window.location.href = "./reiki.html?v=phase116-about-portal"; };

  center.userData.tick = (t) => {
    if (video.readyState >= 2 && mat.map !== vt) { mat.map = vt; mat.needsUpdate = true; }
    panel.getWorldPosition(meshWorld);
    const cam = window?.SVR_CAMERA || null;
    if (root.parent?.userData?._camera?.getWorldPosition) root.parent.userData._camera.getWorldPosition(camWorld);
    const dist = camWorld.distanceTo(meshWorld);
    video.volume = clamp(dist < 8 ? .50 + ((8 - dist) / 6.7) * .42 : .12, .10, .92);
    beam.material.opacity = .06 + (.5 + .5 * Math.sin(t * .0025)) * .07;
    ring.rotation.z = t * .0008;
  };
  return { center, portal };
}

export function applyReikiPhase116Walkthrough(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE116_REIKI_WALKTHROUGH_LOCK")) return null;
  const removed = purgeOldReiki(scene);
  const master = new THREE.Group();
  master.name = "SVR_PHASE116_REIKI_WALKTHROUGH_LOCK";
  scene.add(master);

  const root = new THREE.Group();
  root.name = "SVR_PHASE116_REIKI_STORE_FRONT_REBUILT";
  root.position.copy(STORE_CENTER);
  root.lookAt(root.position.clone().add(new THREE.Vector3(-1, 0, 0)));
  scene.add(root);
  master.add(root);

  addGlassStore(root);
  const leftInfo = addLeftGlassInfo(root);
  const rightSymbols = addRightSymbolWall(root);
  const center = addVideoAndEndPortal(root);

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
    rightSymbols?.userData?.tick?.(t);
    center?.center?.userData?.tick?.(t);
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    panel.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nLeft: hologram info behind glass\nRight: glowing Japanese/symbol wall\nEnd: About/private room portal\nRemoved old Reiki clutter: ${removed}`;
  };

  scene.userData.SVR_PHASE116_REIKI_LOCK = { build: BUILD, removed };
  window.SVR_PHASE116_REIKI_LOCK = scene.userData.SVR_PHASE116_REIKI_LOCK;
  log?.("Phase 116 Reiki walkthrough storefront loaded", scene.userData.SVR_PHASE116_REIKI_LOCK);
  return master;
}
